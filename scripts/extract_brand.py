#!/usr/bin/env python3
"""
Design Extractor — End-to-End Brand Extraction Orchestrator

Runs the complete extraction pipeline from a single command:
    python3 scripts/extract_brand.py --url https://example.com

Phases:
  0. Setup directories
  1. Verify URL is reachable
  2. Identify 5+ pages via nav link extraction
  3. Extract DOM content + measurements from each page
  4. Download assets (images, fonts, SVGs, CSS backgrounds)
  5. Build React/shadcn replicas via claude --print
  6. Validate replicas via screenshot comparison
  7. Publish design tokens, DESIGN.md, SKILL.md
  8. Register brand in the library index
  9. Final verification of all artifacts
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

# ── Constants ─────────────────────────────────────────────────────────────

LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
CACHE_ROOT = LIBRARY_ROOT / "cache"
BRANDS_ROOT = LIBRARY_ROOT / "brands"
PLUGIN_DIR = Path(__file__).resolve().parent.parent  # design-extractor repo root
UI_DIR = PLUGIN_DIR / "ui"
SCRIPTS_DIR = PLUGIN_DIR / "scripts"

MIN_PAGES = 5
AGENT_BROWSER = "agent-browser"
DOM_EXTRACT_TIMEOUT = 45
SCREENSHOT_TIMEOUT = 20
CLAUDE_TIMEOUT = 900  # 15 min for replica generation


# ── Helpers ───────────────────────────────────────────────────────────────

def derive_slug(url: str) -> str:
    """https://www.example.com.au -> example-com-au"""
    parsed = urlparse(url)
    host = parsed.netloc
    if not host:
        host = parsed.path.split("/")[0]
    host = re.sub(r"^www\.", "", host)
    return host.replace(".", "-")


