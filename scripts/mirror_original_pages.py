#!/usr/bin/env python3
"""Mirror original brand pages into 100% local offline copies.

For each key page of a brand this script produces:

    brands/<slug>/original/<page-slug>/index.html
    brands/<slug>/original/<page-slug>/assets/<hash>-<name>
    brands/<slug>/original/<page-slug>/manifest.json
    brands/<slug>/original/<page-slug>/verify.png   (with --verify)

Page HTML comes from the rendered DOM snapshot captured during extraction
(<page>-snapshot.html) when available, otherwise from a live fetch with a
browser User-Agent. Every external reference (stylesheets, images, fonts,
icons, media, manifests, CSS url(...) one level deep) is downloaded and
rewritten to a relative local path. Scripts are stripped by default so the
mirror is static and safe; iframes are neutralised with a placeholder note.

Failures are never silent: each page manifest records every asset with its
status, and failures are printed as warnings. Failed assets keep their
original absolute URL in the HTML so the page still works online.

Supersedes scripts/export_html_snapshots.py (raw HTML only, no assets).

Usage:
    python3 scripts/mirror_original_pages.py --slug luminary-ai --verify
"""

from __future__ import annotations

import argparse
import concurrent.futures
import email.message
import hashlib
import html as html_lib
import json
import mimetypes
import posixpath
import re
import shutil
import ssl
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# Schemes that must never be downloaded or rewritten. data: URIs stay inline.
SKIP_SCHEME_RE = re.compile(r"^(data|blob|javascript|mailto|tel|about|chrome|file):", re.IGNORECASE)

MAX_FILENAME_LEN = 80
HASH_PREFIX_LEN = 10
PER_HOST_LIMIT = 4


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def resolve_url(base_url: str, raw: str) -> Optional[str]:
    """Resolve a raw reference against the page/CSS URL.

    Returns an absolute http(s) URL, or None when the reference should be
    left untouched (data: URIs, fragments, unsupported schemes, empties).
    Protocol-relative URLs (//host/path) inherit the base scheme.
    """
    value = (raw or "").strip()
    if not value or value.startswith("#"):
        return None
    if SKIP_SCHEME_RE.match(value):
        return None
    resolved = urllib.parse.urljoin(base_url, value)
    parsed = urllib.parse.urlsplit(resolved)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    # Drop fragments: they are meaningless for downloaded assets.
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))


def parse_srcset(value: str) -> list[tuple[str, str]]:
    """Parse a srcset attribute into (url, descriptor) pairs.

    Assumption: candidate URLs do not contain commas. Commas only appear as
    candidate separators (true for all real-world srcsets we have seen;
    data: URIs, which may contain commas, are skipped at resolve time).
    """
    pairs: list[tuple[str, str]] = []
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        tokens = part.split(None, 1)
        url = tokens[0]
        descriptor = tokens[1].strip() if len(tokens) > 1 else ""
        pairs.append((url, descriptor))
    return pairs


def serialize_srcset(pairs: list[tuple[str, str]]) -> str:
    chunks = []
    for url, descriptor in pairs:
        chunks.append(f"{url} {descriptor}".strip())
    return ", ".join(chunks)


def local_asset_name(url: str, content: bytes, content_type: str = "") -> str:
    """Content-hash-prefixed safe filename for a downloaded asset.

    Query strings participate via the content hash (different content for
    different query strings yields different names); the visible basename
    comes from the URL path only.
    """
    digest = hashlib.sha256(content).hexdigest()[:HASH_PREFIX_LEN]
    path = urllib.parse.urlsplit(url).path
    base = posixpath.basename(urllib.parse.unquote(path)) or "asset"
    base = re.sub(r"[^A-Za-z0-9._-]+", "-", base).strip("-.") or "asset"
    if "." not in base and content_type:
        ext = mimetypes.guess_extension(content_type.split(";")[0].strip()) or ""
        base += ext
    if len(base) > MAX_FILENAME_LEN:
        stem, dot, ext = base.rpartition(".")
        if dot:
            base = stem[: MAX_FILENAME_LEN - len(ext) - 1] + "." + ext
        else:
            base = base[:MAX_FILENAME_LEN]
    return f"{digest}-{base}"


# ---------------------------------------------------------------------------
# CSS parsing and rewriting
# ---------------------------------------------------------------------------

# url(...) with optional quotes and backslash escapes inside quoted strings.
CSS_URL_RE = re.compile(
    r"url\(\s*(?:\"((?:[^\"\\]|\\.)*)\"|'((?:[^'\\]|\\.)*)'|([^)\"'\s]*))\s*\)",
    re.IGNORECASE,
)
# @import "..." / @import '...'  (the url(...) form is caught by CSS_URL_RE).
CSS_IMPORT_RE = re.compile(
    r"@import\s+(?:\"((?:[^\"\\]|\\.)*)\"|'((?:[^'\\]|\\.)*)')",
    re.IGNORECASE,
)


def _css_unescape(value: str) -> str:
    """Undo simple backslash escapes in CSS strings.

    Assumption: hex escapes (\\2f ) are vanishingly rare in asset URLs;
    only character escapes (\\" \\' \\)) are handled.
    """
    return re.sub(r"\\(.)", r"\1", value)


def collect_css_refs(css_text: str) -> list[tuple[str, bool]]:
    """Return (raw_url, is_import) pairs referenced by a stylesheet."""
    refs: list[tuple[str, bool]] = []
    seen: set[str] = set()
    import_spans: list[tuple[int, int]] = []
    for match in CSS_IMPORT_RE.finditer(css_text):
        raw = _css_unescape(match.group(1) or match.group(2) or "").strip()
        import_spans.append(match.span())
        if raw and raw not in seen:
            seen.add(raw)
            refs.append((raw, True))
    for match in CSS_URL_RE.finditer(css_text):
        raw = _css_unescape(match.group(1) or match.group(2) or match.group(3) or "").strip()
        if not raw or raw in seen:
            continue
        seen.add(raw)
        # url(...) directly preceded by @import is an import, not an asset.
        prefix = css_text[max(0, match.start() - 16) : match.start()]
        is_import = bool(re.search(r"@import\s*$", prefix, re.IGNORECASE))
        refs.append((raw, is_import))
    return refs


