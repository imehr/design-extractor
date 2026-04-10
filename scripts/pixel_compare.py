#!/usr/bin/env python3
# Forked from brand-extractor v1.0.0 on 2026-04-10 (renamed from compare_visual.py)
"""
Design Extractor — Pixel Comparison Engine
Compares original component screenshots against replicated versions
using pixel-level comparison (pixelmatch).

Usage:
    python pixel_compare.py --original-dir ./components/original \
                            --replica-dir ./components/replica \
                            --output-dir ./comparison
    python pixel_compare.py --original-dir ./original --replica-dir ./replica \
                            --output-dir ./comparison --output-json results.json
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image
    import pixelmatch
except ImportError:
    print("Missing dependencies. Install: pip install Pillow pixelmatch")
    sys.exit(1)


def compare_images(original_path: str, replica_path: str, diff_path: str) -> dict:
    """
    Compare two images using pixelmatch.
    Returns similarity score and diff image path.
    """
    try:
        orig = Image.open(original_path).convert("RGBA")
        repl = Image.open(replica_path).convert("RGBA")

        # Resize replica to match original dimensions for fair comparison
        if orig.size != repl.size:
            repl = repl.resize(orig.size, Image.Resampling.LANCZOS)

        width, height = orig.size
        diff = Image.new("RGBA", (width, height))

        # Run pixelmatch comparison
        num_diff_pixels = pixelmatch.pixelmatch(
            img1=orig.tobytes(),
            img2=repl.tobytes(),
            width=width,
            height=height,
            output=diff.tobytes() if diff else None,
            threshold=0.1,
            includeAA=False,
        )

        total_pixels = width * height
        similarity = 1.0 - (num_diff_pixels / total_pixels) if total_pixels > 0 else 0.0

        # Save diff image
        if diff_path:
            diff.save(diff_path)

        return {
            "similarity": round(similarity, 4),
            "similarity_percent": round(similarity * 100, 1),
            "diff_pixels": num_diff_pixels,
            "total_pixels": total_pixels,
            "dimensions": {"width": width, "height": height},
            "diff_image": diff_path,
            "status": "compared",
        }

    except Exception as e:
        return {
            "similarity": 0.0,
            "similarity_percent": 0.0,
            "error": str(e),
            "status": "error",
        }


def run_comparison(original_dir: Path, replica_dir: Path, output_dir: Path) -> dict:
    """
    Compare all matching component pairs.
    Returns Gate 5 Layer 1 results.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    diff_dir = output_dir / "diffs"
    diff_dir.mkdir(exist_ok=True)

    # Gate 5 Layer 1 thresholds (from validation rubric)
    thresholds = {
        "nav": 0.85,
        "hero": 0.80,
        "button-set": 0.90,
        "card": 0.85,
        "footer": 0.80,
        "form": 0.85,
    }

    criterion_ids = {
        "nav": "V-PIX-01",
        "hero": "V-PIX-02",
        "button-set": "V-PIX-03",
        "card": "V-PIX-04",
        "footer": "V-PIX-05",
        "form": "V-PIX-06",
    }

    results = {
        "layer": "pixel_comparison",
        "components": {},
        "summary": {
            "total": 0,
            "compared": 0,
            "passed": 0,
            "failed": 0,
            "missing": 0,
            "average_similarity": 0.0,
        },
    }

    scores = []

    for orig_file in original_dir.glob("*.png"):
        comp_name = orig_file.stem
        replica_file = replica_dir / orig_file.name
        diff_file = diff_dir / f"{comp_name}-diff.png"

        results["summary"]["total"] += 1

        if not replica_file.exists():
            results["components"][comp_name] = {
                "criterion_id": criterion_ids.get(comp_name, "V-PIX-XX"),
                "status": "MISSING",
                "reason": f"No replica found at {replica_file}",
                "threshold": thresholds.get(comp_name, 0.85),
            }
            results["summary"]["missing"] += 1
            continue

        # Run comparison
        comparison = compare_images(str(orig_file), str(replica_file), str(diff_file))
        threshold = thresholds.get(comp_name, 0.85)
        passed = comparison["similarity"] >= threshold

        results["components"][comp_name] = {
            "criterion_id": criterion_ids.get(comp_name, "V-PIX-XX"),
            "status": "PASS" if passed else "FAIL",
            "similarity": comparison["similarity"],
            "similarity_percent": comparison["similarity_percent"],
            "threshold": threshold,
            "threshold_percent": round(threshold * 100, 1),
            "diff_pixels": comparison.get("diff_pixels", 0),
            "total_pixels": comparison.get("total_pixels", 0),
            "dimensions": comparison.get("dimensions", {}),
            "original": str(orig_file),
            "replica": str(replica_file),
            "diff_image": str(diff_file) if passed is False else None,
        }

        if passed:
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1

        results["summary"]["compared"] += 1
        scores.append(comparison["similarity"])

    # Calculate average
    if scores:
        results["summary"]["average_similarity"] = round(sum(scores) / len(scores), 4)
        results["summary"]["average_percent"] = round(results["summary"]["average_similarity"] * 100, 1)

    # Gate 5 Layer 1 overall verdict
    avg_threshold = 0.83  # from validation rubric
    results["gate_5_layer_1_verdict"] = {
        "status": "PASS" if results["summary"]["average_similarity"] >= avg_threshold else "FAIL",
        "average_similarity": results["summary"]["average_similarity"],
        "required_threshold": avg_threshold,
    }

    return results


