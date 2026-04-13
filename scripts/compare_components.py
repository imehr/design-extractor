#!/usr/bin/env python3
"""
Component-level visual comparison.
Compares each section of the original page against the corresponding
section in the replica, producing specific actionable feedback.

Unlike pixel_compare.py which gives a single overall percentage, this script
identifies which specific component is wrong and how to fix it by comparing
individual sections detected via H2 headings.

Usage:
    python3 scripts/compare_components.py --brand quantium-com-au --page homepage --base-url http://localhost:5173
    python3 scripts/compare_components.py --brand quantium-com-au --page homepage --base-url http://localhost:5173 --output report.json
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path

try:
    from PIL import Image
    import pixelmatch
except ImportError:
    print("Missing dependencies. Install: pip install Pillow pixelmatch", file=sys.stderr)
    sys.exit(1)


CACHE_ROOT = Path.home() / ".claude" / "design-library" / "cache"
AGENT_BROWSER = "agent-browser"


# ---------------------------------------------------------------------------
# agent-browser helpers
# ---------------------------------------------------------------------------

def _run_ab(args: list[str], *, timeout: int = 30) -> str:
    """Run an agent-browser command and return stdout. Raises on failure."""
    cmd = [AGENT_BROWSER] + args
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(
            f"agent-browser failed: {' '.join(cmd)}\n"
            f"stderr: {result.stderr.strip()}\nstdout: {result.stdout.strip()}"
        )
    return result.stdout.strip()


def ab_open(url: str, session: str) -> str:
    return _run_ab(["open", url, "--session", session], timeout=60)


def ab_run_js(js: str, session: str) -> str:
    """Execute JavaScript in the browser via agent-browser's 'eval' subcommand."""
    return _run_ab(["eval", "--session", session, js], timeout=30)


def ab_screenshot(path: str, session: str) -> str:
    return _run_ab(["screenshot", path, "--session", session], timeout=30)


def ab_scroll_into_view(selector: str, session: str) -> str:
    return _run_ab(["scrollintoview", selector, "--session", session], timeout=15)


