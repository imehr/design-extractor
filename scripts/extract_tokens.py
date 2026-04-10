#!/usr/bin/env python3
# Forked from brand-extractor v1.0.0 on 2026-04-10
# Source: ~/.claude/plugins/local/brand-extractor/skills/brand-extraction/scripts/extract_tokens.py
# Changes from upstream:
#   - Bug fix: OUTPUT_DIR aliasing — now threaded as parameter
#   - Bug fix: Unhandled TimeoutError in tokens stage — now writes error JSON
#   - Bug fix: Default wait_until changed from networkidle to domcontentloaded
#   - Added: SPA hydration detection (computed_colours < 15 + custom_properties > 100)
"""
Brand Extractor — Token Extraction Pipeline
Extracts design tokens from a URL using Playwright and CSS analysis.

Usage:
    python extract_tokens.py --stage recon --url https://stripe.com
    python extract_tokens.py --stage tokens --url https://stripe.com
    python extract_tokens.py --stage assets --url https://stripe.com
    python extract_tokens.py --stage synthesis --input ./output/tokens-raw.json
"""

import argparse
import json
import os
import re
import sys
from collections import Counter
from math import gcd
from functools import reduce
from pathlib import Path
from urllib.parse import urljoin, urlparse

# Third-party imports (install via pip)
try:
    from playwright.sync_api import sync_playwright
    from bs4 import BeautifulSoup
    from colormath.color_objects import sRGBColor, LabColor
    from colormath.color_conversions import convert_color
    from colormath.color_diff import delta_e_cie2000
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install with: pip install playwright beautifulsoup4 colormath")
    print("Then run: playwright install chromium")
    sys.exit(1)


# ── Configuration ──────────────────────────────────────────────────────────

DEFAULT_BREAKPOINTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
}

NOISE_COLOUR_PATTERNS = [
    r"^#0000ee$",       # default link blue
    r"^#551a8b$",       # default visited purple
    r"^rgba?\(0,\s*0,\s*0,\s*0\)$",  # fully transparent
    r"^transparent$",
    r"^inherit$",
    r"^initial$",
]

THIRD_PARTY_CLASS_PREFIXES = [
    "intercom", "drift", "hubspot", "cookie", "gdpr", "consent",
    "ad-", "ads-", "tracking", "analytics", "fb-", "twitter-",
    "g-recaptcha", "grecaptcha",
]


# ── Stage 1: Discovery & Reconnaissance ───────────────────────────────────

