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
import re
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


def render_design_tokens_json(measured, *, generated_at: str = "") -> str:
    """Port of ``renderDesignTokensJson`` → ``od-design-tokens/v1`` JSON.

    One entry per declared schema token with the OD-inferred ``type``, plus a
    summary rubric graded on measured A1 coverage.
    """
    import json as _json

    bindings = [_token_binding(measured, spec) for spec in TOKEN_SCHEMA]
    for name, value in _site_specific_extras(measured):
        spec = {"name": name, "layer": "C-extension"}
        bindings.append(_token_binding(measured, spec))

    report = {
        "schemaVersion": 1,
        "format": "od-design-tokens/v1",
        "contract": "TOKEN_SCHEMA",
        "generatedAt": generated_at,
        "source": {
            "tokensCss": "tokens.css",
            "tokenContractReport": "source/token-contract.report.json",
        },
        "summary": _summarize(measured),
        "tokens": [
            {
                "name": b["name"],
                "value": b["value"],
                "type": infer_design_token_type(b["name"]),
                "layer": b["layer"],
                "confidence": b["confidence"],
                "reason": b["reason"],
                "sources": b["sources"],
                **({"sourceName": b["sourceName"]} if b.get("sourceName") else {}),
            }
            for b in bindings
        ],
    }
    return _json.dumps(report, indent=2) + "\n"


# Exact color-name set from inferDesignTokenType (derived-token-outputs.ts).
_DESIGN_TOKEN_COLOR_NAMES = frozenset({
    "--bg", "--surface", "--surface-warm", "--fg", "--fg-2", "--muted", "--meta",
    "--border", "--border-soft", "--accent", "--accent-on", "--accent-hover",
    "--accent-active", "--success", "--warn", "--danger",
})


def infer_design_token_type(name: str) -> str:
    """Byte-faithful port of ``inferDesignTokenType`` (derived-token-outputs.ts)."""
    if name in _DESIGN_TOKEN_COLOR_NAMES:
        return "color"
    if name.startswith("--font-"):
        return "fontFamily"
    if name.startswith("--leading-"):
        return "number"
    if name == "--ease-standard":
        return "cubicBezier"
    if name.startswith("--motion-"):
        return "duration"
    if name.startswith("--elev-") or name == "--focus-ring":
        return "shadow"
    if (name.startswith("--text-") or name.startswith("--space-")
            or name.startswith("--section-y-") or name.startswith("--radius-")
            or name.startswith("--container-") or name.startswith("--tracking-")):
        return "dimension"
    return "other"


def _is_measured(measured, name: str) -> bool:
    prov = measured.get(name)
    if not isinstance(prov, dict):
        return False
    return bool(prov.get("sources")) or int(prov.get("count") or 0) > 0


def _token_binding(measured, spec: dict) -> dict:
    name = spec["name"]
    layer = spec.get("layer") or token_layer(name)
    prov = measured.get(name)
    measured_val = measured.value(name)

    if measured_val and _is_measured(measured, name):
        sources = list(prov.get("sources") or []) if isinstance(prov, dict) else []
        confidence = str((prov or {}).get("confidence") or "LOW") if isinstance(prov, dict) else "LOW"
        count = int((prov or {}).get("count") or 0) if isinstance(prov, dict) else 0
        reason = f"measured from {count} computed-style sample(s)"
        binding = {"name": name, "value": str(measured_val), "layer": layer,
                   "confidence": confidence, "reason": reason, "sources": sources}
        if isinstance(prov, dict) and len(sources) == 1 and prov.get("sourceName"):
            binding["sourceName"] = str(prov["sourceName"])
        return binding

    schema = _SCHEMA_BY_NAME.get(name) or {}
    if schema.get("fallback"):
        return {"name": name, "value": schema["fallback"], "layer": layer,
                "confidence": "FALLBACK",
                "reason": "OD A2 fallback (token not measured)", "sources": []}
    if schema.get("aliasTo"):
        return {"name": name, "value": schema["aliasTo"], "layer": layer,
                "confidence": "ALIAS",
                "reason": f"B-slot alias to {schema['aliasTo']}", "sources": []}
    if name in _A1_IDENTITY_DEFAULTS or name in _A1_STRUCTURE_DEFAULTS:
        return {"name": name, "value": _token_value_for_css(measured, name),
                "layer": layer, "confidence": "DEFAULT",
                "reason": "neutral default (token not captured)", "sources": []}
    # C-extension or unknown without provenance.
    return {"name": name, "value": str(measured_val or ""), "layer": layer,
            "confidence": "MISSING", "reason": "no value available", "sources": []}


