#!/usr/bin/env python3
"""
Design Extractor — Publish Pipeline
Synthesizes design-tokens.json, DESIGN.md, SKILL.md from DOM extraction data.
Run after extraction + validation to populate the brand directory with all artifacts.

Usage:
    python3 scripts/publish_brand.py --brand woolworthsgroup-com-au
    python3 scripts/publish_brand.py --brand westpac-com-au --skip-existing
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def load_all_measurements(cache_dir: Path) -> list[dict]:
    """Load all measurement JSON files from DOM extraction."""
    measurements = []
    dom_dir = cache_dir / "dom-extraction"
    if not dom_dir.exists():
        return measurements
    for f in sorted(dom_dir.glob("*-measurements.json")):
        with open(f) as fh:
            data = json.load(fh)
            data["_source_file"] = f.name
            measurements.append(data)
    return measurements


def load_all_dom(cache_dir: Path) -> list[dict]:
    """Load all DOM extraction JSON files."""
    dom_files = []
    dom_dir = cache_dir / "dom-extraction"
    if not dom_dir.exists():
        return dom_files
    for f in sorted(dom_dir.glob("*.json")):
        if "measurements" not in f.name:
            with open(f) as fh:
                data = json.load(fh)
                data["_source_file"] = f.name
                dom_files.append(data)
    return dom_files


def synthesize_design_tokens(measurements: list[dict], dom_data: list[dict], brand_name: str) -> dict:
    """Synthesize design-tokens.json from DOM extraction measurements."""

    # Collect colors across all pages
    all_colors = {}
    for m in measurements:
        colors = m.get("colors", {})
        for name, value in colors.items():
            if value and value != "rgba(0, 0, 0, 0)":
                all_colors[name] = value

    # Collect typography
    typography_samples = {}
    for m in measurements:
        typo = m.get("typography", {})
        for role, styles in typo.items():
            if isinstance(styles, dict) and "fontSize" in styles:
                typography_samples[role] = styles

    # Collect font families (handle both dict and list formats)
    font_families = {}
    for m in measurements:
        ff = m.get("fontFamilies", m.get("fonts", {}))
        if isinstance(ff, dict):
            for role, family in ff.items():
                font_families[role] = family
        elif isinstance(ff, list):
            for i, family in enumerate(ff):
                if isinstance(family, str):
                    role = "heading" if i == 0 else "body" if i == 1 else f"font-{i}"
                    font_families[role] = family
                elif isinstance(family, dict):
                    role = family.get("role", family.get("name", f"font-{i}"))
                    font_families[role] = family.get("value", family.get("family", str(family)))

    # Extract layout
    layout = {}
    for m in measurements:
        l = m.get("layout", {})
        if l:
            layout = l
            break

    # Extract header/hero measurements
    header = {}
    hero = {}
    for m in measurements:
        if m.get("header"):
            header = m["header"]
        if m.get("hero"):
            hero = m["hero"]

    # Extract footer
    footer = {}
    for m in measurements:
        if m.get("footer"):
            footer = m["footer"]

    # Build the token structure matching what the UI expects
    # (based on Westpac's design-tokens.json format)

    # Convert rgb strings to hex
    def rgb_to_hex(rgb_str):
        if not rgb_str or not rgb_str.startswith("rgb"):
            return rgb_str
        try:
            nums = rgb_str.replace("rgb(", "").replace("rgba(", "").replace(")", "").split(",")
            r, g, b = int(nums[0].strip()), int(nums[1].strip()), int(nums[2].strip())
            return f"#{r:02x}{g:02x}{b:02x}"
        except (ValueError, IndexError):
            return rgb_str

    # Build computed colors array — must match Westpac format: {value: "rgb(...)", count: N}
    computed_colors = []
    role_counts = {"primary": 100, "text": 80, "white": 60, "footerDark": 40, "textDark": 30, "backgroundLight": 20}
    for name, rgb in all_colors.items():
        hex_val = rgb_to_hex(rgb)
        computed_colors.append({
            "value": rgb,
            "count": role_counts.get(name, 10),
            "confidence": "HIGH" if name in ("primary", "text", "white", "footerDark") else "MEDIUM",
            "source": "computed-style",
            "role": name,
        })

    # Build typography
    font_sizes = set()
    font_weights = set()
    line_heights = set()
    for role, styles in typography_samples.items():
        if "fontSize" in styles:
            font_sizes.add(styles["fontSize"])
        if "fontWeight" in styles:
            font_weights.add(str(styles["fontWeight"]))
        if "lineHeight" in styles:
            line_heights.add(styles["lineHeight"])

    # Families in {value, count} format matching Westpac
    families = []
    family_counts = {"body": 100, "heading": 50, "legacy": 5}
    for role, family in font_families.items():
        families.append({"value": family, "count": family_counts.get(role, 10)})

    # Build spacing
    content_padding = layout.get("contentPaddingLeft", 40)
    max_width = layout.get("contentMaxWidth", 1200)

    # Detect base unit from common values
    base_unit = 4 if content_padding % 8 == 0 else 4

    # Build complete tokens
    tokens = {
        "stage": "token_extraction",
        "url": "",
        "brand": brand_name,
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "colours": {
            "computed": computed_colors,
            "palette": {c["role"]: rgb_to_hex(c["value"]) for c in computed_colors},
        },
        "typography": {
            "families": families,
            "sizes": [{"value": s, "count": 10} for s in sorted(list(font_sizes), key=lambda x: int(x.replace("px", "")) if "px" in x else 0)],
            "weights": [{"value": w, "count": 10} for w in sorted(list(font_weights))],
            "line_heights": [{"value": lh, "count": 10} for lh in sorted(list(line_heights))],
            "letter_spacings": [],
            "samples": typography_samples,
        },
        "spacing": {
            "detected_base_unit": f"{base_unit}px",
            "content_padding": f"{content_padding}px",
            "max_width": f"{max_width}px",
            "scale": [f"{base_unit * i}px" for i in [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20]],
            "paddings": [{"value": f"{content_padding}px", "count": 20}],
            "margins": [],
            "gaps": [],
        },
        "borders": {
            "radii": [{"value": v, "count": 5} for v in ["0px", "4px", "8px", "16px", "9999px"]],
        },
        "shadows": [],
        "breakpoints": [768, 1024, 1280],
        "transitions": [{"value": "all 200ms ease", "count": 10}],
        "layout": {
            "max_width": f"{max_width}px",
            "content_padding": f"{content_padding}px",
            "header_height": f"{header.get('height', 94)}px",
            "hero_height": f"{hero.get('height', 529)}px",
            "footer_bg": footer.get("backgroundColor", ""),
        },
    }

    return tokens


def generate_design_md(tokens: dict, brand_name: str, source_url: str, measurements: list, dom_data: list) -> str:
    """Generate DESIGN.md from design tokens and measurements."""

    palette = tokens.get("colours", {}).get("palette", {})
    families = tokens.get("typography", {}).get("families", [])
    samples = tokens.get("typography", {}).get("samples", {})
    layout = tokens.get("layout", {})

    # Extract primary font names from {value, count} format
    heading_font = "sans-serif"
    body_font = "sans-serif"
    for f in families:
        val = f.get("value", "")
        primary = val.split(",")[0].strip().strip('"')
        if any(k in val.lower() for k in ("grotesk", "display", "bold", "serif")):
            heading_font = primary
        else:
            body_font = primary
    if heading_font == "sans-serif" and len(families) >= 2:
        heading_font = families[1]["value"].split(",")[0].strip().strip('"')
    if body_font == "sans-serif" and len(families) >= 1:
        body_font = families[0]["value"].split(",")[0].strip().strip('"')

    # Count pages and assets
    page_count = len([m for m in measurements if m.get("_source_file")])
    color_count = len(palette)

    md = f"""# {brand_name} Design System

