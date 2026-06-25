"""Tests for the raw-CSS capture probe (WS2, Task 2.1).

The browser-touching JS probe collects per-stylesheet cssText; this file
exercises the *pure-Python* parser that turns serialized cssText into the
OD buckets (rootVars / mediaQueries / keyframes / layers / fontFace /
supportsRules / topRules). Keeping the parser pure means it is fully
unit-testable without a browser.
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


FIXTURE_CSS = """
:root {
  --brand: #ffffff;
  --brand-ink: #111111;
}
@media (max-width: 768px) {
  body { color: red; }
  .card { padding: 8px; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@font-face {
  font-family: 'MyFont';
  src: url('myfont.woff2') format('woff2');
}
@layer base, components;
@supports (display: grid) {
  .grid { display: grid; }
}
"""


def _buckets():
    eb = load_module("extract_brand")
    return eb.parse_raw_css_buckets(FIXTURE_CSS)


def test_root_vars_scraped_from_root_selector():
    buckets = _buckets()
    assert buckets["rootVars"]["--brand"] == "#ffffff"
    assert buckets["rootVars"]["--brand-ink"] == "#111111"


def test_media_queries_with_rule_counts():
    buckets = _buckets()
    media = buckets["mediaQueries"]
    assert media, "expected at least one media query"
    match = next((m for m in media if "max-width" in m["query"]), None)
    assert match is not None, f"max-width media query missing: {media}"
    assert match["ruleCount"] == 2


def test_keyframes_steps_captured():
    buckets = _buckets()
    spin = next((kf for kf in buckets["keyframes"] if kf["name"] == "spin"), None)
    assert spin is not None, f"spin keyframe missing: {buckets['keyframes']}"
    stops = {step["stop"] for step in spin["steps"]}
    assert "from" in stops and "to" in stops
    to_step = next(s for s in spin["steps"] if s["stop"] == "to")
    assert "rotate(360deg)" in to_step["declarations"]


def test_font_face_family_and_src():
    buckets = _buckets()
    assert len(buckets["fontFace"]) == 1
    face = buckets["fontFace"][0]
    assert face["family"] == "MyFont"
    assert "myfont.woff2" in face["src"]


def test_layer_names_captured():
    buckets = _buckets()
    assert "base" in buckets["layers"]
    assert "components" in buckets["layers"]


def test_supports_rules_captured():
    buckets = _buckets()
    assert buckets["supportsRules"], "expected a @supports rule"
    assert any(
        "display:grid" in cond.replace(" ", "")
        for cond in buckets["supportsRules"]
    ), buckets["supportsRules"]


def test_top_rules_present_and_capped_at_50kb():
    eb = load_module("extract_brand")
    big = FIXTURE_CSS + ("\n.a{color:red}" * 6000)
    buckets = eb.parse_raw_css_buckets(big)
    assert isinstance(buckets["topRules"], str)
    assert buckets["topRules"], "topRules should not be empty"
    assert len(buckets["topRules"]) <= 50 * 1024


def test_empty_and_malformed_css_do_not_crash():
    eb = load_module("extract_brand")
    empty = eb.parse_raw_css_buckets("")
    assert empty["rootVars"] == {}
    assert empty["keyframes"] == []
    assert empty["mediaQueries"] == []
    assert empty["fontFace"] == []
    # Unterminated / malformed braces must never raise.
    weird = eb.parse_raw_css_buckets(":root{--x:1")
    assert isinstance(weird["topRules"], str)


def test_buckets_return_all_documented_keys():
    eb = load_module("extract_brand")
    buckets = eb.parse_raw_css_buckets(FIXTURE_CSS)
    for key in ("rootVars", "mediaQueries", "keyframes", "layers",
                "fontFace", "supportsRules", "topRules"):
        assert key in buckets, f"missing bucket: {key}"
