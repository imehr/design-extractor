"""Tests for scripts/export_open_design.py — open-design format export."""

import json
import sys
from pathlib import Path

import pytest

_SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(_SCRIPTS))

import export_open_design as eod  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FIXTURE_DESIGN_MD = """---
version: alpha
name: Acme
description: Acme design system - extracted from https://acme.example
colors:
  primary: '#FF4400'
  surface: '#FFFFFF'
  on-surface: '#111111'
  accent: '#FF4400'
  border: '#DDDDDD'
  muted: '#F4F2F0'
  footer: '#0A0A0A'
typography:
  display:
    fontFamily: AcmeSans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 56px
  body:
    fontFamily: AcmeText
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
rounded:
  md: 8px
  pill: 9999px
spacing:
  md: 16px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    rounded: '{rounded.pill}'
    padding: 12px 24px
---

# Acme Design System

## Overview

Acme presents a focused, modern visual identity anchored by `{colors.primary}`.

**Vibe keywords:** bold, industrial, direct

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `{colors.primary}` | `#FF4400` | Primary actions |

## Layout

- **Max content width:** `1140px`
- **Breakpoints:** 768px (tablet), 1280px (wide)
- **Grid:** 12-column at >=1280px

## Elevation & Depth

Flat system; cards use `0 1px 3px rgba(0,0,0,0.08)`.

## Do's and Don'ts

### Do
- Use `{colors.primary}` for CTAs
- Keep headings in `{typography.display}`

### Don't
- Use emoji as icons
- Invent colours outside the palette

## Agent Prompt Guide

1. Apply `{typography.display}` (AcmeSans) to headings.
2. Primary CTA -> `{colors.primary}` (`#FF4400`).
"""

FIXTURE_TOKENS = {
    "stage": "token_extraction",
    "url": "https://acme.example",
    "brand": "Acme",
    "colours": {
        "computed": [
            {"value": "rgb(255, 68, 0)", "count": 50, "confidence": "HIGH", "role": "accent"},
            {"value": "rgb(255, 255, 255)", "count": 40, "confidence": "HIGH", "role": "backgrounds"},
            {"value": "rgb(17, 17, 17)", "count": 80, "confidence": "HIGH", "role": "text"},
            {"value": "rgb(10, 10, 10)", "count": 20, "confidence": "MEDIUM", "role": "footerDark"},
            {"value": "rgb(221, 221, 221)", "count": 10, "confidence": "MEDIUM", "role": "border"},
        ]
    },
    "typography": {
        "families": [
            {"role": "heading", "value": "AcmeSans", "count": 50},
            {"role": "body", "value": "AcmeText", "count": 100},
        ],
        "sizes": [{"value": "16px", "count": 10}, {"value": "48px", "count": 5}],
        "weights": [{"value": "400", "count": 10}],
    },
    "spacing": {
        "detected_base_unit": "4px",
        "content_padding": "0px",
        "max_width": "1140px",
        "scale": ["4px", "8px", "16px"],
    },
    "shadows": [],
    "breakpoints": [768, 1280],
}

FIXTURE_METADATA = {
    "name": "Acme",
    "slug": "acme-co",
    "source_url": "https://acme.example",
    "extracted_at": "2026-06-01",
    "categories": ["retail", "australian"],
}


@pytest.fixture()
def brand_env(tmp_path: Path):
    """Build a library brand + empty repo brands dir + empty cache dir."""
    library = tmp_path / "library"
    brands = tmp_path / "brands"
    cache = tmp_path / "cache"
    slug_dir = library / "acme-co"
    slug_dir.mkdir(parents=True)
    (slug_dir / "DESIGN.md").write_text(FIXTURE_DESIGN_MD)
    (slug_dir / "design-tokens.json").write_text(json.dumps(FIXTURE_TOKENS))
    (slug_dir / "metadata.json").write_text(json.dumps(FIXTURE_METADATA))
    assets = slug_dir / "assets"
    assets.mkdir()
    (assets / "acme-logo.svg").write_text("<svg></svg>")
    (assets / "hero-shot.png").write_bytes(b"\x89PNG")
    brands.mkdir()
    cache.mkdir()
    return {"library": library, "brands": brands, "cache": cache}


