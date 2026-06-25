"""Interactive state parity — Phase 2.1 dimension.

For the homepage (original + replica) we locate a primary call-to-action
element, capture three screenshots of its bounding box — idle, :hover, :focus —
and compare each pair with pixelmatch at threshold=0.15 (slightly lenient
because antialiasing on a small element is amplified noise).

The dimension score is the mean exact-match ratio over the three state pairs.

Selector strategy (P4.3): an explicit fallback chain, tried in order until
both original AND replica resolve a visible element:

  1. button[class*="primary" i]
  2. [class*="btn-primary" i]
  3. a[class*="btn-primary" i]
  4. button[role="button"]:not([aria-hidden="true"])   (first visible)
  5. header a[href]:not([href="#"])                    (first nav link CTA)
  6. main a[class*="btn" i]                            (button-styled link)

If neither side resolves any selector, the dimension is skipped with the
attempted-selector trace in details.reason.

If exactly ONE side resolves a CTA, that is a real defect (CTA missing on the
other side) and we return status="fail" score=0 with diagnostics.

Tooling note: `agent-browser` issues real CDP hover/focus events, which trigger
CSS pseudo-classes in Chromium. We crop the element bbox out of a viewport
screenshot rather than asking for an element-scoped screenshot — that keeps the
diff aligned to the element's visual rect including any outer focus ring.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional

from eval_rubric import BrandContext, Dimension, DimensionResult, register


SESSION = "eval-interactive"
VIEWPORT_W = 1280
VIEWPORT_H = 720
DEFAULT_BASE_URL = "https://design-extractor.localhost"

# Ordered fallback selectors (P4.3 spec). Each entry is a CSS selector string.
# We use querySelectorAll + first-visible to honour the "first visible" rule.
CTA_SELECTORS: list[str] = [
    'button[class*="primary" i]',
    '[class*="btn-primary" i]',
    'a[class*="btn-primary" i]',
    'button[role="button"]:not([aria-hidden="true"])',
    'header a[href]:not([href="#"])',
    'main a[class*="btn" i]',
]


# JS probe: try each selector in order, return the first one whose first
# visible match is in the viewport. Returns JSON-stringified
# {selector, matchedBy, x, y, w, h} or null.
def _build_probe_js(selectors: list[str]) -> str:
    sel_json = json.dumps(selectors)
    return r"""
