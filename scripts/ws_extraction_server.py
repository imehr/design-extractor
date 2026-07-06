#!/usr/bin/env python3
"""WebSocket server for real-time design system extraction."""

from __future__ import annotations

import asyncio
import json
import os
import signal
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import websockets

REPO_ROOT = Path(__file__).resolve().parent.parent
PORT = 8765

_active_job: ExtractionJob | None = None
_connected_clients: set = set()

DEFAULT_MODEL_PROVIDERS = {
    "claude-code": {
        "id": "claude-code",
        "type": "claude-code",
        "label": "Claude Code",
        "enabled": True,
        "command": "claude",
        "model": "sonnet",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        "permission_mode": "bypassPermissions",
    },
    "codex": {
        "id": "codex",
        "type": "codex",
        "label": "Codex",
        "enabled": False,
        "command": "codex",
        "model": "gpt-5.5",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        "approval_policy": "never",
        "sandbox": "danger-full-access",
    },
    "cursor": {
        "id": "cursor",
        "type": "cursor",
        "label": "Cursor Agent",
        "enabled": False,
        "command": "cursor",
        "model": "gpt-5",
        "allowed_tools": ["read", "edit", "bash"],
    },
    "kimi": {
        "id": "kimi",
        "type": "kimi",
        "label": "Kimi Code",
        "enabled": False,
        "command": "kimi",
        "model": "kimi-code/kimi-for-coding",
        "allowed_tools": ["read", "edit", "bash"],
        "permission_mode": "yolo",
    },
    "minimax": {
        "id": "minimax",
        "type": "minimax",
        "label": "MiniMax",
        "enabled": False,
        "command": "codex",
        "model": "codex-MiniMax-M2.1",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        "approval_policy": "never",
        "profile": "m21",
        "sandbox": "danger-full-access",
    },
    "opencode": {
        "id": "opencode",
        "type": "opencode",
        "label": "OpenCode",
        "enabled": False,
        "command": "opencode",
        "model": "opencode/big-pickle",
        "allowed_tools": ["read", "edit", "bash"],
        "permission_mode": "dangerously-skip-permissions",
    },
    "gemini": {
        "id": "gemini",
        "type": "gemini",
        "label": "Gemini CLI",
        "enabled": True,
        "command": "gemini",
        "model": "default",
        "allowed_tools": [],
        "approval_mode": "yolo",
    },
    "ollama": {
        "id": "ollama",
        "type": "ollama",
        "label": "Ollama",
        "enabled": True,
        "command": "codex",
        "model": "qwen3.5:35b-a3b",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        "approval_policy": "never",
        "local_provider": "ollama",
        "sandbox": "danger-full-access",
    },
}

DEFAULT_MODEL_PROVIDER = DEFAULT_MODEL_PROVIDERS["claude-code"]

# Execution-mode (schema v2, WS5) CLI ids -> legacy provider/runner ids that
# extract_brand.py's MODEL_RUNNERS and build_model_provider_command understand.
# CLIs without a wired extraction runner (qwen) are intentionally absent:
# selecting them falls back to active_provider with a logged warning.
EXECUTION_CLI_TO_PROVIDER = {
    "claude": "claude-code",
    "codex": "codex",
    "gemini": "gemini",
    "opencode": "opencode",
    "cursor-agent": "cursor",
    "kimi": "kimi",
}

# Execution-mode (schema v2, WS6) BYOK provider ids -> the agentic CLI runner
# that executes extraction phases with the user's API key injected as an env
# var. Extraction needs file-editing agents, so BYOK routes through CLIs
# (claude/codex/gemini directly; everything else through opencode, which
# auto-detects providers from <PROVIDER>_API_KEY env vars).
#
# opencode provider ids verified against `opencode models` on this machine
# (2026-06-11): openrouter, deepseek, minimax, zai, xai match the BYOK id;
# moonshot is listed as "moonshotai" (env var is still MOONSHOT_API_KEY).
#
# "env_var" is where the key is looked up (matches ui/lib/execution-mode.ts
# keyEnvVar). "inject_env_var" is what the CLI actually consumes — opencode's
# zai provider reads ZHIPU_API_KEY (models.dev), not ZAI_API_KEY (verified
# live 2026-06-11: zai/glm-4.7-flash answered with only ZHIPU_API_KEY set).
BYOK_RUNNERS = {
    "anthropic": {"provider_id": "claude-code", "env_var": "ANTHROPIC_API_KEY"},
    "openai": {"provider_id": "codex", "env_var": "OPENAI_API_KEY"},
    "google": {"provider_id": "gemini", "env_var": "GEMINI_API_KEY"},
    "openrouter": {
        "provider_id": "opencode",
        "env_var": "OPENROUTER_API_KEY",
        "opencode_provider": "openrouter",
    },
    "deepseek": {
        "provider_id": "opencode",
        "env_var": "DEEPSEEK_API_KEY",
        "opencode_provider": "deepseek",
    },
    "moonshot": {
        "provider_id": "opencode",
        "env_var": "MOONSHOT_API_KEY",
        "opencode_provider": "moonshotai",
    },
    "minimax": {
        "provider_id": "opencode",
        "env_var": "MINIMAX_API_KEY",
        "opencode_provider": "minimax",
    },
    "zai": {
        "provider_id": "opencode",
        "env_var": "ZAI_API_KEY",
        "inject_env_var": "ZHIPU_API_KEY",
        "opencode_provider": "zai",
    },
    "xai": {
        "provider_id": "opencode",
        "env_var": "XAI_API_KEY",
        "opencode_provider": "xai",
    },
    # Local models need no key; reuse the existing ollama runner unchanged.
    "ollama": {"provider_id": "ollama", "env_var": None},
}


def url_to_slug(url: str) -> str:
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    domain = re.sub(r"^www\.", "", domain)
    return re.sub(r"[^a-z0-9]+", "-", domain.lower()).strip("-")


