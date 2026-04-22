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
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    _RICH = True
    _console = Console()
except ImportError:
    _RICH = False
    _console = None

# Telemetry is best-effort: script lives in same dir as telemetry.py, so a
# direct import should always work when invoked as `python3 scripts/...`.
# Guarded so a missing telemetry.py never breaks the CLI.
try:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from telemetry import write_phase_event as _write_phase_event
except Exception:  # pragma: no cover — defensive fallback
    def _write_phase_event(*_args, **_kwargs):  # type: ignore[misc]
        return None

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
CLAUDE_TIMEOUT = 1500  # 25 min per replica-build pass (split into 2 passes)


# ── Helpers ───────────────────────────────────────────────────────────────

def parse_eval_json(stdout: str):
    """Parse JSON from agent-browser eval output, handling double-quoting."""
    stdout = stdout.strip()
    if not stdout:
        return None
    try:
        parsed = json.loads(stdout)
        # agent-browser wraps eval results in quotes — unwrap if string containing JSON
        if isinstance(parsed, str):
            try:
                return json.loads(parsed)
            except (json.JSONDecodeError, TypeError):
                return parsed
        return parsed
    except json.JSONDecodeError:
        return None


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


def phase_banner(phase_num: int, title: str, detail: str = "") -> None:
    """Print a visually distinct phase banner. Falls back to plain text if rich is missing."""
    if _RICH:
        body = Text()
        body.append(f"Phase {phase_num}", style="bold cyan")
        body.append(f"  {title}", style="bold white")
        if detail:
            body.append(f"\n{detail}", style="dim")
        _console.print(Panel(body, border_style="cyan", padding=(0, 1)))
    else:
        print()
        print("=" * 72)
        print(f"  Phase {phase_num}: {title}")
        if detail:
            print(f"  {detail}")
        print("=" * 72)


def step(msg: str) -> None:
    if _RICH:
        _console.print(f"[cyan]•[/] {msg}")
    else:
        print(f"  • {msg}")


def ok(msg: str) -> None:
    if _RICH:
        _console.print(f"[green]✓[/] {msg}")
    else:
        print(f"  [OK] {msg}")


def warn(msg: str) -> None:
    if _RICH:
        _console.print(f"[yellow]![/] {msg}")
    else:
        print(f"  [!] {msg}")


def info(msg: str) -> None:
    """Lightweight info line (plain, used for bulk output like lists)."""
    print(f"  {msg}")


def fail(msg: str) -> None:
    """Print an error and exit (non-zero). Preserves previous exit behavior."""
    if _RICH:
        _console.print(f"[red]✗[/] [bold red]FAILED:[/] {msg}")
    else:
        print(f"\n  [X] FAILED: {msg}", file=sys.stderr)
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


# ── Phase 0.5: Verify Agent Rules ────────────────────────────────────────

def verify_agent_rules():
    """Check that agent files contain critical learned rules."""
    phase_banner(0, "Verifying agent rules", "Checking critical learned rules in agent definitions")
    rules_to_check = {
        "agents/dom-extractor.md": ["background-image", "sectionCount", "Step 7"],
        "agents/replica-builder.md": ["section completeness", "DOM measurement", "object-cover"],
    }
    missing = []
    for agent_file, required_terms in rules_to_check.items():
        path = PLUGIN_DIR / agent_file
        if not path.exists():
            missing.append(f"{agent_file} not found")
            continue
        content = path.read_text().lower()
        for term in required_terms:
            if term.lower() not in content:
                missing.append(f"{agent_file} missing rule: '{term}'")

    if missing:
        for m in missing:
            warn(m)
    else:
        ok("All agent rules verified")


# ── Phase 1: Verify URL ──────────────────────────────────────────────────

def verify_url(url: str, headed: bool) -> str:
    """Open the URL in agent-browser and verify it loads. Returns page title."""
    phase_banner(1, "Verifying URL", url)

    session = f"verify-{int(time.time())}"
    cmd_open = agent_browser_cmd(["open", url], session=session, headed=headed)
    run_cmd(cmd_open, timeout=30, check=True)

    # Wait for page to settle
    time.sleep(3)  # Simple wait instead of networkidle (many sites never reach idle)

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

    ok(f"Page title: {title}")
    return title


# ── Phase 2: Identify Pages ──────────────────────────────────────────────

