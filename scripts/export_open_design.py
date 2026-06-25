#!/usr/bin/env python3
"""
Export extracted brands into open-design's consumable format.

open-design (https://github.com/.../open-design — local checkout at
~/Documents/github/open-design) consumes design systems as a single
9-section DESIGN.md per directory under <root>/design-systems/, parsed by
daemon/design-systems.js:

  - title    = first H1
  - category = `> Category: <name>` blockquote line
  - summary  = first paragraph between H1 and the next heading
  - swatches = `- **Name:** `#HEX`` bullets (Form A) and
               `**Name** (`#HEX`)` inline mentions (Form B)

This script converts a brand extracted by this pipeline (DESIGN.md with
YAML frontmatter, design-tokens.json, metadata.json, cached assets) into:

  brands/<slug>/open-design/DESIGN.md        9-section schema, no frontmatter
  brands/<slug>/open-design/skill/SKILL.md   od-format skill (mode: design-system)
  brands/<slug>/open-design/assets/          logo/favicon copies + README.md

`--install` copies the DESIGN.md into <open-design-root>/design-systems/
brand-<slug>/ and the skill into <open-design-root>/skills/brand-<slug>/.
`--check` runs a faithful Python port of open-design's parser against the
emitted file and fails if title/category/swatches do not round-trip.

Stdlib only. Values are derived from extraction artefacts, never invented;
gaps are reported as warnings and noted in the output as "not captured".
"""
from __future__ import annotations

import argparse
import importlib.util as _iutil
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OPEN_DESIGN_ROOT = Path("/Users/mehran/Documents/github/open-design")
DEFAULT_LIBRARY_ROOT = Path.home() / ".claude" / "design-library" / "brands"

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def _load_sibling(name: str):
    """Lazy loader for sibling scripts (avoids circular imports with the bundle)."""
    spec = _iutil.spec_from_file_location(name, Path(__file__).parent / f"{name}.py")
    mod = _iutil.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules.setdefault(name, mod)
    spec.loader.exec_module(mod)
    return mod


# The nine canonical section headings (open-design docs/design-systems.md §1).
# The bundle emitter renders them as `## N. <title>`; the daemon parser matches
# the `## [0-9].` prefix.
OPEN_DESIGN_SECTIONS = [
    "Visual Theme & Atmosphere",
    "Color",
    "Typography",
    "Spacing",
    "Layout & Composition",
    "Components",
    "Motion & Interaction",
    "Voice & Brand",
    "Anti-patterns",
]

# metadata.json `categories` slug -> open-design picker category label.
CATEGORY_LABELS = {
    "ai": "AI & Data",
    "data-analytics": "Data & Analytics",
    "developer-tools": "Developer Tools",
    "banking": "Banking & Finance",
    "financial-services": "Banking & Finance",
    "superannuation": "Banking & Finance",
    "big-four": "Banking & Finance",
    "retail": "Retail & Consumer",
    "supermarket": "Retail & Consumer",
    "grocery": "Retail & Consumer",
    "media": "Media & Entertainment",
    "advertising": "Media & Entertainment",
    "entertainment": "Media & Entertainment",
    "education": "Education",
    "events": "Education",
    "design": "Design & Creative",
    "framer": "Design & Creative",
    "research-report": "Research & Reports",
    "enterprise": "Enterprise",
    "corporate": "Enterprise",
    "b2b": "Enterprise",
    "government": "Government",
}

# Display names for frontmatter colour keys, chosen so open-design's swatch
# picker hints (background/surface, text/foreground, primary/accent,
# border/muted) match. Order here is emission order.
FRONTMATTER_COLOR_ROLES = [
    ("surface", "Background", "Page and card backgrounds"),
    ("on-surface", "Text", "Body text rendered on surface backgrounds"),
    ("primary", "Primary", "Primary actions, links, CTAs"),
    ("accent", "Accent", "Hover, highlight, secondary interactive states"),
    ("border", "Border", "Dividers, input outlines, separators"),
    ("muted", "Muted Surface", "Section fills, alternating rows, disabled states"),
    ("footer", "Footer", "Footer background and dark sections"),
]

TOKEN_REF_RE = re.compile(r"\{([a-zA-Z0-9_.-]+)\}")
HEX_RE = re.compile(r"^#[0-9A-Fa-f]{3,8}$")


# ---------------------------------------------------------------------------
# Minimal YAML subset parser (frontmatter is nested mappings of scalars only).
# ---------------------------------------------------------------------------

def _unquote(value: str) -> str:
    v = value.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in ("'", '"'):
        return v[1:-1]
    return v


def parse_simple_yaml(text: str) -> dict:
    """Parse the indentation-based mapping subset of YAML used by our
    DESIGN.md frontmatter. Lists and multi-line scalars are not supported
    (and not used by the emitter that writes these files)."""
    root: dict = {}
    stack: list[tuple[int, dict]] = [(-1, root)]
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if raw.lstrip().startswith("- "):
            continue  # lists unused in our frontmatter
        indent = len(raw) - len(raw.lstrip(" "))
        line = raw.strip()
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = _unquote(key)
        val = val.strip()
        while len(stack) > 1 and indent <= stack[-1][0]:
            stack.pop()
        parent = stack[-1][1]
        if val == "":
            child: dict = {}
            parent[key] = child
            stack.append((indent, child))
        else:
            parent[key] = _unquote(val)
    return root


def split_frontmatter(md_text: str) -> tuple[dict, str]:
    """Return (frontmatter dict, body) for a markdown file. Files without a
    leading `---` block return ({}, full text)."""
    lines = md_text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, md_text
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            fm = parse_simple_yaml("\n".join(lines[1:i]))
            return fm, "\n".join(lines[i + 1:])
    return {}, md_text


# ---------------------------------------------------------------------------
# Faithful Python port of open-design daemon/design-systems.js parsing.
# Used for --check round-trip validation and by tests.
# ---------------------------------------------------------------------------

def od_normalize_hex(raw: str) -> str | None:
    if not isinstance(raw, str):
        return None
    m = re.match(r"^#([0-9a-fA-F]{3,8})$", raw.strip())
    if not m:
        return None
    hexpart = m.group(1)
    if len(hexpart) == 3:
        hexpart = "".join(c + c for c in hexpart)
    if len(hexpart) == 4:
        hexpart = "".join(c + c for c in hexpart)[:8]
    return "#" + hexpart.lower()


def od_clean_title(raw: str) -> str:
    return re.sub(r"^Design System (Inspired by|for)\s+", "", raw, flags=re.I).strip()


def od_extract_title(raw: str, fallback: str = "") -> str:
    m = re.search(r"^#\s+(.+?)\s*$", raw, flags=re.M)
    return od_clean_title(m.group(1) if m else fallback)


def od_extract_category(raw: str) -> str | None:
    m = re.search(r"^>\s*Category:\s*(.+?)\s*$", raw, flags=re.I | re.M)
    return m.group(1) if m else None


