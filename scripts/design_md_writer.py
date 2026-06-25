#!/usr/bin/env python3
"""
Google-spec DESIGN.md emitter for the design-extractor pipeline.

Spec reference: https://github.com/google-labs-code/design.md/blob/main/docs/spec.md

YAML frontmatter with required `name` and optional `version`, `description`, plus token
trees `colors`, `typography`, `rounded`, `spacing`, `components`. Body follows with the
eight canonical sections in fixed order, then project-extension sections preserved as
unknown by the spec.

Public API
----------
build_design_md(brand_slug, brand_dir, design_tokens, patterns=None, voice=None) -> str
    Returns a complete Google-spec-valid DESIGN.md string.

validate_design_md(md_text) -> list[str]
    Returns a list of violation strings; empty list = valid.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

# Canonical section order per Google DESIGN.md spec.
CANONICAL_SECTIONS: list[str] = [
    "Overview",
    "Colors",
    "Typography",
    "Layout",
    "Elevation & Depth",
    "Shapes",
    "Components",
    "Do's and Don'ts",
]

_HEX6_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
_TOKEN_REF_RE = re.compile(r"\{([^{}]+)\}")
_H2_RE = re.compile(r"^## (.+)$", re.MULTILINE)
_NON_TOKEN_CHARS_RE = re.compile(r"[^a-zA-Z0-9]+")
_FENCED_CODE_BLOCK_RE = re.compile(r"```.*?```", re.DOTALL)


# colour helpers

def _rgb_to_hex6_upper(s: str) -> str:
    try:
        nums = s.replace("rgb(", "").replace("rgba(", "").replace(")", "").split(",")
        r, g, b = int(float(nums[0])), int(float(nums[1])), int(float(nums[2]))
        return f"#{r:02X}{g:02X}{b:02X}"
    except (ValueError, IndexError):
        return "#000000"


def _to_hex6_upper(value: str) -> str:
    if not value or not isinstance(value, str):
        return "#000000"
    v = value.strip()
    if v.startswith("rgb"):
        return _rgb_to_hex6_upper(v)
    if v.startswith("#"):
        clean = v.lstrip("#")
        if len(clean) == 3:
            clean = "".join(ch * 2 for ch in clean)
        if len(clean) == 6:
            return f"#{clean.upper()}"
        if len(clean) == 8:
            return f"#{clean[:6].upper()}"
    return "#000000"


def _token_name(name: str) -> str:
    """Convert arbitrary extracted labels into Google DESIGN.md token keys."""
    raw = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", str(name).strip())
    cleaned = _NON_TOKEN_CHARS_RE.sub("-", raw).strip("-").lower()
    return cleaned or "token"


def _numeric_px(value: Any) -> float | None:
    if not isinstance(value, str):
        return None
    m = re.search(r"(-?\d+(?:\.\d+)?)px", value)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def _flatten_token_values(value: Any) -> list[str]:
    """Return string token values from mixed legacy/DTCG token shapes."""
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        for key in ("$value", "value"):
            if isinstance(value.get(key), str):
                return [value[key]]
        values: list[str] = []
        for nested in value.values():
            values.extend(_flatten_token_values(nested))
        return values
    if isinstance(value, list):
        values: list[str] = []
        for item in value:
            values.extend(_flatten_token_values(item))
        return values
    return []


def _pick_palette_color(palette: dict[str, Any], names: list[str], fallback: str) -> str:
    lowered = {str(k).lower(): v for k, v in palette.items()}
    for needle in names:
        n = needle.lower()
        for key_l, raw in lowered.items():
            if n == key_l or n in key_l:
                for candidate in _flatten_token_values(raw):
                    if candidate and candidate not in ("rgba(0, 0, 0, 0)", "transparent"):
                        return _to_hex6_upper(candidate)
    for raw in palette.values():
        for candidate in _flatten_token_values(raw):
            if candidate and candidate not in ("rgba(0, 0, 0, 0)", "transparent"):
                return _to_hex6_upper(candidate)
    return _to_hex6_upper(fallback)


# token tree builders

def _map_colors(palette: dict[str, Any]) -> dict[str, str]:
    """Map extracted color evidence to DESIGN.md color tokens.

    The Google spec permits arbitrary color token names. Preserve source-specific
    tokens instead of reducing every brand to a lossy primary/surface/accent set,
    then add semantic aliases used by the prose and component token refs.
    """
    colors: dict[str, str] = {}
    for raw_name, raw_value in palette.items():
        values = _flatten_token_values(raw_value)
        if not values:
            continue
        hex_value = _to_hex6_upper(values[0])
        if hex_value == "#000000" and values[0].strip().lower() not in ("#000", "#000000", "rgb(0, 0, 0)", "rgba(0, 0, 0, 1)"):
            continue
        key = _token_name(str(raw_name))
        if key not in colors:
            colors[key] = hex_value

    semantic = {
        "primary": _pick_palette_color(
            palette,
            ["primary", "brandOrange", "brand-orange", "accent", "interactive", "cta"],
            "#000000",
        ),
        "surface": _pick_palette_color(
            palette,
            ["surfaceWhite", "surface-white", "backgroundLight", "backgrounds", "white"],
            "#FFFFFF",
        ),
        "on-surface": _pick_palette_color(
            palette,
            ["onSurface", "surfaceDark", "surface-dark", "text", "body", "black"],
            "#000000",
        ),
        "accent": _pick_palette_color(
            palette,
            ["purpleAccent", "purple-accent", "accent", "brandYellow", "brand-yellow"],
            "#6B7280",
        ),
        "border": _pick_palette_color(
            palette,
            ["mutedBorder", "muted-border", "border", "textMuted", "text-muted"],
            "#E5E7EB",
        ),
        "muted": _pick_palette_color(
            palette,
            ["paleCream", "pale-cream", "backgroundLight", "muted", "tabActive"],
            "#F6F7FB",
        ),
        "footer": _pick_palette_color(
            palette,
            ["footerDark", "footer", "surfaceBlack", "surface-black", "black", "dark"],
            "#000000",
        ),
    }
    return {**semantic, **colors}


def _clean_font_name(family: str) -> str:
    return family.split(",")[0].strip().strip('"').strip("'").strip()


def _font_pair(families: list[dict]) -> tuple[str, str]:
    by_role: dict[str, str] = {}
    ordered: list[str] = []
    for f in families:
        if not isinstance(f, dict):
            continue
        raw = f.get("value", "")
        if not raw:
            continue
        name = _clean_font_name(raw)
        if not name:
            continue
        nl = name.lower()
        if "font awesome" in nl or "material icons" in nl:
            continue
        role = str(f.get("role", "")).lower()
        if role:
            by_role[role] = name
        if name not in ordered:
            ordered.append(name)
    heading = by_role.get("heading") or (ordered[0] if ordered else "sans-serif")
    body = by_role.get("body") or (ordered[1] if len(ordered) > 1 else heading)
    return heading, body


def _map_typography(families: list[dict], samples: dict[str, Any]) -> dict[str, Any]:
    heading_name, body_name = _font_pair(families)

    def _weight(v: Any) -> int:
        try:
            return int(v)
        except (ValueError, TypeError):
            return 400

    h1 = samples.get("h1") or samples.get("sectionHeading") or {}
    body_s = samples.get("bodyText") or samples.get("body") or {}

    return {
        "display": {
            "fontFamily":    heading_name,
            "fontSize":      h1.get("fontSize", "48px"),
            "fontWeight":    _weight(h1.get("fontWeight", 600)),
            "lineHeight":    str(h1.get("lineHeight", "1.2")),
            "letterSpacing": h1.get("letterSpacing", "0px"),
        },
        "body": {
            "fontFamily":    body_name,
            "fontSize":      body_s.get("fontSize", "16px"),
            "fontWeight":    _weight(body_s.get("fontWeight", 400)),
            "lineHeight":    str(body_s.get("lineHeight", "1.5")),
            "letterSpacing": body_s.get("letterSpacing", "0px"),
        },
    }


def _map_typography_from_tokens(typography_tokens: dict[str, Any]) -> dict[str, Any]:
    families = typography_tokens.get("families", [])
    samples = typography_tokens.get("samples", {})
    mapped = _map_typography(families, samples if isinstance(samples, dict) else {})
    sizes = typography_tokens.get("sizes") if isinstance(typography_tokens, dict) else None
    if isinstance(sizes, list) and sizes:
        px_values = [
            _numeric_px(item.get("value") if isinstance(item, dict) else str(item))
            for item in sizes
        ]
        px_values = [v for v in px_values if v is not None and v > 0]
        if px_values and not samples:
            display_px = max(px_values)
            body_px = sorted(px_values, key=lambda v: (abs(v - 16), v))[0]
            mapped["display"]["fontSize"] = f"{display_px:g}px"
            mapped["body"]["fontSize"] = f"{body_px:g}px"
            mapped["headline"] = {
                **mapped["display"],
                "fontSize": f"{min(display_px, 48):g}px",
            }
            mapped["label"] = {
                **mapped["body"],
                "fontSize": "14px",
                "fontWeight": 700,
                "lineHeight": "1.2",
                "letterSpacing": "0px",
            }
    return mapped


def _map_rounded(borders: dict[str, Any], all_tokens: dict[str, Any] | None = None) -> dict[str, str]:
    raw_list = borders.get("radii") or []
    radii = [(item["value"] if isinstance(item, dict) else str(item)) for item in raw_list]
    all_tokens = all_tokens or {}
    for candidate_key in ("radii", "rounded", "border"):
        candidate = all_tokens.get(candidate_key)
        if isinstance(candidate, dict):
            radii.extend([v for v in _flatten_token_values(candidate) if "px" in v or v == "9999px"])

    def _px(v: str) -> float:
        try:
            return float(v.replace("px", ""))
        except ValueError:
            return 0.0

    sorted_r = sorted({v for v in radii if v != "9999px"}, key=_px)

    def _at(i: int, fallback: str) -> str:
        return sorted_r[i] if i < len(sorted_r) else fallback

    return {
        "none": _at(0, "0px"),
        "sm":   _at(1, "4px"),
        "md":   _at(2, "8px"),
        "lg":   _at(3, "16px"),
        "pill": "9999px",
    }


def _map_spacing(spacing_tokens: dict[str, Any]) -> dict[str, str]:
    base_raw = spacing_tokens.get("detected_base_unit", "4px")
    if not base_raw:
        base_raw = "4px"
    if "detected_base_unit" not in spacing_tokens:
        values = _flatten_token_values(spacing_tokens)
        pxs = [int(v) for v in (_numeric_px(item) for item in values) if v and v > 0]
        if pxs:
            base_raw = f"{min(pxs)}px"
    try:
        base_n = int(str(base_raw).replace("px", ""))
    except ValueError:
        base_n = 4

    def _px(n: int) -> str:
        return f"{n}px"

    spacing = {
        "xs": _px(base_n),
        "sm": _px(base_n * 2),
        "md": _px(base_n * 4),
        "lg": _px(base_n * 6),
        "xl": _px(base_n * 10),
    }
    if isinstance(spacing_tokens.get("paddings"), list):
        vals = [item.get("value") for item in spacing_tokens["paddings"] if isinstance(item, dict)]
        pxs = sorted({v for v in vals if isinstance(v, str) and _numeric_px(v)})
        if pxs:
            spacing["section"] = pxs[-1]
    return spacing


def _map_components(
    colors: dict[str, str],
    typography: dict[str, Any],
    rounded: dict[str, str],
    spacing: dict[str, str],
) -> dict[str, Any]:
    lg = spacing.get("lg", "24px")
    sm = spacing.get("sm", "8px")
    md = spacing.get("md", "16px")
    xl = spacing.get("xl", "40px")
    return {
        "button-primary": {
            "backgroundColor": "{colors.primary}",
            "textColor":       "{colors.surface}",
            "typography":      "{typography.body}",
            "rounded":         "{rounded.pill}",
            "padding":         f"12px {lg}",
        },
        "button-secondary": {
            "backgroundColor": "transparent",
            "textColor":       "{colors.primary}",
            "typography":      "{typography.body}",
            "rounded":         "{rounded.pill}",
            "padding":         f"12px {lg}",
        },
        "card": {
            "backgroundColor": "{colors.surface}",
            "rounded":         "{rounded.md}",
            "padding":         "{spacing.lg}",
        },
        "nav-link": {
            "textColor":  "{colors.on-surface}",
            "typography": "{typography.body}",
        },
        "input": {
            "backgroundColor": "{colors.surface}",
            "textColor":       "{colors.on-surface}",
            "rounded":         "{rounded.md}",
            "padding":         f"{sm} {md}",
        },
        "hero": {
            "backgroundColor": "{colors.muted}",
            "textColor":       "{colors.on-surface}",
            "typography":      "{typography.display}",
            "padding":         f"{xl} {lg}",
        },
        "footer": {
            "backgroundColor": "{colors.footer}",
            "textColor":       "{colors.surface}",
            "padding":         f"{xl} {lg}",
        },
    }


# frontmatter

def _build_frontmatter(
    brand_name: str,
    description: str,
    colors: dict[str, str],
    typography: dict[str, Any],
    rounded: dict[str, str],
    spacing: dict[str, str],
    components: dict[str, Any],
) -> str:
    data: dict[str, Any] = {
        "version":     "alpha",
        "name":        brand_name,
        "description": description,
        "colors":      colors,
        "typography":  typography,
        "rounded":     rounded,
        "spacing":     spacing,
        "components":  components,
    }
    yml = yaml.safe_dump(data, sort_keys=False, allow_unicode=True, default_flow_style=False)
    return f"---\n{yml}---\n"


# body sections

def _section_overview(
    brand_name: str,
    heading_font: str,
    body_font: str,
    primary: str,
    source_url: str,
) -> str:
    return f"""\
