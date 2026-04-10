#!/usr/bin/env python3
"""
Design Extractor — Replica Renderer
Opens a replica HTML file in headless Chromium, captures full-page screenshots
at three breakpoints (desktop, tablet, mobile) and component-level screenshots
for elements annotated with data-component attributes.

Usage:
    python render_replica.py --html replica.html --output-dir ./screenshots
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Missing dependency: playwright")
    print("Install: pip install playwright && playwright install chromium")
    sys.exit(1)

BREAKPOINTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
}

COMPONENTS = ["nav", "hero", "button-set", "card", "footer", "form"]


def write_error_manifest(output_dir: Path, html_path: str, error: str) -> None:
    """Write an error manifest and exit with code 1."""
    manifest = {
        "html_path": html_path,
        "error": error,
        "rendered_at": datetime.now(timezone.utc).isoformat(),
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    with open(output_dir / "render-manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Error: {error}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Render a replica HTML file and capture screenshots at multiple breakpoints."
    )
    parser.add_argument("--html", required=True, help="Path to the replica HTML file")
    parser.add_argument("--output-dir", required=True, help="Directory for output screenshots")
    args = parser.parse_args()

    html_path = Path(args.html).resolve()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not html_path.exists():
        write_error_manifest(output_dir, str(html_path), f"HTML file not found: {html_path}")

    file_url = f"file://{html_path}"
    manifest = {
        "html_path": str(html_path),
        "breakpoints": {},
        "components": {},
        "rendered_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            # --- Breakpoint screenshots ---
            for bp_name, dimensions in BREAKPOINTS.items():
                context = browser.new_context(viewport=dimensions)
                page = context.new_page()
                page.goto(file_url, wait_until="domcontentloaded")
                page.wait_for_timeout(2000)

                filename = f"replica-{bp_name}.png"
                page.screenshot(path=str(output_dir / filename), full_page=True)
                manifest["breakpoints"][bp_name] = filename
                context.close()

            # --- Component screenshots (desktop viewport) ---
            context = browser.new_context(viewport=BREAKPOINTS["desktop"])
            page = context.new_page()
            page.goto(file_url, wait_until="domcontentloaded")
            page.wait_for_timeout(2000)

            for comp in COMPONENTS:
                selector = f'[data-component="{comp}"]'
                element = page.query_selector(selector)
                if element:
                    filename = f"replica-{comp}.png"
                    element.screenshot(path=str(output_dir / filename))
                    manifest["components"][comp] = filename

            context.close()
            browser.close()

    except Exception as exc:
        write_error_manifest(output_dir, str(html_path), str(exc))

    # Write manifest
    with open(output_dir / "render-manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Rendered {len(manifest['breakpoints'])} breakpoints, "
          f"{len(manifest['components'])} components")
    print(f"Manifest: {output_dir / 'render-manifest.json'}")


if __name__ == "__main__":
    main()