def _summarize(measured) -> dict:
    required = [t for t in TOKEN_SCHEMA if t["layer"].startswith("A1")]
    layer_counts: dict[str, int] = {}
    for t in TOKEN_SCHEMA:
        layer_counts[t["layer"]] = layer_counts.get(t["layer"], 0) + 1
    measured_required = sum(1 for t in required if _is_measured(measured, t["name"]))
    ratio = measured_required / len(required) if required else 0.0
    score = round(ratio, 2)
    if ratio >= 0.9:
        grade = "A"
    elif ratio >= 0.75:
        grade = "B"
    elif ratio >= 0.5:
        grade = "C"
    elif ratio >= 0.25:
        grade = "D"
    else:
        grade = "F"
    return {
        "totalTokens": len(TOKEN_SCHEMA),
        "declaredTokens": len(TOKEN_SCHEMA),
        "layerCounts": layer_counts,
        "score": score,
        "grade": grade,
        "recommendRebuild": False,
    }


def render_components_html(data: dict, measured) -> str:  # 3.4
    return _render_components_html(data, measured)


# ── components.manifest.json — faithful port of components-manifest.ts ────────

COMPONENTS_MANIFEST_SCHEMA_VERSION = 1

COMPONENT_GROUPS: list[dict] = [
    {"id": "buttons", "label": "Buttons and calls to action",
     "selectors": [r"\bbutton\b", r"\.btn(?:\b|[-_:])", r"\[type=[\"\x27]?(?:button|submit|reset)"],
     "classes": [r"^btn(?:$|-)", r"button", r"cta"],
     "elements": [r"^button$"]},
    {"id": "inputs", "label": "Form fields and controls",
     "selectors": [r"\binput\b", r"\btextarea\b", r"\bselect\b", r"\.field(?:\b|[-_:])", r"\blabel\b"],
     "classes": [r"^field(?:$|-)", r"input", r"control", r"form"],
     "elements": [r"^(input|textarea|select|label|form)$"]},
    {"id": "cards", "label": "Cards and panels",
     "selectors": [r"\.card(?:\b|[-_:])", r"\.panel(?:\b|[-_:])", r"\.tile(?:\b|[-_:])"],
     "classes": [r"^card(?:$|-)", r"^panel(?:$|-)", r"^tile(?:$|-)"],
     "elements": []},
    {"id": "badges", "label": "Badges, chips, and status labels",
     "selectors": [r"\.badge(?:\b|[-_:])", r"\.chip(?:\b|[-_:])", r"\.tag(?:\b|[-_:])", r"\.pill(?:\b|[-_:])"],
     "classes": [r"^badge(?:$|-)", r"^chip(?:$|-)", r"^tag(?:$|-)", r"^pill(?:$|-)", r"status"],
     "elements": []},
    {"id": "links", "label": "Links and inline actions",
     "selectors": [r"\ba\b", r"\.link(?:\b|[-_:])"],
     "classes": [r"^link(?:$|-)"],
     "elements": [r"^a$"]},
    {"id": "keyboard", "label": "Keyboard hints",
     "selectors": [r"\bkbd\b", r"\.kbd(?:\b|[-_:])"],
     "classes": [r"^kbd(?:$|-)", r"keyboard", r"shortcut"],
     "elements": [r"^kbd$"]},
    {"id": "icons", "label": "Icon slots",
     "selectors": [r"\.icon(?:\b|[-_:])", r"\[aria-hidden=[\"\x27]true[\"\x27]\]"],
     "classes": [r"^icon(?:$|-)"],
     "elements": [r"^svg$"]},
    {"id": "typography", "label": "Typography scale and text utilities",
     "selectors": [r"\bh[1-6]\b", r"\.lead(?:\b|[-_:])", r"\.eyebrow(?:\b|[-_:])", r"\.body-(?:muted|sm|small)\b"],
     "classes": [r"^lead$", r"^eyebrow$", r"^body-(?:muted|sm|small)$", r"caption"],
     "elements": [r"^h[1-6]$", r"^p$"]},
    {"id": "layout", "label": "Layout primitives",
     "selectors": [r"\.container(?:\b|[-_:])", r"\.stack-\d+\b", r"\.row-(?:between|center|start|end)\b",
                   r"\bsection\b", r"\bmain\b", r"\bnav\b"],
     "classes": [r"^container$", r"^stack-\d+$", r"^row-(?:between|center|start|end)$", r"grid", r"layout"],
     "elements": [r"^(main|section|nav|header|footer)$"]},
]


def _ci(pattern: str):
    return re.compile(pattern, re.IGNORECASE)