## Overview

{brand_name} presents a focused, modern visual identity. The design language leads with
typography and restrained colour, anchored by a primary brand colour (`{primary}`) that
guides interactive elements, headings, and calls-to-action.

**Vibe keywords:** professional, data-driven, modern, trustworthy, clean

**Signature detail:** Display headings use `{{typography.display}}` ({heading_font}) at elevated
weight (600+) with tight tracking; body copy uses `{{typography.body}}` ({body_font}) at 400-500
weight for maximum legibility across dense information layouts.

**Forbidden zones:**
- Emoji characters as icons - use SVG or Lucide React only
- Cyber-neon gradients or AI-purple (`#0D1117`-style) backgrounds not present in source
- Inter as a display/heading font unless it was extracted from the source
- More than three levels of heading hierarchy on a single page
- Bare `border-l-N` accent cards not present in the source DOM extraction

**Logo-first rule:** The extracted logo asset must appear in the header. A reversed/white
variant appears in the footer. Never substitute a text wordmark when an SVG asset exists.
"""


def _section_colors(colors: dict[str, str]) -> str:
    usage_map: dict[str, str] = {
        "primary":    "Primary actions, headings, links, interactive elements",
        "surface":    "Page and card backgrounds",
        "on-surface": "Body text rendered on surface backgrounds",
        "accent":     "Hover, highlight, secondary interactive states",
        "border":     "Dividers, input outlines, subtle separators",
        "muted":      "Section fills, alternating rows, disabled states",
        "footer":     "Footer background and dark hero sections",
    }
    rows = [
        f"| `{{colors.{role}}}` | `{hex_val}` | {usage_map.get(role, 'General use')} |"
        for role, hex_val in colors.items()
    ]
    table = "\n".join(rows)
    return f"""\