def od_summarize(raw: str) -> str:
    lines = re.split(r"\r?\n", raw)
    first_h1 = next((i for i, l in enumerate(lines) if re.match(r"^#\s+", l)), -1)
    if first_h1 == -1:
        return ""
    after = lines[first_h1 + 1:]
    next_heading = next(
        (i for i, l in enumerate(after) if re.match(r"^#{1,6}\s+", l)), -1
    )
    window = "\n".join(after if next_heading == -1 else after[:next_heading])
    window = re.sub(r"^>\s*Category:.*$", "", window, flags=re.I | re.M)
    window = re.sub(r"^>\s*", "", window, flags=re.M).strip()
    parts = window.split("\n\n")
    return parts[0][:240] if parts else ""


def od_extract_swatches(raw: str) -> list[str]:
    """Port of extractSwatches: up to 4 hex strings [bg, support, fg, accent],
    [] if no colour bullets found."""
    colors: list[dict] = []
    seen: set[str] = set()

    def push(name: str, value: str) -> None:
        clean_name = re.sub(r"[*_`]+", "", name)
        clean_name = re.sub(r"\s+", " ", clean_name).strip().lower()
        v = od_normalize_hex(value)
        if not v or len(clean_name) > 60:
            return
        key = f"{clean_name}|{v}"
        if key in seen:
            return
        seen.add(key)
        colors.append({"name": clean_name, "value": v})

    re_a = re.compile(
        r"^[\s>*-]*\**\s*([A-Za-z][A-Za-z0-9 /&()+_-]{1,40}?)\s*\**\s*[:：]\s*`?(#[0-9a-fA-F]{3,8})",
        re.M,
    )
    for m in re_a.finditer(raw):
        push(m.group(1), m.group(2))
    re_b = re.compile(
        r"\*\*([A-Za-z][A-Za-z0-9 /&()+_-]{1,40}?)\*\*\s*\(?\s*`?(#[0-9a-fA-F]{3,8})"
    )
    for m in re_b.finditer(raw):
        push(m.group(1), m.group(2))
    if not colors:
        return []

    def pick(hints: list[str]) -> str | None:
        for h in hints:
            for c in colors:
                if h in c["name"]:
                    return c["value"]
        return None

    def is_neutral(hexv: str) -> bool:
        if not re.match(r"^#[0-9a-f]{6}$", hexv):
            return False
        r = int(hexv[1:3], 16)
        g = int(hexv[3:5], 16)
        b = int(hexv[5:7], 16)
        return max(r, g, b) - min(r, g, b) < 10

    bg = pick(["page background", "background", "canvas", "paper", "surface"]) or "#ffffff"
    fg = pick(["heading", "foreground", "ink", "fg", "text", "navy", "graphite"]) or "#111111"
    accent = (
        pick(["primary brand", "brand primary", "accent", "brand", "primary"])
        or next((c["value"] for c in colors if not is_neutral(c["value"])), None)
        or (colors[0]["value"] if colors else None)
        or "#888888"
    )
    support = (
        pick(["border", "divider", "rule", "muted", "secondary", "subtle"])
        or next(
            (
                c["value"]
                for c in colors
                if is_neutral(c["value"]) and c["value"] != bg and c["value"] != fg
            ),
            None,
        )
        or "#cccccc"
    )
    return [bg, support, fg, accent]


def parse_open_design_md(raw: str, fallback_title: str = "") -> dict:
    """Parse a DESIGN.md exactly the way open-design's daemon does."""
    return {
        "title": od_extract_title(raw, fallback_title),
        "category": od_extract_category(raw) or "Uncategorized",
        "summary": od_summarize(raw),
        "swatches": od_extract_swatches(raw),
    }


# ---------------------------------------------------------------------------
# Brand data loading
# ---------------------------------------------------------------------------

def _read_json(path: Path) -> dict | list | None:
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None


