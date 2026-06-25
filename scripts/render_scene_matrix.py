#!/usr/bin/env python3
"""Render a per-brand scene matrix.

For an extracted brand, render six canonical layouts (hero, pricing, dashboard,
mobile, blog, signin) as standalone HTML files using only the brand's extracted
tokens, then capture each one as a PNG via the `agent-browser` CLI.

Outputs land at:

    ~/.claude/design-library/brands/<slug>/scene-matrix/<scene>.png

Each PNG is produced from a self-contained HTML document under
    /tmp/scene-matrix/<slug>/<scene>.html

(temporary HTMLs are left in place after run for debugging; they're cheap and
make it possible to inspect the rendered template).

Scope (anti-slop):
- Templates use ONLY extracted tokens. Missing tokens fall back to:
    surface=#FFFFFF on_surface=#000000 primary=#1971ED display="system-ui"
    body="system-ui" radius="8px" padding="24px"
  Fallbacks are logged via stderr.
- No emoji, no neon gradients, no border-l-N accents, no AI-slop affordances.
- Pillow is intentionally not required — agent-browser renders the PNGs.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
TMP_ROOT = Path("/tmp/scene-matrix")

SCENE_NAMES: list[str] = ["hero", "pricing", "dashboard", "mobile", "blog", "signin"]

VIEWPORTS: dict[str, tuple[int, int]] = {
    "hero": (1200, 800),
    "pricing": (1200, 800),
    "dashboard": (1200, 800),
    "mobile": (375, 667),
    "blog": (1200, 800),
    "signin": (1200, 800),
}


# ---------------------------------------------------------------------------
# Token loading + normalisation
# ---------------------------------------------------------------------------

_FALLBACK_TOKENS: dict[str, str] = {
    "primary": "#1971ED",
    "surface": "#FFFFFF",
    "on_surface": "#000000",
    "muted": "#6B7280",
    "border": "#E5E7EB",
    "display": "system-ui, -apple-system, Segoe UI, sans-serif",
    "body": "system-ui, -apple-system, Segoe UI, sans-serif",
    "radius": "8px",
    "padding": "24px",
}


def _warn(message: str) -> None:
    print(f"[render_scene_matrix] WARN: {message}", file=sys.stderr)


def _normalise_colour(raw: Any) -> str | None:
    """Accept hex (#rrggbb), rgb(...), rgba(...) and return a CSS colour string.

    Returns None if it can't be coerced.
    """

    if not isinstance(raw, str):
        return None
    value = raw.strip()
    if not value:
        return None
    if value.startswith("#"):
        return value
    if value.startswith("rgb"):
        return value
    return None


def _first_colour(entries: Any, exclude: set[str] | None = None) -> str | None:
    if not isinstance(entries, list):
        return None
    exclude = exclude or set()
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        value = _normalise_colour(entry.get("value"))
        if value and value.lower() not in exclude:
            return value
    return None


def _resolve_colours(tokens: dict[str, Any]) -> dict[str, str]:
    """Choose primary / surface / on_surface from the extracted token tree."""

    colours = tokens.get("colours") or {}
    if not isinstance(colours, dict):
        colours = {}

    # Try palette first (curated), fall back to computed (raw observed colours).
    palette = colours.get("palette")
    computed = colours.get("computed")

    primary: str | None = None
    surface: str | None = None
    on_surface: str | None = None

    if isinstance(palette, list) and palette:
        primary = _first_colour(palette)
    elif isinstance(palette, dict):
        for key in ("primary", "brand", "accent", "action"):
            value = _normalise_colour(palette.get(key))
            if value:
                primary = value
                break

    # Walk computed entries by role for surface / on_surface candidates.
    if isinstance(computed, list):
        backgrounds: list[str] = []
        texts: list[str] = []
        for entry in computed:
            if not isinstance(entry, dict):
                continue
            role = str(entry.get("role", ""))
            value = _normalise_colour(entry.get("value"))
            if not value:
                continue
            if role.startswith("background") and value not in backgrounds:
                backgrounds.append(value)
            elif role.startswith("text") and value not in texts:
                texts.append(value)
            elif role.startswith("h1") and not on_surface:
                on_surface = value

        # Surface: prefer the lightest background that isn't pure black.
        for candidate in backgrounds:
            if candidate.lower() in {"rgb(255, 255, 255)", "#ffffff", "#fff"}:
                surface = candidate
                break
        if not surface and backgrounds:
            surface = backgrounds[0]

        if not on_surface and texts:
            on_surface = texts[0]

        if not primary:
            # Find a non-neutral hue (not white/black/grey) for the primary.
            for entry in computed:
                if not isinstance(entry, dict):
                    continue
                value = _normalise_colour(entry.get("value"))
                if not value:
                    continue
                low = value.lower()
                if low in {"#ffffff", "#fff", "rgb(255, 255, 255)", "#000000", "#000", "rgb(0, 0, 0)", "rgb(0, 0, 6)"}:
                    continue
                # Skip near-greys; require some chromatic content for a primary.
                if "rgb(" in low:
                    inside = low.replace("rgb(", "").replace("rgba(", "").replace(")", "")
                    parts = [p.strip() for p in inside.split(",")[:3]]
                    try:
                        r, g, b = (int(parts[0]), int(parts[1]), int(parts[2]))
                    except ValueError:
                        continue
                    if max(r, g, b) - min(r, g, b) < 20:
                        continue
                primary = value
                break

    return {
        "primary": primary or _fallback("primary"),
        "surface": surface or _fallback("surface"),
        "on_surface": on_surface or _fallback("on_surface"),
    }


def _fallback(key: str) -> str:
    _warn(f"using fallback for {key}={_FALLBACK_TOKENS[key]}")
    return _FALLBACK_TOKENS[key]


def _resolve_fonts(tokens: dict[str, Any]) -> dict[str, str]:
    typography = tokens.get("typography") or {}
    if not isinstance(typography, dict):
        typography = {}

    display: str | None = None
    body: str | None = None

    families = typography.get("families")
    if isinstance(families, list):
        for entry in families:
            if not isinstance(entry, dict):
                continue
            role = str(entry.get("role", ""))
            value = entry.get("value")
            if not isinstance(value, str):
                continue
            if role in {"heading", "display", "h1"} and not display:
                display = value
            elif role in {"body", "paragraph", "text"} and not body:
                body = value

    samples = typography.get("samples") or {}
    if isinstance(samples, dict):
        if not display and isinstance(samples.get("h1"), dict):
            value = samples["h1"].get("fontFamily")
            if isinstance(value, str):
                display = value
        if not body and isinstance(samples.get("bodyText"), dict):
            value = samples["bodyText"].get("fontFamily")
            if isinstance(value, str):
                body = value

    if not display:
        display = _fallback("display")
    if not body:
        body = _fallback("body")

    # Always include a generic sans-serif fallback so unloaded brand fonts
    # don't render as block boxes in the screenshot.
    if "sans-serif" not in display and "serif" not in display:
        display = f"{display}, system-ui, sans-serif"
    if "sans-serif" not in body and "serif" not in body:
        body = f"{body}, system-ui, sans-serif"

    return {"display": display, "body": body}


def _resolve_radius_padding(tokens: dict[str, Any]) -> dict[str, str]:
    borders = tokens.get("borders") or {}
    radius: str | None = None
    if isinstance(borders, dict):
        radii = borders.get("radii")
        if isinstance(radii, list):
            # Prefer a moderate radius (4–16px) over 0 or 9999 for cards.
            scored: list[tuple[int, str]] = []
            for entry in radii:
                if not isinstance(entry, dict):
                    continue
                value = entry.get("value")
                if not isinstance(value, str) or not value.endswith("px"):
                    continue
                try:
                    px = int(value.replace("px", ""))
                except ValueError:
                    continue
                if 4 <= px <= 24:
                    scored.append((px, value))
            if scored:
                scored.sort()
                # pick smallest moderate radius (consistent w/ extracted minimum)
                radius = scored[0][1]

    spacing = tokens.get("spacing") or {}
    padding: str | None = None
    if isinstance(spacing, dict):
        scale = spacing.get("scale")
        if isinstance(scale, list):
            for value in scale:
                if isinstance(value, str) and value.endswith("px"):
                    try:
                        px = int(value.replace("px", ""))
                    except ValueError:
                        continue
                    if px >= 20:
                        padding = value
                        break

    if not radius:
        radius = _fallback("radius")
    if not padding:
        padding = _fallback("padding")

    return {"radius": radius, "padding": padding}


def load_tokens(slug: str) -> dict[str, str]:
    """Return the seven canonical tokens for the templates."""

    tokens_path = LIBRARY_ROOT / "brands" / slug / "design-tokens.json"
    if not tokens_path.exists():
        _warn(f"design-tokens.json not found for {slug}; using full fallback")
        return {
            "primary": _FALLBACK_TOKENS["primary"],
            "surface": _FALLBACK_TOKENS["surface"],
            "on_surface": _FALLBACK_TOKENS["on_surface"],
            "muted": _FALLBACK_TOKENS["muted"],
            "border": _FALLBACK_TOKENS["border"],
            "display": _FALLBACK_TOKENS["display"],
            "body": _FALLBACK_TOKENS["body"],
            "radius": _FALLBACK_TOKENS["radius"],
            "padding": _FALLBACK_TOKENS["padding"],
        }

    raw = json.loads(tokens_path.read_text("utf-8"))

    colours = _resolve_colours(raw)
    fonts = _resolve_fonts(raw)
    geometry = _resolve_radius_padding(raw)

    return {
        "primary": colours["primary"],
        "surface": colours["surface"],
        "on_surface": colours["on_surface"],
        "muted": _FALLBACK_TOKENS["muted"],
        "border": _FALLBACK_TOKENS["border"],
        "display": fonts["display"],
        "body": fonts["body"],
        "radius": geometry["radius"],
        "padding": geometry["padding"],
    }


# ---------------------------------------------------------------------------
# Asset discovery
# ---------------------------------------------------------------------------

_LOGO_PATTERNS = ("logo", "wordmark", "brandmark")


def find_logo(brand_dir: Path) -> Path | None:
    assets_dir = brand_dir / "assets"
    if not assets_dir.is_dir():
        return None

    # 1. Prefer explicit logo.svg / logo.png in the assets root.
    for name in ("logo.svg", "logo.png", "logo.webp"):
        candidate = assets_dir / name
        if candidate.is_file():
            return candidate

    # 2. Fall back to any image whose name contains "logo".
    candidates: list[Path] = []
    for path in assets_dir.iterdir():
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".svg", ".png", ".jpg", ".jpeg", ".webp"}:
            continue
        if any(pat in path.name.lower() for pat in _LOGO_PATTERNS):
            candidates.append(path)

    if not candidates:
        return None
    # Prefer SVG, then smallest filename (often the cleanest variant).
    candidates.sort(key=lambda p: (p.suffix.lower() != ".svg", len(p.name)))
    return candidates[0]


def _logo_data_uri(logo_path: Path | None) -> str | None:
    if logo_path is None:
        return None
    import base64
    import mimetypes

    mime, _ = mimetypes.guess_type(str(logo_path))
    if not mime:
        mime = "image/png"
    encoded = base64.b64encode(logo_path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------


def _common_styles(t: dict[str, str]) -> str:
    """Reset + token-driven base styles shared across scenes."""

    return f"""
*, *::before, *::after {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; }}
body {{
  font-family: {t['body']};
  color: {t['on_surface']};
  background: {t['surface']};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.45;
}}
h1, h2, h3 {{
  font-family: {t['display']};
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.01em;
}}
.btn {{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  border-radius: {t['radius']};
  font-family: {t['display']};
  font-weight: 600;
  font-size: 15px;
  background: {t['primary']};
  color: #ffffff;
  border: none;
  cursor: pointer;
  text-decoration: none;
}}
.btn--ghost {{
  background: transparent;
  color: {t['on_surface']};
}}
"""


def _wrap_html(title: str, body: str, styles: str) -> str:
    return (
        "<!doctype html>"
        "<html lang=\"en\"><head><meta charset=\"utf-8\">"
        f"<title>{html.escape(title)}</title>"
        f"<style>{styles}</style>"
        "</head><body>"
        f"{body}"
        "</body></html>"
    )


def template_hero(t: dict[str, str], logo_uri: str | None) -> str:
    styles = _common_styles(t) + f"""
