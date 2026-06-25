"""Measured-token analyzer (WS2, Task 2.2).

Maps per-element computed-style samples onto the canonical Open-Design
``TOKEN_SCHEMA`` (``--bg``, ``--surface``, ``--fg``, ``--muted``, ``--border``,
``--accent``, fonts, type scale, spacing, radius, elevation, motion, layout).

The analyzer is **pure Python** with zero browser dependency so it is fully
unit-testable: callers feed plain dicts. Every token carries provenance
(``{value, sources, confidence, count}``); confidence is HIGH at ≥5 distinct
elements, MED at 2–4, else LOW.

Spacing snaps to the OD scale tiers ``[4,8,12,16,20,24,32,48]``; the type scale
clusters into ``--text-xs..4xl``; radius into ``--radius-sm/md/lg/pill`` (pill =
any ≥999px); elevation classifies box-shadows into flat/ring/raised. Tokens that
cannot be *measured* from computed styles (semantic colors, motion, accent
states) fall back to the OD A2 defaults unless raw-css root vars supply them.
"""

from __future__ import annotations

import re
from collections import Counter

# ── OD TOKEN_SCHEMA fallbacks (mirror packages/contracts/.../token-schema.ts) ─

OD_FALLBACK: dict[str, str] = {
    "--accent-on": "#ffffff",
    "--accent-hover": "color-mix(in oklab, var(--accent), black 8%)",
    "--accent-active": "color-mix(in oklab, var(--accent), black 14%)",
    "--success": "#16a34a",
    "--warn": "#eab308",
    "--danger": "#dc2626",
    "--font-mono": 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
    "--space-1": "4px", "--space-2": "8px", "--space-3": "12px", "--space-4": "16px",
    "--space-5": "20px", "--space-6": "24px", "--space-8": "32px", "--space-12": "48px",
    "--radius-sm": "8px", "--radius-md": "12px", "--radius-lg": "16px", "--radius-pill": "9999px",
    "--elev-flat": "none",
    "--elev-ring": "0 0 0 1px var(--border)",
    "--elev-raised": "0 2px 8px color-mix(in oklab, var(--fg), transparent 92%)",
    "--focus-ring": "0 0 0 3px color-mix(in oklab, var(--accent), transparent 70%)",
    "--motion-fast": "150ms",
    "--motion-base": "200ms",
    "--ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
}

SPACE_TIERS: list[tuple[int, str]] = [
    (4, "--space-1"), (8, "--space-2"), (12, "--space-3"), (16, "--space-4"),
    (20, "--space-5"), (24, "--space-6"), (32, "--space-8"), (48, "--space-12"),
]
SPACE_TIER_PX = [px for px, _ in SPACE_TIERS]

TEXT_ANCHORS: list[tuple[int, str]] = [
    (12, "--text-xs"), (14, "--text-sm"), (16, "--text-base"), (18, "--text-lg"),
    (20, "--text-xl"), (24, "--text-2xl"), (32, "--text-3xl"), (48, "--text-4xl"),
]
TEXT_TOKENS = [name for _, name in TEXT_ANCHORS]

RADIUS_TOKENS = ["--radius-sm", "--radius-md", "--radius-lg"]

_HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}


# ── Color utilities ──────────────────────────────────────────────────────────

def parse_color(value) -> tuple[int, int, int] | None:
    """Parse hex / rgb() / rgba() (comma or space separated) → (r,g,b) or None."""
    if not isinstance(value, str):
        return None
    v = value.strip()
    if not v or v.lower() in ("transparent", "currentcolor") or v.startswith("var("):
        return None
    if v.startswith("#"):
        h = v.lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        if len(h) == 8:
            h = h[:6]
        if len(h) != 6:
            return None
        try:
            return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        except ValueError:
            return None
    m = re.match(r"rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)", v)
    if m:
        try:
            return tuple(int(float(x)) for x in m.groups())  # type: ignore[return-value]
        except ValueError:
            return None
    return None


def to_hex(rgb: tuple[int, int, int]) -> str:
    def clamp(x: float) -> int:
        return max(0, min(255, int(round(x))))
    r, g, b = rgb
    return f"#{clamp(r):02x}{clamp(g):02x}{clamp(b):02x}"


