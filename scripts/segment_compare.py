#!/usr/bin/env python3
"""
Segment-based screenshot comparison.
Slices full-page screenshots into fixed-height segments, compares each pair,
and produces per-segment scores with actionable improvement guidance.

Usage:
    python3 scripts/segment_compare.py --original orig.png --replica repl.png --output report.json
    python3 scripts/segment_compare.py --brand quantium-com-au --page homepage --output-dir ./segments
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image
    from pixelmatch import pixelmatch
except ImportError:
    print("Missing: pip install Pillow pixelmatch")
    sys.exit(1)

SEGMENT_HEIGHT = 720  # One viewport height per segment


def slice_image(img: Image.Image, segment_height: int = SEGMENT_HEIGHT) -> list[Image.Image]:
    """Slice an image into horizontal segments of fixed height."""
    width, height = img.size
    segments = []
    y = 0
    while y < height:
        box = (0, y, width, min(y + segment_height, height))
        segment = img.crop(box)
        # Pad short last segment to full height for fair comparison
        if segment.size[1] < segment_height:
            padded = Image.new("RGBA", (width, segment_height), (255, 255, 255, 255))
            padded.paste(segment, (0, 0))
            segment = padded
        segments.append(segment)
        y += segment_height
    return segments


def compare_segments(orig_segments: list[Image.Image], repl_segments: list[Image.Image]) -> list[dict]:
    """Compare corresponding segments using pixelmatch."""
    results = []
    max_len = max(len(orig_segments), len(repl_segments))

    for i in range(max_len):
        if i >= len(orig_segments):
            results.append({
                "index": i,
                "status": "extra_in_replica",
                "score": 0.0,
                "message": f"Segment {i}: exists in replica but not in original (replica is longer)",
            })
            continue
        if i >= len(repl_segments):
            results.append({
                "index": i,
                "status": "missing_in_replica",
                "score": 0.0,
                "message": f"Segment {i}: exists in original but not in replica (replica is shorter)",
            })
            continue

        orig_seg = orig_segments[i].convert("RGBA")
        repl_seg = repl_segments[i].convert("RGBA")

        # Resize replica segment to match original if widths differ
        if orig_seg.size != repl_seg.size:
            repl_seg = repl_seg.resize(orig_seg.size, Image.Resampling.LANCZOS)

        w, h = orig_seg.size
        total = w * h

        mismatch = pixelmatch(
            orig_seg.tobytes(),
            repl_seg.tobytes(),
            w, h,
            threshold=0.3,
            includeAA=False,
        )

        score = round((1.0 - mismatch / total) * 100, 1)

        results.append({
            "index": i,
            "status": "compared",
            "score": score,
            "y_start": i * SEGMENT_HEIGHT,
            "y_end": (i + 1) * SEGMENT_HEIGHT,
            "dimensions": f"{w}x{h}",
            "mismatch_pixels": mismatch,
            "total_pixels": total,
        })

    return results


def save_segment_images(segments: list[Image.Image], output_dir: Path, prefix: str) -> list[str]:
    """Save segment images to disk for visual inspection."""
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, seg in enumerate(segments):
        path = output_dir / f"{prefix}-seg-{i:02d}.png"
        seg.save(str(path))
        paths.append(str(path))
    return paths


def generate_report(
    orig_path: str,
    repl_path: str,
    output_dir: Path | None = None,
) -> dict:
    """Full segment comparison report."""
    orig = Image.open(orig_path)
    repl = Image.open(repl_path)

    orig_segments = slice_image(orig)
    repl_segments = slice_image(repl)

    results = compare_segments(orig_segments, repl_segments)

    # Save segment images if output dir provided
    orig_paths = []
    repl_paths = []
    if output_dir:
        orig_paths = save_segment_images(orig_segments, output_dir, "orig")
        repl_paths = save_segment_images(repl_segments, output_dir, "repl")
        for r in results:
            idx = r["index"]
            if idx < len(orig_paths):
                r["original_segment"] = orig_paths[idx]
            if idx < len(repl_paths):
                r["replica_segment"] = repl_paths[idx]

    # Summary
    compared = [r for r in results if r["status"] == "compared"]
    scores = [r["score"] for r in compared]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    worst = sorted(compared, key=lambda r: r["score"])[:3]

    return {
        "original": orig_path,
        "replica": repl_path,
        "original_size": f"{orig.size[0]}x{orig.size[1]}",
        "replica_size": f"{repl.size[0]}x{repl.size[1]}",
        "segment_height": SEGMENT_HEIGHT,
        "original_segments": len(orig_segments),
        "replica_segments": len(repl_segments),
        "average_score": avg_score,
        "segments": results,
        "worst_segments": [
            {"index": w["index"], "score": w["score"], "y_range": f"{w['y_start']}-{w['y_end']}px"}
            for w in worst
        ],
    }


def main():
    parser = argparse.ArgumentParser(description="Segment-based screenshot comparison")
    parser.add_argument("--original", help="Path to original full-page screenshot")
    parser.add_argument("--replica", help="Path to replica full-page screenshot")
    parser.add_argument("--brand", help="Brand slug (uses harness screenshots)")
    parser.add_argument("--page", help="Page slug (used with --brand)")
    parser.add_argument("--output", help="Output JSON report path")
    parser.add_argument("--output-dir", help="Directory to save segment images")
    parser.add_argument("--all-pages", action="store_true", help="Compare all pages for a brand")
    args = parser.parse_args()

    if args.brand:
        harness_dir = Path.home() / ".claude" / "design-library" / "cache" / args.brand / "screenshots" / "harness"

        if args.all_pages:
            # Compare all pages
            all_reports = {}
            for orig_file in sorted(harness_dir.glob("orig-*.png")):
                page_slug = orig_file.stem.replace("orig-", "")
                repl_file = harness_dir / f"repl-{page_slug}.png"
                if not repl_file.exists():
                    continue

                seg_dir = harness_dir / "segments" / page_slug if args.output_dir else None
                report = generate_report(str(orig_file), str(repl_file), seg_dir)
                all_reports[page_slug] = report

                print(f"\n{page_slug}: avg {report['average_score']}% ({report['original_segments']} orig / {report['replica_segments']} repl segments)")
                for seg in report["segments"]:
                    if seg["status"] == "compared":
                        bar = "#" * int(seg["score"] / 5) + "." * (20 - int(seg["score"] / 5))
                        marker = " ***" if seg["score"] < 60 else ""
                        print(f"  seg {seg['index']:2d} [{bar}] {seg['score']:5.1f}%  ({seg['y_start']}-{seg['y_end']}px){marker}")

            # Overall summary
            all_scores = [r["average_score"] for r in all_reports.values()]
            overall = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0
            print(f"\nOverall average: {overall}%")

            # Write combined report
            if args.output:
                combined = {"pages": all_reports, "overall_average": overall}
                Path(args.output).parent.mkdir(parents=True, exist_ok=True)
                with open(args.output, "w") as f:
                    json.dump(combined, f, indent=2)
                print(f"Report: {args.output}")

            return 0

        # Single page
        if not args.page:
            print("Error: --page required with --brand (or use --all-pages)")
            return 1

        orig_path = str(harness_dir / f"orig-{args.page}.png")
        repl_path = str(harness_dir / f"repl-{args.page}.png")
    elif args.original and args.replica:
        orig_path = args.original
        repl_path = args.replica
    else:
        print("Error: provide --original + --replica, or --brand + --page")
        return 1

    seg_dir = Path(args.output_dir) if args.output_dir else None
    report = generate_report(orig_path, repl_path, seg_dir)

    print(f"Original: {report['original_size']} ({report['original_segments']} segments)")
    print(f"Replica:  {report['replica_size']} ({report['replica_segments']} segments)")
    print(f"Average:  {report['average_score']}%")
    print()

    for seg in report["segments"]:
        if seg["status"] == "compared":
            bar = "#" * int(seg["score"] / 5) + "." * (20 - int(seg["score"] / 5))
            marker = " ***" if seg["score"] < 60 else ""
            print(f"  seg {seg['index']:2d} [{bar}] {seg['score']:5.1f}%  ({seg['y_start']}-{seg['y_end']}px){marker}")
        else:
            print(f"  seg {seg['index']:2d} [{seg['status']}]")

    print(f"\nWorst segments: {report['worst_segments']}")

    if args.output:
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Report: {args.output}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
