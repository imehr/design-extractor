"""Font rendering parity — Phase 2.1 dimension.

Per docs/plans/2026-05-14-extraction-quality-and-design-md-overhaul.md §3:

    | Font rendering parity | font-family + weight + computed line-height ±2px
    | 100% family, line-height delta < 2px | 0.10 |

For the homepage of both original and replica we read `getComputedStyle` on
the first `<h1>` and the first `<p>` and compare three properties per element:

    - fontFamily   (case-insensitive substring match; first family token wins)
    - fontWeight   (numeric — '400' == 'normal' == 400)
    - lineHeight   (px delta ≤ 2px after unitless→px conversion using fontSize)

Score is the fraction of matched properties across both elements (max 6).
We bucket to {1.0, 0.83, 0.66, 0.5, 0.33, 0.16, 0.0} based on count/6.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from typing import Optional

from eval_rubric import BrandContext, Dimension, DimensionResult, register


SESSION_ORIG = "eval-font-orig"
SESSION_REPL = "eval-font-repl"
VIEWPORT_W = 1280
VIEWPORT_H = 720
DEFAULT_BASE_URL = "https://design-extractor.localhost"


PROBE_JS = r"""
(async () => {
  // P4.2: wait for the FontFaceSet to settle before reading getComputedStyle.
  // Without this, getComputedStyle returns the fallback family (e.g. Times)
  // because web fonts hand't downloaded/applied yet. 5s upper bound to keep
  // the dimension responsive on slow/broken sites.
  try {
    await Promise.race([
      (document.fonts && document.fonts.ready) || Promise.resolve(),
      new Promise(r => setTimeout(r, 5000)),
    ]);
  } catch (e) { /* fonts API unavailable — proceed with fallback */ }

  const out = {};
  // Heading probe: prefer h1, fall back to the largest-text heading-like element.
  const findHeading = () => {
    let el = document.querySelector('h1');
    if (el) return el;
    const candidates = Array.from(document.querySelectorAll('h2, [class*="hero"] *, [class*="display"], [class*="headline"]'));
    let best = null, bestSize = 0;
    for (const c of candidates) {
      const r = c.getBoundingClientRect();
      if (r.width < 50 || r.height < 16) continue;
      const fs = parseFloat(getComputedStyle(c).fontSize) || 0;
      if (fs > bestSize) { bestSize = fs; best = c; }
    }
    return best;
  };
  // Body probe: prefer first <p> with non-trivial text in viewport.
  const findBody = () => {
    const ps = Array.from(document.querySelectorAll('p'));
    for (const p of ps) {
      const txt = (p.textContent || '').trim();
      if (txt.length < 20) continue;
      const r = p.getBoundingClientRect();
      if (r.width < 50 || r.height < 8) continue;
      return p;
    }
    return ps[0] || null;
  };
  const probes = { h1: findHeading(), p: findBody() };
  for (const key of Object.keys(probes)) {
    const el = probes[key];
    if (!el) { out[key] = null; continue; }
    const s = getComputedStyle(el);
    out[key] = {
      tag: el.tagName.toLowerCase(),
      fontFamily: s.fontFamily,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      fontSize: s.fontSize,
    };
  }
  // Surface the actual FontFaceSet so we can debug future "wrong family" surprises.
  let loaded_fonts = [];
  try {
    if (document.fonts) {
      loaded_fonts = Array.from(document.fonts).map(f => ({
        family: f.family, status: f.status, weight: f.weight, style: f.style,
      }));
    }
  } catch (e) { /* ignore */ }
  out.__loaded_fonts = loaded_fonts;
  return JSON.stringify(out);
})()
"""


def _have_agent_browser() -> bool:
    return shutil.which("agent-browser") is not None


def _ab(session: str, args: list[str], timeout: int = 60) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["agent-browser", "--session", session, *args],
        capture_output=True, text=True, timeout=timeout,
    )


def _read_computed(session: str, url: str) -> Optional[dict]:
    r = _ab(session, ["set", "viewport", str(VIEWPORT_W), str(VIEWPORT_H)])
    if r.returncode != 0:
        return None
    # `open` can return non-zero on slow pages but the DOM is still usable —
    # do not bail on its exit code. The subsequent eval is the real signal.
    _ab(session, ["open", url], timeout=120)
    _ab(session, ["wait", "2000"], timeout=10)

    r = _ab(session, ["eval", PROBE_JS, "--json"], timeout=30)
    if r.returncode != 0:
        return None
    out = r.stdout.strip()
    if not out:
        return None
    try:
        parsed = json.loads(out)
    except json.JSONDecodeError:
        return None
    # agent-browser --json: {success, data: {origin, result: "<stringified>"}, error}
    val = parsed
    if isinstance(parsed, dict):
        if "data" in parsed and isinstance(parsed["data"], dict) and "result" in parsed["data"]:
            val = parsed["data"]["result"]
        elif "result" in parsed:
            val = parsed["result"]
        elif "value" in parsed:
            val = parsed["value"]
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return None
    return val if isinstance(val, dict) else None


def _parse_px(value: str, font_size_px: float) -> Optional[float]:
    """Convert a computed lineHeight value into pixels."""
    if not value or value == "normal":
        return font_size_px * 1.2 if font_size_px else None
    v = value.strip().lower()
    m = re.match(r"^([0-9]*\.?[0-9]+)(px|%|em|rem)?$", v)
    if m:
        num = float(m.group(1))
        unit = m.group(2) or ""
        if unit == "px":
            return num
        if unit == "%":
            return font_size_px * (num / 100.0) if font_size_px else None
        if unit in ("em", "rem"):
            return font_size_px * num if font_size_px else None
        # unitless multiplier
        if not unit:
            return font_size_px * num if font_size_px else None
    return None


def _first_family(font_family: str) -> str:
    if not font_family:
        return ""
    first = font_family.split(",", 1)[0].strip().strip('"').strip("'").lower()
    return first


def _weight_int(weight: str) -> Optional[int]:
    if not weight:
        return None
    w = weight.strip().lower()
    mapping = {"normal": 400, "bold": 700, "lighter": 300, "bolder": 700}
    if w in mapping:
        return mapping[w]
    try:
        return int(float(w))
    except ValueError:
        return None


def _compare_element(orig: dict, repl: dict) -> dict:
    """Return per-property booleans + a numeric matched-count (0..3)."""
    o_family = _first_family(orig.get("fontFamily", ""))
    r_family = _first_family(repl.get("fontFamily", ""))
    family_match = bool(o_family) and bool(r_family) and (
        o_family == r_family or o_family in r_family or r_family in o_family
    )

    o_w = _weight_int(orig.get("fontWeight", ""))
    r_w = _weight_int(repl.get("fontWeight", ""))
    weight_match = (o_w is not None and r_w is not None and o_w == r_w)

    def _fs_px(s: str) -> float:
        m = re.match(r"^([0-9]*\.?[0-9]+)px$", (s or "").strip())
        return float(m.group(1)) if m else 16.0

    o_fs = _fs_px(orig.get("fontSize", ""))
    r_fs = _fs_px(repl.get("fontSize", ""))
    o_lh = _parse_px(orig.get("lineHeight", ""), o_fs)
    r_lh = _parse_px(repl.get("lineHeight", ""), r_fs)
    if o_lh is None or r_lh is None:
        lh_match = False
        lh_delta = None
    else:
        lh_delta = abs(o_lh - r_lh)
        lh_match = lh_delta <= 2.0

    matched = sum([family_match, weight_match, lh_match])
    return {
        "family_match": family_match,
        "weight_match": weight_match,
        "lineheight_match": lh_match,
        "lineheight_delta_px": (round(lh_delta, 2) if lh_delta is not None else None),
        "matched": matched,
        "original": orig,
        "replica": repl,
    }


def run(ctx: BrandContext) -> DimensionResult:
    if not _have_agent_browser():
        return DimensionResult(
            name="font_rendering", score=0.0, threshold=1.0, weight=0.10,
            status="skipped",
            details={"reason": "agent-browser CLI not on PATH"},
        )
    home = (ctx.pages_config or {}).get("homepage")
    if not home or not home.get("original_url") or not home.get("replica_route"):
        return DimensionResult(
            name="font_rendering", score=0.0, threshold=1.0, weight=0.10,
            status="skipped",
            details={"reason": "no homepage entry in pages_config"},
        )

    base_url = (ctx.base_url or DEFAULT_BASE_URL).rstrip("/")
    original_url = home["original_url"]
    replica_url = base_url + home["replica_route"]

    orig = _read_computed(SESSION_ORIG, original_url)
    repl = _read_computed(SESSION_REPL, replica_url)

    # Cleanup
    for s in (SESSION_ORIG, SESSION_REPL):
        try:
            _ab(s, ["close"], timeout=15)
        except Exception:
            pass

    if not orig:
        return DimensionResult(
            name="font_rendering", score=0.0, threshold=1.0, weight=0.10,
            status="skipped",
            details={"reason": "could not read computed styles on original", "original_url": original_url},
        )
    if not repl:
        return DimensionResult(
            name="font_rendering", score=0.0, threshold=1.0, weight=0.10,
            status="skipped",
            details={"reason": "could not read computed styles on replica", "replica_url": replica_url},
        )

    per_element = {}
    matched_total = 0
    properties_total = 0
    for key in ("h1", "p"):
        o = orig.get(key)
        r = repl.get(key)
        if not o or not r:
            per_element[key] = {"reason": f"missing element on {'original' if not o else 'replica'}"}
            continue
        cmp_ = _compare_element(o, r)
        per_element[key] = cmp_
        matched_total += cmp_["matched"]
        properties_total += 3

    # P4.2: surface FontFaceSet contents so future "fallback family" surprises
    # are debuggable without rerunning the dimension by hand.
    loaded_fonts_orig = orig.get("__loaded_fonts") if isinstance(orig, dict) else None
    loaded_fonts_repl = repl.get("__loaded_fonts") if isinstance(repl, dict) else None

    if properties_total == 0:
        return DimensionResult(
            name="font_rendering", score=0.0, threshold=1.0, weight=0.10,
            status="skipped",
            details={"reason": "no comparable elements (no h1/p on either side)", "elements": per_element},
        )

    raw = matched_total / properties_total
    # Bucket to the rubric's 1.0 / 0.66 / 0.33 / 0 grid (mapped to /6 granularity).
    # We use raw directly — it's already in 0..1 and the bucketing is implicit
    # because matched_total ∈ {0..6} and properties_total ∈ {3,6}.
    score = round(raw, 3)

    return DimensionResult(
        name="font_rendering",
        score=score,
        threshold=1.0, weight=0.10, status="",
        details={
            "matched_total": matched_total,
            "properties_total": properties_total,
            "raw_ratio": round(raw, 3),
            "elements": per_element,
            "homepage": {"original": original_url, "replica": replica_url},
            "original": {"loaded_fonts": loaded_fonts_orig},
            "replica": {"loaded_fonts": loaded_fonts_repl},
        },
    )


register(Dimension(
    name="font_rendering",
    weight=0.10,
    threshold=1.0,
    critical_fail_at=0.5,
    runner=run,
))
