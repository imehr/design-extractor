"""Unit tests for scripts/brand_kit_extractor.py pure functions + skip path."""

import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path


SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")


def _load_module(name: str, path: Path):
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    try:
        spec.loader.exec_module(module)
    finally:
        try:
            sys.path.remove(str(path.parent))
        except ValueError:
            pass
    return module


def test_strip_cdn_resize_removes_common_params():
    mod = _load_module("brand_kit_extractor", SCRIPTS / "brand_kit_extractor.py")

    # Mixed: drop w=, keep foo=
    result = mod.strip_cdn_resize("https://cdn.example.com/logo.png?w=100&foo=bar")
    assert result == "https://cdn.example.com/logo.png?foo=bar"

    # All resize params dropped → empty query
    result = mod.strip_cdn_resize("https://cdn.example.com/logo.png?w=100&h=50&quality=80")
    assert result == "https://cdn.example.com/logo.png"

    # No query at all → unchanged
    bare = "https://cdn.example.com/logo.png"
    assert mod.strip_cdn_resize(bare) == bare


def test_safe_filename_sanitizes_unsafe_chars():
    mod = _load_module("brand_kit_extractor", SCRIPTS / "brand_kit_extractor.py")

    # Clean filename passes through
    assert mod.safe_filename("https://example.com/logo.svg") == "logo.svg"

    # Spaces and parens become underscores
    assert mod.safe_filename("https://example.com/my logo (v2).svg") == "my_logo__v2_.svg"

    # Query string on URL is ignored (only path basename used)
    assert mod.safe_filename("https://example.com/asset.png?w=100&foo=bar") == "asset.png"

    # Truncation at 120 chars
    long_name = "a" * 200 + ".png"
    out = mod.safe_filename(f"https://example.com/{long_name}")
    assert len(out) <= 120


def test_extract_asset_urls_parses_html_and_markdown():
    mod = _load_module("brand_kit_extractor", SCRIPTS / "brand_kit_extractor.py")

    payload = {
        "data": {
            "html": "<img src='/a.png'>",
            "markdown": "![alt](/b.svg)",
        }
    }
    urls = mod.extract_asset_urls(payload, "https://example.com")
    assert "https://example.com/a.png" in urls
    assert "https://example.com/b.svg" in urls


def test_extract_asset_urls_handles_flat_response():
    mod = _load_module("brand_kit_extractor", SCRIPTS / "brand_kit_extractor.py")

    payload = {
        "html": "<img src='/a.png'>",
        "markdown": "![alt](/b.svg)",
    }
    urls = mod.extract_asset_urls(payload, "https://example.com")
    assert "https://example.com/a.png" in urls
    assert "https://example.com/b.svg" in urls


def test_skip_path_without_source_url(tmp_path):
    """No --source-url and no SERP_API_KEY — must exit 0 and write skipped status."""
    cache_dir = tmp_path / "cache"
    ui_dir = tmp_path / "ui"
    cache_dir.mkdir()
    ui_dir.mkdir()

    env = {k: v for k, v in os.environ.items() if k not in ("SERP_API_KEY", "FIRECRAWL_API_KEY")}
    env.setdefault("PATH", os.environ.get("PATH", ""))

    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPTS / "brand_kit_extractor.py"),
            "--brand-name", "Test",
            "--slug", "test",
            "--cache-dir", str(cache_dir),
            "--ui-dir", str(ui_dir),
        ],
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )

    assert result.returncode == 0, f"stdout={result.stdout}\nstderr={result.stderr}"

    status_path = cache_dir / "brand-kit" / "status.json"
    assert status_path.exists(), f"status.json missing; stdout={result.stdout}"
    status = json.loads(status_path.read_text())
    assert status["status"] == "skipped"


def test_not_found_with_unreachable_source_url(tmp_path):
    """--source-url pointing at an unreachable host — must exit 0 with status=not_found."""
    cache_dir = tmp_path / "cache"
    ui_dir = tmp_path / "ui"
    cache_dir.mkdir()
    ui_dir.mkdir()

    env = {k: v for k, v in os.environ.items() if k not in ("SERP_API_KEY", "FIRECRAWL_API_KEY")}
    env.setdefault("PATH", os.environ.get("PATH", ""))

    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPTS / "brand_kit_extractor.py"),
            "--brand-name", "Test",
            "--slug", "test",
            "--source-url", "http://127.0.0.1:1",
            "--cache-dir", str(cache_dir),
            "--ui-dir", str(ui_dir),
        ],
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )

    assert result.returncode == 0, f"stdout={result.stdout}\nstderr={result.stderr}"

    report_path = cache_dir / "brand-kit" / "report.json"
    assert report_path.exists(), f"report.json missing; stdout={result.stdout}"
    report = json.loads(report_path.read_text())
    assert report["status"] == "not_found", report
    assert report["discovery_method"] == "none"
    assert report["pages_discovered"] == []
