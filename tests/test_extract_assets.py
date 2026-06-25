"""Tests for stylesheet-chain (Google Fonts + @import) resolution (WS2, Task 2.6).

The resolution logic is extracted into a pure, injectable function so it can be
unit-tested without a network or browser: callers pass a ``fetcher(url)``
callable that returns the resource content (or None on failure).
"""

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


WOFF2 = "https://fonts.gstatic.com/s/inter/v12/UcC73.woff2"
GOOGLE_CSS = (
    "/* cyrillic */\n"
    "@font-face {\n"
    "  font-family: 'Inter';\n"
    "  font-style: normal;\n"
    "  src: url(%s) format('woff2');\n"
    "}\n" % WOFF2
)


def test_resolve_google_fonts_chain_fetches_css_and_woff2():
    eb = load_module("extract_brand")
    fetched: list[str] = []

    def fetcher(url):
        fetched.append(url)
        if "fonts.googleapis.com" in url:
            return GOOGLE_CSS
        if url == WOFF2:
            return b"WOFF2BIN"
        return None

    href = "https://fonts.googleapis.com/css2?family=Inter"
    manifest = eb.resolve_stylesheet_chain(href, fetcher)

    assert href in fetched, f"CSS not fetched: {fetched}"
    assert WOFF2 in fetched, f"woff2 not fetched: {fetched}"
    assert any(s["href"] == href for s in manifest["stylesheets"])
    assert len(manifest["fonts"]) == 1, manifest["fonts"]
    assert manifest["fonts"][0]["url"] == WOFF2


def test_resolve_follows_import_chain():
    eb = load_module("extract_brand")
    css_map = {
        "https://host/a.css": '@import url("https://host/b.css");',
        "https://host/b.css": '@import url("https://host/c.css");',
        "https://host/c.css": "@font-face{font-family:X;src:url(https://host/y.woff2)}",
        "https://host/y.woff2": b"WOFF2BIN",
    }
    fetched: list[str] = []

    def fetcher(url):
        fetched.append(url)
        return css_map.get(url)

    manifest = eb.resolve_stylesheet_chain("https://host/a.css", fetcher, max_depth=3)
    assert "https://host/a.css" in fetched
    assert "https://host/b.css" in fetched
    assert "https://host/c.css" in fetched
    assert any(f["url"] == "https://host/y.woff2" for f in manifest["fonts"])


def test_resolve_depth_limit_stops_deep_chains():
    eb = load_module("extract_brand")
    css_map = {
        "https://host/a.css": '@import url("https://host/b.css");',
        "https://host/b.css": '@import url("https://host/c.css");',
        "https://host/c.css": '@import url("https://host/d.css");',
        "https://host/d.css": '@import url("https://host/e.css");',
        "https://host/e.css": "@font-face{font-family:X;src:url(https://host/z.woff2)}",
    }
    fetched: list[str] = []

    def fetcher(url):
        fetched.append(url)
        return css_map.get(url)

    # max_depth=3 → a(0) b(1) c(2) d(3) fetched; e(4) beyond the limit, not fetched.
    eb.resolve_stylesheet_chain("https://host/a.css", fetcher, max_depth=3)
    assert "https://host/d.css" in fetched
    assert "https://host/e.css" not in fetched, f"e.css should be beyond depth limit: {fetched}"


def test_resolve_handles_fetch_failure_and_data_urIs():
    eb = load_module("extract_brand")
    manifest = eb.resolve_stylesheet_chain("https://x/a.css", lambda url: None)
    assert manifest["stylesheets"] == []
    assert manifest["fonts"] == []

    # data: URLs inside src() must be skipped (no fetch attempted).
    css = "@font-face{font-family:X;src:url(data:font/woff2;base64,AAAA)}"
    calls: list[str] = []
    eb.resolve_stylesheet_chain("https://x/a.css", lambda url: (calls.append(url) or css))
    assert calls == ["https://x/a.css"]


def test_resolve_dedupes_cyclic_imports():
    eb = load_module("extract_brand")
    css_map = {
        "https://host/a.css": '@import url("https://host/b.css");',
        "https://host/b.css": '@import url("https://host/a.css");',  # cycle back
    }
    fetched: list[str] = []

    def fetcher(url):
        fetched.append(url)
        return css_map.get(url)

    eb.resolve_stylesheet_chain("https://host/a.css", fetcher)
    # Each stylesheet fetched exactly once despite the cycle.
    assert fetched.count("https://host/a.css") == 1
    assert fetched.count("https://host/b.css") == 1
