#!/usr/bin/env python3
"""Run a filesystem-backed improvement job for a brand."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

from improvement_job import (
    append_feedback_entry,
    build_claude_improvement_prompt,
    build_assisted_capture_steps,
    build_model_provider_command,
    detect_block_reason,
    detect_validation_failure,
    derive_effective_score,
    load_json,
    make_job_state,
    model_provider_label,
    now_iso,
    read_recent_feedback_entries,
    read_active_model_provider,
    sync_metadata_with_report,
    update_job_state,
)


def _read_brand_best_score(metadata_path: Path) -> float | None:
    """Read the brand's current best score from metadata.json."""
    meta = load_json(metadata_path, default={}) or {}
    score = meta.get("overall_score")
    if isinstance(score, (int, float)):
        return round(float(score), 3)
    return None


def _snapshot_replica(brand_dir: Path, snapshot_dir: Path) -> bool:
    """Copy the replica directory to a snapshot location. Returns True on success."""
    replica_dir = brand_dir / "replica"
    if not replica_dir.exists():
        return False
    if snapshot_dir.exists():
        shutil.rmtree(snapshot_dir)
    shutil.copytree(replica_dir, snapshot_dir)
    return True


def _restore_replica(brand_dir: Path, snapshot_dir: Path) -> bool:
    """Restore replica files from a snapshot. Returns True on success."""
    replica_dir = brand_dir / "replica"
    if not snapshot_dir.exists():
        return False
    if replica_dir.exists():
        shutil.rmtree(replica_dir)
    shutil.copytree(snapshot_dir, replica_dir)
    return True


def run_validation(
    *,
    repo_root: Path,
    brand: str,
    base_url: str,
    target: float,
    skip_originals: bool,
) -> subprocess.CompletedProcess[str]:
    cmd = [
        sys.executable,
        str(repo_root / "scripts" / "run_validation_loop.py"),
        "--brand",
        brand,
        "--base-url",
        base_url,
        "--target",
        str(target),
    ]
    if skip_originals:
        cmd.append("--skip-originals")
    return subprocess.run(cmd, capture_output=True, text=True, cwd=repo_root)


def _load_rubric_report(brand: str) -> dict | None:
    """Load the current rubric-report.json for a brand, if present."""
    path = (
        Path.home()
        / ".claude"
        / "design-library"
        / "brands"
        / brand
        / "validation"
        / "rubric-report.json"
    )
    return load_json(path, default=None)


