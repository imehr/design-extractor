"""Tests for the measured-token analyzer (WS2, Task 2.2).

The analyzer maps per-element computed-style samples onto the canonical
OD TOKEN_SCHEMA. It is pure Python (no browser) so tests feed it plain dicts.
"""

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


# -- (a) cluster() frequency histogram + space snapping ------------------------

def test_cluster_builds_frequency_histogram():
    mt = load_module("measured_tokens")
    hist = mt.cluster([16, 16, 16, 8, 24])
    assert hist == {8: 1, 16: 3, 24: 1}


def test_space_snapping_to_od_tiers():
    mt = load_module("measured_tokens")
    assert mt.nearest_space_token(8) == "--space-2"
    assert mt.nearest_space_token(16) == "--space-4"
    assert mt.nearest_space_token(24) == "--space-6"
    # 28px snaps to the 32px tier (space-8), not an invented tier.
    assert mt.nearest_space_token(28) == "--space-8"
    assert mt.nearest_space_token(4) == "--space-1"
    assert mt.nearest_space_token(48) == "--space-12"


def test_analyze_emits_measured_space_tokens():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": "section", "role": "container",
         "paddingTop": "8px", "paddingBottom": "8px", "paddingLeft": "16px",
         "paddingRight": "16px", "marginTop": "0px", "marginBottom": "0px",
         "marginLeft": "0px", "marginRight": "0px", "gap": "24px"}
        for _ in range(6)
    ]
    tokens = mt.analyze(samples).to_dict()
    assert tokens["--space-2"]["value"] == "8px"   # 8px → space-2, count 12 (top+bottom ×6)
    assert tokens["--space-4"]["value"] == "16px"  # 16px → space-4
    assert tokens["--space-6"]["value"] == "24px"  # gap 24px → space-6
    assert tokens["--space-2"]["confidence"] == "HIGH"  # 12 distinct >= 5


# -- (b) accent = most-saturated among links/buttons ---------------------------

def test_saturation_ranks_vivid_above_neutral():
    mt = load_module("measured_tokens")
    # pure grey vs saturated brand red
    assert mt.saturation((128, 128, 128)) < mt.saturation((220, 38, 38))


def test_accent_picks_most_saturated_color():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": "a", "role": "link", "color": "rgb(220, 38, 38)"},
        {"selector": "a", "role": "link", "color": "rgb(220, 38, 38)"},
        {"selector": "button", "role": "button", "backgroundColor": "rgb(220, 38, 38)"},
        {"selector": "p", "role": "body", "color": "rgb(120, 120, 120)"},  # neutral, higher freq
        {"selector": "p", "role": "body", "color": "rgb(120, 120, 120)"},
        {"selector": "p", "role": "body", "color": "rgb(120, 120, 120)"},
    ]
    tokens = mt.analyze(samples).to_dict()
    assert tokens["--accent"]["value"].lower() == "#dc2626"


# -- (c) text-size clusters → --text-xs..4xl preserving order ------------------

def test_text_size_clusters_preserve_order():
    mt = load_module("measured_tokens")
    sizes = [12, 14, 16, 18, 24, 32, 48, 64]
    centroids = mt.cluster_size_tiers(sizes)
    assert centroids == sorted(centroids)
    assert len(centroids) <= 8

    samples = [
        {"selector": "h1", "role": "heading", "fontSize": f"{s}px",
         "lineHeight": "1.1", "letterSpacing": "-0.02em"}
        for s in sizes
    ]
    tokens = mt.analyze(samples).to_dict()
    order = ["--text-xs", "--text-sm", "--text-base", "--text-lg",
             "--text-xl", "--text-2xl", "--text-3xl", "--text-4xl"]
    present = [t for t in order if t in tokens]
    vals = [int(tokens[t]["value"].replace("px", "")) for t in present]
    assert vals == sorted(vals), f"text tiers not ascending: {list(zip(present, vals))}"


# -- (d) --radius-pill when any radius >= 999px --------------------------------

def test_radius_pill_when_any_radius_is_large():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": ".btn", "role": "button", "borderRadius": "8px"},
        {"selector": ".badge", "role": "badge", "borderRadius": "9999px"},
    ]
    tokens = mt.analyze(samples).to_dict()
    assert tokens["--radius-pill"]["value"] == "9999px"