def dev_server_base_url() -> str:
    return (
        os.environ.get("DESIGN_EXTRACTOR_BASE_URL")
        or os.environ.get("PORTLESS_URL")
        or "http://localhost:5173"
    ).rstrip("/")


def library_root() -> Path:
    return Path.home() / ".claude" / "design-library"


def brand_dir(slug: str) -> Path:
    return library_root() / "brands" / slug


def cache_dir(slug: str) -> Path:
    return library_root() / "cache" / slug


def read_json_file(path: Path) -> dict:
    try:
        data = json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def _mask_key(key: str) -> str:
    """Last-4 mask for log lines. Never log the full key anywhere."""
    return "…" + key[-4:] if len(key) > 4 else "…" + key


def read_byok_api_key(byok_provider_id: str, env_var: str | None) -> str | None:
    """Read the stored BYOK key (byok.json), falling back to the process env.

    Mirrors ui/lib/execution-mode.ts readStoredKey: stored key wins, then the
    provider's conventional env var. Returns None when no key is available.
    """
    store = read_json_file(library_root() / "settings" / "byok.json")
    providers = store.get("providers") if isinstance(store.get("providers"), dict) else {}
    entry = providers.get(byok_provider_id)
    key = entry.get("api_key") if isinstance(entry, dict) else None
    if isinstance(key, str) and key.strip():
        return key.strip()
    if env_var:
        env_key = os.environ.get(env_var, "")
        if env_key.strip():
            return env_key.strip()
    return None


_OPENCODE_CATALOG_CACHE: dict[str, bool] = {}


def _opencode_lists_provider(opencode_provider: str, env: dict[str, str]) -> bool:
    """True if `opencode models` (with the key env injected) lists the provider.

    opencode derives its provider catalog from detected credentials, so the
    check must run with the BYOK key in the environment. Result is cached per
    provider for the server's lifetime. Any failure (missing binary, timeout,
    non-zero exit) counts as "not listed" — we never pretend a provider works.
    """
    cached = _OPENCODE_CATALOG_CACHE.get(opencode_provider)
    if cached is not None:
        return cached
    prefix = opencode_provider + "/"
    try:
        result = subprocess.run(
            ["opencode", "models"],
            capture_output=True,
            text=True,
            timeout=30,
            env=env,
        )
        listed = result.returncode == 0 and any(
            line.strip().startswith(prefix) for line in result.stdout.splitlines()
        )
    except (OSError, subprocess.SubprocessError):
        listed = False
    _OPENCODE_CATALOG_CACHE[opencode_provider] = listed
    return listed


def _resolve_byok_runner(
    settings: dict, fallback_provider_id: str
) -> tuple[str, str | None, dict[str, str] | None]:
    """Resolve byok.active_provider to (provider_id, model_override, secret_env).

    secret_env is the {ENV_VAR: api_key} mapping to inject into spawned runner
    subprocesses ({} for keyless providers like ollama). A None secret_env
    signals fallback to the legacy active_provider. The key itself must never
    be logged or echoed — log only the env var NAME and the last 4 characters.
    """
    byok = settings.get("byok") if isinstance(settings.get("byok"), dict) else {}
    active = str(byok.get("active_provider") or "").strip()
    models = byok.get("models") if isinstance(byok.get("models"), dict) else {}

    spec = BYOK_RUNNERS.get(active)
    if not spec:
        print(
            f"[execution-mode] No BYOK extraction runner is wired for provider "
            f"{active!r} (wired: {', '.join(sorted(BYOK_RUNNERS))}); falling back "
            f"to legacy active_provider '{fallback_provider_id}'."
        )
        return fallback_provider_id, None, None

    provider_id = str(spec["provider_id"])
    env_var = spec.get("env_var")
    inject_env_var = spec.get("inject_env_var") or env_var
    model = str(models.get(active) or "").strip()

    secret_env: dict[str, str] = {}
    key: str | None = None
    if env_var:
        key = read_byok_api_key(active, env_var)
        if not key:
            print(
                f"[execution-mode] BYOK provider '{active}' has no API key "
                f"(checked byok.json and ${env_var}); falling back to legacy "
                f"active_provider '{fallback_provider_id}'."
            )
            return fallback_provider_id, None, None
        secret_env[inject_env_var] = key

    providers_cfg = settings.get("providers") if isinstance(settings.get("providers"), dict) else {}
    runner_cfg = providers_cfg.get(provider_id)
    runner_cfg = runner_cfg if isinstance(runner_cfg, dict) else {}
    command = str(
        runner_cfg.get("command")
        or DEFAULT_MODEL_PROVIDERS.get(provider_id, {}).get("command")
        or provider_id
    )
    if shutil.which(command) is None:
        print(
            f"[execution-mode] BYOK provider '{active}' needs the '{command}' CLI, "
            f"which is not installed; falling back to legacy active_provider "
            f"'{fallback_provider_id}'."
        )
        return fallback_provider_id, None, None

    opencode_provider = spec.get("opencode_provider")
    if opencode_provider:
        if not model:
            print(
                f"[execution-mode] BYOK provider '{active}' routes through opencode "
                f"and requires an explicit model selection; falling back to legacy "
                f"active_provider '{fallback_provider_id}'."
            )
            return fallback_provider_id, None, None
        if not model.startswith(opencode_provider + "/"):
            model = f"{opencode_provider}/{model}"
        if not _opencode_lists_provider(opencode_provider, {**os.environ, **secret_env}):
            print(
                f"[execution-mode] opencode does not list provider "
                f"'{opencode_provider}' in its catalog on this machine; falling "
                f"back to legacy active_provider '{fallback_provider_id}'."
            )
            return fallback_provider_id, None, None

    key_note = f", key {_mask_key(key)} via ${inject_env_var}" if key else ""
    print(
        f"[execution-mode] byok:{active} via '{command}' runner '{provider_id}' "
        f"(model '{model or 'default'}'{key_note})."
    )
    return provider_id, model or None, secret_env