def identify_pages(url: str, headed: bool) -> dict[str, dict]:
    """Extract nav links and classify into page types. Returns pages dict."""
    phase_banner(2, "Identifying pages", "Extracting nav links and classifying page types")

    session = f"recon-{int(time.time())}"
    cmd_open = agent_browser_cmd(["open", url], session=session, headed=headed)
    run_cmd(cmd_open, timeout=30, check=True)
    time.sleep(3)  # Simple wait instead of networkidle (many sites never reach idle)

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
        parsed_json = parse_eval_json(stdout)
        if isinstance(parsed_json, list):
            raw_links = parsed_json
        else:
            warn(f"Could not parse nav links. Raw output: {stdout[:200]}")

    step(f"Found {len(raw_links)} internal links")

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

    ok(f"Selected {len(pages)} pages:")
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
    ok(f"Wrote {pages_path}")
    return pages_path


# ── Phase 3: Extract DOM ─────────────────────────────────────────────────

def extract_dom(page_slug: str, page_url: str, slug: str, dirs: dict, headed: bool, skip_existing: bool) -> None:
    """Extract DOM content and measurements from a single page."""
    dom_dir = dirs["dom_extraction"]
    dom_json_path = dom_dir / f"{page_slug}.json"
    measurements_path = dom_dir / f"{page_slug}-measurements.json"
    screenshot_path = dom_dir / f"{page_slug}-screenshot.png"

    if skip_existing and dom_json_path.exists() and measurements_path.exists():
        step(f"{page_slug}: skipped (exists)")
        return

    session = f"dom-{slug}-{page_slug}"
    step(f"{page_slug}: opening {page_url}")

    # Open page
    run_cmd(
        agent_browser_cmd(["open", page_url], session=session, headed=headed),
        timeout=30,
        check=True,
    )
    time.sleep(3)  # Simple wait instead of networkidle (many sites never reach idle)

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
    # NOTE: Three critical fixes vs earlier versions:
    #   1. backgroundImages walks section descendants, not just section element.
    #      Hero backgrounds live on inner <div>, not on the <main> wrapper.
    #   2. Dedicated header block captures logo <img>/<svg>/[class*=logo]
    #      outside the strict <header>/<nav> tag selectors.
    #   3. Top-level allImages + allBackgroundImages fallback arrays
    #      catch anything missed by section traversal.
    js_dom = """JSON.stringify((() => {
        const parseUrls = (bgImg) => {
            if (!bgImg || bgImg === 'none') return [];
            const out = [];
            const matches = bgImg.match(/url\\(["']?([^"')]+)["']?\\)/g) || [];
            matches.forEach(m => {
                const clean = m.replace(/url\\(["']?/, '').replace(/["']?\\)$/, '');
                if (clean && !clean.startsWith('data:')) out.push(clean);
            });
            return out;
        };
        // Reject SVG fragment references: url(#clip-path), or browser-resolved forms
        // like 'https://origin/#clip-path' that point at inline SVG <defs>.
        // Chromium sometimes URL-encodes the hash into the path as /%23clip-path,
        // so we also check for that shape.
        const isSvgFragmentRef = (u) => {
            if (!u) return true;
            if (u.startsWith('#')) return true;
            // Match 'https?://host/#...' or 'https?://host/%23...'
            if (/^https?:\\/\\/[^\\/]+\\/(?:#|%23)/i.test(u)) return true;
            try {
                const parsed = new URL(u, window.location.href);
                const isSameOrigin = parsed.origin === window.location.origin;
                const decodedPath = decodeURIComponent(parsed.pathname || '');
                const hasMeaningfulPath = decodedPath && decodedPath !== '/' && !decodedPath.startsWith('/#');
                if (!hasMeaningfulPath && (parsed.hash || decodedPath.startsWith('/#'))) return true;
                if (!hasMeaningfulPath && isSameOrigin) return true;
            } catch {}
            return false;
        };
        const absolute = (u) => {
            try { return new URL(u, window.location.href).href; } catch { return u; }
        };

        // Fallback: every <img> on the page (dedupe later)
        const allImages = Array.from(document.querySelectorAll('img[src]')).map(img => {
            const r = img.getBoundingClientRect();
            return {
                src: absolute(img.src),
                alt: img.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight,
                loc: { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
            };
        });

        // Fallback: every background-image on the page (walk all elements)
        const allBackgroundImages = [];
        const seenBg = new Set();
        Array.from(document.querySelectorAll('body *')).forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width < 40 || r.height < 40) return;
            const urls = parseUrls(getComputedStyle(el).backgroundImage);
            urls.forEach(u => {
                if (isSvgFragmentRef(u)) return;
                const abs = absolute(u);
                if (isSvgFragmentRef(abs)) return;
                if (seenBg.has(abs)) return;
                seenBg.add(abs);
                allBackgroundImages.push({
                    url: abs,
                    tag: el.tagName.toLowerCase(),
                    className: (el.className?.toString?.() || '').substring(0, 120),
                    loc: { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
                });
            });
        });

        // Dedicated header extraction (logo images, inline SVG, nav)
        const header = { logo: null, logoImages: [], logoSvgs: [] };
        const logoCandidateSelectors = [
            'header a[href="/"] img',
            'a[title*="logo" i] img',
            'a[aria-label*="logo" i] img',
            '[class*="logo"] img',
            'header img[alt*="logo" i]'
        ];
        for (const sel of logoCandidateSelectors) {
            document.querySelectorAll(sel).forEach(img => {
                if (!header.logo) {
                    header.logo = { src: absolute(img.src), alt: img.alt || '', type: 'img' };
                }
                header.logoImages.push({ src: absolute(img.src), alt: img.alt || '' });
            });
            if (header.logo) break;
        }
        if (!header.logo) {
            const svgSelectors = ['header a[href="/"] svg', '[class*="logo"] svg', 'header svg'];
            for (const sel of svgSelectors) {
                const svg = document.querySelector(sel);
                if (svg) {
                    header.logo = { outerHTML: svg.outerHTML.substring(0, 8000), type: 'svg' };
                    header.logoSvgs.push(svg.outerHTML.substring(0, 8000));
                    break;
                }
            }
        }

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
                    src: absolute(img.src),
                    alt: img.alt || '',
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            });

            // FIX: walk section + descendants for background-image, not just the section itself.
            const seenInSection = new Set();
            const scanEl = (target) => {
                const urls = parseUrls(getComputedStyle(target).backgroundImage);
                urls.forEach(u => {
                    if (isSvgFragmentRef(u)) return;
                    const abs = absolute(u);
                    if (isSvgFragmentRef(abs)) return;
                    if (seenInSection.has(abs)) return;
                    seenInSection.add(abs);
                    section.backgroundImages.push(abs);
                });
            };
            scanEl(el);
            el.querySelectorAll('*').forEach(child => {
                const r = child.getBoundingClientRect();
                if (r.width < 60 || r.height < 60) return;
                scanEl(child);
            });

            sections.push(section);
        });

        return {
            url: window.location.href,
            title: document.title,
            sections: sections,
            header: header,
            allImages: allImages,
            allBackgroundImages: allBackgroundImages
        };
    })())"""

    result = run_cmd(
        agent_browser_cmd(["eval", js_dom], session=session),
        timeout=DOM_EXTRACT_TIMEOUT,
    )

    dom_data = {}
    stdout = (result.stdout or "").strip()
    if stdout:
        dom_data = parse_eval_json(stdout)
        if dom_data is None:
            warn(f"Could not parse DOM extraction for {page_slug}")
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
        measurements = parse_eval_json(stdout)
        if measurements is None:
            measurements = {"parse_error": True}

    with open(measurements_path, "w") as f:
        json.dump(measurements, f, indent=2)

    ok(f"{page_slug}: DOM ({len(dom_data.get('sections', []))} sections) + measurements saved")
    assert_exists(dom_json_path, f"DOM extraction for {page_slug}")


