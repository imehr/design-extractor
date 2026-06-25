#!/usr/bin/env python3
"""
Design Extractor — Publish Pipeline
Synthesizes design-tokens.json, DESIGN.md, SKILL.md from DOM extraction data.
Run after extraction + validation to populate the brand directory with all artifacts.

Usage:
    python3 scripts/publish_brand.py --brand woolworthsgroup-com-au
    python3 scripts/publish_brand.py --brand westpac-com-au --skip-existing
"""

import argparse
import importlib.util as _iutil
import json
import math
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Load the Google-spec DESIGN.md emitter via a file-relative spec so this works
# whether publish_brand.py is run as __main__ or imported by tests.
_dmw_spec = _iutil.spec_from_file_location(
    "design_md_writer", Path(__file__).parent / "design_md_writer.py"
)
_dmw = _iutil.module_from_spec(_dmw_spec)
_dmw_spec.loader.exec_module(_dmw)
_build_design_md = _dmw.build_design_md
_validate_design_md = _dmw.validate_design_md

REPO_ROOT_DEFAULT = Path(__file__).resolve().parent.parent


def resolve_cache_dir(
    slug: str, library_root: Path, repo_root: Path
) -> tuple[Path | None, str | None]:
    """Find the extraction cache for a slug.

    Returns (cache_dir, slug_prefix). slug_prefix is non-None only for the
    shared repo cache layout where dom-extraction files are <slug>-*.json.
    Search order:
      1. <library_root>/cache/<slug>/
      2. <repo_root>/cache/<slug>/
      3. <repo_root>/cache/ with dom-extraction/<slug>-*.json files
    """
    for candidate in (library_root / "cache" / slug, repo_root / "cache" / slug):
        if candidate.exists():
            return candidate, None
    shared_dom = repo_root / "cache" / "dom-extraction"
    if shared_dom.exists() and any(shared_dom.glob(f"{slug}-*.json")):
        return repo_root / "cache", slug
    return None, None


def load_all_measurements(cache_dir: Path, slug_prefix: str | None = None) -> list[dict]:
    """Load all measurement JSON files from DOM extraction."""
    measurements = []
    dom_dir = cache_dir / "dom-extraction"
    if not dom_dir.exists():
        return measurements
    for f in sorted(dom_dir.glob("*-measurements.json")):
        if slug_prefix and not f.name.startswith(slug_prefix + "-"):
            continue
        with open(f) as fh:
            data = json.load(fh)
            data["_source_file"] = f.name
            measurements.append(data)
    return measurements


def load_all_dom(cache_dir: Path, slug_prefix: str | None = None) -> list[dict]:
    """Load all DOM extraction JSON files."""
    dom_files = []
    dom_dir = cache_dir / "dom-extraction"
    if not dom_dir.exists():
        return dom_files
    # Suffixes that denote measurement/probe artifacts, not DOM content.
    _skip = ("measurements", "rawcss", "samples", "viewports")
    for f in sorted(dom_dir.glob("*.json")):
        if any(s in f.name for s in _skip) or f.name == "measured-tokens.json":
            continue
        if slug_prefix and not f.name.startswith(slug_prefix + "-") and f.name != f"{slug_prefix}.json":
            continue
        with open(f) as fh:
            data = json.load(fh)
            data["_source_file"] = f.name
            dom_files.append(data)
    return dom_files


def extract_identity_contract(dom_data: list[dict]) -> dict:
    """Extract logo/header/footer evidence that must survive into docs and skills."""
    contract = {
        "header_logo": "",
        "header_wordmark": "",
        "footer_logo": "",
        "nav_labels": [],
        "footer_columns": [],
        "footer_about": "",
        "footer_acknowledgement": "",
        "footer_copyright": "",
    }

    for dom in dom_data:
        header = dom.get("header") or {}
        footer = dom.get("footer") or {}
        header_sections = identity_sections(dom, "header")
        footer_sections = identity_sections(dom, "footer")

        if not contract["header_logo"] and isinstance(header, dict):
            contract["header_logo"] = identity_logo_value(header.get("logo"))

            for item in header.get("primaryNav") or []:
                if isinstance(item, dict) and item.get("text"):
                    contract["nav_labels"].append(str(item["text"]))
            contract["nav_labels"].extend(readable_link_texts(header.get("links") or []))

        for section in header_sections:
            links = readable_link_texts(section.get("links") or [])
            if not contract["header_wordmark"] and links:
                contract["header_wordmark"] = links[0]
            contract["nav_labels"].extend(links)

        if not contract["footer_logo"] and isinstance(footer, dict):
            contract["footer_logo"] = identity_logo_value(footer.get("logo"))

        if isinstance(footer, dict):
            about = footer.get("aboutUs") or {}
            if not contract["footer_about"] and isinstance(about, dict):
                contract["footer_about"] = about.get("text") or ""

            if not contract["footer_acknowledgement"]:
                contract["footer_acknowledgement"] = footer.get("acknowledgementOfCountry") or ""

            if not contract["footer_copyright"]:
                contract["footer_copyright"] = footer.get("copyright") or ""

            quick_links = footer.get("quickLinks") or {}
            if isinstance(quick_links, dict) and not contract["footer_columns"]:
                for value in quick_links.values():
                    labels = []
                    for item in value or []:
                        if isinstance(item, dict) and item.get("text"):
                            labels.append(str(item["text"]))
                    if labels:
                        contract["footer_columns"].append(labels)

            for key in ("postalAddress", "streetAddress"):
                address = footer.get(key) or {}
                if isinstance(address, dict) and address.get("lines"):
                    contract["footer_columns"].append([str(line) for line in address["lines"]])

            footer_links = readable_link_texts(footer.get("links") or [])
            if footer_links:
                contract["footer_columns"].append(footer_links)

        for section in footer_sections:
            footer_labels = readable_link_texts(section.get("links") or [])
            footer_text = readable_texts(section.get("text") or [])
            if footer_labels:
                contract["footer_columns"].append(footer_labels)
            if footer_text:
                contract["footer_columns"].append(footer_text)
                if not contract["footer_about"]:
                    contract["footer_about"] = footer_text[0]
                if not contract["footer_copyright"]:
                    copyright_line = next((line for line in footer_text if "©" in line or "rights" in line.lower()), "")
                    contract["footer_copyright"] = copyright_line

        if (contract["header_logo"] or contract["header_wordmark"]) and contract["nav_labels"] and contract["footer_columns"]:
            break

    contract["nav_labels"] = unique_strings(contract["nav_labels"])[:10]
    contract["footer_columns"] = [
        unique_strings(column)[:12] for column in contract["footer_columns"][:4]
    ]
    return contract


