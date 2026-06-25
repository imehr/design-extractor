"""Tests for scripts/_od_manifest_validator.py — faithful port of OD's manifest.schema.ts."""

import importlib.util
import sys
from pathlib import Path

import pytest

_SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"


def _load_validator():
    spec = importlib.util.spec_from_file_location(
        "_od_manifest_validator", _SCRIPTS / "_od_manifest_validator.py"
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["_od_manifest_validator"] = mod
    spec.loader.exec_module(mod)
    return mod


V = _load_validator()


def _base_manifest():
    """A minimal valid manifest (bundled source)."""
    return {
        "schemaVersion": "od-design-system-project/v1",
        "id": "acme-co",
        "name": "Acme",
        "category": "Retail & Consumer",
        "source": {"type": "bundled", "origin": "design-extractor"},
        "files": {
            "design": "DESIGN.md",
            "tokens": "tokens.css",
            "designTokens": "design-tokens.json",
            "tailwind": "tailwind-v4.css",
            "components": "components.html",
        },
    }


# ── valid cases ───────────────────────────────────────────────────────────────

def test_minimal_valid_manifest_passes():
    res = V.validate(_base_manifest())
    assert res.ok, res.errors
    assert res.errors == []


def test_full_valid_manifest_with_all_optional_fields_passes():
    m = _base_manifest()
    m.update({
        "description": "Acme design system bundle.",
        "assetsDir": "assets",
        "previewDir": "preview",
        "usage": "USAGE.md",
        "componentsManifest": "components.manifest.json",
        "importMode": "normalized",
        "craft": {"applies": [], "suggested": ["color", "accessibility-baseline"], "exemptions": []},
        "fonts": [{"family": "AcmeSans", "file": "assets/AcmeSans.woff2", "weight": 600}],
        "preview": {
            "dir": "preview",
            "pages": [{"path": "preview/colors.html", "role": "colors", "title": "Colors"}],
        },
        "sourceFiles": {"evidence": "source/evidence.md"},
    })
    res = V.validate(m)
    assert res.ok, res.errors


def test_source_discriminated_union_all_types_valid():
    for source, extra_ok in [
        ({"type": "bundled"}, True),
        ({"type": "local", "path": "/tmp/x", "importedAt": "2026-06-25T10:00:00Z"}, True),
        ({"type": "github", "url": "https://github.com/x/y", "commit": "abc"}, True),
        ({"type": "shadcn", "reference": "x", "item": "y"}, True),
    ]:
        m = _base_manifest()
        m["source"] = source
        res = V.validate(m)
        assert res.ok is extra_ok, (source, res.errors)


# ── top-level / literal / slug ────────────────────────────────────────────────

def test_unknown_top_level_key_rejected():
    m = _base_manifest()
    m["bogus"] = 1
    res = V.validate(m)
    assert not res.ok
    assert any("$.bogus is not part of" in e for e in res.errors)


def test_wrong_schema_version_rejected():
    m = _base_manifest()
    m["schemaVersion"] = "od-design-system-project/v2"
    res = V.validate(m)
    assert not res.ok
    assert any("$.schemaVersion must be" in e for e in res.errors)


@pytest.mark.parametrize("bad_id", ["Acme", "acme_co", "-acme", "acme-", "", "acme--co"])
def test_invalid_id_slug_rejected(bad_id):
    m = _base_manifest()
    m["id"] = bad_id
    res = V.validate(m)
    assert not res.ok
    assert any("$.id must be a lowercase slug" in e for e in res.errors)


def test_empty_name_rejected():
    m = _base_manifest()
    m["name"] = "   "
    res = V.validate(m)
    assert not res.ok
    assert any("$.name must be a non-empty string" in e for e in res.errors)


def test_empty_category_rejected():
    m = _base_manifest()
    m["category"] = ""
    res = V.validate(m)
    assert not res.ok
    assert any("$.category must be a non-empty string" in e for e in res.errors)


# ── source union errors ───────────────────────────────────────────────────────

def test_unknown_source_key_rejected():
    m = _base_manifest()
    m["source"] = {"type": "bundled", "origin": "x", "bogus": 1}
    res = V.validate(m)
    assert not res.ok
    assert any("$.source.bogus is not part of" in e for e in res.errors)


def test_source_missing_required_field():
    m = _base_manifest()
    m["source"] = {"type": "github"}  # url required
    res = V.validate(m)
    assert not res.ok
    assert any("$.source.url must be a non-empty string" in e for e in res.errors)


def test_source_invalid_type_rejected():
    m = _base_manifest()
    m["source"] = {"type": "npm"}
    res = V.validate(m)
    assert not res.ok
    assert any("$.source.type must be one of" in e for e in res.errors)


# ── files literals ────────────────────────────────────────────────────────────

def test_files_design_must_be_literal():
    m = _base_manifest()
    m["files"] = {"design": "design.md", "tokens": "tokens.css"}
    res = V.validate(m)
    assert not res.ok
    assert any('$.files.design must be "DESIGN.md"' in e for e in res.errors)


def test_files_tokens_must_be_literal():
    m = _base_manifest()
    m["files"] = {"design": "DESIGN.md", "tokens": "theme.css"}
    res = V.validate(m)
    assert not res.ok
    assert any('$.files.tokens must be "tokens.css"' in e for e in res.errors)


def test_files_unknown_key_rejected():
    m = _base_manifest()
    m["files"] = {"design": "DESIGN.md", "tokens": "tokens.css", "theme": "x"}
    res = V.validate(m)
    assert not res.ok
    assert any("$.files.theme is not part of" in e for e in res.errors)


# ── safe relative paths ───────────────────────────────────────────────────────

@pytest.mark.parametrize("bad_path", ["/abs/x", "C:\\x", "a\\b", "../x", "./x", "a//b", "a/./b"])
def test_unsafe_relative_path_rejected(bad_path):
    m = _base_manifest()
    m["usage"] = bad_path
    res = V.validate(m)
    assert not res.ok
    assert any("$.usage must be a safe relative path" in e for e in res.errors)


# ── importMode enum ───────────────────────────────────────────────────────────

def test_invalid_import_mode_rejected():
    m = _base_manifest()
    m["importMode"] = "fancy"
    res = V.validate(m)
    assert not res.ok
    assert any("$.importMode must be one of" in e for e in res.errors)


# ── craft slug arrays ─────────────────────────────────────────────────────────

def test_craft_non_slug_entry_rejected():
    m = _base_manifest()
    m["craft"] = {"applies": ["Color"], "suggested": [], "exemptions": []}
    res = V.validate(m)
    assert not res.ok
    assert any("must be a lowercase slug" in e for e in res.errors)


def test_craft_must_be_object():
    m = _base_manifest()
    m["craft"] = ["x"]
    res = V.validate(m)
    assert not res.ok
    assert any("$.craft must be an object" in e for e in res.errors)


# ── fonts ─────────────────────────────────────────────────────────────────────

def test_font_missing_file_rejected():
    m = _base_manifest()
    m["fonts"] = [{"family": "X"}]
    res = V.validate(m)
    assert not res.ok
    assert any("$.fonts[0].file must be a non-empty relative path" in e for e in res.errors)


def test_font_must_be_array():
    m = _base_manifest()
    m["fonts"] = {"family": "X"}
    res = V.validate(m)
    assert not res.ok
    assert any("$.fonts must be an array" in e for e in res.errors)


# ── preview ───────────────────────────────────────────────────────────────────

def test_preview_pages_must_be_array():
    m = _base_manifest()
    m["preview"] = {"dir": "preview", "pages": "x"}
    res = V.validate(m)
    assert not res.ok
    assert any("$.preview.pages must be an array" in e for e in res.errors)


# ── sourceFiles ───────────────────────────────────────────────────────────────

def test_source_files_unknown_key_rejected():
    m = _base_manifest()
    m["sourceFiles"] = {"evidence": "source/x.md", "bogus": "y"}
    res = V.validate(m)
    assert not res.ok
    assert any("$.sourceFiles.bogus is not part of" in e for e in res.errors)


def test_non_object_manifest_rejected():
    res = V.validate([1, 2, 3])
    assert not res.ok
    assert res.errors == ["manifest must be a JSON object"]


def test_stripe_reference_manifest_validates():
    """The reference bundled stripe manifest must pass our port."""
    import json
    od_root = Path("/Users/mehran/Documents/github/open-design")
    stripe = od_root / "design-systems" / "stripe" / "manifest.json"
    if not stripe.is_file():
        pytest.skip("open-design checkout not present")
    res = V.validate(json.loads(stripe.read_text()))
    assert res.ok, res.errors
