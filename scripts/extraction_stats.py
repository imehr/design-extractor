#!/usr/bin/env python3
"""Aggregate stats across brands, phase events, and improvement experiments.

Usage:
    python3 scripts/extraction_stats.py               # summary
    python3 scripts/extraction_stats.py --brand <slug>  # per-brand detail
    python3 scripts/extraction_stats.py --json          # machine-readable

Reads (no writes):
    ~/.claude/design-library/brands/*/metadata.json
    ~/.claude/design-library/cache/<slug>/jobs/*.json
    <repo>/state/learning/experiments.jsonl
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

# Allow `python3 scripts/extraction_stats.py` from repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import telemetry  # noqa: E402

# Success thresholds — burned in per spec.
SUCCESS_THRESHOLD = 0.85  # extraction success
PARTIAL_THRESHOLD = 0.70  # extraction "acceptable"

# Canonical phase ordering for the per-phase duration table.
PHASE_ORDER = ["0", "0.5", "1", "2", "3", "4", "5", "5b", "6", "7", "8", "9"]


# ── Core aggregation ────────────────────────────────────────────────────

def _is_phase_event(ev: dict) -> bool:
    """True only for events emitted by telemetry.write_phase_event.

    The cache/<slug>/jobs/ directory historically also holds files from
    improvement_job.py (no `phase` field, status like "stalled"). We must
    ignore those — they're a different schema.
    """
    phase = ev.get("phase")
    status = ev.get("status")
    if not phase or not isinstance(phase, str):
        return False
    return status in ("started", "completed", "failed")


def _phase_durations(events: list[dict]) -> dict[str, list[float]]:
    """Collect duration_s values per phase from a single brand's events."""
    out: dict[str, list[float]] = defaultdict(list)
    for ev in events:
        if not _is_phase_event(ev):
            continue
        if ev.get("status") != "completed":
            continue
        d = ev.get("duration_s")
        if d is None:
            continue
        out[str(ev["phase"])].append(float(d))
    return out


def _phase_failures(events: list[dict]) -> dict[str, int]:
    """Count phases where a 'started' event lacks a matching 'completed'.

    A phase is counted as failed if:
      - it has an explicit "failed" status event, OR
      - it has a "started" event with no later "completed" event for the
        same phase id.
    """
    # events arrive in chronological order from telemetry.read_all_phase_events.
    failures: dict[str, int] = defaultdict(int)
    # Track open "started" counts per phase — every completed decrements it.
    open_starts: dict[str, int] = defaultdict(int)
    for ev in events:
        if not _is_phase_event(ev):
            continue
        phase = str(ev["phase"])
        status = ev.get("status")
        if status == "started":
            open_starts[phase] += 1
        elif status == "completed":
            if open_starts[phase] > 0:
                open_starts[phase] -= 1
        elif status == "failed":
            failures[phase] += 1
            if open_starts[phase] > 0:
                open_starts[phase] -= 1
    # Any still-open start is an implicit failure (crash, sys.exit, kill).
    for phase, count in open_starts.items():
        if count > 0:
            failures[phase] += count
    return failures


def _percentile(values: list[float], p: float) -> float:
    """Nearest-rank percentile. `p` in [0, 100]. Safe on tiny lists."""
    if not values:
        return 0.0
    if len(values) == 1:
        return float(values[0])
    # statistics.quantiles with n=100 and method="inclusive" is close enough.
    sorted_vals = sorted(values)
    k = max(0, min(len(sorted_vals) - 1, int(round((p / 100) * (len(sorted_vals) - 1)))))
    return float(sorted_vals[k])


