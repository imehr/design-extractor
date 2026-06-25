#!/usr/bin/env python3
"""
Design Extractor — Validation Harness
Captures screenshots, compares originals vs replicas, scores them,
and outputs an improvement manifest for agents to act on.

Usage:
    python scripts/run_validation_loop.py --brand westpac-com-au --base-url http://localhost:3000

This script:
1. Captures original page screenshots via agent-browser
2. Captures replica page screenshots via agent-browser
3. Runs pixel comparison
4. Writes updated validation report
5. Outputs improvement manifest (what to fix next)
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from improvement_job import sync_metadata_with_report
from proc_utils import run_capture

try:
    from PIL import Image
    from pixelmatch import pixelmatch
except ImportError:
    print("Missing dependencies: pip install Pillow pixelmatch")
    sys.exit(1)

# Viewports captured for both extraction (section rhythm / container gutters)
# and validation (per-viewport screenshot averages). Kept as a single constant
# so tests can override it (monkeypatch VIEWPORTS) without touching the runner.
VIEWPORTS = [
    {"name": "desktop", "width": 1280, "height": 720},
    {"name": "tablet", "width": 1024, "height": 768},
    {"name": "mobile", "width": 375, "height": 812},
]


def close_agent_browser_session(session: str) -> None:
    """Best-effort cleanup for validation capture sessions.

    Uses run_capture so a wedged ``close`` (e.g. talking to a hung Chrome)
    cannot itself deadlock the harness.
    """
    try:
        run_capture(
            ["agent-browser", "close", "--session", session],
            timeout=10,
        )
    except Exception:
        pass


def load_pages(brand_slug: str) -> dict:
    """Load page configs from cache/{slug}/validation/pages.json, or fall back to defaults."""
    pages_file = Path.home() / ".claude" / "design-library" / "cache" / brand_slug / "validation" / "pages.json"
    if pages_file.exists():
        with open(pages_file) as f:
            return json.load(f)
    # Legacy fallback for westpac
    if brand_slug == "westpac-com-au":
        return {
            "homepage": {"original_url": "https://www.westpac.com.au/", "replica_route": "/brands/westpac-com-au/replica"},
            "credit-cards": {"original_url": "https://www.westpac.com.au/personal-banking/credit-cards/", "replica_route": "/brands/westpac-com-au/replica/credit-cards"},
            "contact-us": {"original_url": "https://www.westpac.com.au/contact-us/", "replica_route": "/brands/westpac-com-au/replica/contact-us"},
            "home-loans": {"original_url": "https://www.westpac.com.au/personal-banking/home-loans/", "replica_route": "/brands/westpac-com-au/replica/home-loans"},
            "bank-accounts": {"original_url": "https://www.westpac.com.au/personal-banking/bank-accounts/", "replica_route": "/brands/westpac-com-au/replica/bank-accounts"},
        }
    print(f"Error: No pages.json found at {pages_file}")
    sys.exit(1)


def run_agent_browser(url: str, output_path: str, session: str = "harness", wait_secs: int = 3, full_page: bool = False, headed: bool = False, viewport: dict | None = None) -> bool:
    """Capture a screenshot using agent-browser (open + wait + screenshot).

    ``viewport`` (``{width, height}``) overrides the default 1280×720 capture
    size so original + replica can be compared at matching dimensions.
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    vw = viewport.get("width", 1280) if viewport else 1280
    vh = viewport.get("height", 720) if viewport else 720
    try:
        # Step 1: Navigate to URL
        open_cmd = ["agent-browser", "open", url, "--session", session]
        if headed:
            open_cmd.append("--headed")
        nav = run_capture(open_cmd, timeout=30)
        if nav.returncode != 0:
            reason = "timed out" if nav.returncode == -1 else (nav.stderr or "").strip()
            print(f"  agent-browser open error: {reason}")
            return False

        # Step 1b: Set explicit viewport size so scores are deterministic.
        run_capture(
            ["agent-browser", "eval", "--session", session,
             f"page.setViewportSize({{width: {vw}, height: {vh}}})"],
            timeout=10,
        )

        # Step 2: Wait for page to settle
        time.sleep(wait_secs)

        # Step 3: Take screenshot (full page for display, viewport for comparison)
        shot_cmd = ["agent-browser", "screenshot", output_path, "--session", session]
        if full_page:
            shot_cmd.append("--full")
        shot = run_capture(shot_cmd, timeout=15)
        if shot.returncode != 0:
            reason = "timed out" if shot.returncode == -1 else (shot.stderr or "").strip()
            print(f"  agent-browser screenshot error: {reason}")
            return False

        return Path(output_path).exists()
    except FileNotFoundError:
        print("  agent-browser not found in PATH")
        return False
    finally:
        close_agent_browser_session(session)


