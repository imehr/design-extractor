#!/usr/bin/env python3
"""Generate standalone HTML replicas of extracted brand pages.

For each key page with cached DOM data, emit ``brands/<slug>/replica-html/<page>.html``:
a single self-contained HTML file whose structure is a deterministic transform of the
extracted DOM (snapshot HTML when available, structured dom-extraction JSON otherwise)
and whose styling comes exclusively from design-system materials (design tokens +
downloaded assets). No content is fabricated: every heading, link, image, and colour
traces back to extraction evidence.

Usage:
    python3 scripts/generate_html_replicas.py --slug <slug> [--page <page-slug> ...] [--verify]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path

from bs4 import BeautifulSoup, Comment, Tag

REPO_ROOT = Path(__file__).resolve().parent.parent
LIBRARY_ROOT = Path.home() / ".claude" / "design-library"

SNAPSHOT_SUFFIX = "-snapshot.html"

# Fragment-extraction artefacts that look page-shaped but duplicate a real page
# (e.g. luminary-ai-full.json, stateofaidesign-com-sections.json).
FRAGMENT_STEM_SUFFIXES = (
    "-full", "-sections", "-raw", "-comprehensive", "-fulltext", "-text",
    "-main", "-header", "-header-detail", "-footer", "-logo", "-logo-search",
)

# Tags removed entirely (scripts, original styling, embeds, tracking).
STRIP_TAGS = {
    "script", "noscript", "style", "link", "meta", "iframe",
    "embed", "object", "template", "base", "source", "track", "canvas",
}

# Attributes kept on regular (non-SVG) elements after the transform.
KEEP_ATTRS = {
    "href", "src", "alt", "title", "width", "height", "role", "lang",
    "colspan", "rowspan", "type", "value", "placeholder", "datetime",
    "aria-label", "aria-hidden", "data-role",
}

FONT_EXTENSIONS = {".woff2", ".woff", ".ttf", ".otf"}
FONT_FORMAT = {".woff2": "woff2", ".woff": "woff", ".ttf": "truetype", ".otf": "opentype"}
FONT_WEIGHT_HINTS = [
    ("thin", 100), ("extralight", 200), ("ultralight", 200), ("light", 300),
    ("medium", 500), ("semibold", 600), ("demibold", 600), ("extrabold", 800),
    ("ultrabold", 800), ("black", 900), ("heavy", 900), ("bold", 700),
    ("regular", 400), ("book", 400),
]

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".ico"}

BUTTON_CLASS_RE = re.compile(r"\b(btn|button|cta)\b", re.IGNORECASE)
# Utility classes that hide an element at desktop widths (the replica viewport).
DESKTOP_HIDDEN_CLASS_RE = re.compile(r"\b(?:md|lg|xl|2xl):hidden\b")
# Responsive utilities that re-show an element hidden by a bare `hidden` class.
RESPONSIVE_SHOW_CLASS_RE = re.compile(
    r"\b(?:sm|md|lg|xl|2xl):(?:flex|block|grid|inline|inline-block|inline-flex|table|contents)\b"
)
HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
URL_IN_CSS_RE = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)")
BACKGROUND_IMAGE_RE = re.compile(r"background(?:-image)?\s*:\s*[^;]*url\(", re.IGNORECASE)


# --------------------------------------------------------------------------- pages

@dataclass
class PageSource:
    page_slug: str
    url: str = ""
    snapshot_path: Path | None = None
    dom_json_path: Path | None = None


@dataclass
class GenerationContext:
    slug: str
    asset_index: "AssetIndex"
    out_dir: Path
    page_urls: dict[str, str] = field(default_factory=dict)  # page_slug -> original URL
    warnings: list[str] = field(default_factory=list)
    missing_assets: list[str] = field(default_factory=list)
    copied: dict[str, str] = field(default_factory=dict)  # resolved abs path -> rel ref


def dom_extraction_dirs(slug: str, repo_root: Path, library_root: Path) -> list[Path]:
    """Candidate directories holding dom-extraction artefacts, in priority order."""
    return [
        repo_root / "cache" / slug / "dom-extraction",
        repo_root / "cache" / "dom-extraction",
        library_root / "brands" / slug / "dom-extraction",
        library_root / "cache" / slug / "dom-extraction",
    ]


def _looks_like_page_json(data: object) -> bool:
    return (
        isinstance(data, dict)
        and bool(data.get("url"))
        and (isinstance(data.get("sections"), list) or isinstance(data.get("headings"), list))
    )


def _page_slug_from_stem(stem: str) -> str:
    return "homepage" if stem in {"index", "home", ""} else stem


def discover_pages(slug: str, repo_root: Path = REPO_ROOT,
                   library_root: Path = LIBRARY_ROOT) -> list[PageSource]:
    """Find every page with extracted DOM evidence (snapshot HTML or page JSON)."""
    pages: dict[str, PageSource] = {}

    for directory in dom_extraction_dirs(slug, repo_root, library_root):
        if not directory.is_dir():
            continue
        shared_top_level = directory == repo_root / "cache" / "dom-extraction"

        manifest = directory / "html-snapshots-manifest.json"
        manifest_urls: dict[str, str] = {}
        if manifest.exists():
            try:
                entries = json.loads(manifest.read_text(encoding="utf-8")).get("files", [])
                manifest_urls = {
                    e["slug"]: e.get("effective_url") or e.get("url", "")
                    for e in entries if isinstance(e, dict) and e.get("slug")
                }
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        for snap in sorted(directory.glob(f"*{SNAPSHOT_SUFFIX}")):
            page_slug = _page_slug_from_stem(snap.name[: -len(SNAPSHOT_SUFFIX)])
            page = pages.setdefault(page_slug, PageSource(page_slug=page_slug))
            if page.snapshot_path is None:
                page.snapshot_path = snap
            if not page.url:
                page.url = manifest_urls.get(page_slug, "")

        for json_path in sorted(directory.glob("*.json")):
            name = json_path.name
            if name == "html-snapshots-manifest.json" or name.endswith("-measurements.json"):
                continue
            if shared_top_level and not name.startswith(f"{slug}"):
                continue
            if json_path.stem.endswith(FRAGMENT_STEM_SUFFIXES):
                continue
            try:
                data = json.loads(json_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                continue
            if isinstance(data, str):
                # Some older runs double-encoded the payload.
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    continue
            if not _looks_like_page_json(data):
                continue
            stem = json_path.stem
            if shared_top_level:
                stem = stem[len(slug):].lstrip("-") or "index"
            page_slug = _page_slug_from_stem(stem)
            page = pages.setdefault(page_slug, PageSource(page_slug=page_slug))
            if page.dom_json_path is None:
                page.dom_json_path = json_path
            if not page.url:
                page.url = str(data.get("url") or "")

    return sorted(pages.values(), key=lambda p: (p.page_slug != "homepage", p.page_slug))


def load_page_json(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, str):
        data = json.loads(data)
    return data if isinstance(data, dict) else {}


# --------------------------------------------------------------------------- assets

class AssetIndex:
    """Maps original asset URLs to locally downloaded files.

    Built from every known asset root for the brand. Resolution is by URL
    basename, with a deterministic fallback for content-hash-suffixed local
    names (``foo.png`` matching ``foo_1234.png``).
    """

    def __init__(self, roots: list[Path]):
        self.by_name: dict[str, Path] = {}
        self.by_stem: dict[str, list[Path]] = {}
        for root in roots:
            if not root.is_dir():
                continue
            for path in sorted(root.rglob("*")):
                if not path.is_file():
                    continue
                name = path.name.lower()
                self.by_name.setdefault(name, path)
                stem = path.stem.lower()
                self.by_stem.setdefault(stem, []).append(path)

    @staticmethod
    def normalise_url(src: str) -> str:
        """Reduce an asset reference to its meaningful file basename."""
        src = src.strip()
        parsed = urllib.parse.urlparse(src)
        # Image-proxy URLs (e.g. /_vercel/image?url=_astro%2Ffoo.png&w=2048)
        if parsed.query:
            params = urllib.parse.parse_qs(parsed.query)
            for key in ("url", "src", "image"):
                if key in params and params[key]:
                    return AssetIndex.normalise_url(urllib.parse.unquote(params[key][0]))
        path = urllib.parse.unquote(parsed.path)
        return Path(path).name

    def resolve(self, src: str) -> Path | None:
        name = self.normalise_url(src).lower()
        if not name:
            return None
        if name in self.by_name:
            return self.by_name[name]
        stem = Path(name).stem
        ext = Path(name).suffix
        if stem in self.by_stem:
            candidates = [p for p in self.by_stem[stem] if not ext or p.suffix.lower() == ext]
            if candidates:
                return candidates[0]
        # Local copies may carry a content-hash suffix: foo.png -> foo_1234.png
        prefix = f"{stem}_"
        matches = [
            paths[0] for key, paths in sorted(self.by_stem.items())
            if key.startswith(prefix) and paths
            and (not ext or paths[0].suffix.lower() == ext)
        ]
        return matches[0] if matches else None

    def font_files(self) -> list[Path]:
        return sorted(
            {p for p in self.by_name.values() if p.suffix.lower() in FONT_EXTENSIONS},
            key=lambda p: p.name,
        )


def asset_roots(slug: str, repo_root: Path = REPO_ROOT,
                library_root: Path = LIBRARY_ROOT) -> list[Path]:
    return [
        repo_root / "cache" / slug / "assets",
        repo_root / "ui" / "public" / "brands" / slug,
        library_root / "brands" / slug / "assets",
        library_root / "cache" / slug / "assets",
    ]


def copy_asset(resolved: Path, ctx: GenerationContext) -> str:
    """Copy a resolved asset into the replica assets dir; return the relative ref."""
    key = str(resolved)
    if key in ctx.copied:
        return ctx.copied[key]
    sub = "fonts" if resolved.suffix.lower() in FONT_EXTENSIONS else ""
    dest_dir = ctx.out_dir / "assets" / sub if sub else ctx.out_dir / "assets"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / resolved.name
    if not dest.exists():
        shutil.copy2(resolved, dest)
    rel = f"assets/{sub}/{resolved.name}" if sub else f"assets/{resolved.name}"
    ctx.copied[key] = rel
    return rel


def resolve_and_copy(src: str, ctx: GenerationContext) -> str | None:
    resolved = ctx.asset_index.resolve(src)
    if resolved is None:
        ctx.missing_assets.append(src)
        return None
    return copy_asset(resolved, ctx)


# --------------------------------------------------------------------------- tokens

@dataclass
class TokenSet:
    css_vars: dict[str, str]
    source: str
    warnings: list[str] = field(default_factory=list)

    def families(self) -> list[str]:
        """Distinct first-font family names from --font-* tokens."""
        seen: list[str] = []
        for name, value in self.css_vars.items():
            if not name.startswith("--font-") or name.startswith("--font-size") \
                    or name.startswith("--font-weight"):
                continue
            family = value.split(",")[0].strip().strip("'\"")
            if family and family not in seen:
                seen.append(family)
        return seen


def sanitise_token_name(raw: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", str(raw).lower()).strip("-")
    return cleaned or "token"


def _is_dtcg(data: dict) -> bool:
    if "$schema" in data or "$metadata" in data:
        return True
    color = data.get("color")
    if isinstance(color, dict):
        return any(isinstance(v, dict) and "$value" in v for v in color.values())
    return False


def _walk_dtcg_group(group: dict, prefix: str, out: dict[str, str]) -> None:
    for key, node in group.items():
        if key.startswith("$") or not isinstance(node, dict):
            continue
        if "$value" in node:
            out[f"{prefix}{sanitise_token_name(key)}"] = str(node["$value"])
        else:
            _walk_dtcg_group(node, f"{prefix}{sanitise_token_name(key)}-", out)


def _add_typography(vars_out: dict[str, str], typography: dict) -> None:
    families = typography.get("families") or []
    role_seen: set[str] = set()
    for index, item in enumerate(families):
        if not isinstance(item, dict) or not item.get("value"):
            continue
        role = sanitise_token_name(item.get("role") or ("body" if index == 0 else f"family-{index + 1}"))
        if role in role_seen:
            continue
        role_seen.add(role)
        vars_out[f"--font-{role}"] = str(item["value"])
    if "--font-body" not in vars_out:
        for candidate in ("--font-heading", "--font-family-2"):
            if candidate in vars_out:
                vars_out["--font-body"] = vars_out[candidate]
                break
    sizes = [item.get("value") for item in typography.get("sizes") or [] if isinstance(item, dict)]
    numeric = sorted(
        {s for s in sizes if isinstance(s, str) and s.endswith("px")},
        key=lambda s: float(s[:-2]), reverse=True,
    )
    for level, value in zip(("h1", "h2", "h3", "h4"), numeric):
        vars_out[f"--font-size-{level}"] = value
    weights = [item.get("value") for item in typography.get("weights") or [] if isinstance(item, dict)]
    if weights:
        ordered = sorted({str(w) for w in weights if str(w).isdigit()}, key=int)
        if ordered:
            vars_out["--font-weight-regular"] = ordered[0]
            vars_out["--font-weight-bold"] = ordered[-1]


def _add_spacing(vars_out: dict[str, str], spacing: dict) -> None:
    for index, value in enumerate(spacing.get("scale") or [], start=1):
        vars_out[f"--space-{index}"] = str(value)
    if spacing.get("max_width"):
        vars_out["--max-width"] = str(spacing["max_width"])
    if spacing.get("content_padding"):
        vars_out["--space-content"] = str(spacing["content_padding"])


def _add_radii(vars_out: dict[str, str], radii: list) -> None:
    values: list[str] = []
    for item in radii:
        value = item.get("value") if isinstance(item, dict) else item
        if isinstance(value, str) and value not in values:
            values.append(value)

    def _px(v: str) -> float:
        try:
            return float(v.replace("px", ""))
        except ValueError:
            return 0.0

    ordered = sorted(values, key=_px)
    pills = [v for v in ordered if _px(v) >= 999]
    regular = [v for v in ordered if v not in pills]
    names = ("none", "sm", "md", "lg", "xl", "2xl")
    for name, value in zip(names, regular):
        vars_out[f"--radius-{name}"] = value
    if pills:
        vars_out["--radius-pill"] = pills[0]


def _add_shadows(vars_out: dict[str, str], shadows: list) -> None:
    for index, item in enumerate(shadows, start=1):
        value = item.get("value") if isinstance(item, dict) else item
        if isinstance(value, str) and value:
            vars_out[f"--shadow-{index}"] = value


def _vars_from_dtcg(data: dict) -> dict[str, str]:
    vars_out: dict[str, str] = {}
    if isinstance(data.get("color"), dict):
        _walk_dtcg_group(data["color"], "--color-", vars_out)
    if isinstance(data.get("gradient"), dict):
        _walk_dtcg_group(data["gradient"], "--gradient-", vars_out)
    if isinstance(data.get("typography"), dict):
        _add_typography(vars_out, data["typography"])
    spacing = data.get("spacing")
    if isinstance(spacing, dict):
        if any(isinstance(v, dict) and "$value" in v for v in spacing.values()):
            _walk_dtcg_group(spacing, "--space-", vars_out)
        else:
            _add_spacing(vars_out, spacing)
    radii = data.get("radii") or (data.get("border") or {}).get("radii") \
        or (data.get("borders") or {}).get("radii") or []
    if isinstance(data.get("border"), dict) and any(
            isinstance(v, dict) and "$value" in v for v in data["border"].values()):
        _walk_dtcg_group(data["border"], "--radius-", vars_out)
    elif radii:
        _add_radii(vars_out, radii)
    shadows = data.get("shadow") or data.get("shadows") or []
    if isinstance(shadows, dict):
        _walk_dtcg_group(shadows, "--shadow-", vars_out)
    elif isinstance(shadows, list):
        _add_shadows(vars_out, shadows)
    return vars_out


def _vars_from_stage(data: dict) -> dict[str, str]:
    vars_out: dict[str, str] = {}
    colours = data.get("colours") or {}
    computed = colours.get("computed") if isinstance(colours, dict) else colours
    for item in computed or []:
        if not isinstance(item, dict) or not item.get("value"):
            continue
        role = sanitise_token_name(item.get("role") or item["value"])
        name = f"--color-{role}"
        if name not in vars_out:
            vars_out[name] = str(item["value"])
    custom = colours.get("custom_properties") if isinstance(colours, dict) else None
    for key, value in (custom or {}).items():
        name = f"--color-{sanitise_token_name(key)}"
        if isinstance(value, str) and name not in vars_out:
            vars_out[name] = value
    if isinstance(data.get("typography"), dict):
        _add_typography(vars_out, data["typography"])
    if isinstance(data.get("spacing"), dict):
        _add_spacing(vars_out, data["spacing"])
    radii = (data.get("borders") or {}).get("radii") or []
    _add_radii(vars_out, radii)
    shadows = data.get("shadows") or []
    if isinstance(shadows, list):
        _add_shadows(vars_out, shadows)
    return vars_out


def _to_rgb(value):
    """Parse #hex / #fff / rgb()/rgba() into an (r,g,b) tuple, else None."""
    if not isinstance(value, str):
        return None
    v = value.strip()
    if v.startswith("#"):
        clean = v.lstrip("#")
        if len(clean) == 3:
            clean = "".join(ch * 2 for ch in clean)
        if len(clean) != 6:
            return None
        try:
            return int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16)
        except ValueError:
            return None
    m = re.match(r"rgba?\(\s*([0-9.]+)[, ]+([0-9.]+)[, ]+([0-9.]+)", v)
    if m:
        try:
            return int(float(m.group(1))), int(float(m.group(2))), int(float(m.group(3)))
        except ValueError:
            return None
    return None