def _resolve_execution_provider(
    settings: dict, fallback_provider_id: str
) -> tuple[str, str | None, dict[str, str] | None]:
    """Resolve schema-v2 execution settings.

    Returns (provider_id, model_override, byok_env). model_override is None
    when the legacy provider's own configured model should be kept. byok_env
    is None outside BYOK mode (and on BYOK fallback); in BYOK mode it is the
    secret env mapping to inject into runner subprocesses (may be {} for
    keyless providers). Only called when execution_configured is true.
    """
    mode = settings.get("execution_mode")

    if mode == "byok":
        return _resolve_byok_runner(settings, fallback_provider_id)

    # local-cli (and any unknown mode value defaults to local-cli, matching
    # ui/lib/model-settings.ts normalizeExecutionSettings).
    selected = settings.get("selected_cli") if isinstance(settings.get("selected_cli"), dict) else {}
    cli_id = str(selected.get("id") or "").strip()
    cli_model = str(selected.get("model") or "").strip()
    provider_id = EXECUTION_CLI_TO_PROVIDER.get(cli_id)
    if not provider_id:
        print(
            f"[execution-mode] No extraction runner is wired for CLI '{cli_id}' "
            f"(wired: {', '.join(sorted(EXECUTION_CLI_TO_PROVIDER))}); falling back "
            f"to legacy active_provider '{fallback_provider_id}'."
        )
        return fallback_provider_id, None, None

    print(
        f"[execution-mode] local-cli: using runner '{provider_id}' for CLI "
        f"'{cli_id}' with model '{cli_model or 'default'}'."
    )
    return provider_id, cli_model or None, None