def _rgb_to_hex(value: str) -> str | None:
    m = re.match(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", value)
    if not m:
        return None
    return "#{:02X}{:02X}{:02X}".format(*(int(g) for g in m.groups()))


def _to_hex(value: str) -> str | None:
    if not isinstance(value, str):
        return None
    v = value.strip()
    if v.startswith("rgb"):
        return _rgb_to_hex(v)
    if HEX_RE.match(v):
        clean = v.lstrip("#")
        if len(clean) == 3:
            clean = "".join(c * 2 for c in clean)
        if len(clean) >= 6:
            return "#" + clean[:6].upper()
    return None


def _humanize(role: str) -> str:
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", role)
    s = s.replace("_", " ").replace("-", " ").strip()
    return " ".join(w.capitalize() for w in s.split())


def _split_body_sections(body: str) -> dict[str, str]:
    """Split markdown body into {normalized-h2-title: content} sections."""
    sections: dict[str, str] = {}
    current: str | None = None
    buf: list[str] = []
    for line in body.splitlines():
        m = re.match(r"^##\s+(.+?)\s*$", line)
        if m:
            if current is not None:
                sections[current] = "\n".join(buf).strip()
            title = re.sub(r"^\d+\.\s*", "", m.group(1)).strip().lower()
            current = title
            buf = []
        elif current is not None:
            buf.append(line)
    if current is not None:
        sections[current] = "\n".join(buf).strip()
    return sections


_SECTION_ALIASES = {
    "theme": ["overview", "visual theme & atmosphere", "visual theme and atmosphere"],
    "colors": [
        "colors", "colours", "color palette & roles", "colour palette & roles",
    ],
    "typography": ["typography", "typography rules"],
    "layout": ["layout", "layout principles"],
    "depth": ["elevation & depth", "depth & elevation"],
    "shapes": ["shapes"],
    "components": [
        "components", "component stylings", "component patterns",
        "buttons & interactive elements",
    ],
    "dos": ["do's and don'ts", "dos and don'ts"],
    "responsive": ["responsive behavior", "responsive behaviour"],
    "agent": ["agent prompt guide"],
    "identity": ["mandatory identity rules"],
    "provenance": ["provenance"],
}


def _section(sections: dict[str, str], key: str) -> str:
    for alias in _SECTION_ALIASES.get(key, []):
        if alias in sections:
            return sections[alias]
    return ""


def load_brand_data(
    slug: str,
    brands_dir: Path,
    library_dir: Path,
    cache_dir: Path,
) -> dict:
    """Gather everything we know about a brand from repo brands/, the
    installed design library, and the extraction cache. Absent files are
    tolerated; the result records which sources were found."""
    sources: list[str] = []
    data: dict = {
        "slug": slug,
        "name": None,
        "source_url": None,
        "extracted_at": None,
        "categories": [],
        "frontmatter": {},
        "sections": {},
        "tokens": None,
        "philosophy": None,
        "asset_dirs": [],
        "sources": sources,
        "warnings": [],
    }

    candidate_roots = [brands_dir / slug, library_dir / slug]
    for root in candidate_roots:
        if not root.is_dir():
            continue
        meta = _read_json(root / "metadata.json")
        if isinstance(meta, dict):
            data["name"] = data["name"] or meta.get("name")
            data["source_url"] = data["source_url"] or meta.get("source_url")
            data["extracted_at"] = data["extracted_at"] or meta.get("extracted_at")
            if not data["categories"]:
                data["categories"] = meta.get("categories") or []
            sources.append(str(root / "metadata.json"))
        design_md = root / "DESIGN.md"
        if design_md.is_file() and not data["sections"]:
            fm, body = split_frontmatter(design_md.read_text())
            data["frontmatter"] = fm
            data["sections"] = _split_body_sections(body)
            if not data["name"]:
                m = re.search(r"^#\s+(.+?)\s*$", body, flags=re.M)
                if m:
                    data["name"] = re.sub(
                        r"\s+Design System$", "", m.group(1), flags=re.I
                    )
            sources.append(str(design_md))
        tokens = _read_json(root / "design-tokens.json")
        if isinstance(tokens, dict) and data["tokens"] is None:
            data["tokens"] = tokens
            sources.append(str(root / "design-tokens.json"))
        for sub in ("validation/philosophy-classification.json",):
            phil = _read_json(root / sub)
            if isinstance(phil, dict) and data["philosophy"] is None:
                data["philosophy"] = phil
                sources.append(str(root / sub))
        assets = root / "assets"
        if assets.is_dir():
            data["asset_dirs"].append(assets)

    cache_assets = cache_dir / slug / "assets"
    if cache_assets.is_dir():
        data["asset_dirs"].append(cache_assets)

    if not data["name"]:
        data["name"] = slug.replace("-", " ").title()
        data["warnings"].append("brand name not captured; derived from slug")
    if isinstance(data["tokens"], dict):
        tok = data["tokens"]
        data["source_url"] = data["source_url"] or tok.get("url") or None
        data["extracted_at"] = data["extracted_at"] or tok.get("extracted_at")
    return data


# ---------------------------------------------------------------------------
# Token reference resolution and palette derivation
# ---------------------------------------------------------------------------

def resolve_refs(text: str, frontmatter: dict) -> str:
    """Replace `{colors.primary}`-style refs with their frontmatter values,
    then collapse `value (value)` duplication the substitution creates."""

    def repl(m: re.Match) -> str:
        node: object = frontmatter
        for part in m.group(1).split("."):
            if isinstance(node, dict) and part in node:
                node = node[part]
            else:
                return m.group(0)
        if isinstance(node, dict):
            node = node.get("fontFamily") or node.get("value") or m.group(0)
        return str(node)

    out = TOKEN_REF_RE.sub(repl, text)
    out = re.sub(r"`([^`]+)` \(`\1`\)", r"`\1`", out)
    out = re.sub(r"`([^`]+)` \(\1\)", r"`\1`", out)
    return out


def _palette_from_frontmatter(fm: dict) -> list[tuple[str, str, str]]:
    colors = fm.get("colors")
    if not isinstance(colors, dict):
        return []
    palette: list[tuple[str, str, str]] = []
    used: set[str] = set()
    for key, display, usage in FRONTMATTER_COLOR_ROLES:
        hexv = _to_hex(str(colors.get(key, "")))
        if hexv:
            palette.append((display, hexv, usage))
            used.add(key)
    for key, value in colors.items():
        if key in used:
            continue
        hexv = _to_hex(str(value))
        if hexv:
            palette.append((_humanize(key), hexv, ""))
    return palette


def _luminance(hexv: str) -> float:
    r = int(hexv[1:3], 16) / 255
    g = int(hexv[3:5], 16) / 255
    b = int(hexv[5:7], 16) / 255
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _is_neutralish(hexv: str) -> bool:
    r = int(hexv[1:3], 16)
    g = int(hexv[3:5], 16)
    b = int(hexv[5:7], 16)
    return max(r, g, b) - min(r, g, b) < 16


_ROLE_BASE_NAMES = {"bg": "Background", "text": "Text"}


def _palette_from_stage_tokens(tokens: dict) -> list[tuple[str, str, str]]:
    colours = tokens.get("colours") or tokens.get("colors") or {}
    entries = colours.get("computed") if isinstance(colours, dict) else None
    if not isinstance(entries, list):
        return []
    ranked = sorted(
        (e for e in entries if isinstance(e, dict)),
        key=lambda e: (
            0 if e.get("confidence") == "HIGH" else 1,
            -int(e.get("count") or 0),
        ),
    )
    palette: list[tuple[str, str, str]] = []
    seen_names: set[str] = set()
    seen_hex: set[str] = set()
    by_base: dict[str, list[tuple[str, int]]] = {}
    inference_pool: list[tuple[str, int]] = []  # (hex, count) for surplus values

    for entry in ranked:
        hexv = _to_hex(str(entry.get("value") or ""))
        if not hexv:
            continue
        count = int(entry.get("count") or 0)
        role = str(entry.get("role") or "")
        # Roles like "text_rgb(0, 0, 0)" carry only the base role as signal.
        base = re.sub(r"_?rgba?\(.*$", "", role).strip("_")
        if not base:
            inference_pool.append((hexv, count))
            continue
        by_base.setdefault(base, []).append((hexv, count))

    for base, values in by_base.items():
        name = _ROLE_BASE_NAMES.get(base, _humanize(base))
        # Section-level roles repeat with many distinct values (e.g. one
        # orange `bg` for a banner). Pick the measured value that best fits
        # the base role; the rest stay available for accent/muted inference.
        if base in ("bg", "backgrounds", "background"):
            neutrals = [h for h, _ in values if _is_neutralish(h)]
            chosen = max(neutrals, key=_luminance) if neutrals else values[0][0]
        elif base == "text":
            chosen = min((h for h, _ in values), key=_luminance)
        else:
            chosen = values[0][0]
        inference_pool.extend((h, c) for h, c in values if h != chosen)
        if name.lower() in seen_names or chosen in seen_hex:
            continue
        seen_names.add(name.lower())
        seen_hex.add(chosen)
        palette.append((name, chosen, "Extracted from computed styles"))
        if len(palette) >= 10:
            break

    if len(palette) < 4 and inference_pool:
        palette.extend(
            _infer_palette_roles(inference_pool, seen_names, seen_hex)
        )
    return palette


def _infer_palette_roles(
    pool: list[tuple[str, int]],
    seen_names: set[str],
    seen_hex: set[str],
) -> list[tuple[str, str, str]]:
    """Infer background/text/accent/muted from measured colour frequency and
    luminance when the extractor recorded values without role labels. The
    inference basis is stated in the usage text — these are derived, not
    fabricated, values."""
    # Aggregate counts per hex, preserve highest-count ordering.
    counts: dict[str, int] = {}
    for hexv, count in pool:
        counts[hexv] = counts.get(hexv, 0) + max(count, 1)
    ranked = sorted(counts.items(), key=lambda kv: -kv[1])
    neutrals = [h for h, _ in ranked if _is_neutralish(h)]
    chromatic = [h for h, _ in ranked if not _is_neutralish(h)]
    usage = "Role inferred from computed-style frequency and luminance"

    candidates: list[tuple[str, str | None]] = [
        ("Background", max(neutrals, key=_luminance, default=None)),
        ("Text", min(neutrals, key=_luminance, default=None)),
        ("Accent", chromatic[0] if chromatic else None),
    ]
    inferred: list[tuple[str, str, str]] = []
    for name, hexv in candidates:
        if not hexv or name.lower() in seen_names or hexv in seen_hex:
            continue
        seen_names.add(name.lower())
        seen_hex.add(hexv)
        inferred.append((name, hexv, usage))
    mid = next(
        (h for h in neutrals if h not in seen_hex and 0.2 < _luminance(h) < 0.9),
        None,
    )
    if mid and "muted" not in seen_names:
        inferred.append(("Muted", mid, usage))
    return inferred


def _palette_from_dtcg(tokens: dict) -> list[tuple[str, str, str]]:
    palette: list[tuple[str, str, str]] = []

    def walk(node: object, path: list[str]) -> None:
        if not isinstance(node, dict):
            return
        if "$value" in node:
            hexv = _to_hex(str(node["$value"]))
            if hexv:
                palette.append((_humanize(" ".join(path)), hexv, ""))
            return
        for k, v in node.items():
            if str(k).startswith("$"):
                continue
            walk(v, path + [str(k)])

    colour_tree = tokens.get("color") or tokens.get("colour") or {}
    # Stage-format files also use a "colours" dict but without $value leaves;
    # the walk simply finds nothing there, which is the desired behaviour.
    walk(colour_tree, [])
    return palette[:12]


def derive_palette(data: dict) -> list[tuple[str, str, str]]:
    """Ordered (display name, #HEX, usage) tuples from the richest available
    source. Deduplicated by (name, value)."""
    palette = _palette_from_frontmatter(data.get("frontmatter") or {})
    tokens = data.get("tokens")
    if isinstance(tokens, dict):
        if not palette:
            palette = _palette_from_dtcg(tokens) or _palette_from_stage_tokens(tokens)
        else:
            extra = _palette_from_stage_tokens(tokens)
            have = {(n.lower(), v.lower()) for n, v, _ in palette}
            have_hex = {v.lower() for _, v, _ in palette}
            for name, hexv, usage in extra:
                if (name.lower(), hexv.lower()) in have or hexv.lower() in have_hex:
                    continue
                palette.append((name, hexv, usage))
                have_hex.add(hexv.lower())
                if len(palette) >= 12:
                    break
    deduped: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str]] = set()
    for name, hexv, usage in palette:
        key = (name.lower(), hexv.lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append((name, hexv, usage))
    return deduped


def _typography_entries(data: dict) -> list[tuple[str, dict]]:
    fm_typo = (data.get("frontmatter") or {}).get("typography")
    entries: list[tuple[str, dict]] = []
    if isinstance(fm_typo, dict):
        for role, spec in fm_typo.items():
            if isinstance(spec, dict):
                entries.append((role, spec))
    if entries:
        return entries
    tokens = data.get("tokens")
    if isinstance(tokens, dict):
        typo = tokens.get("typography")
        if isinstance(typo, dict):
            for fam in typo.get("families") or []:
                if isinstance(fam, dict) and fam.get("value"):
                    entries.append(
                        (str(fam.get("role") or "font"), {"fontFamily": fam["value"]})
                    )
    return entries


# ---------------------------------------------------------------------------
# DESIGN.md rendering (open-design 9-section schema)
# ---------------------------------------------------------------------------

def derive_category(data: dict) -> str:
    for cat in data.get("categories") or []:
        label = CATEGORY_LABELS.get(str(cat).lower())
        if label:
            return label
    cats = data.get("categories") or []
    if cats:
        return _humanize(str(cats[0]))
    return "Extracted Brand"


def _first_paragraph(text: str) -> str:
    for chunk in re.split(r"\n\s*\n", text.strip()):
        chunk = chunk.strip()
        if chunk and not chunk.startswith(("#", "|", "```", ">", "-", "*")):
            return chunk
    return ""


def _bullets(text: str) -> list[str]:
    return [
        re.sub(r"^[-*]\s+", "", ln.strip())
        for ln in text.splitlines()
        if ln.strip().startswith(("- ", "* "))
    ]


def _vibe_keywords(theme_text: str) -> str:
    m = re.search(r"\*\*Vibe keywords:\*\*\s*(.+)", theme_text)
    return m.group(1).strip() if m else ""


def _philosophy_line(data: dict) -> str:
    phil = data.get("philosophy")
    if isinstance(phil, dict):
        top = phil.get("top3") or []
        if top and isinstance(top[0], dict) and top[0].get("name"):
            best = top[0]
            sim = best.get("similarity")
            sim_txt = f" (similarity {sim:.2f})" if isinstance(sim, (int, float)) else ""
            return (
                f"Nearest design philosophy: {best['name']}{sim_txt}, "
                f"classified from the extracted token profile."
            )
    prov = _section(data.get("sections") or {}, "provenance")
    m = re.search(r"Nearest philosophy\s*\|\s*([^|]+)\|", prov)
    if m:
        return f"Nearest design philosophy: {m.group(1).strip()}."
    return ""


def render_summary(data: dict, palette: list[tuple[str, str, str]]) -> str:
    name = data["name"]
    theme = resolve_refs(
        _section(data["sections"], "theme"), data.get("frontmatter") or {}
    )
    vibe = _vibe_keywords(theme)
    accent = next(
        (v for n, v, _ in palette if n.lower() in ("primary", "accent")), None
    )
    typo = _typography_entries(data)
    display_font = next(
        (
            spec.get("fontFamily")
            for role, spec in typo
            if role in ("display", "heading") and spec.get("fontFamily")
        ),
        None,
    )
    bits = [f"{name} design system extracted from {data.get('source_url') or 'a live site'}."]
    if vibe:
        bits.append(f"Voice: {vibe}.")
    if accent:
        bits.append(f"Primary accent `{accent}`")
        if display_font:
            bits[-1] += f" with {display_font} display type."
        else:
            bits[-1] += "."
    elif display_font:
        bits.append(f"Display type: {display_font}.")
    return " ".join(bits)


def _render_theme(data: dict) -> str:
    fm = data.get("frontmatter") or {}
    theme = resolve_refs(_section(data["sections"], "theme"), fm)
    para = _first_paragraph(theme)
    lines: list[str] = []
    if para:
        lines.append(para)
    vibe = _vibe_keywords(theme)
    if vibe:
        lines.append(f"\n**Vibe keywords:** {vibe}")
    sig = re.search(r"\*\*Signature detail:\*\*\s*((?:.+\n?)+?)(?:\n\s*\n|\Z)", theme)
    if sig:
        lines.append(f"\n**Signature detail:** {' '.join(sig.group(1).split())}")
    phil = _philosophy_line(data)
    if phil:
        lines.append(f"\n{phil}")
    if not lines:
        lines.append(
            "Visual theme narrative was not captured during extraction. "
            "Rely on the measured palette, typography, and component values below."
        )
    return "\n".join(lines)


def _render_palette(palette: list[tuple[str, str, str]]) -> str:
    # Bullet shape matters: open-design's swatch regexes (daemon/
    # design-systems.js) do NOT match `- **Name:** #hex` (colon inside the
    # bold), which is why the bundled "default" system parses to zero
    # swatches. The `**Name** (`#hex`)` form used by stripe/airbnb matches
    # Form B, so that is what we emit.
    if not palette:
        return "No colour values were captured during extraction."
    lines = []
    for name, hexv, usage in palette:
        suffix = f": {usage}" if usage else ""
        lines.append(f"- **{name}** (`{hexv}`){suffix}")
    lines.append("")
    lines.append(
        "Do not introduce colours outside this palette without an explicit "
        "token addition and design rationale."
    )
    return "\n".join(lines)


def _render_typography(data: dict) -> str:
    entries = _typography_entries(data)
    if not entries:
        return "No typography values were captured during extraction."
    lines: list[str] = []
    for role, spec in entries:
        family = spec.get("fontFamily") or "not captured"
        lines.append(f"### {role.capitalize()}")
        lines.append(f"- **Font family:** `{family}`")
        for key, label in (
            ("fontSize", "Size"),
            ("fontWeight", "Weight"),
            ("lineHeight", "Line height"),
            ("letterSpacing", "Letter spacing"),
        ):
            if spec.get(key):
                lines.append(f"- **{label}:** {spec[key]}")
        lines.append("")
    tokens = data.get("tokens")
    if isinstance(tokens, dict):
        typo = tokens.get("typography")
        if isinstance(typo, dict):
            sizes = [s.get("value") for s in typo.get("sizes") or [] if isinstance(s, dict)]
            sizes = [s for s in sizes if s]
            if sizes:
                lines.append(f"Observed size scale: {' · '.join(sizes)}")
            weights = [
                w.get("value") for w in typo.get("weights") or [] if isinstance(w, dict)
            ]
            weights = [w for w in weights if w]
            if weights:
                lines.append(f"Observed weights: {', '.join(weights)}")
    lines.append(
        "Do not use the display font for body copy or the body font for "
        "primary headings."
    )
    return "\n".join(lines).strip()


def _render_components(data: dict) -> str:
    fm = data.get("frontmatter") or {}
    components = fm.get("components")
    lines: list[str] = []
    if isinstance(components, dict) and components:
        for comp, spec in components.items():
            lines.append(f"### {_humanize(comp)}")
            if isinstance(spec, dict):
                for prop, value in spec.items():
                    resolved = resolve_refs(str(value), fm)
                    lines.append(f"- **{_humanize(prop)}:** `{resolved}`")
            lines.append("")
        return "\n".join(lines).strip()
    body = resolve_refs(_section(data["sections"], "components"), fm)
    if body:
        return body
    return "No component stylings were captured during extraction."


def _render_layout(data: dict) -> str:
    fm = data.get("frontmatter") or {}
    body = resolve_refs(_section(data["sections"], "layout"), fm)
    if body:
        return body
    tokens = data.get("tokens")
    lines: list[str] = []
    if isinstance(tokens, dict):
        spacing = tokens.get("spacing")
        if isinstance(spacing, dict):
            if spacing.get("max_width"):
                lines.append(f"- **Max content width:** `{spacing['max_width']}`")
            if spacing.get("content_padding") is not None:
                lines.append(f"- **Horizontal padding:** `{spacing['content_padding']}`")
            if spacing.get("detected_base_unit"):
                lines.append(f"- **Base spacing unit:** `{spacing['detected_base_unit']}`")
            scale = spacing.get("scale")
            if isinstance(scale, list) and scale:
                lines.append(f"- **Spacing scale:** {' · '.join(map(str, scale))}")
        bps = tokens.get("breakpoints")
        if isinstance(bps, list) and bps:
            lines.append(f"- **Breakpoints:** {', '.join(f'{b}px' for b in bps)}")
    if not lines:
        return "No layout measurements were captured during extraction."
    return "\n".join(lines)


def _render_depth(data: dict) -> str:
    fm = data.get("frontmatter") or {}
    body = resolve_refs(_section(data["sections"], "depth"), fm)
    if body:
        return body
    tokens = data.get("tokens")
    shadows = tokens.get("shadows") if isinstance(tokens, dict) else None
    if isinstance(shadows, list) and shadows:
        lines = ["Observed shadow values:"]
        for s in shadows[:6]:
            value = s.get("value") if isinstance(s, dict) else s
            if value:
                lines.append(f"- `{value}`")
        return "\n".join(lines)
    return (
        "No shadow values were captured during extraction; treat the system "
        "as flat and express depth with surface-colour contrast."
    )


def _split_dos_donts(data: dict) -> tuple[list[str], list[str]]:
    fm = data.get("frontmatter") or {}
    body = resolve_refs(_section(data["sections"], "dos"), fm)
    dos: list[str] = []
    donts: list[str] = []
    current: list[str] | None = None
    for line in body.splitlines():
        m = re.match(r"^###\s+(.+?)\s*$", line)
        if m:
            title = m.group(1).strip().lower()
            current = dos if title.startswith("do") and "don" not in title else donts
            continue
        if line.strip().startswith(("- ", "* ")) and current is not None:
            current.append(re.sub(r"^[-*]\s+", "", line.strip()))
    return dos, donts


def _render_dos_donts(data: dict, palette: list[tuple[str, str, str]]) -> str:
    dos, donts = _split_dos_donts(data)
    if not dos and not donts:
        # Fall back to rules grounded in the measured tokens only.
        accent = next(
            (v for n, v, _ in palette if n.lower() in ("primary", "accent")), None
        )
        if accent:
            dos.append(f"Use `{accent}` for primary actions and interactive accents")
        dos.append("Use only colours documented in the palette above")
        donts.append("Do not invent hex values outside the documented palette")
        donts.append("Do not use emoji as icon elements (SVG/Lucide icons only)")
    lines = [f"- ✅ {d}" for d in dos] + [f"- ❌ {d}" for d in donts]
    return "\n".join(lines)


def _render_responsive(data: dict) -> str:
    fm = data.get("frontmatter") or {}
    body = resolve_refs(_section(data["sections"], "responsive"), fm)
    if body:
        return body
    tokens = data.get("tokens")
    bps = tokens.get("breakpoints") if isinstance(tokens, dict) else None
    layout = _section(data["sections"], "layout")
    lines: list[str] = []
    if isinstance(bps, list) and bps:
        lines.append("Observed breakpoints:")
        for b in bps:
            lines.append(f"- `{b}px`")
    grid = re.search(r"\*\*Grid:\*\*\s*(.+)", layout)
    if grid:
        lines.append(f"\nGrid collapse: {grid.group(1).strip()}")
    if not lines:
        return "No responsive measurements were captured during extraction."
    return "\n".join(lines)


def _render_agent_guide(data: dict, palette: list[tuple[str, str, str]]) -> str:
    fm = data.get("frontmatter") or {}
    lines: list[str] = ["### Quick color reference"]
    for name, hexv, _ in palette[:10]:
        lines.append(f"- {name}: `{hexv}`")
    body = resolve_refs(_section(data["sections"], "agent"), fm)
    if body:
        lines.append("")
        lines.append("### Generation rules")
        lines.append(body)
    identity = resolve_refs(_section(data["sections"], "identity"), fm)
    identity_bullets = [
        b for b in _bullets(identity)
        if "not captured" not in b.lower()
    ]
    if identity_bullets:
        lines.append("")
        lines.append("### Mandatory identity rules")
        for b in identity_bullets[:8]:
            lines.append(f"- {b}")
    return "\n".join(lines)


def render_design_md(data: dict, measured=None) -> str:
    """Delegate to the v1 bundle emitter's canonical 9-section renderer.

    ``export_brand`` reads the emitted ``DESIGN.md`` straight from the bundle;
    this wrapper is kept for any standalone caller. ``measured`` may be a
    ``MeasuredTokens``, a provenance dict, or ``None`` (empty).
    """
    bds = _load_sibling("build_design_system_bundle")
    if measured is None:
        mt = bds.MeasuredTokens({})
    elif isinstance(measured, bds.MeasuredTokens):
        mt = measured
    else:
        mt = bds.MeasuredTokens(measured or {})
    return bds.render_design_md(data, mt)


# ---------------------------------------------------------------------------
# SKILL.md rendering (open-design od: extensions)
# ---------------------------------------------------------------------------

def render_skill_md(data: dict) -> str:
    slug = data["slug"]
    name = data["name"]
    palette = derive_palette(data)
    typo = _typography_entries(data)
    source = data.get("source_url") or "the extracted source site"
    accent = next(
        (v for n, v, _ in palette if n.lower() in ("primary", "accent")), None
    )
    accent_txt = f" anchored by `{accent}`" if accent else ""

    description = (
        f"Apply {name}'s extracted design system{accent_txt} when generating "
        f"artifacts (prototypes, decks, pages) that must match the {name} "
        f"brand. Trigger keywords: \"{name} brand\", \"{name} design system\", "
        f"\"{name} style\", \"match {source}\", \"on-brand for {name}\". "
        f"Do NOT trigger for questions about {name}'s products, services, "
        f"APIs, or business operations unrelated to visual identity."
    )

    lines = [
        "---",
        f"name: brand-{slug}",
        "description: |",
    ]
    lines += [f"  {chunk}" for chunk in _wrap(description, 76)]
    lines += [
        "triggers:",
        f'  - "{name} brand"',
        f'  - "{name} design system"',
        f'  - "{name} style"',
        f'  - "brand-{slug}"',
        "od:",
        "  mode: design-system",
        "  preview:",
        "    type: html",
        "  design_system:",
        "    requires: true",
        "    sections: [color, typography, layout, components]",
        "---",
        "",
        f"# {name} — brand design-system skill",
        "",
        f"Generated by design-extractor from {source}. The authoritative token",
        f"set lives in the sibling `DESIGN.md` (design system `brand-{slug}`).",
        "",
        "## How to apply this brand",
        "",
        f"1. Read the active `DESIGN.md` for `brand-{slug}` before writing any markup.",
        "2. Use only documented palette colours. Key values:",
    ]
    for n, hexv, _ in palette[:8]:
        lines.append(f"   - {n}: `{hexv}`")
    if typo:
        lines.append("3. Typography:")
        for role, spec in typo[:4]:
            fam = spec.get("fontFamily")
            if fam:
                lines.append(f"   - {role.capitalize()}: `{fam}`")
    lines += [
        "4. Component rules: follow the Component Stylings section of DESIGN.md",
        "   verbatim — radius, padding, and colour pairings are measured values,",
        "   not suggestions.",
        "5. Voice guardrails:",
        "   - No emoji as icons; use inline SVG or icon-font glyphs.",
        "   - Do not invent hex values, fonts, or shadows absent from DESIGN.md.",
        "   - Preserve extracted header/footer/navigation content where the",
        "     Agent Prompt Guide lists mandatory identity rules.",
        "6. Self-check before finishing: every CSS colour traces to the palette,",
        "   headings use the display font, body uses the body font, and the",
        "   layout respects the documented max-width and breakpoints.",
        "",
    ]
    return "\n".join(lines)


def _wrap(text: str, width: int) -> list[str]:
    words = text.split()
    out: list[str] = []
    cur = ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > width:
            out.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        out.append(cur)
    return out


# ---------------------------------------------------------------------------
# Asset bundling
# ---------------------------------------------------------------------------

ASSET_EXTS = {".svg", ".png", ".ico"}


def copy_assets(data: dict, assets_out: Path) -> list[str]:
    """Copy logo/favicon files found in the brand's asset dirs. Returns the
    list of copied file names."""
    copied: list[str] = []
    seen: set[str] = set()
    for asset_dir in data.get("asset_dirs") or []:
        try:
            entries = sorted(asset_dir.iterdir())
        except OSError:
            continue
        for f in entries:
            if not f.is_file() or f.suffix.lower() not in ASSET_EXTS:
                continue
            lower = f.name.lower()
            if "logo" not in lower and "favicon" not in lower:
                continue
            if f.name in seen or len(copied) >= 8:
                continue
            assets_out.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, assets_out / f.name)
            seen.add(f.name)
            copied.append(f.name)
    return copied


