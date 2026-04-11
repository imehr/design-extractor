#!/usr/bin/env python3
"""Helpers for improvement jobs, metadata sync, and blocked-site fallback."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path, default: Any = None) -> Any:
    try:
        with path.open() as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        json.dump(payload, f, indent=2)


def derive_effective_score(
    metadata: dict[str, Any] | None,
    report: dict[str, Any] | None,
) -> float | None:
    if report:
        viewport_avg = report.get("viewport_avg")
        if isinstance(viewport_avg, (int, float)):
            return round(float(viewport_avg) / 100.0, 3)
    if metadata:
        score = metadata.get("overall_score")
        if isinstance(score, (int, float)):
            return round(float(score), 3)
    return None


def sync_metadata_with_report(metadata_path: Path, report_path: Path) -> dict[str, Any]:
    metadata = load_json(metadata_path, default={}) or {}
    report = load_json(report_path, default={}) or {}

    viewport_avg = report.get("viewport_avg")
    if isinstance(viewport_avg, (int, float)):
        metadata["overall_score"] = round(float(viewport_avg) / 100.0, 3)

    overall_status = report.get("overall_status")
    if overall_status:
        metadata["validation_status"] = overall_status

    scores = metadata.get("scores")
    if isinstance(scores, dict):
        if isinstance(viewport_avg, (int, float)):
            scores["overall_avg_match"] = round(float(viewport_avg), 1)
        if overall_status:
            scores["status"] = overall_status
        scores["validated_at"] = report.get("timestamp", now_iso())
        metadata["scores"] = scores

    metadata["validated_at"] = report.get("timestamp", now_iso())
    write_json(metadata_path, metadata)
    return metadata


BLOCK_PATTERNS: tuple[tuple[str, str], ...] = (
    ("anti_bot_block", r"access denied"),
    ("anti_bot_block", r"akamai"),
    ("anti_bot_block", r"edgesuite"),
    ("anti_bot_block", r"request unsuccessful"),
    ("anti_bot_block", r"bot detection"),
    ("anti_bot_block", r"temporarily unavailable"),
)


def detect_block_reason(output: str) -> dict[str, str] | None:
    text = output.strip()
    lowered = text.lower()
    for code, pattern in BLOCK_PATTERNS:
        if re.search(pattern, lowered):
            vendor = "Akamai" if "akamai" in lowered or "edgesuite" in lowered else "anti-bot protection"
            return {
                "code": code,
                "detail": f"{vendor} blocked automated browsing; switch to assisted capture mode.",
            }
    return None


def build_assisted_capture_steps(slug: str) -> list[str]:
    return [
        "Retry once with a headed browser to confirm the block is not a headless-only issue.",
        "If the block persists, open the page in your normal browser and capture the target pages manually.",
        f"Save the original screenshots into ~/.claude/design-library/cache/{slug}/screenshots/harness/ using the orig-<page>.png naming pattern.",
        f"Export or copy any DOM measurements and page manifests into ~/.claude/design-library/cache/{slug}/validation/pages.json if they are missing.",
        "Re-run the improvement flow after importing those artifacts so the replica and validation stages can continue without automated source capture.",
    ]


def append_feedback_entry(log_path: Path, entry: dict[str, Any]) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"recorded_at": now_iso(), **entry}
    with log_path.open("a") as f:
        f.write(json.dumps(payload) + "\n")


def make_job_state(
    *,
    job_id: str,
    brand: str,
    target_score: float,
    base_url: str,
    status: str,
    max_iterations: int,
    feedback: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "job_id": job_id,
        "brand": brand,
        "target_score": target_score,
        "base_url": base_url,
        "status": status,
        "max_iterations": max_iterations,
        "current_iteration": 0,
        "current_score": None,
        "pages_needing_work": [],
        "blocked_reason": None,
        "assisted_capture_steps": [],
        "feedback": feedback or {},
        "history": [],
        "updated_at": now_iso(),
    }


def update_job_state(job_path: Path, state: dict[str, Any], **changes: Any) -> dict[str, Any]:
    state.update(changes)
    state["updated_at"] = now_iso()
    write_json(job_path, state)
    return state