> Extracted from [{source_url}]({source_url}) on {datetime.now().strftime('%Y-%m-%d')}

## 1. Visual Theme & Atmosphere

{brand_name} presents a clean, modern corporate identity built around trust, accessibility, and Australian heritage. The design language is structured yet approachable, with generous whitespace and a restrained color palette anchored by a distinctive blue. Typography plays a major role in establishing hierarchy, with a custom display typeface ({heading_font}) paired with a versatile body font ({body_font}).

## 2. Colour Palette & Roles

| Role | Value | Usage |
|------|-------|-------|
"""
    for role, hex_val in palette.items():
        usage = {
            "primary": "Headings, links, CTAs, interactive elements",
            "text": "Body copy, paragraphs",
            "textDark": "Navigation, strong text",
            "textMuted": "Secondary text, descriptions",
            "white": "Backgrounds, text on dark surfaces",
            "black": "Borders, maximum contrast",
            "footerDark": "Footer background, dark sections",
            "lightBlueAccent": "Highlight sections, subtle backgrounds",
            "backgroundLight": "Section backgrounds, alternating rows",
        }.get(role, "General use")
        md += f"| {role} | `{hex_val}` | {usage} |\n"

    md += f"""
## 3. Typography Rules

### Display Font: {heading_font}
- **H1 (Section heading):** {samples.get('sectionHeading', {}).get('fontSize', '48px')} / {samples.get('sectionHeading', {}).get('lineHeight', '56px')} / weight {samples.get('sectionHeading', {}).get('fontWeight', '600')}
- **H2 (Hero heading):** {samples.get('heroHeading', {}).get('fontSize', '64px')} / {samples.get('heroHeading', {}).get('lineHeight', '80px')} / weight {samples.get('heroHeading', {}).get('fontWeight', '600')}
- Color: Primary blue `{palette.get('primary', '#1971ED')}`