def _export(brand_env, slug="acme-co", **kwargs):
    return eod.export_brand(
        slug,
        brands_dir=brand_env["brands"],
        library_dir=brand_env["library"],
        cache_dir=brand_env["cache"],
        **kwargs,
    )


# ---------------------------------------------------------------------------
# DESIGN.md emission
# ---------------------------------------------------------------------------

def test_nine_sections_present_in_order(brand_env):
    result = _export(brand_env)
    assert result["status"] == "ok"
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    positions = []
    for i, section in enumerate(eod.OPEN_DESIGN_SECTIONS, start=1):
        heading = f"## {i}. {section}"
        assert heading in md, f"missing canonical heading {heading!r}"
        positions.append(md.index(heading))
    assert positions == sorted(positions), "sections out of canonical order"


def test_no_yaml_frontmatter(brand_env):
    result = _export(brand_env)
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    assert not md.startswith("---")
    assert md.startswith("# Acme")


def test_category_line_present(brand_env):
    result = _export(brand_env)
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    assert "> Category: Retail & Consumer" in md
    assert eod.od_extract_category(md) == "Retail & Consumer"


def test_summary_paragraph_parses(brand_env):
    result = _export(brand_env)
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    summary = eod.od_summarize(md)
    assert summary
    assert "acme.example" in summary


def test_swatch_regex_extracts_palette(brand_env):
    result = _export(brand_env)
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    swatches = eod.od_extract_swatches(md)
    assert len(swatches) == 4
    # [bg, support, fg, accent] per open-design's picker.
    assert swatches[0] == "#ffffff"
    assert swatches[2] == "#111111"
    assert swatches[3] == "#ff4400"
    assert all(s.startswith("#") and len(s) == 7 for s in swatches)


def test_color_bullets_match_open_design_swatch_regex(brand_env):
    # The daemon's Form A regex does not match `- **Name:** #hex` (colon
    # inside the bold) — verified against the real daemon, where the bundled
    # "default" system parses to zero swatches. We emit the Form B shape
    # (`**Name** (`#hex`)`) that stripe/airbnb use.
    result = _export(brand_env)
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    assert "- **Background** (`#FFFFFF`)" in md
    assert "- **Primary** (`#FF4400`)" in md


def test_token_refs_resolved_not_leaked(brand_env):
    result = _export(brand_env)
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    assert "{colors.primary}" not in md
    assert "{typography.display}" not in md


def test_dos_donts_use_check_cross_bullets(brand_env):
    result = _export(brand_env)
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    section = md.split("## 9. Anti-patterns")[1]
    assert "- ✅" in section
    assert "- ❌" in section
    assert "Use emoji as icons" in section


def test_round_trip_check_passes(brand_env):
    result = _export(brand_env, check=True)
    assert result["status"] == "ok", result.get("problems")
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    assert eod.check_export(md, "Acme") == []
    parsed = eod.parse_open_design_md(md)
    assert parsed["title"] == "Acme"
    assert parsed["category"] == "Retail & Consumer"


# ---------------------------------------------------------------------------
# Tokens-only fallback (no DESIGN.md)
# ---------------------------------------------------------------------------

def test_tokens_only_brand_exports(tmp_path):
    library = tmp_path / "library"
    slug_dir = library / "bare-co"
    slug_dir.mkdir(parents=True)
    (slug_dir / "design-tokens.json").write_text(json.dumps(FIXTURE_TOKENS))
    brands = tmp_path / "brands"
    brands.mkdir()
    cache = tmp_path / "cache"
    cache.mkdir()
    result = eod.export_brand(
        "bare-co", brands_dir=brands, library_dir=library, cache_dir=cache, check=True
    )
    assert result["status"] == "ok", result.get("problems")
    md = (brands / "bare-co" / "open-design" / "DESIGN.md").read_text()
    assert len(eod.od_extract_swatches(md)) == 4
    # Derived palette comes from computed roles, never invented hexes.
    assert "#FF4400" in md
    assert "AcmeSans" in md