# ── Phase 4: Download Assets ─────────────────────────────────────────────

def _browser_fetch_fallback(url: str, dest: str, session: str = "dl", headed: bool = False) -> bool:
    """Download a file via the browser's fetch API (bypasses 403/cookie restrictions)."""
    import base64
    try:
        # Open a page on the same origin first (if not already open)
        from urllib.parse import urlparse
        origin = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        run_cmd(agent_browser_cmd(["open", origin], session=session, headed=headed), timeout=20)
        time.sleep(1)

        js = f"""(async () => {{
            const resp = await fetch("{url}");
            if (!resp.ok) return "ERROR:" + resp.status;
            const blob = await resp.blob();
            const reader = new FileReader();
            return new Promise(r => {{ reader.onload = () => r(reader.result); reader.readAsDataURL(blob); }});
        }})()"""

        result = run_cmd(agent_browser_cmd(["eval", js], session=session), timeout=15)
        data_url = (result.stdout or "").strip().strip('"')
        if data_url and "base64," in data_url:
            b64 = data_url.split("base64,")[1]
            with open(dest, "wb") as f:
                f.write(base64.b64decode(b64))
            return Path(dest).exists() and Path(dest).stat().st_size > 100
    except Exception:
        pass
    return False


def download_assets(slug: str, pages: dict, dirs: dict, headed: bool) -> int:
    """Download images, fonts, SVGs, and CSS background images from DOM extraction data."""
    phase_banner(4, "Downloading assets", "Images, fonts, SVGs, and CSS background images")

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

        # Page-level fallback pools (new in dom-extractor v2) — catch images missed by section traversal
        for img in dom.get("allImages", []):
            src = img.get("src", "")
            if src and not src.startswith("data:"):
                image_urls.add(src)
        for bg in dom.get("allBackgroundImages", []):
            url = bg.get("url", "") if isinstance(bg, dict) else bg
            if url and not url.startswith("data:"):
                bg_image_urls.add(url)

        # Header logo (dedicated capture)
        header = dom.get("header", {}) or {}
        logo = header.get("logo") or {}
        logo_src = logo.get("src") if isinstance(logo, dict) else None
        if logo_src and not logo_src.startswith("data:"):
            image_urls.add(logo_src)

    all_urls = list(image_urls | bg_image_urls)
    step(f"Found {len(image_urls)} images + {len(bg_image_urls)} background images = {len(all_urls)} total")

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

            try:
                urllib.request.urlretrieve(url_str, str(dest))
            except urllib.error.HTTPError as http_err:
                if http_err.code == 403:
                    # Fallback: download via browser fetch (bypasses 403)
                    _browser_fetch_fallback(url_str, str(dest), session=f"dl-{slug}", headed=headed)
                else:
                    raise

            if not dest.exists() or dest.stat().st_size < 100:
                if dest.exists():
                    dest.unlink()
                continue

            # Verify the download is an actual asset, not an HTML error page
            result = run_cmd(["file", "--brief", str(dest)], timeout=5)
            file_type = (result.stdout or "").strip().lower()
            if "html" in file_type and not filename.endswith(".svg"):
                dest.unlink()
                warn(f"Removed HTML error page: {filename}")
                continue

            downloaded += 1
        except Exception as e:
            warn(f"Failed to download {url_str[:80]}: {e}")

    # Extract and download fonts from the first page using agent-browser
    first_page_url = list(pages.values())[0]["original_url"]
    session = f"assets-{slug}"
    try:
        run_cmd(
            agent_browser_cmd(["open", first_page_url], session=session, headed=headed),
            timeout=30,
        )
        time.sleep(3)

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
            font_list = parse_eval_json(stdout)
            if isinstance(font_list, list):
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
    except RuntimeError:
        warn("Font extraction failed (non-fatal)")

    ok(f"Downloaded {downloaded} assets to {public_dir}")

    # Mirror downloaded files into the cache assets directory so the brand's
    # symlinked `assets/` (cache -> published brand dir) reflects what was
    # actually fetched. Without this, apply_design.py --include-replica-ui ships
    # a stale asset set from earlier runs.
    assets_cache = dirs["assets_cache"]
    assets_cache.mkdir(parents=True, exist_ok=True)
    mirrored = 0
    for src_file in public_dir.rglob("*"):
        if not src_file.is_file() or src_file.name.startswith("."):
            continue
        rel = src_file.relative_to(public_dir)
        dst_file = assets_cache / rel
        try:
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            if not dst_file.exists() or dst_file.stat().st_mtime < src_file.stat().st_mtime:
                shutil.copy2(src_file, dst_file)
                mirrored += 1
        except OSError:
            continue
    if mirrored:
        step(f"Mirrored {mirrored} files into {assets_cache}")

    return downloaded