def _write_assets_readme(slug: str, names: list[str], assets_out: Path) -> None:
    """Write the assets/README.md listing the bundled logo/identity files."""
    readme = (
        "# Bundled brand assets\n\n"
        f"Logo, favicon, and identity files for `{slug}`, copied from the "
        "extraction cache and the replica components.\n\n"
        "open-design design systems are markdown-only today; these are bundled "
        "so skills and tools can reference the real brand logo files instead of "
        "fabricating wordmarks.\n\n"
        + "\n".join(f"- `{name}`" for name in names)
        + "\n"
    )
    assets_out.mkdir(parents=True, exist_ok=True)
    (assets_out / "README.md").write_text(readme)


def _sniff_ext(path: Path) -> str:
    """Best-effort file extension from magic bytes (brand assets are stored
    content-hashed without extensions)."""
    try:
        head = path.read_bytes()[:512]
    except OSError:
        return ""
    if head[:4] == b"\x89PNG":
        return ".png"
    if head[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    if head[:4] == b"RIFF" and b"WEBP" in head[:16]:
        return ".webp"
    if head[:4] == b"\x00\x00\x01\x00":
        return ".ico"
    lowered = head[:256].lower()
    if head[:5] == b"<?xml" or b"<svg" in lowered:
        return ".svg"
    return ""


def copy_identity_assets(slug: str, repo_root: Path, assets_out: Path) -> list[str]:
    """Copy the brand's logo/identity assets into the bundle.

    For React-replica brands the real logos are content-hashed files referenced
    by the logo/header/footer components (never named "logo*"), so a name-based
    scan misses them. This reads those components, resolves each
    `/brands/<slug>/<hash>` reference to the served public file, sniffs its real
    type, and copies it with a meaningful name (logo.*, favicon-ish identity.*).
    Returns the copied file names."""
    components_dir = repo_root / "ui" / "components" / "brands" / slug
    public_dir = repo_root / "ui" / "public" / "brands" / slug
    if not components_dir.is_dir() or not public_dir.is_dir():
        return []

    ref_re = re.compile(rf"/brands/{re.escape(slug)}/([A-Za-z0-9_.-]+)")
    # Order matters: logo component first so the wordmark wins the `logo` name.
    files = sorted(
        components_dir.glob("*.tsx"),
        key=lambda p: (0 if "logo" in p.name else 1 if "header" in p.name else 2, p.name),
    )
    copied: list[str] = []
    seen_src: set[str] = set()
    used_names: set[str] = set()
    logo_taken = False
    for tsx in files:
        try:
            text = tsx.read_text()
        except OSError:
            continue
        is_logo_component = "logo" in tsx.name
        for token in ref_re.findall(text):
            if token == "replica" or "/" in token or token in seen_src:
                continue
            src = public_dir / token
            if not src.is_file():
                continue
            ext = _sniff_ext(src) or Path(token).suffix
            if not ext:
                continue
            if is_logo_component and not logo_taken:
                stem = "logo"
                logo_taken = True
            elif ext == ".svg":
                stem = "logo" if not logo_taken else f"identity-{token[:8]}"
                if stem == "logo":
                    logo_taken = True
            else:
                stem = f"identity-{token[:8]}"
            name = f"{stem}{ext}"
            if name in used_names:
                name = f"identity-{token[:8]}{ext}"
            assets_out.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, assets_out / name)
            seen_src.add(token)
            used_names.add(name)
            copied.append(name)
            if len(copied) >= 12:
                return copied
    return copied


