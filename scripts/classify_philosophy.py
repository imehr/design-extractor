#!/usr/bin/env python3
"""Classify an extracted brand's design-tokens.json against the 20 huashu philosophies.

Public API
----------
classify_brand(design_tokens, patterns=None) -> list[dict]
    Returns the top-3 philosophies as
    [{name, family, similarity, rationale}, ...] sorted by similarity desc.

CLI
---
    python3 scripts/classify_philosophy.py --slug <slug>

Loads `~/.claude/design-library/brands/<slug>/design-tokens.json`, writes
`<repo>/brands/<slug>/validation/philosophy-classification.json`, and prints a
3-row table to stdout.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

# Make sibling import work whether invoked as `python3 scripts/x.py` or `-m`.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from philosophy_index import PHILOSOPHIES  # noqa: E402

_REPO_ROOT = Path(__file__).resolve().parent.parent

# Weights — keep stable for determinism.
_W_PALETTE = 0.30
_W_WHITESPACE = 0.20
_W_FONT = 0.25
_W_HIERARCHY = 0.10
_W_CORNER = 0.15

# Font heuristic lookup. Keys are lowercase substrings.
_FONT_LOOKUP: list[tuple[str, str]] = [
    ("times", "display-serif"),
    ("garamond", "display-serif"),
    ("playfair", "display-serif"),
    ("didot", "display-serif"),
    ("bodoni", "display-serif"),
    ("georgia", "serif"),
    ("merriweather", "serif"),
    ("source serif", "serif"),
    ("noto serif", "serif"),
    ("courier", "mono"),
    ("menlo", "mono"),
    ("monaco", "mono"),
    ("consolas", "mono"),
    ("jetbrains", "mono"),
    ("fira code", "mono"),
    ("futura", "geometric-sans"),
    ("avenir", "geometric-sans"),
    ("gotham", "geometric-sans"),
    ("circular", "geometric-sans"),
    ("poppins", "geometric-sans"),
    ("montserrat", "geometric-sans"),
    ("helvetica", "humanist-sans"),
    ("inter", "humanist-sans"),
    ("sf pro", "humanist-sans"),
    ("roboto", "humanist-sans"),
    ("arial", "humanist-sans"),
    ("open sans", "humanist-sans"),
    ("source sans", "humanist-sans"),
]

_HEX_RE = re.compile(r"^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
_RGB_RE = re.compile(r"rgba?\(([^)]+)\)")
_NOISE_KEY_RE = re.compile(r"^(text|bg)_rgb", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_hex(value: Any) -> str | None:
    """Normalise a color string to '#RRGGBB' lowercase, or None."""
    if not isinstance(value, str):
        return None
    v = value.strip().lower()
    if not v or v == "transparent":
        return None
    m = _RGB_RE.match(v)
    if m:
        nums = [p.strip() for p in m.group(1).split(",")]
        try:
            r, g, b = int(float(nums[0])), int(float(nums[1])), int(float(nums[2]))
            return f"#{r:02x}{g:02x}{b:02x}"
        except (ValueError, IndexError):
            return None
    if _HEX_RE.match(v):
        s = v.lstrip("#")
        if len(s) == 3:
            s = "".join(c * 2 for c in s)
        if len(s) >= 6:
            return f"#{s[:6].lower()}"
    return None


def _distinct_palette_hexes(design_tokens: dict) -> list[str]:
    """Return distinct hex values from the meaningful (named-role) palette entries.

    Drops noise keys like `text_rgb(...)` / `bg_rgb(...)` and deduplicates by hex.
    """
    palette = design_tokens.get("colours", {}).get("palette", {})
    if not isinstance(palette, dict):
        return []
    seen: list[str] = []
    for key, val in palette.items():
        if not isinstance(key, str) or _NOISE_KEY_RE.match(key):
            continue
        hx = _to_hex(val)
        if hx and hx not in seen:
            seen.append(hx)
    return seen


def _luminance(hex_color: str) -> float:
    s = hex_color.lstrip("#")
    if len(s) != 6:
        return 0.0
    r = int(s[0:2], 16) / 255.0
    g = int(s[2:4], 16) / 255.0
    b = int(s[4:6], 16) / 255.0

    def _ch(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * _ch(r) + 0.7152 * _ch(g) + 0.0722 * _ch(b)


def _max_saturation(hexes: list[str]) -> float:
    """Return the maximum HSV saturation across hexes, 0-1."""
    best = 0.0
    for hx in hexes:
        s = hx.lstrip("#")
        if len(s) != 6:
            continue
        r = int(s[0:2], 16) / 255.0
        g = int(s[2:4], 16) / 255.0
        b = int(s[4:6], 16) / 255.0
        mx = max(r, g, b)
        mn = min(r, g, b)
        if mx == 0:
            sat = 0.0
        else:
            sat = (mx - mn) / mx
        if sat > best:
            best = sat
    return best


def _is_monochrome(hexes: list[str]) -> bool:
    """True if all colors collapse to grayscale (R~=G~=B within tolerance)."""
    if not hexes:
        return True
    for hx in hexes:
        s = hx.lstrip("#")
        if len(s) != 6:
            continue
        r = int(s[0:2], 16)
        g = int(s[2:4], 16)
        b = int(s[4:6], 16)
        if max(r, g, b) - min(r, g, b) > 12:
            return False
    return True


def _classify_font(font_name: str) -> str:
    """Map a font family string to one of the 6 display-font classes."""
    if not font_name:
        return "humanist-sans"
    name = font_name.lower()
    # Strip CSS fallback list.
    name = name.split(",")[0].strip().strip('"').strip("'").strip()
    for needle, klass in _FONT_LOOKUP:
        if needle in name:
            return klass
    # Fallback heuristics.
    if "serif" in name and "sans" not in name:
        return "serif"
    if "mono" in name or "code" in name:
        return "mono"
    return "humanist-sans"


def _heading_font_name(design_tokens: dict) -> str:
    families = design_tokens.get("typography", {}).get("families", [])
    if not isinstance(families, list):
        return ""
    # Prefer the explicit `heading` role.
    for f in families:
        if isinstance(f, dict) and str(f.get("role", "")).lower() == "heading":
            return str(f.get("value", ""))
    # Else first family with a value.
    for f in families:
        if isinstance(f, dict) and f.get("value"):
            return str(f["value"])
    return ""


def _dominant_corner_class(design_tokens: dict) -> str | None:
    """Pick the dominant border-radius class from the extracted radii list."""
    radii = design_tokens.get("borders", {}).get("radii", []) or []
    pxs: list[float] = []
    for item in radii:
        raw = item.get("value") if isinstance(item, dict) else str(item)
        if not isinstance(raw, str):
            continue
        try:
            pxs.append(float(raw.replace("px", "")))
        except ValueError:
            continue
    if not pxs:
        return None
    has_pill = any(p >= 100 for p in pxs)
    finite = [p for p in pxs if p < 100]
    if not finite:
        return "pill" if has_pill else None
    avg = sum(finite) / len(finite)
    if has_pill and avg <= 8:
        return "mixed"  # mostly sharp/soft with a pill — typical Tailwind-like brand
    if avg <= 2:
        return "sharp"
    if avg <= 6:
        return "soft"
    if avg <= 14:
        return "rounded"
    return "pill"


def _infer_whitespace_ratio(design_tokens: dict) -> float | None:
    """Infer whitespace density from layout fields. Returns None if undeterminable."""
    layout = design_tokens.get("layout", {}) or {}

    def _to_px(v: Any) -> float | None:
        if not isinstance(v, str):
            return None
        try:
            return float(v.replace("px", "").strip())
        except ValueError:
            return None

    max_w = _to_px(layout.get("max_width"))
    pad = _to_px(layout.get("content_padding"))
    if max_w is None or max_w <= 0:
        return None
    if pad is None or pad <= 0:
        # 0px is an extractor noise value — treat as unknown.
        return None
    # Approximation: padding / max-width, clamped to a reasonable band.
    ratio = pad * 2 / max_w
    # Scale into a 0.2-0.7 perceived-whitespace band.
    return max(0.2, min(0.7, 0.2 + ratio * 3))


# ---------------------------------------------------------------------------
# Sub-score functions
# ---------------------------------------------------------------------------

def _score_palette(design_tokens: dict, phil: dict) -> tuple[float, str]:
    hexes = _distinct_palette_hexes(design_tokens)
    constraint = phil["palette_constraint"]
    notes: list[str] = []

    # Count accents = non-neutral, non-background swatches.
    accents = [h for h in hexes if h not in ("#000000", "#ffffff") and not _is_monochrome([h])]
    accent_count = len(accents)

    max_accents = constraint["max_accents"]
    # accent_score: 1.0 when accent_count <= max_accents; falls off otherwise.
    if max_accents <= 0:
        # Philosophy expects monochrome; perfect when accent_count==0.
        accent_score = 1.0 if accent_count == 0 else max(0.0, 1.0 - accent_count * 0.25)
    else:
        if accent_count <= max_accents:
            accent_score = 1.0
        else:
            accent_score = max(0.0, 1.0 - (accent_count - max_accents) * 0.15)

    mono_actual = _is_monochrome(hexes)
    mono_score = 1.0 if mono_actual == constraint["monochrome"] else 0.4
    notes.append("monochrome fit" if mono_actual == constraint["monochrome"] else "color/mono mismatch")

    # Contrast: estimate by luminance range across distinct hexes.
    if hexes:
        lums = [_luminance(h) for h in hexes]
        contrast_range = max(lums) - min(lums)
    else:
        contrast_range = 0.0
    is_high_contrast = contrast_range >= 0.6
    contrast_score = 1.0 if is_high_contrast == constraint["high_contrast"] else 0.5

    # Vivid: max saturation across accents.
    max_sat = _max_saturation(accents or hexes)
    is_vivid = max_sat >= 0.55
    vivid_score = 1.0 if is_vivid == constraint["vivid"] else 0.5

    score = (accent_score * 0.4 + mono_score * 0.2 + contrast_score * 0.2 + vivid_score * 0.2)
    rationale = (
        f"{accent_count} accents vs max {max_accents}; "
        f"{'mono' if mono_actual else 'polychrome'}; "
        f"{'high' if is_high_contrast else 'low'} contrast"
    )
    return score, rationale


def _score_whitespace(design_tokens: dict, phil: dict) -> tuple[float, str] | None:
    actual = _infer_whitespace_ratio(design_tokens)
    if actual is None:
        return None  # caller will renormalize
    target = phil["whitespace_ratio"]
    delta = abs(actual - target)
    score = max(0.0, 1.0 - delta * 2.0)
    return score, f"whitespace ~{actual:.2f} vs target {target:.2f}"


def _score_font(design_tokens: dict, phil: dict) -> tuple[float, str]:
    heading = _heading_font_name(design_tokens)
    actual_class = _classify_font(heading)
    target_class = phil["display_font_class"]
    if actual_class == target_class:
        score = 1.0
    else:
        # Partial credit for sans-family overlap.
        sans_family = {"humanist-sans", "geometric-sans", "sans"}
        serif_family = {"serif", "display-serif"}
        if actual_class in sans_family and target_class in sans_family:
            score = 0.6
        elif actual_class in serif_family and target_class in serif_family:
            score = 0.6
        else:
            score = 0.2
    return score, f"display font {actual_class} vs target {target_class}"


def _score_hierarchy(design_tokens: dict, patterns: dict | None, phil: dict) -> tuple[float, str] | None:
    if not patterns:
        return None
    type_scale = patterns.get("type_scale_ratio")
    if type_scale is None:
        return None
    try:
        ratio = float(type_scale)
    except (TypeError, ValueError):
        return None
    # Strict modular scales sit around 1.2-1.333.
    is_strict = 1.18 <= ratio <= 1.35
    target_strict = phil["hierarchy_strictness"] >= 0.7
    score = 1.0 if is_strict == target_strict else 0.5
    return score, f"type-scale ratio {ratio:.2f}"


def _score_corner(design_tokens: dict, phil: dict) -> tuple[float, str] | None:
    actual = _dominant_corner_class(design_tokens)
    if actual is None:
        return None
    target = phil["corner_language"]
    if actual == target:
        score = 1.0
    elif target == "mixed" or actual == "mixed":
        score = 0.7
    elif {actual, target} <= {"sharp", "soft"}:
        score = 0.6
    elif {actual, target} <= {"rounded", "pill"}:
        score = 0.6
    else:
        score = 0.3
    return score, f"corner {actual} vs {target}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def classify_brand(design_tokens: dict, patterns: dict | None = None) -> list[dict]:
    """Return the top-3 philosophies ranked by similarity in [0, 1] descending."""
    results: list[dict] = []

    for phil in PHILOSOPHIES:
        # Each entry: (weight, score, rationale_fragment)
        entries: list[tuple[float, float, str]] = []

        pal_score, pal_note = _score_palette(design_tokens, phil)
        entries.append((_W_PALETTE, pal_score, pal_note))

        ws = _score_whitespace(design_tokens, phil)
        if ws is not None:
            entries.append((_W_WHITESPACE, ws[0], ws[1]))

        font_score, font_note = _score_font(design_tokens, phil)
        entries.append((_W_FONT, font_score, font_note))

        hier = _score_hierarchy(design_tokens, patterns, phil)
        if hier is not None:
            entries.append((_W_HIERARCHY, hier[0], hier[1]))

        corner = _score_corner(design_tokens, phil)
        if corner is not None:
            entries.append((_W_CORNER, corner[0], corner[1]))

        total_weight = sum(w for w, _, _ in entries)
        if total_weight <= 0:
            similarity = 0.0
        else:
            similarity = sum(w * s for w, s, _ in entries) / total_weight

        # Top-2 contributing factors for rationale (by w * s).
        ranked = sorted(entries, key=lambda e: e[0] * e[1], reverse=True)[:2]
        rationale = "; ".join(note for _, _, note in ranked)

        results.append({
            "name": phil["name"],
            "family": phil["family"],
            "similarity": round(max(0.0, min(1.0, similarity)), 4),
            "rationale": rationale,
        })

    # Sort by similarity desc, then by name asc for deterministic ties.
    results.sort(key=lambda r: (-r["similarity"], r["name"]))
    return results[:3]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _print_table(rows: list[dict]) -> None:
    print(f"{'Rank':<5} {'Similarity':<12} {'Family':<26} Name")
    print("-" * 78)
    for i, r in enumerate(rows, start=1):
        print(f"{i:<5} {r['similarity']:<12.4f} {r['family']:<26} {r['name']}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug", required=True, help="Brand slug (e.g. quantium-com-au).")
    parser.add_argument(
        "--tokens",
        help="Optional path to design-tokens.json. Defaults to ~/.claude/design-library/brands/<slug>/design-tokens.json.",
    )
    parser.add_argument(
        "--out",
        help="Optional output path. Defaults to <repo>/brands/<slug>/validation/philosophy-classification.json.",
    )
    args = parser.parse_args(argv)

    slug: str = args.slug
    tokens_path = (
        Path(args.tokens).expanduser()
        if args.tokens
        else Path.home() / ".claude" / "design-library" / "brands" / slug / "design-tokens.json"
    )
    if not tokens_path.exists():
        print(f"ERROR: design-tokens.json not found at {tokens_path}", file=sys.stderr)
        return 2

    with tokens_path.open("r", encoding="utf-8") as fp:
        tokens = json.load(fp)

    rows = classify_brand(tokens)

    out_path = (
        Path(args.out).expanduser()
        if args.out
        else _REPO_ROOT / "brands" / slug / "validation" / "philosophy-classification.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "slug": slug,
        "source_tokens": str(tokens_path),
        "top3": rows,
    }
    with out_path.open("w", encoding="utf-8") as fp:
        json.dump(payload, fp, indent=2, ensure_ascii=False)
    print(f"Wrote {out_path}")

    _print_table(rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
