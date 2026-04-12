#!/usr/bin/env python3
"""Helpers for improvement jobs, Claude refinement, and blocked-site fallback."""

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

VALIDATION_FAILURE_PATTERNS: tuple[tuple[str, str], ...] = (
    ("local_ui_unreachable", r"err_connection_refused"),
    ("local_ui_unreachable", r"connection refused"),
    ("validation_capture_failed", r"validation aborted"),
    ("validation_capture_failed", r"missing screenshots for"),
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


def detect_validation_failure(output: str) -> dict[str, str] | None:
    lowered = output.strip().lower()
    for code, pattern in VALIDATION_FAILURE_PATTERNS:
        if re.search(pattern, lowered):
            detail = "Validation could not capture the required screenshots; live scores were not refreshed."
            if code == "local_ui_unreachable":
                detail = "Validation could not reach the local UI at the configured base URL."
            return {"code": code, "detail": detail}
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


def read_recent_feedback_entries(log_path: Path, brand: str, limit: int = 3) -> list[dict[str, Any]]:
    if not log_path.exists():
        return []

    entries: list[dict[str, Any]] = []
    for raw_line in log_path.read_text().splitlines():
        line = raw_line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
        if payload.get("brand") == brand:
            entries.append(payload)

    return entries[-limit:]


def _format_score(score: float | None) -> str:
    if score is None:
        return "unknown"
    if score <= 1:
        score *= 100
    return f"{score:.1f}%"


def build_claude_improvement_prompt(
    *,
    brand: str,
    target_score: float,
    current_score: float | None,
    report_path: Path,
    manifest_path: Path,
    pages: list[dict[str, Any]],
    inline_feedback: dict[str, Any] | None = None,
    recent_feedback: list[dict[str, Any]] | None = None,
) -> str:
    # Focus on the SINGLE worst page for faster, more reliable fixes
    worst_page = pages[0] if pages else None
    if not worst_page:
        return "No pages need improvement. Reply with: No changes needed."

    tsx_path = worst_page.get("replica_tsx", "")
    score = worst_page.get("current_score", 0)
    slug = worst_page.get("slug", "unknown")
    orig_screenshot = worst_page.get("original_screenshot", "")
    repl_screenshot = worst_page.get("replica_screenshot", "")

    lines = [
        f"Fix the {slug} replica page to improve its pixel match score from {score}% toward {target_score}%.",
        "",
        f"File to edit: {tsx_path}",
        f"Original screenshot: {orig_screenshot}",
        f"Replica screenshot: {repl_screenshot}",
        "",
        "Steps:",
        "1. Read the replica TSX file",
        "2. View both screenshots (original and replica) to see the visual differences",
        "3. Make targeted edits to close the visual gap — fix layout, spacing, colors, images, missing sections",
        "4. Do NOT refactor or restructure — make surgical fixes only",
        "",
        "Rules:",
        "- Edit ONLY the listed file and shared brand components under ui/components/brands/",
        "- Do not modify unrelated files, docs, or other brands",
        "- Make edits directly — no plans, no questions",
        "- Reply with a short summary of what you changed",
    ]

    if inline_feedback:
        lines.extend(["", "Operator feedback:", json.dumps(inline_feedback, indent=2)])

    return "\n".join(lines)


def build_claude_command(prompt: str) -> list[str]:
    return [
        "claude",
        "--print",
        "-p",
        prompt,
        "--output-format",
        "text",
        "--permission-mode",
        "bypassPermissions",
        "--allowedTools",
        "Read",
        "Write",
        "Edit",
        "Bash",
        "Glob",
        "Grep",
    ]


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
        "last_claude_summary": None,
        "claude_log_path": None,
        "updated_at": now_iso(),
    }


def update_job_state(job_path: Path, state: dict[str, Any], **changes: Any) -> dict[str, Any]:
    state.update(changes)
    state["updated_at"] = now_iso()
    write_json(job_path, state)
    return state
