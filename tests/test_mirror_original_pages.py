"""Unit tests for scripts/mirror_original_pages.py (no network)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))

import mirror_original_pages as mop  # noqa: E402


BASE = "https://example.com/products/page/"


# ---------------------------------------------------------------------------
# resolve_url
# ---------------------------------------------------------------------------

class TestResolveUrl:
    def test_relative_path(self):
        assert mop.resolve_url(BASE, "img/logo.png") == "https://example.com/products/page/img/logo.png"

    def test_root_relative(self):
        assert mop.resolve_url(BASE, "/assets/app.css") == "https://example.com/assets/app.css"

    def test_protocol_relative(self):
        assert mop.resolve_url(BASE, "//cdn.example.net/font.woff2") == "https://cdn.example.net/font.woff2"

    def test_absolute_kept(self):
        assert mop.resolve_url(BASE, "http://other.org/x.png") == "http://other.org/x.png"

    def test_data_uri_skipped(self):
        assert mop.resolve_url(BASE, "data:image/png;base64,AAAA") is None

    def test_javascript_skipped(self):
        assert mop.resolve_url(BASE, "javascript:void(0)") is None

    def test_fragment_skipped(self):
        assert mop.resolve_url(BASE, "#section") is None

    def test_empty_skipped(self):
        assert mop.resolve_url(BASE, "  ") is None

    def test_fragment_stripped_from_resolved(self):
        assert mop.resolve_url(BASE, "/x.svg#icon") == "https://example.com/x.svg#icon".split("#")[0]

    def test_query_preserved(self):
        assert mop.resolve_url(BASE, "/x.css?v=3") == "https://example.com/x.css?v=3"


# ---------------------------------------------------------------------------
# srcset parsing
# ---------------------------------------------------------------------------

class TestSrcset:
    def test_parse_with_descriptors(self):
        value = "a.jpg 1x, b.jpg 2x, c.jpg 480w"
        assert mop.parse_srcset(value) == [("a.jpg", "1x"), ("b.jpg", "2x"), ("c.jpg", "480w")]

    def test_parse_without_descriptors(self):
        assert mop.parse_srcset("a.jpg,b.jpg") == [("a.jpg", ""), ("b.jpg", "")]

    def test_parse_single(self):
        assert mop.parse_srcset("only.png") == [("only.png", "")]

    def test_parse_trailing_comma_and_whitespace(self):
        assert mop.parse_srcset(" a.jpg 1x, ") == [("a.jpg", "1x")]

    def test_roundtrip(self):
        value = "a.jpg 1x, b.jpg 2x"
        assert mop.serialize_srcset(mop.parse_srcset(value)) == value

    def test_serialize_no_descriptor(self):
        assert mop.serialize_srcset([("x.png", "")]) == "x.png"


# ---------------------------------------------------------------------------
# CSS reference collection and rewriting
# ---------------------------------------------------------------------------

class TestCssRefs:
    def test_unquoted_url(self):
        refs = mop.collect_css_refs("body { background: url(bg.png); }")
        assert refs == [("bg.png", False)]

    def test_double_quoted_url(self):
        refs = mop.collect_css_refs('@font-face { src: url("font.woff2") format("woff2"); }')
        assert ("font.woff2", False) in refs

    def test_single_quoted_url(self):
        refs = mop.collect_css_refs("div { background: url('a b.png'); }")
        assert ("a b.png", False) in refs

    def test_escaped_quote_inside_url(self):
        refs = mop.collect_css_refs('div { background: url("we\\"ird.png"); }')
        assert ('we"ird.png', False) in refs

    def test_import_string_form(self):
        refs = mop.collect_css_refs('@import "theme.css";')
        assert refs == [("theme.css", True)]

    def test_import_url_form(self):
        refs = mop.collect_css_refs("@import url(theme.css);")
        assert refs == [("theme.css", True)]

    def test_data_uri_collected_but_skipped_at_resolve(self):
        refs = mop.collect_css_refs("div { background: url(data:image/gif;base64,R0); }")
        assert refs and mop.resolve_url(BASE, refs[0][0]) is None

    def test_dedup(self):
        css = "a { background: url(x.png); } b { background: url(x.png); }"
        assert mop.collect_css_refs(css) == [("x.png", False)]


class TestRewriteCss:
    def test_rewrite_url(self):
        css = "body { background: url('bg.png'); }"
        out = mop.rewrite_css(css, lambda raw: "abc123-bg.png" if raw == "bg.png" else None)
        assert 'url("abc123-bg.png")' in out

    def test_rewrite_import(self):
        out = mop.rewrite_css('@import "theme.css";', lambda raw: "ff00-theme.css")
        assert '@import "ff00-theme.css"' in out

    def test_none_keeps_original(self):
        css = "body { background: url(keep.png); }"
        assert mop.rewrite_css(css, lambda raw: None) == css

    def test_font_face_multiple_sources(self):
        css = '@font-face { src: url("f.woff2") format("woff2"), url("f.woff") format("woff"); }'
        mapping = {"f.woff2": "h1-f.woff2", "f.woff": "h2-f.woff"}
        out = mop.rewrite_css(css, mapping.get)
        assert 'url("h1-f.woff2")' in out and 'url("h2-f.woff")' in out


# ---------------------------------------------------------------------------
# Filename hashing
# ---------------------------------------------------------------------------

class TestLocalAssetName:
    def test_hash_prefix_and_basename(self):
        name = mop.local_asset_name("https://x.com/img/logo.png", b"content")
        assert name.endswith("-logo.png")
        assert len(name.split("-")[0]) == mop.HASH_PREFIX_LEN

    def test_same_content_same_name(self):
        a = mop.local_asset_name("https://x.com/a/logo.png", b"same")
        b = mop.local_asset_name("https://y.com/b/logo.png", b"same")
        assert a == b

    def test_different_content_different_name(self):
        a = mop.local_asset_name("https://x.com/logo.png", b"one")
        b = mop.local_asset_name("https://x.com/logo.png", b"two")
        assert a != b

    def test_query_string_not_in_name(self):
        name = mop.local_asset_name("https://x.com/app.css?v=12&x=1", b"css")
        assert "?" not in name and "&" not in name
        assert name.endswith("-app.css")

    def test_unsafe_chars_sanitised(self):
        name = mop.local_asset_name("https://x.com/we%20ird%2Bname.svg", b"svg")
        assert " " not in name and "+" not in name

    def test_no_basename_falls_back(self):
        name = mop.local_asset_name("https://x.com/", b"data", "image/png")
        assert "asset" in name and name.endswith(".png")

    def test_long_name_truncated(self):
        url = "https://x.com/" + "a" * 300 + ".png"
        name = mop.local_asset_name(url, b"x")
        assert len(name) <= mop.HASH_PREFIX_LEN + 1 + mop.MAX_FILENAME_LEN
        assert name.endswith(".png")


# ---------------------------------------------------------------------------
# HTML reference collection
# ---------------------------------------------------------------------------

FIXTURE_HTML = """<!DOCTYPE html><html><head>
<link rel="stylesheet" href="/css/app.css">
<link rel="icon" href="/favicon.ico">
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
<link rel="preload" href="/js/lazy.js" as="script">
<link rel="canonical" href="https://example.com/products/page/">
<meta property="og:image" content="/og/cover.jpg">
<script src="/js/app.js"></script>
<style>.hero { background-image: url("/img/hero.jpg"); }</style>
</head><body>
<img src="/img/a.png" srcset="/img/a.png 1x, //cdn.example.net/a@2x.png 2x" alt="a &amp; b">
<source srcset="/img/b.webp 480w">
<video poster="/img/poster.jpg" src="/media/clip.mp4"></video>
<div style="background: url('/img/inline.png')">x</div>
<iframe src="https://www.youtube.com/embed/xyz"></iframe>
<img src="data:image/gif;base64,R0lGOD" alt="inline">
<a href="/about/">About</a>
<noscript>&lt;img src="/img/noscript.png"&gt;</noscript>
</body></html>"""


class TestCollectHtmlRefs:
    @pytest.fixture()
    def refs(self):
        html = mop.unwrap_noscript(FIXTURE_HTML)
        return mop.collect_html_refs(html, "https://example.com/products/page/")

    def _urls(self, refs, kind=None):
        return {r.url for r in refs if kind is None or r.kind == kind}

    def test_stylesheet_collected(self, refs):
        assert "https://example.com/css/app.css" in self._urls(refs, "stylesheet")

    def test_icon_and_preload_font_are_assets(self, refs):
        assets = self._urls(refs, "asset")
        assert "https://example.com/favicon.ico" in assets
        assert "https://example.com/fonts/main.woff2" in assets

    def test_preload_script_is_script_kind(self, refs):
        assert "https://example.com/js/lazy.js" in self._urls(refs, "script")

    def test_script_src_collected_as_script(self, refs):
        assert "https://example.com/js/app.js" in self._urls(refs, "script")

    def test_canonical_not_collected(self, refs):
        assert "https://example.com/products/page/" not in self._urls(refs)

    def test_og_image_collected(self, refs):
        assert "https://example.com/og/cover.jpg" in self._urls(refs, "asset")

    def test_style_block_url_collected(self, refs):
        assert "https://example.com/img/hero.jpg" in self._urls(refs, "asset")

    def test_srcset_protocol_relative_resolved(self, refs):
        assert "https://cdn.example.net/a@2x.png" in self._urls(refs, "asset")

    def test_source_srcset_collected(self, refs):
        assert "https://example.com/img/b.webp" in self._urls(refs, "asset")

    def test_video_src_and_poster(self, refs):
        assets = self._urls(refs, "asset")
        assert "https://example.com/img/poster.jpg" in assets
        assert "https://example.com/media/clip.mp4" in assets

    def test_inline_style_url(self, refs):
        assert "https://example.com/img/inline.png" in self._urls(refs, "asset")

    def test_iframe_recorded_not_asset(self, refs):
        assert "https://www.youtube.com/embed/xyz" in self._urls(refs, "iframe")
        assert "https://www.youtube.com/embed/xyz" not in self._urls(refs, "asset")

    def test_data_uri_not_collected(self, refs):
        assert not any(u.startswith("data:") for u in self._urls(refs))

    def test_anchor_href_not_collected(self, refs):
        assert "https://example.com/about/" not in self._urls(refs)

    def test_noscript_content_collected_after_unwrap(self, refs):
        assert "https://example.com/img/noscript.png" in self._urls(refs, "asset")


# ---------------------------------------------------------------------------
# HTML rewriting
# ---------------------------------------------------------------------------

class TestRewriteHtml:
    def _rewrite(self, html, mapping, **kwargs):
        return mop.rewrite_html(html, "https://example.com/products/page/", mapping, **kwargs)

    def test_src_rewritten(self):
        html = '<img src="/img/a.png">'
        out = self._rewrite(html, {"https://example.com/img/a.png": "assets/h-a.png"})
        assert '<img src="assets/h-a.png">' == out

    def test_srcset_rewritten_with_descriptors(self):
        html = '<img srcset="/img/a.png 1x, /img/b.png 2x">'
        out = self._rewrite(
            html,
            {
                "https://example.com/img/a.png": "assets/h1-a.png",
                "https://example.com/img/b.png": "assets/h2-b.png",
            },
        )
        assert 'srcset="assets/h1-a.png 1x, assets/h2-b.png 2x"' in out

    def test_srcset_partial_mapping_keeps_unmapped(self):
        html = '<img srcset="/img/a.png 1x, /img/b.png 2x">'
        out = self._rewrite(html, {"https://example.com/img/a.png": "assets/h1-a.png"})
        assert "assets/h1-a.png 1x" in out
        assert "/img/b.png 2x" in out

    def test_unmapped_url_untouched(self):
        html = '<img src="/img/missing.png">'
        assert self._rewrite(html, {}) == html

    def test_failed_asset_absolute_fallback(self):
        html = '<img src="/img/blocked.png">'
        out = self._rewrite(html, {"https://example.com/img/blocked.png": "https://example.com/img/blocked.png"})
        assert 'src="https://example.com/img/blocked.png"' in out

    def test_scripts_stripped_by_default(self):
        html = '<p>before</p><script src="/js/app.js"></script><script>var x = "<b>";</script><p>after</p>'
        out = self._rewrite(html, {})
        assert "<script" not in out
        assert "<p>before</p>" in out and "<p>after</p>" in out

    def test_keep_js_preserves_and_rewrites_scripts(self):
        html = '<script src="/js/app.js"></script>'
        out = self._rewrite(html, {"https://example.com/js/app.js": "assets/h-app.js"}, strip_js=False)
        assert '<script src="assets/h-app.js">' in out

    def test_preload_script_link_dropped_when_stripping(self):
        html = '<link rel="preload" href="/js/lazy.js" as="script">'
        assert "<link" not in self._rewrite(html, {})

    def test_stylesheet_link_rewritten(self):
        html = '<link rel="stylesheet" href="/css/app.css">'
        out = self._rewrite(html, {"https://example.com/css/app.css": "assets/h-app.css"})
        assert 'href="assets/h-app.css"' in out

    def test_iframe_neutralised_with_note(self):
        html = '<iframe src="https://www.youtube.com/embed/xyz"></iframe>'
        out = self._rewrite(html, {})
        assert 'src="about:blank"' in out
        assert "iframe not mirrored" in out
        assert "https://www.youtube.com/embed/xyz" in out  # preserved in the comment

    def test_base_tag_removed(self):
        html = '<base href="https://example.com/other/"><img src="/img/a.png">'
        out = self._rewrite(html, {"https://example.com/img/a.png": "assets/h-a.png"})
        assert "<base" not in out
        assert "assets/h-a.png" in out

    def test_inline_style_attr_rewritten(self):
        html = "<div style=\"background: url('/img/x.png')\">t</div>"
        out = self._rewrite(html, {"https://example.com/img/x.png": "assets/h-x.png"})
        assert "assets/h-x.png" in out

    def test_style_block_rewritten(self):
        html = '<style>.a { background: url("/img/hero.jpg"); }</style>'
        out = self._rewrite(html, {"https://example.com/img/hero.jpg": "assets/h-hero.jpg"})
        assert 'url("assets/h-hero.jpg")' in out

    def test_entity_escaped_url_rewritten(self):
        html = '<img src="/img/a.png?x=1&amp;y=2">'
        out = self._rewrite(html, {"https://example.com/img/a.png?x=1&y=2": "assets/h-a.png"})
        assert 'src="assets/h-a.png"' in out

    def test_data_uri_untouched(self):
        html = '<img src="data:image/gif;base64,R0lGOD">'
        assert self._rewrite(html, {}) == html


class TestDataAttributeAssets:
    VIDEO_HTML = (
        '<video data-hero-videos="[{&quot;desktop&quot;:&quot;/videos/hero-desktop.mp4&quot;,'
        '&quot;mobile&quot;:&quot;/videos/hero-mobile.mp4&quot;}]"></video>'
    )

    def test_candidates_collected_from_data_json(self):
        refs = mop.collect_html_refs(self.VIDEO_HTML, "https://example.com/")
        urls = {r.url for r in refs}
        assert "https://example.com/videos/hero-desktop.mp4" in urls
        assert "https://example.com/videos/hero-mobile.mp4" in urls

    def test_lazy_data_src_on_div_collected(self):
        html = '<div data-bg="/img/lazy-bg.jpg">x</div>'
        refs = mop.collect_html_refs(html, "https://example.com/")
        assert "https://example.com/img/lazy-bg.jpg" in {r.url for r in refs}

    def test_data_attr_rewritten_inside_json(self):
        mapping = {"https://example.com/videos/hero-desktop.mp4": "assets/h-hero-desktop.mp4"}
        out = mop.rewrite_html(self.VIDEO_HTML, "https://example.com/", mapping)
        assert "assets/h-hero-desktop.mp4" in out

    def test_video_src_recovered_from_data_attr(self):
        mapping = {
            "https://example.com/videos/hero-desktop.mp4": "assets/h-hero-desktop.mp4",
            "https://example.com/videos/hero-mobile.mp4": "assets/h-hero-mobile.mp4",
        }
        out = mop.rewrite_html(self.VIDEO_HTML, "https://example.com/", mapping)
        assert 'src="assets/h-hero-desktop.mp4"' in out
        assert "autoplay" in out and "muted" in out

    def test_video_with_existing_src_not_modified(self):
        html = '<video src="/v/clip.mp4" data-alt="/v/alt.mp4"></video>'
        mapping = {
            "https://example.com/v/clip.mp4": "assets/h-clip.mp4",
            "https://example.com/v/alt.mp4": "assets/h-alt.mp4",
        }
        out = mop.rewrite_html(html, "https://example.com/", mapping)
        assert 'src="assets/h-clip.mp4"' in out
        assert "data-mirror-note" not in out

    def test_plain_text_data_attr_untouched(self):
        html = '<div data-label="hello world">x</div>'
        assert mop.rewrite_html(html, "https://example.com/", {}) == html


class TestUnwrapNoscript:
    def test_escaped_content_unescaped(self):
        html = '<noscript>&lt;img src="/x.png"&gt;</noscript>'
        assert mop.unwrap_noscript(html) == '<img src="/x.png">'

    def test_literal_content_kept(self):
        html = '<noscript><img src="/x.png"></noscript>'
        assert mop.unwrap_noscript(html) == '<img src="/x.png">'


class TestBaseHref:
    def test_base_href_used(self):
        html = '<head><base href="https://cdn.example.com/app/"></head>'
        assert mop.find_base_href(html, BASE) == "https://cdn.example.com/app/"

    def test_relative_base_resolved(self):
        html = '<base href="/app/">'
        assert mop.find_base_href(html, BASE) == "https://example.com/app/"

    def test_no_base_returns_page_url(self):
        assert mop.find_base_href("<html></html>", BASE) == BASE


# ---------------------------------------------------------------------------
# Manifest generation
# ---------------------------------------------------------------------------

class TestManifest:
    def test_manifest_shape(self):
        records = [
            mop.AssetRecord(url="https://x.com/a.png", local="assets/h-a.png", bytes=10, status="ok"),
            mop.AssetRecord(url="https://x.com/b.css", local="assets/h-b.css", bytes=20, status="cached"),
            mop.AssetRecord(url="https://x.com/c.png", status="failed", error="HTTP 403 Forbidden"),
        ]
        manifest = mop.build_manifest("https://x.com/", "snapshot", records, captured_at="2026-06-11T00:00:00Z")
        assert manifest["original_url"] == "https://x.com/"
        assert manifest["source"] == "snapshot"
        assert manifest["captured_at"] == "2026-06-11T00:00:00Z"
        assert manifest["asset_count"] == 2
        assert manifest["total_bytes"] == 30
        assert manifest["failures"] == [{"url": "https://x.com/c.png", "error": "HTTP 403 Forbidden"}]
        failed = [a for a in manifest["assets"] if a["status"] == "failed"]
        assert failed and failed[0]["error"] == "HTTP 403 Forbidden"

    def test_manifest_json_serialisable(self):
        manifest = mop.build_manifest("https://x.com/", "live", [])
        json.dumps(manifest)


# ---------------------------------------------------------------------------
# End-to-end page mirroring with a stubbed downloader (no network)
# ---------------------------------------------------------------------------

PAGE_HTML = """<!DOCTYPE html><html><head>
<link rel="stylesheet" href="/css/app.css">
<link rel="icon" href="/favicon.ico">
<script src="/js/app.js"></script>
</head><body>
<img src="/img/a.png" srcset="/img/a.png 1x, /img/a@2x.png 2x">
<img src="/img/blocked.png">
<iframe src="https://embed.example.org/widget"></iframe>
</body></html>"""

CSS_TEXT = '@import "base.css";\n.hero { background: url("../img/hero.jpg"); }\n@font-face { src: url(/fonts/f.woff2); }'
BASE_CSS_TEXT = ".base { background: url(deep.png); }"

FAKE_FILES = {
    "https://example.com/css/app.css": (CSS_TEXT.encode(), "text/css"),
    "https://example.com/css/base.css": (BASE_CSS_TEXT.encode(), "text/css"),
    "https://example.com/css/deep.png": (b"deep-png", "image/png"),
    "https://example.com/img/hero.jpg": (b"hero-jpg", "image/jpeg"),
    "https://example.com/fonts/f.woff2": (b"font-bytes", "font/woff2"),
    "https://example.com/favicon.ico": (b"icon-bytes", "image/x-icon"),
    "https://example.com/img/a.png": (b"a-png", "image/png"),
    "https://example.com/img/a@2x.png": (b"a2x-png", "image/png"),
}


def fake_fetch(url, timeout=30.0, user_agent="", retries=2):
    if url == "https://example.com/img/blocked.png":
        raise mop.FetchError("HTTP 403 Forbidden", status=403)
    if url in FAKE_FILES:
        return FAKE_FILES[url]
    raise mop.FetchError("HTTP 404 Not Found", status=404)


@pytest.fixture()
def mirrored(tmp_path):
    snapshot = tmp_path / "homepage-snapshot.html"
    snapshot.write_text(PAGE_HTML, encoding="utf-8")
    spec = mop.PageSpec(slug="homepage", url="https://example.com/", snapshot=snapshot)
    page_dir = tmp_path / "out" / "homepage"
    mirror = mop.PageMirror(spec, page_dir, fetch=fake_fetch, workers=4)
    manifest = mirror.run()
    return page_dir, manifest


class TestPageMirror:
    def test_index_written(self, mirrored):
        page_dir, _ = mirrored
        assert (page_dir / "index.html").is_file()

    def test_assets_downloaded_and_rewritten(self, mirrored):
        page_dir, _ = mirrored
        html = (page_dir / "index.html").read_text()
        assert 'src="assets/' in html
        assert "srcset=" in html and "assets/" in html
        asset_files = list((page_dir / "assets").iterdir())
        names = {p.name for p in asset_files}
        assert any(n.endswith("-a.png") for n in names)
        assert any(n.endswith("-favicon.ico") for n in names)

    def test_css_recursed_one_level(self, mirrored):
        page_dir, _ = mirrored
        names = {p.name for p in (page_dir / "assets").iterdir()}
        assert any(n.endswith("-hero.jpg") for n in names)
        assert any(n.endswith("-f.woff2") for n in names)
        assert any(n.endswith("-base.css") for n in names)
        assert any(n.endswith("-deep.png") for n in names)

    def test_css_rewritten_to_local_names(self, mirrored):
        page_dir, _ = mirrored
        css_files = [p for p in (page_dir / "assets").iterdir() if p.name.endswith("-app.css")]
        assert css_files
        css = css_files[0].read_text()
        assert "../img/hero.jpg" not in css
        assert "-hero.jpg" in css
        assert "-base.css" in css  # @import rewritten

    def test_scripts_stripped(self, mirrored):
        page_dir, _ = mirrored
        html = (page_dir / "index.html").read_text()
        assert "<script" not in html

    def test_failed_asset_absolute_fallback_and_manifest(self, mirrored):
        page_dir, manifest = mirrored
        html = (page_dir / "index.html").read_text()
        assert 'src="https://example.com/img/blocked.png"' in html
        assert {"url": "https://example.com/img/blocked.png", "error": "HTTP 403 Forbidden"} in manifest["failures"]

    def test_iframe_neutralised(self, mirrored):
        page_dir, manifest = mirrored
        html = (page_dir / "index.html").read_text()
        assert 'src="about:blank"' in html
        skipped = [a for a in manifest["assets"] if a["status"] == "skipped"]
        assert skipped and skipped[0]["url"] == "https://embed.example.org/widget"

    def test_manifest_written_with_source_snapshot(self, mirrored):
        page_dir, manifest = mirrored
        on_disk = json.loads((page_dir / "manifest.json").read_text())
        assert on_disk["source"] == "snapshot"
        assert on_disk["original_url"] == "https://example.com/"
        assert on_disk["asset_count"] == manifest["asset_count"] > 0

    def test_cache_reuse_by_basename(self, tmp_path):
        cached_dir = tmp_path / "cache-assets"
        cached_dir.mkdir()
        (cached_dir / "a.png").write_bytes(b"cached-a-png")
        snapshot = tmp_path / "p-snapshot.html"
        snapshot.write_text('<html><body><img src="/img/a.png"></body></html>')
        spec = mop.PageSpec(slug="p", url="https://example.com/", snapshot=snapshot)
        page_dir = tmp_path / "out" / "p"

        def never_fetch(url, **kwargs):
            raise AssertionError(f"network fetch attempted for {url}")

        mirror = mop.PageMirror(
            spec, page_dir, fetch=never_fetch, cache_index={"a.png": cached_dir / "a.png"}
        )
        manifest = mirror.run()
        assert manifest["failures"] == []
        record = next(a for a in manifest["assets"] if a["url"].endswith("a.png"))
        assert record["status"] == "cached"


# ---------------------------------------------------------------------------
# Stale hashed-asset recovery
# ---------------------------------------------------------------------------

class TestStaleAssetRecovery:
    def test_hashed_stem_key_astro_style(self):
        key = mop.hashed_stem_key("https://x.com/_astro/careers.DQTxzWRW.css")
        assert key == ("https://x.com/_astro/", "careers", "css")

    def test_hashed_stem_key_digit_hash(self):
        assert mop.hashed_stem_key("https://x.com/a/img.Ct3v3lS4.png") is not None

    def test_plain_word_token_rejected(self):
        assert mop.hashed_stem_key("https://x.com/css/styles.legacy.css") is None

    def test_no_hash_segment_rejected(self):
        assert mop.hashed_stem_key("https://x.com/css/app.css") is None

    def test_find_replacement_same_logical_name(self):
        failed = "https://x.com/_astro/careers.DQTxzWRW.css"
        candidates = [
            "https://x.com/_astro/other.A1b2C3d4.css",
            "https://x.com/_astro/careers.D2NuDRMw.css",
        ]
        assert mop.find_stale_replacement(failed, candidates) == "https://x.com/_astro/careers.D2NuDRMw.css"

    def test_find_replacement_ignores_identical_url(self):
        failed = "https://x.com/_astro/careers.DQTxzWRW.css"
        assert mop.find_stale_replacement(failed, [failed]) is None

    def test_find_replacement_requires_same_directory(self):
        failed = "https://x.com/_astro/careers.DQTxzWRW.css"
        candidates = ["https://x.com/other/careers.D2NuDRMw.css"]
        assert mop.find_stale_replacement(failed, candidates) is None

    def test_mirror_recovers_stale_stylesheet(self, tmp_path, capsys):
        snapshot = tmp_path / "p-snapshot.html"
        snapshot.write_text(
            '<html><head><link rel="stylesheet" href="/_astro/main.OldHash1.css"></head><body>x</body></html>'
        )
        live_html = '<html><head><link rel="stylesheet" href="/_astro/main.NewHash2.css"></head></html>'

        def fetch(url, timeout=30.0, user_agent="", retries=2):
            if url == "https://example.com/":
                return live_html.encode(), "text/html"
            if url == "https://example.com/_astro/main.NewHash2.css":
                return b".live { color: red; }", "text/css"
            raise mop.FetchError("HTTP 404 Not Found", status=404)

        spec = mop.PageSpec(slug="p", url="https://example.com/", snapshot=snapshot)
        page_dir = tmp_path / "out"
        manifest = mop.PageMirror(spec, page_dir, fetch=fetch).run()
        assert manifest["failures"] == []
        record = next(a for a in manifest["assets"] if "OldHash1" in a["url"])
        assert record["status"] == "ok"
        assert record["recovered_from"] == "https://example.com/_astro/main.NewHash2.css"
        assert "recovered stale asset" in capsys.readouterr().out
        css_files = [p for p in (page_dir / "assets").iterdir() if p.name.endswith(".css")]
        assert css_files and css_files[0].read_text() == ".live { color: red; }"
        html = (page_dir / "index.html").read_text()
        assert 'href="assets/' in html


# ---------------------------------------------------------------------------
# Page spec parsing
# ---------------------------------------------------------------------------

class TestPagesPayload:
    def test_dict_form(self):
        raw = {"homepage": {"original_url": "https://x.com/"}, "about": {"original_url": "https://x.com/about/"}}
        assert mop._parse_pages_payload(raw) == [("homepage", "https://x.com/"), ("about", "https://x.com/about/")]

    def test_list_form(self):
        raw = [{"slug": "home", "url": "https://x.com/"}]
        assert mop._parse_pages_payload(raw) == [("homepage", "https://x.com/")]

    def test_entries_without_url_skipped(self):
        assert mop._parse_pages_payload({"a": {}}) == []

    def test_unsupported_type_raises(self):
        with pytest.raises(ValueError):
            mop._parse_pages_payload("nope")


class TestPageUrlFromSnapshot:
    def test_canonical_link(self):
        html = '<link rel="canonical" href="https://x.com/page/">'
        assert mop._page_url_from_snapshot(html) == "https://x.com/page/"

    def test_og_url_meta(self):
        html = '<meta property="og:url" content="https://x.com/og/">'
        assert mop._page_url_from_snapshot(html) == "https://x.com/og/"

    def test_none_when_absent(self):
        assert mop._page_url_from_snapshot("<html></html>") is None