.hero {{
  min-height: 100vh;
  background: {t['primary']};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px {t['padding']};
}}
.hero__inner {{
  max-width: 880px;
  text-align: left;
}}
.hero__eyebrow {{
  font-family: {t['body']};
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.78;
  margin-bottom: 28px;
}}
.hero__title {{
  font-size: 72px;
  line-height: 1.05;
  font-weight: 600;
  margin: 0 0 24px 0;
  color: #ffffff;
}}
.hero__sub {{
  font-size: 22px;
  line-height: 1.5;
  max-width: 640px;
  opacity: 0.88;
  margin: 0 0 40px 0;
}}
.hero__cta {{
  background: #ffffff;
  color: {t['primary']};
}}
.hero__logo {{
  height: 28px;
  margin-bottom: 56px;
  filter: brightness(0) invert(1);
}}
"""

    logo_html = (
        f'<img class="hero__logo" src="{logo_uri}" alt="brand logo">'
        if logo_uri
        else ""
    )

    body = f"""
<section class="hero">
  <div class="hero__inner">
    {logo_html}
    <div class="hero__eyebrow">Built for what comes next</div>
    <h1 class="hero__title">Make better decisions, faster.</h1>
    <p class="hero__sub">A unified surface for the data, models, and people that move
       your business — without the integration tax.</p>
    <a href="#" class="btn hero__cta">Get started</a>
  </div>