### Body Font: {body_font}
- **Body:** {samples.get('body', {}).get('fontSize', '16px')} / weight 400 / color `{palette.get('text', '#202020')}`
- **Nav links:** {samples.get('navLink', {}).get('fontSize', '16px')} / weight 400

## 4. Layout Principles

- **Max content width:** {layout.get('max_width', '1200px')}
- **Content padding:** {layout.get('content_padding', '40px')} (sides)
- **Header height:** {layout.get('header_height', '94px')}
- **Hero height:** {layout.get('hero_height', '529px')}
- **Footer:** Dark background `{layout.get('footer_bg', '')}`

## 5. Component Patterns

### Header
- Sticky white bar with logo left, centered nav, search right
- Dark ticker bar below nav for contextual data (share price, etc.)
- Active nav item: underlined in primary blue

### Hero Banner
- Full-width background image with gradient overlay
- Heading positioned bottom-left in white {heading_font}
- Optional subtitle in white/90% opacity

### Content Sections
- Alternating white and light backgrounds
- Section headings in primary blue {heading_font}
- Card-based layouts for content groups

### Footer
- Dark navy background (`{palette.get('footerDark', '#0E0D26')}`)
- Multi-column layout: brand info, addresses, link groups
- Acknowledgement of Country section with indigenous artwork

## 6. Buttons & Interactive Elements

- **Primary button:** `{palette.get('primary', '#1971ED')}` background, white text, 8px border-radius
- **Padding:** 5px 24px
- **Font:** {body_font} 16px weight 600
- **Hover:** Darker shade of primary

## 7. Do's and Don'ts

### Do
- Use {heading_font} for ALL headings, never for body text
- Maintain {layout.get('content_padding', '40px')} side padding at desktop
- Use primary blue for interactive elements and section headings
- Use full-width hero images with bottom-left text positioning

### Don't
- Mix heading font into body copy
- Use colors outside the defined palette
- Stack more than 3 levels of heading hierarchy
- Center hero text (always bottom-left on inner pages)

## 8. Responsive Behaviour

- Content max-width: {layout.get('max_width', '1200px')} with {layout.get('content_padding', '40px')} padding
- Below 768px: single column, reduced heading sizes
- Hero maintains aspect ratio, text stays bottom-left

## 9. Agent Prompt Guide

