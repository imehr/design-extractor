"""Smoke test for extract_rubric_diagnosis."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
RUBRIC_PATH = (
    Path.home()
    / ".claude"
    / "design-library"
    / "brands"
    / "woolworths-com-au"
    / "validation"
    / "rubric-report.json"
)


def _load_improvement_job_module():
    spec = importlib.util.spec_from_file_location(
        "improvement_job", REPO_ROOT / "scripts" / "improvement_job.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def rubric_report() -> dict:
    if not RUBRIC_PATH.exists():
        pytest.skip(f"rubric report not present at {RUBRIC_PATH}")
    return json.loads(RUBRIC_PATH.read_text())


def test_extract_rubric_diagnosis_homepage(rubric_report: dict) -> None:
    ij = _load_improvement_job_module()
    out = ij.extract_rubric_diagnosis(rubric_report, "homepage")

    assert isinstance(out, str)
    assert out, "diagnosis should not be empty for a failing rubric"
    assert "font_rendering" in out, "font_rendering must surface (it's failing)"
    assert (
        "asset_fidelity" in out or "component_completeness" in out
    ), "at least one critical dimension must surface"
    assert "pattern_fidelity" not in out, "passing dimensions must be excluded"
    assert len(out) < 8000, f"diagnosis block too long ({len(out)} chars) — prompt bloat"


def test_extract_rubric_diagnosis_handles_none() -> None:
    ij = _load_improvement_job_module()
    assert ij.extract_rubric_diagnosis(None, "homepage") == ""
    assert ij.extract_rubric_diagnosis({}, "homepage") == ""


def test_extract_rubric_diagnosis_skips_passing(rubric_report: dict) -> None:
    ij = _load_improvement_job_module()
    out = ij.extract_rubric_diagnosis(rubric_report, "homepage")
    # anti_slop has violation_count=0 and status=pass → should not appear
    assert "- anti_slop" not in out