def _relative_luminance(rgb: tuple[int, int, int]) -> float:
    def chan(c: int) -> float:
        cs = c / 255
        return cs / 12.92 if cs <= 0.03928 else ((cs + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)


def contrast(rgb1: tuple[int, int, int], rgb2: tuple[int, int, int]) -> float:
    """WCAG contrast ratio in [1.0, 21.0]. Higher = more contrasting."""
    l1, l2 = _relative_luminance(rgb1), _relative_luminance(rgb2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def saturation(rgb: tuple[int, int, int]) -> float:
    """HSL saturation in [0, 1]. Greys → 0; vivid primaries → ~1."""
    r, g, b = (x / 255 for x in rgb)
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return 0.0
    lightness = (mx + mn) / 2
    denom = 1 - abs(2 * lightness - 1)
    if denom == 0:
        return 0.0
    return (mx - mn) / denom


def _is_neutral(rgb: tuple[int, int, int]) -> bool:
    return saturation(rgb) < 0.12


# ── Clustering ───────────────────────────────────────────────────────────────

def _normalize_numeric(v):
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v


def cluster(values) -> dict:
    """Frequency histogram of ``values`` → ``{value: count}``.

    Order-insensitive equality (a dict). Whole-number floats are normalized to
    ints so ``16.0`` and ``16`` collapse to the same bucket.
    """
    counts: dict = {}
    for v in values:
        counts[_normalize_numeric(v)] = counts.get(_normalize_numeric(v), 0) + 1
    return counts


def nearest_space_token(px: float) -> str:
    # Tie (e.g. 28px between 24 and 32) rounds UP to the larger tier.
    return min(SPACE_TIERS, key=lambda t: (abs(t[0] - px), -t[0]))[1]


def nearest_space_px(px: float) -> int:
    return min(SPACE_TIER_PX, key=lambda v: (abs(v - px), -v))


def _is_number(v) -> bool:
    if isinstance(v, (int, float)):
        return True
    try:
        float(v)
        return True
    except (TypeError, ValueError):
        return False


def cluster_size_tiers(values, max_tiers: int = 8) -> list[int]:
    """Cluster numeric sizes into ≤ ``max_tiers`` ascending integer centroids.

    Accepts ints, floats, or ``"Npx"`` strings. Merges the closest adjacent
    pair (rounded mean) until the count is within the budget.
    """
    nums: list[int] = sorted({
        int(round(float(v))) for v in values if _is_number(v)
    })
    while len(nums) > max_tiers:
        best_i, best_gap = 0, float("inf")
        for i in range(len(nums) - 1):
            gap = nums[i + 1] - nums[i]
            if gap < best_gap:
                best_gap, best_i = gap, i
        merged = int(round((nums[best_i] + nums[best_i + 1]) / 2))
        nums = nums[:best_i] + [merged] + nums[best_i + 2:]
    return nums


def _map_text_tokens(centroids: list[int]) -> dict[str, int]:
    """Map ascending size centroids onto ``--text-xs..4xl`` preserving order.

    8 centroids → positional 1:1. Fewer → snap each to its nearest ideal anchor
    (12/14/16/18/20/24/32/48) so 16px lands on ``--text-base`` etc.
    """
    result: dict[str, int] = {}
    if len(centroids) == len(TEXT_ANCHORS):
        for px, (_, token) in zip(centroids, TEXT_ANCHORS):
            result[token] = px
        return result
    for c in centroids:
        best = min(range(len(TEXT_ANCHORS)), key=lambda j: (abs(TEXT_ANCHORS[j][0] - c), j))
        token = TEXT_ANCHORS[best][1]
        prev = result.get(token)
        if prev is None or abs(TEXT_ANCHORS[best][0] - c) < abs(TEXT_ANCHORS[best][0] - prev):
            result[token] = c
    return result


def confidence(count: int) -> str:
    if count >= 5:
        return "HIGH"
    if count >= 2:
        return "MED"
    return "LOW"


def _provenance(value, sources, count) -> dict:
    return {
        "value": value,
        "sources": list(dict.fromkeys(str(s) for s in sources if s)),
        "confidence": confidence(count),
        "count": int(count),
    }


def _px(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(round(value))
    m = re.match(r"(-?\d+(?:\.\d+)?)", str(value).strip())
    return int(round(float(m.group(1)))) if m else None


# ── Role detection ───────────────────────────────────────────────────────────

def _role(sample: dict) -> str:
    role = str(sample.get("role") or "").lower()
    if role:
        return role
    sel = str(sample.get("selector") or sample.get("tag") or "").lower()
    tag = re.split(r"[^a-z0-9]+", sel, maxsplit=1)[0]
    if tag in _HEADING_TAGS:
        return "heading"
    if tag in ("a",):
        return "link"
    if tag in ("button",):
        return "button"
    if tag in ("body", "html"):
        return "body"
    if tag in ("p", "span", "li", "small"):
        return "body"
    if "container" in sel or "card" in sel:
        return "container"
    if "badge" in sel or "tag" in sel:
        return "badge"
    return sel or "element"


# ── Modal / tier pickers ─────────────────────────────────────────────────────

def _modal_color(pairs: list[tuple[tuple[int, int, int], str]]):
    """Return (rgb, sources, count) for the most frequent color, or None."""
    if not pairs:
        return None
    counter: Counter = Counter(rgb for rgb, _ in pairs)
    modal_rgb = counter.most_common(1)[0][0]
    sources = [s for rgb, s in pairs if rgb == modal_rgb]
    return modal_rgb, sources, len(sources)


def _second_text_tier(text_pairs, fg_rgb, bg_rgb):
    """Pick the muted tier: non-fg text colors, lowest contrast vs bg, tie→higher freq."""
    others = [(rgb, s) for rgb, s in text_pairs if rgb != fg_rgb]
    if not others:
        return None
    counter: Counter = Counter(rgb for rgb, _ in others)
    distinct = list(counter.keys())
    distinct.sort(key=lambda rgb: (contrast(rgb, bg_rgb), -counter[rgb]))
    muted_rgb = distinct[0]  # lowest contrast first
    sources = [s for rgb, s in others if rgb == muted_rgb]
    return muted_rgb, sources, len(sources)


def _classify_shadow(shadow: str) -> str:
    s = shadow.strip().lower()
    if not s or s == "none" or s == "initial":
        return "flat"
    # ring: inset, or a pure 0-spread 0-blur outline like "0 0 0 1px ..."
    if "inset" in s:
        return "ring"
    if re.match(r"0(?:\.\d+)?(?:px|rem)?\s+0(?:\.\d+)?(?:px|rem)?\s+0(?:\.\d+)?", s):
        return "ring"
    return "raised"


# ── Public entry point ───────────────────────────────────────────────────────

class MeasuredTokens:
    """A token name → provenance map with OD-fallback-aware accessors."""

    def __init__(self, tokens: dict | None = None):
        self._tokens: dict[str, dict] = dict(tokens or {})

    def to_dict(self) -> dict[str, dict]:
        return dict(self._tokens)

    def get(self, name: str, default=None):
        return self._tokens.get(name, default)

    def value(self, name: str, default=None):
        tok = self._tokens.get(name)
        return tok["value"] if tok else default

    def set(self, name: str, provenance: dict) -> None:
        self._tokens[name] = provenance

    def __getitem__(self, name: str) -> dict:
        return self._tokens[name]

    def __contains__(self, name: str) -> bool:
        return name in self._tokens

    def __len__(self) -> int:
        return len(self._tokens)


def analyze(measured_samples: list[dict], raw_css: dict | None = None, viewports: dict | None = None) -> MeasuredTokens:
    """Map computed-style ``measured_samples`` onto the OD TOKEN_SCHEMA.

    Each sample is a dict of computed properties (``fontSize``, ``color``,
    ``backgroundColor``, ``paddingTop`` … ``paddingLeft``, ``margin-*``, ``gap``,
    ``borderRadius``, ``borderColor``, ``boxShadow``, plus ``selector``/``role``).
    ``raw_css`` is the ``parse_raw_css_buckets`` output (root vars / keyframe
    evidence); ``viewports`` carries per-viewport section/container rects.
    """
    tokens = MeasuredTokens()
    samples = [s for s in (measured_samples or []) if isinstance(s, dict)]

    # Collect evidence.
    text_pairs: list[tuple[tuple[int, int, int], str]] = []
    bg_pairs_body: list[tuple[tuple[int, int, int], str]] = []
    bg_pairs_container: list[tuple[tuple[int, int, int], str]] = []
    bg_pairs_all: list[tuple[tuple[int, int, int], str]] = []
    border_pairs: list[tuple[tuple[int, int, int], str]] = []
    accent_pairs: list[tuple[tuple[int, int, int], str]] = []
    heading_families: list[tuple[str, str]] = []
    body_families: list[tuple[str, str]] = []
    heading_leading: list[tuple[str, str]] = []
    body_leading: list[tuple[str, str]] = []
    heading_tracking: list[tuple[str, str]] = []
    heading_sizes: list[tuple[int, str]] = []
    spacing_values: list[tuple[int, str]] = []
    radius_values: list[tuple[int, str]] = []
    shadows: list[tuple[str, str, str]] = []  # (shadow, selector, class)
    container_widths: list[tuple[int, str]] = []
    container_gutters: list[tuple[int, str]] = []

    spacing_keys = (
        "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
        "marginTop", "marginRight", "marginBottom", "marginLeft",
        "gap", "rowGap", "columnGap",
    )

    for sample in samples:
        role = _role(sample)
        sel = str(sample.get("selector") or role)
        color = parse_color(sample.get("color"))
        bg = parse_color(sample.get("backgroundColor") or sample.get("background"))
        border = parse_color(sample.get("borderColor") or sample.get("border"))

        if color:
            text_pairs.append((color, sel))
            if role in ("link", "button"):
                accent_pairs.append((color, sel))
        if bg:
            bg_pairs_all.append((bg, sel))
            if role in ("body", "html"):
                bg_pairs_body.append((bg, sel))
            elif role in ("container", "card", "surface"):
                bg_pairs_container.append((bg, sel))
            if role in ("link", "button"):
                accent_pairs.append((bg, sel))
        if border:
            border_pairs.append((border, sel))

        family = sample.get("fontFamily")
        if family:
            if role == "heading":
                heading_families.append((str(family), sel))
            elif role == "body":
                body_families.append((str(family), sel))
        lh = sample.get("lineHeight")
        if lh and str(lh).strip() and str(lh).lower() != "normal":
            if role == "heading":
                heading_leading.append((str(lh), sel))
            elif role == "body":
                body_leading.append((str(lh), sel))
        tr = sample.get("letterSpacing")
        if tr and str(tr).strip() and str(tr).lower() != "normal":
            if role == "heading":
                heading_tracking.append((str(tr), sel))
        fs = _px(sample.get("fontSize"))
        if fs and role == "heading":
            heading_sizes.append((fs, sel))

        for key in spacing_keys:
            v = _px(sample.get(key))
            if v and v > 0:
                spacing_values.append((v, sel))

        radius_px = _px(sample.get("borderRadius"))
        if radius_px is not None and radius_px > 0:
            radius_values.append((radius_px, sel))

        shadow = sample.get("boxShadow")
        if isinstance(shadow, str) and shadow.strip():
            shadows.append((shadow.strip(), sel, _classify_shadow(shadow)))

        if role in ("container", "main"):
            w = _px(sample.get("width") or sample.get("maxWidth"))
            if w and w > 0:
                container_widths.append((w, sel))
            for gkey in ("paddingLeft", "paddingRight"):
                gv = _px(sample.get(gkey))
                if gv and gv > 0:
                    container_gutters.append((gv, sel))

    # ── Colors: bg / surface / fg / muted / border ─────────────────────────
    bg_modal = _modal_color(bg_pairs_body) or _modal_color(bg_pairs_all)
    if bg_modal:
        rgb, sources, count = bg_modal
        tokens.set("--bg", _provenance(to_hex(rgb), sources, count))
        bg_rgb = rgb
    else:
        bg_rgb = (255, 255, 255)

    if bg_pairs_container:
        non_bg = [(rgb, s) for rgb, s in bg_pairs_container if rgb != bg_rgb]
        surf_modal = _modal_color(non_bg) or _modal_color(bg_pairs_container)
    else:
        non_bg_all = [(rgb, s) for rgb, s in bg_pairs_all if rgb != bg_rgb]
        surf_modal = _modal_color(non_bg_all)
    if surf_modal:
        rgb, sources, count = surf_modal
        tokens.set("--surface", _provenance(to_hex(rgb), sources, count))

    fg_modal = _modal_color(text_pairs)
    if fg_modal:
        rgb, sources, count = fg_modal
        tokens.set("--fg", _provenance(to_hex(rgb), sources, count))
        fg_rgb = rgb
        muted = _second_text_tier(text_pairs, rgb, bg_rgb)
        if muted:
            mrgb, msources, mcount = muted
            tokens.set("--muted", _provenance(to_hex(mrgb), msources, mcount))
    else:
        fg_rgb = (32, 32, 32)

    border_modal = _modal_color(border_pairs)
    if border_modal:
        rgb, sources, count = border_modal
        tokens.set("--border", _provenance(to_hex(rgb), sources, count))

    # ── Accent: most-saturated link/button color, else most-freq non-neutral ─
    accent_rgb: tuple[int, int, int] | None = None
    accent_sources: list[str] = []
    accent_count = 0
    if accent_pairs:
        # Rank by saturation desc, then frequency.
        counter: Counter = Counter(rgb for rgb, _ in accent_pairs)
        ranked = sorted(counter.keys(), key=lambda rgb: (-saturation(rgb), -counter[rgb]))
        accent_rgb = ranked[0]
        accent_sources = [s for rgb, s in accent_pairs if rgb == accent_rgb]
        accent_count = len(accent_sources)
    if accent_rgb is None:
        non_neutral = [(rgb, s) for rgb, s in text_pairs + bg_pairs_all if not _is_neutral(rgb)]
        counter = Counter(rgb for rgb, _ in non_neutral)
        if counter:
            ranked = sorted(counter.keys(), key=lambda rgb: (-saturation(rgb), -counter[rgb]))
            accent_rgb = ranked[0]
            accent_sources = [s for rgb, s in non_neutral if rgb == accent_rgb]
            accent_count = len(accent_sources)
    if accent_rgb is not None:
        tokens.set("--accent", _provenance(to_hex(accent_rgb), accent_sources, accent_count))

    # ── Fonts ──────────────────────────────────────────────────────────────
    if heading_families:
        fam, sources, count = _modal_str(heading_families)
        tokens.set("--font-display", _provenance(fam, sources, count))
    if body_families:
        fam, sources, count = _modal_str(body_families)
        tokens.set("--font-body", _provenance(fam, sources, count))

    # ── Type scale ─────────────────────────────────────────────────────────
    if heading_sizes or text_pairs:
        # Cluster from ALL font sizes (heading + body) so the scale spans body→hero.
        all_sizes = list({fs for fs, _ in heading_sizes})
        if not all_sizes:
            # Infer a body baseline so the scale isn't empty when only body exists.
            body_sizes = [_px(s.get("fontSize")) for s in samples if _role(s) == "body"]
            all_sizes = [v for v in body_sizes if v]
        centroids = cluster_size_tiers(all_sizes)
        for token, px in _map_text_tokens(centroids).items():
            contrib = [src for fs, src in heading_sizes if fs == px] or [
                src for fs, src in heading_sizes if any(fs == c for c in centroids)
            ]
            count = max(len(contrib), 1)
            tokens.set(token, _provenance(f"{px}px", contrib or [sel for _, sel in heading_sizes], count))

    # ── Leading / tracking ─────────────────────────────────────────────────
    if body_leading:
        val, sources, count = _modal_str(body_leading)
        tokens.set("--leading-body", _provenance(val, sources, count))
    if heading_leading:
        val, sources, count = _modal_str(heading_leading)
        tokens.set("--leading-tight", _provenance(val, sources, count))
    if heading_tracking:
        val, sources, count = _modal_str(heading_tracking)
        tokens.set("--tracking-display", _provenance(val, sources, count))

    # ── Spacing → --space-1..12 (snap to OD tiers) ─────────────────────────
    if spacing_values:
        tier_counts: dict[str, list[tuple[int, str]]] = {}
        for v, sel in spacing_values:
            tok = nearest_space_token(v)
            tier_counts.setdefault(tok, []).append((nearest_space_px(v), sel))
        for tok, entries in tier_counts.items():
            px = entries[0][0]
            sources = [s for _, s in entries]
            tokens.set(tok, _provenance(f"{px}px", sources, len(sources)))

    # ── Radius → --radius-sm/md/lg/pill ────────────────────────────────────
    if radius_values:
        pill_vals = [(v, s) for v, s in radius_values if v >= 999]
        if pill_vals:
            tokens.set("--radius-pill", _provenance("9999px", [s for _, s in pill_vals], len(pill_vals)))
        rounded = sorted({v for v, _ in radius_values if v < 999})
        if rounded:
            mapped = _map_radius_tokens(rounded)
            for token, px in mapped.items():
                sources = [s for v, s in radius_values if v == px]
                tokens.set(token, _provenance(f"{px}px", sources, len(sources)))

    # ── Elevation → flat/ring/raised ───────────────────────────────────────
    if shadows:
        by_class: dict[str, list[tuple[str, str]]] = {}
        for shadow, sel, cls in shadows:
            by_class.setdefault(cls, []).append((shadow, sel))
        class_token = {"flat": "--elev-flat", "ring": "--elev-ring", "raised": "--elev-raised"}
        for cls, token in class_token.items():
            entries = by_class.get(cls, [])
            if not entries:
                continue
            counter = Counter(sh for sh, _ in entries)
            modal_shadow = counter.most_common(1)[0][0]
            sources = [s for sh, s in entries if sh == modal_shadow]
            tokens.set(token, _provenance(modal_shadow, sources, len(sources)))

    # ── Layout: container-max / gutters ────────────────────────────────────
    if container_widths:
        counter = Counter(w for w, _ in container_widths)
        modal_w = counter.most_common(1)[0][0]
        sources = [s for w, s in container_widths if w == modal_w]
        tokens.set("--container-max", _provenance(f"{modal_w}px", sources, len(sources)))
    if container_gutters:
        counter = Counter(g for g, _ in container_gutters)
        modal_g = counter.most_common(1)[0][0]
        sources = [s for g, s in container_gutters if g == modal_g]
        tokens.set("--container-gutter-desktop", _provenance(f"{modal_g}px", sources, len(sources)))

    # ── Section rhythm + per-viewport gutters (Task 2.4 feeds this) ────────
    if isinstance(viewports, dict):
        _apply_viewport_tokens(tokens, viewports)

    # ── Fill A2 fallbacks (semantic / motion / accent states) ──────────────
    root_vars = {}
    if isinstance(raw_css, dict):
        root_vars = raw_css.get("rootVars") or {}
    for name, fallback in OD_FALLBACK.items():
        if name in tokens:
            continue
        if name in root_vars:
            tokens.set(name, _provenance(root_vars[name], [":root"], 0))
        else:
            tokens.set(name, _provenance(fallback, [], 0))

    return tokens


def _modal_str(pairs: list[tuple[str, str]]):
    counter: Counter = Counter(v for v, _ in pairs)
    modal = counter.most_common(1)[0][0]
    sources = [s for v, s in pairs if v == modal]
    return modal, sources, len(sources)


def _map_radius_tokens(sorted_vals: list[int]) -> dict[str, int]:
    """Map ascending (non-pill) radii onto --radius-sm/md/lg preserving order."""
    names = RADIUS_TOKENS
    if len(sorted_vals) >= len(names):
        # Even spread across the three slots.
        step = len(sorted_vals) / len(names)
        picked = [sorted_vals[int(i * step)] for i in range(len(names))]
        return dict(zip(names, picked))
    return dict(zip(names[:len(sorted_vals)], sorted_vals))


def _apply_viewport_tokens(tokens: MeasuredTokens, viewports: dict) -> None:
    """Map per-viewport section rects → --section-y-* and --container-gutter-*."""
    section_key = {"desktop": "--section-y-desktop",
                   "tablet": "--section-y-tablet",
                   "phone": "--section-y-phone"}
    gutter_key = {"desktop": "--container-gutter-desktop",
                  "tablet": "--container-gutter-tablet",
                  "phone": "--container-gutter-phone"}
    for device in ("desktop", "tablet", "phone"):
        data = viewports.get(device) or {}
        if not isinstance(data, dict):
            continue
        section_ys = [_px(v) for v in data.get("sectionPaddingY", []) if _px(v)]
        section_ys = [v for v in section_ys if v and v > 0]
        if section_ys:
            counter: Counter = Counter(section_ys)
            modal = counter.most_common(1)[0][0]
            sources = [f"{device}:section"] * len(section_ys)
            tokens.set(section_key[device], _provenance(f"{modal}px", sources, len(section_ys)))
        gutters = [_px(v) for v in data.get("containerGutter", []) if _px(v)]
        gutters = [v for v in gutters if v and v > 0]
        if gutters:
            counter = Counter(gutters)
            modal = counter.most_common(1)[0][0]
            tokens.set(gutter_key[device], _provenance(f"{modal}px",
                        [f"{device}:container"] * len(gutters), len(gutters)))