# ── Phase 4b: Brand Kit (press-kit discovery) ────────────────────────────

def run_brand_kit(slug: str, url: str, brand_name: str, dirs: dict) -> dict:
    """Invoke brand_kit_extractor.py to discover and download official press-kit
    assets. Best-effort — must never fail the pipeline."""
    phase_banner(4, "Brand kit (press-kit discovery)", "Probing /press, /brand, /brand-assets")
    cache_dir = dirs["cache"]
    cmd = [
        sys.executable,
        str(SCRIPTS_DIR / "brand_kit_extractor.py"),
        "--brand-name", brand_name or slug,
        "--slug", slug,
        "--source-url", url,
        "--cache-dir", str(cache_dir),
        "--ui-dir", str(UI_DIR),
        "--limit", "40",
    ]
    step(f"Running brand_kit_extractor against {url}")
    try:
        r = subprocess.run(cmd, timeout=300, capture_output=True, text=True)
    except subprocess.TimeoutExpired:
        warn("brand_kit_extractor timed out — skipping")
        return {"status": "timeout"}
    except Exception as e:
        warn(f"brand_kit_extractor dispatch failed: {e}")
        return {"status": "error"}
    if r.returncode != 0:
        warn(f"brand_kit_extractor non-zero exit: {r.returncode}")
        if r.stderr:
            warn(r.stderr[-500:])
        return {"status": "error"}
    report_path = cache_dir / "brand-kit" / "report.json"
    if report_path.exists():
        try:
            return json.loads(report_path.read_text())
        except json.JSONDecodeError:
            return {"status": "malformed_report"}
    status_path = cache_dir / "brand-kit" / "status.json"
    if status_path.exists():
        try:
            return json.loads(status_path.read_text())
        except json.JSONDecodeError:
            return {"status": "malformed_status"}
    return {"status": "no_output"}