</section>
"""
    return _wrap_html("Hero", body, styles)


def template_pricing(t: dict[str, str], logo_uri: str | None) -> str:
    styles = _common_styles(t) + f"""
.page {{
  min-height: 100vh;
  padding: 80px {t['padding']};
  background: {t['surface']};
}}
.page__title {{
  font-size: 40px;
  margin-bottom: 12px;
  text-align: center;
}}
.page__sub {{
  font-size: 17px;
  color: {t['muted']};
  text-align: center;
  margin-bottom: 56px;
}}
.tiles {{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1080px;
  margin: 0 auto;
}}
.tile {{
  background: {t['surface']};
  border: 1px solid {t['border']};
  border-radius: {t['radius']};
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}}
.tile--featured {{
  border: 1px solid {t['primary']};
  box-shadow: 0 8px 28px rgba(0,0,0,0.06);
  transform: translateY(-6px);
}}
.tile__name {{ font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: {t['muted']}; }}
.tile__price {{ font-size: 44px; font-weight: 600; }}
.tile__price small {{ font-size: 16px; color: {t['muted']}; font-weight: 400; }}
.tile__features {{ list-style: none; padding: 0; margin: 8px 0 0 0; color: {t['on_surface']}; font-size: 15px; }}
.tile__features li {{ padding: 8px 0; border-top: 1px solid {t['border']}; }}
.tile__cta {{ margin-top: auto; align-self: stretch; justify-content: center; }}
.tile__cta--ghost {{
  background: transparent;
  color: {t['primary']};
  border: 1px solid {t['border']};
}}
"""

    body = f"""