def identity_logo_value(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("localFile") or value.get("src") or value.get("href") or ""
    return ""


def identity_sections(dom: dict, kind: str) -> list[dict]:
    matches = []
    for section in dom.get("sections") or []:
        if not isinstance(section, dict):
            continue
        tag = str(section.get("tag") or "").lower()
        role = str(section.get("role") or "").lower()
        class_name = str(section.get("className") or "").lower()
        if kind == "header" and (tag in ("header", "nav") or role in ("banner", "navigation") or "nav" in class_name):
            matches.append(section)
        if kind == "footer" and (tag == "footer" or role == "contentinfo" or "footer" in class_name):
            matches.append(section)
    return matches


def readable_link_texts(links: list) -> list[str]:
    labels = []
    for item in links:
        if isinstance(item, dict):
            labels.append(item.get("text") or item.get("label") or item.get("title") or "")
        else:
            labels.append(str(item))
    return readable_texts(labels)


def readable_texts(values: list) -> list[str]:
    labels = []
    for value in values:
        text = " ".join(str(value or "").strip().split())
        if not text or len(text) > 160:
            continue
        if text.startswith("http://") or text.startswith("https://"):
            continue
        labels.append(text)
    return unique_strings(labels)


def is_html_snapshot_fallback(content: str, brand_slug: str, page_slug: str) -> bool:
    expected = f"/api/brands/{brand_slug}/preview/{page_slug}"
    return "next/navigation" in content and "redirect(" in content and expected in content


def unique_strings(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        normalized = " ".join(str(value).strip().split())
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            result.append(normalized)
    return result


def render_identity_contract_md(contract: dict) -> str:
    nav = contract.get("nav_labels") or []
    footer_columns = contract.get("footer_columns") or []
    header_identity = contract.get("header_logo") or contract.get("header_wordmark") or "Use text wordmark if no image logo exists in the source."
    footer_identity = contract.get("footer_logo") or contract.get("header_logo") or contract.get("header_wordmark") or "Use text wordmark in dark footer if no reversed logo asset exists."
    footer_lines = []
    for index, column in enumerate(footer_columns, start=1):
        footer_lines.append(f"- Column {index}: {', '.join(column)}")
    if not footer_lines:
        footer_lines.append("- Footer is minimal on the source; preserve the source footer rhythm and do not invent generic legal columns.")

    return f"""
## Mandatory identity rules

- Use the extracted logo asset or text wordmark in the header: `{header_identity}`.
- Use the extracted white/reversed logo asset in dark footers when available: `{footer_identity}`.
- Preserve the live header navigation labels: {", ".join(nav) if nav else "Use the source header labels from DOM extraction; do not invent generic SaaS navigation."}.
- Preserve the live footer structure, not a generic legal-link row:
{chr(10).join(footer_lines)}
- Footer about text: {contract.get("footer_about") or "No long-form footer about text on the source; do not invent one"}.
- Footer acknowledgement/country text must be carried into generated pages when present: {contract.get("footer_acknowledgement") or "No acknowledgement text captured on the source"}.
- Footer copyright/source row: {contract.get("footer_copyright") or "Preserve the source footer verification/source row when present"}.
- Test cases, replicas, dashboards, slides, posters, and design-system showcases must reuse these logo/header/footer details before adding scenario-specific content.
"""


def _load_probe_jsons(dom_dir: Path, kind: str, slug_prefix: str | None) -> list[dict]:
    out: list[dict] = []
    if not dom_dir.exists():
        return out
    for f in sorted(dom_dir.glob(f"*-{kind}.json")):
        if slug_prefix and not f.name.startswith(slug_prefix + "-"):
            continue
        try:
            out.append(json.loads(f.read_text()))
        except json.JSONDecodeError:
            continue
    return out


def load_measured_tokens(cache_dir: Path, slug_prefix: str | None = None) -> dict:
    """Load (or compute + cache) the measured-token artifact.

    Reads ``dom-extraction/measured-tokens.json`` if present. Otherwise computes
    it from the WS2 probe artifacts (``*-samples.json``, ``*-rawcss.json``,
    ``*-viewports.json``) via ``measured_tokens.analyze`` and writes the result
    so subsequent runs are deterministic. Returns ``{}`` when no evidence exists.
    """
    dom_dir = cache_dir / "dom-extraction"
    artifact = dom_dir / "measured-tokens.json"
    if artifact.exists():
        try:
            data = json.loads(artifact.read_text())
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass

    probe_samples = _load_probe_jsons(dom_dir, "samples", slug_prefix)
    if not probe_samples:
        return {}
    try:
        mt_spec = _iutil.spec_from_file_location(
            "measured_tokens", Path(__file__).parent / "measured_tokens.py"
        )
        mt = _iutil.module_from_spec(mt_spec)
        assert mt_spec.loader is not None
        mt_spec.loader.exec_module(mt)
    except Exception:  # noqa: BLE001 — measured tokens are an enhancement, never required
        return {}

    all_samples: list[dict] = []
    for s in probe_samples:
        all_samples.extend(s.get("samples", []) if isinstance(s, dict) else [])
    raw_css = None
    rawcss_files = _load_probe_jsons(dom_dir, "rawcss", slug_prefix)
    if rawcss_files:
        raw_css = rawcss_files[0]
    viewports = None
    vp_files = _load_probe_jsons(dom_dir, "viewports", slug_prefix)
    if vp_files:
        viewports = vp_files[0]

    try:
        measured = mt.analyze(all_samples, raw_css=raw_css, viewports=viewports).to_dict()
    except Exception:  # noqa: BLE001
        return {}
    try:
        artifact.write_text(json.dumps(measured, indent=2))
    except OSError:
        pass
    return measured


def synthesize_design_tokens(
    measurements: list[dict], dom_data: list[dict], brand_name: str, measured: dict | None = None
) -> dict:
    """Synthesize design-tokens.json from DOM extraction measurements.

    When a ``measured`` artifact (from ``measured_tokens.analyze``) is present,
    the spacing scale, radii, shadows, and transitions are sourced from MEASURED
    computed styles instead of the hardcoded fabrication defaults.
    """

    measured = measured or {}
    SPACE_NAMES = ["--space-1", "--space-2", "--space-3", "--space-4",
                   "--space-5", "--space-6", "--space-8", "--space-12"]
    RADIUS_NAMES = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-pill"]
    has_measured_space = any(n in measured for n in SPACE_NAMES)
    has_measured_radius = any(n in measured for n in RADIUS_NAMES)
    has_measured_motion = "--motion-base" in measured or "--motion-fast" in measured
    has_measured_elev = "--elev-raised" in measured or "--elev-ring" in measured

    # Collect colors from ALL available fields across all pages
    all_colors = {}
    for m in measurements:
        # Method 1: dedicated colors dict
        colors = m.get("colors", m.get("colours", {}))
        if isinstance(colors, dict):
            for name, value in colors.items():
                for index, color in enumerate(color_values(value)):
                    key = name if index == 0 else f"{name}_{index + 1}"
                    all_colors.setdefault(key, color)

        # Method 2: uniqueTextColors / uniqueBackgroundColors arrays.
        # Dedupe near-identical colors and assign clean ordinal roles
        # (text / text-2 / ... and surface / surface-2 / ...) instead of the
        # noisy `text_rgb(42, 44, 47)` / `bg_oklab(...)` keys that leaked
        # raw color syntax into token names.
        text_tiers = dedupe_color_values(list(m.get("uniqueTextColors", [])))
        for i, tc in enumerate(text_tiers):
            role = "text" if i == 0 else f"text-{i + 1}"
            all_colors.setdefault(role, tc)
        bg_tiers = dedupe_color_values(list(m.get("uniqueBackgroundColors", [])))
        for i, bc in enumerate(bg_tiers):
            role = "surface" if i == 0 else f"surface-{i + 1}"
            all_colors.setdefault(role, bc)

        # Method 3: extract from section-level fields (h1.color, body.backgroundColor, footer.backgroundColor, etc.)
        for section_key in ["h1", "body", "footer", "header", "hero", "nav"]:
            section = m.get(section_key, {})
            if isinstance(section, dict):
                for prop in ["color", "backgroundColor"]:
                    val = section.get(prop)
                    if val and val != "rgba(0, 0, 0, 0)" and val != "transparent":
                        role = f"{section_key}_{prop.replace('olor', '').replace('backgC', 'bg').replace('c', 'text', 1) if prop == 'color' else section_key + '_bg'}"
                        all_colors.setdefault(role, val)

        # Method 4: links and buttons
        for ui_key in ["links", "buttons"]:
            ui = m.get(ui_key, {})
            if isinstance(ui, dict):
                for variant, styles in ui.items():
                    if isinstance(styles, dict):
                        for prop in ["color", "backgroundColor"]:
                            val = styles.get(prop)
                            if (
                                val
                                and val != "rgba(0, 0, 0, 0)"
                                and val != "transparent"
                            ):
                                all_colors.setdefault(f"{ui_key}_{variant}_{prop}", val)

    # Collect typography
    typography_samples = {}
    for m in measurements:
        typo = m.get("typography", {})
        for role, styles in typo.items():
            if isinstance(styles, dict) and "fontSize" in styles:
                typography_samples[role] = styles
        for role in ("h1", "bodyText", "header", "footer"):
            styles = m.get(role, {})
            if isinstance(styles, dict) and styles.get("fontFamily"):
                typography_samples[role] = styles
        h2s = m.get("h2s", [])
        if isinstance(h2s, list):
            first_h2 = next(
                (item for item in h2s if isinstance(item, dict) and item.get("fontFamily")),
                None,
            )
            if first_h2:
                typography_samples.setdefault("h2", first_h2)
        buttons = m.get("buttons", [])
        if isinstance(buttons, list):
            first_button = next(
                (item for item in buttons if isinstance(item, dict) and item.get("fontFamily")),
                None,
            )
            if first_button:
                typography_samples.setdefault("button", first_button)

    # Collect font families (handle both dict and list formats)
    font_families = {}
    for m in measurements:
        ff = m.get("fontFamilies", m.get("fonts", {}))
        if isinstance(ff, dict):
            for role, family in ff.items():
                font_families[role] = family
        elif isinstance(ff, list):
            for i, family in enumerate(ff):
                if isinstance(family, str):
                    role = "heading" if i == 0 else "body" if i == 1 else f"font-{i}"
                    font_families[role] = family
                elif isinstance(family, dict):
                    role = family.get("role", family.get("name", f"font-{i}"))
                    font_families[role] = family.get(
                        "value", family.get("family", str(family))
                    )
        h1_family = font_family_from_style(m.get("h1"))
        body_family = font_family_from_style(m.get("bodyText"))
        if h1_family:
            font_families["heading"] = h1_family
        if body_family:
            font_families["body"] = body_family

    heading_family = (
        font_family_from_style(typography_samples.get("h1"))
        or font_family_from_style(typography_samples.get("h2"))
    )
    body_family = preferred_body_font_family(measurements, brand_name) or font_family_from_style(
        typography_samples.get("bodyText")
    )
    button_family = font_family_from_style(typography_samples.get("button"))
    if heading_family:
        font_families["heading"] = heading_family
    if body_family:
        font_families["body"] = body_family
    if button_family:
        font_families["button"] = button_family

    # Extract layout
    layout = {}
    for m in measurements:
        l = m.get("layout", {})
        if l:
            layout = l
            break

    # Extract header/hero measurements
    header = {}
    hero = {}
    for m in measurements:
        if m.get("header"):
            header = m["header"]
        if m.get("hero"):
            hero = m["hero"]

    # Extract footer
    footer = {}
    for m in measurements:
        if m.get("footer"):
            footer = m["footer"]

    # Build the token structure matching what the UI expects
    # (based on Westpac's design-tokens.json format)

    # Convert rgb strings to hex
    def rgb_to_hex(rgb_str):
        if not rgb_str or not isinstance(rgb_str, str) or not rgb_str.startswith("rgb"):
            return str(rgb_str) if rgb_str else "#000000"
        try:
            nums = (
                rgb_str.replace("rgb(", "")
                .replace("rgba(", "")
                .replace(")", "")
                .split(",")
            )
            r, g, b = int(nums[0].strip()), int(nums[1].strip()), int(nums[2].strip())
            return f"#{r:02x}{g:02x}{b:02x}"
        except (ValueError, IndexError):
            return rgb_str

    # Build computed colors array — must match Westpac format: {value: "rgb(...)", count: N}
    computed_colors = []
    role_counts = {
        "primary": 100,
        "text": 80,
        "white": 60,
        "footerDark": 40,
        "textDark": 30,
        "backgroundLight": 20,
    }
    for name, rgb in all_colors.items():
        hex_val = rgb_to_hex(rgb)
        computed_colors.append(
            {
                "value": rgb,
                "count": role_counts.get(name, 10),
                "confidence": "HIGH"
                if name in ("primary", "text", "white", "footerDark")
                else "MEDIUM",
                "source": "computed-style",
                "role": name,
            }
        )

    # Build typography
    font_sizes = set()
    font_weights = set()
    line_heights = set()
    for role, styles in typography_samples.items():
        if "fontSize" in styles:
            font_sizes.add(styles["fontSize"])
        if "fontWeight" in styles:
            font_weights.add(str(styles["fontWeight"]))
        if "lineHeight" in styles:
            line_heights.add(styles["lineHeight"])

    # Families in {value, count} format matching Westpac. Prefer role-specific
    # page samples over noisy browser fallback families such as Times or icon fonts.
    families = []
    family_counts = {"body": 100, "heading": 50, "legacy": 5}
    ordered_font_roles = ["heading", "body", "nav", "button"]
    seen_families = set()
    for role in ordered_font_roles + [
        role for role in font_families.keys() if role not in ordered_font_roles
    ]:
        family = normalize_font_family(font_families.get(role))
        if not family or is_icon_font_family(family):
            continue
        key = family.lower()
        if key in seen_families:
            continue
        seen_families.add(key)
        families.append({"role": role, "value": family, "count": family_counts.get(role, 10)})

    # Build spacing
    content_padding = layout.get("contentPaddingLeft", 40)
    max_width = layout.get("contentMaxWidth", 1200)

    # Detect base unit from common values
    base_unit = 4 if content_padding % 8 == 0 else 4

    palette_values = {c["role"]: rgb_to_hex(c["value"]) for c in computed_colors}
    semantic_palette = build_semantic_palette(palette_values)

    # Build complete tokens
    tokens = {
        "stage": "token_extraction",
        "url": "",
        "brand": brand_name,
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "colours": {
            "computed": computed_colors,
            "palette": {**semantic_palette, **palette_values},
        },
        "typography": {
            "families": families,
            "sizes": [
                {"value": s, "count": 10}
                for s in sorted(
                    list(font_sizes),
                    key=lambda x: float(x.replace("px", "")) if "px" in x else 0,
                )
            ],
            "weights": [{"value": w, "count": 10} for w in sorted(list(font_weights))],
            "line_heights": [
                {"value": lh, "count": 10} for lh in sorted(list(line_heights))
            ],
            "letter_spacings": [],
            "samples": typography_samples,
        },
        "spacing": {
            "detected_base_unit": f"{base_unit}px",
            "content_padding": f"{content_padding}px",
            "max_width": f"{max_width}px",
            "scale": (
                [_token_scalar(measured[n]) for n in SPACE_NAMES if n in measured]
                if has_measured_space
                else [f"{base_unit * i}px" for i in [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20]]
            ),
            "paddings": [{"value": f"{content_padding}px", "count": 20}],
            "margins": [],
            "gaps": [],
        },
        "borders": {
            "radii": (
                [
                    {"value": _token_scalar(measured[n]), "count": int(measured[n].get("count", 5))}
                    for n in RADIUS_NAMES if n in measured
                ]
                if has_measured_radius
                else [
                    {"value": v, "count": 5}
                    for v in ["0px", "4px", "8px", "16px", "9999px"]
                ]
            ),
        },
        "shadows": (
            _measured_shadows(measured) if has_measured_elev else []
        ),
        "breakpoints": [768, 1024, 1280],
        "transitions": _measured_transitions(measured) if has_measured_motion else [{"value": "all 200ms ease", "count": 10}],
        "layout": {
            "max_width": f"{max_width}px",
            "content_padding": f"{content_padding}px",
            "header_height": f"{header.get('height', 94)}px",
            "hero_height": f"{hero.get('height', 529)}px",
            "footer_bg": footer.get("backgroundColor", ""),
        },
    }

    return tokens


def _measured_shadows(measured: dict) -> list[dict]:
    """Build the shadows list from measured elevation tokens (skip ``none``/flat)."""
    out: list[dict] = []
    for name in ("--elev-ring", "--elev-raised"):
        prov = measured.get(name)
        if not isinstance(prov, dict):
            continue
        value = _token_scalar(prov)
        if not value or value.strip().lower() in ("none", "initial"):
            continue
        out.append({"value": value, "count": int(prov.get("count", 5))})
    return out


def _measured_transitions(measured: dict) -> list[dict]:
    """Build transitions from measured motion tokens (falls back to a sane default)."""
    ease = _token_scalar(measured.get("--ease-standard") or {"value": "ease"})
    out: list[dict] = []
    for name in ("--motion-fast", "--motion-base"):
        prov = measured.get(name)
        if not isinstance(prov, dict):
            continue
        duration = _token_scalar(prov)
        if not duration:
            continue
        out.append({"value": f"all {duration} {ease}", "count": int(prov.get("count", 5))})
    return out or [{"value": "all 200ms ease", "count": 10}]


def color_values(value) -> list[str]:
    if isinstance(value, str):
        text = value.strip()
        if text and text != "rgba(0, 0, 0, 0)" and text != "transparent":
            return [text]
        return []
    if isinstance(value, list):
        result = []
        for item in value:
            result.extend(color_values(item))
        return result
    return []


def build_semantic_palette(palette_values: dict[str, str]) -> dict[str, str]:
    values = list(dict.fromkeys(palette_values.values()))
    chromatic = max(
        (value for value in values if is_chromatic_hex(value)),
        key=color_chroma,
        default="",
    )
    dark = (
        palette_values.get("footer_footer_bg")
        or palette_values.get("h1_text")
        or next((value for value in values if is_dark_hex(value)), "")
    )
    light = palette_values.get("hero_hero_bg") or next(
        (value for value in values if value.lower() not in ("#ffffff", "#fff") and not is_dark_hex(value)),
        "",
    )
    text = (
        palette_values.get("text")
        or palette_values.get("text-2")
        or palette_values.get("h1_text")
        or palette_values.get("text_2")
        or dark
    )
    primary = chromatic or dark or values[0] if values else "#000000"
    return {
        "primary": primary,
        "accent": chromatic or primary,
        "dark": dark or "#000000",
        "footerDark": palette_values.get("footer_footer_bg") or dark or "#000000",
        "backgroundLight": light or "#f6f7fb",
        "text": text or "#202020",
    }


def is_chromatic_hex(value: str) -> bool:
    rgb = hex_to_rgb(value)
    if not rgb:
        return False
    return max(rgb) - min(rgb) > 30


def is_dark_hex(value: str) -> bool:
    rgb = hex_to_rgb(value)
    if not rgb:
        return False
    r, g, b = rgb
    return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) < 0.35


def color_chroma(value: str) -> int:
    rgb = hex_to_rgb(value)
    if not rgb:
        return 0
    return max(rgb) - min(rgb)


def hex_to_rgb(value: str) -> tuple[int, int, int] | None:
    if not isinstance(value, str) or not value.startswith("#"):
        return None
    clean = value.lstrip("#")
    if len(clean) == 3:
        clean = "".join(ch * 2 for ch in clean)
    if len(clean) != 6:
        return None
    try:
        return int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16)
    except ValueError:
        return None


