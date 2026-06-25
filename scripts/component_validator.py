#!/usr/bin/env python3
"""
Component-based validation engine.

Walks the replica DOM to find components, screenshots each one,
finds the matching component on the original site, screenshots it,
then compares both visually AND structurally.

This is the core comparison engine — replaces full-page pixel diff
and blind segment slicing with semantic, component-level validation.

Usage:
    python3 scripts/component_validator.py --brand quantium-com-au --page about-us --base-url http://localhost:5173
    python3 scripts/component_validator.py --brand quantium-com-au --all-pages --base-url http://localhost:5173
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

from proc_utils import run_capture

try:
    from PIL import Image
    from pixelmatch import pixelmatch
except ImportError:
    print("Missing: pip install Pillow pixelmatch")
    sys.exit(1)


COMPONENT_DISCOVERY_SELECTORS = [
    "[data-component]",
    "[data-section]",
    "[data-testid*=\"component\" i]",
    "[data-testid*=\"section\" i]",
    "header",
    "footer",
    "main > section",
    "section",
    "article",
    "aside",
    "nav",
    "form",
    "[role=\"banner\"]",
    "[role=\"contentinfo\"]",
    "[role=\"navigation\"]",
    "[role=\"main\"]",
    "[role=\"region\"]",
    "[role=\"form\"]",
    "[role=\"search\"]",
    "[aria-label]",
    "[class*=\"hero\" i]",
    "[class*=\"section\" i]",
    "[class*=\"feature\" i]",
    "[class*=\"card\" i]",
    "[class*=\"grid\" i]",
    "[class*=\"panel\" i]",
    "[class*=\"cta\" i]",
    "[class*=\"banner\" i]",
]


def build_find_components_js():
    """Build the browser-side component discovery script.

    The detector intentionally looks beyond headings. Modern pages often render
    reusable blocks as ordinary divs with data attributes, ARIA landmarks,
    utility classes, cards, or forms, so discovery uses semantic scoring rather
    than one heading-only pass.
    """
    selectors_json = (
        "["
        + ", ".join("'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'" for s in COMPONENT_DISCOVERY_SELECTORS)
        + "]"
    )
    return r"""JSON.stringify((() => {
  const COMPONENT_SELECTORS = __SELECTORS__;
  const components = [];

  const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();
  const hasClassToken = (el, pattern) => pattern.test(String(el.className || ''));
  const getRect = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      top: Math.round(rect.top + window.scrollY),
      left: Math.round(rect.left + window.scrollX),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      area: Math.max(0, Math.round(rect.width * rect.height)),
    };
  };

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity || '1') > 0.01;
  }

  function getComponentName(el) {
    const explicit =
      el.getAttribute('data-component') ||
      el.getAttribute('data-section') ||
      el.getAttribute('data-testid') ||
      el.getAttribute('aria-label');
    if (explicit) return normalizeText(explicit).substring(0, 80);

    const heading = el.querySelector('h1, h2, h3, h4, [role="heading"]');
    if (heading) return normalizeText(heading.textContent).substring(0, 80);

    const labeled = el.querySelector('img[alt], svg[aria-label], button, a');
    const label = labeled?.getAttribute('alt') || labeled?.getAttribute('aria-label') || labeled?.textContent;
    if (label) return normalizeText(label).substring(0, 80);

    const role = el.getAttribute('role');
    if (role) return role[0].toUpperCase() + role.slice(1);

    const tag = el.tagName.toLowerCase();
    if (tag === 'header') return 'Header';
    if (tag === 'footer') return 'Footer';
    if (tag === 'nav') return 'Navigation';
    if (tag === 'form') return 'Form';
    if (tag === 'article') return 'Article';

    const className = String(el.className || '').split(/\s+/).find(Boolean);
    return className ? className.replace(/[-_]/g, ' ').substring(0, 80) : 'Section';
  }

  function classifyComponent(el) {
    const explicit = normalizeText(el.getAttribute('data-component') || el.getAttribute('data-section')).toLowerCase();
    if (explicit) return explicit.replace(/\s+/g, '-');

    const tag = el.tagName.toLowerCase();
    const role = normalizeText(el.getAttribute('role')).toLowerCase();
    const cls = String(el.className || '');
    const top = el.getBoundingClientRect().top + window.scrollY;

    if (tag === 'header' || role === 'banner') return 'header';
    if (tag === 'footer' || role === 'contentinfo') return 'footer';
    if (tag === 'nav' || role === 'navigation') return 'navigation';
    if (tag === 'form' || role === 'form' || role === 'search') return 'form';
    if (tag === 'article') return 'article';
    if (hasClassToken(el, /hero|masthead|jumbotron/i)) return 'hero';
    if (hasClassToken(el, /cta|call-to-action|contact/i)) return 'cta';
    if (hasClassToken(el, /card|tile/i)) return 'card';
    if (hasClassToken(el, /grid|collection|listing|gallery/i)) return 'card-grid';
    if (hasClassToken(el, /feature|benefit/i)) return 'feature-section';
    if (hasClassToken(el, /banner|promo/i)) return 'banner';
    if (el.querySelectorAll('input, textarea, select').length > 0) return 'form';
    if (el.querySelectorAll('li').length >= 3) return 'list';
    if (el.querySelector('h1') && top < 900) return 'hero';
    if (cls && /section/i.test(cls)) return 'section';
    return 'section';
  }

  function scoreCandidate(el) {
    if (!isVisible(el) || el === document.body || el === document.documentElement) return -100;
    const rect = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const role = normalizeText(el.getAttribute('role')).toLowerCase();
    let score = 0;

    if (el.hasAttribute('data-component')) score += 80;
    if (el.hasAttribute('data-section')) score += 65;
    if (['header', 'footer', 'section', 'article', 'nav', 'form', 'aside'].includes(tag)) score += 42;
    if (['banner', 'contentinfo', 'navigation', 'region', 'form', 'search', 'main'].includes(role)) score += 30;
    if (el.querySelector('h1, h2, h3, h4, [role="heading"]')) score += 24;
    if (el.querySelector('img, picture, video, canvas, svg')) score += 12;
    if (el.querySelectorAll('a, button').length > 0) score += 10;
    if (el.querySelectorAll('li').length >= 3) score += 10;
    if (el.querySelectorAll('input, textarea, select').length > 0) score += 14;
    if (hasClassToken(el, /hero|section|feature|card|grid|panel|cta|banner|module|block/i)) score += 18;
    if (rect.width < 180 || rect.height < 44) score -= 45;
    if (tag === 'main') score -= 20;
    if (el.children.length === 1 && !el.querySelector('h1, h2, h3, h4, a, button, img, form')) score -= 20;

    return score;
  }

  const candidates = [];
  COMPONENT_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      const score = scoreCandidate(el);
      if (score < 35) return;
      const rect = getRect(el);
      candidates.push({ el, score, rect });
    });
  });

  candidates.sort((a, b) => b.score - a.score || b.rect.area - a.rect.area);
  const picked = [];
  const seenGeometry = new Set();

  candidates.forEach((candidate) => {
    const { el, rect } = candidate;
    const key = [rect.top, rect.left, rect.width, rect.height].join('|');
    if (seenGeometry.has(key)) return;

    const swallowedByPicked = picked.some((item) => {
      if (!item.el.contains(el)) return false;
      if (el.hasAttribute('data-component') || el.hasAttribute('data-section')) return false;
      const ratio = rect.area / Math.max(1, item.rect.area);
      return ratio > 0.68;
    });
    if (swallowedByPicked) return;

    seenGeometry.add(key);
    picked.push(candidate);
  });

  picked.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);

  picked.forEach(({ el, rect, score }) => {
    const cs = getComputedStyle(el);
    let bgImgCount = 0;
    el.querySelectorAll('*').forEach((node) => {
      const bg = getComputedStyle(node).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) bgImgCount++;
    });
    const headingEl = el.querySelector('h1, h2, h3, h4, [role="heading"]');

    components.push({
      type: classifyComponent(el),
      heading: getComponentName(el),
      headingTag: headingEl ? headingEl.tagName : el.tagName,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bg: cs.backgroundColor,
      color: cs.color,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily.substring(0, 60),
      imgCount: el.querySelectorAll('img, picture').length,
      bgImgCount,
      linkCount: el.querySelectorAll('a').length,
      buttonCount: el.querySelectorAll('button, [role="button"]').length,
      inputCount: el.querySelectorAll('input, textarea, select').length,
      childCount: el.children.length,
      selectorScore: score,
    });
  });

  return components;
})())""".replace("__SELECTORS__", selectors_json)


# JavaScript to find all components in a page DOM
FIND_COMPONENTS_JS = build_find_components_js()


def browser_run(args_list, timeout=15):
    """Run an agent-browser command and return stdout."""
    result = run_capture(["agent-browser"] + args_list, timeout=timeout)
    return (result.stdout or "").strip()


def close_browser_session(session):
    """Best-effort cleanup for component validation sessions."""
    try:
        run_capture(
            ["agent-browser", "close", "--session", session],
            timeout=10,
        )
    except Exception:
        pass


def close_component_sessions_after(func):
    def wrapped(brand, page, *args, **kwargs):
        try:
            return func(brand, page, *args, **kwargs)
        finally:
            close_browser_session(f"cv-r-{page}")
            close_browser_session(f"cv-o-{page}")
    return wrapped


def browser_js(session, js, timeout=20):
    """Run JS via agent-browser and return the result string."""
    result = run_capture(
        ["agent-browser", "eval", "--session", session, js],
        timeout=timeout,
    )
    return (result.stdout or "").strip().strip('"')


def open_page(url, session, headed=False, wait=4):
    """Navigate to a URL and wait."""
    cmd = ["open", url, "--session", session]
    if headed:
        cmd.append("--headed")
    result = run_capture(["agent-browser"] + cmd, timeout=30)
    if result.returncode != 0:
        reason = "timed out" if result.returncode == -1 else (result.stderr or "").strip()
        print(f"  Failed to open {url}: {reason}")
        return False
    time.sleep(wait)
    return True


def find_components(session):
    """Find all major components in the current page."""
    raw = browser_js(session, FIND_COMPONENTS_JS)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        try:
            return json.loads(raw.encode().decode('unicode_escape'))
        except Exception:
            return []


def screenshot_component(session, component, output_path):
    """Take a full-page screenshot then crop to the component bounds."""
    top = component["top"]
    height = min(component["height"], 2000)

    # Scroll component into view
    browser_js(session, f"window.scrollTo(0, {max(0, top - 50)})")
    time.sleep(0.5)

    # Full page screenshot
    tmp_path = output_path + ".full.png"
    subprocess.run(
        ["agent-browser", "screenshot", tmp_path, "--session", session, "--full"],
        capture_output=True, text=True, timeout=15,
    )

    if not Path(tmp_path).exists():
        return False

    try:
        img = Image.open(tmp_path)
        left = max(0, component.get("left", 0))
        crop_top = max(0, top)
        right = min(img.width, left + component["width"])
        bottom = min(img.height, crop_top + height)
        if bottom <= crop_top or right <= left:
            Path(tmp_path).unlink(missing_ok=True)
            return False
        cropped = img.crop((left, crop_top, right, bottom))
        cropped.save(output_path)
        Path(tmp_path).unlink(missing_ok=True)
        return True
    except Exception as e:
        print(f"  Crop error: {e}")
        Path(tmp_path).unlink(missing_ok=True)
        return False


def compare_pair(orig, repl, orig_img, repl_img):
    """Compare two matched components visually and structurally."""
    result = {"heading": orig.get("heading", repl.get("heading", "?")), "issues": []}

    # Structural checks
    h_diff = abs(orig.get("height", 0) - repl.get("height", 0))
    if h_diff > 50:
        result["issues"].append(f"Height: orig {orig['height']}px vs repl {repl['height']}px (diff {h_diff}px)")

    if orig.get("bg") != repl.get("bg"):
        result["issues"].append(f"Background: orig '{orig.get('bg')}' vs repl '{repl.get('bg')}'")

    img_diff = abs(orig.get("imgCount", 0) - repl.get("imgCount", 0))
    if img_diff > 0:
        result["issues"].append(f"Images: orig {orig.get('imgCount', 0)} vs repl {repl.get('imgCount', 0)}")

    bg_diff = abs(orig.get("bgImgCount", 0) - repl.get("bgImgCount", 0))
    if bg_diff > 0:
        result["issues"].append(f"CSS bg-images: orig {orig.get('bgImgCount', 0)} vs repl {repl.get('bgImgCount', 0)}")

    link_diff = abs(orig.get("linkCount", 0) - repl.get("linkCount", 0))
    if link_diff > 2:
        result["issues"].append(f"Links: orig {orig.get('linkCount', 0)} vs repl {repl.get('linkCount', 0)}")

    # Pixel comparison
    pixel_score = 0.0
    if Path(orig_img).exists() and Path(repl_img).exists():
        try:
            o = Image.open(orig_img).convert("RGBA")
            r = Image.open(repl_img).convert("RGBA")
            if o.size != r.size:
                r = r.resize(o.size, Image.Resampling.LANCZOS)
            w, h = o.size
            total = w * h
            mismatch = pixelmatch(o.tobytes(), r.tobytes(), w, h, threshold=0.3, includeAA=False)
            pixel_score = round((1.0 - mismatch / total) * 100, 1)
        except Exception as e:
            result["issues"].append(f"Pixel compare error: {e}")

    result["pixel_score"] = pixel_score
    result["original"] = {k: v for k, v in orig.items()}
    result["replica"] = {k: v for k, v in repl.items()}
    return result


def _norm_text(value):
    return " ".join(str(value or "").lower().split())


def _component_match_score(orig, repl):
    """Score a possible original/replica component pair."""
    oh = _norm_text(orig.get("heading"))
    rh = _norm_text(repl.get("heading"))
    ot = _norm_text(orig.get("type"))
    rt = _norm_text(repl.get("type"))

    score = 0

    if oh and rh:
        if oh == rh:
            score += 100
        elif oh in rh or rh in oh:
            score += 82
        else:
            o_words = {w for w in oh.replace("-", " ").split() if len(w) > 2}
            r_words = {w for w in rh.replace("-", " ").split() if len(w) > 2}
            if o_words and r_words:
                overlap = len(o_words & r_words) / len(o_words | r_words)
                score += round(overlap * 55)

    if ot and rt:
        if ot == rt:
            score += 76 if ot in ("header", "footer", "navigation") else 62
        elif {ot, rt} <= {"section", "feature-section", "card-grid", "list", "article", "hero", "cta", "banner"}:
            score += 24

    top_diff = abs(int(orig.get("top", 0) or 0) - int(repl.get("top", 0) or 0))
    if top_diff <= 120:
        score += 18
    elif top_diff <= 320:
        score += 10
    elif top_diff <= 640:
        score += 4

    height_o = int(orig.get("height", 0) or 0)
    height_r = int(repl.get("height", 0) or 0)
    if height_o and height_r:
        ratio = min(height_o, height_r) / max(height_o, height_r)
        if ratio >= 0.75:
            score += 8
        elif ratio >= 0.5:
            score += 4

    return score


def match_components(orig_comps, repl_comps):
    """Match components by heading, semantic type, and page position."""
    pairs = []
    used = set()

    for orig in orig_comps:
        best_j, best_score = None, 0

        for j, repl in enumerate(repl_comps):
            if j in used:
                continue
            score = _component_match_score(orig, repl)
            if score > best_score:
                best_j, best_score = j, score

        if best_j is not None and best_score >= 55:
            used.add(best_j)
            pairs.append((orig, repl_comps[best_j]))
        else:
            pairs.append((orig, None))

    for j, repl in enumerate(repl_comps):
        if j not in used:
            pairs.append((None, repl))

    return pairs


@close_component_sessions_after
def validate_page(brand, page, original_url, replica_url, output_dir, headed=False):
    """Full component validation for one page."""
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"Page: {page}")

    # Find components in replica
    print("  Scanning replica...")
    if not open_page(replica_url, f"cv-r-{page}", wait=3):
        return {"page": page, "error": "Failed to open replica"}
    repl_comps = find_components(f"cv-r-{page}")
    print(f"  Replica: {len(repl_comps)} components")

    # Find components in original
    print("  Scanning original...")
    if not open_page(original_url, f"cv-o-{page}", headed=headed, wait=5):
        return {"page": page, "error": "Failed to open original"}
    orig_comps = find_components(f"cv-o-{page}")
    print(f"  Original: {len(orig_comps)} components")

    # Match and compare
    pairs = match_components(orig_comps, repl_comps)
    results = []

    for i, (orig, repl) in enumerate(pairs):
        heading = (orig or repl or {}).get("heading", f"comp-{i}")
        safe = heading[:30].replace(" ", "-").replace("/", "-").lower()

        if orig and repl:
            oi = str(output_dir / f"orig-{i:02d}-{safe}.png")
            ri = str(output_dir / f"repl-{i:02d}-{safe}.png")
            screenshot_component(f"cv-o-{page}", orig, oi)
            screenshot_component(f"cv-r-{page}", repl, ri)
            comp = compare_pair(orig, repl, oi, ri)
            comp["status"] = "matched"
            results.append(comp)
            n_issues = len(comp["issues"])
            print(f"  [{comp['pixel_score']:5.1f}%] {heading[:50]} {f'({n_issues} issues)' if n_issues else ''}")

        elif orig:
            results.append({"heading": heading, "status": "missing_in_replica", "pixel_score": 0,
                            "issues": [f"'{heading}' missing from replica"], "original": orig})
            print(f"  [MISS ] {heading[:50]}")

        elif repl:
            results.append({"heading": heading, "status": "extra_in_replica", "pixel_score": 0,
                            "issues": [f"'{heading}' extra in replica"], "replica": repl})
            print(f"  [EXTRA] {heading[:50]}")

    matched = [r for r in results if r["status"] == "matched"]
    scores = [r["pixel_score"] for r in matched]
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0

    print(f"\n  Average: {avg}% | {len(matched)} matched | {sum(len(r.get('issues',[])) for r in results)} issues")

    return {
        "page": page, "original_url": original_url, "replica_url": replica_url,
        "components_original": len(orig_comps), "components_replica": len(repl_comps),
        "matched": len(matched), "missing": len([r for r in results if r["status"] == "missing_in_replica"]),
        "extra": len([r for r in results if r["status"] == "extra_in_replica"]),
        "average_score": avg, "components": results,
    }


def main():
    parser = argparse.ArgumentParser(description="Component-based validation")
    parser.add_argument("--brand", required=True)
    parser.add_argument("--page", help="Single page slug")
    parser.add_argument("--all-pages", action="store_true")
    parser.add_argument("--base-url", default="http://localhost:5173")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--output", help="Output JSON path")
    args = parser.parse_args()

    pages_file = Path.home() / ".claude" / "design-library" / "cache" / args.brand / "validation" / "pages.json"
    if not pages_file.exists():
        print(f"Error: {pages_file} not found")
        return 1

    with open(pages_file) as f:
        pages_config = json.load(f)

    output_base = Path.home() / ".claude" / "design-library" / "cache" / args.brand / "validation" / "components"

    if args.all_pages:
        all_results = {}
        for slug, config in pages_config.items():
            r = validate_page(args.brand, slug, config["original_url"],
                              f"{args.base_url}{config['replica_route']}", output_base / slug, args.headed)
            all_results[slug] = r

        all_scores = [r["average_score"] for r in all_results.values() if "error" not in r]
        overall = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0
        print(f"\n{'='*60}\nOverall: {overall}%")

        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            with open(args.output, "w") as f:
                json.dump({"pages": all_results, "overall": overall}, f, indent=2)

    elif args.page:
        if args.page not in pages_config:
            print(f"Error: '{args.page}' not in pages.json")
            return 1
        config = pages_config[args.page]
        r = validate_page(args.brand, args.page, config["original_url"],
                          f"{args.base_url}{config['replica_route']}", output_base / args.page, args.headed)
        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            with open(args.output, "w") as f:
                json.dump(r, f, indent=2)
    else:
        print("Need --page or --all-pages")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
