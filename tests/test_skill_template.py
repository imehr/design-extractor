"""Unit tests for templates/SKILL.md.jinja rendering."""

from pathlib import Path

import pytest
from jinja2 import ChainableUndefined, Environment, FileSystemLoader


REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = REPO_ROOT / "templates"


def _env(chainable: bool = False) -> Environment:
    kwargs = {
        "loader": FileSystemLoader(str(TEMPLATES_DIR)),
        "keep_trailing_newline": True,
    }
    if chainable:
        kwargs["undefined"] = ChainableUndefined
    return Environment(**kwargs)


def test_skill_template_renders_with_empty_context():
    # ChainableUndefined lets `brand.slug | default('unknown')` work when
    # `brand` itself is missing — this is how a truly empty context behaves
    # under a lenient renderer.
    env = _env(chainable=True)
    tmpl = env.get_template("SKILL.md.jinja")
    out = tmpl.render()
    assert "## Full reference (embedded)" in out


def test_skill_template_renders_with_populated_context():
    env = _env()
    tmpl = env.get_template("SKILL.md.jinja")
    ctx = {
        "brand": {
            "slug": "acme-com",
            "name": "Acme",
            "source_url": "https://acme.example",
            "extracted_at": "2026-04-22T00:00:00Z",
            "extractor_version": "0.3.1",
        },
        "tokens": {},
        "voice": {},
        "components": [],
        "design_md_body": "DESIGN_MD_SENTINEL_BODY",
        "tokens_json_compact": '{"color":"TOKENS_SENTINEL"}',
        "components_block": "COMPONENTS_SENTINEL_BLOCK",
    }
    out = tmpl.render(**ctx)
    assert "DESIGN_MD_SENTINEL_BODY" in out
    assert "TOKENS_SENTINEL" in out
    assert "COMPONENTS_SENTINEL_BLOCK" in out


def test_skill_template_frontmatter_name_present():
    env = _env()
    tmpl = env.get_template("SKILL.md.jinja")
    out = tmpl.render(brand={"slug": "acme-com", "name": "Acme"})

    # Locate frontmatter block
    lines = out.splitlines()
    assert lines[0] == "---", f"expected leading '---', got: {lines[0]!r}"
    name_lines = [ln for ln in lines[:20] if ln.startswith("name:")]
    assert name_lines, "no 'name:' line found in frontmatter"
    value = name_lines[0].split(":", 1)[1].strip()
    assert value, "name: value is empty"
