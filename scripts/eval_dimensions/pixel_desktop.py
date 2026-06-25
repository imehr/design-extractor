"""Desktop pixel fidelity dimension.

Score = pixelmatch exact-match percentage averaged across all paired pages
captured by run_validation_loop.py at 1280x720.

We reuse the existing harness screenshots in
  ~/.claude/design-library/cache/<slug>/screenshots/harness/{orig,repl}-<page>.png
to keep this dimension cheap and apples-to-apples with the legacy report.

The legacy report stores `close` (threshold=0.3). We expose BOTH `exact` and
`close` in details so the legacy comparison stays meaningful. The dimension
SCORE is exact-based per the rubric §3 spec.
"""

from __future__ import annotations

from pathlib import Path

from eval_rubric import BrandContext, Dimension, DimensionResult, register


def _pixelmatch_pair(orig_path: Path, repl_path: Path) -> dict:
    """Return {exact, close, dims} or {error}. Lazy-imports Pillow/pixelmatch."""
    try:
        from PIL import Image
        from pixelmatch import pixelmatch
    except ImportError as exc:
        return {"error": f"missing dependency: {exc}"}

    try:
        orig = Image.open(orig_path).convert("RGBA")
        repl = Image.open(repl_path).convert("RGBA")
        if orig.size != repl.size:
            repl = repl.resize(orig.size, Image.Resampling.LANCZOS)
        w, h = orig.size
        total = w * h
        o_bytes = orig.tobytes()
        r_bytes = repl.tobytes()
        mismatch_exact = pixelmatch(o_bytes, r_bytes, w, h, threshold=0.1, includeAA=False)
        mismatch_close = pixelmatch(o_bytes, r_bytes, w, h, threshold=0.3, includeAA=False)
        return {
            "exact": round((1.0 - mismatch_exact / total) * 100, 1),
            "close": round((1.0 - mismatch_close / total) * 100, 1),
            "dims": f"{w}x{h}",
        }
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def run(ctx: BrandContext) -> DimensionResult:
    pages: dict[str, dict] = {}
    exact_pcts: list[float] = []
    close_pcts: list[float] = []

    page_slugs = set(ctx.original_screenshots) & set(ctx.replica_screenshots)

    if not page_slugs:
        return DimensionResult(
            name="pixel_desktop",
            score=0.0,
            threshold=0.85,
            weight=0.25,
            status="skipped",
            details={"reason": "no paired harness screenshots found"},
        )

    for slug in sorted(page_slugs):
        out = _pixelmatch_pair(
            ctx.original_screenshots[slug],
            ctx.replica_screenshots[slug],
        )
        pages[slug] = out
        if "exact" in out:
            exact_pcts.append(out["exact"])
            close_pcts.append(out["close"])

    if not exact_pcts:
        return DimensionResult(
            name="pixel_desktop",
            score=0.0,
            threshold=0.85,
            weight=0.25,
            status="fail",
            details={"reason": "all pixelmatch comparisons errored", "pages": pages},
        )

    exact_avg = sum(exact_pcts) / len(exact_pcts)
    close_avg = sum(close_pcts) / len(close_pcts)
    score = exact_avg / 100.0

    return DimensionResult(
        name="pixel_desktop",
        score=score,
        threshold=0.85,
        weight=0.25,
        status="",  # let runner classify
        details={
            "viewport": "1280x720",
            "exact_avg_pct": round(exact_avg, 1),
            "close_avg_pct": round(close_avg, 1),
            "exact_pct": score * 100.0,
            "page_count": len(exact_pcts),
            "pages": pages,
        },
    )


register(Dimension(
    name="pixel_desktop",
    weight=0.25,
    threshold=0.85,
    critical_fail_at=0.42,
    runner=run,
))