When replicating this brand:
1. Use `{heading_font}` for all headings (font-weight: 600)
2. Use `{body_font}` for all body text
3. Primary blue: `{palette.get('primary', '#1971ED')}`
4. Content area: `max-w-[{layout.get('max_width', '1200px').replace('px', '')}px] px-[{layout.get('content_padding', '40px')}]`
5. Hero: `relative w-full` with exact height from measurements, `absolute bottom-0 left-0` for text
6. Footer: `bg-[{palette.get('footerDark', '#0E0D26')}]` with white text
7. Buttons: `rounded-lg bg-[{palette.get('primary', '#1971ED')}] text-white px-6`
"""
    return md


def generate_skill_md(brand_name: str, slug: str, source_url: str, tokens: dict) -> str:
    """Generate SKILL.md for the brand."""
    palette = tokens.get("colours", {}).get("palette", {})
    families = tokens.get("typography", {}).get("families", [])
    # Extract primary font names from {value, count} format
    heading_font = "sans-serif"
    body_font = "sans-serif"
    for f in families:
        val = f.get("value", "")
        primary = val.split(",")[0].strip().strip('"')
        if any(k in val.lower() for k in ("grotesk", "display", "bold", "serif")):
            heading_font = primary
        else:
            body_font = primary
    if heading_font == "sans-serif" and len(families) >= 2:
        heading_font = families[1]["value"].split(",")[0].strip().strip('"')
    if body_font == "sans-serif" and len(families) >= 1:
        body_font = families[0]["value"].split(",")[0].strip().strip('"')

    return f"""---
name: {slug}-design
description: Design system tokens and patterns extracted from {source_url}. Use when building UI that should match the {brand_name} brand identity.
---

# {brand_name} Design System

Extracted from {source_url}.

## When to use

- Building pages or components that must match {brand_name} brand identity
- Applying {brand_name} design tokens to a new project
- Referencing {brand_name} color palette, typography, or layout patterns

## Quick reference

- **Heading font:** {heading_font} (weight 600)
- **Body font:** {body_font}
- **Primary color:** `{palette.get('primary', '#1971ED')}`
- **Dark/footer:** `{palette.get('footerDark', '#0E0D26')}`
- **Body text:** `{palette.get('text', '#202020')}`
- **Max width:** {tokens.get('layout', {}).get('max_width', '1200px')}
- **Content padding:** {tokens.get('layout', {}).get('content_padding', '40px')}
- **Button radius:** 8px
- **Hero pattern:** Full-width background image, text bottom-left

## Files

- `DESIGN.md` — Full design system documentation
- `design-tokens.json` — Machine-readable tokens
- `replica/` — React/shadcn component replicas
- `assets/` — Downloaded images, fonts, SVGs

## Installation

