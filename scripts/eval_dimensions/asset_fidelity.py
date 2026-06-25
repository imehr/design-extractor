"""Asset fidelity dimension.

For every img / svg / bg-image referenced anywhere in the source DOM extraction,
check that the corresponding asset has been downloaded under
~/.claude/design-library/brands/<slug>/assets/ (recursively).

The DOM-extraction JSON shape varies per brand:
  - quantium uses `{"allImages": [{src,alt,...}, ...]}` at the top level.
  - woolworths nests image references inside `header.logo`, `hero.slides[].image`,
    `offerTiles[*].image`, etc. — there is NO top-level `allImages` array.

To stay shape-agnostic, this loader walks the JSON tree recursively and
collects:
  1. Any string value whose extension matches an image type.
  2. Any dict-of-form {"src": "<url>", ...} where src looks like an image.
  3. Any background-image URLs found in *-snapshot.html via the `url(...)` regex.

Match strategy: basename of the source URL (path tail, query stripped) compared
case-insensitively against every regular file under the brand's assets/
directory. We also merge in names from cache/<slug>/assets-inventory.json
when present (preserved from earlier behaviour).

Score = matched_unique / total_unique. Threshold 1.0 (treat any miss as a
defect), critical_fail_at 0.5. If we still find 0 source URLs after all
fallbacks, we skip with a reason.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

from eval_rubric import BrandContext, Dimension, DimensionResult, register


_BG_URL_RE = re.compile(r"url\((['\"]?)(.*?)\1\)")
_IMG_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif", ".ico"}


def _looks_like_image_url(value: str) -> bool:
    if not value or not isinstance(value, str):
        return False
    if value.startswith("data:"):
        return False
    # Strip query & fragment, lowercase the path tail and check extension.
    try:
        parsed = urlparse(value)
        path = (parsed.path or value).lower()
    except Exception:
        path = value.lower()
    for ext in _IMG_EXTS:
        if path.endswith(ext):
            return True
    return False


def _basename(url: str) -> str:
    """Extract the URL basename (last path segment, query stripped)."""
    if not url or url.startswith("data:"):
        return ""
    try:
        parsed = urlparse(url)
        path = parsed.path or url
    except Exception:
        path = url
    return path.rsplit("/", 1)[-1] if path else ""


def _walk_for_image_urls(obj, sink: list[str]) -> None:
    """Walk an arbitrary JSON tree, collecting every plausible image URL.

    Rules:
      - If a dict has `src` (or `url`/`href`/`image`/`background`) pointing at
        an image-like string, capture that value.
      - Recurse into every dict value and list element.
      - Bare strings inside lists/dicts that look like image URLs are also
        captured (covers ad-hoc shapes).
    """
    if isinstance(obj, dict):
        for key, val in obj.items():
            if isinstance(val, str) and _looks_like_image_url(val):
                sink.append(val)
            elif isinstance(val, (dict, list)):
                _walk_for_image_urls(val, sink)
            # else: ignore non-image scalars
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, str) and _looks_like_image_url(item):
                sink.append(item)
            elif isinstance(item, (dict, list)):
                _walk_for_image_urls(item, sink)


def _collect_source_assets(brand_dir: Path) -> list[str]:
    """Walk dom-extraction/*.json + *-snapshot.html for image URLs."""
    urls: list[str] = []
    dom_dir = brand_dir / "dom-extraction"
    if not dom_dir.exists():
        return urls

    for json_path in dom_dir.glob("*.json"):
        try:
            data = json.loads(json_path.read_text())
        except Exception:
            continue
        _walk_for_image_urls(data, urls)

    for html_path in dom_dir.glob("*-snapshot.html"):
        try:
            text = html_path.read_text(errors="ignore")
        except Exception:
            continue
        for m in _BG_URL_RE.finditer(text):
            candidate = m.group(2)
            if _looks_like_image_url(candidate):
                urls.append(candidate)

    return urls


def _enumerate_assets_dir(assets_dir: Path) -> set[str]:
    """Every regular file under assets_dir (recursive), as basename + lowercase basename."""
    available: set[str] = set()
    if not assets_dir.exists():
        return available
    try:
        for path in assets_dir.rglob("*"):
            if path.is_file():
                available.add(path.name)
                available.add(path.name.lower())
    except Exception:
        pass
    return available


def _merge_inventory(inv_path: Path, available: set[str]) -> None:
    """Pull names from the cached assets-inventory.json if it exists."""
    if not inv_path.exists():
        return
    try:
        inv = json.loads(inv_path.read_text())
    except Exception:
        return
    if not isinstance(inv, dict):
        return
    for key in ("images", "svgs", "favicons"):
        for name in inv.get(key) or []:
            if isinstance(name, str):
                available.add(name)
                available.add(name.lower())
    for f in inv.get("fonts") or []:
        if isinstance(f, str):
            available.add(f)
            available.add(f.lower())


def run(ctx: BrandContext) -> DimensionResult:
    source_urls = _collect_source_assets(ctx.brand_dir)

    if not source_urls:
        return DimensionResult(
            name="asset_fidelity",
            score=0.0,
            threshold=1.0,
            weight=0.05,
            status="skipped",
            details={
                "reason": "no source assets found in dom-extraction "
                          "(walked every *.json + *-snapshot.html shape; nothing matched image extensions)",
                "dom_dir": str(ctx.brand_dir / "dom-extraction"),
            },
        )

    assets_dir = ctx.brand_dir / "assets"
    available = _enumerate_assets_dir(assets_dir)
    _merge_inventory(ctx.cache_dir / "assets-inventory.json", available)

    resolved = 0
    unresolved: list[str] = []
    seen: set[str] = set()
    for url in source_urls:
        bn = _basename(url)
        if not bn:
            continue
        if bn in seen:
            continue
        seen.add(bn)
        if bn in available or bn.lower() in available:
            resolved += 1
        else:
            unresolved.append(bn)

    total = len(seen)
    score = resolved / total if total else 0.0

    return DimensionResult(
        name="asset_fidelity",
        score=score,
        threshold=1.0,
        weight=0.05,
        status="",
        details={
            "resolved": resolved,
            "total_unique_basenames": total,
            "unresolved_sample": unresolved[:20],
            "assets_dir": str(assets_dir),
            "inventory_present": (ctx.cache_dir / "assets-inventory.json").exists(),
        },
    )


register(Dimension(
    name="asset_fidelity",
    weight=0.05,
    threshold=1.0,
    critical_fail_at=0.5,
    runner=run,
))
