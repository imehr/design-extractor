"""Tests for component_validator discovery and matching heuristics."""

import importlib.util
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


def _load_component_validator():
    spec = importlib.util.spec_from_file_location(
        "component_validator", SCRIPTS / "component_validator.py"
    )
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_component_discovery_script_covers_rendered_html_landmarks():
    mod = _load_component_validator()

    script = mod.build_find_components_js()

    for selector in (
        "[data-component]",
        "[data-section]",
        "main > section",
        "[role=\"region\"]",
        "article",
        "form",
    ):
        assert selector in script

    assert "scoreCandidate" in script
    assert "getComponentName" in script
    assert "isVisible" in script


def test_match_components_falls_back_to_type_and_page_position():
    mod = _load_component_validator()

    orig_components = [
        {"type": "hero", "heading": "Lead experience", "top": 120},
        {"type": "card-grid", "heading": "Featured choices", "top": 760},
        {"type": "cta", "heading": "Final prompt", "top": 1320},
    ]
    replica_components = [
        {"type": "hero", "heading": "Primary masthead", "top": 100},
        {"type": "card-grid", "heading": "Article cards", "top": 820},
        {"type": "cta", "heading": "Contact block", "top": 1390},
    ]

    pairs = mod.match_components(orig_components, replica_components)

    assert pairs == list(zip(orig_components, replica_components))