## Colors

| Token | Value | Usage |
|-------|-------|-------|
{table}

All colours are SRGB `#RRGGBB`. Do not introduce colours outside this palette without
a matching token entry and explicit design rationale.
"""


def _section_typography(typography: dict[str, Any], heading_font: str, body_font: str) -> str:
    d = typography.get("display", {})
    b = typography.get("body", {})
    return f"""\
## Typography

### Display - `{{typography.display}}`

- **Font family:** {d.get("fontFamily", heading_font)}
- **Sizes:** hero headings 48-72px; section headings 32-48px
- **Weight:** {d.get("fontWeight", 600)} (semi-bold to bold)
- **Line height:** {d.get("lineHeight", "1.2")}
- **Letter spacing:** {d.get("letterSpacing", "0")}
- **Usage:** All `<h1>`-`<h3>` elements; card headlines; hero copy

### Body - `{{typography.body}}`

- **Font family:** {b.get("fontFamily", body_font)}
- **Baseline size:** {b.get("fontSize", "16px")}
- **Weight:** {b.get("fontWeight", 400)}
- **Line height:** {b.get("lineHeight", "1.5")} (~24px at 16px base)
- **Letter spacing:** {b.get("letterSpacing", "0")}
- **Usage:** Body copy, nav labels, captions, UI labels, inputs