for _g in COMPONENT_GROUPS:
    _g["_selector_re"] = [_ci(p) for p in _g["selectors"]]
    _g["_class_re"] = [_ci(p) for p in _g["classes"]]
    _g["_element_re"] = [_ci(p) for p in _g["elements"]]


def extract_components_manifest(brand_id: str, fixture_html: str, tokens_css: str) -> dict:
    """Faithful port of ``extractComponentsManifest`` (components-manifest.ts)."""
    style_blocks = _extract_style_blocks(fixture_html)
    css = "\n\n".join(style_blocks)
    selectors = _extract_css_selectors(css)
    selector_token_references = _extract_selector_token_references(css)
    classes = _extract_html_classes(fixture_html)
    elements = _extract_html_elements(fixture_html)
    declared_tokens = _parse_token_names(tokens_css or _extract_first_root_body(css) or "")
    referenced_tokens = _extract_token_references(fixture_html)

    groups = []
    for definition in COMPONENT_GROUPS:
        groups.append(_build_group_manifest(definition, {
            "selectors": selectors,
            "selectorTokenReferences": selector_token_references,
            "classes": classes,
            "elements": elements,
            "referencedTokens": referenced_tokens,
        }))

    return {
        "schemaVersion": COMPONENTS_MANIFEST_SCHEMA_VERSION,
        "brandId": brand_id,
        "source": ({"componentsHtml": "components.html", "tokensCss": "tokens.css"}
                   if tokens_css else {"componentsHtml": "components.html"}),
        "fixture": {
            **_optional_text("title", _extract_title(fixture_html)),
            **_optional_text("description", _extract_meta_description(fixture_html)),
            "styleBlockCount": len(style_blocks),
            "selectorCount": len(selectors),
            "classCount": len(classes),
            "elementCount": len(elements),
        },
        "tokens": {
            "declared": declared_tokens,
            "referenced": referenced_tokens,
            "unusedDeclared": [t for t in declared_tokens if t not in referenced_tokens],
            "undeclaredReferenced": ([] if not declared_tokens
                                     else [t for t in referenced_tokens if t not in declared_tokens]),
        },
        "selectors": selectors,
        "classes": classes,
        "elements": elements,
        "groups": groups,
        "literals": _count_literals(_strip_root_blocks(_strip_css_comments(css))),
    }


def render_components_manifest_json(brand_id: str, fixture_html: str, tokens_css: str) -> str:
    return json.dumps(extract_components_manifest(brand_id, fixture_html, tokens_css), indent=2) + "\n"


def _build_group_manifest(definition, inventory) -> dict:
    sel_matchers = definition["_selector_re"]
    cls_matchers = definition["_class_re"]
    el_matchers = definition["_element_re"]

    selectors = [s for s in inventory["selectors"]
                 if any(rx.search(s) for rx in sel_matchers)]
    classes = [c for c in inventory["classes"]
               if any(rx.search(c) for rx in cls_matchers)]
    elements = [e for e in inventory["elements"]
                if any(rx.search(e) for rx in el_matchers)]
    token_refs = _unique_sorted(
        ref for sel in selectors for ref in inventory["selectorTokenReferences"].get(sel, [])
    )
    return {
        "id": definition["id"],
        "label": definition["label"],
        "present": bool(selectors or classes or elements),
        "selectors": selectors,
        "classes": classes,
        "elements": elements,
        "tokenReferences": [t for t in token_refs if t in inventory["referencedTokens"]],
    }


def _extract_style_blocks(html: str) -> list[str]:
    blocks: list[str] = []
    for m in re.finditer(r"<style\b[^>]*>([\s\S]*?)</style>", html, re.IGNORECASE):
        blocks.append((m.group(1) or "").strip())
    return blocks


def _extract_css_selectors(css: str) -> list[str]:
    selectors: set[str] = set()
    commentless = _strip_container_at_rule_headers(_strip_css_comments(css))
    for m in re.finditer(r"(?:^|[{}])\s*([^@{}][^{}]*?)\s*\{", commentless):
        raw = (m.group(1) or "").strip()
        if not raw:
            continue
        if ":root" in raw:
            continue
        if re.match(r"^(?:from|to|\d+(?:\.\d+)?%)$", raw, re.IGNORECASE):
            continue
        for sel in _split_selector_list(raw):
            norm = _normalize_selector(sel)
            if norm and not norm.startswith("@"):
                selectors.add(norm)
    return sorted(selectors)