def rewrite_css(css_text: str, replace: Callable[[str], Optional[str]]) -> str:
    """Rewrite url(...) and @import refs; replace() returns the new URL or None."""

    def _sub_url(match: re.Match[str]) -> str:
        raw = _css_unescape(match.group(1) or match.group(2) or match.group(3) or "").strip()
        new = replace(raw) if raw else None
        if new is None:
            return match.group(0)
        return f'url("{new}")'

    def _sub_import(match: re.Match[str]) -> str:
        raw = _css_unescape(match.group(1) or match.group(2) or "").strip()
        new = replace(raw) if raw else None
        if new is None:
            return match.group(0)
        return f'@import "{new}"'

    css_text = CSS_IMPORT_RE.sub(_sub_import, css_text)
    return CSS_URL_RE.sub(_sub_url, css_text)


# ---------------------------------------------------------------------------
# HTML parsing and rewriting
# ---------------------------------------------------------------------------

# Quote-aware open-tag matcher: the body alternates quoted strings and
# non-'>' runs, so '>' inside quoted attribute values does not end the tag.
TAG_RE = re.compile(r"<([a-zA-Z][a-zA-Z0-9-]*)((?:\"[^\"]*\"|'[^']*'|[^>\"'])*)(/?)>")
ATTR_RE = re.compile(
    r"([a-zA-Z_:@][-a-zA-Z0-9_:.]*)\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s\"'>]+)"
)
STYLE_BLOCK_RE = re.compile(r"(<style\b[^>]*>)(.*?)(</style\s*>)", re.IGNORECASE | re.DOTALL)
SCRIPT_BLOCK_RE = re.compile(r"<script\b(?:\"[^\"]*\"|'[^']*'|[^>\"'])*>.*?</script\s*>", re.IGNORECASE | re.DOTALL)
NOSCRIPT_BLOCK_RE = re.compile(r"<noscript\b[^>]*>(.*?)</noscript\s*>", re.IGNORECASE | re.DOTALL)

# Attribute names that can carry URLs, per tag.
URL_ATTRS: dict[str, tuple[str, ...]] = {
    "link": ("href",),
    "script": ("src",),
    "img": ("src", "srcset", "data-src", "data-srcset"),
    "source": ("src", "srcset"),
    "video": ("src", "poster"),
    "audio": ("src",),
    "iframe": ("src",),
    "meta": ("content",),
}
SRCSET_ATTRS = {"srcset", "data-srcset"}
# Asset-looking substrings inside data-* attributes (lazy-load configs,
# JSON video manifests, etc.). Backslash excluded: JSON \/ escapes are not
# handled (assumption: real-world payloads use plain slashes).
DATA_URL_CANDIDATE_RE = re.compile(
    r"[^\s\"'<>\\,\[\]{}]+\.(?:mp4|webm|m4v|jpe?g|png|gif|webp|avif|svg|woff2?|ttf|otf|ico)"
    r"(?:\?[^\s\"'<>\\,\[\]{}]*)?",
    re.IGNORECASE,
)
VIDEO_EXT_RE = re.compile(r"\.(?:mp4|webm|m4v)(?:\?|$)", re.IGNORECASE)
# link rel values treated as downloadable assets.
ASSET_LINK_RELS = {"icon", "shortcut", "apple-touch-icon", "mask-icon", "manifest"}
META_IMAGE_KEYS = {"og:image", "og:image:url", "og:image:secure_url", "twitter:image"}


@dataclass(frozen=True)
class Ref:
    url: str
    kind: str  # "stylesheet" | "asset" | "script" | "iframe"


def _parse_attrs(tag_body: str) -> dict[str, str]:
    """Lowercased attr-name -> unescaped value (first occurrence wins)."""
    attrs: dict[str, str] = {}
    for match in ATTR_RE.finditer(tag_body):
        name = match.group(1).lower()
        value = match.group(2)
        if value[:1] in ("\"", "'"):
            value = value[1:-1]
        if name not in attrs:
            attrs[name] = html_lib.unescape(value)
    return attrs


def _link_kind(attrs: dict[str, str]) -> Optional[str]:
    """Classify a <link> tag: stylesheet, asset, script, or None (ignore)."""
    rels = set((attrs.get("rel") or "").lower().split())
    if "stylesheet" in rels:
        return "stylesheet"
    if rels & ASSET_LINK_RELS:
        return "asset"
    if "modulepreload" in rels:
        return "script"
    if "preload" in rels:
        as_value = (attrs.get("as") or "").lower()
        if as_value == "style":
            return "stylesheet"
        if as_value == "script":
            return "script"
        if as_value in ("font", "image", "fetch", "audio", "video", ""):
            return "asset"
    # preconnect / dns-prefetch / canonical / alternate: leave untouched.
    return None


def find_base_href(html_text: str, page_url: str) -> str:
    """Effective base URL: <base href> resolved against the page URL, if any."""
    for match in TAG_RE.finditer(html_text):
        if match.group(1).lower() == "base":
            attrs = _parse_attrs(match.group(2))
            href = attrs.get("href")
            if href:
                return urllib.parse.urljoin(page_url, href)
    return page_url