**Line-length rule:** Constrain body paragraphs to 65ch max-width. Do not use the
display font for body copy or the body font for primary headings.
"""


def _section_layout(layout: dict[str, Any]) -> str:
    max_w = layout.get("max_width", "1200px")
    padding = layout.get("content_padding", "40px")
    h_h = layout.get("header_height", "94px")
    hero_h = layout.get("hero_height", "529px")
    return f"""\
## Layout

- **Max content width:** `{max_w}` - apply `max-w-[{max_w}] mx-auto`
- **Horizontal padding:** `{padding}` at desktop; reduce to `16px` below 768px
- **Header height:** `{h_h}` (sticky)
- **Hero height:** `{hero_h}`; full viewport on landing pages
- **Grid:** 12-column at >=1280px; 8-column at 768-1279px; 4-column below 768px
- **Breakpoints:** 768px (tablet), 1024px (desktop), 1280px (wide)
- **Section rhythm:** 80px vertical padding at desktop; 40px below 768px
"""


def _section_elevation() -> str:
    return """\
## Elevation & Depth

This brand uses a predominantly **flat** visual approach. Elevation is suggested through
surface-colour contrast rather than heavy drop shadows.

| Level | Usage | Shadow |
|-------|-------|--------|
| 0 - flat | Page surface, hero sections | none |
| 1 - low | Cards, information panels | `0 1px 3px rgba(0,0,0,0.08)` |
| 2 - raised | Modals, dropdowns, drawers | `0 4px 12px rgba(0,0,0,0.12)` |

