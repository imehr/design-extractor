"""Tests for scripts/build_design_system_bundle.py — OD v1 bundle emitter (WS3)."""

import importlib.util
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


V = _load("_od_manifest_validator")
bds = _load("build_design_system_bundle")


# ── Shared fixtures ───────────────────────────────────────────────────────────

FIXTURE_DESIGN_MD = """---
name: Acme
colors:
  surface: '#FFFFFF'
  on-surface: '#111111'
  primary: '#FF4400'
  border: '#DDDDDD'
typography:
  display: {fontFamily: AcmeSans}
  body: {fontFamily: AcmeText}
---

# Acme Design System

## Overview

Acme presents a focused identity anchored by `#FF4400`.

## Colors

- **Background** (`#FFFFFF`): canvas
- **Text** (`#111111`): body
- **Primary** (`#FF4400`): CTAs
- **Border** (`#DDDDDD`): dividers
"""

FIXTURE_TOKENS = {
    "stage": "token_extraction",
    "url": "https://acme.example",
    "brand": "Acme",
    "colours": {"computed": [
        {"value": "rgb(255, 255, 255)", "count": 40, "confidence": "HIGH", "role": "backgrounds"},
        {"value": "rgb(17, 17, 17)", "count": 80, "confidence": "HIGH", "role": "text"},
        {"value": "rgb(255, 68, 0)", "count": 50, "confidence": "HIGH", "role": "accent"},
    ]},
    "typography": {"families": [
        {"role": "heading", "value": "AcmeSans", "count": 50},
        {"role": "body", "value": "AcmeText", "count": 100},
    ]},
    "spacing": {"max_width": "1140px"},
}

FIXTURE_METADATA = {
    "name": "Acme", "slug": "acme-co",
    "source_url": "https://acme.example",
    "extracted_at": "2026-06-01", "categories": ["retail"],
}


@pytest.fixture()
def brand_root(tmp_path: Path) -> Path:
    root = tmp_path / "brands" / "acme-co"
    root.mkdir(parents=True)
    (root / "DESIGN.md").write_text(FIXTURE_DESIGN_MD)
    (root / "design-tokens.json").write_text(json.dumps(FIXTURE_TOKENS))
    (root / "metadata.json").write_text(json.dumps(FIXTURE_METADATA))
    return root


# ── 3.1 manifest + skeleton ───────────────────────────────────────────────────

def test_build_writes_schema_valid_manifest(brand_root, tmp_path):
    bundle = bds.build(brand_root, out_dir=tmp_path / "ds")
    manifest = json.loads((bundle / "manifest.json").read_text())
    res = V.validate(manifest)
    assert res.ok, res.errors


def test_build_manifest_has_required_literals(brand_root, tmp_path):
    bundle = bds.build(brand_root, out_dir=tmp_path / "ds")
    m = json.loads((bundle / "manifest.json").read_text())
    assert m["schemaVersion"] == "od-design-system-project/v1"
    assert m["id"] == "acme-co"
    assert m["name"] == "Acme"
    assert m["source"] == {"type": "bundled", "origin": "design-extractor"}
    assert m["files"] == {
        "design": "DESIGN.md", "tokens": "tokens.css",
        "designTokens": "design-tokens.json", "tailwind": "tailwind-v4.css",
        "components": "components.html",
    }
    assert m["importMode"] == "normalized"
    assert m["componentsManifest"] == "components.manifest.json"
    assert m["usage"] == "USAGE.md"
    assert m["assetsDir"] == "assets"
    assert m["craft"]["suggested"] == ["color", "accessibility-baseline"]


def test_build_category_mapped_via_export_labels(brand_root, tmp_path):
    bundle = bds.build(brand_root, out_dir=tmp_path / "ds")
    m = json.loads((bundle / "manifest.json").read_text())
    assert m["category"] == "Retail & Consumer"