def unwrap_noscript(html_text: str) -> str:
    """Replace <noscript> wrappers with their content.

    When scripting was enabled at capture time the browser serialises
    noscript children as escaped text; unescape in that case so fallback
    markup (images especially) renders in the static mirror.
    """

    def _unwrap(match: re.Match[str]) -> str:
        inner = match.group(1)
        if "&lt;" in inner and "<" not in inner:
            inner = html_lib.unescape(inner)
        return inner

    return NOSCRIPT_BLOCK_RE.sub(_unwrap, html_text)


def _refs_from_tag(tag: str, attrs: dict[str, str], base_url: str) -> list[Ref]:
    refs: list[Ref] = []
    if tag == "link":
        kind = _link_kind(attrs)
        if kind:
            url = resolve_url(base_url, attrs.get("href", ""))
            if url:
                refs.append(Ref(url, kind))
        return refs
    if tag == "meta":
        key = (attrs.get("property") or attrs.get("name") or "").lower()
        if key in META_IMAGE_KEYS:
            url = resolve_url(base_url, attrs.get("content", ""))
            if url:
                refs.append(Ref(url, "asset"))
        return refs
    if tag == "script":
        url = resolve_url(base_url, attrs.get("src", ""))
        if url:
            refs.append(Ref(url, "script"))
        return refs
    if tag == "iframe":
        url = resolve_url(base_url, attrs.get("src", ""))
        if url:
            refs.append(Ref(url, "iframe"))
        return refs
    for attr in URL_ATTRS.get(tag, ()):
        value = attrs.get(attr)
        if not value:
            continue
        if attr in SRCSET_ATTRS:
            for raw, _descriptor in parse_srcset(value):
                url = resolve_url(base_url, raw)
                if url:
                    refs.append(Ref(url, "asset"))
        else:
            url = resolve_url(base_url, value)
            if url:
                refs.append(Ref(url, "asset"))
    return refs


def collect_html_refs(html_text: str, base_url: str) -> list[Ref]:
    """Collect every external reference in the document (deduplicated)."""
    refs: list[Ref] = []
    seen: set[tuple[str, str]] = set()

    def _add(ref: Ref) -> None:
        key = (ref.url, ref.kind)
        if key not in seen:
            seen.add(key)
            refs.append(ref)

    for match in TAG_RE.finditer(html_text):
        tag = match.group(1).lower()
        attrs = _parse_attrs(match.group(2))
        for ref in _refs_from_tag(tag, attrs, base_url):
            _add(ref)
        style_value = attrs.get("style")
        if style_value:
            for raw, _is_import in collect_css_refs(style_value):
                url = resolve_url(base_url, raw)
                if url:
                    _add(Ref(url, "asset"))
        handled = set(URL_ATTRS.get(tag, ()))
        for name, value in attrs.items():
            if not name.startswith("data-") or name in handled:
                continue
            for candidate in DATA_URL_CANDIDATE_RE.findall(value):
                url = resolve_url(base_url, candidate)
                if url:
                    _add(Ref(url, "asset"))
    for match in STYLE_BLOCK_RE.finditer(html_text):
        for raw, is_import in collect_css_refs(match.group(2)):
            url = resolve_url(base_url, raw)
            if url:
                _add(Ref(url, "stylesheet" if is_import else "asset"))
    return refs


def rewrite_html(
    html_text: str,
    base_url: str,
    mapping: dict[str, str],
    *,
    strip_js: bool = True,
) -> str:
    """Rewrite all references via mapping (absolute URL -> replacement).

    URLs absent from the mapping are left untouched. Scripts are removed
    when strip_js is true; iframes get src=about:blank plus a note comment.
    """

    def _map_single(raw: str) -> Optional[str]:
        url = resolve_url(base_url, raw)
        if url is None:
            return None
        return mapping.get(url)

    def _map_css(raw: str) -> Optional[str]:
        return _map_single(raw)

    if strip_js:
        html_text = SCRIPT_BLOCK_RE.sub("", html_text)
        # Orphan open tags (malformed or self-closing scripts).
        html_text = re.sub(r"<script\b(?:\"[^\"]*\"|'[^']*'|[^>\"'])*/?>", "", html_text, flags=re.IGNORECASE)

    def _rewrite_style_block(match: re.Match[str]) -> str:
        return match.group(1) + rewrite_css(match.group(2), _map_css) + match.group(3)

    html_text = STYLE_BLOCK_RE.sub(_rewrite_style_block, html_text)

    def _rewrite_tag(match: re.Match[str]) -> str:
        tag = match.group(1).lower()
        body = match.group(2)
        closer = match.group(3)
        attrs = _parse_attrs(body)

        if tag == "base":
            # A <base href> would re-anchor our relative asset paths.
            return "<!-- mirror: base tag removed -->"
        if tag == "script" and strip_js:
            return ""
        if tag == "link" and strip_js and _link_kind(attrs) == "script":
            return ""

        prefix = ""
        if tag == "iframe":
            original = attrs.get("src", "")
            if original and resolve_url(base_url, original):
                prefix = f"<!-- mirror: iframe not mirrored, original src: {html_lib.escape(original)} -->"

        url_attrs = URL_ATTRS.get(tag, ())
        meta_is_image = tag == "meta" and (
            (attrs.get("property") or attrs.get("name") or "").lower() in META_IMAGE_KEYS
        )

        def _rewrite_attr(attr_match: re.Match[str]) -> str:
            name = attr_match.group(1).lower()
            raw_value = attr_match.group(2)
            quote = raw_value[0] if raw_value[:1] in ("\"", "'") else '"'
            value = html_lib.unescape(raw_value[1:-1] if raw_value[:1] in ("\"", "'") else raw_value)

            new_value: Optional[str] = None
            if name == "style":
                rewritten = rewrite_css(value, _map_css)
                if rewritten != value:
                    new_value = rewritten
            elif name.startswith("data-") and name not in url_attrs:
                def _sub_candidate(cand_match: re.Match[str]) -> str:
                    mapped = _map_single(cand_match.group(0))
                    return mapped if mapped is not None else cand_match.group(0)

                candidate_value = DATA_URL_CANDIDATE_RE.sub(_sub_candidate, value)
                if candidate_value != value:
                    new_value = candidate_value
            elif tag == "iframe" and name == "src":
                if resolve_url(base_url, value):
                    new_value = "about:blank"
            elif name in url_attrs and (tag != "meta" or meta_is_image):
                if name in SRCSET_ATTRS:
                    pairs = parse_srcset(value)
                    mapped = [(_map_single(url) or url, desc) for url, desc in pairs]
                    candidate = serialize_srcset(mapped)
                    if candidate != value:
                        new_value = candidate
                else:
                    mapped_single = _map_single(value)
                    if mapped_single is not None:
                        new_value = mapped_single
            if new_value is None:
                return attr_match.group(0)
            escaped = html_lib.escape(new_value, quote=True)
            return f"{attr_match.group(1)}={quote}{escaped}{quote}"

        new_body = ATTR_RE.sub(_rewrite_attr, body)

        # Static hero-video recovery: sites often set <video> sources via JS
        # from a data attribute (e.g. data-hero-videos JSON). With scripts
        # stripped, recover the first mirrored video URL as a real src so the
        # static mirror plays it. Assumption: such videos have no <source>
        # children (the JS-driven pattern sets src directly).
        if tag == "video" and "src" not in attrs:
            recovered = None
            for value in attrs.values():
                for candidate in DATA_URL_CANDIDATE_RE.findall(value):
                    if not VIDEO_EXT_RE.search(candidate):
                        continue
                    mapped = _map_single(candidate)
                    if mapped is not None:
                        recovered = mapped
                        break
                if recovered:
                    break
            if recovered:
                new_body += (
                    f' src="{html_lib.escape(recovered, quote=True)}"'
                    ' autoplay="" muted="" loop="" playsinline=""'
                    ' data-mirror-note="src recovered from data attributes"'
                )

        return f"{prefix}<{match.group(1)}{new_body}{closer}>"

    return TAG_RE.sub(_rewrite_tag, html_text)


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------