def test_brand_without_data_is_skipped(tmp_path):
    for d in ("library", "brands", "cache"):
        (tmp_path / d).mkdir()
    (tmp_path / "library" / "empty-co").mkdir()
    result = eod.export_brand(
        "empty-co",
        brands_dir=tmp_path / "brands",
        library_dir=tmp_path / "library",
        cache_dir=tmp_path / "cache",
    )
    assert result["status"] == "skipped"


def test_invalid_slug_rejected(tmp_path):
    for d in ("library", "brands", "cache"):
        (tmp_path / d).mkdir()
    result = eod.export_brand(
        "../escape",
        brands_dir=tmp_path / "brands",
        library_dir=tmp_path / "library",
        cache_dir=tmp_path / "cache",
    )
    assert result["status"] == "error"


# ---------------------------------------------------------------------------
# SKILL.md emission
# ---------------------------------------------------------------------------

def test_skill_md_frontmatter_and_od_block(brand_env):
    result = _export(brand_env)
    skill = (Path(result["out_dir"]) / "skill" / "SKILL.md").read_text()
    lines = skill.splitlines()
    assert lines[0] == "---"
    assert "name: brand-acme-co" in skill
    assert "mode: design-system" in skill
    assert "type: html" in skill
    assert "requires: true" in skill
    assert "triggers:" in skill
    assert '"Acme brand"' in skill
    # Negative trigger guidance present in the description.
    assert "Do NOT trigger" in skill


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------

def test_logo_assets_copied_with_readme(brand_env):
    result = _export(brand_env)
    assets_dir = Path(result["out_dir"]) / "assets"
    assert (assets_dir / "acme-logo.svg").is_file()
    assert not (assets_dir / "hero-shot.png").exists()  # not a logo/favicon
    readme = (assets_dir / "README.md").read_text()
    assert "acme-logo.svg" in readme


# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------

@pytest.fixture()
def open_design_root(tmp_path: Path):
    root = tmp_path / "open-design"
    (root / "design-systems" / "default").mkdir(parents=True)
    (root / "skills").mkdir()
    return root


def test_install_writes_brand_dirs(brand_env, open_design_root):
    result = _export(brand_env, install_root=open_design_root)
    assert result["status"] == "ok"
    design = open_design_root / "design-systems" / "brand-acme-co" / "DESIGN.md"
    skill = open_design_root / "skills" / "brand-acme-co" / "SKILL.md"
    assert design.is_file()
    assert skill.is_file()
    parsed = eod.parse_open_design_md(design.read_text())
    assert parsed["title"] == "Acme"
    assert len(parsed["swatches"]) == 4


def test_install_is_idempotent(brand_env, open_design_root):
    first = _export(brand_env, install_root=open_design_root)
    second = _export(brand_env, install_root=open_design_root)
    assert first["status"] == "ok"
    assert second["status"] == "ok"


def test_install_refuses_non_brand_prefixed_dir(open_design_root):
    with pytest.raises(ValueError):
        eod.install_dir_target(open_design_root, "design-systems", "default")


def test_install_refuses_file_at_target(brand_env, open_design_root):
    blocker = open_design_root / "design-systems" / "brand-acme-co"
    blocker.write_text("not a directory")
    result = _export(brand_env, install_root=open_design_root)
    assert result["status"] == "install-failed"
    assert "refusing" in result["error"]


def test_install_refuses_missing_open_design_checkout(brand_env, tmp_path):
    result = _export(brand_env, install_root=tmp_path / "not-open-design")
    assert result["status"] == "install-failed"


# ---------------------------------------------------------------------------
# Parser port sanity (against open-design's own bundled example shape)
# ---------------------------------------------------------------------------

SAMPLE_OPEN_DESIGN_MD = """# Neutral Modern

> Category: Starter
> A clean, product-oriented default.

## Color Palette & Roles
- **Background** (`#FAFAFA`): page canvas
- **Foreground** (`#111111`): text
- **Accent** (`#2F6FEB`): cobalt
- **Border** (`#E5E5E5`): dividers
"""


