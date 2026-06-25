#!/usr/bin/env python3
"""
EVAL Rubric Framework — extensible multi-dimensional brand replica scoring.

This module is the Phase-1.3 scaffold for the EVAL refactor in
docs/plans/2026-05-14-extraction-quality-and-design-md-overhaul.md (§3).

Existing pixel/pattern/component/asset checks slot in as dimensions today;
Phase-2 dimensions (mobile/tablet/interactive/font) attach by registering
additional Dimension entries — no changes to this file required.

Cache invalidation (P4.1):
  Replica TSX/CSS edits under ui/app/brands/<slug>/replica/** auto-bust
  the /tmp/eval/<slug>/*-replica-*.png cache via a sha256 marker file
  (.replica-hash). Originals (*-orig-*.png) are preserved across busts.
  Pass --fresh to nuke the entire /tmp/eval/<slug>/ directory (forces full
  recapture of originals AND replicas — use when the source site changed).

Stable output schema (rubric-report.json):
  {
    "schema_version": "1.0",
    "slug": "<brand-slug>",
    "generated_at": "<iso8601>",
    "weighted_total": <float 0..1>,
    "critical_fail": <bool>,
    "overall_status": "pass" | "fail",
    "dimensions": [
      {
        "name": "pixel_desktop",
        "score": 0.876,
        "threshold": 0.85,
        "weight": 0.25,
        "status": "pass" | "fail" | "critical" | "skipped",
        "details": { ... },          # dimension-specific, additive-only
      },
      ...
    ]
  }

The dimensions list is emitted in registry order (stable for Phase-2.4 UI).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import traceback
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

SCHEMA_VERSION = "1.0"


@dataclass
class BrandContext:
    """Inputs every dimension runner receives.

    Paths are absolute. Screenshot dicts map page-slug -> Path.
    """
    slug: str
    brand_dir: Path
    cache_dir: Path
    design_tokens: dict
    original_screenshots: dict[str, Path] = field(default_factory=dict)
    replica_screenshots: dict[str, Path] = field(default_factory=dict)
    # Optional helpers (additive — adding fields here must not break dimensions)
    pages_config: dict = field(default_factory=dict)
    base_url: Optional[str] = None


@dataclass
class DimensionResult:
    name: str
    score: float          # 0..1
    threshold: float      # 0..1
    weight: float
    status: str           # "pass" | "fail" | "critical" | "skipped"
    details: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "score": round(float(self.score), 4),
            "threshold": self.threshold,
            "weight": self.weight,
            "status": self.status,
            "details": self.details,
        }


@dataclass
class Dimension:
    name: str
    weight: float
    threshold: float
    critical_fail_at: float
    runner: Callable[[BrandContext], DimensionResult]


@dataclass
class RubricReport:
    slug: str
    dimensions: list[DimensionResult]
    weighted_total: float
    critical_fail: bool
    overall_status: str
    generated_at: str

    def to_dict(self) -> dict:
        return {
            "schema_version": SCHEMA_VERSION,
            "slug": self.slug,
            "generated_at": self.generated_at,
            "weighted_total": round(self.weighted_total, 4),
            "critical_fail": self.critical_fail,
            "overall_status": self.overall_status,
            "dimensions": [d.to_dict() for d in self.dimensions],
        }


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

DIMENSIONS: list[Dimension] = []

# The default rubric: every report must list all 9 dimensions. If a module
# fails to import (or a runner never registers), the report still carries a
# "skipped" placeholder — dimensions never silently disappear.
# Order matches eval_dimensions/__init__.py import order (stable schema order).
# weight/threshold mirror each module's registration so placeholder rows stay
# informative; skipped rows are excluded from aggregation regardless.
DEFAULT_DIMENSION_SPECS: dict[str, tuple[float, float]] = {
    # name: (weight, threshold)
    "pixel_desktop": (0.25, 0.85),
    "component_completeness": (0.10, 0.85),
    "pattern_fidelity": (0.10, 0.78),
    "asset_fidelity": (0.05, 1.00),
    "anti_slop": (0.05, 1.00),
    "pixel_mobile": (0.15, 0.80),
    "pixel_tablet": (0.10, 0.82),
    "interactive_state": (0.10, 0.80),
    "font_rendering": (0.10, 1.00),
}

DEFAULT_DIMENSION_NAMES: list[str] = list(DEFAULT_DIMENSION_SPECS.keys())


def register(dim: Dimension) -> None:
    """Add a Dimension to the global registry (idempotent by name)."""
    for i, existing in enumerate(DIMENSIONS):
        if existing.name == dim.name:
            DIMENSIONS[i] = dim
            return
    DIMENSIONS.append(dim)


def reset_registry() -> None:
    """For tests."""
    DIMENSIONS.clear()


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def ensure_default_dimension_results(
    results: list[DimensionResult],
) -> list[DimensionResult]:
    """Guarantee every default dimension appears exactly once in the report.

    Any default dimension missing from `results` (module import failure,
    registry reset, partial registration) is appended as status="skipped"
    with an explicit reason. Non-default extra dimensions are preserved.
    """
    present = {r.name for r in results}
    completed = list(results)
    for name, (weight, threshold) in DEFAULT_DIMENSION_SPECS.items():
        if name in present:
            continue
        completed.append(
            DimensionResult(
                name=name,
                score=0.0,
                threshold=threshold,
                weight=weight,
                status="skipped",
                details={
                    "reason": (
                        "dimension not registered — eval_dimensions module "
                        "missing or failed to import"
                    ),
                },
            )
        )
    return completed


def _classify(score: float, threshold: float, critical_fail_at: float) -> str:
    if score < critical_fail_at:
        return "critical"
    if score < threshold:
        return "fail"
    return "pass"


# ---------------------------------------------------------------------------
# Replica cache invalidation (P4.1)
# ---------------------------------------------------------------------------

# Repo root inferred from this file: scripts/eval_rubric.py -> repo root.
_REPO_ROOT = Path(__file__).resolve().parent.parent
_REPLICA_SOURCE_EXTS = {".tsx", ".ts", ".css"}  # ".module.css" matches via ".css"


def _replica_source_root(slug: str) -> Path:
    return _REPO_ROOT / "ui" / "app" / "brands" / slug / "replica"


def replica_hash(slug: str) -> str:
    """Stable sha256 over (relative_path, mtime_ns, size) for every replica
    source file (*.tsx, *.ts, *.css, *.module.css) under
    ui/app/brands/<slug>/replica/. Returns the first 16 hex chars.

    Returns "0" * 16 if the replica directory does not exist.
    """
    root = _replica_source_root(slug)
    if not root.exists() or not root.is_dir():
        return "0" * 16

    entries: list[tuple[str, int, int]] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        # ".module.css" ends with ".css"; ".tsx"/".ts"/".css" cover the set.
        if path.suffix not in _REPLICA_SOURCE_EXTS:
            continue
        try:
            st = path.stat()
        except OSError:
            continue
        rel = path.relative_to(root).as_posix()
        entries.append((rel, st.st_mtime_ns, st.st_size))

    entries.sort(key=lambda e: e[0])
    h = hashlib.sha256()
    for rel, mtime_ns, size in entries:
        h.update(f"{rel}\0{mtime_ns}\0{size}\n".encode("utf-8"))
    return h.hexdigest()[:16]


def cache_dir_for(slug: str) -> Path:
    return Path("/tmp/eval") / slug


def ensure_cache_valid(slug: str, hash_now: str) -> bool:
    """Check the /tmp/eval/<slug>/.replica-hash marker against hash_now.

    Returns True if the cache is valid (marker present and equal). Otherwise
    deletes every *-replica-*.png file under the cache dir (recursively),
    writes hash_now to the marker file, and returns False. Original (*-orig-*)
    captures are preserved — they don't depend on replica edits.
    """
    cache = cache_dir_for(slug)
    marker = cache / ".replica-hash"

    if marker.exists():
        try:
            existing = marker.read_text().strip()
        except OSError:
            existing = ""
        if existing == hash_now:
            return True

    # Bust: remove *-replica-*.png files anywhere under the cache dir.
    if cache.exists():
        for png in cache.rglob("*-replica-*.png"):
            try:
                png.unlink()
            except OSError:
                pass

    cache.mkdir(parents=True, exist_ok=True)
    try:
        marker.write_text(hash_now)
    except OSError:
        pass
    return False


def run_rubric(ctx: BrandContext) -> RubricReport:
    """Execute every registered dimension and aggregate results.

    Failure isolation: if a runner raises, that dimension is marked status='fail'
    with score=0 and details.error set. One bad dimension never kills the run.

    Aggregation:
      weighted_total = sum(score*weight) / sum(weight) over NON-skipped dimensions.
      critical_fail  = any NON-skipped dimension where score < critical_fail_at.
      overall_status = "pass" if weighted_total >= 0.85 and not critical_fail else "fail".
    """
    results: list[DimensionResult] = []

    # P4.1: invalidate stale replica screenshots BEFORE dimensions run.
    try:
        h_now = replica_hash(ctx.slug)
        valid = ensure_cache_valid(ctx.slug, h_now)
        if valid:
            print("replica cache: valid", file=sys.stderr)
        else:
            print(
                "replica cache: BUSTED (replica TSX changed since last run)",
                file=sys.stderr,
            )
    except Exception as exc:  # noqa: BLE001
        print(f"replica cache: check failed ({exc!r})", file=sys.stderr)

    # Import side-effects: ensure dimensions are registered. Safe to import here
    # (after this module's classes are defined) to avoid circular import.
    try:
        import eval_dimensions  # noqa: F401  (registers via side-effect)
    except ImportError as exc:
        # Allow running with an externally-populated DIMENSIONS list (tests).
        # Missing default dimensions still surface as "skipped" rows below.
        print(
            f"eval_dimensions import failed ({exc}); "
            "unregistered default dimensions will be reported as skipped",
            file=sys.stderr,
        )

    for dim in DIMENSIONS:
        try:
            res = dim.runner(ctx)
            # Defensive: ensure the runner stamped weight/threshold/name correctly.
            res.name = res.name or dim.name
            res.weight = dim.weight
            res.threshold = dim.threshold
            # If the runner did NOT set a status, classify it now.
            if res.status not in {"pass", "fail", "critical", "skipped"}:
                res.status = _classify(res.score, dim.threshold, dim.critical_fail_at)
        except Exception as exc:  # noqa: BLE001
            res = DimensionResult(
                name=dim.name,
                score=0.0,
                threshold=dim.threshold,
                weight=dim.weight,
                status="fail",
                details={
                    "error": f"{type(exc).__name__}: {exc}",
                    "trace": traceback.format_exc().splitlines()[-5:],
                },
            )
        results.append(res)

    # The report JSON must always list all 9 default dimensions — wired or
    # skipped, never absent (WS1, eval wiring).
    results = ensure_default_dimension_results(results)

    active = [r for r in results if r.status != "skipped"]
    total_weight = sum(r.weight for r in active)
    weighted_total = (
        sum(r.score * r.weight for r in active) / total_weight if total_weight > 0 else 0.0
    )

    critical_fail = any(
        r.score < _critical_fail_threshold(r.name) for r in active
    )
    overall = "pass" if weighted_total >= 0.85 and not critical_fail else "fail"

    return RubricReport(
        slug=ctx.slug,
        dimensions=results,
        weighted_total=weighted_total,
        critical_fail=critical_fail,
        overall_status=overall,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def _critical_fail_threshold(name: str) -> float:
    """Lookup critical_fail_at by dimension name from the registry."""
    for d in DIMENSIONS:
        if d.name == name:
            return d.critical_fail_at
    return 0.0


def report_to_dict(report: RubricReport) -> dict:
    return report.to_dict()


# ---------------------------------------------------------------------------
# BrandContext loader
# ---------------------------------------------------------------------------

def load_brand_context(slug: str, base_url: Optional[str] = None) -> BrandContext:
    """Build a BrandContext from the standard library layout.

    Standard layout:
      ~/.claude/design-library/brands/<slug>/
        design-tokens.json
        dom-extraction/
        validation/report.json
      ~/.claude/design-library/cache/<slug>/
        screenshots/harness/{orig,repl}-<page>.png
        validation/pages.json
    """
    root = Path.home() / ".claude" / "design-library"
    brand_dir = root / "brands" / slug
    cache_dir = root / "cache" / slug

    tokens_path = brand_dir / "design-tokens.json"
    tokens: dict = {}
    if tokens_path.exists():
        try:
            tokens = json.loads(tokens_path.read_text())
        except Exception:
            tokens = {}

    pages_config = {}
    pages_file = cache_dir / "validation" / "pages.json"
    if pages_file.exists():
        try:
            pages_config = json.loads(pages_file.read_text())
        except Exception:
            pages_config = {}

    shot_dir = cache_dir / "screenshots" / "harness"
    originals: dict[str, Path] = {}
    replicas: dict[str, Path] = {}
    if shot_dir.exists():
        for f in shot_dir.iterdir():
            if not f.is_file() or f.suffix.lower() != ".png":
                continue
            stem = f.stem
            if stem.startswith("orig-"):
                originals[stem[len("orig-"):]] = f
            elif stem.startswith("repl-"):
                replicas[stem[len("repl-"):]] = f

    return BrandContext(
        slug=slug,
        brand_dir=brand_dir,
        cache_dir=cache_dir,
        design_tokens=tokens,
        original_screenshots=originals,
        replica_screenshots=replicas,
        pages_config=pages_config,
        base_url=base_url,
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _print_summary(report: RubricReport) -> None:
    name_w = max((len(d.name) for d in report.dimensions), default=12)
    bar = "-" * (name_w + 50)
    print(bar)
    print(f"  {'DIMENSION':<{name_w}}  SCORE   THR     WT     STATUS")
    print(bar)
    for d in report.dimensions:
        print(
            f"  {d.name:<{name_w}}  "
            f"{d.score:5.3f}   "
            f"{d.threshold:4.2f}    "
            f"{d.weight:4.2f}   "
            f"{d.status.upper()}"
        )
    print(bar)
    print(
        f"  weighted_total = {report.weighted_total:.3f}    "
        f"critical_fail = {report.critical_fail}    "
        f"overall = {report.overall_status.upper()}"
    )
    print(bar)


def main() -> int:
    ap = argparse.ArgumentParser(description="Run the EVAL rubric on a brand.")
    ap.add_argument("--slug", required=True, help="Brand slug")
    ap.add_argument("--base-url", default=None, help="Optional dev server base URL")
    ap.add_argument(
        "--output",
        default=None,
        help="Optional override for the rubric-report.json path",
    )
    ap.add_argument(
        "--fresh",
        action="store_true",
        help=(
            "Nuke /tmp/eval/<slug>/ before running — forces full recapture of "
            "both originals and replicas. Use when the source site changed."
        ),
    )
    args = ap.parse_args()

    if args.fresh:
        target = cache_dir_for(args.slug)
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)
            print(f"--fresh: removed {target}", file=sys.stderr)
        else:
            print(f"--fresh: nothing to remove at {target}", file=sys.stderr)

    ctx = load_brand_context(args.slug, base_url=args.base_url)
    if not ctx.brand_dir.exists():
        print(f"Error: brand directory not found: {ctx.brand_dir}")
        return 2

    report = run_rubric(ctx)
    _print_summary(report)

    out_path = (
        Path(args.output)
        if args.output
        else ctx.brand_dir / "validation" / "rubric-report.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report.to_dict(), indent=2))
    print(f"\nrubric-report.json -> {out_path}")
    return 0 if report.overall_status == "pass" else 1


if __name__ == "__main__":
    # When run as `python scripts/eval_rubric.py`, this module's identity is
    # `__main__` — but `eval_dimensions/*` import `from eval_rubric import ...`,
    # which creates a SECOND copy of this module with its own (empty) DIMENSIONS.
    # Solution: ensure `scripts/` is on sys.path, then import `eval_rubric` by
    # name to alias the canonical module, register dimensions there, and run
    # against THAT registry.
    _here = Path(__file__).resolve().parent
    if str(_here) not in sys.path:
        sys.path.insert(0, str(_here))

    import importlib
    _canonical = importlib.import_module("eval_rubric")
    # Side-effect import of dimensions registers everything on _canonical.
    importlib.import_module("eval_dimensions")
    # Run via the canonical module's entry point so it uses canonical DIMENSIONS.
    sys.exit(_canonical.main())
