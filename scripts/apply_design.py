#!/usr/bin/env python3
"""Install a brand's design artifacts into a target project.

By default, installs the COMPLETE brand package:
  - DESIGN.md, design-tokens.json, design-tokens.css, metadata.json, BRAND-PACKAGE.md
  - skill/ (per-brand Claude skill — install in .claude/skills/ of your project)
  - assets/ (logos, icons, hero images, photos from the live site)
  - components/ (React + shadcn/ui brand components: header, footer, logo)
  - pages/ (full page replicas for reference)
  - validation/ (per-page similarity scores)

Use --minimal to install only the three core token/doc files.
"""

import argparse
import shutil
from pathlib import Path

# Core files that always install (even in --minimal mode)
CORE_FILES = ["DESIGN.md", "design-tokens.json", "design-tokens.css", "metadata.json"]


def _copy_file(src: Path, dest: Path, copied: list[str]) -> None:
    if src.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        copied.append(dest.name)


def _copy_tree(src: Path, dest: Path, copied: list[str], label: str) -> None:
    if not src.exists():
        return
    # Follow symlinks so symlinked caches (e.g. brand/assets -> cache/assets) are expanded.
    dest.mkdir(parents=True, exist_ok=True)
    for item in src.rglob("*"):
        if item.is_file() or item.is_symlink():
            rel = item.relative_to(src)
            target = dest / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            try:
                shutil.copy2(item, target, follow_symlinks=True)
            except OSError:
                continue
    copied.append(f"{label}/")


def _write_package_readme(target: Path, brand_slug: str) -> None:
    """Drop a small README explaining how to use each directory."""
    readme = target / "BRAND-PACKAGE.md"
    if readme.exists():
        return  # don't overwrite a manually edited one
    readme.write_text(
        f"""# Brand Package — {brand_slug}

Installed by design-extractor's apply_design.py.

| Path | Purpose |
|---|---|
| `DESIGN.md` | Full design system documentation (colours, typography, spacing, voice) |
| `design-tokens.json` | Design tokens in JSON format |
| `design-tokens.css` | Same tokens as CSS custom properties |
| `metadata.json` | Extraction metadata and validation scores |
| `assets/` | All logos, icons, hero images, photos |
| `skill/` | Per-brand Claude skill — drop into `.claude/skills/brand-{brand_slug}/` |
| `components/` | React + shadcn/ui components (header, footer, logo) |
| `pages/` | Full page replicas for reference |
| `validation/` | Per-page similarity scores |

## Quick start

### Use the CSS tokens
```css
@import url("./design-tokens.css");
```

### Install the Claude skill in your project
```bash
mkdir -p .claude/skills/brand-{brand_slug}
cp -R skill/* .claude/skills/brand-{brand_slug}/
```

### Copy React components
```bash
cp -R components/* my-app/components/brands/
cp -R assets/* my-app/public/brands/{brand_slug}/
```

See the `DESIGN.md` for detailed tokens, component rules, and voice guidelines.
"""
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Install brand design artifacts into a target project."
    )
    parser.add_argument("--brand", required=True, help="Brand slug")
    parser.add_argument("--target-dir", required=True, help="Target project directory")
    parser.add_argument(
        "--minimal",
        action="store_true",
        help="Install only core token/doc files (DESIGN.md, design-tokens.json, design-tokens.css, metadata.json)",
    )
    parser.add_argument(
        "--include-replica-ui",
        action="store_true",
        help="Also copy the React components and page replicas from the plugin's ui/ directory",
    )
    args = parser.parse_args()

    brand_dir = Path.home() / ".claude" / "design-library" / "brands" / args.brand
    target = Path(args.target_dir).expanduser().resolve()

    if not brand_dir.exists():
        print(f"Brand not found: {brand_dir}")
        return 1

    target.mkdir(parents=True, exist_ok=True)
    copied: list[str] = []

    # Core tokens and documentation
    for name in CORE_FILES:
        _copy_file(brand_dir / name, target / name, copied)

    if not args.minimal:
        # Skill bundle
        _copy_tree(brand_dir / "skill", target / "skill", copied, "skill")
        # Assets (follow symlink into cache if present)
        _copy_tree(brand_dir / "assets", target / "assets", copied, "assets")
        # Validation report
        _copy_tree(brand_dir / "validation", target / "validation", copied, "validation")

        # Replica UI lives in the plugin's ui/ directory, not the brand dir.
        # Only copy if explicitly requested or if the target already has a ui/-like structure.
        if args.include_replica_ui:
            plugin_root = Path(__file__).resolve().parent.parent
            components_src = plugin_root / "ui" / "components" / "brands" / args.brand
            replica_src = plugin_root / "ui" / "app" / "brands" / args.brand / "replica"
            _copy_tree(components_src, target / "components", copied, "components")
            _copy_tree(replica_src, target / "pages", copied, "pages")

        _write_package_readme(target, args.brand)
        copied.append("BRAND-PACKAGE.md")

    if not copied:
        print(f"No installable artifacts found for {args.brand}")
        return 1

    print(f"Installed {args.brand} into {target}:")
    for name in copied:
        print(f"  {name}")

    if args.minimal:
        print("\nMinimal install. For complete bundle (skill/assets/components), omit --minimal.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