def read_active_model_provider() -> dict:
    settings_path = (
        library_root() / "settings" / "model-providers.json"
    )
    try:
        settings = json.loads(settings_path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        settings = {}

    providers = settings.get("providers") if isinstance(settings, dict) else {}
    providers = providers if isinstance(providers, dict) else {}
    active_provider = settings.get("active_provider") if isinstance(settings, dict) else None
    provider_id = active_provider if isinstance(active_provider, str) else "claude-code"

    # Schema v2 (WS5): honor the saved execution mode, but ONLY once the user
    # has explicitly configured it. While execution_configured is false/absent,
    # resolution stays byte-for-byte on the legacy active_provider path.
    model_override: str | None = None
    byok_env: dict[str, str] | None = None
    if isinstance(settings, dict) and settings.get("execution_configured") is True:
        provider_id, model_override, byok_env = _resolve_execution_provider(settings, provider_id)

    configured = providers.get(provider_id)
    configured = configured if isinstance(configured, dict) else {}
    defaults = DEFAULT_MODEL_PROVIDERS.get(
        provider_id,
        {
            **DEFAULT_MODEL_PROVIDER,
            "id": provider_id,
            "type": provider_id,
            "label": provider_id,
            "command": provider_id,
        },
    )
    provider = {**defaults, **configured}
    if model_override is not None:
        provider["model"] = model_override
    if byok_env is not None:
        # Present only when BYOK resolved successfully. Holds the secret
        # {ENV_VAR: api_key} mapping ({} for keyless providers). Consumed by
        # model_provider_env(); must never be logged or serialized.
        provider["_byok_env"] = byok_env
    if str(provider.get("type") or provider.get("id") or "") == "kimi":
        _normalize_kimi_model_from_cli_config(provider)
    return provider


def model_provider_env(provider: dict) -> dict[str, str] | None:
    """Subprocess env for a resolved provider, or None to inherit the parent's.

    BYOK runners get a copy of os.environ with the provider's API key env var
    overlaid. The returned dict contains the secret — pass it only to
    subprocess spawns, never to logs or websocket payloads.
    """
    secret = provider.get("_byok_env")
    if not secret:
        return None
    return {**os.environ, **secret}


def _normalize_kimi_model_from_cli_config(provider: dict) -> None:
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


def build_model_provider_command(
    provider: dict,
    prompt: str,
    *,
    allowed_tools: list[str] | None = None,
) -> list[str]:
    provider_type = str(provider.get("type") or provider.get("id") or "claude-code")
    command = str(provider.get("command") or provider_type)
    model = str(provider.get("model") or "default")
    tools = allowed_tools or list(provider.get("allowed_tools") or [])

    if provider_type == "claude-code":
        cmd = [
            command,
            "--print",
            "-p",
            prompt,
            "--output-format",
            "text",
            "--permission-mode",
            str(provider.get("permission_mode") or "bypassPermissions"),
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        if tools:
            cmd.append("--allowedTools")
            cmd.extend(tools)
        return cmd

    if provider_type == "codex":
        cmd = [
            command,
            "exec",
            "--cd",
            str(REPO_ROOT),
            "--dangerously-bypass-approvals-and-sandbox",
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    if provider_type == "ollama":
        cmd = [
            command,
            "exec",
            "--cd",
            str(REPO_ROOT),
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
            "--force",
            "--trust",
            "--workspace",
            str(REPO_ROOT),
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    if provider_type == "kimi":
        cmd = [
            command,
            "--print",
            "--final-message-only",
            "--work-dir",
            str(REPO_ROOT),
            "--yolo",
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
            str(REPO_ROOT),
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
            str(REPO_ROOT),
            "--dangerously-skip-permissions",
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        cmd.append(prompt)
        return cmd

    if provider_type == "gemini":
        # Gemini CLI has no --cd flag; it operates in the spawn cwd (REPO_ROOT).
        cmd = [
            command,
            "--approval-mode",
            str(provider.get("approval_mode") or "yolo"),
            "-p",
            prompt,
        ]
        if model and model != "default":
            cmd.extend(["--model", model])
        return cmd

    return build_model_provider_command(
        {**DEFAULT_MODEL_PROVIDER, "model": model},
        prompt,
        allowed_tools=tools,
    )


def build_agent_invocation(
    prompt: str, *, allowed_tools: list[str] | None = None
) -> tuple[list[str], dict[str, str] | None]:
    """Resolve the active provider once and return (argv, subprocess env).

    env is None unless the provider needs secret injection (BYOK), in which
    case it is a full environ copy with the key overlaid.
    """
    provider = read_active_model_provider()
    cmd = build_model_provider_command(provider, prompt, allowed_tools=allowed_tools)
    return cmd, model_provider_env(provider)


def build_agent_command(prompt: str, *, allowed_tools: list[str] | None = None) -> list[str]:
    return build_agent_invocation(prompt, allowed_tools=allowed_tools)[0]


PIPELINE_PHASES = {
    "A": {"label": "Extract", "agents": ["recon-agent", "dom-extractor", "asset-extractor"]},
    "B": {"label": "Build", "agents": ["replica-builder"]},
    "C": {"label": "Validate", "agents": ["visual-critic"]},
    "D": {"label": "Improve", "agents": ["refinement-agent", "validation-monitor"]},
    "E": {"label": "Publish", "agents": ["documentarian", "skill-packager", "librarian"]},
}
ALL_PIPELINE_AGENTS = [
    agent for phase in PIPELINE_PHASES.values() for agent in phase["agents"]
]
ORCHESTRATOR_PHASE_TO_PIPELINE = {
    "0": ("A", "recon-agent"),
    "0.5": ("A", "recon-agent"),
    "1": ("A", "recon-agent"),
    "2": ("A", "recon-agent"),
    "3": ("A", "dom-extractor"),
    "4": ("A", "asset-extractor"),
    "4b": ("A", "asset-extractor"),
    "4.5": ("A", "asset-extractor"),
    "5": ("B", "replica-builder"),
    "5b": ("B", "replica-builder"),
    "6": ("C", "visual-critic"),
    # 6.5 runs after validation; keep the live pipeline monotonic (no jump back to B).
    "6.5": ("C", "visual-critic"),
    "7": ("E", "documentarian"),
    "7.5": ("E", "skill-packager"),
    "8": ("E", "librarian"),
    "9": ("E", "librarian"),
}
ANSI_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
MIN_PACKAGE_PAGES = 5
MAX_PACKAGE_PAGES = 10


def strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text)


def orchestrator_phase_from_output(text: str) -> str | None:
    clean = strip_ansi(text).lower()
    match = re.search(r"\bphase\s+([0-9]+(?:\.[0-9]+)?|4b|5b)\b", clean)
    return match.group(1) if match else None


class ExtractionJob:
    def __init__(
        self,
        url: str,
        brand_name: str,
        max_pages: int,
        ws,
        start_from: str = "A",
        base_url: str | None = None,
    ):
        self.url = url
        self.brand_name = brand_name
        self.slug = url_to_slug(url) if url else ""
        self.max_pages = max_pages
        self.base_url = (base_url or dev_server_base_url()).rstrip("/")
        self.ws = ws
        self.cancelled = False
        self.current_phase: str | None = None
        self.current_agent: str | None = None
        self.current_proc: asyncio.subprocess.Process | None = None
        self.completed_agents: list[str] = []
        self.feedback_messages: list[str] = []
        self.start_time = time.time()
        self.failed_phases: list[str] = []
        self.completed_phases: list[str] = []
        self.start_from = start_from

    def _job_state_dir(self) -> Path:
        # Thin wrapper over telemetry.jobs_dir for backward compatibility with
        # any internal callers. telemetry.jobs_dir() already creates the path.
        try:
            from telemetry import jobs_dir
        except ImportError:
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from telemetry import jobs_dir
        return jobs_dir(self.slug)

    def _brand_dir(self) -> Path:
        return brand_dir(self.slug)

    def _cache_dir(self) -> Path:
        return cache_dir(self.slug)

    def _metadata_path(self) -> Path:
        return self._brand_dir() / "metadata.json"

    def orchestrator_page_limit(self) -> int:
        try:
            requested = int(self.max_pages)
        except (TypeError, ValueError):
            requested = MAX_PACKAGE_PAGES
        return max(MIN_PACKAGE_PAGES, min(MAX_PACKAGE_PAGES, requested))

    def build_orchestrator_command(self) -> list[str]:
        return [
            sys.executable,
            str(REPO_ROOT / "scripts" / "extract_brand.py"),
            "--url",
            self.url,
            "--page-limit",
            str(self.orchestrator_page_limit()),
            "--replica-batch-size",
            "5",
            "--skip-existing",  # resume: reuse cached DOM/replicas instead of redoing
        ]

    def library_index_contains_brand(self) -> bool:
        data = read_json_file(library_root() / "index.json")
        brands = data.get("brands")
        if not isinstance(brands, list):
            return False
        return any(isinstance(item, dict) and item.get("slug") == self.slug for item in brands)

    def ensure_brand_metadata(self) -> Path:
        """Create/update metadata before publish so indexing never depends on docs generation."""
        metadata_path = self._metadata_path()
        metadata_path.parent.mkdir(parents=True, exist_ok=True)
        metadata = read_json_file(metadata_path)

        report = read_json_file(metadata_path.parent / "validation" / "report.json")
        raw_score = report.get("desktop_avg") or report.get("viewport_avg")
        if isinstance(raw_score, (int, float)):
            metadata["overall_score"] = round(float(raw_score) / 100, 3)
            metadata["validation_status"] = report.get("overall_status", "in_progress")

        if self.brand_name.strip():
            metadata["name"] = self.brand_name.strip()
        metadata.setdefault("name", self.slug.replace("-", " ").title())
        metadata.setdefault("slug", self.slug)
        metadata.setdefault("source_url", self.url)
        metadata.setdefault("extracted_at", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        metadata.setdefault("extractor_version", "0.3.0")
        metadata.setdefault("confidence", "MEDIUM")
        metadata.setdefault("categories", [])
        metadata.setdefault("synthetic", False)
        metadata.setdefault("replica_type", "react_shadcn")
        metadata["last_seen_at"] = datetime.now(timezone.utc).isoformat()

        metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")
        return metadata_path

    def _save_job_state(self, phase: str, status: str):
        try:
            from telemetry import write_phase_event
        except ImportError:
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from telemetry import write_phase_event

        elapsed = time.time() - self.start_time
        # Preserve legacy fields via `extra=` so resume logic (which reads
        # url / brand_name / max_pages / completed_phases from the most
        # recent job file) keeps working.
        write_phase_event(
            self.slug,
            phase=phase,
            status=status,
            duration_s=round(elapsed, 2),
            extra={
                "url": self.url,
                "brand_name": self.brand_name,
                "max_pages": self.max_pages,
                "base_url": self.base_url,
                "current_phase": phase,
                "failed_phases": list(self.failed_phases),
                "completed_phases": list(self.completed_phases),
            },
        )

    async def _emit(self, event: dict):
        global _connected_clients

        payload = json.dumps(event)
        targets = set(_connected_clients)
        if self.ws:
            targets.add(self.ws)
        closed = set()
        for ws in targets:
            try:
                await ws.send(payload)
            except Exception:
                closed.add(ws)
        _connected_clients -= closed

    async def activate_pipeline_agent(self, phase: str, agent: str) -> None:
        phase_config = PIPELINE_PHASES.get(phase)
        if not phase_config:
            return

        if self.current_phase != phase:
            self.current_phase = phase
            await self._emit(
                {
                    "type": "phase_started",
                    "phase": phase,
                    "label": phase_config["label"],
                    "agents": phase_config["agents"],
                }
            )

        if self.current_agent == agent:
            return

        if self.current_agent:
            await self.complete_pipeline_agent(self.current_agent)

        self.current_agent = agent
        await self._emit({"type": "agent_started", "agent": agent, "phase": phase})

    async def complete_pipeline_agent(
        self,
        agent: str,
        *,
        exit_code: int = 0,
        duration_s: float | None = None,
    ) -> None:
        if agent not in self.completed_agents:
            self.completed_agents.append(agent)
        await self._emit(
            {
                "type": "agent_completed",
                "agent": agent,
                "duration_s": round(duration_s or 0, 1),
                "exit_code": exit_code,
                "outputs": [],
            }
        )
        if self.current_agent == agent:
            self.current_agent = None

    async def complete_all_pipeline_agents(self) -> None:
        for agent in ALL_PIPELINE_AGENTS:
            if agent not in self.completed_agents:
                await self.complete_pipeline_agent(agent)

    async def register_brand_in_library(self) -> bool:
        metadata_path = self.ensure_brand_metadata()
        await self.activate_pipeline_agent("E", "librarian")
        ok, _ = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "update_library_index.py"),
                "--add",
                self.slug,
                "--metadata",
                str(metadata_path),
            ],
            agent="librarian",
        )
        return ok

    def orchestrator_env(self) -> dict[str, str]:
        """Env for the extract_brand.py orchestrator child.

        BYOK execution mode: the orchestrator resolves its own runner from
        model-providers.json, which has no BYOK awareness. Steer it via the
        documented DESIGN_EXTRACTOR_PROVIDER/MODEL overrides and inject the
        provider's API key (env values are never logged).
        """
        env = {
            **os.environ,
            "PYTHONUNBUFFERED": "1",
            "NO_COLOR": "1",
            "TERM": "dumb",
            "DESIGN_EXTRACTOR_BASE_URL": self.base_url,
        }

        provider = read_active_model_provider()
        byok_env = provider.get("_byok_env")
        if byok_env is not None:
            env.update(byok_env)
            env["DESIGN_EXTRACTOR_PROVIDER"] = str(provider.get("id") or "")
            byok_model = str(provider.get("model") or "").strip()
            if byok_model and byok_model != "default":
                env["DESIGN_EXTRACTOR_MODEL"] = byok_model
        return env

    async def stream_orchestrator_subprocess(self, cmd: list[str]) -> tuple[bool, str]:
        await self.activate_pipeline_agent("A", "recon-agent")
        start = time.time()
        output_lines: list[str] = []
        env = self.orchestrator_env()

        try:
            self.current_proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=REPO_ROOT,
                env=env,
                start_new_session=True,  # own pgid so cancel can killpg grandchildren (Chrome, model CLI)
            )

            while True:
                if self.cancelled:
                    try:
                        os.killpg(os.getpgid(self.current_proc.pid), signal.SIGKILL)
                    except (ProcessLookupError, PermissionError):
                        pass
                    break

                line = await self.current_proc.stdout.readline()
                if not line:
                    break

                text = line.decode("utf-8", errors="replace").rstrip()
                output_lines.append(text)

                phase_key = orchestrator_phase_from_output(text)
                if phase_key in ORCHESTRATOR_PHASE_TO_PIPELINE:
                    phase, agent = ORCHESTRATOR_PHASE_TO_PIPELINE[phase_key]
                    await self.activate_pipeline_agent(phase, agent)

                await self._emit(
                    {
                        "type": "agent_log",
                        "agent": self.current_agent or "orchestrator",
                        "level": "info",
                        "message": strip_ansi(text),
                    }
                )

            await self.current_proc.wait()
            duration = time.time() - start
            if self.current_agent:
                await self.complete_pipeline_agent(
                    self.current_agent,
                    exit_code=self.current_proc.returncode,
                    duration_s=duration,
                )
            return self.current_proc.returncode == 0, "\n".join(output_lines)
        except FileNotFoundError:
            msg = f"Command not found: {cmd[0] if cmd else '?'}"
            await self._emit({"type": "error", "agent": self.current_agent or "orchestrator", "message": msg})
            return False, msg
        except Exception as e:
            await self._emit({"type": "error", "agent": self.current_agent or "orchestrator", "message": str(e)})
            return False, str(e)
        finally:
            self.current_proc = None

    async def stream_subprocess(
        self,
        cmd: list[str],
        agent: str,
        cwd: Path | None = None,
        timeout_s: int | None = None,
        timeout_ok: bool = False,
        env: dict[str, str] | None = None,
    ) -> tuple[bool, str]:
        self.current_agent = agent
        await self._emit(
            {"type": "agent_started", "agent": agent, "phase": self.current_phase}
        )

        start = time.time()
        try:
            self.current_proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=cwd or REPO_ROOT,
                # None inherits the server env; BYOK runners pass an environ
                # copy with the provider API key overlaid (never logged).
                env=env,
            )

            output_lines: list[str] = []
            is_claude = "claude" in cmd[0] if cmd else False

            while True:
                if self.cancelled:
                    try:
                        self.current_proc.kill()
                    except ProcessLookupError:
                        pass
                    break
                try:
                    line = await asyncio.wait_for(
                        self.current_proc.stdout.readline(), timeout=1.0
                    )
                except asyncio.TimeoutError:
                    if timeout_s is not None and time.time() - start > timeout_s:
                        timeout_msg = f"{agent} timed out after {timeout_s}s; continuing."
                        output_lines.append(timeout_msg)
                        await self._emit(
                            {
                                "type": "agent_log",
                                "agent": agent,
                                "level": "warn",
                                "message": timeout_msg,
                            }
                        )
                        try:
                            self.current_proc.kill()
                        except ProcessLookupError:
                            pass
                        await self.current_proc.wait()
                        duration = time.time() - start
                        self.completed_agents.append(agent)
                        await self._emit(
                            {
                                "type": "agent_completed",
                                "agent": agent,
                                "duration_s": round(duration, 1),
                                "exit_code": self.current_proc.returncode,
                                "outputs": [],
                            }
                        )
                        return timeout_ok, "\n".join(output_lines)
                    continue
                if not line:
                    break
                text = line.decode("utf-8", errors="replace").rstrip()

                if is_claude and not text.strip():
                    output_lines.append(text)
                    continue

                output_lines.append(text)

                event_type = "claude_output" if is_claude else "agent_log"
                payload: dict = {"type": event_type, "agent": agent}
                if event_type == "claude_output":
                    payload["text"] = text
                else:
                    payload["level"] = "info"
                    payload["message"] = text
                await self._emit(payload)

                if timeout_s is not None and time.time() - start > timeout_s:
                    timeout_msg = f"{agent} timed out after {timeout_s}s; continuing."
                    output_lines.append(timeout_msg)
                    await self._emit(
                        {
                            "type": "agent_log",
                            "agent": agent,
                            "level": "warn",
                            "message": timeout_msg,
                        }
                    )
                    try:
                        self.current_proc.kill()
                    except ProcessLookupError:
                        pass
                    await self.current_proc.wait()
                    duration = time.time() - start
                    self.completed_agents.append(agent)
                    await self._emit(
                        {
                            "type": "agent_completed",
                            "agent": agent,
                            "duration_s": round(duration, 1),
                            "exit_code": self.current_proc.returncode,
                            "outputs": [],
                        }
                    )
                    return timeout_ok, "\n".join(output_lines)

            await self.current_proc.wait()
            duration = time.time() - start
            self.completed_agents.append(agent)
            await self._emit(
                {
                    "type": "agent_completed",
                    "agent": agent,
                    "duration_s": round(duration, 1),
                    "exit_code": self.current_proc.returncode,
                    "outputs": [],
                }
            )
            return self.current_proc.returncode == 0, "\n".join(output_lines)
        except FileNotFoundError:
            msg = (
                f"Command not found: {cmd[0] if cmd else '?'}. "
                "Is it installed and on PATH?"
            )
            await self._emit({"type": "error", "agent": agent, "message": msg})
            return False, msg
        except Exception as e:
            await self._emit({"type": "error", "agent": agent, "message": str(e)})
            return False, str(e)
        finally:
            self.current_proc = None
            self.current_agent = None

    async def _ensure_pages_json(self):
        """Create pages.json from cache screenshots if it does not exist."""
        brand_cache_dir = self._cache_dir()
        pages_path = brand_cache_dir / "validation" / "pages.json"
        if pages_path.exists():
            return

        screenshots_dir = brand_cache_dir / "screenshots"
        pages: dict[str, dict[str, str]] = {}
        if screenshots_dir.exists():
            for img in sorted(screenshots_dir.glob("*.png")):
                page_slug = img.stem
                route = "" if page_slug in {"homepage", "home", "desktop-full"} else f"/{page_slug}"
                pages[page_slug] = {
                    "original_url": self.url,
                    "replica_route": f"/brands/{self.slug}/replica{route}",
                }

        if not pages:
            pages["homepage"] = {
                "original_url": self.url,
                "replica_route": f"/brands/{self.slug}/replica",
            }

        pages_path.parent.mkdir(parents=True, exist_ok=True)
        pages_path.write_text(json.dumps(pages, indent=2))
        await self._emit(
            {
                "type": "warning",
                "phase": "C",
                "message": f"pages.json missing; created minimal file with {len(pages)} page(s)",
            }
        )

    async def run_phase_a(self) -> bool:
        self.current_phase = "A"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "A",
                "label": "Extract",
                "agents": ["recon-agent", "dom-extractor", "asset-extractor"],
            }
        )

        ok, output = await self.stream_subprocess(
            ["agent-browser", "open", self.url, "--headed"],
            agent="recon-agent",
            timeout_s=20,
            timeout_ok=True,
        )

        if not ok or self.cancelled:
            if output and (
                "access denied" in output.lower() or "akamai" in output.lower()
            ):
                await self._emit(
                    {
                        "type": "blocked_site",
                        "url": self.url,
                        "reason": "Anti-bot protection detected",
                        "fallback": "assisted_capture",
                    }
                )
            await self._emit({"type": "phase_completed", "phase": "A", "score": None})
            return ok

        if self.cancelled:
            await self._emit({"type": "phase_completed", "phase": "A", "score": None})
            return False

        dom_prompt = (
            f"Extract DOM measurements from {self.url}. "
            f"Brand slug: {self.slug}. "
            f"Read agents/dom-extractor.md for instructions."
        )
        dom_cmd, dom_env = build_agent_invocation(
            dom_prompt,
            allowed_tools=["Bash", "Read", "Write", "Glob"],
        )
        ok, _ = await self.stream_subprocess(
            dom_cmd,
            agent="dom-extractor",
            env=dom_env,
        )

        if self.cancelled:
            await self._emit({"type": "phase_completed", "phase": "A", "score": None})
            return False

        asset_prompt = (
            f"Download assets for {self.slug} from {self.url}. "
            f"Read agents/asset-extractor.md for instructions."
        )
        asset_cmd, asset_env = build_agent_invocation(
            asset_prompt,
            allowed_tools=["Bash", "Read", "Write", "WebFetch", "Glob"],
        )
        await self.stream_subprocess(
            asset_cmd,
            agent="asset-extractor",
            env=asset_env,
        )

        await self._emit({"type": "phase_completed", "phase": "A", "score": None})
        return True

    async def run_phase_b(self) -> bool:
        self.current_phase = "B"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "B",
                "label": "Build",
                "agents": ["replica-builder"],
            }
        )

        prompt = (
            f"Build React/shadcn replicas for brand {self.slug}. "
            f"Read agents/replica-builder.md for instructions."
        )
        replica_cmd, replica_env = build_agent_invocation(
            prompt,
            allowed_tools=["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        )
        ok, _ = await self.stream_subprocess(
            replica_cmd,
            agent="replica-builder",
            env=replica_env,
        )
        await self._emit({"type": "phase_completed", "phase": "B", "score": None})
        return ok

    async def run_phase_c(self) -> bool:
        self.current_phase = "C"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "C",
                "label": "Validate",
                "agents": ["visual-critic"],
            }
        )

        await self._ensure_pages_json()
        base_url = self.base_url

        ok, output = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "run_validation_loop.py"),
                "--brand",
                self.slug,
                "--base-url",
                base_url,
            ],
            agent="visual-critic",
            timeout_s=180,
            timeout_ok=False,
        )

        score = None
        report_path = (
            Path.home()
            / ".claude"
            / "design-library"
            / "brands"
            / self.slug
            / "validation"
            / "report.json"
        )
        if report_path.exists():
            try:
                report = json.loads(report_path.read_text())
                raw = report.get("desktop_avg") or report.get("viewport_avg")
                if isinstance(raw, (int, float)):
                    score = round(raw / 100, 3)
                await self._emit(
                    {"type": "validation_score", "iteration": 1, "score": score}
                )
            except Exception:
                pass

        await self._emit({"type": "phase_completed", "phase": "C", "score": score})
        return ok

    async def run_phase_d(self) -> bool:
        self.current_phase = "D"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "D",
                "label": "Improve",
                "agents": ["refinement-agent", "validation-monitor"],
            }
        )

        base_url = self.base_url
        ok, _ = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "run_improvement_job.py"),
                "--brand",
                self.slug,
                "--base-url",
                base_url,
                "--target",
                "80",
                "--max-iterations",
                "5",
            ],
            agent="validation-monitor",
            timeout_s=900,
            timeout_ok=False,
        )

        await self._emit({"type": "phase_completed", "phase": "D", "score": None})
        return ok

    async def run_phase_e(self) -> bool:
        self.current_phase = "E"
        await self._emit(
            {
                "type": "phase_started",
                "phase": "E",
                "label": "Publish",
                "agents": ["documentarian", "skill-packager", "librarian"],
            }
        )

        metadata_path = self.ensure_brand_metadata()

        publish_ok, _ = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "publish_brand.py"),
                "--brand",
                self.slug,
                "--enforce-readiness",
            ],
            agent="documentarian",
        )

        metadata_path = self.ensure_brand_metadata()
        librarian_ok, _ = await self.stream_subprocess(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "update_library_index.py"),
                "--add",
                self.slug,
                "--metadata",
                str(metadata_path),
            ],
            agent="librarian",
        )

        if not publish_ok:
            await self._emit(
                {
                    "type": "warning",
                    "phase": "E",
                    "message": "Publish artifacts were incomplete, but the brand was registered in the library index for review.",
                }
            )

        await self._emit({"type": "phase_completed", "phase": "E", "score": None})
        return publish_ok and librarian_ok

    async def run(self):
        global _active_job
        _active_job = self

        await self._emit(
            {"type": "extraction_started", "url": self.url, "brand": self.slug}
        )

        self._save_job_state("A", "running")
        orchestrator_ok = False
        librarian_ok = False
        if not self.cancelled:
            orchestrator_ok, _ = await self.stream_orchestrator_subprocess(
                self.build_orchestrator_command()
            )

        if not self.cancelled:
            librarian_ok = await self.register_brand_in_library()

        if orchestrator_ok and librarian_ok:
            await self.complete_all_pipeline_agents()
            for phase_id in PIPELINE_PHASES:
                if phase_id not in self.completed_phases:
                    self.completed_phases.append(phase_id)
                self._save_job_state(phase_id, "completed")
        elif not self.cancelled:
            failed_phase = self.current_phase or "E"
            if failed_phase not in self.failed_phases:
                self.failed_phases.append(failed_phase)
            self._save_job_state(failed_phase, "failed")
            if librarian_ok and self.library_index_contains_brand():
                await self._emit(
                    {
                        "type": "warning",
                        "phase": failed_phase,
                        "message": "Extraction package is incomplete, but the brand is registered in the library for review and repair.",
                    }
                )

        if self.cancelled:
            await self._emit(
                {
                    "type": "extraction_cancelled",
                    "brand": self.slug,
                    "phase": self.current_phase,
                    "failed_phases": self.failed_phases,
                }
            )
            _active_job = None
            return

        metadata_path = self._metadata_path()
        final_score = None
        if metadata_path.exists():
            try:
                meta = json.loads(metadata_path.read_text())
                final_score = meta.get("overall_score")
            except Exception:
                pass

        elapsed = time.time() - self.start_time
        await self._emit(
            {
                "type": "extraction_complete",
                "brand": self.slug,
                "final_score": final_score,
                "elapsed_s": round(elapsed, 1),
                "agents_completed": len(self.completed_agents),
                "failed_phases": self.failed_phases,
            }
        )
        _active_job = None