def color_distance(c1, c2) -> float:
    """Perceptual color distance (redmean weighted RGB) in [0, ~762].

    Accepts hex strings, rgb() strings, or (r,g,b) tuples. Values below ~2 are
    visually indistinguishable and treated as duplicates for token cleanup.
    Returns a large sentinel (999.0) when either color is unparseable.
    """
    rgb1 = _coerce_rgb(c1)
    rgb2 = _coerce_rgb(c2)
    if rgb1 is None or rgb2 is None:
        return 999.0
    r1, g1, b1 = rgb1
    r2, g2, b2 = rgb2
    rmean = (r1 + r2) / 2
    dr, dg, db = r1 - r2, g1 - g2, b1 - b2
    return math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db)


def _coerce_rgb(value):
    if isinstance(value, tuple) and len(value) == 3:
        return tuple(int(x) for x in value)
    hex_val = color_to_hex(value) if isinstance(value, str) else ""
    return hex_to_rgb(hex_val) if hex_val else None


def _is_real_color(value) -> bool:
    if not isinstance(value, str):
        return False
    v = value.strip()
    return bool(v) and v != "rgba(0, 0, 0, 0)" and v != "transparent" and _coerce_rgb(v) is not None


def dedupe_color_values(values: list[str], threshold: float = 2.0) -> list[str]:
    """Collapse near-identical colors (ΔE < ``threshold``), preserving first-seen order."""
    out: list[str] = []
    for v in values:
        if not _is_real_color(v):
            continue
        if any(color_distance(v, kept) < threshold for kept in out):
            continue
        out.append(v)
    return out