def _extract_selector_token_references(css: str) -> dict[str, list[str]]:
    by_selector: dict[str, set[str]] = {}
    commentless = _strip_container_at_rule_headers(_strip_css_comments(css))
    for m in re.finditer(r"(?:^|[{}])\s*([^@{}][^{}]*?)\s*\{([^{}]*)\}", commentless):
        raw = (m.group(1) or "").strip()
        body = m.group(2) or ""
        if not raw or ":root" in raw:
            continue
        if re.match(r"^(?:from|to|\d+(?:\.\d+)?%)$", raw, re.IGNORECASE):
            continue
        refs = _extract_token_references(body)
        if not refs:
            continue
        for sel in _split_selector_list(raw):
            norm = _normalize_selector(sel)
            if not norm or norm.startswith("@"):
                continue
            bucket = by_selector.setdefault(norm, set())
            for r in refs:
                bucket.add(r)
    return {sel: sorted(refs) for sel, refs in sorted(by_selector.items())}


def _split_selector_list(selector_list: str) -> list[str]:
    selectors: list[str] = []
    depth = 0
    start = 0
    for i, ch in enumerate(selector_list):
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth = max(0, depth - 1)
        elif ch == "," and depth == 0:
            selectors.append(selector_list[start:i])
            start = i + 1
    selectors.append(selector_list[start:])
    return selectors


def _normalize_selector(selector: str) -> str:
    return re.sub(r"\s+", " ", selector.strip())


def _extract_html_classes(html: str) -> list[str]:
    classes: set[str] = set()
    for m in re.finditer(r"\bclass\s*=\s*([\"\x27])(.*?)\1", html, re.IGNORECASE | re.DOTALL):
        for cn in (m.group(2) or "").split():
            if cn:
                classes.add(cn)
    return sorted(classes)


def _extract_html_elements(html: str) -> list[str]:
    elements: set[str] = set()
    for m in re.finditer(r"<\s*([a-z][a-z0-9-]*)\b", html, re.IGNORECASE):
        el = (m.group(1) or "").lower()
        if el and not el.startswith("!"):
            elements.add(el)
    return sorted(elements)


def _parse_token_names(css: str) -> list[str]:
    tokens: set[str] = set()
    for m in re.finditer(r"(--[a-zA-Z0-9_-]+)\s*:", _strip_css_comments(css)):
        tokens.add(m.group(1))
    return sorted(tokens)


def _extract_token_references(source: str) -> list[str]:
    tokens: set[str] = set()
    for m in re.finditer(r"var\(\s*(--[a-zA-Z0-9_-]+)", source):
        tokens.add(m.group(1))
    return sorted(tokens)


def _extract_first_root_body(css: str):
    m = re.search(r":root(?!\[)\s*\{([\s\S]*?)\}", _strip_css_comments(css))
    return m.group(1) if m else None


def _strip_root_blocks(css: str) -> str:
    return re.sub(r":root(?:\[[^\]]+\])?\s*\{[\s\S]*?\}", "", css)


def _strip_css_comments(css: str) -> str:
    return re.sub(r"/\*[\s\S]*?\*/", "", css)


def _strip_container_at_rule_headers(css: str) -> str:
    return re.sub(r"@(media|supports|container|layer)\b[^{]*\{", "{", css, flags=re.IGNORECASE)


def _count_literals(css: str) -> dict:
    return {
        "colorExpressions": _count_matches(
            css, r"(?:#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|color-mix\([^)]*\))",
            re.IGNORECASE),
        "pixelValues": _count_matches(css, r"(?<![\w-])-?\d*\.?\d+px\b"),
        "hardcodedFontFamilies": _count_matches(css, r"\bfont-family\s*:\s*(?!var\()", re.IGNORECASE),
    }


def _count_matches(source: str, pattern, flags: int = 0) -> int:
    return len(re.findall(pattern, source, flags))


def _unique_sorted(values) -> list[str]:
    return sorted(set(values))


def _extract_title(html: str):
    m = re.search(r"<title\b[^>]*>([\s\S]*?)</title>", html, re.IGNORECASE)
    if not m:
        return None
    value = re.sub(r"\s+", " ", (m.group(1) or "").strip())
    return _decode_basic_entities(value) if value else None


def _extract_meta_description(html: str):
    m = re.search(
        r"<meta\b(?=[^>]*\bname\s*=\s*[\"']description[\"'])(?=[^>]*\bcontent\s*=\s*([\"'])([\s\S]*?)\1)[^>]*>",
        html, re.IGNORECASE)
    if not m:
        return None
    value = re.sub(r"\s+", " ", (m.group(2) or "").strip())
    return _decode_basic_entities(value) if value else None


def _decode_basic_entities(value: str) -> str:
    return (value.replace("&quot;", '"').replace("&#39;", "'").replace("&amp;", "&")
            .replace("&lt;", "<").replace("&gt;", ">"))


