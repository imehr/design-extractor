#!/usr/bin/env python3
"""Capture and score a single replica page against its existing original screenshot.

Fast inner-loop tool for replica refinement: it screenshots one replica route via
agent-browser (using the deadlock-proof run_capture) and pixel-compares it to the
already-captured ``orig-<page>.png`` in the harness screenshot dir. It does NOT
re-capture the original, so iteration is quick.

Usage:
    python3 scripts/score_page.py --brand cochlear-com --page home \
        --base-url http://localhost:4254
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from proc_utils import run_capture

try:
    from PIL import Image
    from pixelmatch import pixelmatch
except ImportError:
    print("Missing dependencies: pip install Pillow pixelmatch")
    sys.exit(1)


def capture(url: str, out_path: Path, session: str, wait: float = 5.0) -> bool:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    nav = run_capture(["agent-browser", "open", url, "--session", session], timeout=40)
    if nav.returncode != 0:
        print(f"  open failed: {('timed out' if nav.returncode == -1 else (nav.stderr or '').strip())}")
        run_capture(["agent-browser", "close", "--session", session], timeout=10)
        return False
    run_capture(
        ["agent-browser", "eval", "--session", session,
         "page.setViewportSize({width:1280,height:720})"],
        timeout=10,
    )
    time.sleep(wait)
    shot = run_capture(
        ["agent-browser", "screenshot", str(out_path), "--session", session, "--full"],
        timeout=20,
    )
    run_capture(["agent-browser", "close", "--session", session], timeout=10)
    return shot.returncode == 0 and out_path.exists()


def score(orig: Path, repl: Path) -> float:
    a = Image.open(orig).convert("RGBA")
    b = Image.open(repl).convert("RGBA")
    if a.size != b.size:
        b = b.resize(a.size, Image.Resampling.LANCZOS)
    w, h = a.size
    mm = pixelmatch(a.tobytes(), b.tobytes(), w, h, threshold=0.3, includeAA=False)
    return round((1.0 - mm / (w * h)) * 100, 1)


def main() -> int:
    ap = argparse.ArgumentParser(description="Score a single replica page")
    ap.add_argument("--brand", required=True)
    ap.add_argument("--page", required=True, help="page slug, e.g. home / about-us")
    ap.add_argument("--base-url", default="http://localhost:4254")
    ap.add_argument("--route", default=None,
                    help="override replica route (default /brands/<brand>/replica/<page>)")
    ap.add_argument("--wait", type=float, default=5.0)
    args = ap.parse_args()

    harness = Path.home() / ".claude" / "design-library" / "cache" / args.brand / "screenshots" / "harness"
    orig = harness / f"orig-{args.page}.png"
    if not orig.exists():
        print(f"No original screenshot at {orig}")
        return 2

    route = args.route or f"/brands/{args.brand}/replica/{args.page}"
    url = f"{args.base_url}{route}"
    repl = harness / f"repl-{args.page}.png"

    print(f"Capturing {url}")
    if not capture(url, repl, session=f"score-{args.page}-{int(time.time())}", wait=args.wait):
        print("  capture FAILED")
        return 1

    pct = score(orig, repl)
    od, rd = Image.open(orig).size, Image.open(repl).size
    print(f"  orig {od[0]}x{od[1]}  repl {rd[0]}x{rd[1]}")
    print(f"SCORE {args.page}: {pct}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
