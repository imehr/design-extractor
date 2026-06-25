#!/usr/bin/env python3
"""
Design Extractor — End-to-End Brand Extraction Orchestrator

Runs the complete extraction pipeline from a single command:
    python3 scripts/extract_brand.py --url https://example.com

Phases:
  0.   Setup directories
  1.   Verify URL is reachable
  2.   Identify 5+ pages via nav link extraction
  3.   Extract DOM content + measurements from each page
  4.   Download assets (images, fonts, SVGs, CSS backgrounds)
  4.5  Mirror original pages offline (mirror_original_pages.py)
  5.   Build React/shadcn replicas via claude --print
  6.   Validate replicas via screenshot comparison
  6.5  Generate standalone HTML replicas (generate_html_replicas.py)
  7.   Publish design tokens, DESIGN.md, SKILL.md
  7.5  Export open-design format (export_open_design.py)
  8.   Register brand in the library index
  9.   Final verification of all artifacts
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    _RICH = True
    _console = Console()
except ImportError:
    _RICH = False
    _console = None

# Telemetry is best-effort: script lives in same dir as telemetry.py, so a
# direct import should always work when invoked as `python3 scripts/...`.
# Guarded so a missing telemetry.py never breaks the CLI.
try:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from telemetry import write_phase_event as _write_phase_event
except Exception:  # pragma: no cover — defensive fallback
    def _write_phase_event(*_args, **_kwargs):  # type: ignore[misc]
        return None

# ── Constants ─────────────────────────────────────────────────────────────

LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
CACHE_ROOT = LIBRARY_ROOT / "cache"
BRANDS_ROOT = LIBRARY_ROOT / "brands"
PLUGIN_DIR = Path(__file__).resolve().parent.parent  # design-extractor repo root
UI_DIR = PLUGIN_DIR / "ui"
SCRIPTS_DIR = PLUGIN_DIR / "scripts"

MIN_PAGES = 5
AGENT_BROWSER = "agent-browser"
DOM_EXTRACT_TIMEOUT = 45
SCREENSHOT_TIMEOUT = 20
DOM_OPEN_RETRIES = 3  # Retry transient agent-browser open failures per page.
MIN_SUCCESSFUL_PAGES = 1  # Homepage alone is enough to keep going; below this we abort.
MODEL_SETTINGS_PATH = LIBRARY_ROOT / "settings" / "model-providers.json"
MODEL_RUNNER_TIMEOUT = 1500  # 25 min per replica-build pass
VALIDATION_TIMEOUT = 1500  # Full 5-10 page packages, both viewports, can exceed 15 min.
MIRROR_TIMEOUT = 900  # Offline mirror downloads every CSS/font/image per page.
HTML_REPLICA_TIMEOUT = 900  # Token-styled HTML replicas + agent-browser verify screenshots.
OPEN_DESIGN_EXPORT_TIMEOUT = 300  # Pure file emit + parser round-trip check.
DEFAULT_REPLICA_BATCH_SIZE = 8
DEFAULT_MODEL_RUNNERS = {
    "claude-code": {
        "id": "claude-code",
        "type": "claude-code",
        "label": "Claude Code",
        "enabled": True,
        "command": "claude",
        "model": "sonnet",
        "permission_mode": "bypassPermissions",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    },
    "codex": {
        "id": "codex",
        "type": "codex",
        "label": "Codex",
        "enabled": False,
        "command": "codex",
        "model": "gpt-5.5",
        "permission_mode": "never",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    },
    "cursor": {
        "id": "cursor",
        "type": "cursor",
        "label": "Cursor Agent",
        "enabled": False,
        "command": "cursor",
        "model": "gpt-5",
        "permission_mode": "force",
        "allowed_tools": ["read", "edit", "bash"],
    },
    "kimi": {
        "id": "kimi",
        "type": "kimi",
        "label": "Kimi Code",
        "enabled": False,
        "command": "kimi",
        "model": "kimi-code/kimi-for-coding",
        "permission_mode": "yolo",
        "allowed_tools": ["read", "edit", "bash"],
    },
    "minimax": {
        "id": "minimax",
        "type": "minimax",
        "label": "MiniMax",
        "enabled": False,
        "command": "codex",
        "model": "codex-MiniMax-M2.1",
        "permission_mode": "never",
        "profile": "m21",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    },
    "opencode": {
        "id": "opencode",
        "type": "opencode",
        "label": "OpenCode",
        "enabled": False,
        "command": "opencode",
        "model": "opencode/big-pickle",
        "permission_mode": "dangerously-skip-permissions",
        "allowed_tools": ["read", "edit", "bash"],
    },
    "gemini": {
        "id": "gemini",
        "type": "gemini",
        "label": "Gemini CLI",
        "enabled": True,
        "command": "gemini",
        "model": "default",
        "permission_mode": "yolo",
        "allowed_tools": [],
    },
    "ollama": {
        "id": "ollama",
        "type": "ollama",
        "label": "Ollama",
        "enabled": True,
        "command": "codex",
        "model": "qwen3.5:35b-a3b",
        "permission_mode": "never",
        "local_provider": "ollama",
        "allowed_tools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────

def dev_server_base_url() -> str:
    return (
        os.environ.get("DESIGN_EXTRACTOR_BASE_URL")
        or os.environ.get("PORTLESS_URL")
        or "http://localhost:5173"
    ).rstrip("/")

def parse_eval_json(stdout: str):
    """Parse JSON from agent-browser eval output, handling double-quoting."""
    stdout = stdout.strip()
    if not stdout:
        return None
    try:
        parsed = json.loads(stdout)
        # agent-browser wraps eval results in quotes — unwrap if string containing JSON
        if isinstance(parsed, str):
            try:
                return json.loads(parsed)
            except (json.JSONDecodeError, TypeError):
                return parsed
        return parsed
    except json.JSONDecodeError:
        return None


def derive_slug(url: str) -> str:
    """https://www.example.com.au -> example-com-au"""
    parsed = urlparse(url)
    host = parsed.netloc
    if not host:
        host = parsed.path.split("/")[0]
    host = re.sub(r"^www\.", "", host)
    return host.replace(".", "-")


def run_cmd(
    cmd: list[str],
    *,
    timeout: int = 60,
    capture: bool = True,
    cwd: str | Path | None = None,
    check: bool = False,
    timeout_ok: bool = False,
) -> subprocess.CompletedProcess:
    """Run a subprocess with timeout. Returns CompletedProcess.

    By default a timeout raises RuntimeError (callers must handle it). Pass
    timeout_ok=True for best-effort steps (e.g. validation that already wrote
    its report) so a slow run returns the partial output instead of aborting
    the whole pipeline.

    The child is launched in its own session (process group) so that on timeout
    we can SIGKILL the *entire* tree — including any headless Chrome that a tool
    like agent-browser spawned. The standard subprocess.run() only kills the
    direct child and then drains its pipes with an unbounded wait, which
    deadlocks forever if a surviving grandchild still holds the pipe write end.
    The post-kill drain here is bounded, so a timeout can never wedge the run.
    """
    pipe = subprocess.PIPE if capture else None
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=pipe,
            stderr=pipe,
            text=True,
            cwd=str(cwd) if cwd is not None else None,
            start_new_session=True,
        )
    except FileNotFoundError:
        raise RuntimeError(f"Command not found: {cmd[0]}")

    try:
        stdout, stderr = proc.communicate(timeout=timeout)
        result = subprocess.CompletedProcess(cmd, proc.returncode, stdout, stderr)
        if check and result.returncode != 0:
            stderr_txt = (result.stderr or "").strip()
            raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(cmd)}\n{stderr_txt}")
        return result
    except subprocess.TimeoutExpired:
        _kill_proc_tree(proc)
        try:
            stdout, stderr = proc.communicate(timeout=10)
        except subprocess.TimeoutExpired:
            for stream in (proc.stdout, proc.stderr):
                try:
                    if stream is not None:
                        stream.close()
                except OSError:
                    pass
            stdout, stderr = "", ""
        if timeout_ok:
            return subprocess.CompletedProcess(cmd, returncode=-1, stdout=stdout or "", stderr=stderr or "")
        raise RuntimeError(f"Command timed out after {timeout}s: {' '.join(cmd)}")


def _kill_proc_tree(proc: subprocess.Popen) -> None:
    """SIGKILL the child's whole process group, falling back to the child."""
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        try:
            proc.kill()
        except ProcessLookupError:
            pass


def _default_runner_for(provider_id: str) -> dict:
    default = DEFAULT_MODEL_RUNNERS.get(provider_id, {})
    return {
        "id": default.get("id", provider_id),
        "type": default.get("type", provider_id),
        "label": default.get("label", provider_id.replace("-", " ").title()),
        "enabled": default.get("enabled", True),
        "command": default.get("command"),
        "model": default.get("model", "default"),
        "permission_mode": default.get("permission_mode"),
        "allowed_tools": list(default.get("allowed_tools", [])),
    }


def _merge_runner(provider_id: str, configured: dict | None) -> dict:
    runner = _default_runner_for(provider_id)
    configured = configured or {}
    for key in ("id", "type", "label", "command", "model", "permission_mode", "profile", "local_provider"):
        value = configured.get(key)
        if isinstance(value, str) and value.strip():
            runner[key] = value.strip()
    if isinstance(configured.get("enabled"), bool):
        runner["enabled"] = configured["enabled"]
    if isinstance(configured.get("allowed_tools"), list):
        runner["allowed_tools"] = [
            str(item).strip()
            for item in configured["allowed_tools"]
            if str(item).strip()
        ]
    return runner


def load_model_runner() -> dict:
    """Resolve the active task runner from the same settings file used by the UI."""
    raw: dict = {}
    try:
        if MODEL_SETTINGS_PATH.exists():
            raw = json.loads(MODEL_SETTINGS_PATH.read_text())
    except json.JSONDecodeError as exc:
        fail(f"Model provider settings are invalid JSON: {MODEL_SETTINGS_PATH} ({exc})")

    providers = raw.get("providers") if isinstance(raw.get("providers"), dict) else {}
    env_provider = os.environ.get("DESIGN_EXTRACTOR_PROVIDER", "").strip()
    active_provider = env_provider or str(raw.get("active_provider") or "claude-code")
    runner = _merge_runner(active_provider, providers.get(active_provider))
    if env_provider:
        # An explicit env override comes from the orchestrating server (e.g.
        # BYOK execution mode routing); it outranks the settings-file enabled
        # flag, which only governs the legacy active_provider picker.
        runner["enabled"] = True

    env_model = os.environ.get("DESIGN_EXTRACTOR_MODEL", "").strip()
    if env_model:
        runner["model"] = env_model
    if runner.get("type") == "kimi":
        _normalize_kimi_model_from_cli_config(runner)

    if not runner.get("enabled", False):
        fail(
            f"Selected task runner is disabled: {runner['label']} ({runner['id']}). "
            f"Enable it in {MODEL_SETTINGS_PATH} or choose another provider."
        )
    command = runner.get("command")
    if not command:
        fail(f"Selected task runner has no command configured: {runner['label']} ({runner['id']})")
    if shutil.which(command) is None:
        fail(f"Selected task runner command was not found on PATH: {command}")

    return runner


def _normalize_kimi_model_from_cli_config(runner: dict) -> None:
    """Use a Kimi CLI model key that exists in ~/.kimi/config.toml."""
    config_path = Path.home() / ".kimi" / "config.toml"
    try:
        config_text = config_path.read_text()
    except OSError:
        return

    configured_models = set(re.findall(r'^\[models\."([^"]+)"\]', config_text, flags=re.M))
    if not configured_models:
        return

    selected_model = str(runner.get("model") or "").strip()
    if selected_model in configured_models:
        return

    default_match = re.search(r'^default_model\s*=\s*"([^"]+)"', config_text, flags=re.M)
    default_model = default_match.group(1) if default_match else next(iter(configured_models))
    warn(
        f"Kimi model '{selected_model}' is not registered in {config_path}; "
        f"using Kimi CLI default '{default_model}' instead."
    )
    runner["model"] = default_model


def model_runner_label(runner: dict) -> str:
    model = runner.get("model") or "default"
    return f"{runner.get('label', runner.get('id'))} · {model}"


