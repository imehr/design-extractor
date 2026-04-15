#!/usr/bin/env python3
"""Package an extracted brand for use in a new project.

Usage:
    python3 scripts/package_brand.py --brand nineforbrands-com-au --output ~/Desktop/nine-brand-kit
"""
import argparse, json, shutil, sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Package a brand for project use")
    parser.add_argument("--brand", required=True)
    parser.add_argument("--output", required=True, help="Output directory")
    args = parser.parse_args()

    brands_dir = Path.home() / ".claude" / "design-library" / "brands" / args.brand
    if not brands_dir.exists():
        print(f"Brand not found: {brands_dir}")
        return 1

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    # 1. Skill directory (for .claude/skills/)
    skill_dir = out / "skill"
    skill_dir.mkdir(exist_ok=True)
    for f in ["DESIGN.md", "design-tokens.json", "design-tokens.css"]:
        src = brands_dir / f
        if src.exists():
            shutil.copy2(src, skill_dir / f)
    skill_src = brands_dir / "skill" / "SKILL.md"
    if skill_src.exists():
        shutil.copy2(skill_src, skill_dir / "SKILL.md")

    # 2. Assets (logos, fonts, key images)
    assets_dir = out / "assets"
    assets_dir.mkdir(exist_ok=True)
    
    # From public dir
    pub = Path(__file__).resolve().parent.parent / "ui" / "public" / "brands" / args.brand
    if pub.exists():
        for f in pub.rglob("*"):
            if f.is_file() and not f.name.startswith(".") and "screenshots" not in str(f):
                rel = f.relative_to(pub)
                dest = assets_dir / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, dest)

    # 3. React components (optional reference)
    comp_src = Path(__file__).resolve().parent.parent / "ui" / "components" / "brands" / args.brand
    if comp_src.exists():
        comp_dir = out / "components"
        shutil.copytree(comp_src, comp_dir, dirs_exist_ok=True)

    # 4. Install script
    meta = json.loads((brands_dir / "metadata.json").read_text()) if (brands_dir / "metadata.json").exists() else {}
    brand_name = meta.get("name", args.brand)
    
    install_script = f"""#!/bin/bash
# Install {brand_name} design system into your project
# Run from your project root: bash /path/to/brand-kit/install.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Installing {brand_name} design system..."
echo "  Source: $SCRIPT_DIR"
echo "  Target: $(pwd)"

# 1. Install Claude Code skill
mkdir -p .claude/skills/brand-{args.brand}
cp "$SCRIPT_DIR/skill/SKILL.md" .claude/skills/brand-{args.brand}/
cp "$SCRIPT_DIR/skill/DESIGN.md" .claude/skills/brand-{args.brand}/
cp "$SCRIPT_DIR/skill/design-tokens.json" .claude/skills/brand-{args.brand}/
cp "$SCRIPT_DIR/skill/design-tokens.css" .claude/skills/brand-{args.brand}/ 2>/dev/null
echo "  Skill installed at .claude/skills/brand-{args.brand}/"

# 2. Copy DESIGN.md to project root
cp "$SCRIPT_DIR/skill/DESIGN.md" ./DESIGN.md
echo "  DESIGN.md copied to project root"

# 3. Copy assets to public/brand/
mkdir -p public/brand
cp -r "$SCRIPT_DIR/assets/"* public/brand/ 2>/dev/null
ASSET_COUNT=$(find public/brand -type f 2>/dev/null | wc -l | tr -d ' ')
echo "  $ASSET_COUNT assets copied to public/brand/"

# 4. Copy React components as reference
mkdir -p components/brand
cp "$SCRIPT_DIR/components/"*.tsx components/brand/ 2>/dev/null

# 5. Append CSS variables
if [ -f app/globals.css ]; then
  echo "" >> app/globals.css
  echo "/* {brand_name} Design Tokens */" >> app/globals.css
  cat "$SCRIPT_DIR/skill/design-tokens.css" >> app/globals.css
  echo "  CSS variables appended to app/globals.css"
elif [ -f src/app/globals.css ]; then
  echo "" >> src/app/globals.css
  cat "$SCRIPT_DIR/skill/design-tokens.css" >> src/app/globals.css
  echo "  CSS variables appended to src/app/globals.css"
else
  cp "$SCRIPT_DIR/skill/design-tokens.css" ./design-tokens.css 2>/dev/null
fi

echo ""
echo "Done! Your project now has:"
echo "  ./DESIGN.md              — Design system rules"
echo "  .claude/skills/          — Claude Code auto-triggers"
echo "  public/brand/            — Logos, fonts, images"
echo ""
echo "Ask Claude: 'Build a landing page matching the {brand_name} brand'"
"""
    (out / "install.sh").write_text(install_script)
    (out / "install.sh").chmod(0o755)

    # 5. README
    readme = f"""# {brand_name} Brand Kit

Extracted design system ready to install in any Next.js/React project.

## Quick Install

```bash
cd your-project
bash path/to/{out.name}/install.sh
```

## What's Included

- `skill/SKILL.md` — Claude Code skill (auto-triggers when building UI)
- `skill/DESIGN.md` — Full design rules, colors, typography, components, do's/don'ts
- `skill/design-tokens.json` — Machine-readable tokens
- `skill/design-tokens.css` — CSS custom properties
- `assets/` — Logos, fonts, images ({sum(1 for _ in assets_dir.rglob('*') if _.is_file())} files)
- `components/` — React header/footer reference implementations
- `install.sh` — One-command installer

## Usage with Claude Code

After installing, just ask:
- "Build a landing page matching the {brand_name} brand"
- "Create a contact form using {brand_name} design tokens"
- "Add a navigation header following {brand_name} style"

Claude reads the SKILL.md automatically and follows the design rules.

Source: {meta.get('source_url', 'N/A')}
Score: {meta.get('overall_score', 'N/A')}
"""
    (out / "README.md").write_text(readme)

    # Summary
    file_count = sum(1 for _ in out.rglob("*") if _.is_file())
    print(f"\nPackaged: {brand_name}")
    print(f"  Output: {out}")
    print(f"  Files: {file_count}")
    print(f"  Contents:")
    print(f"    skill/SKILL.md + DESIGN.md + tokens")
    print(f"    assets/ ({sum(1 for _ in assets_dir.rglob('*') if _.is_file())} files)")
    if comp_src.exists():
        print(f"    components/ ({sum(1 for _ in (out/'components').rglob('*') if _.is_file())} files)")
    print(f"    install.sh (one-command installer)")
    print(f"    README.md")
    print(f"\n  Install: cd your-project && bash {out}/install.sh")

if __name__ == "__main__":
    sys.exit(main() or 0)