# -- (e) confidence HIGH when count >= 5 ---------------------------------------

def test_confidence_high_when_count_at_least_five():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": "body", "role": "body",
         "backgroundColor": "rgb(255, 255, 255)", "color": "rgb(32, 32, 32)"}
        for _ in range(5)
    ]
    tokens = mt.analyze(samples).to_dict()
    assert tokens["--bg"]["confidence"] == "HIGH"
    assert tokens["--bg"]["count"] >= 5
    assert tokens["--fg"]["confidence"] == "HIGH"


def test_confidence_med_for_two_to_four_samples():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": "body", "role": "body",
         "backgroundColor": "rgb(255, 255, 255)", "color": "rgb(32, 32, 32)"}
        for _ in range(3)
    ]
    tokens = mt.analyze(samples).to_dict()
    assert tokens["--bg"]["confidence"] == "MED"


def test_confidence_low_for_single_sample():
    mt = load_module("measured_tokens")
    tokens = mt.analyze([
        {"selector": "body", "role": "body", "color": "rgb(32, 32, 32)"}
    ]).to_dict()
    assert tokens["--fg"]["confidence"] == "LOW"


# -- bg/fg/surface/border modals + provenance shape ----------------------------

def test_bg_fg_border_from_modals_with_provenance():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": "body", "role": "body",
         "backgroundColor": "rgb(255, 255, 255)", "color": "rgb(32, 32, 32)",
         "borderColor": "rgb(226, 232, 240)"},
        {"selector": "main", "role": "container",
         "backgroundColor": "rgb(246, 247, 251)"},
    ]
    tokens = mt.analyze(samples).to_dict()
    assert tokens["--bg"]["value"].lower() == "#ffffff"
    assert tokens["--fg"]["value"].lower() == "#202020"
    assert tokens["--surface"]["value"].lower() == "#f6f7fb"
    assert tokens["--border"]["value"].lower() == "#e2e8f0"
    for name in ("--bg", "--fg", "--surface", "--border"):
        prov = tokens[name]
        assert set(prov.keys()) >= {"value", "sources", "confidence", "count"}, prov
        assert isinstance(prov["sources"], list)


def test_muted_is_second_text_tier():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": "p", "role": "body", "color": "rgb(32, 32, 32)"} for _ in range(6)
    ] + [
        {"selector": "small", "role": "body", "color": "rgb(120, 120, 120)"} for _ in range(2)
    ]
    tokens = mt.analyze(samples).to_dict()
    # fg = modal (32,32,32), muted = the lower-frequency tier with lower contrast vs bg
    assert tokens["--fg"]["value"].lower() == "#202020"
    assert tokens["--muted"]["value"].lower() == "#787878"


def test_font_display_and_body_from_headings_and_body():
    mt = load_module("measured_tokens")
    samples = [
        {"selector": "h1", "role": "heading", "fontFamily": '"Display Sans", sans-serif',
         "fontSize": "48px", "lineHeight": "1.1", "letterSpacing": "-0.02em"},
        {"selector": "p", "role": "body", "fontFamily": '"Body Text", serif',
         "fontSize": "16px", "lineHeight": "1.6", "letterSpacing": "normal"},
    ]
    tokens = mt.analyze(samples).to_dict()
    assert "Display Sans" in tokens["--font-display"]["value"]
    assert "Body Text" in tokens["--font-body"]["value"]


def test_od_fallbacks_fill_semantic_tokens_not_measured():
    mt = load_module("measured_tokens")
    tokens = mt.analyze([
        {"selector": "body", "role": "body", "color": "rgb(32, 32, 32)",
         "backgroundColor": "rgb(255, 255, 255)"}
    ]).to_dict()
    # Not measurable from computed styles → OD fallback values, marked LOW/absent measured.
    assert tokens["--success"]["value"] == "#16a34a"
    assert tokens["--warn"]["value"] == "#eab308"
    assert tokens["--danger"]["value"] == "#dc2626"
    assert tokens["--accent-on"]["value"] == "#ffffff"


def test_empty_samples_does_not_crash():
    mt = load_module("measured_tokens")
    tokens = mt.analyze([]).to_dict()
    assert isinstance(tokens, dict)