# ── Phase 5: Build Replicas ──────────────────────────────────────────────

def _build_asset_listing(slug: str, public_dir: Path) -> tuple[list[str], str]:
    """Return (full_asset_paths, human-formatted listing for the prompt)."""
    asset_list: list[str] = []
    if public_dir.exists():
        for f in sorted(public_dir.rglob("*")):
            if f.is_file() and not f.name.startswith("."):
                rel = f.relative_to(public_dir)
                asset_list.append(str(rel))
    asset_str = "\n".join(f"  /brands/{slug}/{a}" for a in asset_list[:80])
    if len(asset_list) > 80:
        asset_str += f"\n  ... and {len(asset_list) - 80} more files"
    return asset_list, asset_str


def _run_claude_print(prompt: str, label: str) -> None:
    """Dispatch a single claude --print call. Non-fatal on failure/timeout."""
    step(f"Calling claude --print: {label}")
    try:
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
            warn(f"Claude exited with code {result.returncode} ({label})")
            if stderr:
                info(f"stderr: {stderr[:500]}")
    except RuntimeError as err:
        warn(f"Claude dispatch timed out ({label}): {err}")


def build_replicas(slug: str, url: str, pages: dict, dirs: dict) -> None:
    """Generate React/shadcn replicas in two passes, each with its own claude --print budget.

    Pass 1: shared components (header, footer, logo) + homepage replica
    Pass 2: remaining inner pages (about-us, products, contact-us, etc.)

    Splitting prevents the 15-minute timeout from cutting off the inner pages when the
    shared components take most of the budget. Each pass gets the full CLAUDE_TIMEOUT.
    """
    phase_banner(5, "Building React/shadcn replicas", "Two-pass Claude dispatch for timeout resilience")

    asset_list, asset_str = _build_asset_listing(slug, dirs["public"])
    dom_dir = dirs["dom_extraction"]

    common_rules = (
        "RULES:\n"
        "- Use shadcn/ui components (Card, Button, Separator) where appropriate\n"
        "- Use Lucide React icons only for generic UI elements (never emoji)\n"
        "- INCLUDE ALL IMAGES — every hero, card, article thumbnail, logo from the asset list\n"
        "- Extract ALL sections from DOM JSON — every H2 heading must have a replica section\n"
        "- Do NOT fabricate text — only use content from DOM extraction JSON files\n"
        "- Match colors and spacing from the measurement JSON files\n"
        "- Use the real logo from header.logo.src (path under /brands/{slug}/)\n"
        "- Use background-image URLs from section.backgroundImages and allBackgroundImages\n"
        "  for hero sections — these are stored as /brands/{slug}/<filename> after download\n"
    )

    # ── Pass 1: shared components + homepage ─────────────────────────────
    homepage_cfg = pages.get("homepage") or next(iter(pages.values()))
    pass1_prompt = f"""Build React/shadcn shared components + the homepage replica for {url}.

Brand slug: {slug}

Read these DOM extraction files (primary source of truth):
  {dom_dir}/homepage.json
  {dom_dir}/homepage-measurements.json

The DOM JSON schema includes:
  - sections[]: per-section headings/text/links/images/backgroundImages
  - header.logo: {{ src, alt, type }} — USE THIS for the brand logo (it's the real file)
  - allImages, allBackgroundImages: page-level fallback pools

DOWNLOADED ASSETS ({len(asset_list)} files available at /brands/{slug}/):
{asset_str}

Create these files (and ONLY these — the 4 inner pages are built in a separate pass):
1. {dirs['components']}/{slug}-logo.tsx       — Logo component using header.logo.src
2. {dirs['components']}/{slug}-header.tsx     — Top nav with utility bar + main nav
3. {dirs['components']}/{slug}-footer.tsx     — Footer with links, social, legal text
4. {dirs['replica']}/layout.tsx               — Hides Design Library chrome
5. {dirs['replica']}/page.tsx                 — Homepage with ALL sections (hero uses backgroundImages[0] from the main section)

{common_rules}

The UI project is a Next.js app at {UI_DIR}. Verify TypeScript compiles before finishing.
"""
    _run_claude_print(pass1_prompt, "pass 1 (shared + homepage)")

    # ── Pass 2: inner pages ──────────────────────────────────────────────
    inner_pages = [
        {"slug": s, "original_url": c["original_url"], "replica_route": c["replica_route"]}
        for s, c in pages.items()
        if s != "homepage"
    ]
    if not inner_pages:
        ok("Only homepage requested — skipping pass 2")
        return

    inner_list = "\n".join(
        f"  {p['slug']:20s} -> {dirs['replica']}/{p['slug']}/page.tsx  (read {dom_dir}/{p['slug']}.json)"
        for p in inner_pages
    )

    pass2_prompt = f"""Build the inner-page replicas for {url}. Shared components (header/footer/logo) already exist at {dirs['components']}/ — import them.

Brand slug: {slug}

Inner pages to build ({len(inner_pages)} total):
{inner_list}

For each page:
  - Read {dom_dir}/<page-slug>.json for sections/content/images
  - Read {dom_dir}/<page-slug>-measurements.json for layout hints
  - Every H2 in DOM => one section in the replica
  - Hero uses section.backgroundImages or allBackgroundImages[0] as background
  - Import header from {dirs['components']}/{slug}-header.tsx
  - Import footer from {dirs['components']}/{slug}-footer.tsx

DOWNLOADED ASSETS ({len(asset_list)} files at /brands/{slug}/):
{asset_str}

{common_rules}

The UI project is a Next.js app at {UI_DIR}. Build ALL {len(inner_pages)} inner pages. Verify TypeScript compiles before finishing.
"""
    _run_claude_print(pass2_prompt, f"pass 2 ({len(inner_pages)} inner pages)")


