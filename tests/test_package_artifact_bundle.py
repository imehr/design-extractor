"""Unit tests for scripts/package_artifact_bundle.py (no network, no browser)."""

from __future__ import annotations

import json
import struct
import sys
import zipfile
import zlib
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))

import package_artifact_bundle as pab  # noqa: E402


def _tiny_png(rgba: tuple[int, int, int, int] = (255, 0, 0, 255)) -> bytes:
    """A valid 1x1 RGBA PNG built from primitives (no third-party deps)."""
    width = height = 1
    raw = b"\x00" + bytes(rgba) * width

    def chunk(typ: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


# ---------------------------------------------------------------------------
# Task 1.1 — inliner + artifact.json
# ---------------------------------------------------------------------------

class TestPackageInliner:
    def _basic_mirror(self, tmp_path: Path) -> Path:
        """A minimal mirror dir shaped like mirror_original_pages.py output.

        Stylesheets live in assets/ (as the real mirror stores them) and are
        linked as href="assets/<name>.css"; url() inside them references a
        sibling by bare name, resolved against the CSS file's directory.
        """
        mirror = tmp_path / "mirror"
        (mirror / "assets").mkdir(parents=True)
        (mirror / "assets" / "a.css").write_text(
            "body{background:url(b.png)}", encoding="utf-8"
        )
        (mirror / "assets" / "b.png").write_bytes(_tiny_png())
        (mirror / "index.html").write_text(
            "<!DOCTYPE html><html><head><title>T</title>"
            '<link rel="stylesheet" href="assets/a.css">'
            "</head><body><p>hi</p></body></html>",
            encoding="utf-8",
        )
        return mirror

    def test_inlines_stylesheet_and_dataifies_css_url(self, tmp_path):
        mirror = self._basic_mirror(tmp_path)
        out = tmp_path / "out"
        result = pab.package(mirror, out)
        html = (out / "index.html").read_text(encoding="utf-8")
        assert "<style" in html and "</style>" in html
        # CSS body was inlined and its url(b.png) became a data: URI.
        assert "body{background:url(" in html.replace(" ", "")
        assert "data:image/png;base64," in html
        # The stylesheet <link> is gone.
        assert 'rel="stylesheet"' not in html
        manifest = json.loads((out / "artifact.json").read_text())
        assert manifest["kind"] == "html"
        assert manifest["entry"] == "index.html"
        assert manifest["version"] == 1
        assert manifest["renderer"] == "html"
        assert manifest["status"] == "complete"
        assert manifest["exports"] == ["html", "zip"]
        assert manifest["primary"] == "index.html"
        assert result["dir"] == str(out)
        assert isinstance(result["warnings"], list)

    def test_single_style_block(self, tmp_path):
        mirror = self._basic_mirror(tmp_path)
        out = tmp_path / "out"
        pab.package(mirror, out)
        assert (out / "index.html").read_text().count("<style") == 1

    def test_default_title_from_title_tag(self, tmp_path):
        mirror = self._basic_mirror(tmp_path)
        out = tmp_path / "out"
        pab.package(mirror, out)
        manifest = json.loads((out / "artifact.json").read_text())
        assert manifest["title"] == "T"

    def test_page_title_override(self, tmp_path):
        mirror = self._basic_mirror(tmp_path)
        out = tmp_path / "out"
        pab.package(mirror, out, page_title="Custom")
        manifest = json.loads((out / "artifact.json").read_text())
        assert manifest["title"] == "Custom"

    def test_threshold_keeps_large_asset_relative_and_copies(self, tmp_path):
        mirror = tmp_path / "mirror"
        (mirror / "assets").mkdir(parents=True)
        (mirror / "assets" / "big.png").write_bytes(b"\x00" * 2048)
        (mirror / "index.html").write_text(
            '<html><body><img src="assets/big.png"></body></html>', encoding="utf-8"
        )
        out = tmp_path / "out"
        pab.package(mirror, out, inline_threshold=10)
        html = (out / "index.html").read_text()
        assert "data:" not in html
        assert 'src="assets/big.png"' in html
        assert (out / "assets" / "big.png").is_file()

    def test_srcset_both_candidates_rewritten(self, tmp_path):
        mirror = tmp_path / "mirror"
        (mirror / "assets").mkdir(parents=True)
        (mirror / "assets" / "a.png").write_bytes(_tiny_png())
        (mirror / "assets" / "b.png").write_bytes(_tiny_png((0, 255, 0, 255)))
        (mirror / "index.html").write_text(
            '<html><body><img srcset="assets/a.png 1x, assets/b.png 2x"></body></html>',
            encoding="utf-8",
        )
        out = tmp_path / "out"
        pab.package(mirror, out)
        html = (out / "index.html").read_text()
        assert html.count("data:image/png;base64,") >= 2

    def test_absolute_url_left_untouched_with_warning(self, tmp_path):
        mirror = tmp_path / "mirror"
        mirror.mkdir()
        (mirror / "index.html").write_text(
            '<html><body><img src="https://example.com/x.png"></body></html>',
            encoding="utf-8",
        )
        out = tmp_path / "out"
        result = pab.package(mirror, out)
        html = (out / "index.html").read_text()
        assert "https://example.com/x.png" in html
        assert "data:" not in html
        assert any("https://example.com/x.png" in w for w in result["warnings"])

    def test_scripts_stripped(self, tmp_path):
        mirror = tmp_path / "mirror"
        mirror.mkdir()
        (mirror / "index.html").write_text(
            "<html><body><script>alert(1)</script><p>x</p></body></html>",
            encoding="utf-8",
        )
        out = tmp_path / "out"
        pab.package(mirror, out)
        assert "<script" not in (out / "index.html").read_text()

    def test_video_poster_inlined_by_extension_mime(self, tmp_path):
        mirror = tmp_path / "mirror"
        (mirror / "assets").mkdir(parents=True)
        (mirror / "assets" / "p.jpg").write_bytes(_tiny_png())
        (mirror / "index.html").write_text(
            '<html><body><video poster="assets/p.jpg"></video></body></html>',
            encoding="utf-8",
        )
        out = tmp_path / "out"
        pab.package(mirror, out)
        assert "data:image/jpeg;base64," in (out / "index.html").read_text()

    def test_existing_data_uri_left_alone(self, tmp_path):
        mirror = tmp_path / "mirror"
        mirror.mkdir()
        data_uri = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        (mirror / "index.html").write_text(
            f'<html><body><img src="{data_uri}"></body></html>', encoding="utf-8"
        )
        out = tmp_path / "out"
        result = pab.package(mirror, out)
        assert data_uri in (out / "index.html").read_text()
        assert not any(data_uri in w for w in result["warnings"])

    def test_zip_written(self, tmp_path):
        mirror = self._basic_mirror(tmp_path)
        out = tmp_path / "out"
        result = pab.package(mirror, out, zip=True)
        zpath = Path(result["zip"])
        assert zpath.is_file() and zpath.name == "out.zip"
        with zipfile.ZipFile(zpath) as zf:
            names = zf.namelist()
            assert "index.html" in names
            assert "artifact.json" in names
