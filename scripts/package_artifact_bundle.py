#!/usr/bin/env python3
"""Package a mirrored brand page into a self-contained Open-Design artifact.

Reads a true offline mirror produced by ``mirror_original_pages.py`` (a folder
of the shape ``brands/<slug>/original/<page>/`` containing ``index.html`` and a
flat ``assets/`` of content-hash-named files) and emits an Open-Design-importable
artifact bundle::

    brands/<slug>/open-design/artifacts/<page>/
        index.html      # one <style> block (all CSS inlined); small assets
                        # data-URI inlined, large assets copied into assets/
        assets/         # only assets above --inline-threshold land here
        artifact.json   # OD ArtifactManifest (v1, kind=html)
        <page>.zip      # with --zip
        fidelity.json   # with --verify

The Open-Design daemon consumes a folder whose entry is an HTML file (see
``packages/contracts/src/api/artifacts.ts`` for the manifest schema). This
packager never touches the network: it only reads the local mirror and rewrites
references so the bundle renders offline in OD's sandboxed iframe.

Usage::

    python3 scripts/package_artifact_bundle.py \\
        --mirror-dir brands/acme/original/homepage \\
        --out-dir    brands/acme/open-design/artifacts/homepage --zip
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path
from typing import Any, Optional

from bs4 import BeautifulSoup

import mirror_original_pages as mop  # reuse battle-tested CSS regexes/parsers

DEFAULT_INLINE_THRESHOLD = 200 * 1024

MIME_BY_EXT: dict[str, str] = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".css": "text/css",
}

# <link> rel values whose href points at a downloadable asset (icons/manifests).
ASSET_LINK_RELS = {"icon", "shortcut", "apple-touch-icon", "mask-icon", "manifest"}

# Schemes that are already inline or non-asset and must never be rewritten.
SKIP_SCHEME_RE = re.compile(
    r"^(data|blob|javascript|mailto|tel|about|chrome|file|ws|wss):",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Path / MIME helpers
# ---------------------------------------------------------------------------

def _mime_for(path: Path) -> str:
    return MIME_BY_EXT.get(path.suffix.lower(), "application/octet-stream")


def _css_unescape(value: str) -> str:
    """Undo simple CSS backslash escapes (\" \' \\) in asset URLs."""
    return re.sub(r"\\(.)", r"\1", value)


def _is_external(raw: str) -> bool:
    low = raw.lower()
    return low.startswith(("http://", "https://")) or raw.startswith("//")


def _resolve_local_ref(base_dir: Path, raw: str) -> Optional[Path]:
    """Resolve a reference to a file on disk relative to ``base_dir``.

    Returns the file path when ``raw`` is a relative path that exists on disk,
    or None for data/blob URIs, fragments, absolute http(s)/protocol-relative
    URLs, or relative paths that do not resolve to a file. Directory escapes
    (``..``) are honoured so ``url(../img/x.png)`` inside ``assets/*.css`` works.
    """
    value = (raw or "").strip()
    if not value or value.startswith("#") or SKIP_SCHEME_RE.match(value):
        return None
    if _is_external(value):
        return None
    path_part = value.split("#", 1)[0].split("?", 1)[0]
    if not path_part:
        return None
    candidate = (base_dir / path_part)
    try:
        candidate = candidate.resolve(strict=False)
    except OSError:
        return None
    return candidate if candidate.is_file() else None


# ---------------------------------------------------------------------------
# Asset resolution: data-URI inline vs. copy
# ---------------------------------------------------------------------------

def _inline_or_copy(
    base_dir: Path,
    raw: str,
    out_dir: Path,
    inline_threshold: int,
    warnings: list[str],
) -> str:
    """Return the self-contained replacement for one URL reference.

    Files at or below ``inline_threshold`` bytes become ``data:<mime>;base64,...``
    URIs; larger files are copied into ``out_dir/assets/`` and referenced as
    ``assets/<name>``. Unresolvable/external references are returned untouched
    (external http(s) refs and missing local files both record a warning).
    """
    value = (raw or "").strip()
    if not value:
        return raw
    if SKIP_SCHEME_RE.match(value):
        return raw  # already inline / non-asset
    path = _resolve_local_ref(base_dir, value)
    if path is None:
        if _is_external(value):
            warnings.append(f"external URL left untouched: {value}")
        else:
            warnings.append(f"local asset not found: {value}")
        return raw
    data = path.read_bytes()
    if len(data) <= inline_threshold:
        return "data:%s;base64,%s" % (_mime_for(path), base64.b64encode(data).decode("ascii"))
    name = path.name
    dest = out_dir / "assets" / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copyfile(path, dest)
    return "assets/%s" % name


# ---------------------------------------------------------------------------
# CSS: inline @import chains, then rewrite url(...)
# ---------------------------------------------------------------------------

_IMPORT_URL_FORM_RE = re.compile(
    r'@import\s+url\(\s*["\']?([^"\')\s]+)["\']?\s*\)', re.IGNORECASE
)


def _load_css_text(path: Path, seen: set[Path], warnings: list[str]) -> str:
    """Read a stylesheet, splicing the contents of local ``@import`` chains.

    External ``@import`` (http(s) or unresolvable) statements are left in place
    with a warning; cycles are dropped. ``url(...)`` references are preserved
    verbatim here and rewritten by the caller against the *original* CSS file's
    directory so relative sibling references still resolve.
    """
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        warnings.append(f"could not read stylesheet {path}: {exc}")
        return ""
    # Normalise @import url(...) to the string form so CSS_IMPORT_RE catches all.
    text = _IMPORT_URL_FORM_RE.sub(lambda m: f'@import "{m.group(1)}"', text)

    def _splice(match: re.Match[str]) -> str:
        raw = _css_unescape(match.group(1) or match.group(2) or "").strip()
        if not raw:
            return match.group(0)
        child = _resolve_local_ref(path.parent, raw)
        if child is None:
            if _is_external(raw):
                warnings.append(f"external @import left untouched: {raw}")
            return match.group(0)
        if child in seen:
            warnings.append(f"@import cycle skipped: {raw}")
            return ""
        seen.add(child)
        return _load_css_text(child, seen, warnings)

    return mop.CSS_IMPORT_RE.sub(_splice, text)


def _rewrite_css_urls(
    css_text: str,
    css_dir: Path,
    out_dir: Path,
    inline_threshold: int,
    warnings: list[str],
) -> str:
    """Rewrite every ``url(...)`` in ``css_text`` to a self-contained reference."""

    def _sub(match: re.Match[str]) -> str:
        raw = _css_unescape(
            match.group(1) or match.group(2) or match.group(3) or ""
        ).strip()
        if not raw:
            return match.group(0)
        return 'url("%s")' % _inline_or_copy(
            css_dir, raw, out_dir, inline_threshold, warnings
        )

    return mop.CSS_URL_RE.sub(_sub, css_text)


# ---------------------------------------------------------------------------
# srcset
# ---------------------------------------------------------------------------

def _rewrite_srcset(
    value: str,
    base_dir: Path,
    out_dir: Path,
    inline_threshold: int,
    warnings: list[str],
) -> str:
    pairs = mop.parse_srcset(value)
    rewritten = [
        (
            _inline_or_copy(base_dir, url, out_dir, inline_threshold, warnings),
            descriptor,
        )
        for url, descriptor in pairs
    ]
    return mop.serialize_srcset(rewritten)


# ---------------------------------------------------------------------------
# package()
# ---------------------------------------------------------------------------

def package(
    page_mirror_dir: Path,
    out_dir: Path,
    *,
    inline_threshold: int = DEFAULT_INLINE_THRESHOLD,
    zip: bool = False,
    page_title: Optional[str] = None,
) -> dict[str, Any]:
    """Package one mirrored page into a self-contained OD artifact bundle.

    Returns ``{"dir", "artifact", "warnings", "zip"}``. See module docstring.
    """
    mirror_dir = Path(page_mirror_dir)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    (out / "assets").mkdir(parents=True, exist_ok=True)
    warnings: list[str] = []

    index_path = mirror_dir / "index.html"
    html_text = index_path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(html_text, "html.parser")

    # 1) Inline all <link rel=stylesheet> (following local @import chains) into
    #    one <style> block at the top of <head>.
    css_parts: list[str] = []
    for link in list(soup.find_all("link")):
        rels = [r.lower() for r in (link.get("rel") or [])]
        if "stylesheet" not in rels:
            continue
        href = (link.get("href") or "").strip()
        css_file = _resolve_local_ref(mirror_dir, href)
        if css_file is not None:
            combined = _load_css_text(css_file, {css_file}, warnings)
            css_parts.append(
                _rewrite_css_urls(combined, css_file.parent, out, inline_threshold, warnings)
            )
        elif href and not SKIP_SCHEME_RE.match(href):
            warnings.append(f"stylesheet not found locally: {href}")
        link.decompose()

    if css_parts:
        style_tag = soup.new_tag("style")
        style_tag.string = "\n".join(css_parts)
        if soup.head is not None:
            soup.head.insert(0, style_tag)
        else:
            soup.insert(0, style_tag)

    # 2) Strip any remaining <script> tags (mirror already does; be safe).
    for script in soup.find_all("script"):
        script.decompose()

    # 3) Rewrite remaining resource references to be self-contained.
    def _rewrite_single_attr(value: str) -> str:
        return _inline_or_copy(mirror_dir, value, out, inline_threshold, warnings)

    for tag in soup.find_all(["img", "source"]):
        if tag.get("src"):
            tag["src"] = _rewrite_single_attr(tag["src"])
        if tag.get("srcset"):
            tag["srcset"] = _rewrite_srcset(
                tag["srcset"], mirror_dir, out, inline_threshold, warnings
            )
    for video in soup.find_all("video"):
        if video.get("poster"):
            video["poster"] = _rewrite_single_attr(video["poster"])
        if video.get("src"):
            video["src"] = _rewrite_single_attr(video["src"])

    for link in soup.find_all("link"):
        rels = [r.lower() for r in (link.get("rel") or [])]
        if "stylesheet" in rels:
            continue  # already inlined + removed
        href = (link.get("href") or "").strip()
        if not href or SKIP_SCHEME_RE.match(href):
            continue
        is_asset_link = bool(set(rels) & ASSET_LINK_RELS)
        if not is_asset_link and _resolve_local_ref(mirror_dir, href) is None:
            continue  # canonical/preconnect/etc.: leave untouched
        replacement = _rewrite_single_attr(href)
        if replacement != href:
            link["href"] = replacement

    # Inline style="" attributes and pre-existing <style> blocks.
    for tag in soup.find_all(True):
        style = tag.get("style")
        if style:
            tag["style"] = _rewrite_css_urls(
                style, mirror_dir, out, inline_threshold, warnings
            )
    for style_block in soup.find_all("style"):
        if style_block.string:
            style_block.string = _rewrite_css_urls(
                style_block.string, mirror_dir, out, inline_threshold, warnings
            )

    # 4) Resolve the artifact title.
    if page_title:
        title = page_title
    elif soup.title and soup.title.string and soup.title.string.strip():
        title = soup.title.string.strip()
    else:
        title = mirror_dir.name

    # 5) Write outputs.
    out_html = str(soup)
    (out / "index.html").write_text(out_html, encoding="utf-8")

    artifact = {
        "version": 1,
        "kind": "html",
        "title": title,
        "entry": "index.html",
        "renderer": "html",
        "status": "complete",
        "exports": ["html", "zip"],
        "primary": "index.html",
    }
    (out / "artifact.json").write_text(json.dumps(artifact, indent=2), encoding="utf-8")

    result: dict[str, Any] = {
        "dir": str(out),
        "artifact": artifact,
        "warnings": warnings,
        "zip": None,
    }
    if zip:
        zip_path = out.parent / f"{out.name}.zip"
        _write_zip(out, zip_path)
        result["zip"] = str(zip_path)
    return result


def _write_zip(src_dir: Path, zip_path: Path) -> None:
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in src_dir.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(src_dir))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Package a mirrored page into a self-contained Open-Design artifact bundle."
    )
    parser.add_argument("--mirror-dir", type=Path, required=True, help="brands/<slug>/original/<page> dir")
    parser.add_argument("--out-dir", type=Path, required=True, help="output artifact dir")
    parser.add_argument("--inline-threshold", type=int, default=DEFAULT_INLINE_THRESHOLD)
    parser.add_argument("--page-title", default=None)
    parser.add_argument("--zip", action="store_true")
    args = parser.parse_args(argv)

    result = package(
        args.mirror_dir,
        args.out_dir,
        inline_threshold=args.inline_threshold,
        zip=args.zip,
        page_title=args.page_title,
    )
    for warning in result["warnings"]:
        print(f"[warn] {warning}", file=sys.stderr)
    print(f"[artifact] wrote {result['dir']}")
    if result.get("zip"):
        print(f"[artifact] zip {result['zip']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