TOKEN_FILES = ("design-tokens.json", "design-tokens.css")


def copy_design_tokens(
    slug: str, brands_dir: Path, library_dir: Path, skill_dir: Path
) -> list[str]:
    """Copy design-tokens.{json,css} into the skill dir so the bundle carries a
    complete design system. open-design skills can reference real token values
    instead of re-deriving them from the prose DESIGN.md. Returns copied names."""
    copied: list[str] = []
    for name in TOKEN_FILES:
        for base in (library_dir / slug, brands_dir / slug):
            src = base / name
            if src.is_file():
                shutil.copy2(src, skill_dir / name)
                copied.append(name)
                break
    return copied


def zip_bundle(out_dir: Path, zip_path: Path, top_name: str) -> Path:
    """Zip the exported open-design dir into zip_path under a single top-level
    folder named top_name, so unzipping yields <top_name>/{DESIGN.md,skill,assets}."""
    if zip_path.suffix != ".zip":
        zip_path = zip_path.with_suffix(".zip")
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    if zip_path.exists():
        zip_path.unlink()
    with tempfile.TemporaryDirectory() as tmp:
        staged = Path(tmp) / top_name
        shutil.copytree(out_dir, staged)
        archive = shutil.make_archive(
            str(zip_path.with_suffix("")), "zip", root_dir=tmp, base_dir=top_name
        )
    return Path(archive)


