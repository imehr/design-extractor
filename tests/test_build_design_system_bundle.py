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