Do not exceed blur-radius 16px or spread 4px unless those shadow values appear in the
source DOM extraction.
"""


def _section_shapes(rounded: dict[str, str]) -> str:
    usage_map: dict[str, str] = {
        "none": "Tables, full-bleed images, dividers",
        "sm":   "Badges, tags, chip elements",
        "md":   "Cards, inputs, small modals",
        "lg":   "Large modals, panels, image containers",
        "pill": "Primary and secondary buttons, search bars",
    }
    rows = [
        f"| `{{rounded.{key}}}` | `{val}` | {usage_map.get(key, 'General use')} |"
        for key, val in rounded.items()
    ]
    table = "\n".join(rows)
    return f"""\
## Shapes

| Token | Value | Usage |
|-------|-------|-------|
{table}

Use `{{rounded.pill}}` for primary calls-to-action. Use `{{rounded.md}}` for cards and
containers. Use `{{rounded.none}}` for full-bleed sections and data tables.
"""


def _section_components(components: dict[str, Any]) -> str:
    blocks = []
    for name, props in components.items():
        prop_lines = "\n".join(f"  {k}: {v}" for k, v in props.items())
        blocks.append(f"### `{name}`\n\n```\n{prop_lines}\n```\n")
    return "## Components\n\n" + "\n".join(blocks)


def _section_dos_and_donts(heading_font: str, body_font: str, primary: str, padding: str) -> str:
    return f"""\
## Do's and Don'ts

### Do
- Use `{{typography.display}}` ({heading_font}) for all `<h1>`-`<h3>` headings
- Apply `{{colors.primary}}` (`{primary}`) to interactive elements, links, and primary CTAs
- Maintain `{padding}` horizontal padding on content wrappers at desktop
- Use `{{rounded.pill}}` on primary buttons; `{{rounded.md}}` on cards and inputs
- Reference the extracted logo SVG asset - never a bare text substitution
- Capture screenshots at 375px, 768px, and 1280px before declaring a replica done

### Don't
- Use `{{typography.body}}` ({body_font}) for headings or vice-versa
- Introduce colours outside the documented `colors.*` palette without a matching token addition
- Stack more than three heading levels on a single page
- Use emoji as icon elements (SVG/Lucide React only)
- Apply cyber-neon gradients, AI-purple (`#0D1117`) hero backgrounds, or `border-l-N`
  accent cards unless those patterns are confirmed in the source DOM extraction
- Report a task as done without browser screenshot evidence
"""


def _section_agent_prompt_guide(
    brand_name: str,
    brand_slug: str,
    heading_font: str,
    body_font: str,
    primary: str,
    footer_bg: str,
    max_width: str,
    padding: str,
) -> str:
    return f"""\
## Agent Prompt Guide

When generating new pages, replicas, or components for {brand_name}:

