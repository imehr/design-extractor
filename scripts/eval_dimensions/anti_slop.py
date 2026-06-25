"""Anti-slop dimension (Phase 2.3).

Runs scripts/anti_slop_lint.py against the brand's generated replica directory
under ui/app/brands/<slug>/replica/, whitelisting any pattern that also appears
in the source DOM extraction (so faithfully replicating a brand that uses, say,
Inter for display doesn't count against the score).

Scoring:
  score = 1.0                      if violation_count == 0
  score = max(0, 1 - count/20)     otherwise   (each violation costs 5%)
  status = "pass" if score >= threshold (1.0), else "fail"
"""

from __future__ import annotations

from pathlib import Path

from eval_rubric import BrandContext, Dimension, DimensionResult, register

# scripts/ is already on sys.path when eval_rubric runs.
from anti_slop_lint import lint_brand


_REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _resolve_paths(slug: str) -> tuple[Path, Path, Path]:
    brand_dir = _REPO_ROOT / "brands" / slug
    replica_dir = _REPO_ROOT / "ui" / "app" / "brands" / slug / "replica"
    source_dom_dir = Path.home() / ".claude" / "design-library" / "cache" / slug / "dom-extraction"
    return brand_dir, replica_dir, source_dom_dir


def run(ctx: BrandContext) -> DimensionResult:
    brand_dir, replica_dir, source_dom_dir = _resolve_paths(ctx.slug)

    if not replica_dir.exists():
        return DimensionResult(
            name="anti_slop",
            score=1.0,
            threshold=1.0,
            weight=0.05,
            status="skipped",
            details={
                "reason": "replica directory not found",
                "replica_dir": str(replica_dir),
            },
        )

    report = lint_brand(
        slug=ctx.slug,
        brand_dir=brand_dir,
        replica_dir=replica_dir,
        source_dom_dir=source_dom_dir,
    )
    count = report["violation_count"]

    if count == 0:
        score = 1.0
    else:
        score = max(0.0, 1.0 - count / 20.0)

    rules_triggered = sorted({v["rule"] for v in report["violations"]})

    return DimensionResult(
        name="anti_slop",
        score=score,
        threshold=1.0,
        weight=0.05,
        status="pass" if score >= 1.0 else "fail",
        details={
            "violation_count": count,
            "rules_triggered": rules_triggered,
            "files_scanned": report["files_scanned"],
            "whitelist_applied": report["whitelist_applied"],
        },
    )


register(Dimension(
    name="anti_slop",
    weight=0.05,
    threshold=1.0,
    critical_fail_at=0.5,
    runner=run,
))