def collect_summary() -> dict[str, Any]:
    """Build the summary payload across every brand."""
    brands = telemetry.read_all_brands()
    experiments = telemetry.read_experiments()

    # Score buckets.
    scored = [b for b in brands if isinstance(b.get("overall_score"), (int, float))]
    success = [b for b in scored if b["overall_score"] >= SUCCESS_THRESHOLD]
    partial = [b for b in scored if b["overall_score"] >= PARTIAL_THRESHOLD]

    # Aggregate phase durations across all brands.
    per_phase_durations: dict[str, list[float]] = defaultdict(list)
    per_phase_failures: dict[str, int] = defaultdict(int)
    per_phase_runs: dict[str, int] = defaultdict(int)
    for b in brands:
        events = telemetry.read_all_phase_events(b["slug"])
        if not events:
            continue
        for phase, durations in _phase_durations(events).items():
            per_phase_durations[phase].extend(durations)
            per_phase_runs[phase] += len(durations)
        for phase, count in _phase_failures(events).items():
            per_phase_failures[phase] += count

    # Build ordered phase rows. Include any phase we saw even if not in PHASE_ORDER.
    seen_phases = set(per_phase_durations.keys()) | set(per_phase_failures.keys())
    ordered = [p for p in PHASE_ORDER if p in seen_phases]
    ordered += sorted(p for p in seen_phases if p not in PHASE_ORDER)
    phase_rows = []
    for phase in ordered:
        durations = per_phase_durations.get(phase, [])
        phase_rows.append(
            {
                "phase": phase,
                "median": round(statistics.median(durations), 2) if durations else 0.0,
                "p95": round(_percentile(durations, 95), 2),
                "runs": per_phase_runs.get(phase, 0),
                "failures": per_phase_failures.get(phase, 0),
            }
        )

    # Top brands by score.
    top = sorted(scored, key=lambda b: b["overall_score"], reverse=True)[:5]
    top_rows = [
        {"slug": b["slug"], "score": round(float(b["overall_score"]), 3)}
        for b in top
    ]

    # Improvement stats.
    kept = [e for e in experiments if e.get("kept")]
    regressed = [e for e in experiments if not e.get("kept")]
    deltas_kept = []
    for e in kept:
        before = e.get("score_before")
        after = e.get("score_after")
        if isinstance(before, (int, float)) and isinstance(after, (int, float)):
            deltas_kept.append(float(after) - float(before))
    mean_delta_kept = round(statistics.mean(deltas_kept), 4) if deltas_kept else None

    return {
        "brands_total": len(brands),
        "brands_scored": len(scored),
        "brands_success": len(success),
        "brands_partial": len(partial),
        "success_rate": round(len(success) / len(scored), 4) if scored else 0.0,
        "partial_rate": round(len(partial) / len(scored), 4) if scored else 0.0,
        "experiments_total": len(experiments),
        "phase_stats": phase_rows,
        "top_brands": top_rows,
        "improvements": {
            "total": len(experiments),
            "kept": len(kept),
            "regressed": len(regressed),
            "kept_pct": round(len(kept) / len(experiments), 4) if experiments else 0.0,
            "regressed_pct": round(len(regressed) / len(experiments), 4) if experiments else 0.0,
            "mean_delta_kept": mean_delta_kept,
        },
    }


def collect_brand_detail(slug: str) -> dict[str, Any]:
    """Build the per-brand detail payload, or {'error': ...} if unknown."""
    brands = {b["slug"]: b for b in telemetry.read_all_brands()}
    meta = brands.get(slug)
    if meta is None:
        return {"error": f"brand not found: {slug}"}

    events = telemetry.read_all_phase_events(slug)
    # Summarise per-phase outcomes for the history view.
    history: list[dict] = []
    # Pair started/completed events in order of appearance.
    started_stack: dict[str, list[dict]] = defaultdict(list)
    for ev in events:
        if not _is_phase_event(ev):
            continue
        phase = str(ev["phase"])
        status = ev.get("status")
        if status == "started":
            started_stack[phase].append(ev)
        elif status == "completed":
            history.append(
                {
                    "phase": phase,
                    "status": "completed",
                    "duration_s": ev.get("duration_s"),
                }
            )
            if started_stack[phase]:
                started_stack[phase].pop()
        elif status == "failed":
            history.append(
                {"phase": phase, "status": "failed", "duration_s": ev.get("duration_s")}
            )
            if started_stack[phase]:
                started_stack[phase].pop()
    # Any still-open starts were crashes.
    for phase, starts in started_stack.items():
        for _ in starts:
            history.append({"phase": phase, "status": "crashed", "duration_s": None})

    total_wall = sum(
        (h.get("duration_s") or 0.0)
        for h in history
        if h["status"] == "completed"
    )

    # Improvements for this brand.
    experiments = [e for e in telemetry.read_experiments() if e.get("brand") == slug]
    experiments.sort(key=lambda e: (e.get("timestamp") or "", e.get("iteration") or 0))

    return {
        "slug": slug,
        "name": meta.get("name"),
        "source_url": meta.get("source_url"),
        "extracted_at": meta.get("extracted_at"),
        "overall_score": meta.get("overall_score"),
        "phase_history": history,
        "total_wall_s": round(total_wall, 2),
        "experiments": experiments,
    }


# ── Text rendering ──────────────────────────────────────────────────────