def ab_wait(ms: str, session: str) -> str:
    ms_int = int(ms)
    return _run_ab(["wait", ms, "--session", session], timeout=max(ms_int // 1000 + 10, 15))


def ab_close(session: str) -> None:
    try:
        _run_ab(["close", "--session", session], timeout=10)
    except Exception:
        pass  # best-effort cleanup


# ---------------------------------------------------------------------------
# Section extraction via JS executed in browser
# ---------------------------------------------------------------------------

EXTRACT_SECTIONS_JS = r"""
(() => {
  const sections = [];
  const headings = document.querySelectorAll('h2');
  for (const h of headings) {
    const section = h.closest('section') || h.parentElement?.parentElement;
    if (!section) continue;
    const r = section.getBoundingClientRect();
    if (r.height < 10 || r.width < 10) continue;
    const cs = getComputedStyle(section);
    sections.push({
      heading: h.textContent.trim(),
      top: Math.round(r.top + window.scrollY),
      left: Math.round(r.left),
      height: Math.round(r.height),
      width: Math.round(r.width),
      bg: cs.backgroundColor,
      images: section.querySelectorAll('img').length,
      links: section.querySelectorAll('a').length,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      color: cs.color,
    });
  }
  return JSON.stringify(sections);
})()
"""


def extract_sections(session: str) -> list[dict]:
    """Run JS in the browser to discover all H2-anchored sections on the current page."""
    raw = ab_run_js(EXTRACT_SECTIONS_JS, session)
    # agent-browser may wrap the result in quotes or print extra lines
    # find the first JSON array in the output
    for line in raw.splitlines():
        line = line.strip()
        if line.startswith("["):
            return json.loads(line)
        if line.startswith('"') and line.endswith('"'):
            inner = json.loads(line)
            if isinstance(inner, str) and inner.startswith("["):
                return json.loads(inner)
    # fallback: try parsing the whole thing
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, str):
            return json.loads(parsed)
        return parsed
    except json.JSONDecodeError:
        print(f"Warning: could not parse section data from browser output:\n{raw[:500]}", file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# Section screenshot capture
# ---------------------------------------------------------------------------

SCROLL_AND_BOX_JS = r"""
((headingText) => {
  const headings = document.querySelectorAll('h2');
  for (const h of headings) {
    if (h.textContent.trim() === headingText) {
      const section = h.closest('section') || h.parentElement?.parentElement;
      if (!section) return JSON.stringify(null);
      section.scrollIntoView({ block: 'start', behavior: 'instant' });
      const r = section.getBoundingClientRect();
      return JSON.stringify({
        top: Math.round(r.top),
        left: Math.round(r.left),
        width: Math.round(r.width),
        height: Math.round(r.height)
      });
    }
  }
  return JSON.stringify(null);
})
"""


def capture_section_screenshot(
    session: str, heading: str, out_path: Path
) -> bool:
    """Scroll a section into view, take a full screenshot, crop to the section bounds."""
    # Scroll the section into view and get its viewport-relative bounding box
    js = f'{SCROLL_AND_BOX_JS}({json.dumps(heading)})'
    raw = ab_run_js(js, session)

    box = None
    for line in raw.splitlines():
        line = line.strip()
        try:
            candidate = json.loads(line)
            if isinstance(candidate, str):
                candidate = json.loads(candidate)
            if isinstance(candidate, dict) and "top" in candidate:
                box = candidate
                break
        except (json.JSONDecodeError, TypeError):
            continue

    if not box:
        print(f"  Warning: could not locate section '{heading}'", file=sys.stderr)
        return False

    # Brief pause for scroll/render to settle
    ab_wait("500", session)

    # Take a full-page screenshot then crop
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        ab_screenshot(tmp_path, session)
        img = Image.open(tmp_path)

        # Clamp the crop region to image bounds
        left = max(0, box["left"])
        top = max(0, box["top"])
        right = min(img.width, left + box["width"])
        bottom = min(img.height, top + box["height"])

        if right <= left or bottom <= top:
            print(f"  Warning: degenerate crop for '{heading}': {box}", file=sys.stderr)
            return False

        cropped = img.crop((left, top, right, bottom))
        out_path.parent.mkdir(parents=True, exist_ok=True)
        cropped.save(str(out_path))
        return True
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ---------------------------------------------------------------------------
# Pixel comparison for a single pair
# ---------------------------------------------------------------------------

def compare_pair(original: Path, replica: Path, diff_out: Path | None = None) -> float:
    """Return pixel-match similarity (0.0 - 100.0) between two images."""
    try:
        orig = Image.open(original).convert("RGBA")
        repl = Image.open(replica).convert("RGBA")

        # Resize replica to match original for fair comparison
        if orig.size != repl.size:
            repl = repl.resize(orig.size, Image.Resampling.LANCZOS)

        width, height = orig.size
        total = width * height
        if total == 0:
            return 0.0

        diff_img = Image.new("RGBA", (width, height))

        num_diff = pixelmatch.pixelmatch(
            img1=orig.tobytes(),
            img2=repl.tobytes(),
            width=width,
            height=height,
            output=diff_img.tobytes() if diff_img else None,
            threshold=0.1,
            includeAA=False,
        )

        if diff_out:
            diff_out.parent.mkdir(parents=True, exist_ok=True)
            diff_img.save(str(diff_out))

        return round((1.0 - num_diff / total) * 100, 1)
    except Exception as e:
        print(f"  Warning: pixel comparison failed: {e}", file=sys.stderr)
        return 0.0


# ---------------------------------------------------------------------------
# Section matching: find the best replica heading for each original heading
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def match_sections(
    original_sections: list[dict], replica_sections: list[dict]
) -> list[tuple[dict, dict | None]]:
    """
    Match original sections to replica sections by heading text.
    Returns list of (original, replica_or_None) pairs.
    """
    replica_by_heading = {}
    for s in replica_sections:
        key = _normalize(s["heading"])
        replica_by_heading[key] = s

    pairs = []
    for orig in original_sections:
        key = _normalize(orig["heading"])
        replica = replica_by_heading.pop(key, None)
        pairs.append((orig, replica))
    return pairs


# ---------------------------------------------------------------------------
# Issue detection
# ---------------------------------------------------------------------------

def detect_issues(orig: dict, repl: dict) -> list[str]:
    """Compare structural metadata and return a list of human-readable issues."""
    issues = []

    # Height mismatch (>20% difference)
    oh, rh = orig.get("height", 0), repl.get("height", 0)
    if oh > 0 and rh > 0:
        ratio = abs(oh - rh) / oh
        if ratio > 0.20:
            issues.append(f"Height mismatch: original {oh}px vs replica {rh}px ({ratio:.0%} off)")

    # Background color
    obg, rbg = orig.get("bg", ""), repl.get("bg", "")
    if obg and rbg and _normalize(obg) != _normalize(rbg):
        issues.append(f"Background color mismatch: original '{obg}' vs replica '{rbg}'")

    # Image count
    oi, ri = orig.get("images", 0), repl.get("images", 0)
    if oi != ri:
        diff = oi - ri
        if diff > 0:
            issues.append(f"Missing {diff} image{'s' if diff != 1 else ''} (original has {oi}, replica has {ri})")
        else:
            issues.append(f"Extra {-diff} image{'s' if -diff != 1 else ''} (original has {oi}, replica has {ri})")

    # Link count (only flag if significantly different)
    ol, rl = orig.get("links", 0), repl.get("links", 0)
    if ol > 0 and abs(ol - rl) > max(1, ol * 0.3):
        issues.append(f"Link count mismatch: original {ol} vs replica {rl}")

    # Font size
    ofs, rfs = orig.get("fontSize", ""), repl.get("fontSize", "")
    if ofs and rfs and ofs != rfs:
        issues.append(f"Font size mismatch: original '{ofs}' vs replica '{rfs}'")

    # Font family (compare first family name only)
    off, rff = orig.get("fontFamily", ""), repl.get("fontFamily", "")
    if off and rff:
        orig_first = off.split(",")[0].strip().strip('"').strip("'").lower()
        repl_first = rff.split(",")[0].strip().strip('"').strip("'").lower()
        if orig_first != repl_first:
            issues.append(f"Font family mismatch: original '{orig_first}' vs replica '{repl_first}'")

    # Text color
    oc, rc = orig.get("color", ""), repl.get("color", "")
    if oc and rc and _normalize(oc) != _normalize(rc):
        issues.append(f"Text color mismatch: original '{oc}' vs replica '{rc}'")

    return issues


# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------

def resolve_original_url(brand: str, page: str) -> str | None:
    """Try to find the original URL from the brand's cached metadata."""
    cache_dir = CACHE_ROOT / brand
    for meta_name in ["extraction-meta.json", "metadata.json", "brand-meta.json"]:
        meta_path = cache_dir / meta_name
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text())
                url = meta.get("source_url") or meta.get("url") or meta.get("origin")
                if url:
                    return url
            except (json.JSONDecodeError, KeyError):
                continue
    return None


def slugify(text: str) -> str:
    """Turn a heading into a filesystem-safe slug."""
    return "".join(c if c.isalnum() or c in "-_ " else "" for c in text).strip().replace(" ", "-").lower()[:80]


def run(
    brand: str,
    page: str,
    base_url: str,
    original_url: str | None = None,
    output_path: str | None = None,
) -> dict:
    cache_dir = CACHE_ROOT / brand
    screenshots_dir = cache_dir / "screenshots" / "component-compare" / page
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    # Resolve original URL
    if not original_url:
        original_url = resolve_original_url(brand, page)
    if not original_url:
        print(f"Error: cannot determine original URL for brand '{brand}'. Pass --original-url.", file=sys.stderr)
        sys.exit(1)

    # Replica URL: assume base-url serves the brand's replica
    replica_url = base_url.rstrip("/")

    session = f"cmp-{uuid.uuid4().hex[:8]}"
    print(f"Session: {session}")

    try:
        # ---- Phase 1: Original page ----
        print(f"Opening original: {original_url}")
        ab_open(original_url, session)
        ab_wait("3000", session)

        print("Extracting sections from original...")
        original_sections = extract_sections(session)
        print(f"  Found {len(original_sections)} sections in original")

        orig_screenshots = {}
        for sec in original_sections:
            slug = slugify(sec["heading"])
            out = screenshots_dir / "original" / f"{slug}.png"
            ok = capture_section_screenshot(session, sec["heading"], out)
            if ok:
                orig_screenshots[sec["heading"]] = out
                print(f"  Captured: {sec['heading']}")
            else:
                print(f"  Skipped: {sec['heading']}")

        # ---- Phase 2: Replica page ----
        print(f"Opening replica: {replica_url}")
        ab_open(replica_url, session)
        ab_wait("3000", session)

        print("Extracting sections from replica...")
        replica_sections = extract_sections(session)
        print(f"  Found {len(replica_sections)} sections in replica")

        repl_screenshots = {}
        for sec in replica_sections:
            slug = slugify(sec["heading"])
            out = screenshots_dir / "replica" / f"{slug}.png"
            ok = capture_section_screenshot(session, sec["heading"], out)
            if ok:
                repl_screenshots[sec["heading"]] = out
                print(f"  Captured: {sec['heading']}")
            else:
                print(f"  Skipped: {sec['heading']}")

        # ---- Phase 3: Match and compare ----
        print("Comparing sections...")
        pairs = match_sections(original_sections, replica_sections)

        report_sections = []
        for orig_sec, repl_sec in pairs:
            heading = orig_sec["heading"]
            entry = {
                "heading": heading,
                "original": {
                    "height": orig_sec.get("height", 0),
                    "width": orig_sec.get("width", 0),
                    "bg": orig_sec.get("bg", ""),
                    "images": orig_sec.get("images", 0),
                    "links": orig_sec.get("links", 0),
                    "fontSize": orig_sec.get("fontSize", ""),
                    "fontFamily": orig_sec.get("fontFamily", ""),
                    "color": orig_sec.get("color", ""),
                },
                "replica": None,
                "issues": [],
                "pixel_match": 0.0,
            }

            if repl_sec is None:
                entry["issues"].append(f"Section '{heading}' not found in replica")
                report_sections.append(entry)
                continue

            entry["replica"] = {
                "height": repl_sec.get("height", 0),
                "width": repl_sec.get("width", 0),
                "bg": repl_sec.get("bg", ""),
                "images": repl_sec.get("images", 0),
                "links": repl_sec.get("links", 0),
                "fontSize": repl_sec.get("fontSize", ""),
                "fontFamily": repl_sec.get("fontFamily", ""),
                "color": repl_sec.get("color", ""),
            }

            # Structural issues
            entry["issues"] = detect_issues(orig_sec, repl_sec)

            # Pixel comparison if both screenshots exist
            orig_img = orig_screenshots.get(heading)
            repl_img = repl_screenshots.get(heading)
            if orig_img and repl_img:
                diff_out = screenshots_dir / "diffs" / f"{slugify(heading)}-diff.png"
                entry["pixel_match"] = compare_pair(orig_img, repl_img, diff_out)
            else:
                missing_side = "original" if not orig_img else "replica"
                entry["issues"].append(f"Could not capture {missing_side} screenshot for pixel comparison")

            report_sections.append(entry)
            status = "PASS" if entry["pixel_match"] >= 80.0 and len(entry["issues"]) == 0 else "ISSUES"
            print(f"  {heading}: {entry['pixel_match']}% pixel match, {len(entry['issues'])} issues [{status}]")

        # ---- Build report ----
        pixel_scores = [s["pixel_match"] for s in report_sections if s["replica"] is not None]
        avg_pixel = round(sum(pixel_scores) / len(pixel_scores), 1) if pixel_scores else 0.0
        total_issues = sum(len(s["issues"]) for s in report_sections)

        report = {
            "brand": brand,
            "page": page,
            "original_url": original_url,
            "replica_url": replica_url,
            "summary": {
                "sections_in_original": len(original_sections),
                "sections_in_replica": len(replica_sections),
                "sections_compared": len(pairs),
                "sections_missing_in_replica": sum(1 for _, r in pairs if r is None),
                "average_pixel_match": avg_pixel,
                "total_issues": total_issues,
            },
            "sections": report_sections,
        }

        # ---- Write output ----
        default_out = screenshots_dir / "component-comparison.json"
        out_file = Path(output_path) if output_path else default_out
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(json.dumps(report, indent=2))
        print(f"\nReport written to {out_file}")
        print(f"Average pixel match: {avg_pixel}%")
        print(f"Total issues: {total_issues}")

        return report

    finally:
        ab_close(session)


def main():
    parser = argparse.ArgumentParser(
        description="Component-level visual comparison via agent-browser",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python3 scripts/compare_components.py --brand quantium-com-au --page homepage --base-url http://localhost:5173\n"
            "  python3 scripts/compare_components.py --brand quantium-com-au --page homepage --base-url http://localhost:5173 "
            "--original-url https://quantium.com\n"
        ),
    )
    parser.add_argument("--brand", required=True, help="Brand slug (e.g. quantium-com-au)")
    parser.add_argument("--page", default="homepage", help="Page name (default: homepage)")
    parser.add_argument("--base-url", required=True, help="Base URL of the running replica (e.g. http://localhost:5173)")
    parser.add_argument("--original-url", help="Override the original site URL (auto-detected from cache metadata)")
    parser.add_argument("--output", help="Output JSON path (default: cache/brand/screenshots/component-compare/page/component-comparison.json)")

    args = parser.parse_args()
    run(
        brand=args.brand,
        page=args.page,
        base_url=args.base_url,
        original_url=args.original_url,
        output_path=args.output,
    )


if __name__ == "__main__":
    main()