def run_cmd(
    cmd: list[str],
    *,
    timeout: int = 60,
    capture: bool = True,
    cwd: str | Path | None = None,
    check: bool = False,
) -> subprocess.CompletedProcess:
    """Run a subprocess with timeout. Returns CompletedProcess."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=capture,
            text=True,
            timeout=timeout,
            cwd=cwd,
        )
        if check and result.returncode != 0:
            stderr = (result.stderr or "").strip()
            raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(cmd)}\n{stderr}")
        return result
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Command timed out after {timeout}s: {' '.join(cmd)}")
    except FileNotFoundError:
        raise RuntimeError(f"Command not found: {cmd[0]}")


def agent_browser_cmd(args: list[str], session: str, headed: bool = False) -> list[str]:
    """Build an agent-browser command list."""
    cmd = [AGENT_BROWSER] + args + ["--session", session]
    if headed:
        cmd.append("--headed")
    return cmd


def step(phase: str, message: str) -> None:
    """Print a step header."""
    print(f"\n{'='*60}")
    print(f"  [{phase}] {message}")
    print(f"{'='*60}")


def info(msg: str) -> None:
    print(f"  {msg}")


def fail(msg: str) -> None:
    print(f"\n  FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def assert_exists(path: Path, description: str) -> None:
    if not path.exists():
        fail(f"{description} not found: {path}")


# ── Phase 0: Setup ───────────────────────────────────────────────────────

def setup_directories(slug: str) -> dict[str, Path]:
    """Create all required directories. Returns a dict of key paths."""
    cache_dir = CACHE_ROOT / slug
    brands_dir = BRANDS_ROOT / slug
    public_dir = UI_DIR / "public" / "brands" / slug
    components_dir = UI_DIR / "components" / "brands" / slug
    replica_dir = UI_DIR / "app" / "brands" / slug / "replica"

    dirs = {
        "cache": cache_dir,
        "brands": brands_dir,
        "dom_extraction": cache_dir / "dom-extraction",
        "screenshots_ref": cache_dir / "screenshots" / "reference",
        "screenshots_cmp": cache_dir / "screenshots" / "comparison",
        "screenshots_harness": cache_dir / "screenshots" / "harness",
        "assets_cache": cache_dir / "assets",
        "validation": cache_dir / "validation",
        "public": public_dir,
        "public_fonts": public_dir / "fonts",
        "public_social": public_dir / "social",
        "components": components_dir,
        "replica": replica_dir,
        "brands_validation": brands_dir / "validation",
        "brands_skill": brands_dir / "skill",
    }

    for name, d in dirs.items():
        d.mkdir(parents=True, exist_ok=True)

    return dirs


# ── Phase 1: Verify URL ──────────────────────────────────────────────────

def verify_url(url: str, headed: bool) -> str:
    """Open the URL in agent-browser and verify it loads. Returns page title."""
    step("Phase 1", f"Verifying URL: {url}")

    session = "verify"
    cmd_open = agent_browser_cmd(["open", url], session=session, headed=headed)
    run_cmd(cmd_open, timeout=30, check=True)

    # Wait for page to settle
    run_cmd(
        agent_browser_cmd(["wait", "--load", "networkidle"], session=session),
        timeout=20,
    )

    # Extract title
    result = run_cmd(
        agent_browser_cmd(
            ["eval", "document.title"],
            session=session,
        ),
        timeout=10,
    )
    title = (result.stdout or "").strip()

    if not title or "404" in title.lower() or "not found" in title.lower():
        fail(f"URL appears invalid. Page title: '{title}'")

    info(f"Page title: {title}")
    return title


# ── Phase 2: Identify Pages ──────────────────────────────────────────────

def identify_pages(url: str, headed: bool) -> dict[str, dict]:
    """Extract nav links and classify into page types. Returns pages dict."""
    step("Phase 2", "Identifying pages via nav link extraction")

    session = "recon"
    cmd_open = agent_browser_cmd(["open", url], session=session, headed=headed)
    run_cmd(cmd_open, timeout=30, check=True)
    run_cmd(
        agent_browser_cmd(["wait", "--load", "networkidle"], session=session),
        timeout=20,
    )

    # Extract all internal links from nav/header elements
    js_extract = """JSON.stringify((() => {
        const domain = window.location.hostname;
        const base = window.location.origin;
        const links = new Map();

        // Collect from nav, header, and main navigation areas
        const selectors = [
            'nav a[href]', 'header a[href]', '[role="navigation"] a[href]',
            '[class*="nav"] a[href]', '[class*="menu"] a[href]',
            'footer a[href]'
        ];

        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(a => {
                try {
                    const href = new URL(a.href, base);
                    if (href.hostname !== domain) return;
                    const path = href.pathname.replace(/\\/$/, '') || '/';
                    if (path === '#' || href.hash) return;
                    if (/\\.(pdf|jpg|png|svg|zip|xml|json)$/i.test(path)) return;
                    if (!links.has(path)) {
                        links.set(path, {
                            url: href.origin + href.pathname,
                            text: a.textContent.trim().substring(0, 80),
                            source: sel.split(' ')[0]
                        });
                    }
                } catch(e) {}
            });
        });

        return Array.from(links.entries()).map(([path, data]) => ({
            path: path,
            url: data.url,
            text: data.text,
            source: data.source
        }));
    })())"""

    result = run_cmd(
        agent_browser_cmd(["eval", js_extract], session=session),
        timeout=15,
    )

    raw_links = []
    stdout = (result.stdout or "").strip()
    if stdout:
        try:
            raw_links = json.loads(stdout)
        except json.JSONDecodeError:
            info(f"Warning: Could not parse nav links. Raw output: {stdout[:200]}")

    info(f"Found {len(raw_links)} internal links")

    # Classify links into page types
    classified = _classify_links(raw_links, url)

    # Build the pages dict matching the format run_validation_loop.py expects
    parsed = urlparse(url)
    base_origin = f"{parsed.scheme}://{parsed.netloc}"
    slug = derive_slug(url)

    pages: dict[str, dict] = {
        "homepage": {
            "original_url": url.rstrip("/") + "/",
            "replica_route": f"/brands/{slug}/replica",
        }
    }

    # Pick best pages from each category, aiming for MIN_PAGES total
    categories_priority = ["about", "product", "contact", "content", "careers", "pricing", "docs", "legal", "other"]
    used_paths = {"/"}

    for cat in categories_priority:
        if len(pages) >= MIN_PAGES:
            break
        for link in classified.get(cat, []):
            if link["path"] in used_paths:
                continue
            page_slug = _path_to_slug(link["path"])
            if not page_slug or page_slug == "homepage":
                continue
            pages[page_slug] = {
                "original_url": link["url"],
                "replica_route": f"/brands/{slug}/replica/{page_slug}",
            }
            used_paths.add(link["path"])
            break

    # If still under MIN_PAGES, grab any remaining links
    if len(pages) < MIN_PAGES:
        for link in raw_links:
            if len(pages) >= MIN_PAGES:
                break
            path = link.get("path", "")
            if path in used_paths or path == "/":
                continue
            page_slug = _path_to_slug(path)
            if not page_slug or page_slug in pages:
                continue
            pages[page_slug] = {
                "original_url": link["url"],
                "replica_route": f"/brands/{slug}/replica/{page_slug}",
            }
            used_paths.add(path)

    info(f"Selected {len(pages)} pages:")
    for name, config in pages.items():
        info(f"  {name}: {config['original_url']}")

    if len(pages) < 2:
        fail(f"Only found {len(pages)} page(s). Need at least 2 for meaningful extraction.")

    return pages


def _classify_links(links: list[dict], base_url: str) -> dict[str, list]:
    """Classify links into page type buckets."""
    categories: dict[str, list] = {}
    keywords = {
        "about": ["about", "who-we-are", "our-story", "company", "team"],
        "product": ["product", "service", "solution", "feature", "offering", "personal-banking", "business"],
        "contact": ["contact", "get-in-touch", "support", "help"],
        "content": ["blog", "news", "article", "insight", "perspective", "media", "resource"],
        "careers": ["career", "job", "work-with-us", "join"],
        "pricing": ["pricing", "plan", "package"],
        "docs": ["doc", "api", "developer", "guide"],
        "legal": ["privacy", "terms", "legal", "disclaimer"],
    }

    for link in links:
        path = link.get("path", "").lower()
        text = link.get("text", "").lower()
        matched = False
        for cat, kws in keywords.items():
            if any(kw in path or kw in text for kw in kws):
                categories.setdefault(cat, []).append(link)
                matched = True
                break
        if not matched and path != "/":
            categories.setdefault("other", []).append(link)

    return categories


def _path_to_slug(path: str) -> str:
    """Convert a URL path to a slug for file naming."""
    path = path.strip("/")
    if not path:
        return ""
    # Take last meaningful segment
    parts = [p for p in path.split("/") if p and not re.match(r"^(au|en|shop)$", p, re.I)]
    if not parts:
        return ""
    slug = parts[-1]
    # Clean up
    slug = re.sub(r"\.(html?|aspx?|php|jsp)$", "", slug, flags=re.I)
    slug = re.sub(r"[^a-zA-Z0-9-]", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-").lower()
    return slug[:50]  # Cap length


def write_pages_json(slug: str, pages: dict) -> Path:
    """Write pages.json to cache/validation/."""
    pages_path = CACHE_ROOT / slug / "validation" / "pages.json"
    pages_path.parent.mkdir(parents=True, exist_ok=True)
    with open(pages_path, "w") as f:
        json.dump(pages, f, indent=2)
    info(f"Wrote {pages_path}")
    return pages_path


# ── Phase 3: Extract DOM ─────────────────────────────────────────────────

def extract_dom(page_slug: str, page_url: str, slug: str, dirs: dict, headed: bool, skip_existing: bool) -> None:
    """Extract DOM content and measurements from a single page."""
    dom_dir = dirs["dom_extraction"]
    dom_json_path = dom_dir / f"{page_slug}.json"
    measurements_path = dom_dir / f"{page_slug}-measurements.json"
    screenshot_path = dom_dir / f"{page_slug}-screenshot.png"

    if skip_existing and dom_json_path.exists() and measurements_path.exists():
        info(f"  {page_slug}: skipped (exists)")
        return

    session = f"dom-{slug}-{page_slug}"
    info(f"  {page_slug}: opening {page_url}")

    # Open page
    run_cmd(
        agent_browser_cmd(["open", page_url], session=session, headed=headed),
        timeout=30,
        check=True,
    )
    run_cmd(
        agent_browser_cmd(["wait", "--load", "networkidle"], session=session),
        timeout=20,
    )

    # Take reference screenshot
    run_cmd(
        agent_browser_cmd(["screenshot", str(screenshot_path), "--full"], session=session),
        timeout=SCREENSHOT_TIMEOUT,
    )

    # Also save to reference screenshots dir
    ref_path = dirs["screenshots_ref"] / f"{page_slug}.png"
    if screenshot_path.exists():
        shutil.copy2(screenshot_path, ref_path)

    # Extract DOM content
    js_dom = """JSON.stringify((() => {
        const sections = [];
        const allSections = document.querySelectorAll('header, nav, main, section, footer, [role="main"], [role="banner"], [role="contentinfo"], article, .hero, [class*="hero"]');

        allSections.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            if (rect.height === 0) return;
            const section = {
                tag: el.tagName.toLowerCase(),
                role: el.getAttribute('role') || '',
                className: el.className?.toString?.()?.substring(0, 200) || '',
                headings: [],
                text: [],
                links: [],
                images: [],
                backgroundImages: []
            };

            el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
                section.headings.push({
                    level: h.tagName.toLowerCase(),
                    text: h.textContent.trim().substring(0, 200)
                });
            });

            el.querySelectorAll('p, li, span, div').forEach(t => {
                const text = t.textContent.trim();
                if (text.length > 10 && text.length < 500 && t.children.length < 3) {
                    section.text.push(text.substring(0, 300));
                }
            });
            section.text = section.text.slice(0, 20);

            el.querySelectorAll('a[href]').forEach(a => {
                section.links.push({
                    text: a.textContent.trim().substring(0, 100),
                    href: a.href
                });
            });
            section.links = section.links.slice(0, 30);

            el.querySelectorAll('img[src]').forEach(img => {
                section.images.push({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            });

            const cs = getComputedStyle(el);
            const bgImg = cs.backgroundImage;
            if (bgImg && bgImg !== 'none') {
                const urls = bgImg.match(/url\\(["']?([^"')]+)["']?\\)/g);
                if (urls) {
                    urls.forEach(u => {
                        const clean = u.replace(/url\\(["']?/, '').replace(/["']?\\)/, '');
                        section.backgroundImages.push(clean);
                    });
                }
            }

            sections.push(section);
        });

        return { url: window.location.href, title: document.title, sections: sections };
    })())"""

    result = run_cmd(
        agent_browser_cmd(["eval", js_dom], session=session),
        timeout=DOM_EXTRACT_TIMEOUT,
    )

    dom_data = {}
    stdout = (result.stdout or "").strip()
    if stdout:
        try:
            dom_data = json.loads(stdout)
        except json.JSONDecodeError:
            info(f"  Warning: Could not parse DOM extraction for {page_slug}")
            dom_data = {"url": page_url, "title": "", "sections": [], "parse_error": True}

    with open(dom_json_path, "w") as f:
        json.dump(dom_data, f, indent=2)

    # Extract measurements
    js_measurements = """JSON.stringify((() => {
        const cs = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el) : null; };
        const rect = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect() : null; };
        const body = cs('body');
        const header = rect('header') || rect('nav') || rect('[role="banner"]');
        const hero = rect('.hero, [class*="hero"], main > section:first-child, main > div:first-child');
        const footer = rect('footer') || rect('[role="contentinfo"]');

        const colors = {};
        const uniqueTextColors = new Set();
        const uniqueBgColors = new Set();

        document.querySelectorAll('h1, h2, h3, p, a, button, span').forEach(el => {
            const s = getComputedStyle(el);
            uniqueTextColors.add(s.color);
            if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') uniqueBgColors.add(s.backgroundColor);
        });

        const headerEl = document.querySelector('header') || document.querySelector('[role="banner"]');
        if (headerEl) {
            const hs = getComputedStyle(headerEl);
            colors.headerBg = hs.backgroundColor;
        }

        const footerEl = document.querySelector('footer') || document.querySelector('[role="contentinfo"]');
        if (footerEl) {
            const fs = getComputedStyle(footerEl);
            colors.footerDark = fs.backgroundColor;
        }

        const typography = {};
        ['h1', 'h2', 'h3', 'p', 'a'].forEach(tag => {
            const el = document.querySelector(tag);
            if (el) {
                const s = getComputedStyle(el);
                typography[tag] = {
                    fontSize: s.fontSize,
                    fontWeight: s.fontWeight,
                    lineHeight: s.lineHeight,
                    fontFamily: s.fontFamily,
                    color: s.color
                };
            }
        });

        const fontFamilies = {};
        if (body) fontFamilies.body = body.fontFamily;
        const h1 = cs('h1');
        if (h1) fontFamilies.heading = h1.fontFamily;

        return {
            colors: colors,
            uniqueTextColors: Array.from(uniqueTextColors),
            uniqueBackgroundColors: Array.from(uniqueBgColors),
            typography: typography,
            fontFamilies: fontFamilies,
            header: header ? { height: Math.round(header.height), width: Math.round(header.width) } : {},
            hero: hero ? { height: Math.round(hero.height), width: Math.round(hero.width) } : {},
            footer: footer ? { height: Math.round(footer.height), backgroundColor: footerEl ? getComputedStyle(footerEl).backgroundColor : '' } : {},
            layout: {
                contentMaxWidth: body ? parseInt(body.maxWidth) || 1200 : 1200,
                contentPaddingLeft: body ? parseInt(body.paddingLeft) || 0 : 0
            }
        };
    })())"""

    result = run_cmd(
        agent_browser_cmd(["eval", js_measurements], session=session),
        timeout=DOM_EXTRACT_TIMEOUT,
    )

    measurements = {}
    stdout = (result.stdout or "").strip()
    if stdout:
        try:
            measurements = json.loads(stdout)
        except json.JSONDecodeError:
            measurements = {"parse_error": True}

    with open(measurements_path, "w") as f:
        json.dump(measurements, f, indent=2)

    info(f"  {page_slug}: DOM ({len(dom_data.get('sections', []))} sections) + measurements saved")
    assert_exists(dom_json_path, f"DOM extraction for {page_slug}")


# ── Phase 4: Download Assets ─────────────────────────────────────────────

def download_assets(slug: str, pages: dict, dirs: dict, headed: bool) -> int:
    """Download images, fonts, SVGs, and CSS background images from DOM extraction data."""
    step("Phase 4", "Downloading assets")

    dom_dir = dirs["dom_extraction"]
    public_dir = dirs["public"]
    downloaded = 0

    # Collect all asset URLs from DOM extractions
    image_urls: set[str] = set()
    bg_image_urls: set[str] = set()

    for page_slug in pages:
        dom_path = dom_dir / f"{page_slug}.json"
        if not dom_path.exists():
            continue
        with open(dom_path) as f:
            dom = json.load(f)

        for section in dom.get("sections", []):
            for img in section.get("images", []):
                src = img.get("src", "")
                if src and not src.startswith("data:"):
                    image_urls.add(src)
            for bg in section.get("backgroundImages", []):
                if bg and not bg.startswith("data:"):
                    bg_image_urls.add(bg)

    all_urls = list(image_urls | bg_image_urls)
    info(f"Found {len(image_urls)} images + {len(bg_image_urls)} background images = {len(all_urls)} total")

    for url_str in all_urls:
        try:
            parsed = urlparse(url_str)
            filename = Path(parsed.path).name
            if not filename or len(filename) > 100:
                filename = f"asset-{downloaded}.bin"
            # Sanitize filename
            filename = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
            dest = public_dir / filename

            if dest.exists():
                downloaded += 1
                continue

            urllib.request.urlretrieve(url_str, str(dest))

            # Verify the download is an actual asset, not an HTML error page
            result = run_cmd(["file", "--brief", str(dest)], timeout=5)
            file_type = (result.stdout or "").strip().lower()
            if "html" in file_type and not filename.endswith(".svg"):
                dest.unlink()
                info(f"  Removed HTML error page: {filename}")
                continue

            downloaded += 1
        except Exception as e:
            info(f"  Failed to download {url_str[:80]}: {e}")

    # Extract and download fonts from the first page using agent-browser
    first_page_url = list(pages.values())[0]["original_url"]
    session = f"assets-{slug}"
    try:
        run_cmd(
            agent_browser_cmd(["open", first_page_url], session=session, headed=headed),
            timeout=30,
        )
        run_cmd(
            agent_browser_cmd(["wait", "--load", "networkidle"], session=session),
            timeout=20,
        )

        js_fonts = """JSON.stringify((() => {
            const fonts = [];
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule instanceof CSSFontFaceRule) {
                            const src = rule.style.getPropertyValue('src');
                            const family = rule.style.getPropertyValue('font-family');
                            const urls = src.match(/url\\(["']?([^"')]+)["']?\\)/g);
                            if (urls) {
                                urls.forEach(u => {
                                    const clean = u.replace(/url\\(["']?/, '').replace(/["']?\\)/, '');
                                    fonts.push({ family: family, url: clean });
                                });
                            }
                        }
                    }
                } catch(e) {}
            }
            return fonts;
        })())"""

        result = run_cmd(
            agent_browser_cmd(["eval", js_fonts], session=session),
            timeout=15,
        )
        stdout = (result.stdout or "").strip()
        if stdout:
            try:
                font_list = json.loads(stdout)
                for font in font_list:
                    font_url = font.get("url", "")
                    if not font_url:
                        continue
                    parsed = urlparse(font_url)
                    fname = Path(parsed.path).name
                    if not fname:
                        continue
                    fname = re.sub(r"[^a-zA-Z0-9._-]", "_", fname)
                    dest = dirs["public_fonts"] / fname
                    if dest.exists():
                        continue
                    try:
                        urllib.request.urlretrieve(font_url, str(dest))
                        downloaded += 1
                    except Exception:
                        pass
            except json.JSONDecodeError:
                pass
    except RuntimeError:
        info("  Font extraction failed (non-fatal)")

    info(f"Downloaded {downloaded} assets to {public_dir}")
    return downloaded


# ── Phase 5: Build Replicas ──────────────────────────────────────────────

def build_replicas(slug: str, url: str, pages: dict, dirs: dict) -> None:
    """Call claude --print to generate React/shadcn replicas from DOM extraction data."""
    step("Phase 5", "Building React/shadcn replicas via Claude")

    page_list = []
    for page_slug, config in pages.items():
        page_list.append({
            "slug": page_slug,
            "original_url": config["original_url"],
            "replica_route": config["replica_route"],
        })

    prompt = f"""Build React/shadcn replica components for {url}.