1. **Typography first:** Set `{{typography.display}}` ({heading_font}) on all headings
   and `{{typography.body}}` ({body_font}) on body copy before applying any other styles.

2. **Colour discipline:** Use only the documented `colors.*` palette tokens. Primary CTA -> `{{colors.primary}}`
   (`{primary}`). Page surface -> `{{colors.surface}}`. Body text -> `{{colors.on-surface}}`.

3. **Layout wrapper:** `max-w-[{max_width}] mx-auto px-[{padding}]` on every content section.

4. **Button template:**
   ```tsx
   <Button className="rounded-full bg-[{primary}] text-white px-6 py-3 font-semibold hover:opacity-90">
     Label
   </Button>
   ```

5. **Footer template:** Use `{{colors.footer}}` (`{footer_bg}`) background with
   `{{colors.surface}}` text. Preserve extracted navigation labels - do not invent
   generic footer link columns.

6. **Evidence requirement:** Run `agent-browser screenshot` at 1280x800 and 375x667 after
   each component change. Compare against originals in `brands/{brand_slug}/screenshots/`.
"""


def _format_philosophy_top3(philosophy_top3: list | None) -> str:
    """Render the top-3 philosophy classification for the Provenance section.

    Accepts a list of dicts shaped {name, family, similarity, rationale} as produced
    by `scripts/classify_philosophy.classify_brand`. Falls back to the legacy
    "pending" string when no classification is supplied.
    """
    if not philosophy_top3:
        return "pending (Phase 3.1 classifier)"
    parts: list[str] = []
    for entry in philosophy_top3[:3]:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name", "")).strip()
        if not name:
            continue
        sim = entry.get("similarity")
        if isinstance(sim, (int, float)):
            parts.append(f"{name} ({float(sim):.2f})")
        else:
            parts.append(name)
    if not parts:
        return "pending (Phase 3.1 classifier)"
    return "; ".join(parts)


def _section_provenance(
    brand_slug: str,
    source_url: str,
    extracted_at: str,
    philosophy_top3: list | None = None,
) -> str:
    nearest = _format_philosophy_top3(philosophy_top3)
    return f"""\
## Provenance

