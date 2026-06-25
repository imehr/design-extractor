#!/usr/bin/env python3
"""Helpers for improvement jobs, model refinement, and blocked-site fallback."""

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
        # Prefer desktop_avg (explicit viewport); fall back to legacy viewport_avg.
        desktop_avg = report.get("desktop_avg") or report.get("viewport_avg")
        if isinstance(desktop_avg, (int, float)):
            return round(float(desktop_avg) / 100.0, 3)
    if metadata:
        score = metadata.get("overall_score")
        if isinstance(score, (int, float)):
            return round(float(score), 3)
    return None


def sync_metadata_with_report(metadata_path: Path, report_path: Path) -> dict[str, Any]:
    metadata = load_json(metadata_path, default={}) or {}
    report = load_json(report_path, default={}) or {}

    # Prefer desktop_avg (explicit viewport); fall back to legacy viewport_avg.
    desktop_avg = report.get("desktop_avg") or report.get("viewport_avg")
    if isinstance(desktop_avg, (int, float)):
        metadata["overall_score"] = round(float(desktop_avg) / 100.0, 3)

    overall_status = report.get("overall_status")
    if overall_status:
        metadata["validation_status"] = overall_status

    scores = metadata.get("scores")
    if isinstance(scores, dict):
        if isinstance(desktop_avg, (int, float)):
            scores["overall_avg_match"] = round(float(desktop_avg), 1)
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