def verify_replicas(slug: str, pages: dict, dirs: dict) -> None:
    """Verify all expected replica files exist."""
    phase_banner(5, "Verifying replica files", "Checking generated components and running TypeScript check")

    replica_dir = dirs["replica"]
    components_dir = dirs["components"]

    # Check homepage
    homepage_tsx = replica_dir / "page.tsx"
    if not homepage_tsx.exists():
        fail(f"Missing homepage replica: {homepage_tsx}")
    ok(f"homepage/page.tsx: exists ({homepage_tsx.stat().st_size} bytes)")

    # Check layout
    layout_tsx = replica_dir / "layout.tsx"
    if not layout_tsx.exists():
        warn("layout.tsx missing (will use parent layout)")
    else:
        ok(f"layout.tsx: exists ({layout_tsx.stat().st_size} bytes)")

    # Check inner pages
    for page_slug in pages:
        if page_slug == "homepage":
            continue
        page_tsx = replica_dir / page_slug / "page.tsx"
        if not page_tsx.exists():
            warn(f"missing {page_slug}/page.tsx")
        else:
            ok(f"{page_slug}/page.tsx: exists ({page_tsx.stat().st_size} bytes)")

    # Check shared components
    component_files = list(components_dir.glob("*.tsx"))
    step(f"Shared components: {len(component_files)} files")
    for cf in component_files:
        info(f"    {cf.name} ({cf.stat().st_size} bytes)")

    # TypeScript compile check (non-fatal)
    step("Running TypeScript check")
    result = run_cmd(
        ["npx", "tsc", "--noEmit"],
        timeout=120,
        cwd=str(UI_DIR),
        check=False,
    )
    if result.returncode == 0:
        ok("TypeScript: passed")
    else:
        errors = (result.stdout or "").strip()
        error_count = errors.count("error TS")
        warn(f"TypeScript: {error_count} errors (non-fatal, replicas may still render)")


# ── Phase 6: Validate ────────────────────────────────────────────────────

