#!/usr/bin/env python3
"""Run a filesystem-backed improvement job for a brand."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import uuid
from pathlib import Path

from improvement_job import (
    append_feedback_entry,
    build_assisted_capture_steps,
    detect_block_reason,
    derive_effective_score,
    load_json,
    make_job_state,
    sync_metadata_with_report,
    update_job_state,
)


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


def main() -> int:
    parser = argparse.ArgumentParser(description="Run an improvement job for a brand.")
    parser.add_argument("--brand", required=True, help="Brand slug")
    parser.add_argument("--base-url", default="http://localhost:5173", help="UI base URL")
    parser.add_argument("--target", type=float, default=80.0, help="Target validation score")
    parser.add_argument("--max-iterations", type=int, default=3, help="Maximum validation iterations")
    parser.add_argument("--job-id", default=None, help="Optional precomputed job id")
    parser.add_argument("--feedback-json", default=None, help="Optional JSON feedback payload")
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
    history: list[float] = []

    for iteration in range(1, args.max_iterations + 1):
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

        report = load_json(report_path, default={}) or {}
        manifest = load_json(manifest_path, default={}) or {}
        metadata = sync_metadata_with_report(metadata_path, report_path) if report_path.exists() and metadata_path.exists() else load_json(metadata_path, default={}) or {}

        score = derive_effective_score(metadata, report)
        if score is not None:
            history.append(score)

        state["history"] = history
        update_job_state(
            job_path,
            state,
            current_score=score,
            pages_needing_work=manifest.get("pages_needing_work", []),
            manifest_path=str(manifest_path),
            report_path=str(report_path),
        )

        if not manifest.get("pages_needing_work"):
            update_job_state(job_path, state, status="completed")
            return 0

        if len(history) >= 2 and abs(history[-1] - history[-2]) < 0.001:
            update_job_state(job_path, state, status="stalled")
            return 0

    update_job_state(job_path, state, status="max_iterations_reached")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