| Field | Value |
|-------|-------|
| Brand slug | `{brand_slug}` |
| Source URL | [{source_url}]({source_url}) |
| Extracted at | {extracted_at} |
| Extractor | design-extractor - publish_brand.py via design_md_writer.py |
| DESIGN.md spec | [google-labs-code/design.md](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) |
| Nearest philosophy | {nearest} |
| EVAL score | pending |
"""


# public build API

def build_design_md(
    brand_slug: str,
    brand_dir: Path,
    design_tokens: dict,
    patterns: dict | None = None,
    voice: dict | None = None,
) -> str:
    """Build a Google-spec-valid DESIGN.md string."""
    voice = voice or {}
    brand_name: str = voice.get("brand_name") or design_tokens.get("brand") or brand_slug
    source_url: str = (
        voice.get("source_url")
        or design_tokens.get("url")
        or f"https://{brand_slug}"
    )
    raw_ts: str = design_tokens.get("extracted_at", "")
    extracted_at: str = (
        voice.get("extracted_at")
        or (raw_ts[:10] if raw_ts else "")
        or datetime.now(timezone.utc).date().isoformat()
    )
    identity_md: str = voice.get("identity_md", "")

    palette_raw: dict = design_tokens.get("colours", {}).get("palette", {})
    if not palette_raw and isinstance(design_tokens.get("color"), dict):
        palette_raw = {
            key: val
            for key, val in design_tokens["color"].items()
            if not str(key).startswith("$")
        }
    typography_tokens: dict = design_tokens.get("typography", {})
    families: list = typography_tokens.get("families", [])
    samples: dict = typography_tokens.get("samples", {})
    spacing_tokens = design_tokens.get("spacing", {})
    if "detected_base_unit" not in spacing_tokens and typography_tokens.get("detected_base_unit"):
        spacing_tokens = {**spacing_tokens, "detected_base_unit": typography_tokens.get("detected_base_unit")}
    borders: dict = design_tokens.get("borders", {})
    layout: dict = design_tokens.get("layout", {})

    colors = _map_colors(palette_raw)
    typography = _map_typography_from_tokens(typography_tokens)
    rounded = _map_rounded(borders, design_tokens)
    spacing = _map_spacing(spacing_tokens)
    components = _map_components(colors, typography, rounded, spacing)

    heading_font, body_font = _font_pair(families)
    primary = colors["primary"]
    footer_bg = colors["footer"]
    max_width = layout.get("max_width", "1200px")
    padding = layout.get("content_padding", "40px")
    description = f"{brand_name} design system - extracted from {source_url}"

    frontmatter = _build_frontmatter(
        brand_name, description, colors, typography, rounded, spacing, components
    )

    title = f"# {brand_name} Design System\n"

    canonical_body = "\n".join([
        _section_overview(brand_name, heading_font, body_font, primary, source_url),
        _section_colors(colors),
        _section_typography(typography, heading_font, body_font),
        _section_layout(layout),
        _section_elevation(),
        _section_shapes(rounded),
        _section_components(components),
        _section_dos_and_donts(heading_font, body_font, primary, padding),
    ])

    philosophy_top3 = None
    if isinstance(patterns, dict):
        candidate = patterns.get("philosophy_top3")
        if isinstance(candidate, list):
            philosophy_top3 = candidate

    extensions = "\n".join([
        _section_agent_prompt_guide(
            brand_name, brand_slug, heading_font, body_font,
            primary, footer_bg, max_width, padding,
        ),
        _section_provenance(brand_slug, source_url, extracted_at, philosophy_top3),
    ])

    # render_identity_contract_md already emits its own `## Mandatory identity rules`
    # h2 heading — pass through as an unknown-section extension per Google spec.
    identity_section = ""
    if identity_md.strip():
        identity_section = "\n" + identity_md.strip() + "\n"

    body = title + "\n" + canonical_body + "\n" + extensions + identity_section
    return frontmatter + "\n" + body


# public validate API

def _resolve_token_path(ref: str, fm: dict) -> bool:
    parts = ref.strip().split(".")
    node: Any = fm
    for part in parts:
        if not isinstance(node, dict) or part not in node:
            return False
        node = node[part]
    return True


def validate_design_md(md_text: str) -> list[str]:
    """Validate md_text against Google DESIGN.md spec. Returns list of violations."""
    violations: list[str] = []

    if not md_text.startswith("---"):
        violations.append("FRONTMATTER: document does not begin with '---'")
        return violations

    parts = md_text.split("---", 2)
    if len(parts) < 3:
        violations.append("FRONTMATTER: closing '---' fence not found")
        return violations

    fm_text = parts[1]
    body_text = parts[2]

    try:
        fm = yaml.safe_load(fm_text) or {}
    except yaml.YAMLError as exc:
        violations.append(f"FRONTMATTER: yaml.safe_load failed - {exc}")
        return violations

    if not isinstance(fm, dict):
        violations.append("FRONTMATTER: parsed value is not a mapping")
        return violations

    if not fm.get("name"):
        violations.append("FRONTMATTER: required field 'name' is missing or empty")

    colors_fm = fm.get("colors", {})
    if isinstance(colors_fm, dict):
        for role, val in colors_fm.items():
            if not isinstance(val, str):
                violations.append(
                    f"COLORS[{role}]: value must be a string, got {type(val).__name__}"
                )
            elif not _HEX6_RE.match(val):
                violations.append(
                    f"COLORS[{role}]: '{val}' does not match ^#[0-9A-Fa-f]{{6}}$"
                )

    h2_headings = [h.strip() for h in _H2_RE.findall(body_text)]

    seen: set[str] = set()
    for h in h2_headings:
        if h in seen:
            violations.append(f"SECTIONS: duplicate h2 heading '{h}'")
        seen.add(h)

    found_canonical = [h for h in h2_headings if h in set(CANONICAL_SECTIONS)]
    expected_canonical = [s for s in CANONICAL_SECTIONS if s in seen]
    if found_canonical != expected_canonical:
        violations.append(
            f"SECTIONS: canonical sections out of order. "
            f"Found: {found_canonical}. Expected: {expected_canonical}"
        )

    body_without_code = _FENCED_CODE_BLOCK_RE.sub("", body_text)
    for ref in _TOKEN_REF_RE.findall(body_without_code):
        ref_s = ref.strip()
        if not _resolve_token_path(ref_s, fm):
            violations.append(f"TOKEN_REF: {{{ref_s}}} does not resolve in frontmatter")

    return violations