Brand slug: {slug}
Pages to build: {json.dumps(page_list, indent=2)}

Read the DOM extraction files at {dirs['dom_extraction']}
Read the measurement files at {dirs['dom_extraction']} (files ending in -measurements.json)
Images are available at /brands/{slug}/ (relative to public dir)
Font files are at /brands/{slug}/fonts/

Create these files:
1. {dirs['components']}/ -- shared header, footer, logo components (e.g. {slug}-header.tsx, {slug}-footer.tsx)
2. {dirs['replica']}/page.tsx -- homepage replica
3. {dirs['replica']}/layout.tsx -- layout that hides Design Library chrome (full-width, no sidebar)
4. For each inner page: {dirs['replica']}/{{page-slug}}/page.tsx

Rules:
- Use shadcn/ui components (Card, Button, Separator, Badge, NavigationMenu)
- Use Lucide React icons only (never emoji characters)
- Import actual downloaded images from /brands/{slug}/ paths
- Extract ALL content from the DOM JSON files -- every section heading, every paragraph, every image
- Do NOT fabricate or invent text content. Use only what exists in the DOM JSON
- Use Tailwind CSS for all styling
- Match colors, fonts, and spacing from the measurement JSON files
- Each page.tsx must be a valid Next.js page component (export default function)
- The layout.tsx should be minimal -- just render children with no extra chrome

