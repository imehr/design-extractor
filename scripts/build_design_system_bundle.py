#!/usr/bin/env python3
"""Open-Design ``od-design-system-project/v1`` design-system bundle emitter (WS3).

Produces the complete ``brands/<slug>/open-design/design-system/`` folder that
Open-Design consumes:

    manifest.json              schema-valid v1 project manifest
    DESIGN.md                  9-section canonical prose
    tokens.css                 every TOKEN_SCHEMA token, measured→fallback
    design-tokens.json         od-design-tokens/v1 token report
    tailwind-v4.css            @theme bindings derived from tokens.css
    components.html            token-only component fixture
    components.manifest.json   rebuilt component manifest (schemaVersion 1)
    USAGE.md                   agent-facing router
    preview/colors.html        static token preview pages
    preview/typography.html
    preview/spacing.html

Reuses WS2's :class:`measured_tokens.MeasuredTokens` / ``OD_FALLBACK`` and the
existing ``export_open_design`` prose generators — it never re-derives the token
mapping. The manifest is validated against the faithful port in
``_od_manifest_validator`` before the emitter reports success.
"""

from __future__ import annotations

import importlib.util as _iutil
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parent.parent
_SCRIPTS = _REPO_ROOT / "scripts"


def _load_sibling(name: str):
    spec = _iutil.spec_from_file_location(name, _SCRIPTS / f"{name}.py")
    mod = _iutil.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules.setdefault(name, mod)
    spec.loader.exec_module(mod)
    return mod


_eod = _load_sibling("export_open_design")
_mt = _load_sibling("measured_tokens")
_validator = _load_sibling("_od_manifest_validator")


# Re-exported for callers / tests.
MeasuredTokens = _mt.MeasuredTokens
OD_FALLBACK = _mt.OD_FALLBACK
TOKEN_SCHEMA: list[dict] = []  # populated by _build_token_schema() below


# ── TOKEN_SCHEMA port (packages/contracts/.../token-schema.ts) ────────────────
# Order is meaningful: surface → foreground → border → accent → semantic →
# typography(fonts) → type scale → leading/tracking → spacing → section rhythm
# → radius → elevation → focus → motion → layout.