def _optional_text(key: str, value):
    return {key: value} if value is not None else {}


# ── tailwind-v4.css — port of renderTailwindV4Css + TAILWIND_V4_THEME_BINDINGS ─

TAILWIND_V4_THEME_BINDINGS: list[tuple[str, str]] = [
    ("--color-bg", "--bg"), ("--color-surface", "--surface"), ("--color-surface-warm", "--surface-warm"),
    ("--color-fg", "--fg"), ("--color-fg-2", "--fg-2"), ("--color-muted", "--muted"),
    ("--color-meta", "--meta"), ("--color-border", "--border"), ("--color-border-soft", "--border-soft"),
    ("--color-accent", "--accent"), ("--color-accent-on", "--accent-on"),
    ("--color-accent-hover", "--accent-hover"), ("--color-accent-active", "--accent-active"),
    ("--color-success", "--success"), ("--color-warn", "--warn"), ("--color-danger", "--danger"),
    ("--font-display", "--font-display"), ("--font-body", "--font-body"),
    ("--font-sans", "--font-body"), ("--font-mono", "--font-mono"),
    ("--text-xs", "--text-xs"), ("--text-sm", "--text-sm"), ("--text-base", "--text-base"),
    ("--text-lg", "--text-lg"), ("--text-xl", "--text-xl"), ("--text-2xl", "--text-2xl"),
    ("--text-3xl", "--text-3xl"), ("--text-4xl", "--text-4xl"),
    ("--leading-body", "--leading-body"), ("--leading-tight", "--leading-tight"),
    ("--tracking-display", "--tracking-display"),
    ("--spacing-1", "--space-1"), ("--spacing-2", "--space-2"), ("--spacing-3", "--space-3"),
    ("--spacing-4", "--space-4"), ("--spacing-5", "--space-5"), ("--spacing-6", "--space-6"),
    ("--spacing-8", "--space-8"), ("--spacing-12", "--space-12"),
    ("--spacing-section-desktop", "--section-y-desktop"),
    ("--spacing-section-tablet", "--section-y-tablet"),
    ("--spacing-section-phone", "--section-y-phone"),
    ("--radius-sm", "--radius-sm"), ("--radius-md", "--radius-md"),
    ("--radius-lg", "--radius-lg"), ("--radius-pill", "--radius-pill"),
    ("--shadow-flat", "--elev-flat"), ("--shadow-ring", "--elev-ring"),
    ("--shadow-raised", "--elev-raised"), ("--shadow-focus-ring", "--focus-ring"),
    ("--duration-fast", "--motion-fast"), ("--duration-base", "--motion-base"),
    ("--ease-standard", "--ease-standard"),
    ("--container-max", "--container-max"),
    ("--spacing-container-desktop", "--container-gutter-desktop"),
    ("--spacing-container-tablet", "--container-gutter-tablet"),
    ("--spacing-container-phone", "--container-gutter-phone"),
]


def render_tailwind_v4_css(declared_names) -> str:
    """Port of ``renderTailwindV4Css``. Emits ``@theme`` bindings for every
    declared OD token."""
    declared = set(declared_names)
    lines = [
        "/* Derived from tokens.css. Keep tokens.css as the source of truth. */",
        '@import "tailwindcss";',
        '@import "./tokens.css";',
        "",
        "@theme {",
    ]
    for tw_name, od_token in TAILWIND_V4_THEME_BINDINGS:
        if od_token in declared:
            lines.append(f"  {tw_name}: var({od_token});")
    lines += ["}", ""]
    return "\n".join(lines)


# ── components.html fixture ───────────────────────────────────────────────────