# ---------------------------------------------------------------------------
# Round-trip check and install
# ---------------------------------------------------------------------------

def check_export(md_text: str, expected_name: str) -> list[str]:
    """Run the open-design parser port against an emitted DESIGN.md and
    return a list of problems (empty = pass)."""
    problems: list[str] = []
    parsed = parse_open_design_md(md_text)
    if parsed["title"] != expected_name:
        problems.append(
            f"title mismatch: parsed {parsed['title']!r}, expected {expected_name!r}"
        )
    if parsed["category"] == "Uncategorized":
        problems.append("category line missing or unparsable")
    if not parsed["summary"]:
        problems.append("summary paragraph empty")
    if len(parsed["swatches"]) < 4:
        problems.append(
            f"swatch extraction produced {len(parsed['swatches'])} colours, need 4"
        )
    if md_text.startswith("---"):
        problems.append("file starts with YAML frontmatter; open-design expects none")
    return problems


def install_dir_target(root: Path, kind: str, dir_name: str) -> Path:
    """Validate and return the install target <root>/<kind>/<dir_name>.

    Refuses to return a target that would clobber anything we did not
    create: the name must carry the reserved `brand-` prefix, and any
    existing path at the target must be a real directory (not a file or a
    symlink into the rest of the checkout)."""
    if not dir_name.startswith("brand-"):
        raise ValueError(
            f"refusing install target {dir_name!r}: only 'brand-' prefixed "
            "directories are managed by this exporter"
        )
    kind_root = root / kind
    if not kind_root.is_dir():
        raise ValueError(
            f"{kind_root} does not exist — is {root} an open-design checkout?"
        )
    target = kind_root / dir_name
    if target.exists() or target.is_symlink():
        if target.is_symlink():
            raise ValueError(f"refusing to overwrite symlink {target}")
        if not target.is_dir():
            raise ValueError(f"refusing to overwrite non-directory {target}")
    return target