def compare_screenshots(orig_path: str, repl_path: str) -> dict:
    """Compare two screenshots using pixelmatch. Returns score dict."""
    try:
        orig = Image.open(orig_path).convert("RGBA")
        repl = Image.open(repl_path).convert("RGBA")

        if orig.size != repl.size:
            repl = repl.resize(orig.size, Image.Resampling.LANCZOS)

        width, height = orig.size
        total = width * height

        mismatch = pixelmatch(
            orig.tobytes(),
            repl.tobytes(),
            width,
            height,
            threshold=0.1,
            includeAA=False,
        )

        exact_pct = round((1.0 - mismatch / total) * 100, 1)

        # Close match: threshold=0.3 (more lenient)
        mismatch_close = pixelmatch(
            orig.tobytes(),
            repl.tobytes(),
            width,
            height,
            threshold=0.3,
            includeAA=False,
        )
        close_pct = round((1.0 - mismatch_close / total) * 100, 1)

        return {
            "exact": exact_pct,
            "close": close_pct,
            "dims": f"{width}x{height}",
            "total_pixels": total,
            "status": "ok",
        }
    except Exception as e:
        return {"exact": 0.0, "close": 0.0, "error": str(e), "status": "error"}


def _viewport_suffix(viewport: dict | None) -> str:
    """Desktop keeps the legacy no-suffix path (manifest/UI consumers rely on it);
    tablet/mobile get a ``-{name}`` suffix so captures never collide."""
    if not viewport:
        return ""
    name = str(viewport.get("name", "")).strip()
    if not name or name == "desktop":
        return ""
    return f"-{name}"


def capture_all_pages(base_url: str, pages: dict, skip_originals: bool = False, headed: bool = False, viewport: dict | None = None) -> dict:
    """Capture original and replica screenshots for all pages.
    Both original and replica are captured as full-page screenshots
    so the UI displays the complete implementation, not just the viewport.
    """
    results = {}
    suffix = _viewport_suffix(viewport)

    for slug, config in pages.items():
        print(f"\n--- {slug}{suffix} ---")
        orig_path = str(SCREENSHOT_DIR / f"orig-{slug}{suffix}.png")
        repl_path = str(SCREENSHOT_DIR / f"repl-{slug}{suffix}.png")

        # Capture original (full page)
        if skip_originals and Path(orig_path).exists():
            print(f"  Original: skipped (exists)")
            orig_ok = True
        else:
            print(f"  Capturing original: {config['original_url']}")
            orig_ok = run_agent_browser(config["original_url"], orig_path, session=f"orig-{slug}{suffix}-{int(time.time())}", wait_secs=5, full_page=True, headed=headed, viewport=viewport)
            print(f"  Original: {'ok' if orig_ok else 'FAILED'}")

        # Capture replica (full page)
        replica_url = f"{base_url}{config['replica_route']}"
        print(f"  Capturing replica: {replica_url}")
        repl_ok = run_agent_browser(replica_url, repl_path, session=f"repl-{slug}{suffix}-{int(time.time())}", wait_secs=3, full_page=True, viewport=viewport)
        print(f"  Replica: {'ok' if repl_ok else 'FAILED'}")

        results[slug] = {
            "original": orig_path if orig_ok else None,
            "replica": repl_path if repl_ok else None,
        }

    return results


def average_score(scores: dict) -> float:
    """Mean ``close`` percentage across pages (0.0 when empty)."""
    if not scores:
        return 0.0
    return round(sum(s.get("close", 0.0) for s in scores.values()) / len(scores), 1)


def run_viewport_validation(base_url: str, pages: dict, viewport: dict, skip_originals: bool = True, headed: bool = False) -> dict:
    """Capture + score a single viewport. Returns the per-page scores dict."""
    captures = capture_all_pages(base_url, pages, skip_originals=skip_originals, headed=headed, viewport=viewport)
    missing = missing_capture_pages(captures)
    if missing:
        print(f"\nViewport {viewport.get('name')}: missing screenshots for {', '.join(missing)}")
        return {slug: {"exact": 0.0, "close": 0.0, "status": "missing_screenshot"} for slug in pages}
    return score_all_pages(captures)


def score_all_pages(captures: dict) -> dict:
    """Run pixel comparison on all captured page pairs."""
    scores = {}
    for slug, paths in captures.items():
        if paths["original"] and paths["replica"]:
            print(f"  Scoring {slug}...")
            scores[slug] = compare_screenshots(paths["original"], paths["replica"])
        else:
            scores[slug] = {"exact": 0.0, "close": 0.0, "status": "missing_screenshot"}
    return scores


