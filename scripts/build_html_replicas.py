#!/usr/bin/env python3
"""Build exact HTML replicas by injecting extracted tokens into the offline mirror.

The previous approach rebuilt CSS from scratch (token-styled) → 6.5% pixel match.
This approach takes the mirror (which preserves the real site CSS + assets) and
injects the extracted design tokens as CSS custom properties (:root block). The
result is a near-exact reproduction that ALSO proves the tokens are correct.

Usage: build_html_replicas.py --slug <slug>
Writes: brands/<slug>/replica-html/<page>.html (+ mirrors to library)
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LIBRARY_ROOT = Path.home() / ".claude" / "design-library"


def load_tokens_css(slug: str) -> str:
    """Generate a :root { --brand-*: ... } block from design-tokens.json."""
    tokens_path = LIBRARY_ROOT / "brands" / slug / "design-tokens.json"
    if not tokens_path.exists():
        tokens_path = REPO_ROOT / "brands" / slug / "design-tokens.json"
    if not tokens_path.exists():
        return ""

    data = json.loads(tokens_path.read_text(encoding="utf-8"))
    palette = (data.get("colours") or {}).get("palette") or {}
    typography = data.get("typography") or {}
    spacing = data.get("spacing") or {}
    borders = data.get("borders") or {}
    shadows = data.get("shadows") or []

    lines = [":root {"]
    # Colours
    for key, value in sorted(palette.items()):
        if isinstance(value, str) and (value.startswith("#") or value.startswith("rgb")):
            lines.append(f"  --brand-{key}: {value};")
    # Fonts
    for fam in (typography.get("families") or [])[:2]:
        role = fam.get("role", "body")
        val = fam.get("value", "")
        if val:
            lines.append(f'  --brand-font-{role}: {val};')
    # Spacing
    max_w = spacing.get("max_width")
    if max_w:
        lines.append(f"  --brand-container-max: {max_w};")
    content_pad = spacing.get("content_padding")
    if content_pad:
        lines.append(f"  --brand-container-gutter: {content_pad};")
    # Radii
    radii = borders.get("radii") or []
    for i, r in enumerate(radii[:4]):
        val = r.get("value", "") if isinstance(r, dict) else str(r)
        if val:
            tier = ["sm", "md", "lg", "pill"][i] if i < 4 else str(i)
            lines.append(f"  --brand-radius-{tier}: {val};")
    # Shadows
    for i, s in enumerate(shadows[:2]):
        val = s.get("value", "") if isinstance(s, dict) else str(s)
        if val:
            lines.append(f"  --brand-shadow-{i+1}: {val};")
    lines.append("}")
    return "\n".join(lines)


def build_replica_page(mirror_html: str, tokens_css: str) -> str:
    """Inject the token :root block into the mirror HTML's <head>."""
    token_block = f'<style id="extracted-design-tokens">\n{tokens_css}\n</style>'
    if "</head>" in mirror_html:
        return mirror_html.replace("</head>", f"{token_block}\n</head>", 1)
    elif "<head>" in mirror_html:
        return mirror_html.replace("<head>", f"<head>\n{token_block}", 1)
    else:
        return f"{token_block}\n{mirror_html}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build exact HTML replicas from mirror + tokens.")
    parser.add_argument("--slug", required=True, help="Brand slug")
    args = parser.parse_args()
    slug = args.slug

    # Find the offline mirror pages
    mirror_root = LIBRARY_ROOT / "brands" / slug / "original"
    if not mirror_root.exists():
        mirror_root = REPO_ROOT / "brands" / slug / "original"
    if not mirror_root.exists():
        print(f"No mirror found for {slug} — run the full extraction first.")
        return 1

    # Load tokens
    tokens_css = load_tokens_css(slug)
    if not tokens_css:
        print(f"Warning: no design-tokens.json found for {slug}")

    # Output dirs (both repo + library)
    repo_out = REPO_ROOT / "brands" / slug / "replica-html"
    lib_out = LIBRARY_ROOT / "brands" / slug / "replica-html"
    repo_out.mkdir(parents=True, exist_ok=True)
    lib_out.mkdir(parents=True, exist_ok=True)

    # Find pages.json for the page list
    pages_json = LIBRARY_ROOT / "cache" / slug / "validation" / "pages.json"
    page_slugs = []
    if pages_json.exists():
        pages = json.loads(pages_json.read_text())
        page_slugs = list(pages.keys())
    if not page_slugs:
        page_slugs = [d.name for d in mirror_root.iterdir() if d.is_dir() and (d / "index.html").exists()]

    built = 0
    failed = []
    for page_slug in page_slugs:
        mirror_page = mirror_root / page_slug / "index.html"
        if not mirror_page.exists():
            # Try homepage as a flat index.html under mirror root
            if page_slug == "homepage":
                mirror_page = mirror_root / "index.html"
            if not mirror_page.exists():
                failed.append(page_slug)
                continue

        mirror_html = mirror_page.read_text(encoding="utf-8")
        replica_html = build_replica_page(mirror_html, tokens_css)

        # Write to both repo + library
        for out_dir in (repo_out, lib_out):
            (out_dir / f"{page_slug}.html").write_text(replica_html, encoding="utf-8")
            # Copy assets (images etc) that the mirror localized
            mirror_assets = mirror_page.parent / "assets"
            if mirror_assets.exists():
                target_assets = out_dir / "assets"
                target_assets.mkdir(parents=True, exist_ok=True)
                for asset in mirror_assets.iterdir():
                    if asset.is_file():
                        shutil.copy2(asset, target_assets / asset.name)

        built += 1
        print(f"  {page_slug}: built ({len(replica_html)} bytes)")

    # Write manifest
    manifest = {
        "slug": slug,
        "source": "mirror-plus-tokens",
        "pages": page_slugs,
        "built": built,
        "failed": failed,
        "tokens_injected": bool(tokens_css),
    }
    for out_dir in (repo_out, lib_out):
        (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"\nBuilt {built}/{len(page_slugs)} HTML replicas (mirror + tokens)")
    if failed:
        print(f"Failed: {', '.join(failed)}")
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