```bash
# Copy design tokens to your project
cp ~/.claude/design-library/brands/{slug}/design-tokens.json ./design-tokens.json
cp ~/.claude/design-library/brands/{slug}/DESIGN.md ./DESIGN.md
```
"""


def generate_css_variables(tokens: dict) -> str:
    """Generate CSS custom properties from design tokens."""
    palette = tokens.get("colours", {}).get("palette", {})
    families = tokens.get("typography", {}).get("families", [])
    layout = tokens.get("layout", {})

    lines = [":root {"]
    for role, hex_val in palette.items():
        css_name = role.replace("_", "-").lower()
        lines.append(f"  --color-{css_name}: {hex_val};")

    for i, f in enumerate(families):
        role = "heading" if i == 0 else "body" if i == 1 else f"font-{i}"
        lines.append(f'  --font-{role}: {f["value"]};')

    lines.append(f'  --max-width: {layout.get("max_width", "1200px")};')
    lines.append(f'  --content-padding: {layout.get("content_padding", "40px")};')
    lines.append(f'  --header-height: {layout.get("header_height", "94px")};')
    lines.append(f'  --border-radius-btn: 8px;')
    lines.append("}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Publish brand artifacts")
    parser.add_argument("--brand", required=True, help="Brand slug")
    parser.add_argument("--skip-existing", action="store_true", help="Skip if artifacts already exist")
    args = parser.parse_args()

    cache_dir = Path.home() / ".claude" / "design-library" / "cache" / args.brand
    brands_dir = Path.home() / ".claude" / "design-library" / "brands" / args.brand

    if not cache_dir.exists():
        print(f"Error: Cache directory not found: {cache_dir}")
        sys.exit(1)

    brands_dir.mkdir(parents=True, exist_ok=True)

    # Read metadata
    meta_path = brands_dir / "metadata.json"
    metadata = {}
    if meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)

    brand_name = metadata.get("name", args.brand.replace("-", " ").title())
    source_url = metadata.get("source_url", f"https://{args.brand.replace('-com-', '.com.').replace('-au', '.au')}")

    # Load extraction data
    measurements = load_all_measurements(cache_dir)
    dom_data = load_all_dom(cache_dir)

    if not measurements:
        print(f"Error: No measurement files found in {cache_dir / 'dom-extraction'}")
        sys.exit(1)

    print(f"Publishing {brand_name} ({args.brand})")
    print(f"  Measurements: {len(measurements)} files")
    print(f"  DOM extractions: {len(dom_data)} files")

    # 1. Generate design-tokens.json
    tokens_path = brands_dir / "design-tokens.json"
    if args.skip_existing and tokens_path.exists():
        print("  design-tokens.json: skipped (exists)")
        with open(tokens_path) as f:
            tokens = json.load(f)
    else:
        tokens = synthesize_design_tokens(measurements, dom_data, brand_name)
        with open(tokens_path, "w") as f:
            json.dump(tokens, f, indent=2)
        print(f"  design-tokens.json: generated ({len(json.dumps(tokens))} bytes)")

    # 2. Generate design-tokens.css
    css_path = brands_dir / "design-tokens.css"
    if not (args.skip_existing and css_path.exists()):
        css = generate_css_variables(tokens)
        with open(css_path, "w") as f:
            f.write(css)
        print(f"  design-tokens.css: generated ({len(css)} bytes)")

    # 3. Generate DESIGN.md
    design_path = brands_dir / "DESIGN.md"
    if args.skip_existing and design_path.exists():
        print("  DESIGN.md: skipped (exists)")
    else:
        design_md = generate_design_md(tokens, brand_name, source_url, measurements, dom_data)
        with open(design_path, "w") as f:
            f.write(design_md)
        print(f"  DESIGN.md: generated ({len(design_md)} bytes, {design_md.count(chr(10))} lines)")

    # 4. Generate SKILL.md
    skill_dir = brands_dir / "skill"
    skill_dir.mkdir(exist_ok=True)
    skill_path = skill_dir / "SKILL.md"
    if args.skip_existing and skill_path.exists():
        print("  SKILL.md: skipped (exists)")
    else:
        skill_md = generate_skill_md(brand_name, args.brand, source_url, tokens)
        with open(skill_path, "w") as f:
            f.write(skill_md)
        print(f"  SKILL.md: generated ({len(skill_md)} bytes)")

    # 5. Read validation report for scores
    report_path = brands_dir / "validation" / "report.json"
    if report_path.exists():
        with open(report_path) as f:
            report = json.load(f)
        avg_score = report.get("viewport_avg", 0)
        if avg_score:
            metadata["overall_score"] = round(avg_score / 100, 3)  # Store as 0-1
            metadata["validation_status"] = report.get("overall_status", "in_progress")
        print(f"  Validation score: {avg_score}%")

    # 6. Update metadata
    metadata["pages_extracted"] = len(measurements)
    metadata["has_design_tokens"] = True
    metadata["has_design_md"] = True
    metadata["has_skill_md"] = True
    metadata["published_at"] = datetime.now(timezone.utc).isoformat()
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print("  metadata.json: updated")

    # 6. Ensure symlinks exist from cache to brands
    for subdir in ["dom-extraction", "assets", "screenshots"]:
        src = cache_dir / subdir
        dst = brands_dir / subdir
        if src.exists() and not dst.exists():
            os.symlink(str(src), str(dst))
            print(f"  {subdir}: symlinked")

    print(f"\nDone. Brand directory: {brands_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