def extract_rubric_diagnosis(rubric_report: dict[str, Any] | None, page_slug: str) -> str:
    """Convert a rubric-report.json into a Markdown diagnosis block scoped to a page.

    Walks `dimensions` and emits actionable, page-filtered diagnostics. Only
    failing/critical dimensions surface (passing ones are skipped). Output is
    truncated to keep prompt budget under ~8k chars.
    """
    if not isinstance(rubric_report, dict):
        return ""

    dimensions = rubric_report.get("dimensions")
    if not isinstance(dimensions, list):
        return ""

    out: list[str] = []
    MAX_CHARS = 7800

    # Identify worst-2 pages per pixel viewport so we only emit pixel lines
    # that actually concern the current page (or the global worst pages).
    pixel_worst: dict[str, set[str]] = {}
    for d in dimensions:
        name = d.get("name", "")
        if not name.startswith("pixel_"):
            continue
        details = d.get("details") or {}
        pages = details.get("pages")
        if isinstance(pages, dict):
            ranked = sorted(
                pages.items(),
                key=lambda kv: (kv[1].get("exact", 100) if isinstance(kv[1], dict) else 100),
            )
            pixel_worst[name] = {p for p, _ in ranked[:2]}

    for d in dimensions:
        if not isinstance(d, dict):
            continue
        name = d.get("name", "")
        status = (d.get("status") or "").lower()
        if status in {"pass", "skipped"}:
            continue
        score = d.get("score")
        score_str = f"{score:.2f}" if isinstance(score, (int, float)) else "?"
        details = d.get("details") or {}

        if name == "font_rendering":
            elements = details.get("elements") or {}
            for tag in ("h1", "p"):
                elem = elements.get(tag)
                if not isinstance(elem, dict):
                    continue
                orig = elem.get("original") or {}
                repl = elem.get("replica") or {}
                family_match = elem.get("family_match", True)
                lh_delta = elem.get("lineheight_delta_px", 0)
                prefix = ""
                orig_family = str(orig.get("fontFamily", ""))
                if not family_match and any(
                    fb in orig_family.lower() for fb in ("times", "serif")
                ):
                    prefix = "(possible measurement artefact — see loaded_fonts in rubric details) "
                out.append(
                    f"- font_rendering (score {score_str}): {prefix}{tag} should be "
                    f"<{orig.get('tag', tag)}> at {orig_family} "
                    f"{orig.get('fontSize', '?')}/{orig.get('fontWeight', '?')} — replica "
                    f"currently <{repl.get('tag', tag)}> {repl.get('fontFamily', '?')} "
                    f"{repl.get('fontSize', '?')}/{repl.get('fontWeight', '?')}. "
                    f"Line-height delta {lh_delta}px."
                )

        elif name == "asset_fidelity":
            missing = details.get("missing_basenames")
            if not isinstance(missing, list):
                missing = details.get("unresolved_sample") or []
            resolved = details.get("matched_total")
            if resolved is None:
                resolved = details.get("resolved")
            total = details.get("source_total")
            if total is None:
                total = details.get("total_unique_basenames")
            unresolved_n = (
                (total - resolved)
                if isinstance(total, (int, float)) and isinstance(resolved, (int, float))
                else len(missing)
            )
            sample = ", ".join(str(m) for m in missing[:10])
            out.append(
                f"- asset_fidelity (score {score_str}): {unresolved_n} source assets "
                f"unresolved. Examples: {sample}. Check that downloaded filenames "
                f"preserve original suffixes."
            )

        elif name == "component_completeness":
            page_entry = None
            pages = details.get("pages")
            if isinstance(pages, list):
                for p in pages:
                    if isinstance(p, dict) and p.get("page") == page_slug:
                        page_entry = p
                        break
            target = page_entry if page_entry else details
            missing_list = target.get("missing") if isinstance(target, dict) else None
            extra_list = target.get("extra") if isinstance(target, dict) else None
            # Both may be int counts or lists of types — handle both.
            if isinstance(missing_list, list) and missing_list:
                shown = ", ".join(f"type:{t}" for t in missing_list[:5])
                out.append(
                    f"- component_completeness (score {score_str}, status {status}): "
                    f"replica missing components: [{shown}]. Compare DOM extraction at "
                    f"cache/<slug>/dom-extraction/{page_slug}.json."
                )
            elif isinstance(extra_list, list) and extra_list:
                shown = ", ".join(f"type:{t}" for t in extra_list[:5])
                out.append(
                    f"- component_completeness (score {score_str}, status {status}): "
                    f"replica has extra components not in source: [{shown}]. Compare DOM "
                    f"extraction at cache/<slug>/dom-extraction/{page_slug}.json."
                )
            else:
                missing_n = missing_list if isinstance(missing_list, int) else 0
                extra_n = extra_list if isinstance(extra_list, int) else 0
                if missing_n or extra_n:
                    out.append(
                        f"- component_completeness (score {score_str}, status {status}): "
                        f"page {page_slug} has {missing_n} missing and {extra_n} extra "
                        f"components that don't pair to source. Compare DOM extraction at "
                        f"cache/<slug>/dom-extraction/{page_slug}.json."
                    )

        elif name in ("pixel_desktop", "pixel_mobile", "pixel_tablet"):
            viewport = name.split("_", 1)[1]
            worst_set = pixel_worst.get(name, set())
            if page_slug not in worst_set:
                continue
            pages = details.get("pages")
            if isinstance(pages, dict):
                entry = pages.get(page_slug) or {}
                exact = entry.get("exact") if isinstance(entry, dict) else None
                if exact is None:
                    continue
                out.append(
                    f"- pixel_{viewport} (score {score_str}): {page_slug} at "
                    f"{exact}% on this page. Compare original screenshot vs replica."
                )

        elif name == "interactive_state":
            reason = details.get("reason", "interactive state mismatch")
            selectors_tried = details.get("selectors_tried") or []
            # Show working selector if any.
            orig_sel = details.get("original_selector")
            repl_sel = details.get("replica_selector")
            side, sel = ("none", "none")
            if orig_sel:
                side, sel = ("original", orig_sel)
            elif repl_sel:
                side, sel = ("replica", repl_sel)
            out.append(
                f"- interactive_state (score {score_str}): {reason}. Selectors tried: "
                f"{selectors_tried}. Working selector on {side}: {sel}."
            )

        elif name == "anti_slop":
            v = details.get("violation_count", 0)
            if not isinstance(v, int) or v <= 0:
                continue
            rules = details.get("rules_triggered") or []
            files = details.get("files") or []
            out.append(
                f"- anti_slop: {v} violations: {rules}. Files: {files[:3]}."
            )

        elif name == "pattern_fidelity":
            threshold = d.get("threshold")
            if (
                isinstance(score, (int, float))
                and isinstance(threshold, (int, float))
                and score < threshold
            ):
                out.append(
                    f"- pattern_fidelity (score {score_str}): below threshold "
                    f"{threshold:.2f}. See details: {details}"
                )

    text = "\n".join(out)
    if len(text) > MAX_CHARS:
        text = text[: MAX_CHARS - 20].rstrip() + "\n- (truncated)"
    return text


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
    component_issues: str = "",
    rubric_report: dict[str, Any] | None = None,
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

    # Use pre-computed component issues passed from the caller
    component_info = ""
    if component_issues:
        component_info = (
            "\n\nComponent-level issues found:\n"
            + component_issues
            + "\nFix the worst components first. Use the specific measurements above."
        )

    lines = [
        f"Fix the {slug} replica page to improve its match score from {score}% toward {target_score}%.",
        "",
        f"File to edit: {tsx_path}",
        f"Original screenshot: {orig_screenshot}",
        f"Replica screenshot: {repl_screenshot}",
        component_info,
        "",
        "Steps:",
        "1. Read the replica TSX file",
        "2. View both screenshots to see visual differences",
        "3. Fix the specific component issues listed above — exact measurements are provided",
        "4. Make surgical fixes only — do NOT refactor or restructure",
        "",
        "Rules:",
        "- Edit ONLY the listed file and shared brand components under ui/components/brands/",
        "- Do not modify unrelated files, docs, or other brands",
        "- Make edits directly — no plans, no questions",
        "- Reply with a short summary of what you changed",
    ]

    if rubric_report is not None:
        diagnosis = extract_rubric_diagnosis(rubric_report, slug)
        if diagnosis:
            lines.extend(
                [
                    "",
                    "## RUBRIC DIAGNOSIS — fix these specifically",
                    diagnosis,
                    "",
                    "Address the items in the RUBRIC DIAGNOSIS block FIRST. Each fixed "
                    "item should measurably improve the named dimension on the next "
                    "rubric run.",
                ]
            )

    if inline_feedback:
        lines.extend(["", "Operator feedback:", json.dumps(inline_feedback, indent=2)])

    if recent_feedback:
        notes = []
        for entry in recent_feedback:
            fb = entry.get("feedback", entry) if isinstance(entry, dict) else {}
            note = fb.get("notes") if isinstance(fb, dict) else None
            if note:
                notes.append(f"- {note}")
        if notes:
            lines.extend(["", "Recent operator guidance (most recent first):", *notes])

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


