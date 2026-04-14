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

try:
    from PIL import Image
    from pixelmatch import pixelmatch
except ImportError:
    print("Missing: pip install Pillow pixelmatch")
    sys.exit(1)


# JavaScript to find all components in a page DOM
FIND_COMPONENTS_JS = r"""JSON.stringify((() => {
  const components = [];
  const seen = new Set();
  const headings = document.querySelectorAll('h1, h2, h3');
  for (const h of headings) {
    const section = h.closest('section') || h.closest('[class*=section]') || h.parentElement?.parentElement;
    if (!section || section === document.body) continue;
    const r = section.getBoundingClientRect();
    if (r.height < 40 || r.width < 200) continue;
    const key = Math.round(r.top) + '|' + Math.round(r.height);
    if (seen.has(key)) continue;
    seen.add(key);
    const cs = getComputedStyle(section);
    let bgImgCount = 0;
    section.querySelectorAll('div, figure, span').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) bgImgCount++;
    });
    components.push({
      type: 'section', heading: h.textContent.trim().replace(/\s+/g, ' ').substring(0, 80),
      headingTag: h.tagName, top: Math.round(r.top + window.scrollY),
      left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height),
      bg: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize,
      fontFamily: cs.fontFamily.substring(0, 60),
      imgCount: section.querySelectorAll('img').length, bgImgCount: bgImgCount,
      linkCount: section.querySelectorAll('a').length, childCount: section.children.length,
    });
  }
  const header = document.querySelector('header');
  if (header) {
    const r = header.getBoundingClientRect();
    components.unshift({ type: 'header', heading: 'Header', headingTag: 'HEADER',
      top: Math.round(r.top + window.scrollY), left: Math.round(r.left),
      width: Math.round(r.width), height: Math.round(r.height),
      bg: getComputedStyle(header).backgroundColor, color: getComputedStyle(header).color,
      fontSize: '16px', fontFamily: '', imgCount: header.querySelectorAll('img').length,
      bgImgCount: 0, linkCount: header.querySelectorAll('a').length, childCount: header.children.length,
    });
  }
  const footer = document.querySelector('footer');
  if (footer) {
    const r = footer.getBoundingClientRect();
    components.push({ type: 'footer', heading: 'Footer', headingTag: 'FOOTER',
      top: Math.round(r.top + window.scrollY), left: Math.round(r.left),
      width: Math.round(r.width), height: Math.round(r.height),
      bg: getComputedStyle(footer).backgroundColor, color: getComputedStyle(footer).color,
      fontSize: '14px', fontFamily: '', imgCount: footer.querySelectorAll('img').length,
      bgImgCount: 0, linkCount: footer.querySelectorAll('a').length, childCount: footer.children.length,
    });
  }
  return components;
})())"""


def browser_run(args_list, timeout=15):
    """Run an agent-browser command and return stdout."""
    result = subprocess.run(
        ["agent-browser"] + args_list,
        capture_output=True, text=True, timeout=timeout,
    )
    return result.stdout.strip()


def browser_js(session, js, timeout=20):
    """Run JS via agent-browser and return the result string."""
    result = subprocess.run(
        ["agent-browser", "eval", "--session", session, js],
        capture_output=True, text=True, timeout=timeout,
    )
    return result.stdout.strip().strip('"')


def open_page(url, session, headed=False, wait=4):
    """Navigate to a URL and wait."""
    cmd = ["open", url, "--session", session]
    if headed:
        cmd.append("--headed")
    result = subprocess.run(
        ["agent-browser"] + cmd,
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        print(f"  Failed to open {url}: {result.stderr.strip()}")
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


def match_components(orig_comps, repl_comps):
    """Match components by heading text. Returns list of (orig, repl) tuples."""
    pairs = []
    used = set()

    for orig in orig_comps:
        oh = orig.get("heading", "").lower().strip()
        best_j, best_score = None, 0

        for j, repl in enumerate(repl_comps):
            if j in used:
                continue
            rh = repl.get("heading", "").lower().strip()
            if oh == rh:
                best_j, best_score = j, 100
                break
            if oh and rh and (oh in rh or rh in oh):
                if best_score < 80:
                    best_j, best_score = j, 80
            if orig.get("type") == repl.get("type") and orig["type"] in ("header", "footer"):
                if best_score < 60:
                    best_j, best_score = j, 60

        if best_j is not None:
            used.add(best_j)
            pairs.append((orig, repl_comps[best_j]))
        else:
            pairs.append((orig, None))

    for j, repl in enumerate(repl_comps):
        if j not in used:
            pairs.append((None, repl))

    return pairs


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