def test_build_creates_every_manifest_referenced_path(brand_root, tmp_path):
    bundle = bds.build(brand_root, out_dir=tmp_path / "ds")
    expected = [
        "DESIGN.md", "tokens.css", "design-tokens.json", "tailwind-v4.css",
        "components.html", "components.manifest.json", "USAGE.md", "manifest.json",
        "preview/colors.html", "preview/typography.html", "preview/spacing.html",
    ]
    for rel in expected:
        assert (bundle / rel).is_file(), f"missing {rel}"


def test_build_returns_bundle_path(brand_root, tmp_path):
    bundle = bds.build(brand_root, out_dir=tmp_path / "ds")
    assert bundle.is_dir()
    assert bundle.name == "ds"


def test_build_raises_when_manifest_invalid(brand_root, tmp_path, monkeypatch):
    # Force an invalid manifest to confirm the emitter guards its own output.
    monkeypatch.setattr(bds, "build_manifest", lambda slug, data: {"schemaVersion": "bad"})
    with pytest.raises(ValueError, match="manifest failed v1 validation"):
        bds.build(brand_root, out_dir=tmp_path / "ds")


# ── 3.2 tokens.css ────────────────────────────────────────────────────────────

def _measured(**values):
    """Build a MeasuredTokens where each kwarg is {token: value}."""
    return bds.MeasuredTokens({k: {"value": v, "sources": ["test"], "confidence": "HIGH", "count": 5}
                               for k, v in values.items()})


def test_tokens_css_has_required_tokens_declared():
    css = bds.render_tokens_css(_measured())
    required = ["--bg", "--surface", "--fg", "--muted", "--border", "--accent",
                "--font-display", "--font-body",
                "--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl",
                "--text-2xl", "--text-3xl", "--text-4xl", "--container-max"]
    root = css.split("}")[0]
    for tok in required:
        assert f"{tok}:" in root, f"missing declared token {tok}"


def test_tokens_css_every_var_resolves_to_declared_token():
    css = bds.render_tokens_css(_measured())
    declared = {m.group(1) for m in __import__("re").finditer(r"(--[a-zA-Z0-9_-]+)\s*:", css)}
    for m in __import__("re").finditer(r"var\(\s*(--[a-zA-Z0-9_-]+)", css):
        assert m.group(1) in declared, f"var({m.group(1)}) references undeclared token"


def test_tokens_css_unmeasured_a2_uses_od_fallback_verbatim():
    # Only identity colors measured; A2 tokens must fall back verbatim.
    mt = _measured(**{"--bg": "#ffffff", "--accent": "#0066cc"})
    css = bds.render_tokens_css(mt)
    assert "--accent-hover: color-mix(in oklab, var(--accent), black 8%);" in css
    assert "--accent-active: color-mix(in oklab, var(--accent), black 14%);" in css
    assert "--accent-on: #ffffff;" in css
    assert "--success: #16a34a;" in css
    assert "--radius-pill: 9999px;" in css
    assert "--ease-standard: cubic-bezier(0.2, 0, 0, 1);" in css
    assert "--elev-ring: 0 0 0 1px var(--border);" in css


def test_tokens_css_measured_value_wins_over_fallback():
    mt = _measured(**{"--space-4": "24px", "--radius-md": "4px"})
    css = bds.render_tokens_css(mt)
    assert "--space-4: 24px;" in css
    assert "--radius-md: 4px;" in css
    assert "--space-4: 16px;" not in css  # OD fallback not used


def test_tokens_css_has_dark_mode_block():
    css = bds.render_tokens_css(_measured())
    assert '[data-theme="dark"] {' in css


def test_tokens_css_includes_every_schema_token():
    css = bds.render_tokens_css(_measured())
    for spec in bds.TOKEN_SCHEMA:
        assert f"{spec['name']}:" in css, f"missing {spec['name']}"


def test_tokens_css_b_slot_aliased_when_unmeasured():
    css = bds.render_tokens_css(_measured())  # nothing measured for b-slots
    assert "--surface-warm: var(--surface);" in css
    assert "--fg-2: var(--fg);" in css


def test_tokens_css_appends_site_specific_extras():
    mt = _measured(**{"--bg": "#fff", "--brand-glow": "0 0 12px red"})
    css = bds.render_tokens_css(mt)
    assert "--brand-glow: 0 0 12px red;" in css

