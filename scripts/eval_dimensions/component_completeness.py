"""Component completeness dimension.

Wraps scripts/component_validator.py. If validator output is not yet on disk
under cache/<slug>/validation/components/, we attempt to run the validator
inline (subprocess, 120s ceiling) — best-effort. If that subprocess can't
succeed (no dev server, no replicas, timeout, non-zero exit, etc.), we fall
back to status="skipped" with details.reason set so the failure cause is
visible in the rubric report rather than silently shrugging.

Score = matched / (matched + missing + extra) across every paired page found.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from eval_rubric import BrandContext, Dimension, DimensionResult, register


_REPO_ROOT = Path(__file__).resolve().parents[2]
_VALIDATOR = _REPO_ROOT / "scripts" / "component_validator.py"
_DEFAULT_BASE_URL = os.environ.get("EVAL_BASE_URL", "https://design-extractor.localhost")
_SUBPROCESS_TIMEOUT_S = 120


def _component_summaries(ctx: BrandContext) -> list[dict]:
    """Return per-page component summary dicts {matched, missing, extra}.

    Looks at, in order:
      cache/<slug>/validation/components.json              (combined output)
      cache/<slug>/validation/components/<page>/*.json     (per-page outputs)
    """
    summaries: list[dict] = []
    seen_pages: set[str] = set()

    combined = ctx.cache_dir / "validation" / "components.json"
    if combined.exists():
        try:
            data = json.loads(combined.read_text())
            if isinstance(data, dict) and "pages" in data and isinstance(data["pages"], dict):
                for slug, pdat in data["pages"].items():
                    if isinstance(pdat, dict) and "matched" in pdat:
                        summaries.append({
                            "page": slug,
                            "matched": pdat.get("matched", 0),
                            "missing": pdat.get("missing", 0),
                            "extra": pdat.get("extra", 0),
                        })
                        seen_pages.add(slug)
        except Exception:
            pass

    cv_dir = ctx.cache_dir / "validation" / "components"
    if cv_dir.exists():
        for p in cv_dir.rglob("*.json"):
            try:
                data = json.loads(p.read_text())
            except Exception:
                continue
            if isinstance(data, dict) and "matched" in data:
                page_slug = data.get("page", p.parent.name or p.stem)
                if page_slug in seen_pages:
                    continue
                summaries.append({
                    "page": page_slug,
                    "matched": data.get("matched", 0),
                    "missing": data.get("missing", 0),
                    "extra": data.get("extra", 0),
                })
                seen_pages.add(page_slug)

    return summaries


def _try_run_validator(ctx: BrandContext) -> dict:
    """Spawn `python3 scripts/component_validator.py --brand <slug> --all-pages`.

    Returns {"ok": True} on exit-code 0; {"ok": False, "reason": "..."} otherwise.
    Output is written by the validator itself under
    ~/.claude/design-library/cache/<slug>/validation/components/<page>/.
    We also pass --output for a combined summary at validation/components.json.
    """
    if not _VALIDATOR.exists():
        return {"ok": False, "reason": f"component_validator.py not at {_VALIDATOR}"}

    base_url = ctx.base_url or _DEFAULT_BASE_URL
    combined_out = ctx.cache_dir / "validation" / "components.json"
    combined_out.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        str(_VALIDATOR),
        "--brand", ctx.slug,
        "--all-pages",
        "--base-url", base_url,
        "--output", str(combined_out),
    ]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=_SUBPROCESS_TIMEOUT_S,
            cwd=str(_REPO_ROOT),
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "reason": f"component_validator timed out after {_SUBPROCESS_TIMEOUT_S}s"}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "reason": f"component_validator launch error: {type(exc).__name__}: {exc}"}

    if proc.returncode != 0:
        tail = (proc.stderr or proc.stdout or "").strip().splitlines()[-3:]
        return {
            "ok": False,
            "reason": f"component_validator exit={proc.returncode}: " + " | ".join(tail),
        }
    return {"ok": True}


def run(ctx: BrandContext) -> DimensionResult:
    summaries = _component_summaries(ctx)
    auto_run_info: dict | None = None

    if not summaries:
        auto_run_info = _try_run_validator(ctx)
        if auto_run_info.get("ok"):
            summaries = _component_summaries(ctx)
        # Either way, fall through — summaries may still be empty if the
        # validator wrote nothing usable.

    if not summaries:
        details: dict = {
            "reason": "no component_validator output found",
            "looked_in": str(ctx.cache_dir / "validation" / "components"),
        }
        if auto_run_info is not None:
            details["auto_run"] = auto_run_info
        return DimensionResult(
            name="component_completeness",
            score=0.0,
            threshold=0.85,
            weight=0.10,
            status="skipped",
            details=details,
        )

    total_matched = sum(s["matched"] for s in summaries)
    total_missing = sum(s["missing"] for s in summaries)
    total_extra = sum(s["extra"] for s in summaries)
    denom = total_matched + total_missing + total_extra
    score = total_matched / denom if denom > 0 else 0.0

    details = {
        "matched": total_matched,
        "missing": total_missing,
        "extra": total_extra,
        "page_count": len(summaries),
        "pages": summaries,
    }
    if auto_run_info is not None:
        details["auto_run"] = auto_run_info

    return DimensionResult(
        name="component_completeness",
        score=score,
        threshold=0.85,
        weight=0.10,
        status="",
        details=details,
    )


register(Dimension(
    name="component_completeness",
    weight=0.10,
    threshold=0.85,
    critical_fail_at=0.42,
    runner=run,
))