def run_validation(slug: str) -> float:
    """Run the validation harness. Returns average score."""
    phase_banner(6, "Running screenshot validation", "Comparing replicas against reference screenshots")

    base_url = "http://localhost:5173"
    cache_dir = CACHE_ROOT / slug

    validation_script = SCRIPTS_DIR / "run_validation_loop.py"
    if not validation_script.exists():
        warn("run_validation_loop.py not found, skipping validation")
        return 0.0

    result = run_cmd(
        [
            sys.executable, str(validation_script),
            "--brand", slug,
            "--base-url", base_url,
            "--target", "80",
            "--skip-originals",
        ],
        timeout=300,
        check=False,
    )

    output = (result.stdout or "")
    print(output)

    # Also run component-level validation for actionable feedback
    step("Running component-level validation")
    comp_validator = SCRIPTS_DIR / "component_validator.py"
    if comp_validator.exists():
        comp_result = run_cmd(
            [sys.executable, str(comp_validator),
             "--brand", slug, "--all-pages",
             "--base-url", base_url,
             "--output", str(cache_dir / "validation" / "component-report.json")],
            timeout=300, check=False,
        )
        if comp_result.returncode == 0:
            ok("Component validation report saved")
        else:
            warn(f"Component validation exited with code {comp_result.returncode} (non-fatal)")

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
    phase_banner(7, "Publishing brand artifacts", "Generating design tokens, DESIGN.md, and SKILL.md")

    publish_script = SCRIPTS_DIR / "publish_brand.py"
    if not publish_script.exists():
        warn("publish_brand.py not found, skipping publish")
        return

    result = run_cmd(
        [sys.executable, str(publish_script), "--brand", slug],
        timeout=120,
        check=False,
    )
    print(result.stdout or "")
    if result.returncode != 0:
        warn(f"publish exited with code {result.returncode}")


# ── Phase 8: Register ────────────────────────────────────────────────────

def register_in_library(slug: str, url: str, title: str) -> None:
    """Register the brand in the library index."""
    phase_banner(8, "Registering in design library", "Updating metadata.json and library index")

    brands_dir = BRANDS_ROOT / slug
    meta_path = brands_dir / "metadata.json"

    # Read or create metadata
    metadata = {}
    if meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)

    # Ensure required fields
    # Clean brand name: strip page title suffixes like "| Circle K" or "- Executive Search"
    raw_name = title or slug.replace("-", " ").title()
    # Take the shortest meaningful part (usually after | or - or :)
    for sep in [" | ", " - ", ": ", " — "]:
        if sep in raw_name:
            parts = raw_name.split(sep)
            # Pick the shortest non-trivial part as the brand name
            candidates = [p.strip() for p in parts if len(p.strip()) > 2]
            if candidates:
                raw_name = min(candidates, key=len)
                break
    metadata.setdefault("name", raw_name.strip('"').strip("'"))
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

    ok(f"Registered {slug} in library index")


# ── Phase 9: Final Verification ──────────────────────────────────────────

