#!/usr/bin/env python3
"""Compute 9 mechanically measurable pattern signals from extracted design tokens."""

import argparse, json, math, re, time
from collections import Counter
from typing import Any, Optional

# -- Helpers -----------------------------------------------------------------

def parse_px(val: str) -> Optional[float]:
    m = re.match(r"^(-?\d+(?:\.\d+)?)px$", val.strip())
    return float(m.group(1)) if m else None

def gcd_pair(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a

def gcd_list(vals: list[int]) -> int:
    result = vals[0]
    for v in vals[1:]:
        result = gcd_pair(result, v)
        if result == 1:
            return 1
    return result

def hex_to_rgb(h: str) -> Optional[tuple[int, int, int]]:
    h = h.strip().lstrip("#")
    if len(h) == 3:   h = h[0]*2 + h[1]*2 + h[2]*2
    elif len(h) == 4: h = h[0]*2 + h[1]*2 + h[2]*2
    elif len(h) == 8: h = h[:6]
    if len(h) != 6:
        return None
    try:
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    except ValueError:
        return None

def parse_rgb_func(val: str) -> Optional[tuple[int, int, int]]:
    m = re.match(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", val)
    return (int(m.group(1)), int(m.group(2)), int(m.group(3))) if m else None

def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def rgb_to_oklch(r: int, g: int, b: int) -> tuple[float, float, float]:
    """sRGB (0-255) -> OKLCH (L [0,1], C >= 0, H [0,360))."""
    lr, lg, lb = srgb_to_linear(r/255), srgb_to_linear(g/255), srgb_to_linear(b/255)
    x = 0.4122214708*lr + 0.5363325363*lg + 0.0514459929*lb
    y = 0.2119034982*lr + 0.6806995451*lg + 0.1073969566*lb
    z = 0.0883024619*lr + 0.2024326059*lg + 0.6752678523*lb
    l_ = 0.8189330101*x + 0.3618667424*y - 0.1288597137*z
    m_ = 0.0329845436*x + 0.9293118715*y + 0.0361456387*z
    s_ = 0.0482003018*x + 0.2643662691*y + 0.6338517070*z
    cbrt = lambda v: math.copysign(abs(v)**(1/3), v) if v else 0.0
    lc, mc, sc = cbrt(l_), cbrt(m_), cbrt(s_)
    L = 0.2104542553*lc + 0.7936177850*mc - 0.0040720468*sc
    a = 1.9779984951*lc - 2.4285922050*mc + 0.4505937099*sc
    bb = 0.0259040371*lc + 0.7827717662*mc - 0.8086757660*sc
    return (L, math.sqrt(a*a + bb*bb), math.degrees(math.atan2(bb, a)) % 360)

# -- Signal 1: Spacing rhythm -----------------------------------------------

def signal_spacing_rhythm(spacing: dict) -> dict[str, Any]:
    weighted: list[tuple[float, int]] = []
    for key in ("paddings", "margins", "gaps"):
        for item in spacing.get(key, []):
            px = parse_px(item["value"])
            if px is not None and 0 < px <= 200:
                weighted.append((px, item.get("count", 1)))
    if not weighted:
        return {"base_unit": None, "residual_pct": 100.0, "confidence": "LOW"}
    total_w = sum(c for _, c in weighted)
    if total_w == 0:
        return {"base_unit": None, "residual_pct": 100.0, "confidence": "LOW"}
    best_unit, best_res = 4, 100.0
    for base in (4, 8, 16):
        nf = sum(c for v, c in weighted if round(v) % base != 0)
        res = (nf / total_w) * 100
        if res < best_res:
            best_res, best_unit = res, base
    int_vals = list(set(round(v) for v, _ in weighted if round(v) > 0))
    if len(int_vals) >= 2:
        g = gcd_list(int_vals)
        if g > 1:
            nf = sum(c for v, c in weighted if round(v) % g != 0)
            res = (nf / total_w) * 100
            if res < best_res:
                best_res, best_unit = res, g
    conf = "HIGH" if best_res < 20 else ("MEDIUM" if best_res < 40 else "LOW")
    return {"base_unit": f"{best_unit}px", "residual_pct": round(best_res, 1), "confidence": conf}

# -- Signal 2: Type scale ratio ---------------------------------------------

NAMED_RATIOS = {
    1.067: "minor second", 1.125: "major second", 1.200: "minor third",
    1.250: "major third", 1.333: "perfect fourth", 1.414: "augmented fourth",
    1.500: "perfect fifth", 1.618: "golden ratio",
}

def signal_type_scale(typography: dict) -> dict[str, Any]:
    sizes = sorted(set(
        px for item in typography.get("sizes", [])
        if (px := parse_px(item["value"])) is not None and px > 0
    ))
    if len(sizes) < 3:
        return {"ratio": None, "label": "insufficient data", "confidence": "LOW"}
    ratios = [sizes[i+1]/sizes[i] for i in range(len(sizes)-1)]
    ratios = [r for r in ratios if 1.0 < r < 2.5]
    if not ratios:
        return {"ratio": None, "label": "no consistent scale", "confidence": "LOW"}
    median = sorted(ratios)[len(ratios)//2]
    best_name, best_val, best_d = "custom", median, float("inf")
    for val, name in NAMED_RATIOS.items():
        d = abs(median - val)
        if d < best_d:
            best_d, best_name, best_val = d, name, val
    spread = max(ratios) - min(ratios)
    conf = "HIGH" if spread < 0.15 else ("MEDIUM" if spread < 0.4 else "LOW")
    if best_d > 0.08:
        conf = "LOW" if conf == "LOW" else "MEDIUM"
    return {"ratio": round(best_val, 3), "label": best_name, "confidence": conf}

# -- Signal 3: Component density (screenshot) --------------------------------

def signal_component_density(path: str) -> dict[str, Any]:
    try:
        from PIL import Image
    except ImportError:
        return {"ratio": None, "label": "pillow not installed", "confidence": "SKIPPED"}
    img = Image.open(path).convert("L")
    pixels = list(img.getdata())
    total = len(pixels)
    hist = [0]*256
    for p in pixels:
        hist[p] += 1
    bg = hist.index(max(hist))
    non_bg = sum(1 for p in pixels if abs(p - bg) > 30)
    ratio = non_bg / total if total else 0
    label = "airy" if ratio < 0.3 else ("balanced" if ratio <= 0.5 else "dense")
    return {"ratio": round(ratio, 3), "label": label, "confidence": "HIGH"}

# -- Signal 4: Alignment grid (screenshot) -----------------------------------

def kmeans_1d(pts: list[float], k: int, iters: int = 10) -> list[float]:
    if not pts or k <= 0: return []
    mn, mx = min(pts), max(pts)
    if mn == mx: return [mn]
    centers = [mn + (mx-mn)*i/(k-1) for i in range(k)]
    for _ in range(iters):
        clusters: dict[int, list[float]] = {i: [] for i in range(k)}
        for p in pts:
            clusters[min(range(k), key=lambda c: abs(p-centers[c]))].append(p)
        centers = [sum(clusters[i])/len(clusters[i]) if clusters[i] else centers[i] for i in range(k)]
    return sorted(centers)

def signal_alignment_grid(path: str) -> dict[str, Any]:
    try:
        from PIL import Image
        import numpy as np
    except ImportError:
        return {"columns": None, "gutter_px": None, "confidence": "SKIPPED"}
    img = Image.open(path).convert("L")
    w, h = img.size
    arr = np.array(img)
    left_edges: list[int] = []
    for frac in (0.2, 0.35, 0.5, 0.65, 0.8):
        y = int(h * frac)
        row = arr[y]
        bg = int(np.median(row))
        for x in range(1, w-1):
            if abs(int(row[x])-bg) > 40 and abs(int(row[x-1])-bg) <= 40:
                left_edges.append(x)
    if len(left_edges) < 4:
        return {"columns": None, "gutter_px": None, "confidence": "LOW"}
    best_k, best_score = 1, float("inf")
    for k in range(2, min(17, len(left_edges))):
        ctrs = kmeans_1d([float(e) for e in left_edges], k)
        var = sum(min(abs(p-c) for c in ctrs)**2 for p in left_edges) / len(left_edges)
        score = var + k*5
        if score < best_score:
            best_score, best_k = score, k
    ctrs = kmeans_1d([float(e) for e in left_edges], best_k)
    gutter = round(min(ctrs[i+1]-ctrs[i] for i in range(len(ctrs)-1))) if len(ctrs) >= 2 else 0
    return {"columns": best_k, "gutter_px": gutter, "confidence": "MEDIUM"}

# -- Signal 5: CTA placement (screenshot) -----------------------------------

def signal_cta_placement(path: str) -> dict[str, Any]:
    try:
        from PIL import Image
    except ImportError:
        return {"region": None, "above_fold": None, "confidence": "SKIPPED"}
    img = Image.open(path).convert("RGB")
    w, h = img.size
    top = img.crop((0, 0, w, h//2))
    tw, th = top.size
    pixels = list(top.getdata())
    if not pixels:
        return {"region": "unknown", "above_fold": True, "confidence": "LOW"}
    n = len(pixels)
    ar = sum(p[0] for p in pixels)/n
    ag = sum(p[1] for p in pixels)/n
    ab = sum(p[2] for p in pixels)/n
    regions = {
        "top-left": (0, 0, tw//2, th//2), "top-right": (tw//2, 0, tw, th//2),
        "hero-center": (tw//4, th//4, 3*tw//4, 3*th//4),
        "center": (tw//4, 0, 3*tw//4, th),
    }
    best_r, best_c = "hero-center", 0.0
    for name, (x1, y1, x2, y2) in regions.items():
        rpx = list(top.crop((x1, y1, x2, y2)).getdata())
        if not rpx: continue
        c = sum(abs(p[0]-ar)+abs(p[1]-ag)+abs(p[2]-ab) for p in rpx) / len(rpx)
        if c > best_c:
            best_c, best_r = c, name
    return {"region": best_r, "above_fold": True, "confidence": "MEDIUM"}

# -- Signal 6: Border radius language ---------------------------------------

def signal_border_radius(borders: dict) -> dict[str, Any]:
    radii = borders.get("radii", [])
    if not radii:
        return {"histogram": {}, "label": "none detected", "confidence": "LOW"}
    histogram: dict[str, int] = {}
    clusters = {"sharp": 0, "soft": 0, "rounded": 0, "pill": 0}
    total = 0
    for item in radii:
        raw, count = item["value"], item["count"]
        first = raw.split()[0]
        histogram[raw] = count
        total += count
        px = parse_px(first)
        if first == "0px" or (px is not None and px == 0):
            clusters["sharp"] += count
        elif first in ("50%", "9999px") or (px is not None and px >= 9999):
            clusters["pill"] += count
        elif px is not None and 2 <= px <= 6:
            clusters["soft"] += count
        elif px is not None and 8 <= px <= 16:
            clusters["rounded"] += count
        elif px is not None and px > 16:
            clusters["pill"] += count
        else:
            clusters["soft"] += count
    if total == 0:
        return {"histogram": histogram, "label": "none detected", "confidence": "LOW"}
    sig = sum(1 for v in clusters.values() if v/total > 0.1)
    if sig > 3:
        label = "brutal-mix"
    else:
        label = max(clusters, key=lambda k: clusters[k])
    conf = "MEDIUM" if label == "brutal-mix" else ("HIGH" if clusters[label]/total > 0.5 else "MEDIUM")
    return {"histogram": histogram, "label": label, "confidence": conf}

# -- Signal 7: Shadow elevation system --------------------------------------

def parse_shadow(val: str) -> list[tuple[float, float]]:
    """Extract (blur, spread) pairs from a CSS box-shadow."""
    parts, depth, cur = [], 0, []
    for ch in val:
        if ch == "(": depth += 1
        elif ch == ")": depth -= 1
        elif ch == "," and depth == 0:
            parts.append("".join(cur).strip()); cur = []; continue
        cur.append(ch)
    if cur: parts.append("".join(cur).strip())
    results = []
    for part in parts:
        nums = re.findall(r"(-?\d+(?:\.\d+)?)px", part)
        if len(nums) >= 3:
            results.append((float(nums[2]), float(nums[3]) if len(nums) >= 4 else 0.0))
        elif len(nums) == 2:
            results.append((0.0, 0.0))
    return results

def signal_shadow_elevation(shadows: list[dict]) -> dict[str, Any]:
    if not shadows:
        return {"unique_clusters": 0, "label": "flat", "confidence": "HIGH"}
    pairs = []
    for item in shadows:
        pairs.extend(parse_shadow(item["value"]))
    if not pairs:
        return {"unique_clusters": 0, "label": "flat", "confidence": "HIGH"}
    buckets = {(round(b/4)*4, round(s/4)*4) for b, s in pairs}
    n = len(buckets)
    label = "flat" if n == 0 else ("2-tier" if n <= 2 else ("3-tier" if n == 3 else "4+-tier"))
    return {"unique_clusters": n, "label": label, "confidence": "HIGH" if len(shadows) >= 3 else "MEDIUM"}

# -- Signal 8: Motion language -----------------------------------------------

_DUR_RE = re.compile(r"(\d+(?:\.\d+)?)(m?s)")
_EASE_RE = re.compile(r"(cubic-bezier\([^)]+\)|ease(?:-in)?(?:-out)?|linear|ease)")

def signal_motion_language(transitions: list[dict]) -> dict[str, Any]:
    durations, easings = [], []
    for item in transitions:
        val, count = item["value"], item["count"]
        for num_s, unit in _DUR_RE.findall(val):
            ms = float(num_s) * (1000 if unit == "s" else 1)
            durations.extend([ms] * count)
        for e in _EASE_RE.findall(val):
            easings.extend([e] * count)
    if not durations:
        return {"median_duration_ms": None, "dominant_easing": None,
                "label": "no transitions detected", "confidence": "LOW"}
    durations.sort()
    med = durations[len(durations)//2]
    ec = Counter(easings)
    dom = ec.most_common(1)[0][0] if ec else "ease"
    label = "snappy" if med < 200 else ("natural" if med <= 400 else "luxurious")
    return {"median_duration_ms": round(med), "dominant_easing": dom,
            "label": label, "confidence": "HIGH" if len(durations) >= 5 else "MEDIUM"}

# -- Signal 9: Color temperature + saturation profile -----------------------

def collect_rgb(colours: dict) -> list[tuple[int, int, int, int]]:
    out: list[tuple[int, int, int, int]] = []
    for _, obj in colours.get("custom_properties", {}).items():
        val = obj["value"] if isinstance(obj, dict) else obj
        rgb = hex_to_rgb(val) or parse_rgb_func(val)
        if rgb: out.append((*rgb, 1))
    for item in colours.get("computed", []):
        rgb = parse_rgb_func(item["value"]) or hex_to_rgb(item["value"])
        if rgb: out.append((*rgb, item.get("count", 1)))
    return out

HUE_LABELS = {
    0: "red", 30: "orange", 60: "yellow", 90: "yellow-green",
    120: "green", 150: "teal", 180: "cyan", 210: "blue",
    240: "blue-violet", 270: "violet", 300: "magenta", 330: "rose",
}

def signal_color_temperature(colours: dict) -> dict[str, Any]:
    rgbs = collect_rgb(colours)
    if not rgbs:
        return {"mean_chroma": None, "dominant_hue_range": None, "label": "no colours", "confidence": "LOW"}
    tw, cs, hb = 0, 0.0, Counter()
    for r, g, b, cnt in rgbs:
        L, C, H = rgb_to_oklch(r, g, b)
        cs += C * cnt; tw += cnt
        if C > 0.02:
            hb[int((H+15) % 360 // 30) * 30] += cnt
    mc = cs / tw if tw else 0.0
    dom_hue = HUE_LABELS.get(hb.most_common(1)[0][0], "unknown") if hb else "achromatic"
    if not hb or mc < 0.02:
        temp = "neutral"
    else:
        warm = sum(hb.get(h, 0) for h in (0, 30, 60, 330))
        cool = sum(hb.get(h, 0) for h in (150, 180, 210, 240, 270))
        ct = sum(hb.values())
        temp = "warm" if ct and warm/ct > 0.6 else ("cool" if ct and cool/ct > 0.6 else "neutral")
    sat = "vivid" if mc > 0.08 else "muted"
    label = f"{temp}-{sat}" if temp != "neutral" else ("neutral" if mc < 0.03 else f"neutral-{sat}")
    return {"mean_chroma": round(mc, 4), "dominant_hue_range": dom_hue,
            "label": label, "confidence": "HIGH" if tw >= 10 else "MEDIUM"}

# -- Main -------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description="Compute 9 pattern signals from extracted design tokens.")
    ap.add_argument("--tokens", required=True, help="Path to tokens JSON file")
    ap.add_argument("--screenshot", default=None, help="Path to desktop screenshot PNG (for density + grid)")
    ap.add_argument("--output", required=True, help="Output path for patterns JSON")
    args = ap.parse_args()
    t0 = time.time()
    with open(args.tokens) as f:
        tokens = json.load(f)
    url = tokens.get("url", "unknown")
    signals: dict[str, Any] = {}
    skipped = 0
    signals["spacing_rhythm"] = signal_spacing_rhythm(tokens.get("spacing", {}))
    signals["type_scale_ratio"] = signal_type_scale(tokens.get("typography", {}))
    for name, func in [("component_density", signal_component_density),
                       ("alignment_grid", signal_alignment_grid),
                       ("cta_placement", signal_cta_placement)]:
        if args.screenshot:
            signals[name] = func(args.screenshot)
        else:
            keys = {"component_density": ("ratio", "label"),
                    "alignment_grid": ("columns", "gutter_px"),
                    "cta_placement": ("region", "above_fold")}[name]
            signals[name] = {keys[0]: None, keys[1]: None, "confidence": "SKIPPED"}
            skipped += 1
    signals["border_radius_language"] = signal_border_radius(tokens.get("borders", {}))
    signals["shadow_elevation"] = signal_shadow_elevation(tokens.get("shadows", []))
    signals["motion_language"] = signal_motion_language(tokens.get("transitions", []))
    signals["color_temperature"] = signal_color_temperature(tokens.get("colours", {}))
    elapsed = round((time.time() - t0) * 1000)
    output = {"url": url, "signals": signals,
              "metadata": {"signals_computed": 9 - skipped, "signals_skipped": skipped,
                           "extraction_time_ms": elapsed}}
    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
