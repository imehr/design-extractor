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
    build_claude_command,
    build_claude_improvement_prompt,
    build_assisted_capture_steps,
    detect_block_reason,
    detect_validation_failure,
    derive_effective_score,
    load_json,
    make_job_state,
    now_iso,
    read_recent_feedback_entries,
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


def run_claude_improver(
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
) -> dict[str, object]:
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
    )
    cmd = build_claude_command(prompt)

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
        log_path.write_text("Claude CLI was not found on PATH.\n")
        return {
            "ok": False,
            "status": "needs_operator_review",
            "detail": "Claude CLI was not found on PATH.",
            "summary": None,
            "log_path": str(log_path),
        }
    except subprocess.TimeoutExpired:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text("Claude improvement step timed out.\n")
        return {
            "ok": False,
            "status": "needs_operator_review",
            "detail": f"Claude improvement timed out after {timeout_s} seconds.",
            "summary": None,
            "log_path": str(log_path),
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
            or f"Claude improvement failed with exit code {result.returncode}.",
            "summary": None,
            "log_path": str(log_path),
        }

    return {
        "ok": True,
        "status": "running",
        "detail": None,
        "summary": output_text or "Claude applied a refinement pass.",
        "log_path": str(log_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run an improvement job for a brand.")
    parser.add_argument("--brand", required=True, help="Brand slug")
    parser.add_argument(
        "--base-url", default="http://localhost:5173", help="UI base URL"
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
        help="Timeout in seconds for each Claude refinement pass",
    )
    parser.add_argument(
        "--skip-claude",
        action="store_true",
        help="Run validation iterations without invoking Claude for repairs",
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
            skip_originals=iteration > 1,
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
        # brand_best_score was seeded from metadata and is updated only
        # when a candidate strictly exceeds it.
        if score is not None and brand_best_score is not None:
            if score > brand_best_score:
                kept = True
                status_label = "improved"
            elif score == brand_best_score:
                kept = False
                status_label = "flat"
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

        if len(history) >= 2 and abs(history[-1] - history[-2]) < 0.001:
            update_job_state(job_path, state, status="stalled")
            return 0

        if iteration >= args.max_iterations:
            break

        if args.skip_claude:
            continue

        # Run component validation once per iteration before the Claude call.
        # This avoids running it inside the prompt builder where it added
        # 2+ minutes to the Claude subprocess timeout budget.
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

        claude_result = run_claude_improver(
            repo_root=repo_root,
            brand=args.brand,
            target=args.target,
            current_score=score,
            report_path=report_path,
            manifest_path=manifest_path,
            pages=pages_needing_work,
            feedback=feedback,
            timeout_s=args.claude_timeout,
            log_path=jobs_dir / f"{job_id}-claude-iter-{iteration}.log",
            component_issues=comp_issues,
        )
        update_job_state(
            job_path,
            state,
            status=str(claude_result["status"]),
            last_claude_summary=claude_result.get("summary"),
            claude_log_path=claude_result.get("log_path"),
        )
        if not claude_result["ok"]:
            update_job_state(
                job_path,
                state,
                blocked_reason={
                    "code": "claude_improver_failed",
                    "detail": str(claude_result["detail"]),
                },
            )
            return 0

    update_job_state(job_path, state, status="max_iterations_reached")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