_COMPONENT_CSS = """
    /* Buttons */
    .btn { background: var(--accent); color: var(--accent-on); border-radius: var(--radius-md);
           padding: var(--space-2) var(--space-4); font-family: var(--font-body);
           font-size: var(--text-base); box-shadow: var(--elev-ring);
           transition: background var(--motion-fast) var(--ease-standard); }
    .btn:hover { background: var(--accent-hover); }
    .btn:active { background: var(--accent-active); }
    .btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    button[type="submit"] { font-family: var(--font-body); }
    /* Inputs */
    .field { background: var(--surface); color: var(--fg); border-radius: var(--radius-sm);
             padding: var(--space-2) var(--space-3); box-shadow: var(--elev-ring);
             font-family: var(--font-body); font-size: var(--text-base); }
    input, textarea, select { font-family: var(--font-body); color: var(--fg); }
    label { color: var(--muted); font-size: var(--text-sm); }
    /* Cards */
    .card { background: var(--surface); border-radius: var(--radius-lg); padding: var(--space-4);
            box-shadow: var(--elev-raised); }
    .card-title { color: var(--fg); font-family: var(--font-display); font-size: var(--text-lg); }
    /* Badges */
    .badge, .tag { background: var(--accent); color: var(--accent-on);
                   border-radius: var(--radius-pill); padding: var(--space-1) var(--space-2);
                   font-size: var(--text-xs); }
    .badge--success { background: var(--success); color: var(--accent-on); }
    /* Links */
    a, .link { color: var(--accent); text-decoration: underline; }
    a:hover { color: var(--accent-hover); }
    /* Keyboard */
    kbd, .kbd { font-family: var(--font-mono); background: var(--surface); color: var(--fg);
                border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2);
                box-shadow: var(--elev-ring); }
    /* Icons */
    .icon[aria-hidden="true"] { color: var(--muted); }
    /* Typography */
    h1, h2, h3 { font-family: var(--font-display); color: var(--fg); }
    h1 { font-size: var(--text-3xl); }
    h2 { font-size: var(--text-2xl); }
    h3 { font-size: var(--text-lg); }
    p { font-family: var(--font-body); color: var(--fg); font-size: var(--text-base); }
    .body-muted { color: var(--muted); font-size: var(--text-sm); }
    .lead { color: var(--fg); font-size: var(--text-lg); }
    /* Layout */
    .container { max-width: var(--container-max); margin-inline: auto;
                 padding-inline: var(--container-gutter-desktop); }
    .stack-4 { display: flex; flex-direction: column; gap: var(--space-4); }
    .row-between { display: flex; justify-content: space-between; align-items: center;
                   gap: var(--space-3); }
    section { padding-block: var(--section-y-desktop); }
    header, footer, nav { background: var(--surface); box-shadow: var(--elev-ring); }
"""


def _render_components_html(data: dict, measured) -> str:
    name = data.get("name") or "brand"
    root_css = render_tokens_css(measured)
    root_block = root_css.split("}")[0] + "}"  # just the :root { ... } block
    body = (
        f'  <header class="container row-between">\n'
        f'    <a class="link" href="#">{name}</a>\n'
        f'    <nav><a class="link" href="#">Home</a></nav>\n'
        f'  </header>\n'
        f'  <section class="container stack-4">\n'
        f'    <h1>Components</h1>\n'
        f'    <p class="lead">Token-only fixture.</p>\n'
        f'    <button class="btn" type="submit">Action</button>\n'
        f'    <label class="field-label">Email\n'
        f'      <input class="field" type="email" />\n'
        f'    </label>\n'
        f'    <div class="card">\n'
        f'      <h2 class="card-title">Card</h2>\n'
        f'      <p class="body-muted">Body text.</p>\n'
        f'      <span class="badge">New</span>\n'
        f'      <kbd class="kbd">⌘K</kbd>\n'
        f'      <svg class="icon" aria-hidden="true" viewBox="0 0 16 16"></svg>\n'
        f'    </div>\n'
        f'  </section>\n'
        f'  <footer class="container"><p class="body-muted">{name}</p></footer>\n'
    )
    return (
        "<!doctype html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '  <meta charset="utf-8">\n'
        f'  <meta name="description" content="Token-only component fixture for {name} (every value is a var() reference).">\n'
        f"  <title>{name} components</title>\n"
        "  <style>\n"
        f"{root_block}\n"
        f"{_COMPONENT_CSS}\n"
        "  </style>\n"
        "</head>\n"
        "<body>\n"
        f"{body}"
        "</body>\n"
        "</html>\n"
    )