def missing_capture_pages(captures: dict) -> list[str]:
    missing: list[str] = []
    for slug, paths in captures.items():
        if not paths.get("original") or not paths.get("replica"):
            missing.append(slug)
    return missing


def build_improvement_manifest(scores: dict, target: float = 80.0) -> dict:
    """Build a manifest listing pages that need improvement, sorted worst-first."""
    pages_needing_work = []
    for slug, score in scores.items():
        close_pct = score.get("close", 0.0)
        if close_pct < target:
            pages_needing_work.append({
                "slug": slug,
                "current_score": close_pct,
                "target_score": target,
                "gap": round(target - close_pct, 1),
                "original_screenshot": str(SCREENSHOT_DIR / f"orig-{slug}.png"),
                "replica_screenshot": str(SCREENSHOT_DIR / f"repl-{slug}.png"),
                "replica_tsx": f"ui/app/brands/{CACHE_DIR.name}/replica/{slug}/page.tsx"
                if slug != "homepage"
                else f"ui/app/brands/{CACHE_DIR.name}/replica/page.tsx",
            })

    pages_needing_work.sort(key=lambda p: p["current_score"])

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target_score": target,
        "pages_needing_work": pages_needing_work,
        "pages_passing": [
            slug for slug, s in scores.items() if s.get("close", 0.0) >= target
        ],
        "average_score": round(
            sum(s.get("close", 0.0) for s in scores.values()) / len(scores), 1
        )
        if scores
        else 0.0,
    }


