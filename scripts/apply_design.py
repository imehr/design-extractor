#!/usr/bin/env python3
"""Install a brand's design artifacts into a target project."""

import argparse
import shutil
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="Install brand design artifacts into a target project."
    )
    parser.add_argument("--brand", required=True, help="Brand slug")
    parser.add_argument("--target-dir", required=True, help="Target project directory")
    args = parser.parse_args()

    brand_dir = Path.home() / ".claude" / "design-library" / "brands" / args.brand
    target = Path(args.target_dir).resolve()

    if not brand_dir.exists():
        print(f"Brand not found: {brand_dir}")
        return 1

    copied = []
    for name in ["design-tokens.css", "DESIGN.md", "design-tokens.json"]:
        src = brand_dir / name
        if src.exists():
            dest = target / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            copied.append(name)

    if copied:
        print(f"Installed {args.brand} into {target}:")
        for name in copied:
            print(f"  {name}")
    else:
        print(f"No installable artifacts found for {args.brand}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