class FetchError(Exception):
    def __init__(self, message: str, status: Optional[int] = None) -> None:
        super().__init__(message)
        self.status = status


def default_fetch(
    url: str,
    timeout: float = 30.0,
    user_agent: str = DEFAULT_USER_AGENT,
    retries: int = 2,
) -> tuple[bytes, str]:
    """Fetch a URL following redirects. Returns (bytes, content_type)."""
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": user_agent,
            "Accept": "*/*",
            "Accept-Language": "en-AU,en;q=0.9",
            "Referer": f"{urllib.parse.urlsplit(url).scheme}://{urllib.parse.urlsplit(url).netloc}/",
        },
    )
    context = ssl.create_default_context()
    last_error: Optional[Exception] = None
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
                payload = response.read()
                content_type = response.headers.get("content-type", "")
                return payload, content_type
        except urllib.error.HTTPError as exc:
            # 4xx will not improve on retry; 5xx might.
            if exc.code < 500 or attempt == retries:
                raise FetchError(f"HTTP {exc.code} {exc.reason}", status=exc.code) from exc
            last_error = exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt == retries:
                raise FetchError(str(exc)) from exc
            last_error = exc
        time.sleep(0.5 * (attempt + 1))
    raise FetchError(str(last_error))  # pragma: no cover - loop always returns/raises


class HostLimiter:
    """Cap concurrent downloads per host (politeness)."""

    def __init__(self, per_host: int = PER_HOST_LIMIT) -> None:
        self._per_host = per_host
        self._lock = threading.Lock()
        self._semaphores: dict[str, threading.Semaphore] = {}

    def semaphore(self, url: str) -> threading.Semaphore:
        host = urllib.parse.urlsplit(url).netloc.lower()
        with self._lock:
            if host not in self._semaphores:
                self._semaphores[host] = threading.Semaphore(self._per_host)
            return self._semaphores[host]


# ---------------------------------------------------------------------------
# Stale hashed-asset recovery
# ---------------------------------------------------------------------------

# Content-hash token heuristic: 6-16 url-safe chars with a digit or mixed
# case, so plain words ("legacy", "print") are not mistaken for hashes.
HASH_TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{6,16}$")


def _looks_like_hash(token: str) -> bool:
    if not HASH_TOKEN_RE.match(token):
        return False
    has_digit = any(ch.isdigit() for ch in token)
    mixed_case = token.lower() != token and token.upper() != token
    return has_digit or mixed_case


def hashed_stem_key(url: str) -> Optional[tuple[str, str, str]]:
    """Decompose name.HASH.ext basenames (e.g. Astro/Vite build output).

    Returns (url_prefix_without_basename, logical_name, ext) when the
    basename embeds a content-hash token, else None.
    """
    parsed = urllib.parse.urlsplit(url)
    directory, _, basename = parsed.path.rpartition("/")
    parts = basename.split(".")
    if len(parts) < 3:
        return None
    name = ".".join(parts[:-2])
    token = parts[-2]
    ext = parts[-1]
    if not name or not ext or not _looks_like_hash(token):
        return None
    prefix = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, directory + "/", "", ""))
    return (prefix, name, ext)


def find_stale_replacement(failed_url: str, candidates: list[str]) -> Optional[str]:
    """Find the same logical asset under a rotated content hash.

    Hashed build assets (name.HASH.ext) disappear on redeploy; the live page
    references the same logical name with a new hash. Match on identical
    location + name + extension, differing hash.
    """
    key = hashed_stem_key(failed_url)
    if key is None:
        return None
    for candidate in candidates:
        if candidate == failed_url:
            continue
        if hashed_stem_key(candidate) == key:
            return candidate
    return None