def _fmt_duration(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.1f}s"
    minutes = int(seconds // 60)
    rem = seconds - minutes * 60
    return f"{minutes}m {rem:.0f}s"


def render_summary_text(s: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("Design Extractor — Extraction Stats")
    lines.append("=" * 36)
    lines.append("")
    lines.append(f"Brands extracted:             {s['brands_total']}")
    success_pct = s["success_rate"] * 100
    partial_pct = s["partial_rate"] * 100
    lines.append(
        f"Extractions with score>=0.85: {s['brands_success']}   ({success_pct:.1f}%)"
    )
    lines.append(
        f"Extractions with score>=0.70: {s['brands_partial']}   ({partial_pct:.1f}%)"
    )
    lines.append(f"Total improvement iterations: {s['experiments_total']}")
    lines.append("")

    if s["phase_stats"]:
        lines.append("Per-phase duration (median / p95, seconds):")
        lines.append("  Phase  Median   p95     Runs    Failures")
        for row in s["phase_stats"]:
            lines.append(
                f"  {row['phase']:<6} "
                f"{row['median']:<8.1f} "
                f"{row['p95']:<7.1f} "
                f"{row['runs']:<7} "
                f"{row['failures']}"
            )
        lines.append("")
    else:
        lines.append("Per-phase duration: no phase events recorded yet.")
        lines.append("")

    if s["top_brands"]:
        lines.append("Top brands by score:")
        for i, row in enumerate(s["top_brands"], 1):
            lines.append(f"  {i}. {row['slug']:<30} {row['score']:.3f}")
        lines.append("")

    imp = s["improvements"]
    if imp["total"] > 0:
        lines.append("Improvement stats (from experiments.jsonl):")
        lines.append(f"  Total iterations:          {imp['total']}")
        lines.append(
            f"  Kept (score improved):     {imp['kept']}  ({imp['kept_pct'] * 100:.1f}%)"
        )
        lines.append(
            f"  Regressed (score dropped): {imp['regressed']}  ({imp['regressed_pct'] * 100:.1f}%)"
        )
        if imp["mean_delta_kept"] is not None:
            sign = "+" if imp["mean_delta_kept"] >= 0 else ""
            lines.append(
                f"  Mean delta when kept:     {sign}{imp['mean_delta_kept']:.3f}"
            )
    else:
        lines.append("Improvement stats: experiments.jsonl empty or missing.")
    return "\n".join(lines)


def render_brand_text(d: dict[str, Any]) -> str:
    if "error" in d:
        return d["error"]
    lines: list[str] = []
    lines.append(f"Brand: {d['slug']}")
    if d.get("source_url"):
        lines.append(f"Source: {d['source_url']}")
    if d.get("extracted_at"):
        lines.append(f"Extracted: {d['extracted_at']}")
    score = d.get("overall_score")
    if isinstance(score, (int, float)):
        lines.append(f"Overall score: {score:.3f}")
    else:
        lines.append("Overall score: n/a")
    lines.append("")

    if d["phase_history"]:
        lines.append("Phase history:")
        for h in d["phase_history"]:
            dur = h.get("duration_s")
            dur_str = f"{dur:.1f}s" if isinstance(dur, (int, float)) else "--"
            lines.append(f"  Phase {h['phase']:<4} {h['status']:<10} {dur_str}")
        lines.append(f"Total wall-clock time: {_fmt_duration(d['total_wall_s'])}")
    else:
        lines.append("Phase history: no phase events recorded")
    lines.append("")

    exps = d.get("experiments", [])
    if exps:
        lines.append("Improvement iterations:")
        for e in exps:
            before = e.get("score_before")
            after = e.get("score_after")
            before_s = f"{before:.3f}" if isinstance(before, (int, float)) else "null"
            after_s = f"{after:.3f}" if isinstance(after, (int, float)) else "null"
            kept = "kept" if e.get("kept") else "regressed"
            iter_n = e.get("iteration", "?")
            lines.append(f"  #{iter_n}  score: {before_s} -> {after_s}  {kept}")
    else:
        lines.append("Improvement iterations: none")
    return "\n".join(lines)


# ── Entry point ─────────────────────────────────────────────────────────

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Aggregate stats for design-extractor runs.",
    )
    parser.add_argument("--brand", help="Detail view for a single brand slug.")
    parser.add_argument(
        "--json", action="store_true", help="Emit JSON instead of text."
    )
    args = parser.parse_args(argv)

    # Graceful degradation: no brands dir at all.
    if not telemetry.BRANDS_ROOT.exists():
        if args.json:
            print(json.dumps({"brands_total": 0, "note": "no brands extracted yet"}))
        else:
            print("No brands extracted yet.")
        return 0

    if args.brand:
        detail = collect_brand_detail(args.brand)
        if args.json:
            print(json.dumps(detail, indent=2, default=str))
        else:
            print(render_brand_text(detail))
        return 0 if "error" not in detail else 1

    summary = collect_summary()
    if args.json:
        print(json.dumps(summary, indent=2, default=str))
    else:
        print(render_summary_text(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