def run_reconnaissance(url: str, output_dir: Path, depth: str = "standard") -> dict:
    """
    Navigate to URL, extract metadata, identify page types, capture screenshots.
    Returns reconnaissance data for Gate 1 validation.
    """
    output = {
        "stage": "reconnaissance",
        "url": url,
        "domain": urlparse(url).netloc,
        "status": None,
        "meta": {},
        "stylesheets": [],
        "font_sources": [],
        "page_types": [],
        "screenshots": {},
        "internal_links": [],
        "brand_resources": [],
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport=DEFAULT_BREAKPOINTS["desktop"],
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        page = context.new_page()

        # Navigate with domcontentloaded (Bug 3 fix: avoids 30s timeout on analytics-heavy sites)
        try:
            response = page.goto(url, wait_until="domcontentloaded", timeout=30000)
            output["status"] = response.status if response else None
            page.wait_for_timeout(4000)  # JS hydration wait
        except Exception as e:
            output["error"] = str(e)
            browser.close()
            return output

        # Extract <head> metadata
        output["meta"] = page.evaluate("""() => {
            const meta = {};
            meta.title = document.title || '';
            meta.description = document.querySelector('meta[name="description"]')?.content || '';
            meta.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
            meta.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
            meta.themeColor = document.querySelector('meta[name="theme-color"]')?.content || '';
            meta.favicon = document.querySelector('link[rel="icon"]')?.href || '';
            meta.appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')?.href || '';
            return meta;
        }""")

        # Collect stylesheet URLs
        output["stylesheets"] = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .map(l => l.href)
                .filter(h => h);
        }""")

        # Detect font sources
        output["font_sources"] = page.evaluate("""() => {
            const fonts = new Set();
            // Google Fonts
            document.querySelectorAll('link[href*="fonts.googleapis"]').forEach(l => fonts.add(l.href));
            // Adobe Fonts
            document.querySelectorAll('link[href*="typekit"]').forEach(l => fonts.add(l.href));
            // Preconnects to font services
            document.querySelectorAll('link[rel="preconnect"]').forEach(l => {
                if (l.href.includes('fonts') || l.href.includes('typekit'))
                    fonts.add(l.href);
            });
            // Computed font families
            const body = window.getComputedStyle(document.body);
            fonts.add('computed:' + body.fontFamily);
            return Array.from(fonts);
        }""")

        # Crawl internal links for page diversity
        output["internal_links"] = page.evaluate("""(domain) => {
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter(h => {
                    try { return new URL(h).hostname === domain; }
                    catch { return false; }
                })
                .slice(0, 50);
        }""", output["domain"])

        # Classify page types from link paths
        output["page_types"] = _classify_page_types(output["internal_links"])

        # Capture screenshots at all breakpoints
        # Bug 1 fix: use output_dir parameter instead of module-level constant
        screenshot_dir = output_dir / "screenshots"
        screenshot_dir.mkdir(parents=True, exist_ok=True)

        for bp_name, bp_dims in DEFAULT_BREAKPOINTS.items():
            page.set_viewport_size(bp_dims)
            page.wait_for_timeout(1000)
            path = screenshot_dir / f"{bp_name}-full.png"
            page.screenshot(path=str(path), full_page=True)
            output["screenshots"][bp_name] = str(path)

        browser.close()

    return output


def _classify_page_types(links: list) -> list:
    """Classify internal links into page type categories."""
    types = set()
    for link in links:
        path = urlparse(link).path.lower().strip("/")
        if not path or path == "":
            types.add("home")
        elif any(k in path for k in ["blog", "news", "article", "post"]):
            types.add("content")
        elif any(k in path for k in ["product", "features", "solutions"]):
            types.add("product")
        elif any(k in path for k in ["pricing", "plans"]):
            types.add("pricing")
        elif any(k in path for k in ["about", "team", "company"]):
            types.add("about")
        elif any(k in path for k in ["contact", "support", "help"]):
            types.add("contact")
        elif any(k in path for k in ["login", "signup", "register", "signin"]):
            types.add("auth")
        elif any(k in path for k in ["docs", "documentation", "api"]):
            types.add("docs")
        elif any(k in path for k in ["legal", "privacy", "terms"]):
            types.add("legal")
        else:
            types.add("other")
    return list(types)


# ── Stage 2: CSS & Token Extraction ───────────────────────────────────────

def run_token_extraction(url: str, output_dir: Path) -> dict:
    """
    Extract all design tokens from computed styles and CSS custom properties.
    Returns raw tokens with confidence scores for Gate 2 validation.
    """
    output = {
        "stage": "token_extraction",
        "url": url,
        "colours": {},
        "typography": {},
        "spacing": {},
        "borders": {},
        "shadows": {},
        "breakpoints": [],
        "transitions": {},
        "custom_properties": {},
    }

    # Bug 2 fix: wrap Playwright calls in try/except to handle TimeoutError gracefully
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport=DEFAULT_BREAKPOINTS["desktop"])
            page = context.new_page()

            # Bug 3 fix: use domcontentloaded instead of networkidle
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(4000)  # JS hydration wait

            # Extract CSS custom properties from :root
            output["custom_properties"] = page.evaluate("""() => {
                const props = {};
                const root = document.documentElement;
                const styles = getComputedStyle(root);
                for (let i = 0; i < styles.length; i++) {
                    const name = styles[i];
                    if (name.startsWith('--')) {
                        props[name] = styles.getPropertyValue(name).trim();
                    }
                }
                return props;
            }""")

            # Extract computed styles from all visible elements
            raw_styles = page.evaluate("""() => {
                const elements = document.querySelectorAll('body *');
                const data = {
                    colours: [],
                    fontFamilies: [],
                    fontSizes: [],
                    fontWeights: [],
                    lineHeights: [],
                    letterSpacings: [],
                    paddings: [],
                    margins: [],
                    gaps: [],
                    borderRadii: [],
                    borderWidths: [],
                    boxShadows: [],
                    transitions: [],
                };

                elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;

                    const cs = getComputedStyle(el);
                    const classes = Array.from(el.classList || []).join(' ');

                    // Skip third-party elements
                    const skipPrefixes = ['intercom', 'drift', 'hubspot', 'cookie', 'gdpr',
                                          'consent', 'ad-', 'ads-', 'tracking', 'fb-'];
                    if (skipPrefixes.some(p => classes.includes(p))) return;

                    // Colours
                    ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
                        const val = cs[prop];
                        if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
                            data.colours.push({value: val, property: prop, tag: el.tagName});
                        }
                    });

                    // Typography
                    data.fontFamilies.push(cs.fontFamily);
                    data.fontSizes.push(cs.fontSize);
                    data.fontWeights.push(cs.fontWeight);
                    data.lineHeights.push(cs.lineHeight);
                    if (cs.letterSpacing !== 'normal') data.letterSpacings.push(cs.letterSpacing);

                    // Spacing
                    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(p => {
                        const v = parseFloat(cs[p]);
                        if (v > 0) data.paddings.push(v);
                    });
                    ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(p => {
                        const v = parseFloat(cs[p]);
                        if (v > 0) data.margins.push(v);
                    });
                    const gap = parseFloat(cs.gap);
                    if (gap > 0) data.gaps.push(gap);

                    // Border radius
                    const br = cs.borderRadius;
                    if (br && br !== '0px') data.borderRadii.push(br);

                    // Border width
                    const bw = parseFloat(cs.borderWidth);
                    if (bw > 0) data.borderWidths.push(bw);

                    // Box shadow
                    if (cs.boxShadow && cs.boxShadow !== 'none') data.boxShadows.push(cs.boxShadow);

                    // Transitions
                    if (cs.transition && cs.transition !== 'all 0s ease 0s') data.transitions.push(cs.transition);
                });

                return data;
            }""")

            # Bug 3 fallback: if domcontentloaded produced too few styles, retry with networkidle
            computed_colour_count = len(raw_styles["colours"])
            if computed_colour_count < 20:
                try:
                    page.goto(url, wait_until="networkidle", timeout=15000)
                    page.wait_for_timeout(4000)

                    raw_styles_retry = page.evaluate("""() => {
                        const elements = document.querySelectorAll('body *');
                        const data = {
                            colours: [],
                            fontFamilies: [],
                            fontSizes: [],
                            fontWeights: [],
                            lineHeights: [],
                            letterSpacings: [],
                            paddings: [],
                            margins: [],
                            gaps: [],
                            borderRadii: [],
                            borderWidths: [],
                            boxShadows: [],
                            transitions: [],
                        };

                        elements.forEach(el => {
                            const rect = el.getBoundingClientRect();
                            if (rect.width === 0 || rect.height === 0) return;

                            const cs = getComputedStyle(el);
                            const classes = Array.from(el.classList || []).join(' ');

                            const skipPrefixes = ['intercom', 'drift', 'hubspot', 'cookie', 'gdpr',
                                                  'consent', 'ad-', 'ads-', 'tracking', 'fb-'];
                            if (skipPrefixes.some(p => classes.includes(p))) return;

                            ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
                                const val = cs[prop];
                                if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
                                    data.colours.push({value: val, property: prop, tag: el.tagName});
                                }
                            });

                            data.fontFamilies.push(cs.fontFamily);
                            data.fontSizes.push(cs.fontSize);
                            data.fontWeights.push(cs.fontWeight);
                            data.lineHeights.push(cs.lineHeight);
                            if (cs.letterSpacing !== 'normal') data.letterSpacings.push(cs.letterSpacing);

                            ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(p => {
                                const v = parseFloat(cs[p]);
                                if (v > 0) data.paddings.push(v);
                            });
                            ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(p => {
                                const v = parseFloat(cs[p]);
                                if (v > 0) data.margins.push(v);
                            });
                            const gap = parseFloat(cs.gap);
                            if (gap > 0) data.gaps.push(gap);

                            const br = cs.borderRadius;
                            if (br && br !== '0px') data.borderRadii.push(br);

                            const bw = parseFloat(cs.borderWidth);
                            if (bw > 0) data.borderWidths.push(bw);

                            if (cs.boxShadow && cs.boxShadow !== 'none') data.boxShadows.push(cs.boxShadow);

                            if (cs.transition && cs.transition !== 'all 0s ease 0s') data.transitions.push(cs.transition);
                        });

                        return data;
                    }""")

                    # Use retry results if they produced more data
                    if len(raw_styles_retry["colours"]) > computed_colour_count:
                        raw_styles = raw_styles_retry

                    # Also refresh custom properties
                    output["custom_properties"] = page.evaluate("""() => {
                        const props = {};
                        const root = document.documentElement;
                        const styles = getComputedStyle(root);
                        for (let i = 0; i < styles.length; i++) {
                            const name = styles[i];
                            if (name.startsWith('--')) {
                                props[name] = styles.getPropertyValue(name).trim();
                            }
                        }
                        return props;
                    }""")
                except Exception:
                    pass  # networkidle fallback failed; use domcontentloaded results

            # Extract media query breakpoints from stylesheets
            output["breakpoints"] = page.evaluate("""() => {
                const breakpoints = new Set();
                for (const sheet of document.styleSheets) {
                    try {
                        for (const rule of sheet.cssRules) {
                            if (rule instanceof CSSMediaRule) {
                                const match = rule.conditionText.match(/(\\d+)px/g);
                                if (match) match.forEach(m => breakpoints.add(parseInt(m)));
                            }
                        }
                    } catch (e) { /* cross-origin stylesheet */ }
                }
                return Array.from(breakpoints).sort((a, b) => a - b);
            }""")

            browser.close()

        # Process raw styles into structured tokens with confidence scoring
        output["colours"] = _process_colours(raw_styles["colours"], output["custom_properties"])
        output["typography"] = _process_typography(raw_styles)
        output["spacing"] = _process_spacing(raw_styles)
        output["borders"] = _process_borders(raw_styles)
        output["shadows"] = _dedupe_and_count(raw_styles["boxShadows"])
        output["transitions"] = _dedupe_and_count(raw_styles["transitions"])

        # SPA hydration warning: detect under-hydrated SPAs
        computed_colours = output["colours"].get("computed", [])
        custom_property_colours = output["colours"].get("custom_properties", {})
        if len(computed_colours) < 15 and len(custom_property_colours) > 100:
            output["extraction_warning"] = "under_hydrated_spa"
            output["tokens_confidence"] = "MEDIUM"

    except Exception as e:
        # Bug 2 fix: write structured error JSON instead of letting exception propagate
        output = {
            "stage": "token_extraction",
            "url": url,
            "error": str(e),
        }
        # Write error JSON to output path so callers always get a file
        error_output_path = output_dir / "tokens-output.json"
        error_output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(error_output_path, "w") as f:
            json.dump(output, f, indent=2, default=str)

    return output


def _process_colours(raw_colours: list, custom_props: dict) -> dict:
    """Process raw colour values into a structured palette with confidence scores."""
    counter = Counter()
    for c in raw_colours:
        counter[c["value"]] += 1

    # Identify colours from custom properties (HIGH confidence)
    custom_colours = {}
    for name, value in custom_props.items():
        if _is_colour_value(value):
            custom_colours[name] = {"value": value, "confidence": "HIGH", "source": "custom-property"}

    # Score by frequency
    scored = []
    for value, count in counter.most_common():
        if _is_noise_colour(value):
            continue
        confidence = "HIGH" if count >= 5 else "MEDIUM" if count >= 2 else "LOW"
        scored.append({
            "value": value,
            "count": count,
            "confidence": confidence,
            "source": "computed-style",
        })

    return {
        "custom_properties": custom_colours,
        "computed": scored,
        "total_raw": len(raw_colours),
        "total_filtered": len(scored),
    }


def _process_typography(raw: dict) -> dict:
    """Process raw typography values into structured type system."""
    return {
        "families": _dedupe_and_count(raw["fontFamilies"]),
        "sizes": _dedupe_and_count(raw["fontSizes"]),
        "weights": _dedupe_and_count(raw["fontWeights"]),
        "line_heights": _dedupe_and_count(raw["lineHeights"]),
        "letter_spacings": _dedupe_and_count(raw["letterSpacings"]),
    }


def _process_spacing(raw: dict) -> dict:
    """Process raw spacing values, detect base unit via GCD."""
    all_values = raw["paddings"] + raw["margins"] + raw["gaps"]
    int_values = [int(v) for v in all_values if v > 0]

    base_unit = None
    if len(int_values) >= 3:
        base_unit = reduce(gcd, int_values)
        if base_unit < 2:
            base_unit = 4  # fallback to 4px

    return {
        "paddings": _dedupe_and_count([f"{v}px" for v in raw["paddings"]]),
        "margins": _dedupe_and_count([f"{v}px" for v in raw["margins"]]),
        "gaps": _dedupe_and_count([f"{v}px" for v in raw["gaps"]]),
        "detected_base_unit": f"{base_unit}px" if base_unit else None,
        "scale": _generate_scale(base_unit) if base_unit else [],
    }


def _process_borders(raw: dict) -> dict:
    """Process border values."""
    return {
        "radii": _dedupe_and_count(raw["borderRadii"]),
        "widths": _dedupe_and_count([f"{v}px" for v in raw["borderWidths"]]),
    }


# ── Stage 3: Asset Extraction ─────────────────────────────────────────────

def run_asset_extraction(url: str, output_dir: Path) -> dict:
    """Extract logos, favicons, and identify icon systems."""
    output = {
        "stage": "asset_extraction",
        "url": url,
        "logos": [],
        "favicons": [],
        "icon_system": None,
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport=DEFAULT_BREAKPOINTS["desktop"])
        page = context.new_page()
        # Bug 3 fix: use domcontentloaded instead of networkidle
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(4000)  # JS hydration wait

        # Logo detection
        output["logos"] = page.evaluate("""() => {
            const logos = [];
            const selectors = [
                'header img', 'nav img', '[role="banner"] img',
                'header svg', 'nav svg', '[role="banner"] svg',
                'a[href="/"] img', 'a[href="/"] svg',
                '[class*="logo"] img', '[class*="logo"] svg',
                '[aria-label*="logo"]', '[alt*="logo"]',
            ];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    const tag = el.tagName.toUpperCase();
                    const data = { selector: sel, tag: tag };
                    if (tag === 'IMG') {
                        data.src = el.src;
                        data.width = el.naturalWidth;
                        data.height = el.naturalHeight;
                        data.alt = el.alt;
                    } else if (tag === 'SVG') {
                        data.svg = el.outerHTML;
                        data.width = Math.round(el.getBoundingClientRect().width);
                        data.height = Math.round(el.getBoundingClientRect().height);
                    }
                    logos.push(data);
                });
            });
            return logos;
        }""")

        # Favicon extraction
        output["favicons"] = page.evaluate("""() => {
            const icons = [];
            document.querySelectorAll('link[rel*="icon"]').forEach(l => {
                icons.push({ rel: l.rel, href: l.href, sizes: l.sizes?.value || '' });
            });
            return icons;
        }""")

        # Icon system detection
        output["icon_system"] = page.evaluate("""() => {
            if (document.querySelector('link[href*="font-awesome"]') ||
                document.querySelector('[class*="fa-"]'))
                return 'Font Awesome';
            if (document.querySelector('link[href*="material"]') ||
                document.querySelector('[class*="material-icons"]'))
                return 'Material Icons';
            if (document.querySelector('svg use') || document.querySelector('svg symbol'))
                return 'Custom SVG sprite';
            if (document.querySelectorAll('svg').length > 10)
                return 'Inline SVG';
            return 'None detected';
        }""")

        # Download favicon files
        import urllib.request
        assets_dir = output_dir / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)

        for fav in output["favicons"]:
            href = fav.get("href", "")
            if not href:
                continue
            sizes = fav.get("sizes", "")
            ext = ".png" if href.endswith(".png") else ".ico" if href.endswith(".ico") else ".png"
            name = f"favicon-{sizes}{ext}" if sizes else f"favicon{ext}"
            try:
                urllib.request.urlretrieve(href, str(assets_dir / name))
                fav["local_path"] = str(assets_dir / name)
            except Exception as e:
                fav["download_error"] = str(e)

        browser.close()

    # Save inline SVG logos to disk
    assets_dir = output_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    seen_svgs = set()
    svg_count = 0
    for logo in output["logos"]:
        svg_markup = logo.get("svg")
        if not svg_markup:
            continue
        # Deduplicate by content hash
        svg_hash = hash(svg_markup)
        if svg_hash in seen_svgs:
            logo["deduplicated"] = True
            continue
        seen_svgs.add(svg_hash)
        svg_count += 1
        w = logo.get("width", 0)
        h = logo.get("height", 0)
        filename = f"logo-{svg_count}-{w}x{h}.svg"
        svg_path = assets_dir / filename
        with open(svg_path, "w") as f:
            f.write(svg_markup)
        logo["local_path"] = str(svg_path)

    # Also download IMG-based logos
    for logo in output["logos"]:
        src = logo.get("src")
        if not src or logo.get("local_path"):
            continue
        ext = ".png" if ".png" in src else ".svg" if ".svg" in src else ".jpg"
        name = f"logo-img-{logo.get('width', 0)}x{logo.get('height', 0)}{ext}"
        try:
            import urllib.request
            urllib.request.urlretrieve(src, str(assets_dir / name))
            logo["local_path"] = str(assets_dir / name)
        except Exception as e:
            logo["download_error"] = str(e)

    output["saved_assets"] = {
        "svg_logos": svg_count,
        "favicons_downloaded": sum(1 for f in output["favicons"] if "local_path" in f),
        "img_logos_downloaded": sum(1 for l in output["logos"] if l.get("src") and "local_path" in l),
    }

    return output


# ── Utility Functions ──────────────────────────────────────────────────────

def _is_colour_value(value: str) -> bool:
    """Check if a CSS value looks like a colour."""
    value = value.strip().lower()
    return (
        value.startswith("#") or
        value.startswith("rgb") or
        value.startswith("hsl") or
        value.startswith("oklch") or
        value in ("red", "blue", "green", "white", "black")
    )


def _is_noise_colour(value: str) -> bool:
    """Check if a colour is noise (browser default, transparent, etc.)."""
    value = value.strip().lower()
    for pattern in NOISE_COLOUR_PATTERNS:
        if re.match(pattern, value):
            return True
    return False


def _dedupe_and_count(values: list) -> list:
    """Deduplicate values and return sorted by frequency."""
    counter = Counter(values)
    return [
        {"value": val, "count": count}
        for val, count in counter.most_common()
    ]


def _generate_scale(base: int) -> list:
    """Generate a spacing scale from a base unit."""
    multipliers = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16]
    return [f"{int(base * m)}px" for m in multipliers if base * m == int(base * m)]


# ── Main Entry Point ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Brand Extractor — Token Extraction Pipeline")
    parser.add_argument("--stage", required=True, choices=["recon", "tokens", "assets", "synthesis"],
                        help="Pipeline stage to execute")
    parser.add_argument("--url", required=False, help="Target URL to extract from")
    parser.add_argument("--input", required=False, help="Input file path (for synthesis stage)")
    parser.add_argument("--output-dir", default="./brand-output", help="Output directory")
    parser.add_argument("--slow", action="store_true", help="Increase wait times for JS-heavy sites")

    args = parser.parse_args()
    # Bug 1 fix: output_dir is now passed as parameter to all stage functions
    # instead of relying on a module-level OUTPUT_DIR constant
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.stage == "recon":
        if not args.url:
            print("Error: --url is required for recon stage", file=sys.stderr)
            sys.exit(1)
        result = run_reconnaissance(args.url, output_dir=output_dir)

    elif args.stage == "tokens":
        if not args.url:
            print("Error: --url is required for tokens stage", file=sys.stderr)
            sys.exit(1)
        result = run_token_extraction(args.url, output_dir=output_dir)

    elif args.stage == "assets":
        if not args.url:
            print("Error: --url is required for assets stage", file=sys.stderr)
            sys.exit(1)
        result = run_asset_extraction(args.url, output_dir=output_dir)

    elif args.stage == "synthesis":
        # TODO: Phase 3 — the documentarian subagent handles synthesis, this stage will be removed
        print("Synthesis stage requires LLM — invoke via the extraction agent", file=sys.stderr)
        sys.exit(0)

    # Write output
    output_path = output_dir / f"{args.stage}-output.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, default=str)

    print(f"Output written to {output_path}")
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