# ---------------------------------------------------------------------------
# Cached-asset reuse
# ---------------------------------------------------------------------------

def build_cache_index(slug: str) -> dict[str, Path]:
    """Index previously downloaded brand assets by basename.

    assets-inventory.json stores bare filenames (no source URLs), so reuse
    matches a URL's path basename against cached files. Assumption: within a
    single brand, identical basenames refer to the same asset.
    """
    index: dict[str, Path] = {}
    for root in (REPO_ROOT / "cache" / slug / "assets", LIBRARY_ROOT / "cache" / slug / "assets"):
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*")):
            if path.is_file():
                index.setdefault(path.name, path)
    return index


# ---------------------------------------------------------------------------
# Page sources
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PageSpec:
    slug: str
    url: str
    snapshot: Optional[Path] = None


def _normalise_page_slug(slug: str) -> str:
    return "homepage" if slug in ("", "/", "home") else slug


def _parse_pages_payload(raw: Any) -> list[tuple[str, str]]:
    """Accept both list- and dict-shaped pages.json (see export_html_snapshots)."""
    if isinstance(raw, list):
        items = [
            (str(item.get("slug") or item.get("page_slug") or item.get("id") or "").strip(), item)
            for item in raw
            if isinstance(item, dict)
        ]
    elif isinstance(raw, dict):
        items = [(str(slug), item) for slug, item in raw.items() if isinstance(item, dict)]
    else:
        raise ValueError(f"Unsupported pages.json structure: {type(raw).__name__}")
    pages: list[tuple[str, str]] = []
    for slug, item in items:
        page_slug = _normalise_page_slug(slug)
        url = str(item.get("original_url") or item.get("url") or item.get("source_url") or "").strip()
        if page_slug and url:
            pages.append((page_slug, url))
    return pages


def find_pages_json(slug: str, override: Optional[Path] = None) -> Optional[Path]:
    candidates = [override] if override else [
        REPO_ROOT / "cache" / slug / "dom-extraction" / "pages.json",
        REPO_ROOT / "cache" / slug / "validation" / "pages.json",
        REPO_ROOT / "cache" / slug / "pages.json",
        LIBRARY_ROOT / "cache" / slug / "validation" / "pages.json",
        LIBRARY_ROOT / "cache" / slug / "pages.json",
    ]
    for candidate in candidates:
        if candidate and candidate.is_file():
            return candidate
    return None


def find_snapshot(slug: str, page_slug: str) -> Optional[Path]:
    for root in (
        REPO_ROOT / "cache" / slug / "dom-extraction",
        LIBRARY_ROOT / "cache" / slug / "dom-extraction",
    ):
        candidate = root / f"{page_slug}-snapshot.html"
        if candidate.is_file():
            return candidate
    return None


def _page_url_from_snapshot(html_text: str) -> Optional[str]:
    """Recover the page URL from canonical/og:url metadata in a snapshot."""
    for match in TAG_RE.finditer(html_text):
        tag = match.group(1).lower()
        if tag not in ("link", "meta"):
            continue
        attrs = _parse_attrs(match.group(2))
        if tag == "link" and "canonical" in (attrs.get("rel") or "").lower().split():
            href = (attrs.get("href") or "").strip()
            if href.startswith("http"):
                return href
        if tag == "meta" and (attrs.get("property") or "").lower() == "og:url":
            content = (attrs.get("content") or "").strip()
            if content.startswith("http"):
                return content
    return None


def _source_url_from_metadata(slug: str) -> Optional[str]:
    for path in (
        REPO_ROOT / "brands" / slug / "metadata.json",
        LIBRARY_ROOT / "brands" / slug / "metadata.json",
    ):
        try:
            metadata = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        url = str(metadata.get("source_url") or metadata.get("url") or "").strip()
        if url:
            return url
    return None


def resolve_page_specs(slug: str, pages_json: Optional[Path]) -> list[PageSpec]:
    """Resolve key pages: pages.json first, else derive from snapshots."""
    path = find_pages_json(slug, pages_json)
    if path:
        raw = json.loads(path.read_text(encoding="utf-8"))
        specs = [
            PageSpec(slug=page_slug, url=url, snapshot=find_snapshot(slug, page_slug))
            for page_slug, url in _parse_pages_payload(raw)
        ]
        if specs:
            return specs

    snapshots: dict[str, Path] = {}
    for root in (
        REPO_ROOT / "cache" / slug / "dom-extraction",
        LIBRARY_ROOT / "cache" / slug / "dom-extraction",
    ):
        if not root.is_dir():
            continue
        for snapshot in sorted(root.glob("*-snapshot.html")):
            page_slug = snapshot.name[: -len("-snapshot.html")]
            snapshots.setdefault(page_slug, snapshot)
    if not snapshots:
        raise SystemExit(
            f"No pages found for '{slug}': no pages.json under cache/{slug}/ or "
            f"{LIBRARY_ROOT}/cache/{slug}/validation/, and no *-snapshot.html files. "
            "Run the extraction pipeline first or pass --pages-json."
        )

    source_url = _source_url_from_metadata(slug)
    specs = []
    for page_slug, snapshot in snapshots.items():
        html_text = snapshot.read_text(encoding="utf-8", errors="replace")
        url = _page_url_from_snapshot(html_text)
        if not url and source_url:
            # Assumption: page slug mirrors the URL path segment (true for
            # this pipeline's slug convention); homepage maps to "/".
            suffix = "/" if page_slug == "homepage" else f"/{page_slug}/"
            url = urllib.parse.urljoin(source_url, suffix)
        if not url:
            print(f"[warn] {page_slug}: cannot determine original URL (no canonical/og:url, no metadata); skipping", file=sys.stderr)
            continue
        specs.append(PageSpec(slug=page_slug, url=url, snapshot=snapshot))
    if not specs:
        raise SystemExit(f"Could not determine original URLs for any snapshot of '{slug}'.")
    return specs