def _run_rubric_subprocess(repo_root: Path, brand: str, timeout_s: int = 300) -> bool:
    """Re-run eval_rubric.py for a brand. Returns True if it completed cleanly."""
    try:
        result = subprocess.run(
            [
                sys.executable,
                str(repo_root / "scripts" / "eval_rubric.py"),
                "--slug",
                brand,
            ],
            capture_output=True,
            text=True,
            cwd=repo_root,
            timeout=timeout_s,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return False


def _compute_rubric_delta(
    *,
    iteration: int,
    before: dict | None,
    after: dict | None,
) -> dict | None:
    """Build a rubric_delta entry comparing two rubric reports."""
    if not isinstance(before, dict) or not isinstance(after, dict):
        return None
    before_total = before.get("weighted_total")
    after_total = after.get("weighted_total")
    before_dims = {
        d.get("name"): d.get("score")
        for d in (before.get("dimensions") or [])
        if isinstance(d, dict)
    }
    after_dims = {
        d.get("name"): d.get("score")
        for d in (after.get("dimensions") or [])
        if isinstance(d, dict)
    }
    rows = []
    for name in sorted(set(before_dims) | set(after_dims)):
        b = before_dims.get(name)
        a = after_dims.get(name)
        delta = None
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            delta = round(a - b, 4)
        rows.append({"name": name, "before": b, "after": a, "delta": delta})
    return {
        "iteration": iteration,
        "weighted_total_before": before_total,
        "weighted_total_after": after_total,
        "dimensions": rows,
    }


def _summarize_rubric_delta(delta: dict) -> str:
    """One-line stdout summary of a rubric delta."""
    wt_b = delta.get("weighted_total_before")
    wt_a = delta.get("weighted_total_after")
    wt_d = None
    if isinstance(wt_a, (int, float)) and isinstance(wt_b, (int, float)):
        wt_d = wt_a - wt_b
    movers = [
        d
        for d in delta.get("dimensions", [])
        if isinstance(d.get("delta"), (int, float)) and abs(d["delta"]) >= 0.005
    ]
    movers.sort(key=lambda d: -abs(d["delta"]))
    top = ", ".join(
        f"{d['name']} {d['delta']:+.2f}" for d in movers[:3]
    ) or "no significant movers"
    wt_b_s = f"{wt_b:.2f}" if isinstance(wt_b, (int, float)) else "?"
    wt_a_s = f"{wt_a:.2f}" if isinstance(wt_a, (int, float)) else "?"
    wt_d_s = f"{wt_d:+.2f}" if isinstance(wt_d, (int, float)) else "?"
    return (
        f"iter {delta.get('iteration')}: weighted {wt_b_s} -> {wt_a_s} "
        f"(Δ {wt_d_s}) — top movers: {top}"
    )


def _is_unusable_model_output(output_text: str) -> bool:
    """Detect CLI success responses that actually mean no model was configured."""
    normalized = output_text.strip().lower()
    return normalized in {"llm not set", "model not set"} or "llm not set" in normalized


def run_model_improver(
    *,
    repo_root: Path,
    brand: str,
    target: float,
    current_score: float | None,
    report_path: Path,
    manifest_path: Path,
    pages: list[dict[str, object]],
    feedback: dict[str, object],
    timeout_s: int,
    log_path: Path,
    component_issues: str = "",
    rubric_report: dict | None = None,
) -> dict[str, object]:
    provider = read_active_model_provider()
    provider_label = model_provider_label(provider)
    recent_feedback = read_recent_feedback_entries(
        repo_root / "state" / "learning" / "feedback-log.jsonl",
        brand,
    )
    prompt = build_claude_improvement_prompt(
        brand=brand,
        target_score=target,
        current_score=current_score,
        report_path=report_path,
        manifest_path=manifest_path,
        pages=pages,
        inline_feedback=feedback,
        recent_feedback=recent_feedback,
        component_issues=component_issues,
        rubric_report=rubric_report,
    )
    try:
        cmd = build_model_provider_command(provider, prompt, repo_root=repo_root)
    except Exception as exc:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(f"{provider_label} command could not be built: {exc}\n")
        return {
            "ok": False,
            "status": "needs_operator_review",
            "detail": f"{provider_label} command could not be built: {exc}",
            "summary": None,
            "log_path": str(log_path),
            "provider": provider_label,
        }

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=repo_root,
            timeout=timeout_s,
        )
    except FileNotFoundError:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(f"{provider_label} command was not found on PATH: {cmd[0]}\n")
        return {
            "ok": False,
            "status": "needs_operator_review",
            "detail": f"{provider_label} command was not found on PATH: {cmd[0]}",
            "summary": None,
            "log_path": str(log_path),
            "provider": provider_label,
        }
    except subprocess.TimeoutExpired:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(f"{provider_label} improvement step timed out.\n")
        return {
            "ok": False,
            "status": "needs_operator_review",
            "detail": f"{provider_label} improvement timed out after {timeout_s} seconds.",
            "summary": None,
            "log_path": str(log_path),
            "provider": provider_label,
        }

    output_text = "\n".join(
        part for part in (result.stdout, result.stderr) if part
    ).strip()
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(output_text + ("\n" if output_text else ""))

    if result.returncode != 0:
        return {
            "ok": False,
            "status": "needs_operator_review",
            "detail": output_text
            or f"{provider_label} improvement failed with exit code {result.returncode}.",
            "summary": None,
            "log_path": str(log_path),
            "provider": provider_label,
        }

    if _is_unusable_model_output(output_text):
        return {
            "ok": False,
            "status": "needs_operator_review",
            "detail": (
                f"{provider_label} did not run because its CLI reported: "
                f"{output_text or 'LLM not set'}."
            ),
            "summary": output_text or None,
            "log_path": str(log_path),
            "provider": provider_label,
        }

    return {
        "ok": True,
        "status": "running",
        "detail": None,
        "summary": output_text or f"{provider_label} applied a refinement pass.",
        "log_path": str(log_path),
        "provider": provider_label,
    }