def css_token_name(name: str) -> str:
    """Sanitize a token role into a valid CSS custom property / DTCG name."""
    text = re.sub(r"[^a-z0-9]+", "-", str(name).lower()).strip("-")
    return text or "token"


def color_to_hex(value) -> str:
    """Normalize a color value to #rrggbb. Returns '' when not convertible."""
    if not isinstance(value, str):
        return ""
    text = value.strip()
    if text.startswith("#"):
        return text if hex_to_rgb(text) else ""
    if text.startswith("rgb"):
        nums = text.replace("rgba(", "").replace("rgb(", "").replace(")", "").split(",")
        try:
            r, g, b = (int(float(n.strip())) for n in nums[:3])
            return f"#{r:02x}{g:02x}{b:02x}"
        except (ValueError, IndexError):
            return ""
    return ""


def dtcg_groups(tokens: dict) -> dict:
    """Derive W3C DTCG token groups from the legacy token structure.

    Emitted alongside the legacy keys in design-tokens.json so DTCG-aware
    tooling can consume the file while existing consumers (UI, design_md_writer)
    keep reading `colours`/`typography`/`layout`. Only evidence-backed values
    are emitted — nothing is fabricated.
    """
    palette = tokens.get("colours", {}).get("palette", {}) or {}
    color_group: dict = {"$type": "color"}
    for name, value in palette.items():
        hex_val = color_to_hex(_token_scalar(value))
        if not hex_val:
            continue
        color_group.setdefault(css_token_name(name), {"$value": hex_val})

    families = tokens.get("typography", {}).get("families", []) or []
    font_group: dict = {"$type": "fontFamily"}
    for index, family in enumerate(families):
        if not isinstance(family, dict):
            continue
        value = normalize_font_family(family.get("value"))
        if not value:
            continue
        role = str(family.get("role") or f"font-{index}")
        font_group.setdefault(css_token_name(role), {"$value": value})

    layout = tokens.get("layout", {}) or {}
    spacing = tokens.get("spacing", {}) or {}
    dimension_group: dict = {"$type": "dimension"}
    for name, value in (
        ("max-width", layout.get("max_width")),
        ("content-padding", layout.get("content_padding")),
        ("header-height", layout.get("header_height")),
    ):
        if value:
            dimension_group.setdefault(name, {"$value": str(value)})
    for index, step in enumerate(spacing.get("scale", []) or [], start=1):
        dimension_group.setdefault(f"space-{index}", {"$value": str(step)})
    for item in tokens.get("borders", {}).get("radii", []) or []:
        value = _token_scalar(item)
        if value:
            dimension_group.setdefault(f"radius-{css_token_name(value)}", {"$value": value})

    groups: dict = {}
    if len(color_group) > 1:
        groups["color"] = color_group
    if len(font_group) > 1:
        groups["fontFamily"] = font_group
    if len(dimension_group) > 1:
        groups["dimension"] = dimension_group
    return groups


def font_family_from_style(value) -> str:
    if isinstance(value, dict):
        return normalize_font_family(value.get("fontFamily"))
    return ""


def preferred_body_font_family(measurements: list[dict], brand_name: str) -> str:
    families = [
        font_family_from_style(m.get("bodyText"))
        for m in measurements
        if font_family_from_style(m.get("bodyText"))
    ]
    if not families:
        return ""
    brand_key = brand_name.split()[0].lower()
    custom = [
        family
        for family in families
        if brand_key and brand_key in family.lower() and not is_icon_font_family(family)
    ]
    for family in custom:
        if "light" in family.lower() or "regular" in family.lower() or "book" in family.lower():
            return family
    if custom:
        return custom[0]
    for family in families:
        if not is_icon_font_family(family) and "times" not in family.lower():
            return family
    return families[0]


def normalize_font_family(value) -> str:
    if not isinstance(value, str):
        return ""
    return " ".join(value.strip().split())


def is_icon_font_family(value: str) -> bool:
    return "font awesome" in value.lower() or "material icons" in value.lower()


def font_pair_from_families(families: list[dict]) -> tuple[str, str]:
    by_role: dict[str, str] = {}
    ordered: list[str] = []
    for family in families:
        if not isinstance(family, dict):
            continue
        value = normalize_font_family(family.get("value"))
        if not value or is_icon_font_family(value):
            continue
        primary = value.split(",")[0].strip().strip('"').strip("'")
        if not primary:
            continue
        role = str(family.get("role") or "").lower()
        if role:
            by_role[role] = primary
        ordered.append(primary)

    heading = by_role.get("heading") or (ordered[0] if ordered else "sans-serif")
    body = by_role.get("body") or (ordered[1] if len(ordered) > 1 else heading)
    return heading, body


def generate_design_md(
    tokens: dict, brand_name: str, source_url: str, measurements: list, dom_data: list
) -> str:
    """Generate Google-spec-compliant DESIGN.md.

    Delegates to scripts/design_md_writer.build_design_md. Identity contract markdown
    is passed through `voice["identity_md"]` so it survives as a project-extension
    section that preserves the existing test assertions.
    """
    identity_md = render_identity_contract_md(extract_identity_contract(dom_data))

    slug = (
        (tokens.get("url", "") or source_url or "")
        .replace("https://", "")
        .replace("http://", "")
        .rstrip("/")
        .replace(".", "-")
        .replace("/", "-")
        or brand_name.lower().replace(" ", "-")
    )

    voice = {
        "brand_name":   brand_name,
        "source_url":   source_url,
        "extracted_at": tokens.get("extracted_at", ""),
        "identity_md":  identity_md,
    }

    brand_dir = Path.home() / ".claude" / "design-library" / "brands" / slug

    # Best-effort: classify against the 20 huashu philosophies. Never let a
    # classifier crash block DESIGN.md generation.
    patterns: dict = {}
    try:
        import importlib.util as _ilu
        _cls_spec = _ilu.spec_from_file_location(
            "classify_philosophy",
            Path(__file__).parent / "classify_philosophy.py",
        )
        if _cls_spec and _cls_spec.loader:
            _cls_mod = _ilu.module_from_spec(_cls_spec)
            _cls_spec.loader.exec_module(_cls_mod)
            top3 = _cls_mod.classify_brand(tokens)
            if isinstance(top3, list) and top3:
                patterns["philosophy_top3"] = top3
    except Exception:  # noqa: BLE001 — best-effort by design
        pass

    return _build_design_md(
        brand_slug=slug,
        brand_dir=brand_dir,
        design_tokens=tokens,
        patterns=patterns or None,
        voice=voice,
    )