DEFAULT_MODEL_PROVIDERS: dict[str, dict[str, Any]] = {
    "claude-code": {
        "id": "claude-code",
        "type": "claude-code",
        "label": "Claude Code",
        "enabled": True,
        "command": "claude",
        "model": "sonnet",
        "permission_mode": "bypassPermissions",
    },
    "codex": {
        "id": "codex",
        "type": "codex",
        "label": "Codex",
        "enabled": False,
        "command": "codex",
        "model": "gpt-5.5",
    },
    "cursor": {
        "id": "cursor",
        "type": "cursor",
        "label": "Cursor Agent",
        "enabled": False,
        "command": "cursor",
        "model": "gpt-5",
    },
    "kimi": {
        "id": "kimi",
        "type": "kimi",
        "label": "Kimi Code",
        "enabled": False,
        "command": "kimi",
        "model": "kimi-code/kimi-for-coding",
        "permission_mode": "yolo",
    },
    "minimax": {
        "id": "minimax",
        "type": "minimax",
        "label": "MiniMax",
        "enabled": False,
        "command": "codex",
        "model": "codex-MiniMax-M2.1",
        "profile": "m21",
    },
    "opencode": {
        "id": "opencode",
        "type": "opencode",
        "label": "OpenCode",
        "enabled": False,
        "command": "opencode",
        "model": "opencode/big-pickle",
    },
    "ollama": {
        "id": "ollama",
        "type": "ollama",
        "label": "Ollama",
        "enabled": True,
        "command": "codex",
        "model": "qwen3.5:35b-a3b",
        "local_provider": "ollama",
    },
}


