"""Shared telemetry helpers for the extraction pipeline.

Both the CLI orchestrator (`extract_brand.py`) and the WebSocket server
(`ws_extraction_server.py`) can import this module to emit per-phase events
and read aggregate state.

Storage model:
    ~/.claude/design-library/cache/<slug>/jobs/<ts>-<phase>-<status>.json

One JSON object per file, human-readable. The `<ts>` is milliseconds since
epoch so filenames sort lexicographically in chronological order and do not
collide within the same wall-clock second.

No external dependencies — stdlib only.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Optional

LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
BRANDS_ROOT = LIBRARY_ROOT / "brands"
CACHE_ROOT = LIBRARY_ROOT / "cache"

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_segment(value: str) -> str:
    """Collapse anything that could mess with a filename into a dash."""
    cleaned = _SAFE.sub("-", value.strip()).strip("-")
    return cleaned or "unknown"


def jobs_dir(slug: str) -> Path:
    """Return the per-brand jobs directory, creating it if missing."""
    path = CACHE_ROOT / slug / "jobs"
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_phase_event(
    slug: str,
    *,
    phase: str,
    status: str,
    agent: Optional[str] = None,
    duration_s: Optional[float] = None,
    extra: Optional[dict] = None,
) -> Path:
    """Append-only phase event.

    Writes a single JSON object to `jobs_dir/<ts>-<phase>-<status>.json`.
    `ts` is int(time.time()*1000), giving ms precision.

    `status` is conventionally one of "started", "completed", "failed" — the
    aggregator treats any string other than "completed" as non-terminal.
    """
    if status not in ("started", "completed", "failed"):
        # Not a hard error — just normalise whitespace. Future statuses ok.
        status = status.strip() or "unknown"

    event = {
        "slug": slug,
        "phase": str(phase),
        "status": status,
        "timestamp": time.time(),
    }
    if agent is not None:
        event["agent"] = agent
    if duration_s is not None:
        event["duration_s"] = round(float(duration_s), 3)
    if extra:
        # Shallow merge — don't clobber reserved keys.
        for k, v in extra.items():
            if k not in event:
                event[k] = v

    ts_ms = int(time.time() * 1000)
    filename = f"{ts_ms}-{_safe_segment(str(phase))}-{_safe_segment(status)}.json"
    path = jobs_dir(slug) / filename
    path.write_text(json.dumps(event, indent=2))
    return path


def read_all_phase_events(slug: str) -> list[dict]:
    """Read every `jobs/*.json` file for a brand in chronological order."""
    path = CACHE_ROOT / slug / "jobs"
    if not path.exists():
        return []
    events: list[dict] = []
    for file in sorted(path.glob("*.json")):
        try:
            events.append(json.loads(file.read_text()))
        except (json.JSONDecodeError, OSError):
            # Skip unreadable/corrupt files — telemetry is best-effort.
            continue
    return events


def read_all_brands() -> list[dict]:
    """Walk `~/.claude/design-library/brands/*/metadata.json`.

    Returns one dict per brand, with an added `slug` key derived from the
    directory name. Brands without a readable metadata.json are skipped.
    """
    if not BRANDS_ROOT.exists():
        return []
    brands: list[dict] = []
    for brand_dir in sorted(BRANDS_ROOT.iterdir()):
        if not brand_dir.is_dir():
            continue
        meta_file = brand_dir / "metadata.json"
        if not meta_file.exists():
            continue
        try:
            meta = json.loads(meta_file.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        if not isinstance(meta, dict):
            continue
        meta.setdefault("slug", brand_dir.name)
        brands.append(meta)
    return brands


def read_experiments(state_dir: Path | None = None) -> list[dict]:
    """Read `state/learning/experiments.jsonl`.

    `state_dir` defaults to `<repo_root>/state` where repo_root is the
    parent of the `scripts/` directory containing this module.
    """
    if state_dir is None:
        state_dir = Path(__file__).resolve().parent.parent / "state"
    path = state_dir / "learning" / "experiments.jsonl"
    if not path.exists():
        return []
    rows: list[dict] = []
    try:
        with path.open("r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except OSError:
        return []
    return rows