def build_model_runner_command(prompt: str, runner: dict) -> list[str]:
    """Build a non-interactive command for the configured model task runner."""
    command = str(runner["command"])
    runner_type = str(runner.get("type") or runner.get("id") or "")
    model = str(runner.get("model") or "").strip()

    if runner_type == "claude-code":
        args = [command, "--print", "-p", prompt, "--output-format", "text"]
        if model and model != "default":
            args[1:1] = ["--model", model]
        permission_mode = runner.get("permission_mode")
        if permission_mode:
            args.extend(["--permission-mode", str(permission_mode)])
        allowed_tools = runner.get("allowed_tools") or []
        if allowed_tools:
            args.extend(["--allowedTools", ",".join(allowed_tools)])
        return args

    if runner_type == "kimi":
        args = [
            command,
            "--work-dir",
            str(PLUGIN_DIR),
            "--print",
            "--final-message-only",
            "--output-format",
            "text",
        ]
        if model and model != "default":
            args.extend(["--model", model])
        args.extend(["--prompt", prompt])
        return args

    if runner_type == "codex":
        args = [command, "exec", "--cd", str(PLUGIN_DIR), "--dangerously-bypass-approvals-and-sandbox"]
        if model and model != "default":
            args.extend(["--model", model])
        args.append(prompt)
        return args

    if runner_type == "ollama":
        args = [
            command,
            "exec",
            "--cd",
            str(PLUGIN_DIR),
            "--oss",
            "--local-provider",
            str(runner.get("local_provider") or "ollama"),
            "--dangerously-bypass-approvals-and-sandbox",
        ]
        if model and model != "default":
            args.extend(["--model", model])
        args.append(prompt)
        return args

    if runner_type == "cursor":
        args = [
            command,
            "agent",
            "--print",
            "--output-format",
            "text",
            "--force",
            "--trust",
            "--workspace",
            str(PLUGIN_DIR),
        ]
        if model and model != "default":
            args.extend(["--model", model])
        args.append(prompt)
        return args

    if runner_type == "minimax":
        args = [
            command,
            "exec",
            "--cd",
            str(PLUGIN_DIR),
            "--profile",
            str(runner.get("profile") or "m21"),
            "--dangerously-bypass-approvals-and-sandbox",
        ]
        if model and model != "default":
            args.extend(["--model", model])
        args.append(prompt)
        return args

    if runner_type == "opencode":
        args = [
            command,
            "run",
            "--dir",
            str(PLUGIN_DIR),
            "--dangerously-skip-permissions",
            "--format",
            "default",
        ]
        if model and model != "default":
            args.extend(["--model", model])
        args.append(prompt)
        return args

    if runner_type == "gemini":
        # Gemini CLI has no --cd flag; run_cmd already sets cwd=PLUGIN_DIR.
        args = [
            command,
            "--approval-mode",
            str(runner.get("permission_mode") or "yolo"),
            "-p",
            prompt,
        ]
        if model and model != "default":
            args.extend(["--model", model])
        return args

    fail(f"Replica generation is not wired for {runner.get('label')} ({runner_type}).")


def short_session_name(prefix: str, *parts: str, max_len: int = 44) -> str:
    """Create an agent-browser session name that stays under socket path limits."""
    raw = "-".join(str(part) for part in parts if str(part))
    clean = re.sub(r"[^a-zA-Z0-9-]+", "-", raw).strip("-").lower()
    digest = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:8] if raw else "session"
    room = max(0, max_len - len(prefix) - len(digest) - 2)
    stem = clean[:room].strip("-")
    return f"{prefix}-{stem}-{digest}" if stem else f"{prefix}-{digest}"


def agent_browser_cmd(args: list[str], session: str, headed: bool = False) -> list[str]:
    """Build an agent-browser command list."""
    cmd = [AGENT_BROWSER] + args + ["--session", session]
    if headed:
        cmd.append("--headed")
    return cmd


def close_agent_browser_session(session: str) -> None:
    """Close an agent-browser session so repair/extraction does not leak browser daemons."""
    try:
        run_cmd(agent_browser_cmd(["close"], session=session), timeout=8, check=False)
    except Exception as e:
        warn(f"Could not close browser session {session}: {e}")


def close_agent_browser_session_after(session_name):
    """Decorator for extraction functions that own a named agent-browser session."""
    def decorator(func):
        def wrapped(*args, **kwargs):
            session = session_name(*args, **kwargs)
            try:
                return func(*args, **kwargs)
            finally:
                close_agent_browser_session(session)
        return wrapped
    return decorator


def dom_extract_session_name(*args, **kwargs) -> str:
    page_slug = kwargs.get("page_slug", args[0] if len(args) > 0 else "page")
    slug = kwargs.get("slug", args[2] if len(args) > 2 else "brand")
    return short_session_name("dom", slug, page_slug)


def phase_banner(phase_num: int | float | str, title: str, detail: str = "") -> None:
    """Print a visually distinct phase banner. Falls back to plain text if rich is missing."""
    if _RICH:
        body = Text()
        body.append(f"Phase {phase_num}", style="bold cyan")
        body.append(f"  {title}", style="bold white")
        if detail:
            body.append(f"\n{detail}", style="dim")
        _console.print(Panel(body, border_style="cyan", padding=(0, 1)))
    else:
        print()
        print("=" * 72)
        print(f"  Phase {phase_num}: {title}")
        if detail:
            print(f"  {detail}")
        print("=" * 72)


def step(msg: str) -> None:
    if _RICH:
        _console.print(f"[cyan]•[/] {msg}")
    else:
        print(f"  • {msg}")


def ok(msg: str) -> None:
    if _RICH:
        _console.print(f"[green]✓[/] {msg}")
    else:
        print(f"  [OK] {msg}")


def warn(msg: str) -> None:
    if _RICH:
        _console.print(f"[yellow]![/] {msg}")
    else:
        print(f"  [!] {msg}")


def info(msg: str) -> None:
    """Lightweight info line (plain, used for bulk output like lists)."""
    print(f"  {msg}")