def update_validation_report(per_viewport_avgs: dict, desktop_scores: dict | None = None) -> None:
    """Update report.json with per-viewport averages.

    Writes a ``<name>_avg`` key for every viewport in ``per_viewport_avgs``
    (e.g. ``desktop_avg``/``tablet_avg``/``mobile_avg``). The screenshot gate
    and metadata sync still anchor on the desktop average for back-compat.
    ``desktop_scores`` optionally supplies per-page desktop scores for the
    legacy ``pixel_comparison_viewport`` block.
    """
    report = {}
    if REPORT_PATH.exists():
        with open(REPORT_PATH) as f:
            report = json.load(f)

    for name, avg in (per_viewport_avgs or {}).items():
        report[f"{name}_avg"] = avg
    if "desktop_avg" in report:
        report["viewport_avg"] = report["desktop_avg"]  # back-compat alias

    if desktop_scores is not None:
        report["pixel_comparison_viewport"] = {
            slug: {"close": s.get("close", 0.0)} for slug, s in desktop_scores.items()
        }

    avg = report.get("desktop_avg", 0.0)

    # Update the screenshot_comparison gate
    if "gates" not in report:
        report["gates"] = {}
    report["gates"]["screenshot_comparison"] = {
        "pass": avg >= 70.0,
        "value": f"desktop avg {avg}%",
        "per_page": {slug: f"{s.get('close', 0.0)}%" for slug, s in (desktop_scores or {}).items()},
    }

    # Recount passing gates
    passing = sum(1 for g in report.get("gates", {}).values() if g.get("pass", False))
    total = len(report.get("gates", {}))
    report["gates_passing"] = passing
    report["gates_total"] = total
    report["overall_status"] = f"{passing}/{total} GATES PASS"
    report["timestamp"] = datetime.now(timezone.utc).isoformat()

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nReport updated: {REPORT_PATH}")

    # Sync score to metadata.json and library index.json
    score_01 = round(avg / 100, 3)
    meta_path = BRANDS_DIR / "metadata.json"
    if meta_path.exists():
        with open(meta_path) as f:
            meta = json.load(f)
        meta["overall_score"] = score_01
        meta["validation_status"] = report["overall_status"]
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

    idx_path = Path.home() / ".claude" / "design-library" / "index.json"
    if idx_path.exists():
        with open(idx_path) as f:
            idx = json.load(f)
        for b in idx.get("brands", []):
            if b.get("slug") == CACHE_DIR.name:
                b["overall_score"] = score_01
        with open(idx_path, "w") as f:
            json.dump(idx, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Validation Harness")
    parser.add_argument("--brand", default="westpac-com-au", help="Brand slug")
    parser.add_argument("--base-url", default="http://localhost:5173", help="Dev server base URL")
    parser.add_argument("--target", type=float, default=80.0, help="Target score percentage")
    parser.add_argument("--skip-originals", action="store_true", help="Skip re-capturing originals if they exist")
    parser.add_argument("--headed", action="store_true", help="Use headed browser for sites with bot detection")
    parser.add_argument("--score-only", action="store_true", help="Only re-score existing screenshots")
    args = parser.parse_args()

    # Set paths based on brand slug
    global CACHE_DIR, BRANDS_DIR, SCREENSHOT_DIR, REPORT_PATH, MANIFEST_PATH
    CACHE_DIR = Path.home() / ".claude" / "design-library" / "cache" / args.brand
    BRANDS_DIR = Path.home() / ".claude" / "design-library" / "brands" / args.brand
    SCREENSHOT_DIR = CACHE_DIR / "screenshots" / "harness"
    REPORT_PATH = BRANDS_DIR / "validation" / "report.json"
    MANIFEST_PATH = CACHE_DIR / "validation" / "improvement-manifest.json"

    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    pages = load_pages(args.brand)

    if args.score_only:
        print("Re-scoring existing screenshots...")
        # score-only reuses the existing desktop screenshots (canonical paths).
        captures = {}
        for slug in pages:
            orig = SCREENSHOT_DIR / f"orig-{slug}.png"
            repl = SCREENSHOT_DIR / f"repl-{slug}.png"
            captures[slug] = {
                "original": str(orig) if orig.exists() else None,
                "replica": str(repl) if repl.exists() else None,
            }
        missing_pages = missing_capture_pages(captures)
        if missing_pages:
            print(f"\nValidation aborted: missing screenshots for {', '.join(missing_pages)}")
            return 2
        desktop_scores = score_all_pages(captures)
        avgs = {"desktop": average_score(desktop_scores)}
    else:
        print(f"Capturing screenshots (base: {args.base_url})...")
        avgs: dict[str, float] = {}
        desktop_scores: dict = {}
        for viewport in VIEWPORTS:
            print(f"\n=== Viewport: {viewport['name']} ({viewport['width']}x{viewport['height']}) ===")
            vp_scores = run_viewport_validation(
                args.base_url, pages, viewport,
                skip_originals=args.skip_originals, headed=args.headed,
            )
            avgs[viewport["name"]] = average_score(vp_scores)
            if viewport["name"] == "desktop":
                desktop_scores = vp_scores

    scores = desktop_scores

    print("\n=== Scoring (desktop) ===")
    for slug, score in sorted(scores.items(), key=lambda x: x[1].get("close", 0)):
        status = "PASS" if score.get("close", 0) >= args.target else "FAIL"
        print(f"  {slug:20s}  {score.get('close', 0):5.1f}%  [{status}]")

    avg = avgs.get("desktop", 0.0)
    print(f"\n  {'AVERAGE':20s}  {avg:5.1f}%")
    for name in ("desktop", "tablet", "mobile"):
        if name in avgs:
            print(f"  {name + '_avg':20s}  {avgs[name]:5.1f}%")

    # Write manifest (desktop scores; manifest references orig-<slug>.png paths)
    manifest = build_improvement_manifest(scores, target=args.target)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest: {MANIFEST_PATH}")

    # Update report with every viewport average.
    update_validation_report(avgs, desktop_scores)
    if (BRANDS_DIR / "metadata.json").exists():
        sync_metadata_with_report(BRANDS_DIR / "metadata.json", REPORT_PATH)

    # Additive: run the EVAL rubric and write rubric-report.json alongside
    # the legacy report. Failure here MUST NOT block the legacy pipeline.
    try:
        import eval_rubric  # noqa: WPS433  (defer import — keeps legacy path clean)
        ctx = eval_rubric.load_brand_context(args.brand, base_url=args.base_url)
        rubric_report = eval_rubric.run_rubric(ctx)
        rubric_path = BRANDS_DIR / "validation" / "rubric-report.json"
        rubric_path.parent.mkdir(parents=True, exist_ok=True)
        with open(rubric_path, "w") as f:
            json.dump(rubric_report.to_dict(), f, indent=2)
        print(f"Rubric: {rubric_path}  (overall={rubric_report.overall_status} "
              f"weighted_total={rubric_report.weighted_total:.3f})")
    except Exception as exc:  # noqa: BLE001
        print(f"Rubric run failed (non-fatal): {type(exc).__name__}: {exc}")

    # Summary
    if manifest["pages_needing_work"]:
        print(f"\n{len(manifest['pages_needing_work'])} pages need improvement:")
        for p in manifest["pages_needing_work"]:
            print(f"  {p['slug']:20s}  {p['current_score']:5.1f}%  (gap: {p['gap']}pt)")
    else:
        print(f"\nAll pages at or above {args.target}%!")

    return 0 if not manifest["pages_needing_work"] else 1


if __name__ == "__main__":
    sys.exit(main())