def install_brand(out_dir: Path, slug: str, open_design_root: Path) -> list[str]:
    """Copy the v1 design-system bundle into the open-design checkout.

    The full ``design-system/`` folder (manifest + DESIGN.md + tokens.css + …)
    is copied to ``design-systems/brand-<slug>/``; the skill is copied to
    ``skills/brand-<slug>/``. Returns the list of installed target paths."""
    installed: list[str] = []
    dir_name = f"brand-{slug}"

    bundle_src = out_dir / "design-system"
    if bundle_src.is_dir():
        target = install_dir_target(open_design_root, "design-systems", dir_name)
        target.mkdir(parents=True, exist_ok=True)
        for entry in bundle_src.iterdir():
            dst = target / entry.name
            if entry.is_file():
                shutil.copy2(entry, dst)
            elif entry.is_dir():
                shutil.copytree(entry, dst, dirs_exist_ok=True)
        installed.append(str(target))

    skill_src = out_dir / "skill" / "SKILL.md"
    if skill_src.is_file():
        target = install_dir_target(open_design_root, "skills", dir_name)
        target.mkdir(parents=True, exist_ok=True)
        shutil.copy2(skill_src, target / "SKILL.md")
        installed.append(str(target / "SKILL.md"))
    return installed


def _package_mirror_page(page_mirror_dir, out_dir, **kwargs):
    """Delegate to WS1's ``package_artifact_bundle.package``.

    Kept as a module-level seam so tests can inject a fake without touching the
    real (BeautifulSoup-dependent) packager.
    """
    pkg = _load_sibling("package_artifact_bundle")
    return pkg.package(Path(page_mirror_dir), Path(out_dir))


def package_artifacts(
    slug: str, brands_dir: Path, out_dir: Path, mirror_root: Path
) -> list[str]:
    """Package every mirrored page under ``mirror_root`` into OD artifact
    bundles under ``<out_dir>/artifacts/<page>/``. Best-effort: a missing mirror
    root or a packaging error never fails the export."""
    packaged: list[str] = []
    if not Path(mirror_root).is_dir():
        print(f"WARN  {slug}: no mirror root at {mirror_root}; skipping --artifacts")
        return packaged
    for page_dir in sorted(Path(mirror_root).iterdir()):
        if not page_dir.is_dir() or not (page_dir / "index.html").is_file():
            continue
        artifact_out = out_dir / "artifacts" / page_dir.name
        try:
            res = _package_mirror_page(page_dir, artifact_out)
            packaged.append(res.get("dir", str(artifact_out)) if isinstance(res, dict) else str(artifact_out))
        except Exception as exc:  # noqa: BLE001 — packaging is best-effort
            print(f"WARN  {slug}: artifact packaging failed for {page_dir.name}: {exc}")
    return packaged