def fail(msg: str) -> None:
    """Print an error and exit (non-zero). Preserves previous exit behavior."""
    if _RICH:
        _console.print(f"[red]✗[/] [bold red]FAILED:[/] {msg}")
    else:
        print(f"\n  [X] FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def assert_exists(path: Path, description: str) -> None:
    if not path.exists():
        fail(f"{description} not found: {path}")


# ── Raw CSS parsing (pure — unit tested without a browser) ───────────────

RAW_CSS_TOP_RULE_CAP = 50 * 1024  # ≤50KB of most-relevant rule text for fidelity evidence.


def _strip_css_comments(css: str) -> str:
    """Remove /* ... */ comments while preserving string literals."""
    out: list[str] = []
    i, n = 0, len(css)
    string_char: str | None = None
    while i < n:
        ch = css[i]
        if string_char:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(css[i + 1])
                i += 2
                continue
            if ch == string_char:
                string_char = None
            i += 1
            continue
        if ch in ('"', "'"):
            string_char = ch
            out.append(ch)
            i += 1
            continue
        if ch == "/" and i + 1 < n and css[i + 1] == "*":
            end = css.find("*/", i + 2)
            i = end + 2 if end != -1 else n
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def _iter_top_level_blocks(css: str) -> list[tuple[str, str]]:
    """Split CSS into ``(prelude, body)`` top-level blocks.

    Respects brace nesting and string literals so a ``}`` inside a string or
    nested at-rule cannot fool the splitter into ending a block early. Safe on
    malformed/empty input — it returns whatever complete blocks it finds.
    """
    blocks: list[tuple[str, str]] = []
    n = len(css)
    i = 0
    prelude_start = 0
    depth = 0
    string_char: str | None = None
    block_start: int | None = None
    while i < n:
        ch = css[i]
        if string_char:
            if ch == "\\" and i + 1 < n:
                i += 2
                continue
            if ch == string_char:
                string_char = None
            i += 1
            continue
        if ch in ('"', "'"):
            string_char = ch
            i += 1
            continue
        if ch == "/" and i + 1 < n and css[i + 1] == "*":
            end = css.find("*/", i + 2)
            i = end + 2 if end != -1 else n
            continue
        if ch == ";" and depth == 0:
            # An at-rule STATEMENT (e.g. ``@layer a, b;``, ``@import "...";``,
            # ``@charset "UTF-8";``) ends here with no block body. Reset the
            # prelude start so its text cannot leak into the next block's prelude.
            prelude_start = i + 1
            i += 1
            continue
        if ch == "{":
            if depth == 0:
                block_start = i
            depth += 1
            i += 1
            continue
        if ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and block_start is not None:
                    prelude = css[prelude_start:block_start].strip()
                    body = css[block_start + 1:i]
                    blocks.append((prelude, body))
                    prelude_start = i + 1
                    block_start = None
            i += 1
            continue
        i += 1
    return blocks


def _split_declarations(body: str) -> list[tuple[str, str]]:
    """Split a declaration block into ``(property, value)`` pairs.

    Respects parentheses (so ``rgb(...)`` / ``url(...)`` commas are safe) and
    string literals. A trailing declaration without a semicolon is still captured.
    """
    out: list[tuple[str, str]] = []
    buf: list[str] = []
    depth = 0
    string_char: str | None = None
    i, n = 0, len(body)
    while i < n:
        ch = body[i]
        if string_char:
            buf.append(ch)
            if ch == "\\" and i + 1 < n:
                buf.append(body[i + 1])
                i += 2
                continue
            if ch == string_char:
                string_char = None
            i += 1
            continue
        if ch in ('"', "'"):
            string_char = ch
            buf.append(ch)
            i += 1
            continue
        if ch == "(":
            depth += 1
            buf.append(ch)
            i += 1
            continue
        if ch == ")":
            depth = max(0, depth - 1)
            buf.append(ch)
            i += 1
            continue
        if ch == ";" and depth == 0:
            decl = "".join(buf)
            buf = []
            i += 1
            if ":" in decl:
                prop, val = decl.split(":", 1)
                out.append((prop.strip(), val.strip()))
            continue
        buf.append(ch)
        i += 1
    decl = "".join(buf)
    if ":" in decl:
        prop, val = decl.split(":", 1)
        out.append((prop.strip(), val.strip()))
    return out


def _at_rule_keyword(prelude: str) -> str | None:
    """Return the at-rule keyword (e.g. ``media``, ``-webkit-keyframes``) or None."""
    p = prelude.strip()
    if not p.startswith("@"):
        return None
    m = re.match(r"@(-[A-Za-z]+-)?([A-Za-z][A-Za-z\-]*)", p)
    if not m:
        return None
    return (m.group(1) or "") + m.group(2)


def _strip_at_keyword(prelude: str, keyword: str) -> str:
    p = prelude.strip()
    m = re.match(r"@(-[A-Za-z]+-)?" + re.escape(keyword) + r"\s*", p)
    return p[m.end():] if m else p


def _is_root_selector(selector: str) -> bool:
    return bool(re.match(r"^(html|:root)([^a-z0-9]|$)", selector.strip().lower()))


def parse_raw_css_buckets(css_text: str) -> dict:
    """Parse serialized CSS text into OD-oriented buckets.

    Pure and browser-free so it is fully unit-testable. Buckets:

    * ``rootVars``      — custom-property declarations scraped from :root/html rules
    * ``mediaQueries``  — ``{query, ruleCount}``
    * ``keyframes``     — ``{name, steps:[{stop, declarations}]}``
    * ``layers``        — ``@layer`` names
    * ``fontFace``      — ``{family, src}`` from ``@font-face``
    * ``supportsRules`` — ``@supports`` condition strings
    * ``topRules``      — ≤ ``RAW_CSS_TOP_RULE_CAP`` bytes of relevant rule text
    """
    buckets: dict = {
        "rootVars": {},
        "mediaQueries": [],
        "keyframes": [],
        "layers": [],
        "fontFace": [],
        "supportsRules": [],
        "topRules": "",
    }
    if not css_text:
        return buckets

    css = _strip_css_comments(css_text)

    # @layer statement form: ``@layer base, components;`` (no block).
    for m in re.finditer(r"@layer\s+([A-Za-z0-9_,\s\-]+);", css):
        for name in m.group(1).split(","):
            name = name.strip()
            if name and name not in buckets["layers"]:
                buckets["layers"].append(name)

    top_chunks: list[str] = []
    top_bytes = 0

    for prelude, body in _iter_top_level_blocks(css):
        key = _at_rule_keyword(prelude)
        if key == "media":
            query = _strip_at_keyword(prelude, "media").strip()
            buckets["mediaQueries"].append(
                {"query": query, "ruleCount": len(_iter_top_level_blocks(body))}
            )
        elif key and key.endswith("keyframes"):
            name = _strip_at_keyword(prelude, "keyframes").strip() or prelude.split()[-1]
            steps = [
                {"stop": stop.strip(), "declarations": decls.strip()}
                for stop, decls in _iter_top_level_blocks(body)
            ]
            buckets["keyframes"].append({"name": name, "steps": steps})
        elif key == "font-face":
            decls = dict(_split_declarations(body))
            family = decls.get("font-family", "").strip().strip('"').strip("'")
            buckets["fontFace"].append({"family": family, "src": decls.get("src", "").strip()})
        elif key == "supports":
            buckets["supportsRules"].append(_strip_at_keyword(prelude, "supports").strip())
        elif key == "layer":
            name = _strip_at_keyword(prelude, "layer").strip()
            if name and name not in buckets["layers"]:
                buckets["layers"].append(name)
        elif key is None:
            selectors = [s.strip() for s in prelude.split(",")]
            if any(_is_root_selector(s) for s in selectors):
                for prop, val in _split_declarations(body):
                    if prop.startswith("--"):
                        buckets["rootVars"][prop] = val
            if top_bytes < RAW_CSS_TOP_RULE_CAP:
                chunk = f"{prelude}{{{body}}}"
                top_chunks.append(chunk)
                top_bytes += len(chunk) + 1  # +1 for the join newline

    buckets["topRules"] = "\n".join(top_chunks)[:RAW_CSS_TOP_RULE_CAP]
    return buckets


# ── Phase 0: Setup ───────────────────────────────────────────────────────

def setup_directories(slug: str) -> dict[str, Path]:
    """Create all required directories. Returns a dict of key paths."""
    cache_dir = CACHE_ROOT / slug
    brands_dir = BRANDS_ROOT / slug
    public_dir = UI_DIR / "public" / "brands" / slug
    components_dir = UI_DIR / "components" / "brands" / slug
    replica_dir = UI_DIR / "app" / "brands" / slug / "replica"

    dirs = {
        "cache": cache_dir,
        "brands": brands_dir,
        "dom_extraction": cache_dir / "dom-extraction",
        "screenshots_ref": cache_dir / "screenshots" / "reference",
        "screenshots_cmp": cache_dir / "screenshots" / "comparison",
        "screenshots_harness": cache_dir / "screenshots" / "harness",
        "assets_cache": cache_dir / "assets",
        "validation": cache_dir / "validation",
        "public": public_dir,
        "public_fonts": public_dir / "fonts",
        "public_social": public_dir / "social",
        "components": components_dir,
        "replica": replica_dir,
        "brands_validation": brands_dir / "validation",
        "brands_skill": brands_dir / "skill",
        "brands_dom_extraction": brands_dir / "dom-extraction",
    }

    for name, d in dirs.items():
        d.mkdir(parents=True, exist_ok=True)

    return dirs


# ── Phase 0.5: Verify Agent Rules ────────────────────────────────────────

def verify_agent_rules():
    """Check that agent files contain critical learned rules."""
    phase_banner(0, "Verifying agent rules", "Checking critical learned rules in agent definitions")
    rules_to_check = {
        "agents/dom-extractor.md": ["background-image", "sectionCount", "Step 7"],
        "agents/replica-builder.md": ["section completeness", "DOM measurement", "object-cover"],
    }
    missing = []
    for agent_file, required_terms in rules_to_check.items():
        path = PLUGIN_DIR / agent_file
        if not path.exists():
            missing.append(f"{agent_file} not found")
            continue
        content = path.read_text().lower()
        for term in required_terms:
            if term.lower() not in content:
                missing.append(f"{agent_file} missing rule: '{term}'")

    if missing:
        for m in missing:
            warn(m)
    else:
        ok("All agent rules verified")


# ── Phase 1: Verify URL ──────────────────────────────────────────────────

def verify_url(url: str, headed: bool) -> str:
    """Open the URL in agent-browser and verify it loads. Returns page title."""
    phase_banner(1, "Verifying URL", url)

    session = f"verify-{int(time.time())}"
    try:
        cmd_open = agent_browser_cmd(["open", url], session=session, headed=headed)
        run_cmd(cmd_open, timeout=30, check=True)

        # Wait for page to settle
        time.sleep(3)  # Simple wait instead of networkidle (many sites never reach idle)

        # Extract title
        result = run_cmd(
            agent_browser_cmd(
                ["eval", "document.title"],
                session=session,
            ),
            timeout=10,
        )
        title = (result.stdout or "").strip()

        if not title or "404" in title.lower() or "not found" in title.lower():
            fail(f"URL appears invalid. Page title: '{title}'")

        ok(f"Page title: {title}")
        return title
    finally:
        close_agent_browser_session(session)


# ── Phase 2: Identify Pages ──────────────────────────────────────────────

def identify_pages(url: str, headed: bool, all_pages: bool = False, page_limit: int | None = None) -> dict[str, dict]:
    """Extract nav links and classify into page types. Returns pages dict."""
    detail = "Extracting nav links and classifying page types"
    if all_pages:
        detail = "Extracting all sitemap/nav pages"
    phase_banner(2, "Identifying pages", detail)

    session = f"recon-{int(time.time())}"
    try:
        cmd_open = agent_browser_cmd(["open", url], session=session, headed=headed)
        run_cmd(cmd_open, timeout=30, check=True)
        time.sleep(3)  # Simple wait instead of networkidle (many sites never reach idle)

        # Extract all internal links from nav/header elements
        js_extract = """JSON.stringify((() => {
        const domain = window.location.hostname;
        const base = window.location.origin;
        const links = new Map();

        // Collect from nav, header, and main navigation areas
        const selectors = [
            'nav a[href]', 'header a[href]', '[role="navigation"] a[href]',
            '[class*="nav"] a[href]', '[class*="menu"] a[href]',
            'footer a[href]'
        ];

        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(a => {
                try {
                    const href = new URL(a.href, base);
                    if (href.hostname !== domain) return;
                    const path = href.pathname.replace(/\\/$/, '') || '/';
                    if (path === '#' || href.hash) return;
                    if (/\\.(pdf|jpg|png|svg|zip|xml|json)$/i.test(path)) return;
                    if (!links.has(path)) {
                        links.set(path, {
                            url: href.origin + href.pathname,
                            text: a.textContent.trim().substring(0, 80),
                            source: sel.split(' ')[0]
                        });
                    }
                } catch(e) {}
            });
        });

        return Array.from(links.entries()).map(([path, data]) => ({
            path: path,
            url: data.url,
            text: data.text,
            source: data.source
        }));
    })())"""

        result = run_cmd(
            agent_browser_cmd(["eval", js_extract], session=session),
            timeout=15,
        )

        raw_links = []
        stdout = (result.stdout or "").strip()
        if stdout:
            parsed_json = parse_eval_json(stdout)
            if isinstance(parsed_json, list):
                raw_links = parsed_json
            else:
                warn(f"Could not parse nav links. Raw output: {stdout[:200]}")

        step(f"Found {len(raw_links)} internal links")

        if all_pages:
            sitemap_links = discover_sitemap_links(url)
            if sitemap_links:
                step(f"Found {len(sitemap_links)} sitemap page URLs")
                raw_links = _dedupe_links([*raw_links, *sitemap_links])

        # Classify links into page types
        classified = _classify_links(raw_links, url)

        # Build the pages dict matching the format run_validation_loop.py expects
        slug = derive_slug(url)
        selection_limit = page_limit if page_limit and page_limit > 0 else None
        if not all_pages and selection_limit is None:
            selection_limit = MIN_PAGES

        pages: dict[str, dict] = {
            "homepage": {
                "original_url": url.rstrip("/") + "/",
                "replica_route": f"/brands/{slug}/replica",
            }
        }
        used_paths = {"/"}
        used_urls = {_normalize_page_url(url.rstrip("/") + "/")}

        if all_pages:
            for link in raw_links:
                if _page_limit_reached(pages, selection_limit):
                    break
                _add_page_from_link(pages, used_paths, used_urls, slug, link)
        else:
            # Pick best pages from each category, aiming for MIN_PAGES total
            categories_priority = ["about", "product", "contact", "content", "careers", "pricing", "docs", "legal", "other"]

            for cat in categories_priority:
                if _page_limit_reached(pages, selection_limit):
                    break
                for link in classified.get(cat, []):
                    if _add_page_from_link(pages, used_paths, used_urls, slug, link):
                        break

            # If still under MIN_PAGES, grab any remaining links
            if selection_limit is not None and len(pages) < selection_limit:
                for link in raw_links:
                    if _page_limit_reached(pages, selection_limit):
                        break
                    _add_page_from_link(pages, used_paths, used_urls, slug, link)

        ok(f"Selected {len(pages)} pages:")
        for name, config in pages.items():
            info(f"  {name}: {config['original_url']}")

        if len(pages) < 2:
            fail(f"Only found {len(pages)} page(s). Need at least 2 for meaningful extraction.")

        return pages
    finally:
        close_agent_browser_session(session)


def _classify_links(links: list[dict], base_url: str) -> dict[str, list]:
    """Classify links into page type buckets."""
    categories: dict[str, list] = {}
    keywords = {
        "about": ["about", "who-we-are", "our-story", "company", "team"],
        "product": ["product", "service", "solution", "feature", "offering", "personal-banking", "business"],
        "contact": ["contact", "get-in-touch", "support", "help"],
        "content": ["blog", "news", "article", "insight", "perspective", "media", "resource"],
        "careers": ["career", "job", "work-with-us", "join"],
        "pricing": ["pricing", "plan", "package"],
        "docs": ["doc", "api", "developer", "guide"],
        "legal": ["privacy", "terms", "legal", "disclaimer"],
    }

    for link in links:
        path = link.get("path", "").lower()
        text = link.get("text", "").lower()
        matched = False
        for cat, kws in keywords.items():
            if any(kw in path or kw in text for kw in kws):
                categories.setdefault(cat, []).append(link)
                matched = True
                break
        if not matched and path != "/":
            categories.setdefault("other", []).append(link)

    return categories


def discover_sitemap_links(url: str) -> list[dict]:
    """Discover page URLs from sitemap.xml and nested sitemap indexes."""
    parsed = urlparse(url if url.startswith("http") else f"https://{url}")
    origin = f"{parsed.scheme}://{parsed.netloc}"
    queue = [
        urljoin(origin, "/sitemap.xml"),
        urljoin(origin, "/sitemap_index.xml"),
    ]
    seen_sitemaps: set[str] = set()
    allowed_hosts = {_host_key(parsed.netloc)}
    page_urls: list[str] = []

    while queue and len(seen_sitemaps) < 25:
        sitemap_url = queue.pop(0)
        normalized_sitemap = _normalize_page_url(sitemap_url)
        if normalized_sitemap in seen_sitemaps:
            continue
        seen_sitemaps.add(normalized_sitemap)

        try:
            request = urllib.request.Request(
                sitemap_url,
                headers={"User-Agent": "design-extractor/0.3 (+https://localhost)"},
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                final_url = response.geturl()
                allowed_hosts.add(_host_key(urlparse(final_url).netloc))
                xml_text = response.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            warn(f"Could not read sitemap {sitemap_url}: {exc}")
            continue

        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError:
            warn(f"Sitemap was not valid XML: {sitemap_url}")
            continue

        locs = [
            (loc.text or "").strip()
            for loc in root.iter()
            if _xml_tag_name(loc) == "loc" and (loc.text or "").strip()
        ]

        if _xml_tag_name(root) == "sitemapindex":
            for loc in locs:
                if _same_allowed_host(loc, allowed_hosts):
                    queue.append(loc)
            continue

        for loc in locs:
            clean_url = _normalize_page_url(loc)
            if _same_allowed_host(clean_url, allowed_hosts) and _is_extractable_page_url(clean_url):
                page_urls.append(clean_url)

    return _dedupe_links(
        [
            {
                "path": _url_path_key(page_url),
                "url": page_url,
                "text": "",
                "source": "sitemap",
            }
            for page_url in page_urls
        ]
    )


def _xml_tag_name(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def _host_key(host: str) -> str:
    return re.sub(r"^www\.", "", (host or "").lower())


def _same_allowed_host(candidate_url: str, allowed_hosts: set[str]) -> bool:
    return _host_key(urlparse(candidate_url).netloc) in allowed_hosts


def _normalize_page_url(page_url: str) -> str:
    parsed = urlparse(page_url)
    path = parsed.path or "/"
    return parsed._replace(path=path, params="", query="", fragment="").geturl()


def _url_path_key(page_url: str) -> str:
    path = urlparse(page_url).path or "/"
    return path.rstrip("/") or "/"


def _is_extractable_page_url(page_url: str) -> bool:
    parsed = urlparse(page_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return False
    path = parsed.path or "/"
    if re.search(r"\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|xml|json|css|js|ico|woff2?)$", path, re.I):
        return False
    return True


def _dedupe_links(links: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for link in links:
        clean_url = _normalize_page_url(str(link.get("url", "")))
        if not clean_url or clean_url in seen:
            continue
        seen.add(clean_url)
        path = str(link.get("path") or _url_path_key(clean_url))
        out.append({**link, "url": clean_url, "path": path.rstrip("/") or "/"})
    return out


def _page_limit_reached(pages: dict[str, dict], page_limit: int | None) -> bool:
    return page_limit is not None and len(pages) >= page_limit


def _add_page_from_link(
    pages: dict[str, dict],
    used_paths: set[str],
    used_urls: set[str],
    brand_slug: str,
    link: dict,
) -> bool:
    page_url = _normalize_page_url(str(link.get("url", "")))
    if not page_url or not _is_extractable_page_url(page_url):
        return False
    path = str(link.get("path") or _url_path_key(page_url)).rstrip("/") or "/"
    if path in used_paths or path == "/" or page_url in used_urls:
        return False

    page_slug = _unique_page_slug(path, pages)
    if not page_slug or page_slug == "homepage":
        return False

    pages[page_slug] = {
        "original_url": page_url,
        "replica_route": f"/brands/{brand_slug}/replica/{page_slug}",
    }
    used_paths.add(path)
    used_urls.add(page_url)
    return True


def _path_to_slug(path: str) -> str:
    """Convert a URL path to a slug for file naming."""
    path = path.strip("/")
    if not path:
        return ""
    # Take last meaningful segment
    parts = [p for p in path.split("/") if p and not re.match(r"^(au|en|shop)$", p, re.I)]
    if not parts:
        return ""
    slug = parts[-1]
    # Clean up
    slug = re.sub(r"\.(html?|aspx?|php|jsp)$", "", slug, flags=re.I)
    slug = re.sub(r"[^a-zA-Z0-9-]", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-").lower()
    return slug[:50]  # Cap length


def _unique_page_slug(path: str, pages: dict[str, dict]) -> str:
    base = _path_to_slug(path)
    if not base:
        return ""
    if base not in pages:
        return base

    full_slug = _slugify_path(path)
    if full_slug and full_slug not in pages:
        return full_slug

    suffix = 2
    while f"{base}-{suffix}" in pages:
        suffix += 1
    return f"{base}-{suffix}"


def _slugify_path(path: str) -> str:
    parts = [
        re.sub(r"\.(html?|aspx?|php|jsp)$", "", part, flags=re.I)
        for part in path.strip("/").split("/")
        if part and not re.match(r"^(au|en|shop)$", part, re.I)
    ]
    slug = "-".join(parts)
    slug = re.sub(r"[^a-zA-Z0-9-]", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-").lower()
    return slug[:80]


def write_pages_json(slug: str, pages: dict) -> Path:
    """Write pages.json to cache/validation/."""
    pages_path = CACHE_ROOT / slug / "validation" / "pages.json"
    pages_path.parent.mkdir(parents=True, exist_ok=True)
    with open(pages_path, "w") as f:
        json.dump(pages, f, indent=2)
    ok(f"Wrote {pages_path}")
    return pages_path


# ── Phase 3: Extract DOM ─────────────────────────────────────────────────

# JS probe that walks document.styleSheets and returns per-sheet cssText.
# Cross-origin sheets throw SecurityError on cssRules access → flagged for a
# same-origin browser fetch fallback (see capture_raw_css_for_page). The Python
# side aggregates the cssText and runs the pure parse_raw_css_buckets on it.
JS_CAPTURE_RAW_CSS = """JSON.stringify((() => {
    const sheets = [];
    let totalBytes = 0;
    const MAX = 2 * 1024 * 1024;
    for (const sheet of document.styleSheets) {
        const info = { href: sheet.href || '', media: '', crossOrigin: false, cssText: '', error: '' };
        try { info.media = (sheet.media && sheet.media.mediaText) || ''; } catch(e) {}
        try {
            const rules = sheet.cssRules;
            if (rules && rules.length) {
                let txt = '';
                for (let i = 0; i < rules.length; i++) {
                    txt += rules[i].cssText + '\\n';
                    if (txt.length > MAX) { txt = txt.slice(0, MAX); break; }
                }
                info.cssText = txt;
            }
        } catch (e) {
            info.crossOrigin = true;
            info.error = String((e && e.name) || e);
        }
        totalBytes += info.cssText.length;
        sheets.push(info);
        if (totalBytes > MAX) break;
    }
    return { sheets: sheets, totalBytes: totalBytes };
})())"""


def capture_raw_css_for_page(
    page_slug: str, slug: str, dirs: dict, session: str, headed: bool
) -> dict:
    """Capture raw CSS (root vars, media, keyframes, @font-face, @layer, @supports).

    Runs the JS probe against the already-open page session, aggregates each
    sheet's cssText, re-fetches cross-origin sheets via the browser fetch
    fallback, then runs the pure parse_raw_css_buckets. Writes
    ``cache/<slug>/dom-extraction/<page>-rawcss.json``. Never raises — a raw-CSS
    failure must not abort DOM extraction.
    """
    rawcss_path = dirs["dom_extraction"] / f"{page_slug}-rawcss.json"
    try:
        result = run_cmd(
            agent_browser_cmd(["eval", JS_CAPTURE_RAW_CSS], session=session),
            timeout=DOM_EXTRACT_TIMEOUT,
        )
        payload = parse_eval_json((result.stdout or "").strip()) or {}
        sheets = payload.get("sheets", []) if isinstance(payload, dict) else []

        aggregated: list[str] = []
        cors_hrefs: list[str] = []
        for s in sheets:
            if not isinstance(s, dict):
                continue
            css_text = s.get("cssText", "") or ""
            if css_text:
                aggregated.append(css_text)
            elif s.get("crossOrigin") and s.get("href"):
                cors_hrefs.append(s["href"])

        for href in cors_hrefs:
            digest = hashlib.md5(str(href).encode("utf-8")).hexdigest()[:10]
            tmp = dirs["cache"] / f"_cors-{page_slug}-{digest}.css"
            cors_session = short_session_name("rawcss", slug, page_slug)
            try:
                if _browser_fetch_fallback(href, str(tmp), session=cors_session, headed=headed):
                    aggregated.append(tmp.read_text(encoding="utf-8", errors="replace"))
            except Exception as e:  # noqa: BLE001 — best-effort CORS fetch
                warn(f"{page_slug}: CORS CSS re-fetch failed for {href[:80]}: {e}")
            finally:
                try:
                    tmp.unlink(missing_ok=True)
                except OSError:
                    pass

        buckets = parse_raw_css_buckets("\n".join(aggregated))
        buckets["_meta"] = {
            "sheets": len(sheets),
            "crossOriginSheets": len(cors_hrefs),
            "aggregatedBytes": sum(len(t) for t in aggregated),
        }
        with open(rawcss_path, "w") as f:
            json.dump(buckets, f, indent=2)
        return buckets
    except Exception as e:  # noqa: BLE001 — raw CSS capture is non-fatal
        warn(f"{page_slug}: raw CSS capture failed ({e})")
        return {}


@close_agent_browser_session_after(dom_extract_session_name)
def extract_dom(page_slug: str, page_url: str, slug: str, dirs: dict, headed: bool, skip_existing: bool) -> None:
    """Extract DOM content and measurements from a single page."""
    dom_dir = dirs["dom_extraction"]
    dom_json_path = dom_dir / f"{page_slug}.json"
    measurements_path = dom_dir / f"{page_slug}-measurements.json"
    screenshot_path = dom_dir / f"{page_slug}-screenshot.png"
    html_snapshot_path = dirs["brands_dom_extraction"] / f"{page_slug}-snapshot.html"
    cache_html_snapshot_path = dom_dir / f"{page_slug}-snapshot.html"

    if skip_existing and dom_json_path.exists() and measurements_path.exists() and html_snapshot_path.exists():
        step(f"{page_slug}: skipped (exists)")
        return

    session = short_session_name("dom", slug, page_slug)
    step(f"{page_slug}: opening {page_url}")

    # Open page — retry transient failures (cold browser, slow page, momentary
    # network hiccup) before giving up. A single flaky open must not be able to
    # abort the whole extraction; the caller (extract_all_dom) isolates the page
    # if every attempt fails.
    last_error: Exception | None = None
    for attempt in range(1, DOM_OPEN_RETRIES + 1):
        try:
            run_cmd(
                agent_browser_cmd(["open", page_url], session=session, headed=headed),
                timeout=30,
                check=True,
            )
            last_error = None
            break
        except RuntimeError as e:
            last_error = e
            warn(f"{page_slug}: open attempt {attempt}/{DOM_OPEN_RETRIES} failed ({e})")
            close_agent_browser_session(session)
            if attempt < DOM_OPEN_RETRIES:
                time.sleep(2 * attempt)
    if last_error is not None:
        raise last_error
    time.sleep(3)  # Simple wait instead of networkidle (many sites never reach idle)

    # Take reference screenshot
    run_cmd(
        agent_browser_cmd(["screenshot", str(screenshot_path), "--full"], session=session),
        timeout=SCREENSHOT_TIMEOUT,
    )

    # Also save to reference screenshots dir
    ref_path = dirs["screenshots_ref"] / f"{page_slug}.png"
    if screenshot_path.exists():
        shutil.copy2(screenshot_path, ref_path)

    # Extract DOM content
    # NOTE: Three critical fixes vs earlier versions:
    #   1. backgroundImages walks section descendants, not just section element.
    #      Hero backgrounds live on inner <div>, not on the <main> wrapper.
    #   2. Dedicated header block captures logo <img>/<svg>/[class*=logo]
    #      outside the strict <header>/<nav> tag selectors.
    #   3. Top-level allImages + allBackgroundImages fallback arrays
    #      catch anything missed by section traversal.
    js_dom = """JSON.stringify((() => {
        const parseUrls = (bgImg) => {
            if (!bgImg || bgImg === 'none') return [];
            const out = [];
            const matches = bgImg.match(/url\\(["']?([^"')]+)["']?\\)/g) || [];
            matches.forEach(m => {
                const clean = m.replace(/url\\(["']?/, '').replace(/["']?\\)$/, '');
                if (clean && !clean.startsWith('data:')) out.push(clean);
            });
            return out;
        };
        // Reject SVG fragment references: url(#clip-path), or browser-resolved forms
        // like 'https://origin/#clip-path' that point at inline SVG <defs>.
        // Chromium sometimes URL-encodes the hash into the path as /%23clip-path,
        // so we also check for that shape.
        const isSvgFragmentRef = (u) => {
            if (!u) return true;
            if (u.startsWith('#')) return true;
            // Match 'https?://host/#...' or 'https?://host/%23...'
            if (/^https?:\\/\\/[^\\/]+\\/(?:#|%23)/i.test(u)) return true;
            try {
                const parsed = new URL(u, window.location.href);
                const isSameOrigin = parsed.origin === window.location.origin;
                const decodedPath = decodeURIComponent(parsed.pathname || '');
                const hasMeaningfulPath = decodedPath && decodedPath !== '/' && !decodedPath.startsWith('/#');
                if (!hasMeaningfulPath && (parsed.hash || decodedPath.startsWith('/#'))) return true;
                if (!hasMeaningfulPath && isSameOrigin) return true;
            } catch {}
            return false;
        };
        const absolute = (u) => {
            try { return new URL(u, window.location.href).href; } catch { return u; }
        };

        // Fallback: every <img> on the page (dedupe later)
        const allImages = Array.from(document.querySelectorAll('img[src]')).map(img => {
            const r = img.getBoundingClientRect();
            return {
                src: absolute(img.src),
                alt: img.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight,
                loc: { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
            };
        });

        // Fallback: every background-image on the page (walk all elements)
        const allBackgroundImages = [];
        const seenBg = new Set();
        Array.from(document.querySelectorAll('body *')).forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width < 40 || r.height < 40) return;
            const urls = parseUrls(getComputedStyle(el).backgroundImage);
            urls.forEach(u => {
                if (isSvgFragmentRef(u)) return;
                const abs = absolute(u);
                if (isSvgFragmentRef(abs)) return;
                if (seenBg.has(abs)) return;
                seenBg.add(abs);
                allBackgroundImages.push({
                    url: abs,
                    tag: el.tagName.toLowerCase(),
                    className: (el.className?.toString?.() || '').substring(0, 120),
                    loc: { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
                });
            });
        });

        // Dedicated header extraction (logo images, inline SVG, nav)
        const header = { logo: null, logoImages: [], logoSvgs: [] };
        const logoCandidateSelectors = [
            'header a[href="/"] img',
            'a[title*="logo" i] img',
            'a[aria-label*="logo" i] img',
            '[class*="logo"] img',
            'header img[alt*="logo" i]'
        ];
        for (const sel of logoCandidateSelectors) {
            document.querySelectorAll(sel).forEach(img => {
                if (!header.logo) {
                    header.logo = { src: absolute(img.src), alt: img.alt || '', type: 'img' };
                }
                header.logoImages.push({ src: absolute(img.src), alt: img.alt || '' });
            });
            if (header.logo) break;
        }
        if (!header.logo) {
            const svgSelectors = ['header a[href="/"] svg', '[class*="logo"] svg', 'header svg'];
            for (const sel of svgSelectors) {
                const svg = document.querySelector(sel);
                if (svg) {
                    header.logo = { outerHTML: svg.outerHTML.substring(0, 8000), type: 'svg' };
                    header.logoSvgs.push(svg.outerHTML.substring(0, 8000));
                    break;
                }
            }
        }

        const sections = [];
        const allSections = document.querySelectorAll('header, nav, main, section, footer, [role="main"], [role="banner"], [role="contentinfo"], article, .hero, [class*="hero"]');

        allSections.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            if (rect.height === 0) return;
            const section = {
                tag: el.tagName.toLowerCase(),
                role: el.getAttribute('role') || '',
                className: el.className?.toString?.()?.substring(0, 200) || '',
                headings: [],
                text: [],
                links: [],
                images: [],
                backgroundImages: []
            };

            el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
                section.headings.push({
                    level: h.tagName.toLowerCase(),
                    text: h.textContent.trim().substring(0, 200)
                });
            });

            el.querySelectorAll('p, li, span, div').forEach(t => {
                const text = t.textContent.trim();
                if (text.length > 10 && text.length < 500 && t.children.length < 3) {
                    section.text.push(text.substring(0, 300));
                }
            });
            section.text = section.text.slice(0, 20);

            el.querySelectorAll('a[href]').forEach(a => {
                section.links.push({
                    text: a.textContent.trim().substring(0, 100),
                    href: a.href
                });
            });
            section.links = section.links.slice(0, 30);

            el.querySelectorAll('img[src]').forEach(img => {
                section.images.push({
                    src: absolute(img.src),
                    alt: img.alt || '',
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            });

            // FIX: walk section + descendants for background-image, not just the section itself.
            const seenInSection = new Set();
            const scanEl = (target) => {
                const urls = parseUrls(getComputedStyle(target).backgroundImage);
                urls.forEach(u => {
                    if (isSvgFragmentRef(u)) return;
                    const abs = absolute(u);
                    if (isSvgFragmentRef(abs)) return;
                    if (seenInSection.has(abs)) return;
                    seenInSection.add(abs);
                    section.backgroundImages.push(abs);
                });
            };
            scanEl(el);
            el.querySelectorAll('*').forEach(child => {
                const r = child.getBoundingClientRect();
                if (r.width < 60 || r.height < 60) return;
                scanEl(child);
            });

            sections.push(section);
        });

        return {
            url: window.location.href,
            title: document.title,
            sections: sections,
            header: header,
            allImages: allImages,
            allBackgroundImages: allBackgroundImages
        };
    })())"""

    result = run_cmd(
        agent_browser_cmd(["eval", js_dom], session=session),
        timeout=DOM_EXTRACT_TIMEOUT,
    )

    dom_data = {}
    stdout = (result.stdout or "").strip()
    if stdout:
        dom_data = parse_eval_json(stdout)
        if dom_data is None:
            warn(f"Could not parse DOM extraction for {page_slug}")
            dom_data = {"url": page_url, "title": "", "sections": [], "parse_error": True}

    with open(dom_json_path, "w") as f:
        json.dump(dom_data, f, indent=2)

    # Save the rendered source page as an HTML artifact for review/raw-file workflows.
    # The review API expects these under brands/<slug>/dom-extraction/.
    js_html = "JSON.stringify(document.documentElement.outerHTML)"
    html_result = run_cmd(
        agent_browser_cmd(["eval", js_html], session=session),
        timeout=DOM_EXTRACT_TIMEOUT,
    )
    html_snapshot = None
    stdout = (html_result.stdout or "").strip()
    if stdout:
        html_snapshot = parse_eval_json(stdout)
    if isinstance(html_snapshot, str) and "<html" in html_snapshot.lower():
        html_snapshot_path.write_text(html_snapshot, encoding="utf-8")
        cache_html_snapshot_path.write_text(html_snapshot, encoding="utf-8")
    else:
        warn(f"Could not save HTML snapshot for {page_slug}")

    # Extract measurements
    js_measurements = """JSON.stringify((() => {
        const cs = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el) : null; };
        const rect = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect() : null; };
        const body = cs('body');
        const header = rect('header') || rect('nav') || rect('[role="banner"]');
        const hero = rect('.hero, [class*="hero"], main > section:first-child, main > div:first-child');
        const footer = rect('footer') || rect('[role="contentinfo"]');

        const colors = {};
        const uniqueTextColors = new Set();
        const uniqueBgColors = new Set();

        document.querySelectorAll('h1, h2, h3, p, a, button, span').forEach(el => {
            const s = getComputedStyle(el);
            uniqueTextColors.add(s.color);
            if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') uniqueBgColors.add(s.backgroundColor);
        });

        const headerEl = document.querySelector('header') || document.querySelector('[role="banner"]');
        if (headerEl) {
            const hs = getComputedStyle(headerEl);
            colors.headerBg = hs.backgroundColor;
        }

        const footerEl = document.querySelector('footer') || document.querySelector('[role="contentinfo"]');
        if (footerEl) {
            const fs = getComputedStyle(footerEl);
            colors.footerDark = fs.backgroundColor;
        }

        const typography = {};
        ['h1', 'h2', 'h3', 'p', 'a'].forEach(tag => {
            const el = document.querySelector(tag);
            if (el) {
                const s = getComputedStyle(el);
                typography[tag] = {
                    fontSize: s.fontSize,
                    fontWeight: s.fontWeight,
                    lineHeight: s.lineHeight,
                    fontFamily: s.fontFamily,
                    color: s.color
                };
            }
        });

        const fontFamilies = {};
        if (body) fontFamilies.body = body.fontFamily;
        const h1 = cs('h1');
        if (h1) fontFamilies.heading = h1.fontFamily;

        return {
            colors: colors,
            uniqueTextColors: Array.from(uniqueTextColors),
            uniqueBackgroundColors: Array.from(uniqueBgColors),
            typography: typography,
            fontFamilies: fontFamilies,
            header: header ? { height: Math.round(header.height), width: Math.round(header.width) } : {},
            hero: hero ? { height: Math.round(hero.height), width: Math.round(hero.width) } : {},
            footer: footer ? { height: Math.round(footer.height), backgroundColor: footerEl ? getComputedStyle(footerEl).backgroundColor : '' } : {},
            layout: {
                contentMaxWidth: body ? parseInt(body.maxWidth) || 1200 : 1200,
                contentPaddingLeft: body ? parseInt(body.paddingLeft) || 0 : 0
            }
        };
    })())"""

    result = run_cmd(
        agent_browser_cmd(["eval", js_measurements], session=session),
        timeout=DOM_EXTRACT_TIMEOUT,
    )

    measurements = {}
    stdout = (result.stdout or "").strip()
    if stdout:
        measurements = parse_eval_json(stdout)
        if measurements is None:
            measurements = {"parse_error": True}

    with open(measurements_path, "w") as f:
        json.dump(measurements, f, indent=2)

    ok(f"{page_slug}: DOM ({len(dom_data.get('sections', []))} sections) + measurements + HTML saved")
    assert_exists(dom_json_path, f"DOM extraction for {page_slug}")
    assert_exists(measurements_path, f"Measurements for {page_slug}")
    assert_exists(html_snapshot_path, f"HTML snapshot for {page_slug}")

    # Raw CSS probe (root vars, @media, @keyframes, @font-face, @layer, @supports).
    # Non-fatal: a CSS capture failure must never abort an otherwise-good extraction.
    capture_raw_css_for_page(page_slug, slug, dirs, session, headed)


def extract_all_dom(
    pages: dict,
    slug: str,
    dirs: dict,
    headed: bool,
    skip_existing: bool,
) -> dict:
    """Extract DOM for every page with per-page fault isolation.

    A single page that fails to open, times out, or otherwise errors must NOT
    abort the entire extraction. Each page is attempted independently; failures
    are logged and the page is pruned from the returned set so downstream phases
    (replica build, validation, publish) only ever operate on pages that
    actually produced DOM artifacts.

    Returns a pruned copy of `pages` containing only successfully-extracted
    pages, preserving original insertion order. Raises (via fail/SystemExit)
    only when the result is genuinely unrecoverable: the homepage anchor is
    missing, or fewer than MIN_SUCCESSFUL_PAGES pages succeeded.
    """
    dom_dir = dirs["dom_extraction"]
    successful: dict = {}
    failed: list[str] = []

    for page_slug, config in pages.items():
        try:
            extract_dom(
                page_slug,
                config["original_url"],
                slug,
                dirs,
                headed,
                skip_existing,
            )
        except Exception as e:  # noqa: BLE001 — isolate ANY single-page failure
            warn(f"{page_slug}: DOM extraction failed ({e}); skipping this page")
            failed.append(page_slug)
            continue

        if (dom_dir / f"{page_slug}.json").exists():
            successful[page_slug] = config
        else:
            warn(f"{page_slug}: produced no DOM JSON; skipping this page")
            failed.append(page_slug)

    if failed:
        warn(f"DOM extraction skipped {len(failed)} page(s): {', '.join(failed)}")

    if "homepage" in pages and "homepage" not in successful:
        fail(
            "Homepage DOM extraction failed after retries — cannot build a brand "
            "without the homepage. Aborting."
        )

    if len(successful) < MIN_SUCCESSFUL_PAGES:
        fail(
            f"Only {len(successful)} page(s) extracted (need >= {MIN_SUCCESSFUL_PAGES}). "
            "Aborting."
        )

    ok(f"DOM extraction succeeded for {len(successful)}/{len(pages)} page(s)")
    return successful


# ── Phase 4: Download Assets ─────────────────────────────────────────────

def _browser_fetch_fallback(url: str, dest: str, session: str = "dl", headed: bool = False) -> bool:
    """Download a file via the browser's fetch API (bypasses 403/cookie restrictions)."""
    import base64
    try:
        # Open a page on the same origin first (if not already open)
        from urllib.parse import urlparse
        origin = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        run_cmd(agent_browser_cmd(["open", origin], session=session, headed=headed), timeout=20)
        time.sleep(1)

        js = f"""(async () => {{
            const resp = await fetch("{url}");
            if (!resp.ok) return "ERROR:" + resp.status;
            const blob = await resp.blob();
            const reader = new FileReader();
            return new Promise(r => {{ reader.onload = () => r(reader.result); reader.readAsDataURL(blob); }});
        }})()"""

        result = run_cmd(agent_browser_cmd(["eval", js], session=session), timeout=15)
        data_url = (result.stdout or "").strip().strip('"')
        if data_url and "base64," in data_url:
            b64 = data_url.split("base64,")[1]
            with open(dest, "wb") as f:
                f.write(base64.b64decode(b64))
            return Path(dest).exists() and Path(dest).stat().st_size > 100
    except Exception:
        pass
    finally:
        close_agent_browser_session(session)
    return False


def download_assets(slug: str, pages: dict, dirs: dict, headed: bool) -> int:
    """Download images, fonts, SVGs, and CSS background images from DOM extraction data."""
    phase_banner(4, "Downloading assets", "Images, fonts, SVGs, and CSS background images")

    dom_dir = dirs["dom_extraction"]
    public_dir = dirs["public"]
    downloaded = 0

    # Collect all asset URLs from DOM extractions
    image_urls: set[str] = set()
    bg_image_urls: set[str] = set()

    for page_slug in pages:
        dom_path = dom_dir / f"{page_slug}.json"
        if not dom_path.exists():
            continue
        with open(dom_path) as f:
            dom = json.load(f)

        for section in dom.get("sections", []):
            for img in section.get("images", []):
                src = img.get("src", "")
                if src and not src.startswith("data:"):
                    image_urls.add(src)
            for bg in section.get("backgroundImages", []):
                if bg and not bg.startswith("data:"):
                    bg_image_urls.add(bg)

        # Page-level fallback pools (new in dom-extractor v2) — catch images missed by section traversal
        for img in dom.get("allImages", []):
            src = img.get("src", "")
            if src and not src.startswith("data:"):
                image_urls.add(src)
        for bg in dom.get("allBackgroundImages", []):
            url = bg.get("url", "") if isinstance(bg, dict) else bg
            if url and not url.startswith("data:"):
                bg_image_urls.add(url)

        # Header logo (dedicated capture)
        header = dom.get("header", {}) or {}
        logo = header.get("logo") or {}
        logo_src = logo.get("src") if isinstance(logo, dict) else None
        if logo_src and not logo_src.startswith("data:"):
            image_urls.add(logo_src)

    all_urls = list(image_urls | bg_image_urls)
    step(f"Found {len(image_urls)} images + {len(bg_image_urls)} background images = {len(all_urls)} total")

    for url_str in all_urls:
        try:
            parsed = urlparse(url_str)
            filename = Path(parsed.path).name
            if not filename or len(filename) > 100:
                filename = f"asset-{downloaded}.bin"
            # Sanitize filename
            filename = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
            dest = public_dir / filename

            if dest.exists():
                downloaded += 1
                continue

            try:
                urllib.request.urlretrieve(url_str, str(dest))
            except urllib.error.HTTPError as http_err:
                if http_err.code == 403:
                    # Fallback: download via browser fetch (bypasses 403)
                    _browser_fetch_fallback(url_str, str(dest), session=short_session_name("dl", slug), headed=headed)
                else:
                    raise

            if not dest.exists() or dest.stat().st_size < 100:
                if dest.exists():
                    dest.unlink()
                continue

            # Verify the download is an actual asset, not an HTML error page
            result = run_cmd(["file", "--brief", str(dest)], timeout=5)
            file_type = (result.stdout or "").strip().lower()
            if "html" in file_type and not filename.endswith(".svg"):
                dest.unlink()
                warn(f"Removed HTML error page: {filename}")
                continue

            downloaded += 1
        except Exception as e:
            warn(f"Failed to download {url_str[:80]}: {e}")

    # Extract and download fonts from the first page using agent-browser
    first_page_url = list(pages.values())[0]["original_url"]
    session = short_session_name("assets", slug)
    try:
        run_cmd(
            agent_browser_cmd(["open", first_page_url], session=session, headed=headed),
            timeout=30,
        )
        time.sleep(3)

        js_fonts = """JSON.stringify((() => {
            const fonts = [];
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule instanceof CSSFontFaceRule) {
                            const src = rule.style.getPropertyValue('src');
                            const family = rule.style.getPropertyValue('font-family');
                            const urls = src.match(/url\\(["']?([^"')]+)["']?\\)/g);
                            if (urls) {
                                urls.forEach(u => {
                                    const clean = u.replace(/url\\(["']?/, '').replace(/["']?\\)/, '');
                                    fonts.push({ family: family, url: clean });
                                });
                            }
                        }
                    }
                } catch(e) {}
            }
            return fonts;
        })())"""

        result = run_cmd(
            agent_browser_cmd(["eval", js_fonts], session=session),
            timeout=15,
        )
        stdout = (result.stdout or "").strip()
        if stdout:
            font_list = parse_eval_json(stdout)
            if isinstance(font_list, list):
                for font in font_list:
                    font_url = font.get("url", "")
                    if not font_url:
                        continue
                    parsed = urlparse(font_url)
                    fname = Path(parsed.path).name
                    if not fname:
                        continue
                    fname = re.sub(r"[^a-zA-Z0-9._-]", "_", fname)
                    dest = dirs["public_fonts"] / fname
                    if dest.exists():
                        continue
                    try:
                        urllib.request.urlretrieve(font_url, str(dest))
                        downloaded += 1
                    except Exception:
                        pass
    except RuntimeError:
        warn("Font extraction failed (non-fatal)")
    finally:
        close_agent_browser_session(session)

    ok(f"Downloaded {downloaded} assets to {public_dir}")

    # Mirror downloaded files into the cache assets directory so the brand's
    # symlinked `assets/` (cache -> published brand dir) reflects what was
    # actually fetched. Without this, apply_design.py --include-replica-ui ships
    # a stale asset set from earlier runs.
    assets_cache = dirs["assets_cache"]
    assets_cache.mkdir(parents=True, exist_ok=True)
    mirrored = 0
    for src_file in public_dir.rglob("*"):
        if not src_file.is_file() or src_file.name.startswith("."):
            continue
        rel = src_file.relative_to(public_dir)
        dst_file = assets_cache / rel
        try:
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            if not dst_file.exists() or dst_file.stat().st_mtime < src_file.stat().st_mtime:
                shutil.copy2(src_file, dst_file)
                mirrored += 1
        except OSError:
            continue
    if mirrored:
        step(f"Mirrored {mirrored} files into {assets_cache}")

    return downloaded


# ── Phase 4b: Brand Kit (press-kit discovery) ────────────────────────────

def run_brand_kit(slug: str, url: str, brand_name: str, dirs: dict) -> dict:
    """Invoke brand_kit_extractor.py to discover and download official press-kit
    assets. Best-effort — must never fail the pipeline."""
    phase_banner(4, "Brand kit (press-kit discovery)", "Probing /press, /brand, /brand-assets")
    cache_dir = dirs["cache"]
    cmd = [
        sys.executable,
        str(SCRIPTS_DIR / "brand_kit_extractor.py"),
        "--brand-name", brand_name or slug,
        "--slug", slug,
        "--source-url", url,
        "--cache-dir", str(cache_dir),
        "--ui-dir", str(UI_DIR),
        "--limit", "40",
    ]
    step(f"Running brand_kit_extractor against {url}")
    try:
        r = subprocess.run(cmd, timeout=300, capture_output=True, text=True)
    except subprocess.TimeoutExpired:
        warn("brand_kit_extractor timed out — skipping")
        return {"status": "timeout"}
    except Exception as e:
        warn(f"brand_kit_extractor dispatch failed: {e}")
        return {"status": "error"}
    if r.returncode != 0:
        warn(f"brand_kit_extractor non-zero exit: {r.returncode}")
        if r.stderr:
            warn(r.stderr[-500:])
        return {"status": "error"}
    report_path = cache_dir / "brand-kit" / "report.json"
    if report_path.exists():
        try:
            return json.loads(report_path.read_text())
        except json.JSONDecodeError:
            return {"status": "malformed_report"}
    status_path = cache_dir / "brand-kit" / "status.json"
    if status_path.exists():
        try:
            return json.loads(status_path.read_text())
        except json.JSONDecodeError:
            return {"status": "malformed_status"}
    return {"status": "no_output"}


# ── Publish-side artifact steps (mirror / HTML replicas / open-design) ───
#
# These produce review/export artifacts on top of an otherwise-complete
# extraction. They are best-effort by design: a non-zero exit or timeout is
# recorded as a warning and the pipeline continues — they must never abort
# an extraction that already produced good DOM/replica data.

def _run_artifact_script(
    phase_label: str,
    title: str,
    detail: str,
    script_name: str,
    script_args: list[str],
    timeout: int,
) -> None:
    """Run a publish-side artifact script as a subprocess. Never fatal."""
    phase_banner(phase_label, title, detail)
    script = SCRIPTS_DIR / script_name
    if not script.exists():
        warn(f"{script_name} not found, skipping")
        return
    result = run_cmd(
        [sys.executable, str(script), *script_args],
        timeout=timeout,
        check=False,
        timeout_ok=True,
    )
    print(result.stdout or "")
    if result.returncode == -1:
        warn(f"{title} exceeded {timeout}s; continuing with partial output")
    elif result.returncode != 0:
        stderr = (result.stderr or "").strip()
        warn(f"{title} exited with code {result.returncode} (non-fatal); continuing")
        if stderr:
            info(f"stderr: {stderr[:500]}")
    else:
        ok(f"{title} completed")


def mirror_originals(slug: str) -> None:
    """Phase 4.5: build offline mirrors of the original key pages."""
    _run_artifact_script(
        "4.5",
        "Mirroring original pages",
        "Building 100% offline copies of key pages (mirror_original_pages.py)",
        "mirror_original_pages.py",
        ["--slug", slug],
        MIRROR_TIMEOUT,
    )


def generate_html_replicas(slug: str) -> None:
    """Phase 6.5: emit standalone token-styled HTML replicas + compare view."""
    _run_artifact_script(
        "6.5",
        "Generating standalone HTML replicas",
        "Token-styled HTML pages + compare view (generate_html_replicas.py --verify)",
        "generate_html_replicas.py",
        ["--slug", slug, "--verify"],
        HTML_REPLICA_TIMEOUT,
    )


def export_open_design(slug: str) -> None:
    """Phase 7.5: export the published brand into open-design's 9-section format."""
    _run_artifact_script(
        "7.5",
        "Exporting open-design format",
        "9-section DESIGN.md + od skill with parser round-trip (export_open_design.py --check)",
        "export_open_design.py",
        ["--slug", slug, "--check"],
        OPEN_DESIGN_EXPORT_TIMEOUT,
    )


# ── Phase 5: Build Replicas ──────────────────────────────────────────────

def _build_asset_listing(slug: str, public_dir: Path) -> tuple[list[str], str]:
    """Return (full_asset_paths, human-formatted listing for the prompt)."""
    asset_list: list[str] = []
    if public_dir.exists():
        for f in sorted(public_dir.rglob("*")):
            if f.is_file() and not f.name.startswith("."):
                rel = f.relative_to(public_dir)
                asset_list.append(str(rel))
    asset_str = "\n".join(f"  /brands/{slug}/{a}" for a in asset_list[:80])
    if len(asset_list) > 80:
        asset_str += f"\n  ... and {len(asset_list) - 80} more files"
    return asset_list, asset_str


def _run_model_runner(prompt: str, label: str, runner: dict) -> None:
    """Dispatch a single configured task-runner call. Non-fatal on failure/timeout."""
    step(f"Calling {model_runner_label(runner)}: {label}")
    try:
        cmd = build_model_runner_command(prompt, runner)
        result = run_cmd(
            cmd,
            timeout=MODEL_RUNNER_TIMEOUT,
            cwd=PLUGIN_DIR,
            check=False,
        )
        if result.returncode != 0:
            stderr = (result.stderr or "").strip()
            warn(f"{runner.get('label', runner.get('id'))} exited with code {result.returncode} ({label})")
            if stderr:
                info(f"stderr: {stderr[:500]}")
    except RuntimeError as err:
        warn(f"Task runner dispatch failed ({label}): {err}")


def build_replicas(
    slug: str,
    url: str,
    pages: dict,
    dirs: dict,
    skip_existing: bool = False,
    batch_size: int = DEFAULT_REPLICA_BATCH_SIZE,
) -> None:
    """Generate React/shadcn replicas using the configured model task runner.

    Pass 1: shared components (header, footer, logo) + homepage replica
    Pass 2+: remaining inner pages in batches

    Splitting prevents the timeout from cutting off large all-page extractions.
    Each pass gets the full MODEL_RUNNER_TIMEOUT.
    """
    runner = load_model_runner()
    phase_banner(5, "Building React/shadcn replicas", f"Task runner: {model_runner_label(runner)}")

    asset_list, asset_str = _build_asset_listing(slug, dirs["public"])
    dom_dir = dirs["dom_extraction"]

    common_rules = (
        "RULES:\n"
        "- Use shadcn/ui components (Card, Button, Separator) where appropriate\n"
        "- Use Lucide React icons only for generic UI elements (never emoji)\n"
        "- INCLUDE ALL IMAGES — every hero, card, article thumbnail, logo from the asset list\n"
        "- Extract ALL sections from DOM JSON — every H2 heading must have a replica section\n"
        "- Do NOT fabricate text — only use content from DOM extraction JSON files\n"
        "- Match colors and spacing from the measurement JSON files\n"
        "- Use the real logo from header.logo.src (path under /brands/{slug}/)\n"
        "- Use background-image URLs from section.backgroundImages and allBackgroundImages\n"
        "  for hero sections — these are stored as /brands/{slug}/<filename> after download\n"
    )

    # ── Pass 1: shared components + homepage ─────────────────────────────
    homepage_outputs = [
        dirs["components"] / f"{slug}-logo.tsx",
        dirs["components"] / f"{slug}-header.tsx",
        dirs["components"] / f"{slug}-footer.tsx",
        dirs["replica"] / "layout.tsx",
        dirs["replica"] / "page.tsx",
    ]
    needs_homepage = not skip_existing or any(not path.exists() for path in homepage_outputs)
    if needs_homepage:
        pass1_prompt = f"""Build React/shadcn shared components + the homepage replica for {url}.

Brand slug: {slug}

Read these DOM extraction files (primary source of truth):
  {dom_dir}/homepage.json
  {dom_dir}/homepage-measurements.json

The DOM JSON schema includes:
  - sections[]: per-section headings/text/links/images/backgroundImages
  - header.logo: {{ src, alt, type }} — USE THIS for the brand logo (it's the real file)
  - allImages, allBackgroundImages: page-level fallback pools

DOWNLOADED ASSETS ({len(asset_list)} files available at /brands/{slug}/):
{asset_str}

Create these files (and ONLY these — inner pages are built in separate batches):
1. {dirs['components']}/{slug}-logo.tsx       — Logo component using header.logo.src
2. {dirs['components']}/{slug}-header.tsx     — Top nav with utility bar + main nav
3. {dirs['components']}/{slug}-footer.tsx     — Footer with links, social, legal text
4. {dirs['replica']}/layout.tsx               — Hides Design Library chrome
5. {dirs['replica']}/page.tsx                 — Homepage with ALL sections (hero uses backgroundImages[0] from the main section)

{common_rules}

The UI project is a Next.js app at {UI_DIR}. Verify TypeScript compiles before finishing.
"""
        _run_model_runner(pass1_prompt, "pass 1 (shared + homepage)", runner)
    else:
        ok("Shared components + homepage skipped (--skip-existing)")

    # ── Pass 2: inner pages ──────────────────────────────────────────────
    inner_pages = [
        {"slug": s, "original_url": c["original_url"], "replica_route": c["replica_route"]}
        for s, c in pages.items()
        if s != "homepage" and (not skip_existing or not (dirs["replica"] / s / "page.tsx").exists())
    ]
    if not inner_pages:
        ok("No inner pages need replica generation")
        return

    batch_size = max(1, batch_size)
    batches = [
        inner_pages[index:index + batch_size]
        for index in range(0, len(inner_pages), batch_size)
    ]
    for batch_index, batch in enumerate(batches, start=1):
        inner_list = "\n".join(
            f"  {p['slug']:20s} -> {dirs['replica']}/{p['slug']}/page.tsx  (read {dom_dir}/{p['slug']}.json)"
            for p in batch
        )

        pass2_prompt = f"""Build this batch of inner-page replicas for {url}. Shared components (header/footer/logo) already exist at {dirs['components']}/ — import them.

Brand slug: {slug}

Inner pages to build in this batch ({len(batch)} of {len(inner_pages)} remaining; batch {batch_index} of {len(batches)}):
{inner_list}

For each page:
  - Read {dom_dir}/<page-slug>.json for sections/content/images
  - Read {dom_dir}/<page-slug>-measurements.json for layout hints
  - Every H2 in DOM => one section in the replica
  - Hero uses section.backgroundImages or allBackgroundImages[0] as background
  - Import header from {dirs['components']}/{slug}-header.tsx
  - Import footer from {dirs['components']}/{slug}-footer.tsx

DOWNLOADED ASSETS ({len(asset_list)} files at /brands/{slug}/):
{asset_str}

{common_rules}

The UI project is a Next.js app at {UI_DIR}. Build ALL {len(batch)} inner pages listed in this batch. Verify TypeScript compiles before finishing.
"""
        _run_model_runner(pass2_prompt, f"inner pages batch {batch_index}/{len(batches)}", runner)


def verify_replicas(slug: str, pages: dict, dirs: dict) -> None:
    """Verify all expected replica files exist."""
    phase_banner(5, "Verifying replica files", "Checking generated components and running TypeScript check")

    replica_dir = dirs["replica"]
    components_dir = dirs["components"]

    # Check homepage. Missing homepage is bad, but the HTML-snapshot repair step
    # (phase 5c) can still point the route at the full captured page, so warn and
    # continue rather than aborting the entire run before validation/publish.
    homepage_tsx = replica_dir / "page.tsx"
    if not homepage_tsx.exists():
        warn(f"Missing homepage replica: {homepage_tsx} (will rely on HTML-snapshot fallback)")
    else:
        ok(f"homepage/page.tsx: exists ({homepage_tsx.stat().st_size} bytes)")

    # Check layout
    layout_tsx = replica_dir / "layout.tsx"
    if not layout_tsx.exists():
        warn("layout.tsx missing (will use parent layout)")
    else:
        ok(f"layout.tsx: exists ({layout_tsx.stat().st_size} bytes)")

    # Check inner pages
    for page_slug in pages:
        if page_slug == "homepage":
            continue
        page_tsx = replica_dir / page_slug / "page.tsx"
        if not page_tsx.exists():
            warn(f"missing {page_slug}/page.tsx")
        else:
            ok(f"{page_slug}/page.tsx: exists ({page_tsx.stat().st_size} bytes)")

    # Check shared components
    component_files = list(components_dir.glob("*.tsx"))
    step(f"Shared components: {len(component_files)} files")
    for cf in component_files:
        info(f"    {cf.name} ({cf.stat().st_size} bytes)")

    # TypeScript compile check (non-fatal)
    step("Running TypeScript check")
    result = run_cmd(
        ["npx", "tsc", "--noEmit"],
        timeout=120,
        cwd=str(UI_DIR),
        check=False,
    )
    if result.returncode == 0:
        ok("TypeScript: passed")
    else:
        errors = (result.stdout or "").strip()
        error_count = errors.count("error TS")
        warn(f"TypeScript: {error_count} errors (non-fatal, replicas may still render)")


def _replica_page_path(replica_dir: Path, page_slug: str) -> Path:
    if page_slug == "homepage":
        return replica_dir / "page.tsx"
    return replica_dir / page_slug / "page.tsx"


def _tsx_section_marker_count(content: str) -> int:
    return len(re.findall(r"<h2|<H2|className.*h2", content))


def _html_snapshot_redirect_source(slug: str, page_slug: str) -> str:
    safe_name = "".join(part.capitalize() for part in re.split(r"[^a-zA-Z0-9]+", page_slug) if part) or "Homepage"
    return f'''import {{ redirect }} from "next/navigation";

export default function {safe_name}HtmlSnapshotReplica() {{
  // Full-page fallback: the model-built React page was section-incomplete.
  redirect("/api/brands/{slug}/preview/{page_slug}");
}}
'''


def repair_incomplete_replicas_with_html_snapshots(slug: str, pages: dict, dirs: dict) -> None:
    """Replace section-incomplete React pages with full extracted HTML routes.

    Model-built React replicas are preferred when complete, but a partial React
    page is worse than a full captured page. This keeps validation and review
    surfaces pointed at the full extracted artifact instead of a truncated build.
    """
    phase_banner(5, "Repairing incomplete replicas", "Falling back to full HTML snapshots when section coverage is too low")

    replica_dir = dirs["replica"]
    dom_dir = dirs["dom_extraction"]
    repaired = 0

    for page_slug in pages:
        dom_file = dom_dir / f"{page_slug}.json"
        if not dom_file.exists():
            continue
        try:
            dom = json.loads(dom_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            warn(f"{page_slug}: could not read DOM JSON for section repair")
            continue

        sections = dom.get("sections") if isinstance(dom, dict) else []
        if not isinstance(sections, list) or not sections:
            continue

        tsx_path = _replica_page_path(replica_dir, page_slug)
        html_snapshot = dom_dir / f"{page_slug}-snapshot.html"
        brands_html_snapshot = dirs["brands_dom_extraction"] / f"{page_slug}-snapshot.html"
        if not html_snapshot.exists() and not brands_html_snapshot.exists():
            warn(f"{page_slug}: incomplete React page cannot fall back because HTML snapshot is missing")
            continue

        content = tsx_path.read_text(encoding="utf-8") if tsx_path.exists() else ""
        marker_count = _tsx_section_marker_count(content)
        if marker_count >= max(0, len(sections) - 2):
            ok(f"{page_slug}: React section coverage {marker_count}/{len(sections)}")
            continue

        tsx_path.parent.mkdir(parents=True, exist_ok=True)
        tsx_path.write_text(_html_snapshot_redirect_source(slug, page_slug), encoding="utf-8")
        repaired += 1
        warn(f"{page_slug}: React section coverage {marker_count}/{len(sections)}; using full HTML snapshot route")

    if repaired:
        ok(f"HTML snapshot fallback applied to {repaired} page(s)")
    else:
        ok("No HTML snapshot fallback needed")


# ── Phase 6: Validate ────────────────────────────────────────────────────

def run_validation(slug: str) -> float:
    """Run the validation harness. Returns average score."""
    phase_banner(6, "Running screenshot validation", "Comparing replicas against reference screenshots")

    base_url = dev_server_base_url()
    cache_dir = CACHE_ROOT / slug

    validation_script = SCRIPTS_DIR / "run_validation_loop.py"
    if not validation_script.exists():
        warn("run_validation_loop.py not found, skipping validation")
        return 0.0

    # Best-effort: the loop writes report.json incrementally, so a slow run that
    # exceeds the timeout must not abort the pipeline (publish/register still run).
    result = run_cmd(
        [
            sys.executable, str(validation_script),
            "--brand", slug,
            "--base-url", base_url,
            "--target", "80",
            "--skip-originals",
        ],
        timeout=VALIDATION_TIMEOUT,
        check=False,
        timeout_ok=True,
    )
    if result.returncode == -1:
        warn(f"Validation exceeded {VALIDATION_TIMEOUT}s; using the report it had already written")

    output = (result.stdout or "")
    print(output)

    # Also run component-level validation for actionable feedback
    step("Running component-level validation")
    comp_validator = SCRIPTS_DIR / "component_validator.py"
    if comp_validator.exists():
        comp_result = run_cmd(
            [sys.executable, str(comp_validator),
             "--brand", slug, "--all-pages",
             "--base-url", base_url,
             "--output", str(cache_dir / "validation" / "component-report.json")],
            timeout=VALIDATION_TIMEOUT, check=False, timeout_ok=True,
        )
        if comp_result.returncode == 0:
            ok("Component validation report saved")
        else:
            warn(f"Component validation exited with code {comp_result.returncode} (non-fatal)")

    # Authoritative score: the report.json the loop wrote (survives a timeout).
    # Fall back to parsing stdout only if the report is unreadable.
    report_path = BRANDS_ROOT / slug / "validation" / "report.json"
    try:
        report = json.loads(report_path.read_text())
        avg = report.get("desktop_avg") or report.get("viewport_avg")
        if isinstance(avg, (int, float)):
            return float(avg)
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    for line in output.split("\n"):
        if "AVERAGE" in line:
            match = re.search(r"(\d+\.\d+)%", line)
            if match:
                return float(match.group(1))

    return 0.0


# ── Phase 7: Publish ─────────────────────────────────────────────────────

def publish(slug: str) -> None:
    """Run the publish pipeline to generate design tokens, DESIGN.md, SKILL.md."""
    phase_banner(7, "Publishing brand artifacts", "Generating design tokens, DESIGN.md, and SKILL.md")

    publish_script = SCRIPTS_DIR / "publish_brand.py"
    if not publish_script.exists():
        warn("publish_brand.py not found, skipping publish")
        return

    result = run_cmd(
        [sys.executable, str(publish_script), "--brand", slug, "--enforce-readiness"],
        timeout=120,
        check=False,
    )
    print(result.stdout or "")
    if result.returncode != 0:
        # Don't sys.exit — registration (phase 8) and final verification (phase 9)
        # must still run so the brand lands in the library for review/repair.
        warn(f"publish readiness gate failed with code {result.returncode}; continuing to registration")


# ── Phase 8: Register ────────────────────────────────────────────────────

def register_in_library(slug: str, url: str, title: str) -> None:
    """Register the brand in the library index."""
    phase_banner(8, "Registering in design library", "Updating metadata.json and library index")

    brands_dir = BRANDS_ROOT / slug
    meta_path = brands_dir / "metadata.json"

    # Read or create metadata
    metadata = {}
    if meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)

    # Ensure required fields
    # Clean brand name: strip page title suffixes like "| Circle K" or "- Executive Search"
    raw_name = title or slug.replace("-", " ").title()
    # Take the shortest meaningful part (usually after | or - or :)
    for sep in [" | ", " - ", ": ", " — "]:
        if sep in raw_name:
            parts = raw_name.split(sep)
            # Pick the shortest non-trivial part as the brand name
            candidates = [p.strip() for p in parts if len(p.strip()) > 2]
            if candidates:
                raw_name = min(candidates, key=len)
                break
    metadata.setdefault("name", raw_name.strip('"').strip("'"))
    metadata.setdefault("slug", slug)
    metadata.setdefault("source_url", url)
    metadata.setdefault("extracted_at", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    metadata.setdefault("extractor_version", "0.3.0")
    metadata.setdefault("confidence", "MEDIUM")
    metadata.setdefault("categories", [])
    metadata.setdefault("synthetic", False)
    metadata.setdefault("replica_type", "react_shadcn")

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    # Use the update_library_index script
    index_script = SCRIPTS_DIR / "update_library_index.py"
    if index_script.exists():
        result = run_cmd(
            [sys.executable, str(index_script), "--add", slug, "--metadata", str(meta_path)],
            timeout=30,
            check=False,
        )
        print(result.stdout or "")
    else:
        # Manual index update as fallback
        index_path = LIBRARY_ROOT / "index.json"
        index = {"version": "0.1.0", "updated_at": "", "brands": []}
        if index_path.exists():
            with open(index_path) as f:
                index = json.load(f)

        index["brands"] = [b for b in index.get("brands", []) if b.get("slug") != slug]
        index["brands"].append({
            "slug": slug,
            "name": metadata["name"],
            "source_url": url,
            "extracted_at": metadata["extracted_at"],
            "extractor_version": metadata["extractor_version"],
            "overall_score": metadata.get("overall_score"),
            "confidence": metadata["confidence"],
            "categories": metadata["categories"],
            "synthetic": False,
            "path": str(brands_dir),
        })
        index["brands"].sort(key=lambda b: b["slug"])
        index["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        with open(index_path, "w") as f:
            json.dump(index, f, indent=2)
            f.write("\n")

    ok(f"Registered {slug} in library index")


# ── Phase 9: Final Verification ──────────────────────────────────────────

def final_verification(slug: str, pages: dict, asset_count: int, score: float) -> None:
    """Verify all expected artifacts exist and print summary."""
    phase_banner(9, "Final verification", "Checking artifacts and printing summary")

    brands_dir = BRANDS_ROOT / slug
    cache_dir = CACHE_ROOT / slug
    public_dir = UI_DIR / "public" / "brands" / slug
    components_dir = UI_DIR / "components" / "brands" / slug
    replica_dir = UI_DIR / "app" / "brands" / slug / "replica"

    checks = {
        "design-tokens.json": brands_dir / "design-tokens.json",
        "DESIGN.md": brands_dir / "DESIGN.md",
        "skill/SKILL.md": brands_dir / "skill" / "SKILL.md",
        "metadata.json": brands_dir / "metadata.json",
        "pages.json": cache_dir / "validation" / "pages.json",
        "replica/page.tsx": replica_dir / "page.tsx",
    }

    passed = 0
    failed_checks = []

    for name, path in checks.items():
        if path.exists():
            ok(f"{name}")
            passed += 1
        else:
            warn(f"{name}: MISSING")
            failed_checks.append(name)

    # Check public assets count
    public_files = list(public_dir.rglob("*"))
    public_file_count = len([f for f in public_files if f.is_file()])
    if public_file_count >= 5:
        ok(f"public/brands/{slug}/: {public_file_count} files")
        passed += 1
    else:
        warn(f"public/brands/{slug}/: {public_file_count} files (expected 5+)")
        failed_checks.append(f"public assets ({public_file_count} files)")

    # Check shared components
    component_count = len(list(components_dir.glob("*.tsx")))
    if component_count >= 1:
        ok(f"components/brands/{slug}/: {component_count} components")
        passed += 1
    else:
        warn(f"components/brands/{slug}/: {component_count} components (expected 1+)")
        failed_checks.append("shared components")

    # Check library index
    index_path = LIBRARY_ROOT / "index.json"
    in_index = False
    if index_path.exists():
        with open(index_path) as f:
            idx = json.load(f)
        in_index = any(b.get("slug") == slug for b in idx.get("brands", []))
    if in_index:
        ok("Library index: registered")
        passed += 1
    else:
        warn("Library index: NOT registered")
        failed_checks.append("library index")

    total_checks = len(checks) + 3  # +3 for public, components, index

    # Read brand name from metadata
    brand_name = slug.replace("-", " ").title()
    meta_path = brands_dir / "metadata.json"
    if meta_path.exists():
        with open(meta_path) as f:
            meta = json.load(f)
        brand_name = meta.get("name", brand_name)

    pages_extracted = len(list((cache_dir / "dom-extraction").glob("*.json"))) // 2  # exclude measurements
    pages_replicated = 1 + len(list(replica_dir.glob("*/page.tsx")))  # homepage + inner pages

    print(f"\n{'='*60}")
    if not failed_checks:
        print(f"  Extraction complete: {brand_name}")
    else:
        print(f"  Extraction complete (with warnings): {brand_name}")
    print(f"  Pages: {pages_extracted} extracted, {pages_replicated} replicated")
    print(f"  Assets: {asset_count} files")
    print(f"  Score: {score:.1f}%")
    print(f"  Library: {'registered' if in_index else 'NOT registered'}")
    print(f"  Checks: {passed}/{total_checks} passed")
    if failed_checks:
        print(f"  Missing: {', '.join(failed_checks)}")
    print(f"  URL: {dev_server_base_url()}/brands/{slug}")
    print(f"{'='*60}")


# ── Main ──────────────────────────────────────────────────────────────────

def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extract a complete design system from a URL end-to-end.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Example:\n  python3 scripts/extract_brand.py --url https://example.com",
    )
    parser.add_argument("--url", required=True, help="Target URL to extract from")
    parser.add_argument("--headed", action="store_true", help="Use headed browser for bot-detection sites")
    parser.add_argument("--all-pages", action="store_true", help="Extract every sitemap/nav page instead of stopping at the selected page set")
    parser.add_argument("--page-limit", type=int, default=None, help="Optional max pages to extract. Omit with --all-pages to extract every discovered page")
    parser.add_argument("--replica-batch-size", type=int, default=DEFAULT_REPLICA_BATCH_SIZE, help="Inner replica pages per model-runner batch")
    parser.add_argument("--skip-existing", action="store_true", help="Resume partial extraction (skip existing files)")
    parser.add_argument("--skip-validation", action="store_true", help="Skip Phase 6 (screenshot validation)")
    parser.add_argument("--skip-replicas", action="store_true", help="Skip Phase 5 (model-runner replica generation)")
    parser.add_argument("--skip-publish", action="store_true", help="Skip publish, registration, and final verification")
    parser.add_argument("--skip-mirror", action="store_true", help="Skip Phase 4.5 (offline mirror of original pages)")
    parser.add_argument("--skip-html-replicas", action="store_true", help="Skip Phase 6.5 (standalone token-styled HTML replicas)")
    parser.add_argument("--skip-open-design-export", action="store_true", help="Skip Phase 7.5 (open-design DESIGN.md + skill export)")
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()

    url = args.url.rstrip("/")
    if not url.startswith("http"):
        url = "https://" + url

    slug = derive_slug(url)
    start_time = time.time()

    if _RICH:
        header = Text()
        header.append("Design Extractor", style="bold magenta")
        header.append("  Orchestrator\n", style="bold white")
        header.append(f"URL:  {url}\n", style="white")
        header.append(f"Slug: {slug}\n", style="white")
        header.append(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", style="dim")
        _console.print(Panel(header, border_style="magenta", padding=(0, 1)))
    else:
        print("Design Extractor — Orchestrator")
        print(f"URL:  {url}")
        print(f"Slug: {slug}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # ── Telemetry helper ────────────────────────────────────────────
    # Each phase call below is wrapped so we emit a "started" event before
    # and a "completed" event (with duration_s) after. If a phase raises or
    # calls sys.exit, only the "started" event is written — the aggregator
    # infers failure from the missing "completed" event.
    def _phase(phase_id: str, fn, *a, **kw):
        _write_phase_event(slug, phase=phase_id, status="started")
        _t0 = time.time()
        result = fn(*a, **kw)
        _write_phase_event(
            slug,
            phase=phase_id,
            status="completed",
            duration_s=time.time() - _t0,
        )
        return result

    # Phase 0: Setup
    _write_phase_event(slug, phase="0", status="started")
    _p0_start = time.time()
    phase_banner(0, "Setting up directories", "Creating cache, brand, UI output locations")
    dirs = setup_directories(slug)
    info(f"Cache: {dirs['cache']}")
    info(f"Brand: {dirs['brands']}")
    info(f"UI:    {dirs['public']}")
    _write_phase_event(slug, phase="0", status="completed", duration_s=time.time() - _p0_start)

    # Phase 0.5: Verify agent rules
    _phase("0.5", verify_agent_rules)

    # Phase 1: Verify URL
    _write_phase_event(slug, phase="1", status="started")
    _p1_start = time.time()
    try:
        title = verify_url(url, args.headed)
    except RuntimeError as e:
        # Retry with headed if headless fails
        if not args.headed:
            warn(f"Headless failed ({e}), retrying with --headed")
            try:
                title = verify_url(url, headed=True)
                args.headed = True  # Use headed for all subsequent steps
            except RuntimeError as e2:
                fail(f"URL verification failed: {e2}")
        else:
            fail(f"URL verification failed: {e}")
    _write_phase_event(slug, phase="1", status="completed", duration_s=time.time() - _p1_start)

    # Phase 2: Identify pages
    _write_phase_event(slug, phase="2", status="started")
    _p2_start = time.time()
    pages = identify_pages(url, args.headed, all_pages=args.all_pages, page_limit=args.page_limit)
    write_pages_json(slug, pages)
    _write_phase_event(slug, phase="2", status="completed", duration_s=time.time() - _p2_start)

    # Phase 3: Extract DOM from each page (per-page fault isolation — a single
    # flaky page must never abort the whole run; failed pages are pruned).
    _write_phase_event(slug, phase="3", status="started")
    _p3_start = time.time()
    phase_banner(3, "Extracting DOM", f"Extracting content and measurements from {len(pages)} pages")
    pages = extract_all_dom(pages, slug, dirs, args.headed, args.skip_existing)
    # Persist the pruned page set so every downstream phase (replicas,
    # validation, publish) operates only on pages that produced DOM artifacts.
    write_pages_json(slug, pages)
    _write_phase_event(slug, phase="3", status="completed", duration_s=time.time() - _p3_start)

    # Phase 4: Download assets
    asset_count = _phase("4", download_assets, slug, pages, dirs, args.headed)

    # Phase 4b: Brand kit (press-kit discovery) — best-effort, never fails the pipeline
    try:
        brand_kit = _phase("4b", run_brand_kit, slug, url, title, dirs)
    except Exception as e:
        warn(f"Brand kit phase errored ({e}) — continuing")
        brand_kit = {"status": "error"}
    if isinstance(brand_kit, dict):
        bk_status = brand_kit.get("status", "unknown")
        bk_count = brand_kit.get("downloaded_count", 0)
        if bk_status == "ok":
            ok(f"Brand kit: {bk_count} assets downloaded via {brand_kit.get('discovery_method','unknown')}")
        elif bk_status == "not_found":
            warn("Brand kit: no press-kit page discovered (ok — not all brands publish one)")
        elif bk_status == "skipped":
            warn(f"Brand kit: skipped — {brand_kit.get('reason','')}")
        else:
            warn(f"Brand kit: status={bk_status}")

    # Phase 4.5: Mirror original pages offline — best-effort artifact step.
    if args.skip_mirror:
        warn("Skipping original-page mirror (--skip-mirror)")
    else:
        try:
            _phase("4.5", mirror_originals, slug)
        except Exception as e:  # noqa: BLE001 — artifact steps never abort extraction
            warn(f"Original-page mirror errored ({e}) — continuing")

    # Phase 5: Build replicas
    if not args.skip_replicas:
        _phase("5", build_replicas, slug, url, pages, dirs, args.skip_existing, args.replica_batch_size)
        _phase("5b", verify_replicas, slug, pages, dirs)
        _phase("5c", repair_incomplete_replicas_with_html_snapshots, slug, pages, dirs)
    else:
        warn("Skipping replica generation (--skip-replicas)")

    # Phase 6: Validate. Never fatal — a validation failure must not cost us the
    # publish/register phases (the brand + its score should still land for review).
    score = 0.0
    if not args.skip_validation and not args.skip_replicas:
        try:
            score = _phase("6", run_validation, slug)
        except Exception as e:  # noqa: BLE001 — validation is best-effort
            warn(f"Validation phase errored ({e}); continuing to publish/register")
    else:
        warn("Skipping validation (--skip-validation or --skip-replicas)")

    # Phase 6.5: Standalone HTML replicas — best-effort artifact step.
    if args.skip_html_replicas:
        warn("Skipping standalone HTML replicas (--skip-html-replicas)")
    else:
        try:
            _phase("6.5", generate_html_replicas, slug)
        except Exception as e:  # noqa: BLE001 — artifact steps never abort extraction
            warn(f"Standalone HTML replicas errored ({e}) — continuing")

    if args.skip_publish:
        warn("Skipping publish, registration, and final verification (--skip-publish)")
    else:
        # Phase 7: Publish
        _phase("7", publish, slug)

        # Phase 7.5: Open-design export — depends on publish artifacts; best-effort.
        if args.skip_open_design_export:
            warn("Skipping open-design export (--skip-open-design-export)")
        else:
            try:
                _phase("7.5", export_open_design, slug)
            except Exception as e:  # noqa: BLE001 — artifact steps never abort extraction
                warn(f"Open-design export errored ({e}) — continuing")

        # Phase 8: Register
        _phase("8", register_in_library, slug, url, title)

        # Phase 9: Final verification
        _phase("9", final_verification, slug, pages, asset_count, score)

    elapsed = time.time() - start_time
    print(f"\nTotal time: {elapsed/60:.1f} minutes")

    return 0


if __name__ == "__main__":
    sys.exit(main())