# ---------------------------------------------------------------------------
# Mirroring
# ---------------------------------------------------------------------------

@dataclass
class AssetRecord:
    url: str
    local: Optional[str] = None
    bytes: int = 0
    status: str = "pending"  # ok | cached | failed | skipped
    error: Optional[str] = None
    recovered_from: Optional[str] = None
    # Note: the "bytes" field above shadows the builtin only inside this class
    # body; with deferred annotations (PEP 563 import) this stays a string.
    content: Optional[bytes] = field(default=None, repr=False)
    content_type: str = ""


def build_manifest(
    page_url: str,
    source: str,
    records: list[AssetRecord],
    *,
    captured_at: Optional[str] = None,
) -> dict[str, Any]:
    failures = [
        {"url": record.url, "error": record.error or "unknown error"}
        for record in records
        if record.status == "failed"
    ]
    return {
        "original_url": page_url,
        "captured_at": captured_at or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": source,
        "asset_count": sum(1 for record in records if record.status in ("ok", "cached")),
        "total_bytes": sum(record.bytes for record in records if record.status in ("ok", "cached")),
        "assets": [
            {
                "url": record.url,
                "local": record.local,
                "bytes": record.bytes,
                "status": record.status,
                **({"error": record.error} if record.error else {}),
                **({"recovered_from": record.recovered_from} if record.recovered_from else {}),
            }
            for record in sorted(records, key=lambda item: item.url)
        ],
        "failures": failures,
    }