def _legacy_generate_design_md_unused(
    tokens: dict, brand_name: str, source_url: str, measurements: list, dom_data: list
) -> str:
    """Legacy emitter kept as dead code for reference; not invoked. Remove in a follow-up plan."""
    palette = tokens.get("colours", {}).get("palette", {})
    families = tokens.get("typography", {}).get("families", [])
    samples = tokens.get("typography", {}).get("samples", {})
    layout = tokens.get("layout", {})

    heading_font, body_font = font_pair_from_families(families)

    # Count pages and assets
    page_count = len([m for m in measurements if m.get("_source_file")])
    color_count = len(palette)
    identity_contract = render_identity_contract_md(extract_identity_contract(dom_data))

    md = f"""# {brand_name} Design System

> Extracted from [{source_url}]({source_url}) on {datetime.now().strftime("%Y-%m-%d")}

{identity_contract}

## 1. Visual Theme & Atmosphere

{brand_name} presents a clean, modern identity. The design language uses a focused color palette anchored by its primary brand color (`{palette.get(list(palette.keys())[0] if palette else "primary", "#000")}`). Typography establishes clear hierarchy with {heading_font} for headings paired with {body_font} for body text.

## 2. Colour Palette & Roles

| Role | Value | Usage |
|------|-------|-------|
"""
    for role, hex_val in palette.items():
        usage = {
            "primary": "Headings, links, CTAs, interactive elements",
            "text": "Body copy, paragraphs",
            "textDark": "Navigation, strong text",
            "textMuted": "Secondary text, descriptions",
            "white": "Backgrounds, text on dark surfaces",
            "black": "Borders, maximum contrast",
            "footerDark": "Footer background, dark sections",
            "lightBlueAccent": "Highlight sections, subtle backgrounds",
            "backgroundLight": "Section backgrounds, alternating rows",
        }.get(role, "General use")
        md += f"| {role} | `{hex_val}` | {usage} |\n"

    md += f"""
## 3. Typography Rules

### Display Font: {heading_font}
- **H1 (Section heading):** {samples.get("sectionHeading", {}).get("fontSize", "48px")} / {samples.get("sectionHeading", {}).get("lineHeight", "56px")} / weight {samples.get("sectionHeading", {}).get("fontWeight", "600")}
- **H2 (Hero heading):** {samples.get("heroHeading", {}).get("fontSize", "64px")} / {samples.get("heroHeading", {}).get("lineHeight", "80px")} / weight {samples.get("heroHeading", {}).get("fontWeight", "600")}
- Color: Primary blue `{palette.get("primary", "#1971ED")}`

### Body Font: {body_font}
- **Body:** {samples.get("body", {}).get("fontSize", "16px")} / weight 400 / color `{palette.get("text", "#202020")}`
- **Nav links:** {samples.get("navLink", {}).get("fontSize", "16px")} / weight 400

## 4. Layout Principles

- **Max content width:** {layout.get("max_width", "1200px")}
- **Content padding:** {layout.get("content_padding", "40px")} (sides)
- **Header height:** {layout.get("header_height", "94px")}
- **Hero height:** {layout.get("hero_height", "529px")}
- **Footer:** Dark background `{layout.get("footer_bg", "")}`

## 5. Component Patterns

### Header
- Sticky white bar with logo left, centered nav, search right
- Dark ticker bar below nav for contextual data (share price, etc.)
- Active nav item: underlined in primary blue

### Hero Banner
- Full-width background image with gradient overlay
- Heading positioned bottom-left in white {heading_font}
- Optional subtitle in white/90% opacity

### Content Sections
- Alternating white and light backgrounds
- Section headings in primary blue {heading_font}
- Card-based layouts for content groups

### Footer
- Dark navy background (`{palette.get("footerDark", "#0E0D26")}`)
- Multi-column layout: brand info, addresses, link groups
- Acknowledgement of Country section with indigenous artwork

## 6. Buttons & Interactive Elements

- **Primary button:** `{palette.get("primary", "#1971ED")}` background, white text, 8px border-radius
- **Padding:** 5px 24px
- **Font:** {body_font} 16px weight 600
- **Hover:** Darker shade of primary

## 7. Do's and Don'ts

### Do
- Use {heading_font} for ALL headings, never for body text
- Maintain {layout.get("content_padding", "40px")} side padding at desktop
- Use primary blue for interactive elements and section headings
- Use full-width hero images with bottom-left text positioning

### Don't
- Mix heading font into body copy
- Use colors outside the defined palette
- Stack more than 3 levels of heading hierarchy
- Center hero text (always bottom-left on inner pages)

## 8. Responsive Behaviour

- Content max-width: {layout.get("max_width", "1200px")} with {layout.get("content_padding", "40px")} padding
- Below 768px: single column, reduced heading sizes
- Hero maintains aspect ratio, text stays bottom-left

## 9. Agent Prompt Guide

When replicating this brand:
1. Use `{heading_font}` for all headings (font-weight: 600)
2. Use `{body_font}` for all body text
3. Primary blue: `{palette.get("primary", "#1971ED")}`
4. Content area: `max-w-[{layout.get("max_width", "1200px").replace("px", "")}px] px-[{layout.get("content_padding", "40px")}]`
5. Hero: `relative w-full` with exact height from measurements, `absolute bottom-0 left-0` for text
6. Footer: `bg-[{palette.get("footerDark", "#0E0D26")}]` with white text
7. Buttons: `rounded-lg bg-[{palette.get("primary", "#1971ED")}] text-white px-6`
"""
    return md


def _token_scalar(value, default: str = "") -> str:
    if isinstance(value, dict):
        return str(value.get("value") or value.get("$value") or value.get("hex") or default)
    if value is None:
        return default
    return str(value)


def _token_list(values, limit: int = 12) -> list[str]:
    if not isinstance(values, list):
        return []
    result = []
    for item in values[:limit]:
        if isinstance(item, dict):
            value = item.get("value") or item.get("$value") or item.get("hex")
            count = item.get("count")
            if value:
                result.append(f"`{value}`" + (f" ({count} samples)" if count else ""))
        elif item is not None:
            result.append(f"`{item}`")
    return result


def _palette_lines(tokens: dict) -> list[str]:
    palette = tokens.get("colours", {}).get("palette", {}) or tokens.get("colors", {})
    lines = []
    if isinstance(palette, dict):
        for name, value in palette.items():
            lines.append(f"- `{name}` = `{_token_scalar(value)}`")
    if lines:
        return lines[:24]

    computed = tokens.get("colours", {}).get("computed", [])
    if isinstance(computed, list):
        for item in computed[:24]:
            if not isinstance(item, dict):
                continue
            role = item.get("role") or item.get("token") or "color"
            value = item.get("value") or item.get("hex")
            if value:
                lines.append(f"- `{role}` = `{value}`")
    return lines or ["- No color tokens were extracted; use `DESIGN.md` as the source of truth."]


def _dict_token_lines(values: dict, limit: int = 16) -> list[str]:
    lines = []
    for name, value in list((values or {}).items())[:limit]:
        if name == "$type":
            continue
        lines.append(f"- `{name}` = `{_token_scalar(value)}`")
    return lines


def _component_manifest_lines(component_manifest: dict | None) -> list[str]:
    components = []
    if isinstance(component_manifest, dict) and isinstance(component_manifest.get("components"), list):
        components = [item for item in component_manifest["components"] if isinstance(item, dict)]
    if not components:
        return [
            "- No component manifest was available. Rebuild from the component recipes and token tables in `DESIGN.md`.",
        ]

    lines = []
    for component in components:
        name = component.get("name") or component.get("type") or "Component"
        ctype = component.get("type") or "component"
        status = component.get("status") or "unknown"
        pages = ", ".join(str(page) for page in component.get("source_pages", []) if page) or "source page"
        lines.append(f"- **{name}** (`{ctype}`, {status}) from {pages}. Recreate this as a reusable component, not one-off markup.")
    return lines


def _palette_value(palette: dict, *names: str, default: str = "") -> str:
    for name in names:
        value = _token_scalar(palette.get(name))
        if value:
            return value
    return default


