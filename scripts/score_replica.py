#!/usr/bin/env python3
"""
Design Extractor — Replica Scorer
Computes a weighted similarity score between reference and replica screenshots
using pixel-level comparison (pixelmatch) with optional LLM critique scores.

Usage:
    python score_replica.py --reference-dir ./ref --replica-dir ./rep --output scores.json
    python score_replica.py --reference-dir ./ref --replica-dir ./rep --llm-scores llm.json --output scores.json
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean

try:
    from PIL import Image
except ImportError:
    print("Missing dependency: Pillow")
    print("Install: pip install Pillow")
    sys.exit(1)

try:
    from pixelmatch import pixelmatch
except ImportError:
    print("Missing dependency: pixelmatch")
    print("Install: pip install pixelmatch")
    sys.exit(1)

COMPONENTS = ["nav", "hero", "button-set", "card", "footer", "form"]

# Component key used in weights/thresholds — "button-set" maps to "button"
WEIGHT_KEY = {
    "nav": "nav",
    "hero": "hero",
    "button-set": "button",
    "card": "card",
    "footer": "footer",
    "form": "form",
}

WEIGHTS = {
    "nav":    {"pixel": 0.6, "llm": 0.4},
    "hero":   {"pixel": 0.5, "llm": 0.5},
    "button": {"pixel": 0.8, "llm": 0.2},
    "card":   {"pixel": 0.6, "llm": 0.4},
    "footer": {"pixel": 0.5, "llm": 0.5},
    "form":   {"pixel": 0.6, "llm": 0.4},
}

THRESHOLDS = {
    "nav": 0.85,
    "hero": 0.80,
    "button": 0.90,
    "card": 0.85,
    "footer": 0.80,
    "form": 0.85,
}


def compare_images(reference_path: Path, replica_path: Path) -> float:
    """
    Compare two images using pixelmatch.
    Returns similarity as a float in [0.0, 1.0].
    The replica is resized to match reference dimensions before comparison.
    """
    ref_img = Image.open(reference_path).convert("RGBA")
    rep_img = Image.open(replica_path).convert("RGBA")

    # Resize replica to match reference dimensions
    if rep_img.size != ref_img.size:
        rep_img = rep_img.resize(ref_img.size, Image.LANCZOS)

    width, height = ref_img.size
    total_pixels = width * height

    ref_bytes = ref_img.tobytes()
    rep_bytes = rep_img.tobytes()

    mismatch = pixelmatch(
        ref_bytes,
        rep_bytes,
        width,
        height,
        threshold=0.1,
        includeAA=False,
    )

    return 1.0 - (mismatch / total_pixels)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Score replica screenshots against reference screenshots."
    )
    parser.add_argument("--reference-dir", required=True, help="Directory with reference-*.png files")
    parser.add_argument("--replica-dir", required=True, help="Directory with replica-*.png files")
    parser.add_argument("--output", required=True, help="Path to write the scores JSON")
    parser.add_argument(
        "--llm-scores",
        default=None,
        help="Optional JSON file with LLM critique scores (Phase 4)",
    )
    args = parser.parse_args()

    ref_dir = Path(args.reference_dir)
    rep_dir = Path(args.replica_dir)
    output_path = Path(args.output)

    # Load optional LLM scores
    llm_scores: dict = {}
    llm_provided = False
    if args.llm_scores:
        llm_path = Path(args.llm_scores)
        if llm_path.exists():
            with open(llm_path) as f:
                llm_scores = json.load(f)
            llm_provided = True
        else:
            print(f"Warning: LLM scores file not found: {llm_path}", file=sys.stderr)

    dimensions: dict = {}
    scored_values: list[float] = []
    blocking_failures: list[str] = []

    for comp in COMPONENTS:
        wk = WEIGHT_KEY[comp]
        ref_file = ref_dir / f"reference-{comp}.png"
        rep_file = rep_dir / f"replica-{comp}.png"

        if not ref_file.exists() or not rep_file.exists():
            dimensions[comp] = {"status": "skipped", "reason": "file_missing"}
            continue

        pixel_sim = compare_images(ref_file, rep_file)

        # LLM score: use provided value or fall back to pixel score
        llm_score_val = llm_scores.get(wk, llm_scores.get(comp))
        has_llm = llm_score_val is not None
        effective_llm = llm_score_val if has_llm else pixel_sim

        pw = WEIGHTS[wk]["pixel"]
        lw = WEIGHTS[wk]["llm"]
        blended = pw * pixel_sim + lw * effective_llm

        threshold = THRESHOLDS[wk]
        passed = blended >= threshold

        dimensions[comp] = {
            "pixel_score": round(pixel_sim, 4),
            "llm_score": round(llm_score_val, 4) if has_llm else None,
            "blended_score": round(blended, 4),
            "threshold": threshold,
            "passed": passed,
        }

        scored_values.append(blended)
        if not passed:
            blocking_failures.append(comp)

    # Check brand_impression from LLM scores
    brand_impression = llm_scores.get("brand_impression")
    if brand_impression is not None and brand_impression < 0.7:
        blocking_failures.append("brand_impression")

    overall = round(mean(scored_values), 4) if scored_values else 0.0
    overall_passed = len(blocking_failures) == 0 and overall > 0

    result = {
        "overall_score": overall,
        "overall_passed": overall_passed,
        "blocking_failures": blocking_failures,
        "dimensions": dimensions,
        "metadata": {
            "scored_at": datetime.now(timezone.utc).isoformat(),
            "llm_scores_provided": llm_provided,
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Overall score: {overall} — {'PASSED' if overall_passed else 'FAILED'}")
    if blocking_failures:
        print(f"Blocking failures: {', '.join(blocking_failures)}")
    print(f"Scores written to {output_path}")


if __name__ == "__main__":
    main()