class PageMirror:
    """Mirrors one page: downloads assets, rewrites HTML/CSS, writes output."""

    def __init__(
        self,
        spec: PageSpec,
        page_dir: Path,
        *,
        fetch: Callable[..., tuple[bytes, str]] = default_fetch,
        cache_index: Optional[dict[str, Path]] = None,
        keep_js: bool = False,
        timeout: float = 30.0,
        user_agent: str = DEFAULT_USER_AGENT,
        workers: int = 8,
        limiter: Optional[HostLimiter] = None,
    ) -> None:
        self.spec = spec
        self.page_dir = page_dir
        self.fetch = fetch
        self.cache_index = cache_index or {}
        self.keep_js = keep_js
        self.timeout = timeout
        self.user_agent = user_agent
        self.workers = max(1, workers)
        self.limiter = limiter or HostLimiter()
        self.records: dict[str, AssetRecord] = {}
        self._live_urls: Optional[list[str]] = None

    # -- HTML source ------------------------------------------------------

    def load_html(self) -> tuple[str, str]:
        if self.spec.snapshot and self.spec.snapshot.is_file():
            return (
                self.spec.snapshot.read_text(encoding="utf-8", errors="replace"),
                "snapshot",
            )
        payload, content_type = self.fetch(
            self.spec.url, timeout=self.timeout, user_agent=self.user_agent
        )
        charset = "utf-8"
        message = email.message.Message()
        message["content-type"] = content_type or "text/html"
        charset = message.get_content_charset() or "utf-8"
        try:
            return payload.decode(charset, errors="replace"), "live"
        except LookupError:
            return payload.decode("utf-8", errors="replace"), "live"

    # -- downloads ----------------------------------------------------------

    def _download_one(self, url: str) -> AssetRecord:
        record = AssetRecord(url=url)
        basename = posixpath.basename(urllib.parse.unquote(urllib.parse.urlsplit(url).path))
        cached = self.cache_index.get(basename) if basename else None
        if cached is not None:
            try:
                content = cached.read_bytes()
                record.content = content
                record.bytes = len(content)
                record.status = "cached"
                return record
            except OSError:
                pass  # fall through to network fetch
        semaphore = self.limiter.semaphore(url)
        with semaphore:
            try:
                content, content_type = self.fetch(
                    url, timeout=self.timeout, user_agent=self.user_agent
                )
            except FetchError as exc:
                record.status = "failed"
                record.error = str(exc)
                return record
            except Exception as exc:  # noqa: BLE001 - record, never silently drop
                record.status = "failed"
                record.error = f"{type(exc).__name__}: {exc}"
                return record
        record.content = content
        record.content_type = content_type
        record.bytes = len(content)
        record.status = "ok"
        return record

    def _download_many(self, urls: list[str]) -> None:
        pending = [url for url in dict.fromkeys(urls) if url not in self.records]
        if not pending:
            return
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.workers) as pool:
            for record in pool.map(self._download_one, pending):
                self.records[record.url] = record

    # -- asset writing ------------------------------------------------------

    def _write_asset(self, record: AssetRecord, content: Optional[bytes] = None) -> str:
        payload = content if content is not None else (record.content or b"")
        name = local_asset_name(record.url, payload, record.content_type)
        path = self.page_dir / "assets" / name
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_bytes(payload)
        record.local = f"assets/{name}"
        record.bytes = len(payload)
        return name

    # -- stale hashed-asset recovery ----------------------------------------

    def _recover_stale_assets(self) -> None:
        """Re-resolve failed hashed assets against the live page.

        Snapshots reference content-hashed build assets (name.HASH.ext) that
        rot when the site redeploys. The live page references the same
        logical asset under a new hash; substitute it and say so.
        """
        stale = [
            url
            for url, record in self.records.items()
            if record.status == "failed" and hashed_stem_key(url) is not None
        ]
        if not stale:
            return
        if self._live_urls is None:
            try:
                payload, _content_type = self.fetch(
                    self.spec.url, timeout=self.timeout, user_agent=self.user_agent
                )
            except Exception as exc:  # noqa: BLE001 - recovery is best-effort
                print(f"[warn] stale-asset recovery: live fetch of {self.spec.url} failed: {exc}", file=sys.stderr)
                self._live_urls = []
                return
            live_html = payload.decode("utf-8", errors="replace")
            live_base = find_base_href(live_html, self.spec.url)
            self._live_urls = [ref.url for ref in collect_html_refs(live_html, live_base)]
        live_urls = self._live_urls
        for url in stale:
            replacement = find_stale_replacement(url, live_urls)
            if replacement is None:
                continue
            substitute = self._download_one(replacement)
            if substitute.status not in ("ok", "cached") or substitute.content is None:
                continue
            record = self.records[url]
            record.content = substitute.content
            record.content_type = substitute.content_type
            record.bytes = substitute.bytes
            record.status = "ok"
            record.error = None
            record.recovered_from = replacement
            print(f"[note] recovered stale asset {url} -> {replacement}")

    # -- pipeline -----------------------------------------------------------

    def run(self) -> dict[str, Any]:
        html_text, source = self.load_html()
        base_url = find_base_href(html_text, self.spec.url)
        html_text = unwrap_noscript(html_text)

        refs = collect_html_refs(html_text, base_url)
        stylesheet_urls = [ref.url for ref in refs if ref.kind == "stylesheet"]
        asset_urls = [ref.url for ref in refs if ref.kind == "asset"]
        if self.keep_js:
            asset_urls += [ref.url for ref in refs if ref.kind == "script"]
        # iframe refs are recorded in the manifest but never downloaded.
        iframe_records = [
            AssetRecord(url=ref.url, status="skipped", error="iframe not mirrored")
            for ref in refs
            if ref.kind == "iframe"
        ]

        self._download_many(stylesheet_urls + asset_urls)
        if source == "snapshot":
            self._recover_stale_assets()

        # Recurse one level into stylesheets: fonts, images, @import sheets.
        # Imported sheets (depth 2) are also rewritten; anything they import
        # further is left as an absolute URL.
        sheets_by_depth: list[list[str]] = [stylesheet_urls]
        css_children: dict[str, list[tuple[str, str]]] = {}
        for depth in (1, 2):
            current = sheets_by_depth[-1]
            nested_assets: list[str] = []
            next_imports: list[str] = []
            for sheet_url in current:
                record = self.records.get(sheet_url)
                if record is None or record.content is None:
                    continue
                css_text = record.content.decode("utf-8", errors="replace")
                children: list[tuple[str, str]] = []
                for raw, is_import in collect_css_refs(css_text):
                    resolved = resolve_url(sheet_url, raw)
                    if resolved is None:
                        continue
                    children.append((raw, resolved))
                    if is_import and depth < 2:
                        next_imports.append(resolved)
                    else:
                        nested_assets.append(resolved)
                css_children[sheet_url] = children
            self._download_many(nested_assets + next_imports)
            if source == "snapshot":
                # Second chance for hash-rotated assets referenced from CSS
                # (only effective when the live page also references them).
                self._recover_stale_assets()
            if not next_imports:
                break
            sheets_by_depth.append(next_imports)

        # Write plain assets (everything downloaded that is not a stylesheet
        # we are going to rewrite).
        sheet_set = {url for tier in sheets_by_depth for url in tier if url in css_children}
        for url, record in self.records.items():
            if url in sheet_set:
                continue
            if record.status in ("ok", "cached") and record.content is not None:
                self._write_asset(record)

        # Rewrite stylesheets bottom-up so parents see children's local names.
        for tier in reversed(sheets_by_depth):
            for sheet_url in tier:
                record = self.records.get(sheet_url)
                if record is None or record.content is None or sheet_url not in css_children:
                    continue
                resolved_by_raw = dict(css_children[sheet_url])

                def _replace(raw: str, _resolved_by_raw=resolved_by_raw) -> Optional[str]:
                    resolved = _resolved_by_raw.get(raw)
                    if resolved is None:
                        return None
                    child = self.records.get(resolved)
                    if child is not None and child.local:
                        # CSS lives in assets/ next to its children.
                        return child.local[len("assets/"):]
                    # Failed or skipped: absolute URL keeps it working online.
                    return resolved

                css_text = record.content.decode("utf-8", errors="replace")
                rewritten = rewrite_css(css_text, _replace).encode("utf-8")
                self._write_asset(record, rewritten)

        # Map every successful download to its relative local path.
        mapping: dict[str, str] = {}
        for url, record in self.records.items():
            if record.local:
                mapping[url] = record.local
            elif record.status == "failed":
                mapping[url] = url  # absolute fallback so the page works online
        for ref in refs:
            if ref.kind == "iframe":
                mapping.pop(ref.url, None)

        rewritten_html = rewrite_html(html_text, base_url, mapping, strip_js=not self.keep_js)

        self.page_dir.mkdir(parents=True, exist_ok=True)
        (self.page_dir / "index.html").write_text(rewritten_html, encoding="utf-8")

        all_records = list(self.records.values()) + iframe_records
        manifest = build_manifest(self.spec.url, source, all_records)
        manifest["page_slug"] = self.spec.slug
        (self.page_dir / "manifest.json").write_text(
            json.dumps(manifest, indent=2), encoding="utf-8"
        )
        return manifest


# ---------------------------------------------------------------------------
# Verification via agent-browser
# ---------------------------------------------------------------------------

# Dedicated agent-browser session so concurrent agents sharing the default
# session cannot navigate away between our open and screenshot commands.
VERIFY_SESSION = "mirror-verify"