async def handle_connection(websocket):
    global _active_job

    if _active_job and not _active_job.cancelled:
        _active_job.ws = websocket
        await websocket.send(
            json.dumps(
                {
                    "type": "job_reconnected",
                    "phase": _active_job.current_phase,
                    "agent": _active_job.current_agent,
                    "failed_phases": _active_job.failed_phases,
                }
            )
        )

    async for message in websocket:
        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            continue

        msg_type = data.get("type")

        if msg_type == "start_extraction":
            if _active_job and not _active_job.cancelled:
                await websocket.send(
                    json.dumps(
                        {"type": "error", "message": "Extraction already running"}
                    )
                )
                continue
            job = ExtractionJob(
                url=data["url"],
                brand_name=data.get("brand_name", ""),
                max_pages=data.get("max_pages", MAX_PACKAGE_PAGES),
                ws=websocket,
                base_url=data.get("base_url"),
            )
            asyncio.create_task(job.run())

        elif msg_type == "resume_extraction":
            slug = data.get("slug", "")
            job_dir = (
                Path.home() / ".claude" / "design-library" / "cache" / slug / "jobs"
            )
            if not job_dir.exists():
                await websocket.send(
                    json.dumps(
                        {"type": "error", "message": f"No jobs found for {slug}"}
                    )
                )
                continue

            jobs = sorted(
                job_dir.glob("*.json"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            if not jobs:
                await websocket.send(
                    json.dumps({"type": "error", "message": f"No job state for {slug}"})
                )
                continue

            last_state = json.loads(jobs[0].read_text())
            all_phases = ["A", "B", "C", "D", "E"]
            completed = set(last_state.get("completed_phases", []))
            resume_from = None
            for p in all_phases:
                if p not in completed:
                    resume_from = p
                    break

            if resume_from is None:
                await websocket.send(
                    json.dumps(
                        {
                            "type": "status",
                            "message": f"All phases already completed for {slug}",
                        }
                    )
                )
                continue

            job = ExtractionJob(
                url=last_state.get("url", ""),
                brand_name=last_state.get("brand_name", ""),
                max_pages=last_state.get("max_pages", MAX_PACKAGE_PAGES),
                ws=websocket,
                start_from=resume_from,
                base_url=last_state.get("base_url"),
            )
            job.slug = slug
            await websocket.send(
                json.dumps(
                    {"type": "resuming", "slug": slug, "from_phase": resume_from}
                )
            )
            asyncio.create_task(job.run())

        elif msg_type == "cancel":
            if _active_job:
                _active_job.cancelled = True
                if _active_job.current_proc:
                    try:
                        _active_job.current_proc.kill()
                    except ProcessLookupError:
                        pass
                await websocket.send(
                    json.dumps({"type": "status", "message": "Cancellation requested"})
                )

        elif msg_type == "get_status":
            if _active_job:
                await websocket.send(
                    json.dumps(
                        {
                            "type": "job_status",
                            "phase": _active_job.current_phase,
                            "agent": _active_job.current_agent,
                            "cancelled": _active_job.cancelled,
                            "completed_agents": _active_job.completed_agents,
                            "failed_phases": _active_job.failed_phases,
                        }
                    )
                )
            else:
                await websocket.send(json.dumps({"type": "job_status", "idle": True}))

        elif msg_type == "feedback":
            if _active_job:
                _active_job.feedback_messages.append(data.get("message", ""))
                await websocket.send(
                    json.dumps({"type": "status", "message": "Feedback recorded"})
                )

        elif msg_type == "approve_continue":
            if _active_job:
                await websocket.send(
                    json.dumps({"type": "status", "message": "Approved, continuing"})
                )


async def heartbeat_broadcaster():
    global _connected_clients

    while True:
        await asyncio.sleep(15)
        closed = set()
        for ws in _connected_clients:
            try:
                await ws.send(json.dumps({"type": "heartbeat"}))
            except Exception:
                closed.add(ws)
        _connected_clients -= closed


async def handle_connection_wrapper(websocket):
    _connected_clients.add(websocket)
    try:
        await handle_connection(websocket)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        _connected_clients.discard(websocket)


async def main():
    print(f"design-extractor WebSocket server starting on ws://localhost:{PORT}")
    async with websockets.serve(handle_connection_wrapper, "localhost", PORT):
        asyncio.create_task(heartbeat_broadcaster())
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