def build_output_json(results: dict) -> dict:
    """
    Build the structured JSON output with per-component and overall entries.
    Format: {components: [{component, similarity, passed, threshold}, ...],
             overall_similarity, overall_passed}
    """
    components = []
    for comp_name, comp_data in results["components"].items():
        threshold = comp_data.get("threshold", 0.85)
        similarity = comp_data.get("similarity", 0.0)
        passed = comp_data.get("status") == "PASS"
        components.append({
            "component": comp_name,
            "similarity": similarity,
            "passed": passed,
            "threshold": threshold,
        })

    verdict = results.get("gate_5_layer_1_verdict", {})
    return {
        "components": components,
        "overall_similarity": verdict.get("average_similarity", 0.0),
        "overall_passed": verdict.get("status") == "PASS",
    }


def generate_side_by_side(original_path: str, replica_path: str, diff_path: str, output_path: str):
    """Generate a side-by-side comparison image: original | replica | diff."""
    try:
        orig = Image.open(original_path).convert("RGBA")
        repl = Image.open(replica_path).convert("RGBA")

        # Match sizes
        if orig.size != repl.size:
            repl = repl.resize(orig.size, Image.Resampling.LANCZOS)

        width, height = orig.size
        gap = 20
        total_width = width * 3 + gap * 2

        combined = Image.new("RGBA", (total_width, height), (255, 255, 255, 255))
        combined.paste(orig, (0, 0))
        combined.paste(repl, (width + gap, 0))

        if diff_path and Path(diff_path).exists():
            diff = Image.open(diff_path).convert("RGBA")
            if diff.size != orig.size:
                diff = diff.resize(orig.size, Image.Resampling.LANCZOS)
            combined.paste(diff, (width * 2 + gap * 2, 0))

        combined.save(output_path)
        return output_path
    except Exception as e:
        return None


def main():
    parser = argparse.ArgumentParser(description="Pixel Comparison Engine")
    parser.add_argument("--original-dir", required=True, help="Original component screenshots")
    parser.add_argument("--replica-dir", required=True, help="Replicated component screenshots")
    parser.add_argument("--output-dir", default="./comparison", help="Output directory")
    parser.add_argument("--side-by-side", action="store_true", help="Generate side-by-side images")
    parser.add_argument(
        "--output-json",
        help="Write structured comparison results to a JSON file",
    )

    args = parser.parse_args()

    original_dir = Path(args.original_dir)
    replica_dir = Path(args.replica_dir)
    output_dir = Path(args.output_dir)

    if not original_dir.exists():
        print(f"Error: Original directory not found: {original_dir}", file=sys.stderr)
        sys.exit(1)
    if not replica_dir.exists():
        print(f"Error: Replica directory not found: {replica_dir}", file=sys.stderr)
        sys.exit(1)

    # Run comparison
    results = run_comparison(original_dir, replica_dir, output_dir)

    # Generate side-by-side images if requested
    if args.side_by_side:
        sbs_dir = output_dir / "side-by-side"
        sbs_dir.mkdir(exist_ok=True)
        for comp_name, comp_data in results["components"].items():
            if comp_data.get("status") != "MISSING":
                sbs_path = sbs_dir / f"{comp_name}-comparison.png"
                generate_side_by_side(
                    comp_data.get("original", ""),
                    comp_data.get("replica", ""),
                    comp_data.get("diff_image", ""),
                    str(sbs_path),
                )

    # Write full results
    results_path = output_dir / "comparison-results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    # Write structured output JSON if requested
    if args.output_json:
        output_json_data = build_output_json(results)
        output_json_path = Path(args.output_json)
        output_json_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_json_path, "w") as f:
            json.dump(output_json_data, f, indent=2)
        print(f"Structured results written to {output_json_path}")

    print(f"Comparison results written to {results_path}")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
