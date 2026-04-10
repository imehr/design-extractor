"""Integration tests for pattern_extractor.py signal computation."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")
BASELINE = Path("/tmp/design-extractor-baseline/linear-app")
TOKENS_PATH = BASELINE / "tokens-output.json"
PATTERNS_OUTPUT = Path("/tmp/test-patterns-check.json")

SIGNAL_KEYS = [
    "spacing_rhythm", "type_scale_ratio", "component_density",
    "alignment_grid", "cta_placement", "border_radius_language",
    "shadow_elevation", "motion_language", "color_temperature",
]


@pytest.fixture(scope="module")
def patterns():
    """Run pattern_extractor once (no screenshot) and return the parsed output."""
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "pattern_extractor.py"),
         "--tokens", str(TOKENS_PATH),
         "--output", str(PATTERNS_OUTPUT)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, f"pattern_extractor failed: {result.stderr}"
    with open(PATTERNS_OUTPUT) as f:
        return json.load(f)


# -- CLI -----------------------------------------------------------------------

def test_cli_help():
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "pattern_extractor.py"), "--help"],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 0


# -- All 9 signals present -----------------------------------------------------

def test_linear_patterns(patterns):
    """Output must contain all 9 signal keys."""
    signals = patterns["signals"]
    for key in SIGNAL_KEYS:
        assert key in signals, f"Missing signal: {key}"


# -- Signal 1: Spacing rhythm --------------------------------------------------

def test_spacing_rhythm_signal(patterns):
    rhythm = patterns["signals"]["spacing_rhythm"]
    assert rhythm["base_unit"] == "4px"


# -- Signal 2: Type scale ratio ------------------------------------------------

def test_type_scale_ratio_signal(patterns):
    ts = patterns["signals"]["type_scale_ratio"]
    assert "ratio" in ts
    assert "label" in ts
    assert "confidence" in ts


# -- Signal 6: Border radius language ------------------------------------------

def test_border_radius_language(patterns):
    br = patterns["signals"]["border_radius_language"]
    assert br["label"] == "soft", f"Expected 'soft' for Linear, got '{br['label']}'"


# -- Signal 7: Shadow elevation ------------------------------------------------

def test_shadow_elevation(patterns):
    se = patterns["signals"]["shadow_elevation"]
    assert "unique_clusters" in se
    assert "label" in se


# -- Signal 8: Motion language -------------------------------------------------

def test_motion_language(patterns):
    ml = patterns["signals"]["motion_language"]
    assert "median_duration_ms" in ml
    assert "label" in ml


# -- Signal 9: Color temperature -----------------------------------------------

def test_color_temperature(patterns):
    ct = patterns["signals"]["color_temperature"]
    assert "mean_chroma" in ct
    assert "dominant_hue_range" in ct
    assert "label" in ct


# -- Screenshot-dependent signals graceful skip --------------------------------

def test_missing_screenshot_graceful(patterns):
    """Signals 3, 4, 5 should be SKIPPED when no screenshot is provided."""
    for name in ("component_density", "alignment_grid", "cta_placement"):
        sig = patterns["signals"][name]
        assert sig["confidence"] == "SKIPPED", (
            f"{name} should be SKIPPED without screenshot, got {sig['confidence']}"
        )