def _channel_lin(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def _color_luminance(value):
    rgb = _to_rgb(value)
    if rgb is None:
        return None
    r, g, b = rgb
    return 0.2126 * _channel_lin(r) + 0.7152 * _channel_lin(g) + 0.0722 * _channel_lin(b)


def _color_chroma(value) -> int | None:
    rgb = _to_rgb(value)
    if rgb is None:
        return None
    return max(rgb) - min(rgb)


def _contrast_ratio(c1, c2) -> float:
    l1 = _color_luminance(c1)
    l2 = _color_luminance(c2)
    if l1 is None or l2 is None:
        return 0.0
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def _ensure_semantic_colours(vars_out: dict[str, str], page_data: dict,
                             warnings: list[str]) -> None:
    """Guarantee --color-bg / --color-text using extracted evidence only."""
    styles = page_data.get("styles") or {}

    def first_matching(*needles: str) -> str | None:
        for needle in needles:  # needle order encodes priority
            for name, value in vars_out.items():
                if needle in name.lower():
                    return value
        return None

    if "--color-bg" not in vars_out:
        value = styles.get("bodyBg") or first_matching(
            "bodybg", "background", "surface-white", "bg", "surface")
        if value:
            vars_out["--color-bg"] = str(value)
        else:
            vars_out["--color-bg"] = "Canvas"
            warnings.append("no extracted background colour found; using system Canvas")
    if "--color-text" not in vars_out:
        value = styles.get("bodyColor") or first_matching("text", "foreground")
        if value:
            vars_out["--color-text"] = str(value)
        else:
            vars_out["--color-text"] = "CanvasText"
            warnings.append("no extracted text colour found; using system CanvasText")
    if "--color-primary" not in vars_out:
        value = first_matching("primary", "accent", "brand")
        if value:
            vars_out["--color-primary"] = value

    # Contrast guard: a dark-themed site often has its real page background filed
    # under dark/footerDark while --color-bg picked up backgroundLight and
    # --color-text is white — yielding invisible white-on-light text. If the
    # chosen pair is illegible, swap --color-bg for the best contrasting
    # candidate already present in vars_out. Never invents a colour.
    bg = vars_out.get("--color-bg")
    text = vars_out.get("--color-text")
    if bg and text and bg != "Canvas" and text != "CanvasText":
        ratio = _contrast_ratio(bg, text)
        if ratio < 3.0:
            want_dark_bg = (_color_luminance(text) or 0) > 0.4
            eligible: list[tuple[str, float, float]] = []
            for value in vars_out.values():
                if value in (bg, text):
                    continue
                lum = _color_luminance(value)
                if lum is None:
                    continue
                if want_dark_bg and lum > 0.4:
                    continue
                if not want_dark_bg and lum < 0.4:
                    continue
                r = _contrast_ratio(value, text)
                if r > ratio:
                    eligible.append((value, r, lum))
            # Prefer chromatic brand colours (navy/maroon, which carry hue) over
            # achromatic greys/blacks/whites, so a dark site keeps its real brand
            # background instead of collapsing to #000 or #333.
            chromatic = [e for e in eligible if (_color_chroma(e[0]) or 0) > 20]
            pool = chromatic or eligible
            if pool:
                pool.sort(key=lambda e: e[1], reverse=True)
                best, best_ratio = pool[0][0], pool[0][1]
                vars_out["--color-bg"] = best
                warnings.append(
                    f"low-contrast body bg/text (ratio {ratio:.1f}); "
                    f"swapped --color-bg to {best} (ratio {best_ratio:.1f})"
                )


def _derive_from_page(page_data: dict) -> dict[str, str]:
    """Minimal token set derived from dom-extraction measurements (no invention)."""
    vars_out: dict[str, str] = {}
    styles = page_data.get("styles") or {}
    mapping = {
        "bodyBg": "--color-bg", "bodyColor": "--color-text",
        "h1Color": "--color-heading",
    }
    for key, var in mapping.items():
        if styles.get(key):
            vars_out[var] = str(styles[key])
    if styles.get("bodyFont"):
        vars_out["--font-body"] = str(styles["bodyFont"])
    if styles.get("h1Font"):
        vars_out["--font-heading"] = str(styles["h1Font"])
    if styles.get("h1Size"):
        vars_out["--font-size-h1"] = str(styles["h1Size"])
    for item in page_data.get("fonts") or []:
        if not isinstance(item, dict) or not item.get("family"):
            continue
        role = sanitise_token_name(item.get("type") or "body")
        vars_out.setdefault(f"--font-{role}", str(item["family"]))
    return vars_out


def load_tokens(slug: str, page_data: dict | None = None, repo_root: Path = REPO_ROOT,
                library_root: Path = LIBRARY_ROOT) -> TokenSet:
    page_data = page_data or {}
    warnings: list[str] = []
    candidates = [
        repo_root / "brands" / slug / "design-tokens.json",
        library_root / "brands" / slug / "design-tokens.json",
    ]
    for path in candidates:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            warnings.append(f"unreadable token file {path}: {exc}")
            continue
        if not isinstance(data, dict):
            continue
        vars_out = _vars_from_dtcg(data) if _is_dtcg(data) else _vars_from_stage(data)
        if vars_out:
            _ensure_semantic_colours(vars_out, page_data, warnings)
            return TokenSet(css_vars=vars_out, source=str(path), warnings=warnings)

    vars_out = _derive_from_page(page_data)
    warnings.append(
        "no design-tokens.json found; derived a minimal token set from cached "
        "extraction data — run the publish pipeline (WS1) for full tokens"
    )
    _ensure_semantic_colours(vars_out, page_data, warnings)
    return TokenSet(css_vars=vars_out, source="derived-from-extraction", warnings=warnings)


# ----------------------------------------------------------------- snapshot transform

def _normalise_link_target(href: str) -> str:
    parsed = urllib.parse.urlparse(href)
    path = parsed.path.rstrip("/")
    return f"{parsed.netloc}{path}".lower()


def rewrite_href(href: str, ctx: GenerationContext, current_page: str) -> str:
    href = (href or "").strip()
    if not href or href.startswith("#"):
        return href or "#"
    if href.startswith(("mailto:", "tel:")):
        return href
    target = _normalise_link_target(href)
    for page_slug, url in ctx.page_urls.items():
        if not url:
            continue
        if target == _normalise_link_target(url):
            return "#" if page_slug == current_page else f"{page_slug}.html"
    # Path-segment match: /careers/ -> careers.html
    segment = urllib.parse.urlparse(href).path.strip("/").split("/")[-1].lower()
    if segment and segment in ctx.page_urls and segment != current_page:
        return f"{segment}.html"
    return "#"


def _hidden_in_desktop_view(tag: Tag) -> bool:
    """True for elements the original page hides at desktop width.

    Without the original stylesheet, responsive duplicates (mobile menus,
    marquee clones marked aria-hidden) would all render at once; dropping
    them keeps the desktop structure faithful.
    """
    if tag.has_attr("hidden"):
        return True
    if (tag.get("aria-hidden") or "").lower() == "true" and tag.name != "svg" \
            and tag.find("svg") is None:
        return True
    classes = " ".join(tag.get("class") or [])
    if not classes:
        return False
    if DESKTOP_HIDDEN_CLASS_RE.search(classes):
        return True
    tokens = classes.split()
    if "hidden" in tokens and not RESPONSIVE_SHOW_CLASS_RE.search(classes):
        return True
    return False


def _clean_attributes(tag: Tag) -> None:
    if tag.name == "svg" or tag.find_parent("svg") is not None:
        for attr in [a for a in tag.attrs if a.lower().startswith("on") or a == "class"]:
            del tag[attr]
        return
    classes = " ".join(tag.get("class") or []) if tag.get("class") else ""
    style = tag.get("style") or ""
    for attr in list(tag.attrs):
        if attr not in KEEP_ATTRS:
            del tag[attr]
    if tag.name == "a" and classes and BUTTON_CLASS_RE.search(classes):
        tag["data-role"] = "button"
    if style and BACKGROUND_IMAGE_RE.search(style):
        tag["data-extracted-bg"] = style  # resolved later, then removed


def _apply_background_images(soup: BeautifulSoup, ctx: GenerationContext) -> None:
    for tag in soup.find_all(attrs={"data-extracted-bg": True}):
        style = tag["data-extracted-bg"]
        del tag["data-extracted-bg"]
        match = URL_IN_CSS_RE.search(style)
        if not match:
            continue
        rel = resolve_and_copy(match.group(1), ctx)
        if rel:
            tag["style"] = (
                f"background-image:url('{rel}');background-size:cover;"
                "background-position:center"
            )


def _set_role(tag: Tag, role: str, force: bool = False) -> None:
    if force or not tag.get("data-role"):
        tag["data-role"] = role


def _tag_roles(soup: BeautifulSoup) -> None:
    for name in ("header", "nav", "main", "footer"):
        for tag in soup.find_all(name):
            _set_role(tag, name)
    sections = soup.find_all("section")
    for tag in sections:
        _set_role(tag, "section")
    hero = None
    if sections:
        hero = sections[0]
    else:
        h1 = soup.find("h1")
        if h1 is not None:
            hero = h1.find_parent(["section", "div", "main"])
    if hero is not None:
        _set_role(hero, "hero", force=True)
    for lst in soup.find_all("ul"):
        if lst.find_parent("nav") is None and len(lst.find_all("li", recursive=False)) >= 3:
            _set_role(lst, "card-list")


def transform_snapshot(html_text: str, ctx: GenerationContext,
                       current_page: str) -> tuple[str, str]:
    """Deterministically transform a rendered DOM snapshot into clean structure.

    Returns (title, body_inner_html).
    """
    soup = BeautifulSoup(html_text, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else ctx.slug

    for tag in soup.find_all(list(STRIP_TAGS)):
        tag.decompose()
    for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
        comment.extract()

    body = soup.body or soup

    for tag in list(body.find_all(True)):
        if not tag.decomposed and _hidden_in_desktop_view(tag):
            tag.decompose()

    for tag in body.find_all(True):
        _clean_attributes(tag)

    for img in list(body.find_all("img")):
        src = img.get("src") or ""
        rel = resolve_and_copy(src, ctx) if src else None
        if rel is None:
            img.decompose()
            continue
        img["src"] = rel
        if img.get("loading"):
            del img["loading"]  # lazy-loading skews full-page capture
    # <picture> wrappers lost their <source> children; unwrap to the img.
    for picture in list(body.find_all("picture")):
        picture.unwrap()

    for anchor in body.find_all("a"):
        anchor["href"] = rewrite_href(anchor.get("href", ""), ctx, current_page)

    for video in list(body.find_all("video")):
        video.decompose()

    _apply_background_images(body if isinstance(body, Tag) else soup, ctx)
    _tag_roles(soup)

    inner = body.decode_contents() if isinstance(body, Tag) else str(soup)
    return title, inner


# ------------------------------------------------------------- structured JSON build

def _esc(text: str) -> str:
    return (
        str(text).replace("&", "&amp;").replace("<", "&lt;")
        .replace(">", "&gt;").replace('"', "&quot;")
    )


def build_from_dom_json(data: dict, ctx: GenerationContext,
                        current_page: str) -> tuple[str, str]:
    """Build clean page structure from structured dom-extraction JSON.

    Only emits content present in the extraction (header, sections, headings,
    links, images, footer). Returns (title, body_inner_html).
    """
    title = str(data.get("title") or ctx.slug)
    parts: list[str] = []

    header = data.get("header") or {}
    parts.append('<header data-role="header"><div data-role="header-inner">')
    logo = header.get("logo") or {}
    if isinstance(logo, dict) and logo.get("src"):
        rel = resolve_and_copy(logo["src"], ctx)
        if rel:
            parts.append(
                f'<a href="#" data-role="logo"><img src="{_esc(rel)}" '
                f'alt="{_esc(logo.get("alt") or title)}"></a>'
            )
    elif header.get("logoSvg"):
        parts.append(f'<a href="#" data-role="logo">{header["logoSvg"]}</a>')
    nav_links = [l for l in header.get("navLinks") or [] if isinstance(l, dict) and l.get("text")]
    if nav_links:
        parts.append('<nav data-role="nav"><ul>')
        for link in nav_links:
            href = rewrite_href(str(link.get("href") or ""), ctx, current_page)
            parts.append(f'<li><a href="{_esc(href)}">{_esc(link["text"])}</a></li>')
        parts.append("</ul></nav>")
    parts.append("</div></header>")

    parts.append('<main data-role="main">')
    used_headings: set[str] = set()
    used_images: set[str] = set()
    sections = [s for s in data.get("sections") or [] if isinstance(s, dict)]
    for index, section in enumerate(sections):
        role = "hero" if index == 0 or section.get("sectionType") == "hero" else "section"
        parts.append(f'<section data-role="{role}">')
        heading = section.get("heading")
        if heading:
            level = "h1" if role == "hero" else "h2"
            parts.append(f"<{level}>{_esc(heading)}</{level}>")
            used_headings.add(str(heading).strip())
        if section.get("text"):
            parts.append(f"<p>{_esc(section['text'])}</p>")
        images = [i for i in section.get("images") or [] if isinstance(i, dict) and i.get("src")]
        if images:
            parts.append('<div data-role="card-list">')
            for image in images:
                rel = resolve_and_copy(image["src"], ctx)
                used_images.add(image["src"])
                if rel:
                    parts.append(
                        f'<figure><img src="{_esc(rel)}" alt="{_esc(image.get("alt") or "")}" '
                        '>'
                        + (f"<figcaption>{_esc(image['alt'])}</figcaption>" if image.get("alt") else "")
                        + "</figure>"
                    )
            parts.append("</div>")
        for bg in section.get("backgroundImages") or []:
            src = bg.get("src") if isinstance(bg, dict) else bg
            if isinstance(src, str) and src:
                rel = resolve_and_copy(src, ctx)
                used_images.add(src)
                if rel:
                    parts.append(
                        f'<div data-role="section-bg" style="background-image:url(\'{_esc(rel)}\');'
                        'background-size:cover;background-position:center"></div>'
                    )
        parts.append("</section>")

    remaining = [
        h for h in data.get("headings") or []
        if isinstance(h, dict) and h.get("text") and str(h["text"]).strip() not in used_headings
    ]
    if remaining:
        parts.append('<section data-role="section" data-source="extracted-headings">')
        for item in remaining:
            level = str(item.get("level") or "h2").lower()
            level = level if level in {"h1", "h2", "h3", "h4", "h5", "h6"} else "h2"
            parts.append(f"<{level}>{_esc(item['text'])}</{level}>")
        parts.append("</section>")

    leftover_images = [
        i for i in data.get("allImages") or []
        if isinstance(i, dict) and i.get("src") and i["src"] not in used_images
    ]
    rendered_leftovers: list[str] = []
    for image in leftover_images:
        rel = resolve_and_copy(image["src"], ctx)
        if rel:
            rendered_leftovers.append(
                f'<figure><img src="{_esc(rel)}" alt="{_esc(image.get("alt") or "")}"></figure>'
            )
    if rendered_leftovers:
        parts.append('<section data-role="section" data-source="extracted-images">'
                     '<div data-role="card-list">')
        parts.extend(rendered_leftovers)
        parts.append("</div></section>")
    parts.append("</main>")

    footer = data.get("footer") or {}
    if isinstance(footer, dict) and (footer.get("text") or footer.get("links")):
        parts.append('<footer data-role="footer">')
        if footer.get("text"):
            parts.append(f"<p>{_esc(footer['text'])}</p>")
        footer_links = [l for l in footer.get("links") or [] if isinstance(l, dict) and l.get("text")]
        if footer_links:
            parts.append("<ul>")
            for link in footer_links:
                href = rewrite_href(str(link.get("href") or ""), ctx, current_page)
                parts.append(f'<li><a href="{_esc(href)}">{_esc(link["text"])}</a></li>')
            parts.append("</ul>")
        parts.append("</footer>")

    return title, "".join(parts)


# --------------------------------------------------------------------------- styling

def _normalise_family(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def match_font_faces(tokens: TokenSet, ctx: GenerationContext) -> list[str]:
    """@font-face rules for downloaded fonts matching token families."""
    families = tokens.families()
    rules: list[str] = []
    seen: set[tuple[str, int, str]] = set()
    for font_path in ctx.asset_index.font_files():
        norm_file = _normalise_family(font_path.stem)
        matched = next((f for f in families if _normalise_family(f) and _normalise_family(f) in norm_file), None)
        if matched is None:
            continue
        weight = 400
        for hint, value in FONT_WEIGHT_HINTS:
            if hint in norm_file:
                weight = value
                break
        style = "italic" if ("italic" in norm_file or "oblique" in norm_file) else "normal"
        key = (matched, weight, style)
        if key in seen:
            continue
        # Prefer woff2 when multiple formats exist for the same face.
        if font_path.suffix.lower() != ".woff2":
            woff2_twin = font_path.with_suffix(".woff2")
            if woff2_twin.name.lower() in ctx.asset_index.by_name:
                continue
        seen.add(key)
        rel = copy_asset(font_path, ctx)
        fmt = FONT_FORMAT[font_path.suffix.lower()]
        rules.append(
            "@font-face{font-family:'%s';src:url('%s') format('%s');"
            "font-weight:%d;font-style:%s;font-display:swap}"
            % (matched, rel, fmt, weight, style)
        )
    return rules


def generate_css(tokens: TokenSet, font_faces: list[str]) -> str:
    """Token-driven stylesheet. Outside :root, colours appear only as var() refs."""
    root_lines = "".join(f"{name}:{value};" for name, value in tokens.css_vars.items())
    rules = f":root{{{root_lines}}}\n" + "\n".join(font_faces) + "\n"
    rules += (
        "*,*::before,*::after{box-sizing:border-box}\n"
        "body{margin:0;background:var(--color-bg);color:var(--color-text);"
        "font-family:var(--font-body, system-ui, sans-serif);line-height:1.5}\n"
        "h1,h2,h3,h4,h5,h6{font-family:var(--font-heading, var(--font-body, system-ui, sans-serif));"
        "line-height:1.15;margin:0 0 0.5em}\n"
        "h1{font-size:var(--font-size-h1, 3rem);font-weight:var(--font-weight-bold, 700)}\n"
        "h2{font-size:var(--font-size-h2, 2rem)}\n"
        "h3{font-size:var(--font-size-h3, 1.5rem)}\n"
        "a{color:var(--color-primary, inherit);text-decoration:none}\n"
        "a:hover{text-decoration:underline}\n"
        "img{max-width:100%;height:auto;display:block}\n"
        "[data-role=header]{background:var(--color-bg);"
        "border-bottom:1px solid var(--color-border, var(--color-text))}\n"
        "[data-role=header-inner],[data-role=hero]>*,[data-role=section]>*,"
        "[data-role=footer]>*{max-width:var(--max-width, 1200px);margin-left:auto;margin-right:auto}\n"
        "[data-role=header-inner]{display:flex;align-items:center;gap:var(--space-6, 2rem);"
        "padding:var(--space-3, 1rem) var(--space-5, 1.5rem)}\n"
        "[data-role=logo] img,[data-role=logo] svg{max-height:3rem;width:auto}\n"
        "[data-role=nav] ul{display:flex;flex-wrap:wrap;gap:var(--space-4, 1.25rem);"
        "list-style:none;margin:0;padding:0}\n"
        "[data-role=hero]{padding:var(--space-9, 4rem) var(--space-5, 1.5rem)}\n"
        "[data-role=section]{padding:var(--space-7, 2.5rem) var(--space-5, 1.5rem)}\n"
        "[data-role=section-bg]{min-height:18rem}\n"
        "[data-role=card-list]{display:grid;"
        "grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));"
        "gap:var(--space-5, 1.5rem);list-style:none;margin:0;padding:0}\n"
        "[data-role=card-list]>li,[data-role=card-list]>figure{margin:0;"
        "border-radius:var(--radius-md, var(--radius-sm, 0));"
        "box-shadow:var(--shadow-1, none);overflow:hidden}\n"
        "figure{margin:0}\n"
        "figcaption{font-size:0.875rem;padding:var(--space-2, 0.5rem) 0}\n"
        "[data-role=button]{display:inline-block;background:var(--color-primary, var(--color-text));"
        "color:var(--color-bg);padding:var(--space-2, 0.6rem) var(--space-5, 1.5rem);"
        "border-radius:var(--radius-pill, var(--radius-md, 0.5rem))}\n"
        "[data-role=button]:hover{text-decoration:none;opacity:0.85}\n"
        "[data-role=footer]{background:var(--color-footer-bg, var(--color-text));"
        "color:var(--color-bg);padding:var(--space-8, 3rem) var(--space-5, 1.5rem);margin-top:var(--space-8, 3rem)}\n"
        "[data-role=footer] a{color:var(--color-bg)}\n"
        "[data-role=footer] ul{list-style:none;margin:var(--space-3, 1rem) 0 0;padding:0;"
        "display:flex;flex-wrap:wrap;gap:var(--space-4, 1.25rem)}\n"
    )
    return rules


def render_document(title: str, body_inner: str, css: str, slug: str, source: str) -> str:
    return (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{_esc(title)}</title>\n"
        f"<!-- generated by generate_html_replicas.py | brand: {_esc(slug)} | "
        f"tokens: {_esc(source)} -->\n"
        f"<style>\n{css}</style>\n</head>\n<body>\n{body_inner}\n</body>\n</html>\n"
    )


# --------------------------------------------------------------------------- compare

def build_compare_html(
    slug: str,
    page_slugs: list[str],
    tokens: TokenSet,
    mirrored: dict[str, bool] | None = None,
) -> str:
    options = "".join(
        f'<option value="{_esc(p)}">{_esc(p)}</option>' for p in page_slugs
    )
    # Mirror existence is determined at emit time: under file:// the iframe
    # contentDocument is null (unique-origin policy), so runtime probing
    # cannot distinguish "missing" from "present but opaque".
    mirrored_json = json.dumps(mirrored) if mirrored is not None else "null"
    colour_vars = [n for n in tokens.css_vars if n.startswith("--color-")][:12]
    swatches = "".join(
        f'<span class="swatch" style="background:var({name})" title="{_esc(name)}"></span>'
        for name in colour_vars
    )
    root_lines = "".join(f"{n}:{v};" for n, v in tokens.css_vars.items())
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{_esc(slug)} — original vs token replica</title>
<style>
:root{{{root_lines}}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;height:100vh}}
header{{display:flex;align-items:center;gap:1rem;padding:0.6rem 1rem;border-bottom:1px solid color-mix(in srgb, CanvasText 15%, Canvas)}}
header h1{{font-size:1rem;margin:0;font-weight:600}}
.swatches{{display:flex;gap:0.25rem}}
.swatch{{width:1.1rem;height:1.1rem;border-radius:0.25rem;border:1px solid color-mix(in srgb, CanvasText 25%, Canvas);display:inline-block}}
.controls{{margin-left:auto;display:flex;align-items:center;gap:0.75rem;font-size:0.85rem}}
select{{font:inherit;padding:0.2rem 0.4rem}}
main{{flex:1;display:grid;grid-template-columns:1fr 1fr;min-height:0}}
.pane{{display:flex;flex-direction:column;min-width:0;border-right:1px solid color-mix(in srgb, CanvasText 15%, Canvas)}}
.pane:last-child{{border-right:none}}
.pane .label{{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;padding:0.35rem 0.75rem;border-bottom:1px solid color-mix(in srgb, CanvasText 10%, Canvas)}}
.pane .frame-wrap{{position:relative;flex:1;min-height:0}}
iframe{{width:100%;height:100%;border:0}}
.missing{{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:0.9rem;background:Canvas}}
.missing.visible{{display:flex}}
</style>
</head>
<body>
<header>
  <h1>{_esc(slug)}</h1>
  <div class="swatches">{swatches}</div>
  <div class="controls">
    <label>Page
      <select id="page-select">{options}</select>
    </label>
    <label><input type="checkbox" id="sync-scroll" checked> Sync scroll</label>
  </div>
</header>
<main>
  <div class="pane">
    <div class="label">Original mirror</div>
    <div class="frame-wrap">
      <iframe id="frame-original" title="Original mirror"></iframe>
      <div class="missing" id="original-missing">Original mirror not yet generated
        (expected at ../original/&lt;page&gt;/index.html)</div>
    </div>
  </div>
  <div class="pane">
    <div class="label">Token replica</div>
    <div class="frame-wrap">
      <iframe id="frame-replica" title="Token replica"></iframe>
    </div>
  </div>
</main>
<script>
(function () {{
  var select = document.getElementById('page-select');
  var original = document.getElementById('frame-original');
  var replica = document.getElementById('frame-replica');
  var missing = document.getElementById('original-missing');
  var sync = document.getElementById('sync-scroll');
  var MIRRORED = {mirrored_json};

  function checkOriginal() {{
    if (MIRRORED !== null) return; // build-time knowledge wins over probing
    try {{
      var doc = original.contentDocument;
      var empty = !doc || !doc.body || doc.body.childElementCount === 0;
      missing.classList.toggle('visible', empty);
    }} catch (err) {{
      missing.classList.remove('visible');
    }}
  }}

  function load(page) {{
    if (MIRRORED !== null) {{
      var has = !!MIRRORED[page];
      missing.classList.toggle('visible', !has);
      if (has) {{
        original.src = '../original/' + page + '/index.html';
      }} else {{
        original.removeAttribute('src');
      }}
    }} else {{
      missing.classList.remove('visible');
      original.src = '../original/' + page + '/index.html';
    }}
    replica.src = page + '.html';
  }}

  original.addEventListener('load', checkOriginal);
  original.addEventListener('error', function () {{ missing.classList.add('visible'); }});

  function bindScroll() {{
    try {{
      replica.contentWindow.addEventListener('scroll', function () {{
        if (!sync.checked) return;
        try {{
          var src = replica.contentWindow;
          var dst = original.contentWindow;
          var srcMax = src.document.documentElement.scrollHeight - src.innerHeight;
          var dstMax = dst.document.documentElement.scrollHeight - dst.innerHeight;
          if (srcMax > 0 && dstMax > 0) {{
            dst.scrollTo(0, (src.scrollY / srcMax) * dstMax);
          }}
        }} catch (err) {{ /* cross-frame access unavailable */ }}
      }});
    }} catch (err) {{ /* cross-frame access unavailable */ }}
  }}
  replica.addEventListener('load', bindScroll);

  select.addEventListener('change', function () {{ load(select.value); }});
  load(select.value);
}})();
</script>
</body>
</html>
"""


# ---------------------------------------------------------------------------- verify

def verify_pages(out_dir: Path, page_slugs: list[str]) -> list[dict]:
    """Screenshot each replica via agent-browser; report path + non-blank check."""
    shots_dir = out_dir / "screenshots"
    shots_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []
    for page_slug in page_slugs:
        html_path = out_dir / f"{page_slug}.html"
        shot_path = shots_dir / f"{page_slug}.png"
        record: dict = {"page": page_slug, "screenshot": str(shot_path), "ok": False}
        try:
            subprocess.run(
                ["agent-browser", "open", html_path.resolve().as_uri()],
                check=True, capture_output=True, text=True, timeout=60,
            )
            subprocess.run(
                ["agent-browser", "screenshot", str(shot_path), "--full"],
                check=True, capture_output=True, text=True, timeout=60,
            )
            record["ok"] = shot_path.exists() and shot_path.stat().st_size > 1024
            record["bytes"] = shot_path.stat().st_size if shot_path.exists() else 0
            record["blank"] = _is_blank_png(shot_path) if record["ok"] else None
        except FileNotFoundError:
            record["error"] = "agent-browser not found on PATH"
        except subprocess.TimeoutExpired:
            record["error"] = "agent-browser timed out"
        except subprocess.CalledProcessError as exc:
            record["error"] = (exc.stderr or exc.stdout or str(exc)).strip()[:500]
        results.append(record)
    try:
        subprocess.run(["agent-browser", "close"], capture_output=True, timeout=30)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return results


def _is_blank_png(path: Path) -> bool | None:
    """True when the screenshot is a single flat colour. None if Pillow missing."""
    try:
        from PIL import Image
    except ImportError:
        return None
    with Image.open(path) as img:
        extrema = img.convert("RGB").getextrema()
    return all(lo == hi for lo, hi in extrema)


# ------------------------------------------------------------------------------ main

def generate_for_slug(slug: str, only_pages: list[str] | None = None,
                      verify: bool = False, repo_root: Path = REPO_ROOT,
                      library_root: Path = LIBRARY_ROOT) -> dict:
    pages = discover_pages(slug, repo_root, library_root)
    if only_pages:
        wanted = set(only_pages)
        pages = [p for p in pages if p.page_slug in wanted]
        missing = wanted - {p.page_slug for p in pages}
        if missing:
            raise SystemExit(
                f"no cached DOM data for page(s): {', '.join(sorted(missing))} "
                f"(brand {slug})"
            )
    if not pages:
        raise SystemExit(
            f"no cached DOM data found for brand '{slug}' — looked in: "
            + ", ".join(str(d) for d in dom_extraction_dirs(slug, repo_root, library_root))
        )

    out_dir = repo_root / "brands" / slug / "replica-html"
    out_dir.mkdir(parents=True, exist_ok=True)

    index = AssetIndex(asset_roots(slug, repo_root, library_root))
    ctx = GenerationContext(
        slug=slug, asset_index=index, out_dir=out_dir,
        page_urls={p.page_slug: p.url for p in pages},
    )

    first_page_data: dict = {}
    for page in pages:
        if page.dom_json_path:
            first_page_data = load_page_json(page.dom_json_path)
            break
    tokens = load_tokens(slug, first_page_data, repo_root, library_root)
    ctx.warnings.extend(tokens.warnings)

    font_faces = match_font_faces(tokens, ctx)
    css = generate_css(tokens, font_faces)

    generated: list[str] = []
    failures: list[dict] = []
    for page in pages:
        try:
            if page.snapshot_path is not None:
                html_text = page.snapshot_path.read_text(encoding="utf-8", errors="replace")
                title, body_inner = transform_snapshot(html_text, ctx, page.page_slug)
            else:
                data = load_page_json(page.dom_json_path)
                title, body_inner = build_from_dom_json(data, ctx, page.page_slug)
        except Exception as exc:  # surface, never silently skip
            failures.append({"page": page.page_slug, "error": f"{type(exc).__name__}: {exc}"})
            continue
        document = render_document(title, body_inner, css, slug, tokens.source)
        (out_dir / f"{page.page_slug}.html").write_text(document, encoding="utf-8")
        generated.append(page.page_slug)

    if generated:
        mirrored = {
            page: (out_dir.parent / "original" / page / "index.html").is_file()
            for page in generated
        }
        compare = build_compare_html(slug, generated, tokens, mirrored)
        (out_dir / "compare.html").write_text(compare, encoding="utf-8")

    verify_results = verify_pages(out_dir, generated) if (verify and generated) else []

    manifest = {
        "slug": slug,
        "token_source": tokens.source,
        "pages": generated,
        "failures": failures,
        "warnings": ctx.warnings,
        "missing_assets": sorted(set(ctx.missing_assets)),
        "verify": verify_results,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )

    # Mirror to the library brand dir so the file API (/api/brands/<slug>/file/)
    # serves the HTML replicas — the repo copy serves the artifacts API.
    import shutil
    lib_dir = library_root / "brands" / slug / "replica-html"
    lib_dir.mkdir(parents=True, exist_ok=True)
    for item in out_dir.iterdir():
        target = lib_dir / item.name
        if item.is_file():
            shutil.copy2(item, target)
        elif item.is_dir():
            shutil.copytree(item, target, dirs_exist_ok=True)

    return manifest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate standalone token-styled HTML replicas for a brand."
    )
    parser.add_argument("--slug", required=True, help="Brand slug (e.g. luminary-ai)")
    parser.add_argument(
        "--page", action="append", default=None,
        help="Limit to specific page slug(s); repeatable",
    )
    parser.add_argument(
        "--verify", action="store_true",
        help="Screenshot each replica via agent-browser",
    )
    args = parser.parse_args(argv)

    manifest = generate_for_slug(args.slug, args.page, args.verify)

    out_dir = REPO_ROOT / "brands" / args.slug / "replica-html"
    print(f"Generated {len(manifest['pages'])} page(s) in {out_dir}")
    for page in manifest["pages"]:
        print(f"  {page}.html")
    if manifest["pages"]:
        print("  compare.html")
    for failure in manifest["failures"]:
        print(f"FAILED {failure['page']}: {failure['error']}", file=sys.stderr)
    for warning in manifest["warnings"]:
        print(f"WARNING: {warning}", file=sys.stderr)
    if manifest["missing_assets"]:
        print(
            f"WARNING: {len(manifest['missing_assets'])} asset reference(s) had no "
            "local download and were omitted (see manifest.json)", file=sys.stderr,
        )
    for record in manifest["verify"]:
        status = "ok" if record.get("ok") else f"FAILED ({record.get('error', 'unknown')})"
        blank = record.get("blank")
        note = " [BLANK IMAGE]" if blank else ""
        print(f"verify {record['page']}: {status}{note} -> {record['screenshot']}")
    return 1 if manifest["failures"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