def render_design_md(data: dict, measured) -> str:
    """DESIGN.md with the 9 canonical numbered headings, a ``:root{}`` token
    block, the ``Display:/Body:/Mono:`` catalog labels, and the dark-mode
    override pattern. Reuses the WS prose renderers from ``export_open_design``.
    """
    palette = _eod.derive_palette(data)
    category = _eod.derive_category(data)
    name = data.get("name") or (data.get("slug") or "brand").replace("-", " ").title()
    summary = _eod.render_summary(data, palette)

    # The prose :root reflects the real brand: measured identity colors, else
    # palette-derived values (never the generic A1 placeholder hexes that would
    # otherwise pollute the daemon's swatch extraction).
    md_measured = _enrich_measured_from_palette(measured, palette)
    root_block = _root_block_for_md(md_measured)
    parts = [f"# {name}", "", f"> Category: {category}", f"> {summary}", ""]

    parts += [f"## 1. {CANONICAL_SECTIONS[0]}", "", _eod._render_theme(data), ""]
    parts += [f"## 2. {CANONICAL_SECTIONS[1]}", "", _eod._render_palette(palette), "",
              "Token roots (measured value, else OD A2 fallback):", "", "```css",
              root_block, "```", ""]
    parts += [f"## 3. {CANONICAL_SECTIONS[2]}", "", _eod._render_typography(data), "",
              "Font labels for catalog extraction:", "",
              f"Display: {_font_label(md_measured, '--font-display')}",
              f"Body: {_font_label(md_measured, '--font-body')}",
              f"Mono: {_font_label(md_measured, '--font-mono')}", ""]
    parts += [f"## 4. {CANONICAL_SECTIONS[3]}", "", _render_spacing_section(md_measured), ""]
    parts += [f"## 5. {CANONICAL_SECTIONS[4]}", "", _eod._render_layout(data), ""]
    parts += [f"## 6. {CANONICAL_SECTIONS[5]}", "", _eod._render_components(data), ""]
    parts += [f"## 7. {CANONICAL_SECTIONS[6]}", "", _render_motion_section(md_measured), ""]
    parts += [f"## 8. {CANONICAL_SECTIONS[7]}", "", _render_voice_section(data, palette), ""]
    parts += [f"## 9. {CANONICAL_SECTIONS[8]}", "", _render_antipatterns_section(data, palette), ""]
    return "\n".join(parts).rstrip() + "\n"


def _enrich_measured_from_palette(measured, palette):
    """Return a MeasuredTokens copy where unmeasured A1 identity colors are
    filled from the derived palette so the DESIGN.md ``:root`` carries the real
    brand colors instead of generic placeholder hexes."""
    enriched = dict(measured.to_dict())
    pal = {n.lower(): v for n, v, _ in palette}
    palette_map = {
        "--bg": ["background", "page background", "canvas", "surface"],
        "--surface": ["muted surface", "surface", "background"],
        "--fg": ["text", "foreground", "ink"],
        "--muted": ["muted", "secondary"],
        "--border": ["border", "divider"],
        "--accent": ["primary", "accent", "brand"],
    }
    for token, names in palette_map.items():
        if measured.value(token):
            continue
        for nm in names:
            if nm in pal:
                enriched[token] = {"value": pal[nm], "sources": ["palette"],
                                   "confidence": "DERIVED", "count": 1}
                break
    return MeasuredTokens(enriched)


CANONICAL_SECTIONS = [
    "Visual Theme & Atmosphere", "Color", "Typography", "Spacing",
    "Layout & Composition", "Components", "Motion & Interaction",
    "Voice & Brand", "Anti-patterns",
]


def _root_block_for_md(measured) -> str:
    """The full ``tokens.css`` (``:root`` + ``[data-theme="dark"]``) so DESIGN.md
    carries the required dark-mode override pattern alongside the token roots."""
    return render_tokens_css(measured).rstrip()


def _font_label(measured, name: str) -> str:
    return token_value(measured, name) or _A1_IDENTITY_DEFAULTS.get(name, "")


def _render_spacing_section(measured) -> str:
    rows = ["| Token | Value |", "|-------|-------|"]
    for n in ("--space-1", "--space-2", "--space-3", "--space-4",
              "--space-5", "--space-6", "--space-8", "--space-12"):
        rows.append(f"| `{n}` | `{token_value(measured, n)}` |")
    rows.append("")
    rows.append("Section rhythm: "
                f"desktop `{token_value(measured, '--section-y-desktop')}`, "
                f"tablet `{token_value(measured, '--section-y-tablet')}`, "
                f"phone `{token_value(measured, '--section-y-phone')}`.")
    return "\n".join(rows)


def _render_motion_section(measured) -> str:
    lines = [
        f"- Fast duration: `{token_value(measured, '--motion-fast')}`",
        f"- Base duration: `{token_value(measured, '--motion-base')}`",
        f"- Standard easing: `{token_value(measured, '--ease-standard')}`",
    ]
    return "\n".join(lines)


def _render_voice_section(data: dict, palette) -> str:
    phil = _eod._philosophy_line(data)
    if phil:
        return phil
    accent = next((v for n, v, _ in palette if n.lower() in ("primary", "accent")), None)
    if accent:
        return f"Brand voice is anchored by the primary accent `{accent}`. " \
               "Keep copy direct and grounded in the measured visual identity."
    return "Voice narrative was not captured; rely on the measured palette and typography."


def _render_antipatterns_section(data: dict, palette) -> str:
    # Do/Don't pairs belong with anti-patterns; reuse the full ✅/❌ renderer so
    # the guidance survives verbatim.
    return _eod._render_dos_donts(data, palette)


# ── USAGE.md ──────────────────────────────────────────────────────────────────