<section class="page">
  <h1 class="page__title">Simple, transparent pricing</h1>
  <p class="page__sub">Pick the plan that matches your scale. Cancel any time.</p>
  <div class="tiles">
    <div class="tile">
      <div class="tile__name">Starter</div>
      <div class="tile__price">$0<small> / month</small></div>
      <ul class="tile__features">
        <li>Up to 3 projects</li>
        <li>Community support</li>
        <li>Single environment</li>
      </ul>
      <a href="#" class="btn tile__cta tile__cta--ghost">Start free</a>
    </div>
    <div class="tile tile--featured">
      <div class="tile__name">Team</div>
      <div class="tile__price">$24<small> / seat / mo</small></div>
      <ul class="tile__features">
        <li>Unlimited projects</li>
        <li>Email support, 24h</li>
        <li>Staging + production</li>
      </ul>
      <a href="#" class="btn tile__cta">Choose Team</a>
    </div>
    <div class="tile">
      <div class="tile__name">Enterprise</div>
      <div class="tile__price">Custom</div>
      <ul class="tile__features">
        <li>SSO + audit logs</li>
        <li>Dedicated success manager</li>
        <li>99.95% SLA</li>
      </ul>
      <a href="#" class="btn tile__cta tile__cta--ghost">Talk to sales</a>
    </div>
  </div>
</section>
"""
    return _wrap_html("Pricing", body, styles)


def template_dashboard(t: dict[str, str], logo_uri: str | None) -> str:
    styles = _common_styles(t) + f"""
