"""Pattern fidelity dimension.

Runs the 9 mechanically-measurable signals from pattern_extractor.py against
the brand's design tokens. The current rubric scores by the proportion of
signals that produce non-SKIPPED (HIGH/MEDIUM/LOW) confidence — i.e. how many
signals we could measure at all.

A future revision (Phase 2.x) should diff source-vs-replica signals; until
then we measure 'how many of the 9 we have evidence for'.

Tolerance interpretation pinned for Phase 1:
    in_tolerance = signal.confidence != "SKIPPED"
"""

from __future__ import annotations

import sys
from pathlib import Path

from eval_rubric import BrandContext, Dimension, DimensionResult, register

# Allow `import pattern_extractor` regardless of cwd.
_SCRIPTS_DIR = Path(__file__).resolve().parent.parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))


def _compute_signals(tokens: dict, screenshot: Path | None) -> dict:
    import pattern_extractor as pe  # local import: heavy

    spacing = tokens.get("spacing", {}) or {}
    typography = tokens.get("typography", {}) or {}
    borders = tokens.get("borders", {}) or {}
    shadows = tokens.get("shadows", []) or []
    transitions = tokens.get("transitions", []) or []
    colours = tokens.get("colours", {}) or {}

    signals = {}
    signals["spacing_rhythm"] = pe.signal_spacing_rhythm(spacing)
    signals["type_scale_ratio"] = pe.signal_type_scale(typography)

    screenshot_str = str(screenshot) if (screenshot and Path(screenshot).exists()) else None
    if screenshot_str:
        signals["component_density"] = pe.signal_component_density(screenshot_str)
        signals["alignment_grid"] = pe.signal_alignment_grid(screenshot_str)
        signals["cta_placement"] = pe.signal_cta_placement(screenshot_str)
    else:
        signals["component_density"] = {"ratio": None, "label": None, "confidence": "SKIPPED"}
        signals["alignment_grid"] = {"columns": None, "gutter_px": None, "confidence": "SKIPPED"}
        signals["cta_placement"] = {"region": None, "above_fold": None, "confidence": "SKIPPED"}

    signals["border_radius_language"] = pe.signal_border_radius(borders)
    signals["shadow_elevation"] = pe.signal_shadow_elevation(shadows)
    signals["motion_language"] = pe.signal_motion_language(transitions)
    signals["color_temperature"] = pe.signal_color_temperature(colours)

    return signals


def run(ctx: BrandContext) -> DimensionResult:
    tokens = ctx.design_tokens
    if not tokens:
        return DimensionResult(
            name="pattern_fidelity",
            score=0.0,
            threshold=0.78,
            weight=0.10,
            status="skipped",
            details={"reason": "design-tokens.json missing or empty"},
        )

    # Use the homepage harness screenshot if available (gives us density/grid/CTA).
    screenshot = ctx.original_screenshots.get("homepage")

    try:
        signals = _compute_signals(tokens, screenshot)
    except Exception as exc:  # noqa: BLE001
        return DimensionResult(
            name="pattern_fidelity",
            score=0.0,
            threshold=0.78,
            weight=0.10,
            status="fail",
            details={"error": f"{type(exc).__name__}: {exc}"},
        )

    in_tolerance = 0
    per_signal: dict[str, str] = {}
    for name, sig in signals.items():
        conf = (sig or {}).get("confidence", "SKIPPED")
        per_signal[name] = conf
        if conf and conf != "SKIPPED":
            in_tolerance += 1

    total = len(signals)
    score = in_tolerance / total if total else 0.0

    return DimensionResult(
        name="pattern_fidelity",
        score=score,
        threshold=0.78,
        weight=0.10,
        status="",
        details={
            "signals_in_tolerance": in_tolerance,
            "signals_total": total,
            "screenshot_used": str(screenshot) if screenshot else None,
            "per_signal_confidence": per_signal,
            "note": "Phase 1: tolerance == non-SKIPPED. Phase 2 will diff source vs replica.",
        },
    )


register(Dimension(
    name="pattern_fidelity",
    weight=0.10,
    threshold=0.78,
    critical_fail_at=0.39,
    runner=run,
))
