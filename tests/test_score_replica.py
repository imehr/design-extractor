"""Integration tests for score_replica.py pixel comparison scorer."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")


def _create_solid_png(path: Path, colour: tuple[int, int, int], size: tuple[int, int] = (10, 10)):
    """Create a small solid-colour PNG using Pillow."""
    from PIL import Image
    img = Image.new("RGB", size, colour)
    img.save(path)


# -- CLI -----------------------------------------------------------------------

def test_cli_help():
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "score_replica.py"), "--help"],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 0


# -- Output schema with identical images ----------------------------------------

def test_output_schema(tmp_path):
    """Score output must have overall_score, overall_passed, blocking_failures, dimensions."""
    ref_dir = tmp_path / "ref"
    rep_dir = tmp_path / "rep"
    ref_dir.mkdir()
    rep_dir.mkdir()

    for comp in ("nav", "hero"):
        _create_solid_png(ref_dir / f"reference-{comp}.png", (255, 0, 0))
        _create_solid_png(rep_dir / f"replica-{comp}.png", (255, 0, 0))

    out = tmp_path / "scores.json"
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "score_replica.py"),
         "--reference-dir", str(ref_dir),
         "--replica-dir", str(rep_dir),
         "--output", str(out)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, f"score_replica failed: {result.stderr}"

    data = json.loads(out.read_text())
    assert "overall_score" in data
    assert "overall_passed" in data
    assert "blocking_failures" in data
    assert "dimensions" in data


# -- Identical images should score 1.0 -----------------------------------------

def test_identical_images_score_1(tmp_path):
    ref_dir = tmp_path / "ref"
    rep_dir = tmp_path / "rep"
    ref_dir.mkdir()
    rep_dir.mkdir()

    for comp in ("nav", "hero", "button-set", "card", "footer", "form"):
        _create_solid_png(ref_dir / f"reference-{comp}.png", (255, 0, 0))
        _create_solid_png(rep_dir / f"replica-{comp}.png", (255, 0, 0))

    out = tmp_path / "scores.json"
    subprocess.run(
        [sys.executable, str(SCRIPTS / "score_replica.py"),
         "--reference-dir", str(ref_dir),
         "--replica-dir", str(rep_dir),
         "--output", str(out)],
        capture_output=True, text=True, timeout=30,
    )

    data = json.loads(out.read_text())
    assert data["overall_score"] == 1.0
    assert data["overall_passed"] is True
    assert data["blocking_failures"] == []


# -- Missing replica file should be skipped ------------------------------------

def test_missing_component_handled(tmp_path):
    ref_dir = tmp_path / "ref"
    rep_dir = tmp_path / "rep"
    ref_dir.mkdir()
    rep_dir.mkdir()

    _create_solid_png(ref_dir / "reference-nav.png", (255, 0, 0))
    # replica-nav.png intentionally missing

    out = tmp_path / "scores.json"
    subprocess.run(
        [sys.executable, str(SCRIPTS / "score_replica.py"),
         "--reference-dir", str(ref_dir),
         "--replica-dir", str(rep_dir),
         "--output", str(out)],
        capture_output=True, text=True, timeout=30,
    )

    data = json.loads(out.read_text())
    assert data["dimensions"]["nav"]["status"] == "skipped"