def run_claude_improver(**kwargs) -> dict[str, object]:
    """Backward-compatible wrapper for tests and callers using the old name."""
    return run_model_improver(**kwargs)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run an improvement job for a brand.")
    parser.add_argument("--brand", required=True, help="Brand slug")
    parser.add_argument(
        "--base-url",
        default="https://design-extractor.localhost",
        help="UI base URL (portless-managed default; override for non-portless setups)",
    )
    parser.add_argument(
        "--target", type=float, default=80.0, help="Target validation score"
    )
    parser.add_argument(
        "--max-iterations", type=int, default=5, help="Maximum validation iterations"
    )
    parser.add_argument(
        "--claude-timeout",
        type=int,
        default=900,
        help="Timeout in seconds for each model refinement pass",
    )
    parser.add_argument(
        "--model-timeout",
        type=int,
        default=None,
        help="Timeout in seconds for each model refinement pass",
    )
    parser.add_argument(
        "--skip-claude",
        action="store_true",
        help="Run validation iterations without invoking the selected model for repairs",
    )
    parser.add_argument(
        "--skip-model",
        action="store_true",
        help="Run validation iterations without invoking the selected model for repairs",
    )
    parser.add_argument("--job-id", default=None, help="Optional precomputed job id")
    parser.add_argument(
        "--feedback-json", default=None, help="Optional JSON feedback payload"
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    brand_cache = Path.home() / ".claude" / "design-library" / "cache" / args.brand
    brand_dir = Path.home() / ".claude" / "design-library" / "brands" / args.brand
    jobs_dir = brand_cache / "jobs"
    jobs_dir.mkdir(parents=True, exist_ok=True)

    job_id = args.job_id or uuid.uuid4().hex[:12]
    feedback = json.loads(args.feedback_json) if args.feedback_json else {}
    job_path = jobs_dir / f"{job_id}.json"

    state = make_job_state(
        job_id=job_id,
        brand=args.brand,
        target_score=args.target,
        base_url=args.base_url,
        status="running",
        max_iterations=args.max_iterations,
        feedback=feedback,
    )
    update_job_state(job_path, state)

    if feedback:
        append_feedback_entry(
            repo_root / "state" / "learning" / "feedback-log.jsonl",
            {"brand": args.brand, "job_id": job_id, "feedback": feedback},
        )

    report_path = brand_dir / "validation" / "report.json"
    metadata_path = brand_dir / "metadata.json"
    manifest_path = brand_cache / "validation" / "improvement-manifest.json"
    snapshot_dir = brand_cache / ".snapshot"

    # Seed history from the brand's current best score so new jobs
    # compare against the best-known state rather than starting blind.
    brand_best_score = _read_brand_best_score(metadata_path)
    history: list[float] = []
    if brand_best_score is not None:
        history.append(brand_best_score)

    for iteration in range(1, args.max_iterations + 1):
        # Snapshot replica before validation so we can roll back if score drops.
        _snapshot_replica(brand_dir, snapshot_dir)
        update_job_state(job_path, state, current_iteration=iteration)
        result = run_validation(
            repo_root=repo_root,
            brand=args.brand,
            base_url=args.base_url,
            target=args.target,
            # Reuse cached originals when present. The validation runner still
            # captures originals that are missing, so fresh brands bootstrap
            # normally while existing brands avoid brittle source-site recapture.
            skip_originals=True,
        )

        output_text = "\n".join(part for part in (result.stdout, result.stderr) if part)
        blocked_reason = detect_block_reason(output_text)
        if blocked_reason:
            update_job_state(
                job_path,
                state,
                status="assisted_capture_required",
                blocked_reason=blocked_reason,
                assisted_capture_steps=build_assisted_capture_steps(args.brand),
            )
            return 0

        validation_failure = detect_validation_failure(output_text)
        if result.returncode != 0 and validation_failure:
            update_job_state(
                job_path,
                state,
                status="failed",
                blocked_reason=validation_failure,
            )
            return 1

        report = load_json(report_path, default={}) or {}
        manifest = load_json(manifest_path, default={}) or {}
        if not report and not manifest and result.returncode != 0:
            update_job_state(
                job_path,
                state,
                status="failed",
                blocked_reason={
                    "code": "validation_failed",
                    "detail": output_text.strip()
                    or "Validation failed before producing artifacts.",
                },
            )
            return 1
        metadata = (
            sync_metadata_with_report(metadata_path, report_path)
            if report_path.exists() and metadata_path.exists()
            else load_json(metadata_path, default={}) or {}
        )

        score = derive_effective_score(metadata, report)
        if score is not None:
            history.append(score)

        # Compare against brand best, not just the previous iteration.
        # Require gain to exceed pixelmatch noise floor (σ ≈ 0.009) — anything
        # smaller is re-render jitter, not real improvement. See
        # docs/plans/2026-04-22-improvement-loop-diagnosis.md.
        NOISE_FLOOR = 0.01
        if score is not None and brand_best_score is not None:
            if score > brand_best_score + NOISE_FLOOR:
                kept = True
                status_label = "improved"
            elif score > brand_best_score - NOISE_FLOOR:
                kept = False
                status_label = "noise"
            else:
                kept = False
                status_label = "regressed"
        elif score is not None and brand_best_score is None:
            # First-ever score for this brand.
            kept = True
            status_label = "improved"
        else:
            kept = False
            status_label = "unknown"

        # If score did not improve, restore the snapshot so we don't
        # degrade the replica files.
        if not kept and snapshot_dir.exists():
            _restore_replica(brand_dir, snapshot_dir)

        # Update brand_best_score when we have a strict improvement.
        if kept and score is not None:
            brand_best_score = score

        experiments_path = repo_root / "state" / "learning" / "experiments.jsonl"
        append_feedback_entry(
            experiments_path,
            {
                "brand": args.brand,
                "job_id": job_id,
                "iteration": iteration,
                "score_before": brand_best_score if not kept else (history[-2] if len(history) >= 2 else None),
                "score_after": score,
                "kept": kept,
                "status": status_label,
                "timestamp": now_iso(),
            },
        )

        score_direction = "same"
        if len(history) >= 2:
            if history[-1] > history[-2]:
                score_direction = "increased"
            elif history[-1] < history[-2]:
                score_direction = "decreased"

        state["history"] = history
        update_job_state(
            job_path,
            state,
            current_score=score,
            score_direction=score_direction,
            pages_needing_work=manifest.get("pages_needing_work", []),
            manifest_path=str(manifest_path),
            report_path=str(report_path),
        )

        pages_needing_work = manifest.get("pages_needing_work", [])
        meets_target = score is not None and score * 100 >= args.target

        if not pages_needing_work or meets_target:
            update_job_state(job_path, state, status="completed")
            return 0

        # Stall detection: 3-iteration window with spread below the noise floor
        # means the loop is thrashing inside re-render jitter — stop wasting
        # model runs. See docs/plans/2026-04-22-improvement-loop-diagnosis.md.
        if len(history) >= 3:
            window = history[-3:]
            if max(window) - min(window) < 0.01:
                update_job_state(job_path, state, status="stalled")
                return 0

        if iteration >= args.max_iterations:
            break

        if args.skip_claude or args.skip_model:
            continue

        # Run component validation once per iteration before the model call.
        # This avoids running it inside the prompt builder where it added
        # 2+ minutes to the subprocess timeout budget.
        comp_issues = ""
        worst_page_slug = (
            pages_needing_work[0].get("slug", "") if pages_needing_work else ""
        )
        if worst_page_slug:
            comp_report_path = jobs_dir / f"{job_id}-components-iter-{iteration}.json"
            try:
                comp_result = subprocess.run(
                    [
                        sys.executable,
                        str(repo_root / "scripts" / "component_validator.py"),
                        "--brand",
                        args.brand,
                        "--page",
                        worst_page_slug,
                        "--base-url",
                        args.base_url,
                        "--output",
                        str(comp_report_path),
                    ],
                    capture_output=True,
                    text=True,
                    timeout=120,
                    cwd=repo_root,
                )
                if comp_result.returncode == 0 and comp_report_path.exists():
                    comp_data = json.loads(comp_report_path.read_text())
                    for comp in comp_data.get("components", []):
                        if comp.get("issues"):
                            comp_issues += (
                                f"\n- {comp['heading']}"
                                f" ({comp.get('pixel_score', 0)}%):\n"
                            )
                            for issue in comp["issues"][:3]:
                                comp_issues += f"  - {issue}\n"
            except (subprocess.TimeoutExpired, Exception):
                pass  # component validation is best-effort

        # Snapshot rubric report BEFORE the model call so we can compute a
        # per-iteration delta after the next rubric run.
        rubric_before = _load_rubric_report(args.brand)

        model_timeout = args.model_timeout or args.claude_timeout
        model_result = run_model_improver(
            repo_root=repo_root,
            brand=args.brand,
            target=args.target,
            current_score=score,
            report_path=report_path,
            manifest_path=manifest_path,
            pages=pages_needing_work,
            feedback=feedback,
            timeout_s=model_timeout,
            log_path=jobs_dir / f"{job_id}-model-iter-{iteration}.log",
            component_issues=comp_issues,
            rubric_report=rubric_before,
        )
        update_job_state(
            job_path,
            state,
            status=str(model_result["status"]),
            last_model_summary=model_result.get("summary"),
            model_log_path=model_result.get("log_path"),
            model_provider=model_result.get("provider"),
            last_claude_summary=model_result.get("summary"),
            claude_log_path=model_result.get("log_path"),
        )

        # After a successful iteration, re-run the rubric and record the delta.
        if model_result["ok"]:
            if _run_rubric_subprocess(repo_root, args.brand, timeout_s=300):
                rubric_after = _load_rubric_report(args.brand)
                delta = _compute_rubric_delta(
                    iteration=iteration,
                    before=rubric_before,
                    after=rubric_after,
                )
                if delta is not None:
                    rubric_deltas = list(state.get("rubric_deltas") or [])
                    rubric_deltas.append(delta)
                    update_job_state(job_path, state, rubric_deltas=rubric_deltas)
                    print(_summarize_rubric_delta(delta), flush=True)

        if not model_result["ok"]:
            update_job_state(
                job_path,
                state,
                blocked_reason={
                    "code": "model_improver_failed",
                    "detail": str(model_result["detail"]),
                },
            )
            return 0

    update_job_state(job_path, state, status="max_iterations_reached")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