def render_usage_md(slug: str, data: dict, measured) -> str:
    name = data.get("name") or slug
    return (
        f"# {name} — Open-Design usage router\n\n"
        f"This folder is an `od-design-system-project/v1` bundle. Read it in this order:\n\n"
        "1. **`DESIGN.md`** — the prose source for agent prompts (9 canonical sections).\n"
        "2. **`tokens.css`** — every `TOKEN_SCHEMA` token with a measured value or OD fallback.\n"
        "3. **`design-tokens.json`** — typed token report (`od-design-tokens/v1`) with confidence.\n"
        "4. **`components.html`** — token-only component fixture (every value is a `var()` ref).\n"
        "5. **`components.manifest.json`** — rebuilt component inventory (schemaVersion 1).\n"
        "6. **`tailwind-v4.css`** — `@theme` bindings derived from `tokens.css`.\n"
        "7. **`preview/`** — static color/typography/spacing preview pages.\n\n"
        "## When to use\n\n"
        f"- Apply this bundle when the user asks for the **{name}** brand look.\n"
        "- Paste `tokens.css` `:root` into any artifact so `var(--token)` resolves.\n"
        "- Prefer measured values (HIGH/MED confidence in `design-tokens.json`) over fallbacks.\n\n"
        "## Quick token reference\n\n"
        f"- Background: `var(--bg)` = `{token_value(measured, '--bg')}`\n"
        f"- Surface: `var(--surface)` = `{token_value(measured, '--surface')}`\n"
        f"- Text: `var(--fg)` = `{token_value(measured, '--fg')}`\n"
        f"- Accent: `var(--accent)` = `{token_value(measured, '--accent')}`\n"
        f"- Border: `var(--border)` = `{token_value(measured, '--border')}`\n"
        f"- Body font: `var(--font-body)` = `{token_value(measured, '--font-body')}`\n"
        f"- Container: `var(--container-max)` = `{token_value(measured, '--container-max')}`\n"
    )


# ── Preview pages ─────────────────────────────────────────────────────────────

def _preview_shell(title: str, root_block: str, body: str) -> str:
    return (
        "<!doctype html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '  <meta charset="utf-8">\n'
        f"  <title>{title}</title>\n"
        "  <style>\n"
        f"{root_block}\n"
        "    body { margin: 0; padding: var(--space-6); background: var(--bg); "
        "color: var(--fg); font-family: var(--font-body); }\n"
        "    h1 { font-family: var(--font-display); }\n"
        "  </style>\n"
        "</head>\n"
        "<body>\n"
        f"{body}\n"
        "</body>\n"
        "</html>\n"
    )


def render_preview_colors(measured) -> str:
    swatches = []
    for label, token in [("Background", "--bg"), ("Surface", "--surface"),
                         ("Foreground", "--fg"), ("Muted", "--muted"),
                         ("Border", "--border"), ("Accent", "--accent"),
                         ("Success", "--success"), ("Warn", "--warn"), ("Danger", "--danger")]:
        swatches.append(
            f'    <div style="background: var({token}); color: var(--accent-on); '
            f'padding: var(--space-4); border-radius: var(--radius-md); '
            f'box-shadow: var(--elev-ring);">{label}<br><code>var({token})</code></div>'
        )
    body = "  <h1>Colors</h1>\n  <div style=\"display:grid;gap:var(--space-3);grid-template-columns:repeat(3,1fr);\">\n" + "\n".join(swatches) + "\n  </div>"
    return _preview_shell("Colors", _root_block_for_md(measured), body)


def render_preview_typography(measured) -> str:
    sizes = ["--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl",
             "--text-2xl", "--text-3xl", "--text-4xl"]
    rows = [f'    <p style="font-size: var({s}); font-family: var(--font-display);">The quick brown fox — <code>var({s})</code></p>'
            for s in sizes]
    body = "  <h1>Typography</h1>\n" + "\n".join(rows)
    body += '\n  <p style="font-family: var(--font-mono);">Mono: var(--font-mono)</p>'
    return _preview_shell("Typography", _root_block_for_md(measured), body)


def render_preview_spacing(measured) -> str:
    bars = []
    for s in ("--space-1", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-8", "--space-12"):
        bars.append(
            f'    <div><code>var({s})</code> = <code>{token_value(measured, s)}</code></div>'
            f'    <div style="background: var(--accent); height: var(--space-3); width: var({s}); border-radius: var(--radius-pill);"></div>'
        )
    body = "  <h1>Spacing</h1>\n  <div style=\"display:grid;gap:var(--space-2);\">\n" + "\n".join(bars) + "\n  </div>"
    return _preview_shell("Spacing", _root_block_for_md(measured), body)


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