(() => {
  const SELECTORS = __SELECTORS__;
  const isVisible = (el) => {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return false;
    if (r.top > window.innerHeight - 4 || r.bottom < 4) return false;
    if (r.left > window.innerWidth - 4 || r.right < 4) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') return false;
    if (parseFloat(s.opacity) < 0.1) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return true;
  };
  const buildSelector = (el) => {
    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && depth < 5) {
      const parent = cur.parentElement;
      if (!parent) { parts.unshift(cur.tagName.toLowerCase()); break; }
      const same = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
      const idx = same.indexOf(cur) + 1;
      parts.unshift(cur.tagName.toLowerCase() + ':nth-of-type(' + idx + ')');
      cur = parent; depth++;
    }
    return parts.join(' > ');
  };
  const attempts = [];
  for (const sel of SELECTORS) {
    let nodes;
    try { nodes = document.querySelectorAll(sel); }
    catch (e) { attempts.push({sel, error: String(e).slice(0,120)}); continue; }
    let picked = null;
    let count = 0;
    for (const el of nodes) {
      count++;
      if (isVisible(el)) { picked = el; break; }
    }
    if (!picked) {
      attempts.push({sel, count, reason: count ? 'no visible match' : 'no element matched'});
      continue;
    }
    const r = picked.getBoundingClientRect();
    return JSON.stringify({
      selector: buildSelector(picked),
      matchedBy: sel,
      x: Math.max(0, Math.floor(r.left) - 8),
      y: Math.max(0, Math.floor(r.top) - 8),
      w: Math.ceil(r.width) + 16,
      h: Math.ceil(r.height) + 16,
      attempts,
    });
  }
  return JSON.stringify({error: 'no selector resolved', attempts});
})()
""".replace("__SELECTORS__", sel_json)


PROBE_JS = _build_probe_js(CTA_SELECTORS)


def _have_agent_browser() -> bool:
    return shutil.which("agent-browser") is not None


def _ab(session: str, args: list[str], timeout: int = 60) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["agent-browser", "--session", session, *args],
        capture_output=True, text=True, timeout=timeout,
    )


def _eval_json(session: str, js: str) -> Optional[dict]:
    """Run JS via agent-browser eval, parse a JSON-string return value."""
    r = _ab(session, ["eval", js, "--json"], timeout=30)
    if r.returncode != 0:
        return None
    out = r.stdout.strip()
    if not out:
        return None
    try:
        parsed = json.loads(out)
    except json.JSONDecodeError:
        return None
    val = parsed
    if isinstance(parsed, dict):
        if "data" in parsed and isinstance(parsed["data"], dict) and "result" in parsed["data"]:
            val = parsed["data"]["result"]
        elif "result" in parsed:
            val = parsed["result"]
        elif "value" in parsed:
            val = parsed["value"]
    if isinstance(val, str):
        if val == "null":
            return None
        try:
            return json.loads(val)
        except Exception:
            return None
    if isinstance(val, dict):
        return val
    return None


def _capture_state(session: str, base_session_dir: Path, label: str, bbox: dict) -> Optional[Path]:
    """Take a viewport screenshot at current state and crop to bbox. Returns path or None."""
    from PIL import Image

    full = base_session_dir / f"_full-{label}.png"
    r = _ab(session, ["screenshot", str(full)], timeout=30)
    if r.returncode != 0 or not full.exists():
        return None

    try:
        img = Image.open(full).convert("RGBA")
        x, y, w, h = int(bbox["x"]), int(bbox["y"]), int(bbox["w"]), int(bbox["h"])
        iw, ih = img.size
        x2 = min(iw, x + w)
        y2 = min(ih, y + h)
        x = max(0, x)
        y = max(0, y)
        if x2 <= x or y2 <= y:
            return None
        crop = img.crop((x, y, x2, y2))
        out = base_session_dir / f"crop-{label}.png"
        crop.save(out)
        return out
    except Exception:
        return None


def _probe(url: str, session: str) -> dict:
    """Open url, run PROBE_JS, return {selector,matchedBy,x,y,w,h,attempts} or {error,attempts}."""
    r = _ab(session, ["set", "viewport", str(VIEWPORT_W), str(VIEWPORT_H)])
    if r.returncode != 0:
        return {"error": f"set viewport: {r.stderr.strip()[:160]}"}
    _ab(session, ["open", url], timeout=120)
    _ab(session, ["wait", "2000"], timeout=10)
    result = _eval_json(session, PROBE_JS)
    if not result:
        return {"error": "probe eval returned null/unparseable"}
    if "error" in result:
        return result
    if "selector" not in result:
        return {"error": "probe result missing selector", "raw": result}
    return result


def _capture_triplet(url: str, session: str, base_dir: Path, probe: dict) -> dict:
    """Given a resolved probe, capture idle/hover/focus crops."""
    base_dir.mkdir(parents=True, exist_ok=True)
    sel = probe["selector"]
    bbox = probe

    # 1. idle — blur any existing focus & move mouse away first.
    _ab(session, ["eval", "document.activeElement && document.activeElement.blur(); 1"], timeout=10)
    _ab(session, ["mouse", "move", "0", "0"], timeout=10)
    _ab(session, ["wait", "300"], timeout=5)
    idle = _capture_state(session, base_dir, "idle", bbox)

    # 2. hover
    _ab(session, ["hover", sel], timeout=15)
    _ab(session, ["wait", "300"], timeout=5)
    hover = _capture_state(session, base_dir, "hover", bbox)

    # 3. focus
    _ab(session, ["mouse", "move", "0", "0"], timeout=10)
    _ab(session, ["focus", sel], timeout=15)
    _ab(session, ["wait", "300"], timeout=5)
    focus = _capture_state(session, base_dir, "focus", bbox)

    if not (idle and hover and focus):
        return {"error": "failed to capture all three states", "selector": sel}

    return {"selector": sel, "matchedBy": probe.get("matchedBy"), "idle": idle, "hover": hover, "focus": focus}


def _pixmatch(orig: Path, repl: Path, threshold: float = 0.15) -> dict:
    try:
        from PIL import Image
        from pixelmatch import pixelmatch
    except ImportError as exc:
        return {"error": f"missing dependency: {exc}"}
    try:
        o = Image.open(orig).convert("RGBA")
        r = Image.open(repl).convert("RGBA")
        if o.size != r.size:
            r = r.resize(o.size, Image.Resampling.LANCZOS)
        w, h = o.size
        total = w * h or 1
        mis = pixelmatch(o.tobytes(), r.tobytes(), w, h, threshold=threshold, includeAA=False)
        return {"exact": round((1.0 - mis / total) * 100, 1), "dims": f"{w}x{h}"}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def run(ctx: BrandContext) -> DimensionResult:
    if not _have_agent_browser():
        return DimensionResult(
            name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
            status="skipped",
            details={"reason": "agent-browser CLI not on PATH"},
        )

    home = (ctx.pages_config or {}).get("homepage")
    if not home or not home.get("original_url") or not home.get("replica_route"):
        return DimensionResult(
            name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
            status="skipped",
            details={"reason": "no homepage entry in pages_config"},
        )

    base_url = (ctx.base_url or DEFAULT_BASE_URL).rstrip("/")
    original_url = home["original_url"]
    replica_url = base_url + home["replica_route"]

    cache_root = Path("/tmp/eval") / ctx.slug / "interactive"

    orig_session = SESSION + "-orig"
    repl_session = SESSION + "-repl"

    orig_probe = _probe(original_url, orig_session)
    repl_probe = _probe(replica_url, repl_session)

    orig_resolved = "selector" in orig_probe and "error" not in orig_probe
    repl_resolved = "selector" in repl_probe and "error" not in repl_probe

    try:
        if not orig_resolved and not repl_resolved:
            # Neither side has a CTA via any selector — skip with diagnosis.
            return DimensionResult(
                name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
                status="skipped",
                details={
                    "reason": "no CTA resolved on either side after trying every selector",
                    "selectors_tried": CTA_SELECTORS,
                    "original_url": original_url,
                    "replica_url": replica_url,
                    "original_attempts": orig_probe.get("attempts"),
                    "original_error": orig_probe.get("error"),
                    "replica_attempts": repl_probe.get("attempts"),
                    "replica_error": repl_probe.get("error"),
                },
            )

        if orig_resolved and not repl_resolved:
            # Original has a CTA, replica doesn't — concrete defect.
            return DimensionResult(
                name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
                status="fail",
                details={
                    "reason": "CTA missing on replica side",
                    "selectors_tried": CTA_SELECTORS,
                    "original_selector": orig_probe.get("selector"),
                    "original_matchedBy": orig_probe.get("matchedBy"),
                    "replica_selector": None,
                    "replica_attempts": repl_probe.get("attempts"),
                    "replica_error": repl_probe.get("error"),
                    "original_url": original_url,
                    "replica_url": replica_url,
                },
            )

        if repl_resolved and not orig_resolved:
            # Replica has a CTA, original doesn't — also a defect (or anti-slop).
            return DimensionResult(
                name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
                status="fail",
                details={
                    "reason": "CTA missing on original side (replica has one)",
                    "selectors_tried": CTA_SELECTORS,
                    "original_selector": None,
                    "original_attempts": orig_probe.get("attempts"),
                    "original_error": orig_probe.get("error"),
                    "replica_selector": repl_probe.get("selector"),
                    "replica_matchedBy": repl_probe.get("matchedBy"),
                    "original_url": original_url,
                    "replica_url": replica_url,
                },
            )

        # Both resolved — capture triplets.
        orig_cap = _capture_triplet(original_url, orig_session, cache_root / "orig", orig_probe)
        repl_cap = _capture_triplet(replica_url, repl_session, cache_root / "repl", repl_probe)

        if "error" in orig_cap:
            return DimensionResult(
                name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
                status="skipped",
                details={"reason": f"original CTA capture failed: {orig_cap['error']}",
                         "original_url": original_url, "selector": orig_cap.get("selector")},
            )
        if "error" in repl_cap:
            return DimensionResult(
                name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
                status="skipped",
                details={"reason": f"replica CTA capture failed: {repl_cap['error']}",
                         "replica_url": replica_url, "selector": repl_cap.get("selector")},
            )

        state_results = {}
        pcts: list[float] = []
        for state in ("idle", "hover", "focus"):
            cmp_ = _pixmatch(orig_cap[state], repl_cap[state], threshold=0.15)
            state_results[state] = cmp_
            if "exact" in cmp_:
                pcts.append(cmp_["exact"])

        if not pcts:
            return DimensionResult(
                name="interactive_state", score=0.0, threshold=0.80, weight=0.10,
                status="fail",
                details={"reason": "all state comparisons errored", "states": state_results,
                         "original_selector": orig_cap.get("selector"),
                         "replica_selector": repl_cap.get("selector")},
            )

        avg = sum(pcts) / len(pcts)
        return DimensionResult(
            name="interactive_state",
            score=avg / 100.0,
            threshold=0.80, weight=0.10, status="",
            details={
                "states": state_results,
                "original_selector": orig_cap.get("selector"),
                "original_matchedBy": orig_cap.get("matchedBy"),
                "replica_selector": repl_cap.get("selector"),
                "replica_matchedBy": repl_cap.get("matchedBy"),
                "exact_avg_pct": round(avg, 1),
                "homepage": {"original": original_url, "replica": replica_url},
            },
        )
    finally:
        # Best-effort browser cleanup.
        for s in (orig_session, repl_session):
            try:
                _ab(s, ["close"], timeout=15)
            except Exception:
                pass


register(Dimension(
    name="interactive_state",
    weight=0.10,
    threshold=0.80,
    critical_fail_at=0.40,
    runner=run,
))