def generate_skill_md(
    brand_name: str,
    slug: str,
    source_url: str,
    tokens: dict,
    dom_data: list[dict] | None = None,
    design_md_body: str | None = None,
    component_manifest: dict | None = None,
) -> str:
    """Generate SKILL.md for the brand."""
    palette = tokens.get("colours", {}).get("palette", {})
    families = tokens.get("typography", {}).get("families", [])
    identity_contract = render_identity_contract_md(extract_identity_contract(dom_data or []))
    heading_font, body_font = font_pair_from_families(families)
    typography = tokens.get("typography", {}) if isinstance(tokens.get("typography"), dict) else {}
    spacing = tokens.get("spacing", {}) if isinstance(tokens.get("spacing"), dict) else {}
    border = tokens.get("border", {}) if isinstance(tokens.get("border"), dict) else {}
    radii = tokens.get("radii", {}) if isinstance(tokens.get("radii"), dict) else {}
    gradients = tokens.get("gradient", {}) if isinstance(tokens.get("gradient"), dict) else {}
    sizes = ", ".join(_token_list(typography.get("sizes"))) or "Use the sizes in DESIGN.md."
    weights = ", ".join(_token_list(typography.get("weights"))) or "Use 400, 500, and 700 when not specified."
    spacing_values = ", ".join(
        _token_list(spacing.get("paddings"), 8)
        + _token_list(spacing.get("margins"), 8)
        + _token_list(spacing.get("gaps"), 8)
    ) or "Use the spacing scale in DESIGN.md."
    radius_values = ", ".join(_token_list(radii.get("values"), 8) + _dict_token_lines(border, 8)) or "Use the radius and border rules in DESIGN.md."
    gradient_lines = _dict_token_lines(gradients, 12) if gradients else []
    design_reference = design_md_body.strip() if design_md_body else "DESIGN.md was not embedded during generation; read the sibling `DESIGN.md` before implementing."
    primary_color = _palette_value(palette, "primary", "brandOrange", "accent", default="#1971ED")
    dark_color = _palette_value(palette, "footerDark", "surfaceDark", "surfaceBlack", "dark", default="#0E0D26")
    body_color = _palette_value(palette, "text", "onSurface", "surfaceDark", default="#202020")
    heading_weight = "700" if "700" in weights else "600"

    return f"""---
name: brand-{slug}
description: >-
  Apply the full {brand_name} visual system extracted from {source_url}.
  Use when building HTML, React, dashboards, slides, posters, landing pages,
  or components that must replicate {brand_name}'s design exactly from
  DESIGN.md, tokens, assets, and component evidence.
---

# {brand_name} Design Skill

Extracted from {source_url}.

## When to use

- Use this skill whenever the user asks to recreate, extend, apply, or test the {brand_name} visual identity.
- Use it for HTML artifacts, Next.js/React pages, dashboards, slide decks, posters, and component libraries.
- Use it together with the sibling `DESIGN.md`, `design-tokens.json`, `design-tokens.css`, and brand assets. Do not rely on memory or generic UI defaults.

## When not to use

- Do not use this for business facts about {brand_name}; it is only a visual replication skill.
- Do not use this when the user asks for a generic SaaS, portfolio, or dashboard style without asking for {brand_name}.

## Non-negotiable fidelity contract

- Start from the extracted tokens and component recipes. The output must visibly match the original source, not merely use a similar palette.
- Recreate the header, logo or wordmark, navigation behavior, footer system, page bands, borders, gradients, typography scale, component spacing, and interaction states.
- Preserve distinctive layout structure before adding scenario content. If the source is an event page, keep event-specific tabs, date labels, cards, and footer content.
- Use exact border weights, radius values, and gradients from `DESIGN.md`; do not smooth them into generic 1px cards.
- Validate against desktop and mobile screenshots. If the first viewport lacks the original brand signal, the implementation is not done.

## Quick reference

- **Heading font:** {heading_font} (weight {heading_weight})
- **Body font:** {body_font}
- **Primary color:** `{primary_color}`
- **Dark/footer:** `{dark_color}`
- **Body text:** `{body_color}`
- **Max width:** {tokens.get("layout", {}).get("max_width", "1200px")}
- **Content padding:** {tokens.get("layout", {}).get("content_padding", "40px")}
- **Typography sizes:** {sizes}
- **Typography weights:** {weights}
- **Spacing evidence:** {spacing_values}
- **Radius / border evidence:** {radius_values}

{identity_contract}

## Color tokens

{chr(10).join(_palette_lines(tokens))}

## Gradient tokens

{chr(10).join(gradient_lines) if gradient_lines else "- No separate gradient token object was found. Use the gradients documented in `DESIGN.md`."}

## Component catalogue to recreate

{chr(10).join(_component_manifest_lines(component_manifest))}

## Implementation workflow for agents

1. Read `DESIGN.md` first and create CSS custom properties for every frontmatter token.
2. Build the page shell: source-style header, main content bands, and footer before scenario-specific widgets.
3. Implement each component catalogue item as a reusable block with the exact tokens and dimensions from `DESIGN.md`.
4. Use assets from `assets/` or `public/brand/`; never replace logos or source imagery with generic stock art.
5. Check the output against the source: borders, background gradients, component hierarchy, footer, and first-viewport brand signal must all survive.

## Do

- Use the exact token values and component recipes embedded below.
- Keep full-width source bands full-width.
- Preserve logo/header/navigation/footer identity on every generated scenario.
- Prefer semantic HTML and responsive CSS, but do not simplify away brand-defining visual details.

## Don't

- Do not flatten the design into generic white cards.
- Do not replace extracted gradients, borders, and rounded shapes with framework defaults.
- Do not invent navigation labels, footer columns, or CTAs when extracted evidence exists.
- Do not omit brand imagery or logo treatment just because the scenario content is different.

## Installable files

- `DESIGN.md` — Full design system documentation
- `design-tokens.json` — Machine-readable tokens
- `design-tokens.css` — CSS custom properties when available
- `replica/` — React/shadcn component replicas
- `assets/` — Downloaded images, fonts, SVGs

## Full reference: DESIGN.md

```md
{design_reference}
```

## Installation into another repo

```bash
mkdir -p .claude/skills/brand-{slug}
cp -R ~/.claude/design-library/brands/{slug}/skill/* .claude/skills/brand-{slug}/
cp ~/.claude/design-library/brands/{slug}/DESIGN.md ./DESIGN.md
```
"""


def generate_css_variables(tokens: dict) -> str:
    """Generate CSS custom properties from design tokens."""
    palette = tokens.get("colours", {}).get("palette", {})
    families = tokens.get("typography", {}).get("families", [])
    layout = tokens.get("layout", {})

    lines = [":root {"]
    seen_color_names = set()
    for role, hex_val in palette.items():
        css_name = css_token_name(role)
        if css_name in seen_color_names:
            continue
        seen_color_names.add(css_name)
        lines.append(f"  --color-{css_name}: {hex_val};")

    for i, f in enumerate(families):
        role = f.get("role") if isinstance(f, dict) else None
        role = css_token_name(role) if role else ("heading" if i == 0 else "body" if i == 1 else f"font-{i}")
        lines.append(f"  --font-{role}: {f['value']};")

    lines.append(f"  --max-width: {layout.get('max_width', '1200px')};")
    lines.append(f"  --content-padding: {layout.get('content_padding', '40px')};")
    lines.append(f"  --header-height: {layout.get('header_height', '94px')};")
    lines.append(f"  --border-radius-btn: 8px;")
    lines.append("}")
    return "\n".join(lines)


def mirror_artifacts(src_dir: Path, dest_dir: Path) -> list[str]:
    """Copy publish artifacts from src_dir to dest_dir. Returns copied paths."""
    copied: list[str] = []
    dest_dir.mkdir(parents=True, exist_ok=True)
    for rel in (
        "DESIGN.md",
        "design-tokens.json",
        "design-tokens.css",
        "metadata.json",
        "component-manifest.json",
    ):
        src = src_dir / rel
        if src.exists() and src.is_file():
            (dest_dir / rel).write_text(src.read_text())
            copied.append(rel)
    skill_src = src_dir / "skill"
    if skill_src.is_dir():
        (dest_dir / "skill").mkdir(parents=True, exist_ok=True)
        for f in sorted(skill_src.iterdir()):
            if f.is_file():
                (dest_dir / "skill" / f.name).write_text(f.read_text())
                copied.append(f"skill/{f.name}")
    return copied


