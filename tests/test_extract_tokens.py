"""Integration tests for extract_tokens.py output schemas using Phase 0 baseline data."""

import json
from pathlib import Path

import pytest

BASELINE = Path("/tmp/design-extractor-baseline")
LINEAR_DIR = BASELINE / "linear-app"
AIRBNB_DIR = BASELINE / "airbnb-com"


@pytest.fixture(scope="module")
def recon():
    with open(LINEAR_DIR / "recon-output.json") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def tokens():
    with open(LINEAR_DIR / "tokens-output.json") as f:
        return json.load(f)


# -- Recon stage ---------------------------------------------------------------

def test_recon_output_schema(recon):
    """Recon JSON must contain top-level keys for status, url, and page_types."""
    assert "status" in recon
    assert "url" in recon
    assert recon.get("meta", {}).get("title"), "meta.title should be non-empty"
    assert "themeColor" in recon.get("meta", {}), "meta.themeColor should exist"
    assert isinstance(recon["page_types"], list)


# -- Tokens stage --------------------------------------------------------------

def test_tokens_output_schema(tokens):
    """Tokens JSON must contain all expected top-level keys."""
    expected = {
        "stage", "url", "colours", "typography", "spacing",
        "borders", "shadows", "breakpoints", "transitions", "custom_properties",
    }
    assert expected.issubset(tokens.keys()), f"Missing keys: {expected - tokens.keys()}"


def test_colours_have_both_sources(tokens):
    """Colours must include data from both custom properties and computed styles."""
    colours = tokens["colours"]
    assert isinstance(colours["custom_properties"], dict)
    assert len(colours["custom_properties"]) > 0, "custom_properties should be non-empty"
    assert isinstance(colours["computed"], list)
    assert len(colours["computed"]) > 0, "computed colours should be non-empty"


def test_typography_extraction(tokens):
    """Typography must contain non-empty lists for families, sizes, and weights."""
    typo = tokens["typography"]
    assert len(typo["families"]) > 0, "font families should be non-empty"
    assert len(typo["sizes"]) > 0, "font sizes should be non-empty"
    assert len(typo["weights"]) > 0, "font weights should be non-empty"


def test_spacing_base_unit(tokens):
    """Spacing must have a detected_base_unit ending in 'px'."""
    base = tokens["spacing"]["detected_base_unit"]
    assert isinstance(base, str), "detected_base_unit should be a string"
    assert base.endswith("px"), f"detected_base_unit should end with 'px', got '{base}'"


# -- Error handling ------------------------------------------------------------

def test_airbnb_error_handling():
    """Airbnb recon should have an error key (site blocks headless browsers)."""
    with open(AIRBNB_DIR / "recon-output.json") as f:
        data = json.load(f)
    assert "error" in data, "airbnb recon-output.json should contain an 'error' key"
