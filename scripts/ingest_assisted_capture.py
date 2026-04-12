#!/usr/bin/env python3
"""Import manually captured screenshots, DOM exports, and assets for brands blocked by anti-bot protection."""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path


def slug_from_filename(name: str) -> str:
    stem = Path(name).stem
    slug = re.sub(r"^(orig|repl|original|replica)[-_]", "", stem, flags=re.IGNORECASE)
    return slug.replace("_", "-").lower()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import manually captured artifacts for anti-bot-protected brands."
    )
    parser.add_argument(
        "--brand", required=True, help="Brand slug (e.g. woolworths-com-au)"
    )
    parser.add_argument(
        "--screenshots-dir",
        required=True,
        help="Directory containing original screenshots",
    )
    parser.add_argument(
        "--dom-export", default=None, help="Path to DOM export JSON file"
    )
    parser.add_argument(
        "--assets-dir", default=None, help="Directory containing downloaded assets"
    )
    args = parser.parse_args()

    brand_cache = Path.home() / ".claude" / "design-library" / "cache" / args.brand
    brand_dir = Path.home() / ".claude" / "design-library" / "brands" / args.brand
    screenshots_dir = brand_cache / "screenshots" / "harness"
    dom_dir = brand_cache / "dom-extraction"
    assets_target = brand_cache / "assets"

    imported = {"screenshots": 0, "dom_pages": 0, "assets": 0}

    # Import screenshots
    screenshots_src = Path(args.screenshots_dir)
    if not screenshots_src.exists():
        print(f"Screenshots directory not found: {screenshots_src}")
        return 1

    screenshots_dir.mkdir(parents=True, exist_ok=True)
    for img_file in screenshots_src.iterdir():
        if img_file.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            slug = slug_from_filename(img_file.name)
            dest_name = f"orig-{slug}{img_file.suffix}"
            shutil.copy2(img_file, screenshots_dir / dest_name)
            imported["screenshots"] += 1

    # Import DOM export
    if args.dom_export:
        dom_file = Path(args.dom_export)
        if dom_file.exists():
            dom_dir.mkdir(parents=True, exist_ok=True)
            try:
                data = json.loads(dom_file.read_text())
                if isinstance(data, dict):
                    for page_slug, page_data in data.items():
                        out_path = dom_dir / f"{page_slug}.json"
                        out_path.write_text(json.dumps(page_data, indent=2))
                        imported["dom_pages"] += 1
                elif isinstance(data, list):
                    shutil.copy2(dom_file, dom_dir / "manual-export.json")
                    imported["dom_pages"] = len(data)
            except json.JSONDecodeError:
                shutil.copy2(dom_file, dom_dir / "manual-export.json")
                imported["dom_pages"] = 1

    # Import assets
    if args.assets_dir:
        assets_src = Path(args.assets_dir)
        if assets_src.exists():
            assets_target.mkdir(parents=True, exist_ok=True)
            for asset in assets_src.iterdir():
                if asset.is_file():
                    shutil.copy2(asset, assets_target / asset.name)
                    imported["assets"] += 1

    # Create pages.json from imported screenshots
    pages_config = []
    for img_file in sorted(screenshots_dir.glob("orig-*.png")):
        page_slug = slug_from_filename(img_file.name)
        pages_config.append({"slug": page_slug, "url": "", "type": "unknown"})

    if pages_config:
        validation_dir = brand_cache / "validation"
        validation_dir.mkdir(parents=True, exist_ok=True)
        pages_path = validation_dir / "pages.json"
        pages_path.write_text(json.dumps(pages_config, indent=2))

    # Mark metadata as assisted capture
    metadata_path = brand_dir / "metadata.json"
    if metadata_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text())
        except json.JSONDecodeError:
            metadata = {}
    else:
        metadata = {}
    metadata["assisted_capture"] = True
    metadata["capture_method"] = "manual"
    metadata_dir = metadata_path.parent
    metadata_dir.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(metadata, indent=2))

    print(f"Imported artifacts for {args.brand}:")
    print(f"  Screenshots: {imported['screenshots']}")
    print(f"  DOM pages: {imported['dom_pages']}")
    print(f"  Assets: {imported['assets']}")
    print(f"  Pages config: {len(pages_config)} pages")
    print(f"  Provenance: assisted_capture=True")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