def verify_page(page_dir: Path, *, timeout: float = 60.0) -> dict[str, Any]:
    """Open the mirror via agent-browser, screenshot it, and count console errors."""
    index_path = page_dir / "index.html"
    screenshot_path = page_dir / "verify.png"
    result: dict[str, Any] = {
        "page": page_dir.name,
        "screenshot": None,
        "console_errors": None,
        "missing_resources": None,
        "ok": False,
    }
    if shutil.which("agent-browser") is None:
        result["error"] = "agent-browser not found on PATH"
        return result

    def _run(*args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["agent-browser", "--session", VERIFY_SESSION, *args],
            capture_output=True,
            text=True,
            timeout=timeout,
        )

    try:
        opened = _run("open", index_path.resolve().as_uri())
        if opened.returncode != 0:
            result["error"] = f"agent-browser open failed: {opened.stderr.strip() or opened.stdout.strip()}"
            return result
        _run("wait", "1500")
        # Clear stale logs from earlier pages, then reload to capture fresh ones.
        _run("console", "--clear")
        _run("errors", "--clear")
        _run("reload")
        _run("wait", "1500")
        shot = _run("screenshot", str(screenshot_path))
        if shot.returncode == 0 and screenshot_path.is_file():
            result["screenshot"] = str(screenshot_path)
        console = _run("console")
        errors = _run("errors")
        console_text = (console.stdout or "") + (errors.stdout or "")
        missing = [
            line
            for line in console_text.splitlines()
            if re.search(r"Failed to load resource|net::ERR_|404|ERR_FILE_NOT_FOUND", line)
        ]
        error_lines = [
            line
            for line in console_text.splitlines()
            if line.strip() and re.search(r"\b(error|Error)\b", line)
        ]
        result["console_errors"] = len(error_lines)
        result["missing_resources"] = len(missing)
        result["missing_resource_lines"] = missing[:20]
        result["ok"] = result["screenshot"] is not None
    except subprocess.TimeoutExpired:
        result["error"] = "agent-browser timed out"
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Mirror original brand pages into offline local copies."
    )
    parser.add_argument("--slug", required=True, help="Brand slug, e.g. luminary-ai")
    parser.add_argument("--pages-json", type=Path, default=None, help="Explicit pages.json path")
    parser.add_argument(
        "--page",
        action="append",
        default=None,
        help="Limit to specific page slug(s); repeatable",
    )
    parser.add_argument("--verify", action="store_true", help="Screenshot each mirror via agent-browser")
    parser.add_argument("--max-pages", type=int, default=None, help="Mirror at most N pages")
    parser.add_argument("--keep-js", action="store_true", help="Keep and download <script> tags")
    parser.add_argument("--timeout", type=float, default=30.0, help="Per-request timeout in seconds")
    parser.add_argument("--workers", type=int, default=8, help="Concurrent download workers")
    parser.add_argument(
        "--max-console-errors",
        type=int,
        default=5,
        help="--verify fails when missing-resource errors exceed this count",
    )
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    parser.add_argument(
        "--output-root",
        type=Path,
        default=REPO_ROOT / "brands",
        help="Root output directory (default: <repo>/brands)",
    )
    args = parser.parse_args(argv)

    specs = resolve_page_specs(args.slug, args.pages_json)
    if args.page:
        wanted = {_normalise_page_slug(p) for p in args.page}
        specs = [spec for spec in specs if spec.slug in wanted]
        missing = wanted - {spec.slug for spec in specs}
        if missing:
            print(f"[warn] requested pages not found: {', '.join(sorted(missing))}", file=sys.stderr)
        if not specs:
            print("No matching pages to mirror.", file=sys.stderr)
            return 1
    if args.max_pages is not None:
        specs = specs[: max(0, args.max_pages)]

    cache_index = build_cache_index(args.slug)
    limiter = HostLimiter()
    summaries: list[dict[str, Any]] = []
    exit_code = 0

    for spec in specs:
        page_dir = args.output_root / args.slug / "original" / spec.slug
        print(f"[mirror] {spec.slug}: {spec.url} ({'snapshot' if spec.snapshot else 'live'})")
        mirror = PageMirror(
            spec,
            page_dir,
            cache_index=cache_index,
            keep_js=args.keep_js,
            timeout=args.timeout,
            user_agent=args.user_agent,
            workers=args.workers,
            limiter=limiter,
        )
        try:
            manifest = mirror.run()
        except FetchError as exc:
            print(f"[fail] {spec.slug}: could not load page HTML: {exc}", file=sys.stderr)
            exit_code = 1
            continue
        for failure in manifest["failures"]:
            print(f"[warn] {spec.slug}: failed asset {failure['url']}: {failure['error']}", file=sys.stderr)
        summary = {
            "page": spec.slug,
            "source": manifest["source"],
            "assets": manifest["asset_count"],
            "bytes": manifest["total_bytes"],
            "failures": len(manifest["failures"]),
            "dir": str(page_dir),
        }
        if args.verify:
            verification = verify_page(page_dir)
            summary["verify"] = verification
            if verification.get("error"):
                print(f"[warn] {spec.slug}: verify: {verification['error']}", file=sys.stderr)
            missing = verification.get("missing_resources")
            if missing is not None and missing > args.max_console_errors:
                print(
                    f"[fail] {spec.slug}: {missing} missing-resource console errors "
                    f"(limit {args.max_console_errors})",
                    file=sys.stderr,
                )
                exit_code = 1
            if not verification.get("ok"):
                exit_code = 1
        summaries.append(summary)

    if args.verify and shutil.which("agent-browser") is not None:
        subprocess.run(
            ["agent-browser", "--session", VERIFY_SESSION, "close"],
            capture_output=True,
            text=True,
            timeout=30,
        )

    print(json.dumps({"slug": args.slug, "pages": summaries}, indent=2))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
