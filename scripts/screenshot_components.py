#!/usr/bin/env python3
# Forked from brand-extractor v1.0.0 on 2026-04-10
"""
Design Extractor — Component Screenshot Capture
Captures individual component screenshots from the original site
and from replicated HTML/CSS files for visual comparison.

Usage:
    python screenshot_components.py --url https://stripe.com --output-dir ./screenshots
    python screenshot_components.py --replica-dir ./components --output-dir ./screenshots
    python screenshot_components.py --url https://stripe.com --selectors-json ./selectors.json
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Missing dependency: playwright")
    print("Install: pip install playwright && playwright install chromium")
    sys.exit(1)


# Default component selectors for extraction from original site
COMPONENT_SELECTORS = {
    "nav": {
        "selectors": ["header nav", "nav.navbar", "[role='navigation']", "header"],
        "description": "Navigation bar",
    },
    "hero": {
        "selectors": [
            "section.hero", "[class*='hero']", "main > section:first-child",
            "[class*='banner']:not([class*='cookie'])",
        ],
        "description": "Hero section",
    },
    "button-set": {
        "selectors": ["button", "a.btn", "[class*='btn-']", "[class*='button']"],
        "description": "Button set (all variants)",
        "capture_mode": "multiple",  # capture several instances
    },
    "card": {
        "selectors": [
            "[class*='card']", "article", "[class*='tile']",
            "[class*='feature'] > div",
        ],
        "description": "Card component",
    },
    "footer": {
        "selectors": ["footer", "[class*='footer']", "[role='contentinfo']"],
        "description": "Footer",
    },
    "form": {
        "selectors": [
            "form", "[class*='form']", "input[type='text']",
            "[class*='input-group']",
        ],
        "description": "Form elements",
    },
}


def load_selectors(selectors_json_path: str) -> dict:
    """Load component selectors from a JSON file, overriding the defaults."""
    path = Path(selectors_json_path)
    if not path.exists():
        print(f"Error: Selectors JSON file not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def capture_original_components(url: str, output_dir: Path, selectors: dict) -> dict:
    """
    Navigate to URL and capture screenshots of each component.
    Returns metadata about captured components.
    """
    results = {}
    component_dir = output_dir / "components" / "original"
    component_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )
        page = context.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(4000)

        for comp_name, comp_config in selectors.items():
            result = {"name": comp_name, "found": False, "path": None, "selector_used": None}

            for selector in comp_config["selectors"]:
                try:
                    element = page.query_selector(selector)
                    if element:
                        box = element.bounding_box()
                        if box and box["width"] > 20 and box["height"] > 20:
                            path = component_dir / f"{comp_name}.png"
                            element.screenshot(path=str(path))
                            result["found"] = True
                            result["path"] = str(path)
                            result["selector_used"] = selector
                            result["dimensions"] = {
                                "width": int(box["width"]),
                                "height": int(box["height"]),
                            }
                            break
                except Exception as e:
                    continue

            results[comp_name] = result

        browser.close()

    return results


def capture_replica_components(replica_dir: Path, output_dir: Path) -> dict:
    """
    Open each replicated HTML file and capture a screenshot.
    Returns metadata about captured replicas.
    """
    results = {}
    replica_screenshot_dir = output_dir / "components" / "replica"
    replica_screenshot_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for html_file in replica_dir.glob("*.html"):
            comp_name = html_file.stem
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            try:
                page.goto(f"file://{html_file.resolve()}", wait_until="networkidle")
                page.wait_for_timeout(1000)

                # Find the main component element or use body
                element = page.query_selector("[data-component]") or page.query_selector("body > *:first-child") or page.query_selector("body")

                if element:
                    path = replica_screenshot_dir / f"{comp_name}.png"
                    element.screenshot(path=str(path))
                    box = element.bounding_box()
                    results[comp_name] = {
                        "name": comp_name,
                        "found": True,
                        "path": str(path),
                        "source_html": str(html_file),
                        "dimensions": {
                            "width": int(box["width"]) if box else 0,
                            "height": int(box["height"]) if box else 0,
                        },
                    }
            except Exception as e:
                results[comp_name] = {
                    "name": comp_name,
                    "found": False,
                    "error": str(e),
                }

            context.close()

        browser.close()

    return results


def resolve_output_dir(output_dir_arg: str) -> Path:
    """Resolve the output directory, expanding ~ for the default cache path."""
    return Path(output_dir_arg).expanduser()


def main():
    default_output = "~/.claude/design-library/cache/screenshots"

    parser = argparse.ArgumentParser(description="Component Screenshot Capture")
    parser.add_argument("--url", help="Target URL for original component capture")
    parser.add_argument("--replica-dir", help="Directory containing replicated HTML files")
    parser.add_argument(
        "--output-dir",
        default=default_output,
        help=f"Output directory (default: {default_output})",
    )
    parser.add_argument(
        "--selectors-json",
        help="Path to a JSON file with custom component selectors (overrides built-in defaults)",
    )

    args = parser.parse_args()
    output_dir = resolve_output_dir(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Determine which selectors to use
    if args.selectors_json:
        selectors = load_selectors(args.selectors_json)
    else:
        selectors = COMPONENT_SELECTORS

    results = {}

    if args.url:
        print(f"Capturing original components from {args.url}...")
        results["original"] = capture_original_components(args.url, output_dir, selectors)

    if args.replica_dir:
        replica_path = Path(args.replica_dir)
        if replica_path.exists():
            print(f"Capturing replica components from {replica_path}...")
            results["replica"] = capture_replica_components(replica_path, output_dir)
        else:
            print(f"Error: Replica directory not found: {replica_path}", file=sys.stderr)
            sys.exit(1)

    # Write metadata
    meta_path = output_dir / "component-screenshots.json"
    with open(meta_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Screenshot metadata written to {meta_path}")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
