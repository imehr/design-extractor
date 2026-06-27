#!/usr/bin/env python3
"""Visual-fidelity eval for a generated brand test-case scenario.

Screenshots the rendered scenario (via the `agent-browser` CLI) and scores
how on-brand it looks against the extracted palette:

  - rendered    : the page is not blank (enough pixel variety)
  - palette     : the dominant rendered colours actually belong to the brand
                  palette (catches "claims to use tokens but renders generic
                  blue/grey" regressions)
  - variety     : enough distinct colours are used (not a single flat fill)

Writes a JSON result to stdout (and a PNG thumbnail next to the scenario):

  {
    "score": 0-100,
    "blank": false,
    "screenshot": "test-cases/<caseId>.png",
    "dominant": [{"hex": "#rrggbb", "frac": 0.42, "matched": true}, ...],
    "checks": [{"id","label","status","details"}, ...]
  }

Best-effort: any infrastructure failure (agent-browser missing, screenshot
fails) returns status:"skipped" so generation never blocks on the visual pass.
Stdlib + Pillow only.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LIBRARY_ROOT = Path.home() / ".claude" / "design-library"

# Redmean colour distance below which two colours read as the same brand colour.
PALETTE_MATCH_THRESHOLD = 65.0
RENDER_VARIETY_MIN = 12.0  # luminance std-dev below this => likely blank/flat


def _err(msg: str) -> None:
    print(f"[evaluate_scenario_visual] {msg}", file=sys.stderr)


def hex_to_rgb(h: str) -> tuple[int, int, int] | None:
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return None
    try:
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except ValueError:
        return None


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % rgb


def redmean(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    r1, g1, b1 = a
    r2, g2, b2 = b
    rmean = (r1 + r2) / 2
    dr, dg, db = r1 - r2, g1 - g2, b1 - b2
    return math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db)


def load_brand_palette(slug: str) -> list[tuple[int, int, int]]:
    """Collect every distinct brand colour (semantic palette + computed values)."""
    candidates = [
        LIBRARY_ROOT / "brands" / slug / "design-tokens.json",
        REPO_ROOT / "brands" / slug / "design-tokens.json",
    ]
    colours: list[tuple[int, int, int]] = []
    seen: set[tuple[int, int, int]] = set()
    for tokens_path in candidates:
        if not tokens_path.exists():
            continue
        try:
            data = json.loads(tokens_path.read_text())
        except Exception:
            continue
        colour_block = data.get("colours") or {}
        # semantic palette + raw role values
        palette = colour_block.get("palette") if isinstance(colour_block, dict) else None
        if isinstance(palette, dict):
            for value in palette.values():
                rgb = hex_to_rgb(str(value)) if isinstance(value, str) else None
                if rgb and rgb not in seen:
                    seen.add(rgb)
                    colours.append(rgb)
        # computed colour observations
        computed = colour_block.get("computed") if isinstance(colour_block, dict) else None
        if isinstance(computed, list):
            for item in computed:
                if isinstance(item, dict):
                    rgb = _parse_rgb_value(item.get("value"))
                    if rgb and rgb not in seen:
                        seen.add(rgb)
                        colours.append(rgb)
        break
    return colours


def _parse_rgb_value(value) -> tuple[int, int, int] | None:
    if not isinstance(value, str):
        return None
    v = value.strip()
    if v.startswith("#"):
        return hex_to_rgb(v)
    if v.lower().startswith("rgb"):
        parts = [p for p in v.replace("rgba", "rgb").replace("rgb(", "").replace(")", "").split(",") if p.strip()]
        if len(parts) >= 3:
            try:
                return int(float(parts[0])), int(float(parts[1])), int(float(parts[2]))
            except ValueError:
                return None
    return None


def _agent_browser_capture(url: str, output: Path, viewport: tuple[int, int], slug: str, case_id: str) -> None:
    width, height = viewport
    session = f"scenario-visual-{slug}-{case_id}"[:40]
    common = ["--session", session]
    subprocess.run(["agent-browser", *common, "set", "viewport", str(width), str(height)], check=True, capture_output=True)
    subprocess.run(["agent-browser", *common, "open", url], check=True, capture_output=True)
    # allow paints/fonts/images to settle before the viewport capture
    import time

    time.sleep(1.5)
    subprocess.run(["agent-browser", *common, "screenshot", str(output)], check=True, capture_output=True)


def analyse(png: Path, palette: list[tuple[int, int, int]]) -> dict:
    try:
        from PIL import Image
        import statistics
    except ImportError:
        return {"error": "Pillow is required"}

    with Image.open(png) as raw:
        img = raw.convert("RGB")
    small = img.resize((160, 100))
    pixels = list(small.getdata())
    luminance = [0.2126 * r + 0.7152 * g + 0.0722 * b for (r, g, b) in pixels]
    variety = statistics.pstdev(luminance) if luminance else 0.0

    quant = small.quantize(colors=8)
    pal = quant.getpalette() or []
    hist = quant.histogram()
    total = float(sum(hist[:8])) or 1.0
    dominant = []
    for i in range(8):
        frac = hist[i] / total
        if frac <= 0:
            continue
        rgb = (pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2])
        matched = False
        if palette:
            nearest = min(palette, key=lambda c: redmean(rgb, c))
            matched = redmean(rgb, nearest) < PALETTE_MATCH_THRESHOLD
        dominant.append({"hex": rgb_to_hex(rgb), "frac": round(frac, 4), "matched": matched})

    matched_frac = sum(d["frac"] for d in dominant if d["matched"])
    distinct = len([d for d in dominant if d["frac"] > 0.05])

    checks = []
    rendered = variety >= RENDER_VARIETY_MIN
    checks.append({
        "id": "rendered",
        "label": "Page renders (not blank)",
        "status": "pass" if rendered else "fail",
        "details": f"colour variety σ={variety:.1f} (need ≥{RENDER_VARIETY_MIN:.0f}).",
    })
    pal_status = "pass" if matched_frac >= 0.7 else "warn" if matched_frac >= 0.4 else "fail"
    checks.append({
        "id": "palette-alignment",
        "label": "Rendered colours match the brand palette",
        "status": pal_status,
        "details": f"{round(matched_frac * 100)}% of pixels are brand-palette colours.",
    })
    var_status = "pass" if distinct >= 3 else "warn" if distinct >= 2 else "fail"
    checks.append({
        "id": "colour-variety",
        "label": "Enough colour variety",
        "status": var_status,
        "details": f"{distinct} distinct colours over 5% of the page.",
    })

    # weighted score: palette carries most weight, then rendered, then variety
    weights = {"palette-alignment": 3.0, "rendered": 2.0, "colour-variety": 1.0}
    earned = sum(
        weights[c["id"]] * (1 if c["status"] == "pass" else 0.5 if c["status"] == "warn" else 0)
        for c in checks
    )
    total_w = sum(weights.values())
    score = round(earned / total_w * 100)

    return {
        "score": score,
        "blank": not rendered,
        "dominant": dominant,
        "checks": checks,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True, help="served scenario URL to screenshot")
    ap.add_argument("--brand", required=True, help="brand slug (for the palette)")
    ap.add_argument("--case-id", required=True, help="scenario case id")
    ap.add_argument("--out-dir", required=True, help="directory to write the PNG into")
    ap.add_argument("--viewport", default="1280x800")
    args = ap.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    png = out_dir / f"{args.case_id}.png"

    if shutil.which("agent-browser") is None:
        print(json.dumps({"score": None, "status": "skipped", "reason": "agent-browser not on PATH"}))
        return 0

    palette = load_brand_palette(args.brand)
    width, _, height = args.viewport.partition("x")
    viewport = (int(width), int(height) or 800)

    try:
        _agent_browser_capture(args.url, png, viewport, args.brand, args.case_id)
    except subprocess.CalledProcessError as e:
        _err(f"agent-browser capture failed: {e.stderr.decode(errors='replace') if e.stderr else e}")
        print(json.dumps({"score": None, "status": "skipped", "reason": "screenshot failed"}))
        return 0
    except Exception as e:  # noqa: BLE001
        _err(f"capture error: {e}")
        print(json.dumps({"score": None, "status": "skipped", "reason": str(e)}))
        return 0

    if not png.exists():
        print(json.dumps({"score": None, "status": "skipped", "reason": "no screenshot produced"}))
        return 0

    result = analyse(png, palette)
    if "error" in result:
        print(json.dumps({"score": None, "status": "skipped", "reason": result["error"]}))
        return 0

    result["screenshot"] = f"test-cases/{args.case_id}.png"
    result["status"] = "ok"
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