# ---------------------------------------------------------------------------
# Export driver
# ---------------------------------------------------------------------------

def has_enough_data(data: dict) -> bool:
    return bool(data.get("frontmatter") or data.get("tokens") or data.get("sections"))


def export_brand(
    slug: str,
    brands_dir: Path,
    library_dir: Path,
    cache_dir: Path,
    check: bool = False,
    install_root: Path | None = None,
    artifacts: bool = False,
    mirror_root: Path | None = None,
) -> dict:
    """Export one brand. Core emission delegates to the v1 bundle emitter; the
    canonical DESIGN.md is mirrored to the bundle root for the skill/assets
    pipeline. Returns a result dict with status/warnings/paths."""
    if not SLUG_RE.match(slug):
        return {"slug": slug, "status": "error", "error": f"invalid slug {slug!r}"}
    data = load_brand_data(slug, brands_dir, library_dir, cache_dir)
    if not has_enough_data(data):
        return {
            "slug": slug,
            "status": "skipped",
            "error": "no DESIGN.md or design-tokens.json found in any source",
        }

    out_dir = brands_dir / slug / "open-design"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Core emission: the od-design-system-project/v1 bundle.
    bds = _load_sibling("build_design_system_bundle")
    bundle_dir = bds.build(
        slug, out_dir=out_dir / "design-system", data=data,
        brands_dir=brands_dir, library_dir=library_dir, cache_dir=cache_dir,
    )
    design_md = (bundle_dir / "DESIGN.md").read_text()
    # Mirror the canonical DESIGN.md to the bundle root (skill/assets pipeline).
    (out_dir / "DESIGN.md").write_text(design_md)

    skill_dir = out_dir / "skill"
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / "SKILL.md").write_text(render_skill_md(data))

    assets_out = out_dir / "assets"
    assets = copy_assets(data, assets_out)
    for name in copy_identity_assets(slug, REPO_ROOT, assets_out):
        if name not in assets:
            assets.append(name)
    if assets:
        _write_assets_readme(slug, assets, assets_out)
    tokens = copy_design_tokens(slug, brands_dir, library_dir, skill_dir)

    result: dict = {
        "slug": slug,
        "status": "ok",
        "out_dir": str(out_dir),
        "bundle_dir": str(bundle_dir),
        "assets": assets,
        "tokens": tokens,
        "warnings": list(data["warnings"]),
        "sources": list(data["sources"]),
        "swatches": parse_open_design_md(design_md)["swatches"],
    }

    if check:
        problems = check_export(design_md, data["name"])
        validator = _load_sibling("_od_manifest_validator")
        mres = validator.validate(json.loads((bundle_dir / "manifest.json").read_text()))
        problems += [f"manifest: {e}" for e in mres.errors]
        if problems:
            result["status"] = "check-failed"
            result["problems"] = problems

    if install_root is not None and result["status"] == "ok":
        try:
            result["installed"] = install_brand(out_dir, slug, install_root)
        except ValueError as exc:
            result["status"] = "install-failed"
            result["error"] = str(exc)

    if artifacts and result["status"] == "ok":
        result["artifacts"] = package_artifacts(
            slug, brands_dir, out_dir, mirror_root or brands_dir / slug / "original"
        )
    return result


def discover_slugs(brands_dir: Path, library_dir: Path, cache_dir: Path) -> list[str]:
    slugs: set[str] = set()
    for root in (brands_dir, library_dir, cache_dir):
        if not root.is_dir():
            continue
        for entry in root.iterdir():
            if entry.is_dir() and SLUG_RE.match(entry.name):
                slugs.add(entry.name)
    return sorted(slugs)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Export extracted brands into open-design's format."
    )
    parser.add_argument("--slug", help="brand slug to export")
    parser.add_argument(
        "--all", action="store_true", help="export every brand with enough data"
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="copy exports into the open-design checkout",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="round-trip the emitted DESIGN.md through open-design's parser AND "
             "validate manifest.json against the v1 schema",
    )
    parser.add_argument(
        "--artifacts",
        action="store_true",
        help="package each mirrored page (brands/<slug>/original/<page>/) into a "
             "self-contained OD artifact bundle via package_artifact_bundle",
    )
    parser.add_argument(
        "--mirror-root", type=Path, default=None,
        help="offline mirror root for --artifacts (default brands/<slug>/original)",
    )
    parser.add_argument(
        "--open-design-root",
        type=Path,
        default=DEFAULT_OPEN_DESIGN_ROOT,
        help=f"open-design checkout (default {DEFAULT_OPEN_DESIGN_ROOT})",
    )
    parser.add_argument(
        "--brands-dir", type=Path, default=REPO_ROOT / "brands",
        help="repo brands/ directory (output root)",
    )
    parser.add_argument(
        "--library-dir", type=Path, default=DEFAULT_LIBRARY_ROOT,
        help="installed design library brands directory",
    )
    parser.add_argument(
        "--cache-dir", type=Path, default=REPO_ROOT / "cache",
        help="extraction cache directory",
    )
    parser.add_argument(
        "--zip", type=Path, default=None, dest="zip_path",
        help="write the exported bundle to this .zip (single --slug only). "
             "Prints 'ZIP <slug>: <path>' on success.",
    )
    args = parser.parse_args(argv)

    if not args.slug and not args.all:
        parser.error("provide --slug <slug> or --all")
    if args.zip_path and args.all:
        parser.error("--zip works with a single --slug, not --all")

    slugs = (
        discover_slugs(args.brands_dir, args.library_dir, args.cache_dir)
        if args.all
        else [args.slug]
    )
    install_root = args.open_design_root if args.install else None

    failures = 0
    for slug in slugs:
        result = export_brand(
            slug,
            brands_dir=args.brands_dir,
            library_dir=args.library_dir,
            cache_dir=args.cache_dir,
            check=args.check,
            install_root=install_root,
            artifacts=args.artifacts,
            mirror_root=args.mirror_root,
        )
        status = result["status"]
        if status == "ok":
            swatches = " ".join(result.get("swatches") or [])
            print(f"OK    {slug}: {result['out_dir']} swatches=[{swatches}]")
            for w in result.get("warnings") or []:
                print(f"WARN  {slug}: {w}")
            for path in result.get("installed") or []:
                print(f"INSTALLED {slug}: {path}")
            if result.get("assets"):
                print(f"ASSETS {slug}: {', '.join(result['assets'])}")
            if result.get("tokens"):
                print(f"TOKENS {slug}: {', '.join(result['tokens'])}")
            if result.get("artifacts"):
                print(f"ARTIFACTS {slug}: {', '.join(result['artifacts'])}")
            if args.zip_path:
                archive = zip_bundle(
                    Path(result["out_dir"]), args.zip_path, top_name=f"brand-{slug}"
                )
                print(f"ZIP   {slug}: {archive}")
        elif status == "skipped":
            print(f"SKIP  {slug}: {result['error']}")
        else:
            failures += 1
            print(f"FAIL  {slug}: {result.get('error') or result.get('problems')}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
