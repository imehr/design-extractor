"""Pixel fidelity (mobile) — Phase 2.1 dimension.

Per docs/plans/2026-05-14-extraction-quality-and-design-md-overhaul.md §2 row 2.1
and §3 rubric:

    | Pixel fidelity (mobile) | pixelmatch at 375×667 | exact ≥80% | 0.15 |

Captures fresh screenshots of every paired (original, replica) page at the
mobile viewport via the `agent-browser` CLI, runs pixelmatch at threshold=0.1
(exact match), and averages exact-match percentages across pages.

Cache layout (re-used across runs to keep this dimension cheap):
    /tmp/eval/<slug>/<page>-orig-mobile.png
    /tmp/eval/<slug>/<page>-replica-mobile.png
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from eval_rubric import BrandContext, Dimension, DimensionResult, register
from eval_dimensions.pixel_desktop import _pixelmatch_pair


VIEWPORT_W = 375
VIEWPORT_H = 667
SESSION = "eval-pixel-mobile"
DEFAULT_BASE_URL = "https://design-extractor.localhost"


def _have_agent_browser() -> bool:
    return shutil.which("agent-browser") is not None


def _ab(args: list[str], timeout: int = 90) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["agent-browser", "--session", SESSION, *args],
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def _capture(url: str, out_path: Path) -> dict:
    """Screenshot `url` at 375x667 into `out_path`. Returns {ok|error}.

    Reuses cached file if it already exists.
    """
    if out_path.exists() and out_path.stat().st_size > 0:
        return {"ok": True, "cached": True}
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # Set viewport, then open, then screenshot. agent-browser keeps state per --session.
    r = _ab(["set", "viewport", str(VIEWPORT_W), str(VIEWPORT_H)])
    if r.returncode != 0:
        return {"error": f"set viewport failed: {r.stderr.strip()[:200]}"}
    # open() may exit non-zero on slow pages while the DOM is fully usable;
    # the screenshot call is the real success signal so we don't bail here.
    _ab(["open", url], timeout=120)
    # Re-assert viewport (open can sometimes reset it on first run)
    _ab(["set", "viewport", str(VIEWPORT_W), str(VIEWPORT_H)])
    _ab(["wait", "1500"], timeout=10)
    r = _ab(["screenshot", str(out_path)], timeout=60)
    if r.returncode != 0:
        return {"error": f"screenshot failed: {r.stderr.strip()[:200]}"}
    if not out_path.exists():
        return {"error": "screenshot returned ok but file missing"}
    return {"ok": True, "cached": False}


def run(ctx: BrandContext) -> DimensionResult:
    if not _have_agent_browser():
        return DimensionResult(
            name="pixel_mobile", score=0.0, threshold=0.80, weight=0.15,
            status="skipped",
            details={"reason": "agent-browser CLI not on PATH", "viewport": f"{VIEWPORT_W}x{VIEWPORT_H}"},
        )

    if not ctx.pages_config:
        return DimensionResult(
            name="pixel_mobile", score=0.0, threshold=0.80, weight=0.15,
            status="skipped",
            details={"reason": "no pages_config (validation/pages.json missing)", "viewport": f"{VIEWPORT_W}x{VIEWPORT_H}"},
        )

    base_url = (ctx.base_url or DEFAULT_BASE_URL).rstrip("/")
    cache_root = Path("/tmp/eval") / ctx.slug

    pages: dict[str, dict] = {}
    exact_pcts: list[float] = []

    # Only score against pages that already have a desktop harness pair — that
    # keeps the dimension apples-to-apples with pixel_desktop and avoids
    # screenshotting 100+ pages.
    target_slugs = sorted(
        s for s in ctx.pages_config
        if s in ctx.original_screenshots and s in ctx.replica_screenshots
    )
    if not target_slugs:
        target_slugs = sorted(ctx.pages_config.keys())[:5]  # fallback: first 5

    skipped_404: list[str] = []
    for page_slug in target_slugs:
        page = ctx.pages_config.get(page_slug) or {}
        original_url = page.get("original_url")
        replica_route = page.get("replica_route")
        if not original_url or not replica_route:
            pages[page_slug] = {"error": "missing original_url or replica_route"}
            continue
        replica_url = base_url + replica_route

        orig_out = cache_root / f"{page_slug}-orig-mobile.png"
        repl_out = cache_root / f"{page_slug}-replica-mobile.png"

        orig_res = _capture(original_url, orig_out)
        if "error" in orig_res:
            pages[page_slug] = {"original": orig_res}
            continue
        repl_res = _capture(replica_url, repl_out)
        if "error" in repl_res:
            # Graceful 404 handling: replica route missing -> skip
            if "404" in (repl_res.get("error") or "") or "Not Found" in (repl_res.get("error") or ""):
                skipped_404.append(page_slug)
            pages[page_slug] = {"replica": repl_res}
            continue

        cmp_out = _pixelmatch_pair(orig_out, repl_out)
        pages[page_slug] = cmp_out
        if "exact" in cmp_out:
            exact_pcts.append(cmp_out["exact"])

    # Best-effort cleanup: close session browser so we don't leak processes.
    try:
        _ab(["close"], timeout=15)
    except Exception:
        pass

    if not exact_pcts:
        return DimensionResult(
            name="pixel_mobile", score=0.0, threshold=0.80, weight=0.15,
            status="fail",
            details={
                "reason": "no successful pixelmatch comparisons",
                "viewport": f"{VIEWPORT_W}x{VIEWPORT_H}",
                "skipped_404": skipped_404,
                "pages": pages,
            },
        )

    exact_avg = sum(exact_pcts) / len(exact_pcts)
    return DimensionResult(
        name="pixel_mobile",
        score=exact_avg / 100.0,
        threshold=0.80, weight=0.15, status="",
        details={
            "viewport": f"{VIEWPORT_W}x{VIEWPORT_H}",
            "exact_avg_pct": round(exact_avg, 1),
            "page_count": len(exact_pcts),
            "skipped_404": skipped_404,
            "pages": pages,
        },
    )


register(Dimension(
    name="pixel_mobile",
    weight=0.15,
    threshold=0.80,
    critical_fail_at=0.40,
    runner=run,
))
