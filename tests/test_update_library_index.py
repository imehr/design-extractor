"""Integration tests for update_library_index.py library management."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")


def _make_metadata(tmp_path: Path, slug: str = "test-brand") -> Path:
    """Create a minimal metadata.json fixture and return its path."""
    meta = {
        "name": slug.replace("-", " ").title(),
        "source_url": f"https://{slug}.example.com",
        "extracted_at": "2026-04-10",
        "extractor_version": "0.1.0",
        "scores": {"overall": 0.92},
        "confidence": "HIGH",
        "categories": ["dev-tools"],
        "synthetic": False,
    }
    p = tmp_path / f"{slug}-metadata.json"
    p.write_text(json.dumps(meta))
    return p


def _run(args: list[str], home: Path, timeout: int = 10) -> subprocess.CompletedProcess:
    env = {"HOME": str(home), "PATH": "/usr/bin:/usr/local/bin:/opt/homebrew/bin"}
    return subprocess.run(
        [sys.executable, str(SCRIPTS / "update_library_index.py")] + args,
        capture_output=True, text=True, timeout=timeout, env=env,
    )


def _load_index(home: Path) -> dict:
    idx = home / ".claude" / "design-library" / "index.json"
    return json.loads(idx.read_text())


# -- Add a brand ---------------------------------------------------------------

def test_add_brand(tmp_path):
    meta = _make_metadata(tmp_path, "test-brand")
    result = _run(["--add", "test-brand", "--metadata", str(meta)], home=tmp_path)
    assert result.returncode == 0, f"Failed: {result.stderr}"

    data = _load_index(tmp_path)
    slugs = [b["slug"] for b in data["brands"]]
    assert "test-brand" in slugs


# -- List empty library --------------------------------------------------------

def test_list_empty(tmp_path):
    result = _run(["--list"], home=tmp_path)
    assert result.returncode == 0
    assert "(library is empty)" in result.stdout


# -- Remove a brand ------------------------------------------------------------

def test_remove_brand(tmp_path):
    meta = _make_metadata(tmp_path, "remove-me")
    _run(["--add", "remove-me", "--metadata", str(meta)], home=tmp_path)

    result = _run(["--remove", "remove-me"], home=tmp_path)
    assert result.returncode == 0

    data = _load_index(tmp_path)
    slugs = [b["slug"] for b in data["brands"]]
    assert "remove-me" not in slugs


# -- Idempotent add ------------------------------------------------------------

def test_add_idempotent(tmp_path):
    meta = _make_metadata(tmp_path, "dupe-brand")
    _run(["--add", "dupe-brand", "--metadata", str(meta)], home=tmp_path)
    _run(["--add", "dupe-brand", "--metadata", str(meta)], home=tmp_path)

    data = _load_index(tmp_path)
    matches = [b for b in data["brands"] if b["slug"] == "dupe-brand"]
    assert len(matches) == 1, f"Expected 1 entry, found {len(matches)}"
