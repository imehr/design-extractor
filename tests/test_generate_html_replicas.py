"""Unit tests for generate_html_replicas.py (standalone token-styled HTML replicas)."""

import base64
import importlib.util
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

import pytest

SCRIPTS = Path("/Users/mehran/Documents/github/design-extractor/scripts")

# 1x1 transparent PNG.
PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
    "YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
)

SLUG = "example-brand-test"


def _load_module(name: str, path: Path):
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    # Register so dataclass annotation resolution works on Python 3.13+.
    sys.modules[name] = module
    try:
        spec.loader.exec_module(module)
    finally:
        try:
            sys.path.remove(str(path.parent))
        except ValueError:
            pass
    return module


@pytest.fixture(scope="module")
def mod():
    return _load_module("generate_html_replicas", SCRIPTS / "generate_html_replicas.py")


SNAPSHOT_HOMEPAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<title>Example Brand — Home</title>
<meta name="description" content="meta to strip">
<link rel="stylesheet" href="/_astro/site.ABC123.css">
<script src="/analytics.js"></script>
<script>window.dataLayer = [];</script>
</head>
<body class="framework-body" data-reactroot="">
<!-- tracking comment -->
<header class="site-header">
  <a href="/" class="logo-link"><img src="/images/logo.svg" alt="Example Brand"></a>
  <nav>
    <ul>
      <li><a href="/about/" onclick="track()">About us</a></li>
      <li><a href="https://example-brand.test/about/">Company</a></li>
      <li><a href="https://external.example.org/pricing">External pricing</a></li>
      <li><a href="mailto:hello@example-brand.test">Email us</a></li>
    </ul>
  </nav>
</header>
<main>
  <section class="hero" style="background-image:url('/images/hero.png');height:600px">
    <h1>Physics at the speed of thought</h1>
    <p>Real extracted hero copy that must survive the transform.</p>
    <a class="btn btn-primary" href="/about/">Get started</a>
  </section>
  <div class="xl:hidden mobile-menu"><a href="/about/">Mobile menu duplicate</a></div>
  <div class="hidden">Permanently hidden block</div>
  <div aria-hidden="true"><p>Marquee clone copy</p></div>
  <div class="hidden items-center xl:flex">Desktop-only nav row</div>
  <section>
    <h2>Capabilities</h2>
    <ul>
      <li><img src="/images/hero.png" alt="Card one"><h3>Card one</h3></li>
      <li><img src="/missing/nowhere.png" alt="Card two"><h3>Card two</h3></li>
      <li><h3>Card three</h3></li>
    </ul>
  </section>
  <iframe src="https://www.youtube.com/embed/xyz"></iframe>
