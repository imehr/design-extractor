"""Minimal stdlib .env loader. No external dependencies.

Looks up `.env` at the repo root (parent of the scripts/ directory) and loads
key=value lines into os.environ — but only for keys NOT already set, so shell
exports win over the file.

Syntax supported:
    KEY=value                 → os.environ["KEY"] = "value"
    KEY="quoted value"        → quotes stripped
    KEY='single quoted'       → single quotes stripped
    # comment                 → ignored
    <blank line>              → ignored
    export KEY=value          → "export " prefix stripped (bash-compatible)

Not supported (keep it simple):
    multiline values, command substitution, variable expansion.
"""
from __future__ import annotations

import os
from pathlib import Path


def _parse_line(line: str) -> tuple[str, str] | None:
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    if line.startswith("export "):
        line = line[len("export "):]
    if "=" not in line:
        return None
    key, _, value = line.partition("=")
    key = key.strip()
    value = value.strip()
    if not key or not key.replace("_", "").isalnum():
        return None
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        value = value[1:-1]
    return key, value


def load_env(env_path: Path | None = None, override: bool = False) -> dict[str, str]:
    """Load .env file into os.environ. Returns the dict of keys loaded (not counting skipped).

    Set DESIGN_EXTRACTOR_SKIP_DOTENV=1 in the environment to disable .env loading
    entirely — useful for tests that verify behavior under specific key absence.
    """
    if os.environ.get("DESIGN_EXTRACTOR_SKIP_DOTENV"):
        return {}
    if env_path is None:
        env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return {}
    loaded: dict[str, str] = {}
    try:
        text = env_path.read_text(encoding="utf-8")
    except OSError:
        return {}
    for raw in text.splitlines():
        pair = _parse_line(raw)
        if not pair:
            continue
        key, value = pair
        if not override and key in os.environ:
            continue
        os.environ[key] = value
        loaded[key] = value
    return loaded


if __name__ == "__main__":
    import sys
    loaded = load_env()
    if loaded:
        print(f"Loaded {len(loaded)} keys from .env: {', '.join(sorted(loaded))}")
    else:
        print("No .env file found or no keys loaded")
    sys.exit(0)