def _build_token_schema() -> list[dict]:
    return [
        # Surface
        {"name": "--bg", "layer": "A1-identity", "description": "Page background — defines the brand canvas."},
        {"name": "--surface", "layer": "A1-identity", "description": "Card / lifted container background."},
        {"name": "--surface-warm", "layer": "B-slot", "description": "Tertiary surface tier (kami warm-sand).", "aliasTo": "var(--surface)"},
        # Foreground
        {"name": "--fg", "layer": "A1-identity", "description": "Primary text color."},
        {"name": "--fg-2", "layer": "B-slot", "description": "Secondary text tier (kami dark-warm).", "aliasTo": "var(--fg)"},
        {"name": "--muted", "layer": "A1-identity", "description": "Subtext / captions."},
        {"name": "--meta", "layer": "B-slot", "description": "Tertiary FG / metadata tier (kami stone).", "aliasTo": "var(--muted)"},
        # Border
        {"name": "--border", "layer": "A1-identity", "description": "Default border / card edge."},
        {"name": "--border-soft", "layer": "B-slot", "description": "Inner row separator that should not visually compete.", "aliasTo": "var(--border)"},
        # Accent
        {"name": "--accent", "layer": "A1-identity", "description": "Brand accent. ≤2 visible uses per screen (lint enforced)."},
        {"name": "--accent-on", "layer": "A2", "description": "FG when --accent is the bg.", "fallback": "#ffffff"},
        {"name": "--accent-hover", "layer": "A2", "description": "Hover state for elements using --accent as bg.", "fallback": "color-mix(in oklab, var(--accent), black 8%)"},
        {"name": "--accent-active", "layer": "A2", "description": "Active state for elements using --accent as bg.", "fallback": "color-mix(in oklab, var(--accent), black 14%)"},
        # Semantic
        {"name": "--success", "layer": "A2", "description": "Success state.", "fallback": "#16a34a"},
        {"name": "--warn", "layer": "A2", "description": "Warning state.", "fallback": "#eab308"},
        {"name": "--danger", "layer": "A2", "description": "Danger state.", "fallback": "#dc2626"},
        # Typography — fonts
        {"name": "--font-display", "layer": "A1-identity", "description": "Display / heading font stack."},
        {"name": "--font-body", "layer": "A1-identity", "description": "Body font stack."},
        {"name": "--font-mono", "layer": "A2", "description": "Monospace font stack — used by kbd, code, tabular metrics.", "fallback": 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace'},
        # Typography — type scale
        {"name": "--text-xs", "layer": "A1-structure", "description": "Type scale step — extra small (≈11–12px)."},
        {"name": "--text-sm", "layer": "A1-structure", "description": "Type scale step — small (≈12–14px)."},
        {"name": "--text-base", "layer": "A1-structure", "description": "Type scale step — body baseline."},
        {"name": "--text-lg", "layer": "A1-structure", "description": "Type scale step — H3 / featured body."},
        {"name": "--text-xl", "layer": "A1-structure", "description": "Type scale step — H2."},
        {"name": "--text-2xl", "layer": "A1-structure", "description": "Type scale step — section title."},
        {"name": "--text-3xl", "layer": "A1-structure", "description": "Type scale step — H1."},
        {"name": "--text-4xl", "layer": "A1-structure", "description": "Type scale step — display / hero."},
        # Typography — leading & tracking
        {"name": "--leading-body", "layer": "A1-structure", "description": "Line-height for reading body."},
        {"name": "--leading-tight", "layer": "A1-structure", "description": "Line-height for headings."},
        {"name": "--tracking-display", "layer": "A1-structure", "description": "Letter-spacing applied to display sizes."},
        # Spacing — base scale
        {"name": "--space-1", "layer": "A2", "description": "Base spacing — 4px tier.", "fallback": "4px"},
        {"name": "--space-2", "layer": "A2", "description": "Base spacing — 8px tier.", "fallback": "8px"},
        {"name": "--space-3", "layer": "A2", "description": "Base spacing — 12px tier.", "fallback": "12px"},
        {"name": "--space-4", "layer": "A2", "description": "Base spacing — 16px tier.", "fallback": "16px"},
        {"name": "--space-5", "layer": "A2", "description": "Base spacing — 20px tier.", "fallback": "20px"},
        {"name": "--space-6", "layer": "A2", "description": "Base spacing — 24px tier.", "fallback": "24px"},
        {"name": "--space-8", "layer": "A2", "description": "Base spacing — 32px tier.", "fallback": "32px"},
        {"name": "--space-12", "layer": "A2", "description": "Base spacing — 48px tier.", "fallback": "48px"},
        # Section rhythm
        {"name": "--section-y-desktop", "layer": "A1-structure", "description": "Vertical padding between sections — desktop."},
        {"name": "--section-y-tablet", "layer": "A1-structure", "description": "Vertical padding between sections — tablet."},
        {"name": "--section-y-phone", "layer": "A1-structure", "description": "Vertical padding between sections — phone."},
        # Radius
        {"name": "--radius-sm", "layer": "A2", "description": "Small radius — buttons, inputs, chips.", "fallback": "8px"},
        {"name": "--radius-md", "layer": "A2", "description": "Medium radius — cards, modals.", "fallback": "12px"},
        {"name": "--radius-lg", "layer": "A2", "description": "Large radius — featured containers.", "fallback": "16px"},
        {"name": "--radius-pill", "layer": "A2", "description": "Pill radius — avatars, badges.", "fallback": "9999px"},
        # Elevation
        {"name": "--elev-flat", "layer": "A2", "description": "No elevation.", "fallback": "none"},
        {"name": "--elev-ring", "layer": "A2", "description": "Hairline ring (1px box-shadow border).", "fallback": "0 0 0 1px var(--border)"},
        {"name": "--elev-raised", "layer": "A2", "description": "Raised surface (blur or whisper).", "fallback": "0 2px 8px color-mix(in oklab, var(--fg), transparent 92%)"},
        # Focus
        {"name": "--focus-ring", "layer": "A2", "description": "Keyboard focus indicator.", "fallback": "0 0 0 3px color-mix(in oklab, var(--accent), transparent 70%)"},
        # Motion
        {"name": "--motion-fast", "layer": "A2", "description": "Hover / micro-state duration.", "fallback": "150ms"},
        {"name": "--motion-base", "layer": "A2", "description": "General state-change duration.", "fallback": "200ms"},
        {"name": "--ease-standard", "layer": "A2", "description": "Standard easing curve.", "fallback": "cubic-bezier(0.2, 0, 0, 1)"},
        # Layout
        {"name": "--container-max", "layer": "A1-structure", "description": "Max content container width."},
        {"name": "--container-gutter-desktop", "layer": "A1-structure", "description": "Container side gutter — desktop."},
        {"name": "--container-gutter-tablet", "layer": "A1-structure", "description": "Container side gutter — tablet."},
        {"name": "--container-gutter-phone", "layer": "A1-structure", "description": "Container side gutter — phone."},
    ]


TOKEN_SCHEMA = _build_token_schema()
_SCHEMA_BY_NAME = {t["name"]: t for t in TOKEN_SCHEMA}
_TOKEN_ORDER = [t["name"] for t in TOKEN_SCHEMA]


# ── Resolution helpers ────────────────────────────────────────────────────────

def _resolve_inputs(brand_dir_or_slug, measured, data, brands_dir, library_dir, cache_dir):
    """Return (slug, data, measured_tokens, out_dir_default_root)."""
    brands_dir = Path(brands_dir) if brands_dir else _REPO_ROOT / "brands"
    library_dir = Path(library_dir) if library_dir else _eod.DEFAULT_LIBRARY_ROOT
    cache_dir = Path(cache_dir) if cache_dir else _REPO_ROOT / "cache"

    if data is not None:
        slug = str(data.get("slug") or "").strip()
    elif isinstance(brand_dir_or_slug, Path) and brand_dir_or_slug.is_dir():
        # A brand source directory was passed directly.
        root = brand_dir_or_slug
        slug = _slug_from_root(root)
        data = _data_from_root(slug, root)
    else:
        slug = str(brand_dir_or_slug)
        data = _eod.load_brand_data(slug, brands_dir, library_dir, cache_dir)

    mt = _coerce_measured(measured, cache_dir, slug)
    return slug, data, mt, brands_dir


def _slug_from_root(root: Path) -> str:
    meta = _eod._read_json(root / "metadata.json")
    if isinstance(meta, dict) and meta.get("slug"):
        return str(meta["slug"])
    return root.name


def _data_from_root(slug: str, root: Path) -> dict:
    """Minimal load_brand_data equivalent for a single source root."""
    data: dict = {
        "slug": slug, "name": None, "source_url": None, "extracted_at": None,
        "categories": [], "frontmatter": {}, "sections": {}, "tokens": None,
        "philosophy": None, "asset_dirs": [], "sources": [], "warnings": [],
    }
    meta = _eod._read_json(root / "metadata.json")
    if isinstance(meta, dict):
        data["name"] = meta.get("name")
        data["source_url"] = meta.get("source_url")
        data["extracted_at"] = meta.get("extracted_at")
        data["categories"] = meta.get("categories") or []
        data["sources"].append(str(root / "metadata.json"))
    design_md = root / "DESIGN.md"
    if design_md.is_file() and not data["sections"]:
        fm, body = _eod.split_frontmatter(design_md.read_text())
        data["frontmatter"] = fm
        data["sections"] = _eod._split_body_sections(body)
        data["sources"].append(str(design_md))
    tokens = _eod._read_json(root / "design-tokens.json")
    if isinstance(tokens, dict):
        data["tokens"] = tokens
        data["sources"].append(str(root / "design-tokens.json"))
    if not data["name"]:
        data["name"] = slug.replace("-", " ").title()
        data["warnings"].append("brand name not captured; derived from slug")
    return data


def _coerce_measured(measured, cache_dir: Path, slug: str):
    if isinstance(measured, _mt.MeasuredTokens):
        return measured
    if isinstance(measured, dict):
        return _mt.MeasuredTokens(measured)
    # Best-effort load from the publish_brand cache helper.
    try:
        pb = _load_sibling("publish_brand")
        raw = pb.load_measured_tokens(cache_dir, slug)
        return _mt.MeasuredTokens(raw or {})
    except Exception:  # noqa: BLE001 — measured tokens are an enhancement only
        return _mt.MeasuredTokens({})


# ── Token value resolution ────────────────────────────────────────────────────

# Last-resort neutral defaults for A1 tokens with no OD fallback AND no measured
# value. These are only used so the runtime contract ("every tokens.css must
# declare every A1 token") holds for brands that did not surface a value; they
# are NEVER substituted for measured data or A2 fallbacks.
_A1_IDENTITY_DEFAULTS = {
    "--bg": "#ffffff",
    "--surface": "#f5f5f5",
    "--fg": "#111111",
    "--muted": "#666666",
    "--border": "#dddddd",
    "--accent": "#0066cc",
    "--font-display": 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    "--font-body": 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
}
_A1_STRUCTURE_DEFAULTS = {
    "--text-xs": "12px", "--text-sm": "14px", "--text-base": "16px",
    "--text-lg": "18px", "--text-xl": "20px", "--text-2xl": "24px",
    "--text-3xl": "32px", "--text-4xl": "48px",
    "--leading-body": "1.6", "--leading-tight": "1.2",
    "--tracking-display": "-0.02em",
    "--section-y-desktop": "96px", "--section-y-tablet": "64px", "--section-y-phone": "48px",
    "--container-max": "1200px",
    "--container-gutter-desktop": "32px",
    "--container-gutter-tablet": "24px",
    "--container-gutter-phone": "16px",
}


def token_value(measured, name: str) -> str:
    """Measured value when present, else OD fallback, else a B-slot alias.

    Returns ``""`` only for A1 tokens with no measured value AND no fallback
    (the caller decides how to surface that gap).
    """
    spec = _SCHEMA_BY_NAME.get(name)
    if not spec:
        v = measured.value(name)
        return v if v else ""
    measured_val = measured.value(name)
    if measured_val:
        return str(measured_val)
    if spec.get("fallback"):
        return spec["fallback"]
    if spec.get("aliasTo"):
        return spec["aliasTo"]
    return ""


def _token_value_for_css(measured, name: str) -> str:
    """Like :func:`token_value` but falls back to a neutral default so the
    emitted ``:root`` always declares every required token (A1-structure layout
    tokens have no OD fallback)."""
    v = token_value(measured, name)
    if v:
        return v
    return _A1_IDENTITY_DEFAULTS.get(name) or _A1_STRUCTURE_DEFAULTS.get(name, "initial")


def token_confidence(measured, name: str) -> str:
    prov = measured.get(name)
    if isinstance(prov, dict):
        return str(prov.get("confidence") or "LOW")
    spec = _SCHEMA_BY_NAME.get(name, {})
    return "FALLBACK" if spec.get("fallback") or spec.get("aliasTo") else "MISSING"


def token_layer(name: str) -> str:
    spec = _SCHEMA_BY_NAME.get(name)
    return spec["layer"] if spec else "C-extension"


# ── Manifest ──────────────────────────────────────────────────────────────────

def build_manifest(slug: str, data: dict) -> dict:
    name = data.get("name") or slug.replace("-", " ").title()
    category = _eod.derive_category(data)
    return {
        "schemaVersion": _validator.DESIGN_SYSTEM_PROJECT_SCHEMA_VERSION,
        "id": slug,
        "name": name,
        "category": category,
        "description": (
            f"Extracted Open-Design design-system bundle for {name}, generated "
            "by design-extractor from measured computed styles and curated prose."
        ),
        "source": {"type": "bundled", "origin": "design-extractor"},
        "files": {
            "design": "DESIGN.md",
            "tokens": "tokens.css",
            "designTokens": "design-tokens.json",
            "tailwind": "tailwind-v4.css",
            "components": "components.html",
        },
        "usage": "USAGE.md",
        "componentsManifest": "components.manifest.json",
        "importMode": "normalized",
        "craft": {
            "applies": [],
            "suggested": ["color", "accessibility-baseline"],
            "exemptions": [],
        },
        "assetsDir": "assets",
        "fonts": [],
        "preview": {
            "dir": "preview",
            "pages": [
                {"path": "preview/colors.html", "role": "colors", "title": "Colors"},
                {"path": "preview/typography.html", "role": "typography", "title": "Typography"},
                {"path": "preview/spacing.html", "role": "spacing", "title": "Spacing"},
            ],
        },
    }


# ── Stub emitters (replaced in later tasks) ───────────────────────────────────

def render_tokens_css(measured) -> str:
    """Emit ``tokens.css``: one ``:root`` declaring every TOKEN_SCHEMA token in
    canonical order (surface → text → border → accent → semantic → typography →
    spacing → radius → elevation → focus → motion → layout), followed by
    site-specific Layer-C extras and a best-effort dark-mode block.

    Value precedence: measured value > OD A2 fallback (verbatim) > B-slot alias
    > neutral A1 default. Measured values always win; unmeasured A2 tokens use
    the OD fallback byte-for-byte.
    """
    lines = [":root {"]
    for spec in TOKEN_SCHEMA:
        lines.append(f"  {spec['name']}: {_token_value_for_css(measured, spec['name'])};")
    for name, value in _site_specific_extras(measured):
        lines.append(f"  {name}: {value};")
    lines.append("}")
    lines.append("")
    lines.append('[data-theme="dark"] {')
    lines.append("  /* Best-effort dark-mode overrides — no measured dark palette. */")
    lines.append("}")
    return "\n".join(lines) + "\n"


def _site_specific_extras(measured) -> list[tuple[str, str]]:
    """Measured tokens not in TOKEN_SCHEMA (Layer C extensions), sorted by name."""
    extras: list[tuple[str, str]] = []
    for name, prov in measured.to_dict().items():
        if name in _SCHEMA_BY_NAME:
            continue
        value = prov.get("value") if isinstance(prov, dict) else None
        if value:
            extras.append((name, str(value)))
    extras.sort(key=lambda kv: kv[0])
    return extras


def render_design_tokens_json(measured, *, generated_at: str = "") -> str:  # 3.3
    return json.dumps({"format": "od-design-tokens/v1", "tokens": []}, indent=2) + "\n"


def render_components_html(data: dict, measured) -> str:  # 3.4
    return "<!doctype html>\n<title>components stub</title>\n"


def render_components_manifest_json(brand_id: str, fixture_html: str, tokens_css: str) -> str:  # 3.4
    return json.dumps({"schemaVersion": 1, "brandId": brand_id}, indent=2) + "\n"


def render_tailwind_v4_css(declared_names) -> str:  # 3.4
    return "/* tailwind-v4.css stub — populated in task 3.4 */\n"


def render_design_md(data: dict, measured) -> str:  # 3.5
    return _eod.render_design_md(data)


def render_usage_md(slug: str, data: dict, measured) -> str:  # 3.5
    return f"# Usage\n\nOpen-Design design-system bundle for `{slug}`.\n"


def render_preview_colors(measured) -> str:  # 3.5
    return "<!doctype html>\n<title>colors stub</title>\n"


def render_preview_typography(measured) -> str:  # 3.5
    return "<!doctype html>\n<title>typography stub</title>\n"


def render_preview_spacing(measured) -> str:  # 3.5
    return "<!doctype html>\n<title>spacing stub</title>\n"


# ── Public entry point ────────────────────────────────────────────────────────

def build(brand_dir_or_slug, *, out_dir=None, measured=None, data=None,
          brands_dir=None, library_dir=None, cache_dir=None) -> Path:
    """Emit the complete v1 design-system bundle. Returns the bundle directory."""
    slug, data, mt, brands_dir = _resolve_inputs(
        brand_dir_or_slug, measured, data, brands_dir, library_dir, cache_dir
    )

    if out_dir is None:
        out_dir = brands_dir / slug / "open-design" / "design-system"
    bundle = Path(out_dir)
    bundle.mkdir(parents=True, exist_ok=True)
    (bundle / "preview").mkdir(parents=True, exist_ok=True)

    # 1) manifest (source of truth for every referenced path)
    manifest = build_manifest(slug, data)

    # 2) content files (stubs in 3.1; real implementations filled in later tasks)
    tokens_css = render_tokens_css(mt)
    components_html = render_components_html(data, mt)

    (bundle / "DESIGN.md").write_text(render_design_md(data, mt))
    (bundle / "tokens.css").write_text(tokens_css)
    (bundle / "design-tokens.json").write_text(
        render_design_tokens_json(mt, generated_at=datetime.now(timezone.utc).isoformat())
    )
    (bundle / "tailwind-v4.css").write_text(render_tailwind_v4_css(_TOKEN_ORDER))
    (bundle / "components.html").write_text(components_html)
    (bundle / "components.manifest.json").write_text(
        render_components_manifest_json(slug, components_html, tokens_css)
    )
    (bundle / "USAGE.md").write_text(render_usage_md(slug, data, mt))
    (bundle / "preview" / "colors.html").write_text(render_preview_colors(mt))
    (bundle / "preview" / "typography.html").write_text(render_preview_typography(mt))
    (bundle / "preview" / "spacing.html").write_text(render_preview_spacing(mt))

    # 3) write + validate the manifest last so it always reflects the bundle.
    (bundle / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    res = _validator.validate(manifest)
    if not res.ok:
        raise ValueError(
            "emitted manifest failed v1 validation: " + "; ".join(res.errors)
        )
    return bundle