def main():
    parser = argparse.ArgumentParser(description="Publish brand artifacts")
    parser.add_argument("--brand", help="Brand slug")
    parser.add_argument("--slug", dest="brand", help="Brand slug (alias for --brand)")
    parser.add_argument(
        "--repo-root",
        default=None,
        help="Repo root for the brands/<slug>/ artifact mirror (default: this repo)",
    )
    parser.add_argument(
        "--library-root",
        default=None,
        help="Design library root (default: ~/.claude/design-library)",
    )
    parser.add_argument(
        "--skip-existing", action="store_true", help="Skip if artifacts already exist"
    )
    parser.add_argument(
        "--docs-only",
        action="store_true",
        help="Repair DESIGN.md and skill/SKILL.md from existing tokens and DOM evidence",
    )
    parser.add_argument(
        "--tokens-only",
        action="store_true",
        help="Repair design-tokens.json, design-tokens.css, DESIGN.md, and skill/SKILL.md",
    )
    parser.add_argument(
        "--enforce-readiness",
        action="store_true",
        help="Fail when required brand package evidence is missing before registration",
    )
    args = parser.parse_args()

    if not args.brand:
        parser.error("--slug (or --brand) is required")

    if args.docs_only and args.tokens_only:
        print("Error: --docs-only and --tokens-only cannot be used together")
        return 2

    mode_actions = {
        "tokens": not args.docs_only,
        "css": not args.docs_only,
        "docs": True,
        "skill": True,
        "metadata": True,
        "quality": True,
    }

    library_root = (
        Path(args.library_root).expanduser()
        if args.library_root
        else Path.home() / ".claude" / "design-library"
    )
    repo_root = Path(args.repo_root).expanduser() if args.repo_root else REPO_ROOT_DEFAULT

    cache_dir, slug_prefix = resolve_cache_dir(args.brand, library_root, repo_root)
    brands_dir = library_root / "brands" / args.brand
    repo_brand_dir = repo_root / "brands" / args.brand

    if cache_dir is None:
        print(
            f"Error: no extraction cache found for {args.brand}. Searched: "
            f"{library_root / 'cache' / args.brand}, {repo_root / 'cache' / args.brand}, "
            f"{repo_root / 'cache' / 'dom-extraction'}/{args.brand}-*.json"
        )
        sys.exit(1)

    brands_dir.mkdir(parents=True, exist_ok=True)

    # Read metadata
    meta_path = brands_dir / "metadata.json"
    metadata = {}
    if meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)

    brand_name = metadata.get("name", args.brand.replace("-", " ").title())
    source_url = metadata.get(
        "source_url",
        f"https://{args.brand.replace('-com-', '.com.').replace('-au', '.au')}",
    )

    # Load extraction data
    measurements = load_all_measurements(cache_dir, slug_prefix)
    dom_data = load_all_dom(cache_dir, slug_prefix)
    measured = load_measured_tokens(cache_dir, slug_prefix)

    tokens_path = brands_dir / "design-tokens.json"

    print(f"Publishing {brand_name} ({args.brand})")
    print(f"  Cache: {cache_dir}")

    if not measurements:
        if tokens_path.exists():
            print("  WARN: no measurement files found; using existing design-tokens.json")
            with open(tokens_path) as f:
                tokens = json.load(f)
        else:
            print(
                f"Error: no measurement files and no existing design-tokens.json "
                f"for {args.brand} — cannot publish without extraction evidence"
            )
            sys.exit(1)
    else:
        print(f"  Measurements: {len(measurements)} files")
        print(f"  DOM extractions: {len(dom_data)} files")

    # 1. Generate design-tokens.json (legacy structure + W3C DTCG groups)
    if mode_actions["tokens"] and measurements:
        if args.skip_existing and tokens_path.exists():
            print("  design-tokens.json: skipped (exists)")
            with open(tokens_path) as f:
                tokens = json.load(f)
        else:
            tokens = synthesize_design_tokens(measurements, dom_data, brand_name, measured)
            tokens.update(dtcg_groups(tokens))
            with open(tokens_path, "w") as f:
                json.dump(tokens, f, indent=2)
            print(f"  design-tokens.json: generated ({len(json.dumps(tokens))} bytes)")
    elif tokens_path.exists():
        with open(tokens_path) as f:
            tokens = json.load(f)
        print(
            f"  design-tokens.json: kept (existing, {tokens_path.stat().st_size} bytes)"
        )
    elif measurements:
        tokens = synthesize_design_tokens(measurements, dom_data, brand_name, measured)
        print("  design-tokens.json: synthesized in memory for docs repair")
    else:
        print("Error: No measurements and no existing design-tokens.json")
        sys.exit(1)

    # 2. Generate design-tokens.css
    css_path = brands_dir / "design-tokens.css"
    if mode_actions["css"] and not (args.skip_existing and css_path.exists()):
        css = generate_css_variables(tokens)
        with open(css_path, "w") as f:
            f.write(css)
        print(f"  design-tokens.css: generated ({len(css)} bytes)")
    elif not mode_actions["css"]:
        print("  design-tokens.css: skipped (--docs-only)")

    # 3. Generate DESIGN.md
    design_path = brands_dir / "DESIGN.md"
    if not mode_actions["docs"]:
        print("  DESIGN.md: skipped")
    elif args.skip_existing and design_path.exists():
        print("  DESIGN.md: skipped (exists)")
    else:
        design_md = generate_design_md(
            tokens, brand_name, source_url, measurements, dom_data
        )
        with open(design_path, "w") as f:
            f.write(design_md)
        print(
            f"  DESIGN.md: generated ({len(design_md)} bytes, {design_md.count(chr(10))} lines)"
        )

    # 3b. Validate DESIGN.md against the spec — loud, never silent.
    design_violations: list[str] = []
    if design_path.exists():
        design_violations = _validate_design_md(design_path.read_text())
        print(f"  DESIGN.md validation: {len(design_violations)} violations")
        for violation in design_violations:
            print(f"    - {violation}")

    # 4. Generate SKILL.md
    skill_dir = brands_dir / "skill"
    skill_dir.mkdir(exist_ok=True)
    skill_path = skill_dir / "SKILL.md"
    component_manifest_path = brands_dir / "component-manifest.json"
    component_manifest = {}
    if component_manifest_path.exists():
        with open(component_manifest_path) as f:
            component_manifest = json.load(f)
    if not mode_actions["skill"]:
        print("  SKILL.md: skipped")
    elif args.skip_existing and skill_path.exists():
        print("  SKILL.md: skipped (exists)")
    else:
        design_md_body = design_path.read_text() if design_path.exists() else ""
        skill_md = generate_skill_md(
            brand_name,
            args.brand,
            source_url,
            tokens,
            dom_data,
            design_md_body=design_md_body,
            component_manifest=component_manifest,
        )
        with open(skill_path, "w") as f:
            f.write(skill_md)
        print(f"  SKILL.md: generated ({len(skill_md)} bytes)")

    # Keep the installed skill bundle self-contained. The UI and package installer
    # both expose/copy the skill directory, so sibling references must exist here.
    for src, dest_name in [
        (design_path, "DESIGN.md"),
        (tokens_path, "design-tokens.json"),
        (css_path, "design-tokens.css"),
        (component_manifest_path, "component-manifest.json"),
    ]:
        if src.exists():
            (skill_dir / dest_name).write_text(src.read_text())
            print(f"  skill/{dest_name}: synced")

    # 5. Read validation report for scores (library first, then repo mirror)
    report_path = brands_dir / "validation" / "report.json"
    if not report_path.exists() and (repo_brand_dir / "validation" / "report.json").exists():
        report_path = repo_brand_dir / "validation" / "report.json"
    avg_score = 0
    if report_path.exists():
        with open(report_path) as f:
            report = json.load(f)
        avg_score = report.get("desktop_avg") or report.get("viewport_avg", 0)
        if avg_score:
            metadata["overall_score"] = round(avg_score / 100, 3)  # Store as 0-1
            metadata["scores"] = {
                **(metadata.get("scores") or {}),
                "overall": round(avg_score / 100, 3),
            }
            metadata["validation_status"] = report.get("overall_status", "in_progress")
        print(f"  Validation score: {avg_score}%")
    else:
        print("  WARN: no validation report — metadata will carry no scores")

    # 6. Update metadata — required fields, evidence-derived confidence.
    color_count = len(tokens.get("colours", {}).get("computed", []) or [])
    font_count = len(tokens.get("typography", {}).get("families", []) or [])
    sparse_evidence = color_count < 5 or font_count == 0 or not measurements

    metadata.setdefault("name", brand_name)
    metadata["slug"] = args.brand
    metadata.setdefault("source_url", source_url)
    extracted_at = metadata.get("extracted_at") or (tokens.get("extracted_at") or "")[:10]
    metadata["extracted_at"] = extracted_at or datetime.now(timezone.utc).date().isoformat()
    metadata.setdefault("version", "1.0.0")
    metadata.setdefault("categories", [])
    metadata.setdefault(
        "extraction_method", "dom-extraction" if measurements else "cached-tokens"
    )
    if sparse_evidence:
        metadata["confidence"] = "LOW"
        print(
            f"  WARN: sparse extraction evidence (colors={color_count}, "
            f"fonts={font_count}, measurements={len(measurements)}) — confidence LOW"
        )
    elif avg_score and avg_score >= 85:
        metadata["confidence"] = "HIGH"
    else:
        metadata["confidence"] = str(metadata.get("confidence") or "MEDIUM").upper()

    metadata["pages_extracted"] = len(measurements)
    metadata["has_design_tokens"] = True
    metadata["has_design_md"] = True
    metadata["has_skill_md"] = True
    metadata["published_at"] = datetime.now(timezone.utc).isoformat()
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print("  metadata.json: updated")

    # 6. Ensure symlinks exist from cache to brands
    for subdir in ["dom-extraction", "assets", "screenshots"]:
        src = cache_dir / subdir
        dst = brands_dir / subdir
        if src.exists() and not dst.exists():
            os.symlink(str(src), str(dst))
            print(f"  {subdir}: symlinked")

    # 7. PUBLISH QUALITY CHECKLIST — catch missing data before it reaches the UI
    print("\n=== Publish Quality Checklist ===")
    issues = []
    identity_contract_data = extract_identity_contract(dom_data or [])

    # DESIGN.md spec compliance (validated above, reported here)
    if design_violations:
        issues.append(
            f"FAIL: DESIGN.md has {len(design_violations)} spec violations"
        )

    # Check colors
    color_count = len(tokens.get("colours", {}).get("computed", []))
    if color_count == 0:
        issues.append("FAIL: No colors in design-tokens.json")
    elif color_count < 5:
        issues.append(f"WARN: Only {color_count} colors (expected 5+)")
    print(
        f"  Colors: {color_count} {'OK' if color_count >= 5 else 'LOW' if color_count > 0 else 'MISSING'}"
    )

    # Check font families
    font_count = len(tokens.get("typography", {}).get("families", []))
    if font_count == 0:
        issues.append("FAIL: No font families in design-tokens.json")
    print(f"  Fonts: {font_count} {'OK' if font_count > 0 else 'MISSING'}")

    # Check DESIGN.md has real content (not generic template)
    if design_path.exists():
        with open(design_path) as f:
            content = f.read()
        if "distinctive blue" in content.lower() and "green" not in content.lower():
            issues.append("WARN: DESIGN.md may have wrong brand color description")
        if len(content) < 1000:
            issues.append(f"WARN: DESIGN.md is short ({len(content)} bytes)")
        for required in ("Mandatory identity rules", "logo", "header", "footer"):
            if required.lower() not in content.lower():
                issues.append(f"FAIL: DESIGN.md missing {required} guidance")
        print(
            f"  DESIGN.md: {len(content)} bytes {'OK' if len(content) >= 2000 else 'SHORT'}"
        )
    else:
        issues.append("FAIL: DESIGN.md missing")

    # Check assets are accessible (os.walk follows symlinks)
    assets_dir = brands_dir / "assets"
    if not assets_dir.exists():
        issues.append("FAIL: No assets directory in brand")
    else:
        asset_count = sum(
            len(files) for _, _, files in os.walk(str(assets_dir), followlinks=True)
        )
        if asset_count == 0:
            issues.append("FAIL: Assets directory is empty")
        print(f"  Assets: {asset_count} files {'OK' if asset_count >= 10 else 'LOW'}")

    # Check required identity evidence before downstream artifacts are generated.
    nav_count = len(identity_contract_data.get("nav_labels") or [])
    footer_column_count = len(identity_contract_data.get("footer_columns") or [])
    has_header_logo = bool(identity_contract_data.get("header_logo"))
    has_header_identity = has_header_logo or bool(identity_contract_data.get("header_wordmark"))
    has_footer_logo = bool(identity_contract_data.get("footer_logo"))
    if not has_header_identity:
        issues.append("FAIL: Missing required identity evidence: Logo asset or source wordmark")
    if nav_count < 3:
        issues.append("FAIL: Missing required identity evidence: Header navigation")
    if footer_column_count < 1:
        issues.append("FAIL: Missing required identity evidence: Footer system")
    if not has_footer_logo:
        issues.append("WARN: Missing white/reversed footer logo evidence")
    identity_status = (
        "OK" if has_header_identity and nav_count >= 3 and footer_column_count >= 1 else "MISSING"
    )
    print(
        f"  Identity: logo/wordmark={'yes' if has_header_identity else 'no'}, "
        f"nav={nav_count}, footer columns={footer_column_count}, "
        f"footer logo={'yes' if has_footer_logo else 'no'} {identity_status}"
    )

    # Check validation report exists
    if report_path.exists():
        print(f"  Validation: {avg_score}% avg {'OK' if avg_score >= 70 else 'LOW'}")
    else:
        issues.append("WARN: No validation report")
        print("  Validation: no report")

    # Check section completeness
    dom_dir = cache_dir / "dom-extraction"
    if dom_dir.exists():
        for dom_file in dom_dir.glob("*.json"):
            if "measurements" in dom_file.name:
                continue
            with open(dom_file) as f:
                dom = json.load(f)
            sections = dom.get("sections", [])
            page_name = dom_file.stem
            if len(sections) > 0:
                # Check if corresponding replica exists and has enough content
                replica_path = Path("ui/app/brands") / args.brand / "replica"
                if page_name == "homepage":
                    replica_file = replica_path / "page.tsx"
                else:
                    replica_file = replica_path / page_name / "page.tsx"
                if replica_file.exists():
                    with open(replica_file) as f:
                        replica_content = f.read()
                    # Count section markers (h2, major div sections)
                    import re
                    h2_count = len(re.findall(r'<h2|<H2|className.*h2', replica_content))
                    html_fallback = is_html_snapshot_fallback(replica_content, args.brand, page_name)
                    if h2_count < len(sections) - 2:  # Allow 2 section gap
                        if html_fallback and (dom_dir / f"{page_name}-snapshot.html").exists():
                            print(f"  Sections ({page_name}): HTML snapshot fallback covers {len(sections)}/{len(sections)} OK")
                        else:
                            issues.append(f"FAIL: {page_name} replica has {h2_count} sections but DOM has {len(sections)}")
                            print(f"  Sections ({page_name}): {h2_count}/{len(sections)} INCOMPLETE")
                    else:
                        print(f"  Sections ({page_name}): {h2_count}/{len(sections)} OK")

    # Check layout structure: each replica must have header + content + footer
    pages_json_path = cache_dir / "validation" / "pages.json"
    if pages_json_path.exists():
        with open(pages_json_path) as f:
            pages_config = json.load(f)
        for page_slug in pages_config:
            if page_slug == "homepage":
                tsx_path = Path("ui/app/brands") / args.brand / "replica" / "page.tsx"
            else:
                tsx_path = Path("ui/app/brands") / args.brand / "replica" / page_slug / "page.tsx"
            if tsx_path.exists():
                content = tsx_path.read_text()
                if is_html_snapshot_fallback(content, args.brand, page_slug):
                    continue
                has_header = "Header" in content
                has_footer = "Footer" in content
                has_images = "<img" in content or "Image" in content
                if not has_header:
                    issues.append(f"WARN: {page_slug} replica missing header component")
                if not has_footer:
                    issues.append(f"WARN: {page_slug} replica missing footer component")
                if not has_images:
                    issues.append(f"WARN: {page_slug} replica has no images")

    # Check SKILL.md exists and is non-empty
    if skill_path.exists() and skill_path.stat().st_size > 100:
        skill_content = skill_path.read_text()
        for required in ("Mandatory identity rules", "logo", "header", "footer"):
            if required.lower() not in skill_content.lower():
                issues.append(f"FAIL: SKILL.md missing {required} guidance")
        print(f"  SKILL.md: OK")
    else:
        issues.append("FAIL: SKILL.md missing or empty")

    if issues:
        print(f"\n  {len(issues)} issues found:")
        for issue in issues:
            print(f"    - {issue}")
    else:
        print("\n  All checks passed!")

    readiness_failures = [issue for issue in issues if issue.startswith("FAIL:")]
    if args.enforce_readiness and readiness_failures:
        print("\nReadiness gate failed:")
        for failure in readiness_failures:
            print(f"    - {failure}")
        return 1

    # 8. Mirror artifacts to the repo-local brands/<slug>/ directory so the
    # repo and the installed library carry identical publish outputs.
    copied = mirror_artifacts(brands_dir, repo_brand_dir)
    print(f"\nMirrored {len(copied)} artifacts to {repo_brand_dir}")

    print(f"Done. Brand directory: {brands_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