.shell {{
  min-height: 100vh;
  background: #f7f7f8;
  padding: 48px {t['padding']};
}}
.shell__header {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}}
.shell__title {{ font-size: 28px; font-weight: 600; }}
.shell__sub {{ color: {t['muted']}; font-size: 14px; margin-top: 4px; }}
.kpis {{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}}
.kpi {{
  background: {t['surface']};
  border: 1px solid {t['border']};
  border-radius: {t['radius']};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}}
.kpi__label {{ font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: {t['muted']}; }}
.kpi__value {{ font-family: {t['display']}; font-size: 38px; font-weight: 600; line-height: 1; }}
.kpi__delta {{ font-size: 12px; color: {t['muted']}; }}
.kpi__chart {{ height: 56px; width: 100%; }}
.kpi__chart rect {{ fill: {t['primary']}; }}
.kpi__chart rect.dim {{ opacity: 0.4; }}
"""

    def bars(values: list[float]) -> str:
        bar_width = 14
        gap = 6
        max_v = max(values) or 1
        rects = []
        for idx, v in enumerate(values):
            h = max(4, int((v / max_v) * 52))
            x = idx * (bar_width + gap)
            y = 56 - h
            cls = "" if idx >= len(values) - 3 else "dim"
            rects.append(
                f'<rect class="{cls}" x="{x}" y="{y}" width="{bar_width}" height="{h}" rx="2"></rect>'
            )
        return f'<svg class="kpi__chart" viewBox="0 0 240 56" preserveAspectRatio="none">{"".join(rects)}</svg>'

    cards = [
        ("Active users", "12,418", "+6.2% vs last week", [3, 5, 4, 6, 8, 7, 11]),
        ("Conversion", "4.8%", "+0.4 pts", [2, 3, 2, 4, 5, 5, 6]),
        ("Revenue", "$284k", "+11% MoM", [4, 6, 5, 7, 8, 9, 12]),
        ("Latency p95", "184ms", "-22ms vs target", [10, 9, 8, 7, 6, 5, 4]),
    ]

    tiles_html = "".join(
        f"""
        <div class="kpi">
          <div class="kpi__label">{label}</div>
          <div class="kpi__value">{value}</div>
          <div class="kpi__delta">{delta}</div>
          {bars(values)}
        </div>
        """
        for label, value, delta, values in cards
    )

    body = f"""
<section class="shell">
  <header class="shell__header">
    <div>
      <div class="shell__title">Operations overview</div>
      <div class="shell__sub">Last 7 days, all regions</div>
    </div>
    <a href="#" class="btn">Export report</a>
  </header>
  <div class="kpis">
    {tiles_html}
  </div>
</section>
"""
    return _wrap_html("Dashboard", body, styles)


def template_mobile(t: dict[str, str], logo_uri: str | None) -> str:
    styles = _common_styles(t) + f"""
.phone {{
  min-height: 100vh;
  background: #f1f1f3;
  padding: 0;
  display: flex;
  flex-direction: column;
}}
.status {{
  height: 44px;
  background: {t['surface']};
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: {t['on_surface']};
}}
.status__dots {{ display: flex; gap: 4px; }}
.status__dots span {{ width: 4px; height: 4px; background: {t['on_surface']}; border-radius: 50%; }}
.app__header {{
  background: {t['surface']};
  padding: 16px 20px 20px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid {t['border']};
}}
.app__title {{ font-family: {t['display']}; font-size: 20px; font-weight: 600; }}
.app__logo {{ height: 24px; }}
.app__body {{
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}}
.card {{
  background: {t['surface']};
  border: 1px solid {t['border']};
  border-radius: {t['radius']};
  padding: 18px;
}}
.card__label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: {t['muted']}; }}
.card__value {{ font-family: {t['display']}; font-size: 28px; font-weight: 600; margin-top: 4px; }}
.card__meta {{ color: {t['muted']}; font-size: 13px; margin-top: 6px; }}
.app__cta {{ width: 100%; padding: 16px; }}
"""

    logo_html = (
        f'<img class="app__logo" src="{logo_uri}" alt="brand">'
        if logo_uri
        else f'<div class="app__title">Brand</div>'
    )

    body = f"""