</main>
<footer><p>Copyright Example Brand</p></footer>
<script type="application/ld+json">{"@type":"Organization"}</script>
</body>
</html>
"""

SNAPSHOT_ABOUT = """<!DOCTYPE html>
<html><head><title>Example Brand — About</title></head>
<body><header><nav><a href="/">Home</a></nav></header>
<main><section><h1>About the company</h1><p>About copy.</p></section></main>
</body></html>
"""

DTCG_TOKENS = {
    "$schema": "https://design-tokens.org/schema",
    "color": {
        "$type": "group",
        "bg": {"$value": "#ffffff", "$type": "color"},
        "text": {"$value": "#11161c", "$type": "color"},
        "primary": {"$value": "#ff4400", "$type": "color"},
        "footer-bg": {"$value": "#0a0c10", "$type": "color"},
    },
    "typography": {
        "families": [
            {"role": "heading", "value": "\"Test Sans\", sans-serif", "count": 50},
            {"role": "body", "value": "\"Test Sans\", sans-serif", "count": 90},
        ],
        "sizes": [{"value": "72px", "count": 5}, {"value": "32px", "count": 9}],
        "weights": [{"value": "400", "count": 10}, {"value": "700", "count": 4}],
    },
    "spacing": {"scale": ["4px", "8px", "16px", "24px", "40px"], "max_width": "1200px"},
    "borders": {"radii": [{"value": "8px", "count": 4}, {"value": "9999px", "count": 2}]},
    "shadows": [{"value": "0 4px 12px rgba(10, 12, 16, 0.2)"}],
}

DOM_JSON_PAGE = {
    "url": "https://json-only.test/",
    "title": "JSON Only Brand",
    "styles": {
        "bodyBg": "rgb(250, 250, 248)",
        "bodyColor": "rgb(20, 20, 20)",
        "h1Font": "Archivo",
        "h1Size": "56px",
    },
    "fonts": [{"family": "Archivo", "type": "heading"}],
    "header": {
        "logo": {"type": "img", "src": "https://json-only.test/images/logo.svg", "alt": "JSON Only"},
        "navLinks": [{"text": "Docs", "href": "https://json-only.test/docs"}],
    },
    "sections": [
        {
            "tag": "div",
            "sectionType": "hero",
            "heading": "Structured extraction hero",
            "text": "Hero body text from extraction.",
            "images": [{"src": "https://json-only.test/images/hero.png", "alt": "Hero shot"}],
            "backgroundImages": [],
        }
    ],
    "headings": [
        {"level": "H1", "text": "Structured extraction hero"},
        {"level": "H2", "text": "Secondary extracted heading"},
    ],
    "links": [],
    "allImages": [{"src": "https://json-only.test/images/hero.png", "loc": {"top": 0}}],
    "allBackgroundImages": [],
    "footer": {
        "text": "JSON Only footer text",
        "links": [{"text": "Privacy", "href": "https://json-only.test/privacy"}],
    },
}


@pytest.fixture()
def repo_root(tmp_path):
    """Fixture repo with snapshot pages, assets, and DTCG tokens for SLUG."""
    root = tmp_path / "repo"
    dom = root / "cache" / SLUG / "dom-extraction"
    dom.mkdir(parents=True)
    (dom / "homepage-snapshot.html").write_text(SNAPSHOT_HOMEPAGE, encoding="utf-8")
    (dom / "about-snapshot.html").write_text(SNAPSHOT_ABOUT, encoding="utf-8")
    (dom / "html-snapshots-manifest.json").write_text(json.dumps({
        "brand": SLUG,
        "files": [
            {"slug": "homepage", "url": "https://example-brand.test/", "status": "written"},
            {"slug": "about", "url": "https://example-brand.test/about/", "status": "written"},
        ],
    }), encoding="utf-8")

    assets = root / "cache" / SLUG / "assets"
    (assets / "fonts").mkdir(parents=True)
    (assets / "hero.png").write_bytes(PNG_BYTES)
    (assets / "logo.svg").write_text("<svg xmlns='http://www.w3.org/2000/svg'/>")
    (assets / "fonts" / "TestSans-Regular.woff2").write_bytes(b"\x77\x4f\x46\x32fake")
    (assets / "fonts" / "TestSans-Bold.woff2").write_bytes(b"\x77\x4f\x46\x32fake")

    brand_dir = root / "brands" / SLUG
    brand_dir.mkdir(parents=True)
    (brand_dir / "design-tokens.json").write_text(json.dumps(DTCG_TOKENS), encoding="utf-8")
    return root


@pytest.fixture()
def library_root(tmp_path):
    root = tmp_path / "library"
    root.mkdir()
    return root


@pytest.fixture()
def generated(mod, repo_root, library_root):
    manifest = mod.generate_for_slug(SLUG, repo_root=repo_root, library_root=library_root)
    out_dir = repo_root / "brands" / SLUG / "replica-html"
    return manifest, out_dir


# -- CLI -------------------------------------------------------------------------

def test_cli_help():
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "generate_html_replicas.py"), "--help"],
        capture_output=True, text=True, timeout=15,
    )
    assert result.returncode == 0
    assert "--slug" in result.stdout
    assert "--verify" in result.stdout


# -- Page discovery ----------------------------------------------------------------

def test_discover_pages_finds_snapshots(mod, repo_root, library_root):
    pages = mod.discover_pages(SLUG, repo_root, library_root)
    slugs = [p.page_slug for p in pages]
    assert slugs == ["homepage", "about"]
    assert pages[0].snapshot_path is not None
    assert pages[0].url == "https://example-brand.test/"


def test_discover_pages_skips_fragment_jsons(mod, tmp_path):
    root = tmp_path / "repo"
    dom = root / "cache" / "frag" / "dom-extraction"
    dom.mkdir(parents=True)
    page = {"url": "https://frag.test/", "title": "Frag", "sections": []}
    (dom / "index.json").write_text(json.dumps(page))
    (dom / "frag-sections.json").write_text(json.dumps(page))
    (dom / "frag-full.json").write_text(json.dumps(page))
    (dom / "index-measurements.json").write_text(json.dumps(page))
    pages = mod.discover_pages("frag", root, tmp_path / "library")
    assert [p.page_slug for p in pages] == ["homepage"]


# -- Structure preservation ----------------------------------------------------------

def test_structure_and_content_preserved(generated):
    manifest, out_dir = generated
    assert manifest["pages"] == ["homepage", "about"]
    html = (out_dir / "homepage.html").read_text(encoding="utf-8")
    assert "Physics at the speed of thought" in html
    assert "Real extracted hero copy that must survive the transform." in html
    assert "Capabilities" in html
    assert "Card three" in html
    assert "Copyright Example Brand" in html
    assert "<title>Example Brand — Home</title>" in html
    # Structural roles tagged during transform
    assert 'data-role="header"' in html
    assert 'data-role="hero"' in html
    assert 'data-role="footer"' in html
    assert 'data-role="card-list"' in html


def test_scripts_styles_and_embeds_stripped(generated):
    _, out_dir = generated
    html = (out_dir / "homepage.html").read_text(encoding="utf-8")
    assert "<script" not in html
    assert "<iframe" not in html
    assert "stylesheet" not in html
    assert "analytics.js" not in html
    assert "dataLayer" not in html
    assert "tracking comment" not in html
    assert "onclick" not in html
    assert "data-reactroot" not in html
    assert 'class="framework-body"' not in html
    # Exactly one style block: the generated token stylesheet.
    assert html.count("<style") == 1


# -- Link rewriting ------------------------------------------------------------------

def test_links_rewritten_to_local_or_hash(generated):
    _, out_dir = generated
    html = (out_dir / "homepage.html").read_text(encoding="utf-8")
    assert 'href="about.html"' in html            # sibling replica page
    assert "https://external.example.org" not in html  # external link neutralised
    assert 'href="mailto:hello@example-brand.test"' in html
    assert 'href="#"' in html


def test_desktop_hidden_variants_removed(generated):
    """Responsive duplicates hidden at desktop width must not render."""
    _, out_dir = generated
    html = (out_dir / "homepage.html").read_text(encoding="utf-8")
    assert "Mobile menu duplicate" not in html       # xl:hidden
    assert "Permanently hidden block" not in html    # bare `hidden`
    assert "Marquee clone copy" not in html          # aria-hidden="true"
    assert "Desktop-only nav row" in html            # hidden + xl:flex re-show


def test_button_role_detected_from_classes(generated):
    _, out_dir = generated
    html = (out_dir / "homepage.html").read_text(encoding="utf-8")
    assert re.search(r'<a[^>]*data-role="button"[^>]*>Get started</a>', html)


# -- Asset handling ------------------------------------------------------------------

def test_asset_refs_rewritten_to_local_copies(generated):
    manifest, out_dir = generated
    html = (out_dir / "homepage.html").read_text(encoding="utf-8")
    assert 'src="assets/hero.png"' in html
    assert 'src="assets/logo.svg"' in html
    assert (out_dir / "assets" / "hero.png").read_bytes() == PNG_BYTES
    # Unresolvable images are dropped, never hotlinked or fabricated.
    assert "nowhere.png" not in html
    assert any("nowhere.png" in m for m in manifest["missing_assets"])
    # Background-image from inline style resolved to a local asset.
    assert "background-image:url('assets/hero.png')" in html
    assert "http" not in re.sub(r"<!--.*?-->", "", html.split("</style>")[1])


def test_font_faces_generated_for_matching_downloads(generated):
    _, out_dir = generated
    html = (out_dir / "homepage.html").read_text(encoding="utf-8")
    assert "@font-face" in html
    assert "font-family:'Test Sans'" in html
    assert "url('assets/fonts/TestSans-Regular.woff2')" in html
    assert (out_dir / "assets" / "fonts" / "TestSans-Regular.woff2").exists()
    # Weight inferred from filename.
    assert "font-weight:700" in html


# -- Token-driven CSS -----------------------------------------------------------------

def _style_block(html: str) -> str:
    match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
    assert match, "generated page must embed one style block"
    return match.group(1)


def test_css_vars_from_tokens(generated):
    _, out_dir = generated
    css = _style_block((out_dir / "homepage.html").read_text(encoding="utf-8"))
    assert "--color-bg:#ffffff" in css
    assert "--color-primary:#ff4400" in css
    assert "--font-heading" in css
    assert "--space-1:4px" in css
    assert "--radius-pill:9999px" in css
    assert "--shadow-1:0 4px 12px rgba(10, 12, 16, 0.2)" in css


def test_no_hardcoded_hex_outside_root_block(generated):
    _, out_dir = generated
    for page in ("homepage.html", "about.html"):
        css = _style_block((out_dir / page).read_text(encoding="utf-8"))
        root_match = re.match(r"\s*:root\{[^}]*\}", css)
        assert root_match, ":root token block must lead the stylesheet"
        rest = css[root_match.end():]
        assert not re.search(r"#[0-9a-fA-F]{3,8}\b", rest), \
            f"hardcoded hex colour outside :root in {page}"
        assert "var(--color-" in rest


# -- Output parses with stdlib html.parser --------------------------------------------

class _Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.h1_text = ""
        self._in_h1 = False

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        if tag == "h1":
            self._in_h1 = True

    def handle_endtag(self, tag):
        if tag == "h1":
            self._in_h1 = False

    def handle_data(self, data):
        if self._in_h1:
            self.h1_text += data


def test_output_parses_with_html_parser(generated):
    _, out_dir = generated
    parser = _Collector()
    parser.feed((out_dir / "homepage.html").read_text(encoding="utf-8"))
    parser.close()
    for required in ("html", "head", "body", "header", "nav", "section", "footer", "h1"):
        assert required in parser.tags, f"missing <{required}> in output"
    assert "Physics at the speed of thought" in parser.h1_text


# -- Structured-JSON fallback (no snapshot, no token file) -----------------------------

def test_dom_json_fallback_derives_tokens_and_preserves_content(mod, tmp_path):
    root = tmp_path / "repo"
    slug = "json-only-test"
    dom = root / "cache" / slug / "dom-extraction"
    dom.mkdir(parents=True)
    (dom / "index.json").write_text(json.dumps(DOM_JSON_PAGE), encoding="utf-8")
    assets = root / "cache" / slug / "assets"
    assets.mkdir(parents=True)
    (assets / "hero.png").write_bytes(PNG_BYTES)
    (assets / "logo.svg").write_text("<svg xmlns='http://www.w3.org/2000/svg'/>")

    manifest = mod.generate_for_slug(slug, repo_root=root, library_root=tmp_path / "library")
    assert manifest["pages"] == ["homepage"]
    assert manifest["token_source"] == "derived-from-extraction"
    assert any("derived a minimal token set" in w for w in manifest["warnings"])

    html = (root / "brands" / slug / "replica-html" / "homepage.html").read_text(encoding="utf-8")
    assert "<h1>Structured extraction hero</h1>" in html
    assert "Hero body text from extraction." in html
    assert "Secondary extracted heading" in html
    assert "JSON Only footer text" in html
    assert 'src="assets/hero.png"' in html
    assert 'src="assets/logo.svg"' in html
    # Derived tokens trace to extracted styles, not invented values.
    css = _style_block(html)
    assert "--color-bg:rgb(250, 250, 248)" in css
    assert "--font-size-h1:56px" in css


# -- Compare view ---------------------------------------------------------------------

def test_compare_view_generated(generated):
    _, out_dir = generated
    html = (out_dir / "compare.html").read_text(encoding="utf-8")
    assert '<option value="homepage">' in html
    assert '<option value="about">' in html
    assert 'id="frame-original"' in html
    assert 'id="frame-replica"' in html
    assert 'id="sync-scroll"' in html
    assert "mirror not yet generated" in html
    assert "../original/" in html
    # Swatch strip references token vars, no emoji anywhere.
    assert "var(--color-" in html
    assert not re.search(r"[\U0001F300-\U0001FAFF☀-➿]", html)


def test_manifest_written(generated):
    manifest, out_dir = generated
    on_disk = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
    assert on_disk["slug"] == SLUG
    assert on_disk["pages"] == manifest["pages"]
    assert "token_source" in on_disk
    assert isinstance(on_disk["missing_assets"], list)


# -- No fabricated content -------------------------------------------------------------

def test_unknown_slug_fails_loudly(mod, tmp_path):
    with pytest.raises(SystemExit) as excinfo:
        mod.generate_for_slug("no-such-brand", repo_root=tmp_path / "repo",
                              library_root=tmp_path / "library")
    assert "no cached DOM data" in str(excinfo.value)
