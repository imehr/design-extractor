"""Unit tests for scripts.pattern_extractor.categorize_component."""

import importlib.util
import sys
from pathlib import Path

import pytest


SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")


def _load_module(name: str, path: Path):
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    try:
        spec.loader.exec_module(module)
    finally:
        try:
            sys.path.remove(str(path.parent))
        except ValueError:
            pass
    return module


_MOD = _load_module("pattern_extractor", SCRIPTS / "pattern_extractor.py")


@pytest.mark.parametrize("name,expected", [
    ("PrimaryButton", "data-input"),
    ("HeroSection", "layout"),
    ("TestimonialCard", "data-display"),
    ("AlertBanner", "feedback"),
    ("NavMenu", "navigation"),
    ("Modal", "overlay"),
    ("PageHeading", "typography"),
    ("ProductImage", "media"),
    ("RandomThing", "other"),
    # Edge cases
    ("", "other"),
    ("pricing", "data-display"),
    ("sidebar-nav", "navigation"),
    ("CheckoutForm", "data-input"),
])
def test_categorize_component(name, expected):
    assert _MOD.categorize_component(name) == expected