<section class="phone">
  <div class="status">
    <span>9:41</span>
    <span class="status__dots"><span></span><span></span><span></span></span>
  </div>
  <header class="app__header">
    <div class="app__title">Today</div>
    {logo_html}
  </header>
  <div class="app__body">
    <div class="card">
      <div class="card__label">Balance</div>
      <div class="card__value">$4,218.40</div>
      <div class="card__meta">+$84.20 this week</div>
    </div>
    <div class="card">
      <div class="card__label">Next session</div>
      <div class="card__value">Tomorrow 9:00</div>
      <div class="card__meta">Review weekly OKRs</div>
    </div>
    <a href="#" class="btn app__cta">Open today's plan</a>
  </div>
</section>
"""
    return _wrap_html("Mobile", body, styles)


def template_blog(t: dict[str, str], logo_uri: str | None) -> str:
    styles = _common_styles(t) + f"""
.page {{
  min-height: 100vh;
  padding: 64px {t['padding']};
  background: {t['surface']};
  max-width: 960px;
  margin: 0 auto;
}}
.page__title {{ font-size: 40px; margin-bottom: 8px; }}
.page__sub {{ color: {t['muted']}; font-size: 16px; margin-bottom: 44px; }}
.row {{
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  padding: 24px 0;
  border-top: 1px solid {t['border']};
}}
.row:last-child {{ border-bottom: 1px solid {t['border']}; }}
.thumb {{
  width: 200px;
  height: 120px;
  border-radius: {t['radius']};
  background: {t['primary']};
}}
.thumb--soft {{ opacity: 0.85; }}
.thumb--softer {{ opacity: 0.7; }}
.thumb--softest {{ opacity: 0.55; }}
.row__title {{ font-family: {t['display']}; font-size: 22px; font-weight: 600; margin: 0 0 8px 0; }}
.row__excerpt {{ font-size: 15px; color: {t['on_surface']}; opacity: 0.78; margin: 0 0 12px 0; }}
.row__meta {{ font-size: 13px; color: {t['muted']}; }}
"""

    posts = [
        ("How we cut p95 latency by 40% in eight weeks",
         "A series of small, boring engineering decisions, in the order we made them.",
         "12 May 2026", ""),
        ("The case against premature platforms",
         "Three teams. Three rewrites. One uncomfortable lesson about leverage.",
         "08 May 2026", " thumb--soft"),
        ("Designing for the second user",
         "Most products optimise for the first user. The second one is where retention lives.",
         "02 May 2026", " thumb--softer"),
        ("What changed in the data stack this quarter",
         "Roundup of the moves, mergers, and small tools worth installing this week.",
         "29 Apr 2026", " thumb--softest"),
        ("Quiet metrics that actually predict churn",
         "Forget NPS. These six behavioural signals do the work nobody talks about.",
         "21 Apr 2026", ""),
    ]

    rows = "".join(
        f"""
        <article class="row">
          <div class="thumb{tone}"></div>
          <div>
            <h2 class="row__title">{html.escape(title)}</h2>
            <p class="row__excerpt">{html.escape(excerpt)}</p>
            <div class="row__meta">{html.escape(date)} · 5 min read</div>
          </div>
        </article>
        """
        for title, excerpt, date, tone in posts
    )

    body = f"""
<section class="page">
  <h1 class="page__title">Notes from the team</h1>
  <p class="page__sub">Field notes on product, engineering, and the day-to-day of running the platform.</p>
  {rows}
</section>
"""
    return _wrap_html("Blog", body, styles)


def template_signin(t: dict[str, str], logo_uri: str | None) -> str:
    styles = _common_styles(t) + f"""
.shell {{
  min-height: 100vh;
  background: #f7f7f8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px {t['padding']};
}}
.card {{
  background: {t['surface']};
  border: 1px solid {t['border']};
  border-radius: {t['radius']};
  width: 400px;
  padding: 40px 32px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.04);
}}
.card__logo {{ height: 32px; display: block; margin: 0 auto 28px auto; }}
.card__title {{ font-size: 24px; text-align: center; margin: 0 0 6px 0; }}
.card__sub {{ font-size: 14px; color: {t['muted']}; text-align: center; margin: 0 0 28px 0; }}
.field {{ margin-bottom: 18px; }}
.field label {{ display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: {t['on_surface']}; }}
.field input {{
  width: 100%;
  padding: 12px 14px;
  border: 1px solid {t['border']};
  border-radius: {t['radius']};
  font-family: {t['body']};
  font-size: 15px;
  color: {t['on_surface']};
  background: {t['surface']};
}}
.card__submit {{ width: 100%; margin-top: 8px; }}
.card__alt {{
  text-align: center;
  font-size: 13px;
  color: {t['muted']};
  margin-top: 22px;
}}
.card__alt a {{ color: {t['primary']}; text-decoration: none; font-weight: 500; }}
"""

    logo_html = (
        f'<img class="card__logo" src="{logo_uri}" alt="brand">'
        if logo_uri
        else ""
    )

    body = f"""