def final_verification(slug: str, pages: dict, asset_count: int, score: float) -> None:
    """Verify all expected artifacts exist and print summary."""
    phase_banner(9, "Final verification", "Checking artifacts and printing summary")

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
            ok(f"{name}")
            passed += 1
        else:
            warn(f"{name}: MISSING")
            failed_checks.append(name)

    # Check public assets count
    public_files = list(public_dir.rglob("*"))
    public_file_count = len([f for f in public_files if f.is_file()])
    if public_file_count >= 5:
        ok(f"public/brands/{slug}/: {public_file_count} files")
        passed += 1
    else:
        warn(f"public/brands/{slug}/: {public_file_count} files (expected 5+)")
        failed_checks.append(f"public assets ({public_file_count} files)")

    # Check shared components
    component_count = len(list(components_dir.glob("*.tsx")))
    if component_count >= 1:
        ok(f"components/brands/{slug}/: {component_count} components")
        passed += 1
    else:
        warn(f"components/brands/{slug}/: {component_count} components (expected 1+)")
        failed_checks.append("shared components")

    # Check library index
    index_path = LIBRARY_ROOT / "index.json"
    in_index = False
    if index_path.exists():
        with open(index_path) as f:
            idx = json.load(f)
        in_index = any(b.get("slug") == slug for b in idx.get("brands", []))
    if in_index:
        ok("Library index: registered")
        passed += 1
    else:
        warn("Library index: NOT registered")
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

    if _RICH:
        header = Text()
        header.append("Design Extractor", style="bold magenta")
        header.append("  Orchestrator\n", style="bold white")
        header.append(f"URL:  {url}\n", style="white")
        header.append(f"Slug: {slug}\n", style="white")
        header.append(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", style="dim")
        _console.print(Panel(header, border_style="magenta", padding=(0, 1)))
    else:
        print("Design Extractor — Orchestrator")
        print(f"URL:  {url}")
        print(f"Slug: {slug}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # ── Telemetry helper ────────────────────────────────────────────
    # Each phase call below is wrapped so we emit a "started" event before
    # and a "completed" event (with duration_s) after. If a phase raises or
    # calls sys.exit, only the "started" event is written — the aggregator
    # infers failure from the missing "completed" event.
    def _phase(phase_id: str, fn, *a, **kw):
        _write_phase_event(slug, phase=phase_id, status="started")
        _t0 = time.time()
        result = fn(*a, **kw)
        _write_phase_event(
            slug,
            phase=phase_id,
            status="completed",
            duration_s=time.time() - _t0,
        )
        return result

    # Phase 0: Setup
    _write_phase_event(slug, phase="0", status="started")
    _p0_start = time.time()
    phase_banner(0, "Setting up directories", "Creating cache, brand, UI output locations")
    dirs = setup_directories(slug)
    info(f"Cache: {dirs['cache']}")
    info(f"Brand: {dirs['brands']}")
    info(f"UI:    {dirs['public']}")
    _write_phase_event(slug, phase="0", status="completed", duration_s=time.time() - _p0_start)

    # Phase 0.5: Verify agent rules
    _phase("0.5", verify_agent_rules)

    # Phase 1: Verify URL
    _write_phase_event(slug, phase="1", status="started")
    _p1_start = time.time()
    try:
        title = verify_url(url, args.headed)
    except RuntimeError as e:
        # Retry with headed if headless fails
        if not args.headed:
            warn(f"Headless failed ({e}), retrying with --headed")
            try:
                title = verify_url(url, headed=True)
                args.headed = True  # Use headed for all subsequent steps
            except RuntimeError as e2:
                fail(f"URL verification failed: {e2}")
        else:
            fail(f"URL verification failed: {e}")
    _write_phase_event(slug, phase="1", status="completed", duration_s=time.time() - _p1_start)

    # Phase 2: Identify pages
    _write_phase_event(slug, phase="2", status="started")
    _p2_start = time.time()
    pages = identify_pages(url, args.headed)
    write_pages_json(slug, pages)
    _write_phase_event(slug, phase="2", status="completed", duration_s=time.time() - _p2_start)

    # Phase 3: Extract DOM from each page
    _write_phase_event(slug, phase="3", status="started")
    _p3_start = time.time()
    phase_banner(3, "Extracting DOM", f"Extracting content and measurements from {len(pages)} pages")
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
    ok(f"All {len(pages)} DOM extractions verified")
    _write_phase_event(slug, phase="3", status="completed", duration_s=time.time() - _p3_start)

    # Phase 4: Download assets
    asset_count = _phase("4", download_assets, slug, pages, dirs, args.headed)

    # Phase 4b: Brand kit (press-kit discovery) — best-effort, never fails the pipeline
    try:
        brand_kit = _phase("4b", run_brand_kit, slug, url, title, dirs)
    except Exception as e:
        warn(f"Brand kit phase errored ({e}) — continuing")
        brand_kit = {"status": "error"}
    if isinstance(brand_kit, dict):
        bk_status = brand_kit.get("status", "unknown")
        bk_count = brand_kit.get("downloaded_count", 0)
        if bk_status == "ok":
            ok(f"Brand kit: {bk_count} assets downloaded via {brand_kit.get('discovery_method','unknown')}")
        elif bk_status == "not_found":
            warn("Brand kit: no press-kit page discovered (ok — not all brands publish one)")
        elif bk_status == "skipped":
            warn(f"Brand kit: skipped — {brand_kit.get('reason','')}")
        else:
            warn(f"Brand kit: status={bk_status}")

    # Phase 5: Build replicas
    if not args.skip_replicas:
        _phase("5", build_replicas, slug, url, pages, dirs)
        _phase("5b", verify_replicas, slug, pages, dirs)
    else:
        warn("Skipping replica generation (--skip-replicas)")

    # Phase 6: Validate
    score = 0.0
    if not args.skip_validation and not args.skip_replicas:
        score = _phase("6", run_validation, slug)
    else:
        warn("Skipping validation (--skip-validation or --skip-replicas)")

    # Phase 7: Publish
    _phase("7", publish, slug)

    # Phase 8: Register
    _phase("8", register_in_library, slug, url, title)

    # Phase 9: Final verification
    _phase("9", final_verification, slug, pages, asset_count, score)

    elapsed = time.time() - start_time
    print(f"\nTotal time: {elapsed/60:.1f} minutes")

    return 0


if __name__ == "__main__":
    sys.exit(main())