def read_active_model_provider() -> dict[str, Any]:
    settings_path = Path.home() / ".claude" / "design-library" / "settings" / "model-providers.json"
    try:
        settings = json.loads(settings_path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        settings = {}

    providers = settings.get("providers") if isinstance(settings, dict) else {}
    providers = providers if isinstance(providers, dict) else {}
    active_provider = settings.get("active_provider") if isinstance(settings, dict) else None
    provider_id = active_provider if isinstance(active_provider, str) else "claude-code"
    configured = providers.get(provider_id)
    configured = configured if isinstance(configured, dict) else {}
    defaults = DEFAULT_MODEL_PROVIDERS.get(
        provider_id,
        {
            **DEFAULT_MODEL_PROVIDERS["claude-code"],
            "id": provider_id,
            "type": provider_id,
            "label": provider_id,
            "command": provider_id,
        },
    )
    provider = {**defaults, **configured}
    if str(provider.get("type") or provider.get("id") or "") == "kimi":
        _normalize_kimi_model_from_cli_config(provider)
    return provider


def _normalize_kimi_model_from_cli_config(provider: dict[str, Any]) -> None:
    """Use a Kimi CLI model key that exists in ~/.kimi/config.toml."""
    config_path = Path.home() / ".kimi" / "config.toml"
    try:
        config_text = config_path.read_text()
    except OSError:
        return

    configured_models = set(re.findall(r'^\[models\."([^"]+)"\]', config_text, flags=re.M))
    if not configured_models:
        return

    selected_model = str(provider.get("model") or "").strip()
    if selected_model in configured_models:
        return

    default_match = re.search(r'^default_model\s*=\s*"([^"]+)"', config_text, flags=re.M)
    default_model = default_match.group(1) if default_match else sorted(configured_models)[0]
    provider["model"] = default_model


def model_provider_label(provider: dict[str, Any]) -> str:
    label = str(provider.get("label") or provider.get("id") or "Model provider")
    model = str(provider.get("model") or "default")
    return f"{label} · {model}"


def build_model_provider_command(
    provider: dict[str, Any],
    prompt: str,
    *,
    repo_root: Path,
) -> list[str]:
    provider_type = str(provider.get("type") or provider.get("id") or "claude-code")
    command = str(provider.get("command") or provider_type)
    model = str(provider.get("model") or "default")

    if provider_type == "claude-code":
        cmd = build_claude_command(prompt)
        if model and model != "default":
            cmd[1:1] = ["--model", model]
        return cmd

    if provider_type == "codex":
        cmd = [command if command and command != "None" else "codex", "exec", "--cd", str(repo_root), "--dangerously-bypass-approvals-and-sandbox"]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    if provider_type == "ollama":
        cmd = [
            command,
            "exec",
            "--cd",
            str(repo_root),
            "--oss",
            "--local-provider",
            str(provider.get("local_provider") or "ollama"),
            "--dangerously-bypass-approvals-and-sandbox",
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    if provider_type == "cursor":
        cmd = [
            command,
            "agent",
            "--print",
            "--output-format",
            "text",
            "--force",
            "--trust",
            "--workspace",
            str(repo_root),
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    if provider_type == "kimi":
        cmd = [
            command,
            "--work-dir",
            str(repo_root),
            "--print",
            "--final-message-only",
            "--output-format",
            "text",
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.extend(["--prompt", prompt])
        return cmd

    if provider_type == "minimax":
        cmd = [
            command,
            "exec",
            "--cd",
            str(repo_root),
            "--profile",
            str(provider.get("profile") or "m21"),
            "--dangerously-bypass-approvals-and-sandbox",
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    if provider_type == "opencode":
        cmd = [
            command,
            "run",
            "--dir",
            str(repo_root),
            "--dangerously-skip-permissions",
            "--format",
            "default",
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    raise ValueError(f"Unsupported model provider for improvement jobs: {provider_type}")


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
        "last_model_summary": None,
        "model_log_path": None,
        "model_provider": None,
        "last_claude_summary": None,
        "claude_log_path": None,
        "updated_at": now_iso(),
    }


def update_job_state(job_path: Path, state: dict[str, Any], **changes: Any) -> dict[str, Any]:
    state.update(changes)
    state["updated_at"] = now_iso()
    write_json(job_path, state)
    return state