<section class="shell">
  <div class="card">
    {logo_html}
    <h1 class="card__title">Welcome back</h1>
    <p class="card__sub">Sign in to your account to continue.</p>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" value="alex@example.com">
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" type="password" value="••••••••••">
    </div>
    <button class="btn card__submit">Sign in</button>
    <div class="card__alt">Don't have an account? <a href="#">Create one</a></div>
  </div>
</section>
"""
    return _wrap_html("Sign in", body, styles)


_TEMPLATES = {
    "hero": template_hero,
    "pricing": template_pricing,
    "dashboard": template_dashboard,
    "mobile": template_mobile,
    "blog": template_blog,
    "signin": template_signin,
}


# ---------------------------------------------------------------------------
# Render + screenshot
# ---------------------------------------------------------------------------


def render_scene(scene_name: str, tokens: dict[str, str], brand_dir: Path) -> Path:
    """Write the HTML for a single scene to /tmp/scene-matrix/<slug>/<scene>.html."""

    if scene_name not in _TEMPLATES:
        raise ValueError(f"unknown scene: {scene_name}")

    slug = brand_dir.name
    tmp_dir = TMP_ROOT / slug
    tmp_dir.mkdir(parents=True, exist_ok=True)

    logo_path = find_logo(brand_dir)
    logo_uri = _logo_data_uri(logo_path)

    document = _TEMPLATES[scene_name](tokens, logo_uri)
    out_path = tmp_dir / f"{scene_name}.html"
    out_path.write_text(document, encoding="utf-8")
    return out_path


def screenshot_scene(html_path: Path, output_path: Path, viewport: tuple[int, int]) -> None:
    """Render `html_path` with agent-browser at `viewport` and save PNG to `output_path`."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    width, height = viewport

    file_url = f"file://{html_path.resolve()}"

    # agent-browser uses a persistent session — give scene matrix its own.
    session_name = f"scene-matrix-{html_path.parent.name}"
    common = ["--session", session_name]

    # Set viewport, then open, then capture full page so all content is in frame
    # even if the scene exceeds the default viewport height.
    subprocess.run(
        ["agent-browser", *common, "set", "viewport", str(width), str(height)],
        check=True,
        capture_output=True,
    )
    subprocess.run(
        ["agent-browser", *common, "open", file_url],
        check=True,
        capture_output=True,
    )
    # Capture only the configured viewport (not full page) so the framing
    # matches the scene's intended canvas size.
    subprocess.run(
        ["agent-browser", *common, "screenshot", str(output_path)],
        check=True,
        capture_output=True,
    )


def build_matrix(slug: str) -> list[Path]:
    brand_dir = LIBRARY_ROOT / "brands" / slug
    if not brand_dir.is_dir():
        raise FileNotFoundError(f"brand directory not found: {brand_dir}")

    tokens = load_tokens(slug)
    out_dir = brand_dir / "scene-matrix"
    out_dir.mkdir(parents=True, exist_ok=True)

    outputs: list[Path] = []
    for scene in SCENE_NAMES:
        html_path = render_scene(scene, tokens, brand_dir)
        png_path = out_dir / f"{scene}.png"
        try:
            screenshot_scene(html_path, png_path, VIEWPORTS[scene])
        except subprocess.CalledProcessError as exc:
            stderr = exc.stderr.decode("utf-8", errors="replace") if exc.stderr else ""
            _warn(f"agent-browser failed for scene={scene}: {stderr.strip()}")
            raise
        outputs.append(png_path)
    return outputs


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="Render the scene matrix for an extracted brand")
    parser.add_argument("--slug", required=True, help="Brand slug, e.g. quantium-com-au")
    args = parser.parse_args()

    if shutil.which("agent-browser") is None:
        print(
            "[render_scene_matrix] ERROR: agent-browser CLI not found on PATH",
            file=sys.stderr,
        )
        return 2

    paths = build_matrix(args.slug)
    for path in paths:
        print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