The UI project is a Next.js app at {UI_DIR}.
Components directory is {UI_DIR}/components.
"""

    info("Calling claude --print for replica generation...")
    info("(This may take several minutes)")

    result = run_cmd(
        [
            "claude", "--print",
            "-p", prompt,
            "--permission-mode", "bypassPermissions",
            "--allowedTools", "Read,Write,Edit,Bash,Glob,Grep",
        ],
        timeout=CLAUDE_TIMEOUT,
        check=False,
    )

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        info(f"Claude exited with code {result.returncode}")
        if stderr:
            info(f"stderr: {stderr[:500]}")
        # Non-fatal: check if files were created anyway


def verify_replicas(slug: str, pages: dict, dirs: dict) -> None:
    """Verify all expected replica files exist."""
    step("Phase 5b", "Verifying replica files")

    replica_dir = dirs["replica"]
    components_dir = dirs["components"]

    # Check homepage
    homepage_tsx = replica_dir / "page.tsx"
    if not homepage_tsx.exists():
        fail(f"Missing homepage replica: {homepage_tsx}")
    info(f"  homepage/page.tsx: exists ({homepage_tsx.stat().st_size} bytes)")

    # Check layout
    layout_tsx = replica_dir / "layout.tsx"
    if not layout_tsx.exists():
        info("  Warning: layout.tsx missing (will use parent layout)")
    else:
        info(f"  layout.tsx: exists ({layout_tsx.stat().st_size} bytes)")

    # Check inner pages
    for page_slug in pages:
        if page_slug == "homepage":
            continue
        page_tsx = replica_dir / page_slug / "page.tsx"
        if not page_tsx.exists():
            info(f"  Warning: missing {page_slug}/page.tsx")
        else:
            info(f"  {page_slug}/page.tsx: exists ({page_tsx.stat().st_size} bytes)")

    # Check shared components
    component_files = list(components_dir.glob("*.tsx"))
    info(f"  Shared components: {len(component_files)} files")
    for cf in component_files:
        info(f"    {cf.name} ({cf.stat().st_size} bytes)")

    # TypeScript compile check (non-fatal)
    info("  Running TypeScript check...")
    result = run_cmd(
        ["npx", "tsc", "--noEmit"],
        timeout=120,
        cwd=str(UI_DIR),
        check=False,
    )
    if result.returncode == 0:
        info("  TypeScript: passed")
    else:
        errors = (result.stdout or "").strip()
        error_count = errors.count("error TS")
        info(f"  TypeScript: {error_count} errors (non-fatal, replicas may still render)")


# ── Phase 6: Validate ────────────────────────────────────────────────────

def run_validation(slug: str) -> float:
    """Run the validation harness. Returns average score."""
    step("Phase 6", "Running screenshot validation")

    validation_script = SCRIPTS_DIR / "run_validation_loop.py"
    if not validation_script.exists():
        info("Warning: run_validation_loop.py not found, skipping validation")
        return 0.0

    result = run_cmd(
        [
            sys.executable, str(validation_script),
            "--brand", slug,
            "--base-url", "http://localhost:5173",
            "--target", "80",
            "--skip-originals",
        ],
        timeout=300,
        check=False,
    )

    output = (result.stdout or "")
    print(output)

    # Parse average score from output
    for line in output.split("\n"):
        if "AVERAGE" in line:
            match = re.search(r"(\d+\.\d+)%", line)
            if match:
                return float(match.group(1))

    return 0.0


# ── Phase 7: Publish ─────────────────────────────────────────────────────

def publish(slug: str) -> None:
    """Run the publish pipeline to generate design tokens, DESIGN.md, SKILL.md."""
    step("Phase 7", "Publishing brand artifacts")

    publish_script = SCRIPTS_DIR / "publish_brand.py"
    if not publish_script.exists():
        info("Warning: publish_brand.py not found, skipping publish")
        return

    result = run_cmd(
        [sys.executable, str(publish_script), "--brand", slug],
        timeout=120,
        check=False,
    )
    print(result.stdout or "")
    if result.returncode != 0:
        info(f"Warning: publish exited with code {result.returncode}")


# ── Phase 8: Register ────────────────────────────────────────────────────

def register_in_library(slug: str, url: str, title: str) -> None:
    """Register the brand in the library index."""
    step("Phase 8", "Registering in design library")

    brands_dir = BRANDS_ROOT / slug
    meta_path = brands_dir / "metadata.json"

    # Read or create metadata
    metadata = {}
    if meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)

    # Ensure required fields
    metadata.setdefault("name", title or slug.replace("-", " ").title())
    metadata.setdefault("slug", slug)
    metadata.setdefault("source_url", url)
    metadata.setdefault("extracted_at", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    metadata.setdefault("extractor_version", "0.3.0")
    metadata.setdefault("confidence", "MEDIUM")
    metadata.setdefault("categories", [])
    metadata.setdefault("synthetic", False)
    metadata.setdefault("replica_type", "react_shadcn")

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    # Use the update_library_index script
    index_script = SCRIPTS_DIR / "update_library_index.py"
    if index_script.exists():
        result = run_cmd(
            [sys.executable, str(index_script), "--add", slug, "--metadata", str(meta_path)],
            timeout=30,
            check=False,
        )
        print(result.stdout or "")
    else:
        # Manual index update as fallback
        index_path = LIBRARY_ROOT / "index.json"
        index = {"version": "0.1.0", "updated_at": "", "brands": []}
        if index_path.exists():
            with open(index_path) as f:
                index = json.load(f)

        index["brands"] = [b for b in index.get("brands", []) if b.get("slug") != slug]
        index["brands"].append({
            "slug": slug,
            "name": metadata["name"],
            "source_url": url,
            "extracted_at": metadata["extracted_at"],
            "extractor_version": metadata["extractor_version"],
            "overall_score": metadata.get("overall_score"),
            "confidence": metadata["confidence"],
            "categories": metadata["categories"],
            "synthetic": False,
            "path": str(brands_dir),
        })
        index["brands"].sort(key=lambda b: b["slug"])
        index["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        with open(index_path, "w") as f:
            json.dump(index, f, indent=2)
            f.write("\n")

    info(f"Registered {slug} in library index")


# ── Phase 9: Final Verification ──────────────────────────────────────────

def final_verification(slug: str, pages: dict, asset_count: int, score: float) -> None:
    """Verify all expected artifacts exist and print summary."""
    step("Phase 9", "Final verification")

    brands_dir = BRANDS_ROOT / slug
    cache_dir = CACHE_ROOT / slug
    public_dir = UI_DIR / "public" / "brands" / slug
    components_dir = UI_DIR / "components" / "brands" / slug
    replica_dir = UI_DIR / "app" / "brands" / slug / "replica"

    checks = {
        "design-tokens.json": brands_dir / "design-tokens.json",
        "DESIGN.md": brands_dir / "DESIGN.md",
        "skill/SKILL.md": brands_dir / "skill" / "SKILL.md",
        "metadata.json": brands_dir / "metadata.json",
        "pages.json": cache_dir / "validation" / "pages.json",
        "replica/page.tsx": replica_dir / "page.tsx",
    }

    passed = 0
    failed_checks = []

    for name, path in checks.items():
        if path.exists():
            info(f"  {name}: OK")
            passed += 1
        else:
            info(f"  {name}: MISSING")
            failed_checks.append(name)

    # Check public assets count
    public_files = list(public_dir.rglob("*"))
    public_file_count = len([f for f in public_files if f.is_file()])
    if public_file_count >= 5:
        info(f"  public/brands/{slug}/: {public_file_count} files OK")
        passed += 1
    else:
        info(f"  public/brands/{slug}/: {public_file_count} files (expected 5+)")
        failed_checks.append(f"public assets ({public_file_count} files)")

    # Check shared components
    component_count = len(list(components_dir.glob("*.tsx")))
    if component_count >= 1:
        info(f"  components/brands/{slug}/: {component_count} components OK")
        passed += 1
    else:
        info(f"  components/brands/{slug}/: {component_count} components (expected 1+)")
        failed_checks.append("shared components")

    # Check library index
    index_path = LIBRARY_ROOT / "index.json"
    in_index = False
    if index_path.exists():
        with open(index_path) as f:
            idx = json.load(f)
        in_index = any(b.get("slug") == slug for b in idx.get("brands", []))
    if in_index:
        info(f"  Library index: registered")
        passed += 1
    else:
        info(f"  Library index: NOT registered")
        failed_checks.append("library index")

    total_checks = len(checks) + 3  # +3 for public, components, index

    # Read brand name from metadata
    brand_name = slug.replace("-", " ").title()
    meta_path = brands_dir / "metadata.json"
    if meta_path.exists():
        with open(meta_path) as f:
            meta = json.load(f)
        brand_name = meta.get("name", brand_name)

    pages_extracted = len(list((cache_dir / "dom-extraction").glob("*.json"))) // 2  # exclude measurements
    pages_replicated = 1 + len(list(replica_dir.glob("*/page.tsx")))  # homepage + inner pages

    print(f"\n{'='*60}")
    if not failed_checks:
        print(f"  Extraction complete: {brand_name}")
    else:
        print(f"  Extraction complete (with warnings): {brand_name}")
    print(f"  Pages: {pages_extracted} extracted, {pages_replicated} replicated")
    print(f"  Assets: {asset_count} files")
    print(f"  Score: {score:.1f}%")
    print(f"  Library: {'registered' if in_index else 'NOT registered'}")
    print(f"  Checks: {passed}/{total_checks} passed")
    if failed_checks:
        print(f"  Missing: {', '.join(failed_checks)}")
    print(f"  URL: http://localhost:5173/brands/{slug}")
    print(f"{'='*60}")


# ── Main ──────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract a complete design system from a URL end-to-end.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Example:\n  python3 scripts/extract_brand.py --url https://example.com",
    )
    parser.add_argument("--url", required=True, help="Target URL to extract from")
    parser.add_argument("--headed", action="store_true", help="Use headed browser for bot-detection sites")
    parser.add_argument("--skip-existing", action="store_true", help="Resume partial extraction (skip existing files)")
    parser.add_argument("--skip-validation", action="store_true", help="Skip Phase 6 (screenshot validation)")
    parser.add_argument("--skip-replicas", action="store_true", help="Skip Phase 5 (Claude replica generation)")
    args = parser.parse_args()

    url = args.url.rstrip("/")
    if not url.startswith("http"):
        url = "https://" + url

    slug = derive_slug(url)
    start_time = time.time()

    print(f"Design Extractor — Orchestrator")
    print(f"URL:  {url}")
    print(f"Slug: {slug}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Phase 0: Setup
    step("Phase 0", "Setting up directories")
    dirs = setup_directories(slug)
    info(f"Cache: {dirs['cache']}")
    info(f"Brand: {dirs['brands']}")
    info(f"UI:    {dirs['public']}")

    # Phase 1: Verify URL
    try:
        title = verify_url(url, args.headed)
    except RuntimeError as e:
        # Retry with headed if headless fails
        if not args.headed:
            info(f"Headless failed ({e}), retrying with --headed...")
            try:
                title = verify_url(url, headed=True)
                args.headed = True  # Use headed for all subsequent steps
            except RuntimeError as e2:
                fail(f"URL verification failed: {e2}")
        else:
            fail(f"URL verification failed: {e}")

    # Phase 2: Identify pages
    pages = identify_pages(url, args.headed)
    write_pages_json(slug, pages)

    # Phase 3: Extract DOM from each page
    step("Phase 3", f"Extracting DOM from {len(pages)} pages")
    for page_slug, config in pages.items():
        extract_dom(
            page_slug,
            config["original_url"],
            slug,
            dirs,
            args.headed,
            args.skip_existing,
        )

    # Verify DOM extractions exist
    dom_dir = dirs["dom_extraction"]
    for page_slug in pages:
        dom_path = dom_dir / f"{page_slug}.json"
        assert_exists(dom_path, f"DOM extraction for {page_slug}")
    info(f"All {len(pages)} DOM extractions verified")

    # Phase 4: Download assets
    asset_count = download_assets(slug, pages, dirs, args.headed)

    # Phase 5: Build replicas
    if not args.skip_replicas:
        build_replicas(slug, url, pages, dirs)
        verify_replicas(slug, pages, dirs)
    else:
        info("Skipping replica generation (--skip-replicas)")

    # Phase 6: Validate
    score = 0.0
    if not args.skip_validation and not args.skip_replicas:
        score = run_validation(slug)
    else:
        info("Skipping validation (--skip-validation or --skip-replicas)")

    # Phase 7: Publish
    publish(slug)

    # Phase 8: Register
    register_in_library(slug, url, title)

    # Phase 9: Final verification
    final_verification(slug, pages, asset_count, score)

    elapsed = time.time() - start_time
    print(f"\nTotal time: {elapsed/60:.1f} minutes")

    return 0


if __name__ == "__main__":
    sys.exit(main())