def test_parser_port_matches_daemon_behavior():
    parsed = eod.parse_open_design_md(SAMPLE_OPEN_DESIGN_MD)
    assert parsed["title"] == "Neutral Modern"
    assert parsed["category"] == "Starter"
    assert parsed["summary"] == "A clean, product-oriented default."
    assert parsed["swatches"] == ["#fafafa", "#e5e5e5", "#111111", "#2f6feb"]


def test_parser_port_rejects_colon_inside_bold_like_daemon():
    # Faithful-port check: the daemon's regexes fail on `- **Name:** #hex`
    # bullets (the bundled "default" system yields [] in the real daemon).
    md = "# X\n\n> Category: Y\n> Z.\n\n## C\n- **Background:** `#FAFAFA`\n"
    assert eod.od_extract_swatches(md) == []


def test_clean_title_strips_boilerplate():
    assert eod.od_clean_title("Design System Inspired by Cohere") == "Cohere"
    assert eod.od_clean_title("Neutral Modern") == "Neutral Modern"


def test_normalize_hex_expands_short_forms():
    assert eod.od_normalize_hex("#ABC") == "#aabbcc"
    assert eod.od_normalize_hex("#A1B2C3") == "#a1b2c3"
    assert eod.od_normalize_hex("not-a-hex") is None


# ---------------------------------------------------------------------------
# 3.6 — delegation to the v1 design-system bundle emitter
# ---------------------------------------------------------------------------

def _load_bds():
    import importlib.util as _u
    spec = _u.spec_from_file_location("build_design_system_bundle", _SCRIPTS / "build_design_system_bundle.py")
    mod = _u.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _load_validator():
    import importlib.util as _u
    spec = _u.spec_from_file_location("_od_manifest_validator", _SCRIPTS / "_od_manifest_validator.py")
    mod = _u.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_export_emits_manifest_valid_bundle(brand_env):
    result = _export(brand_env)
    assert result["status"] == "ok", result
    bds = _load_bds()
    validator = _load_validator()
    manifest = json.loads(
        (Path(result["out_dir"]) / "design-system" / "manifest.json").read_text()
    )
    res = validator.validate(manifest)
    assert res.ok, res.errors
    # Every manifest-referenced file exists in the bundle.
    for rel in ("DESIGN.md", "tokens.css", "components.html", "USAGE.md"):
        assert (Path(result["out_dir"]) / "design-system" / rel).is_file()


def test_export_check_runs_manifest_validator_and_roundtrip(brand_env):
    result = _export(brand_env, check=True)
    assert result["status"] == "ok", result.get("problems")
    md = (Path(result["out_dir"]) / "DESIGN.md").read_text()
    assert eod.check_export(md, "Acme") == []


def test_export_install_copies_full_bundle(brand_env, open_design_root):
    result = _export(brand_env, install_root=open_design_root)
    assert result["status"] == "ok"
    target = open_design_root / "design-systems" / "brand-acme-co"
    assert (target / "DESIGN.md").is_file()
    assert (target / "manifest.json").is_file()
    assert (target / "tokens.css").is_file()


def test_export_artifacts_invokes_packaging_when_mirror_exists(brand_env, monkeypatch):
    # Build a fake offline mirror the packager would consume.
    slug = "acme-co"
    mirror_root = brand_env["brands"] / slug / "original" / "homepage"
    mirror_root.mkdir(parents=True)
    (mirror_root / "index.html").write_text("<html><body>hi</body></html>")

    calls = []

    def fake_package(page_mirror_dir, out_dir, **kwargs):
        calls.append((str(page_mirror_dir), str(out_dir)))
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text("packaged")
        return {"dir": str(out_dir), "warnings": []}

    monkeypatch.setattr(eod, "_package_mirror_page", fake_package)

    result = _export(brand_env, artifacts=True, mirror_root=brand_env["brands"] / slug / "original")
    assert result["status"] == "ok", result
    assert calls, "packager was not invoked for the mirrored page"
    assert result.get("artifacts"), "artifact paths not recorded"


def test_export_artifacts_skips_when_mirror_absent(brand_env, monkeypatch):
    monkeypatch.setattr(eod, "_package_mirror_page",
                        lambda *a, **k: pytest.fail("should not package without a mirror"))
    result = _export(brand_env, artifacts=True)
    assert result["status"] == "ok"
