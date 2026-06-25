#!/usr/bin/env python3
"""Capture a PNG screenshot of a brand's rendered replica page.

The brand detail page summary card (ui/components/brand-summary-card.tsx)
needs a real PNG to render its "Replica" thumbnail. Without one the <img>
tag falls back to a coloured placeholder showing "Replica missing".

This script renders the replica route running on the local Next dev server
(see start.sh — typically https://design-extractor.localhost/brands/<slug>/replica),
captures a screenshot via the `agent-browser` CLI, and writes:

  ~/.claude/design-library/brands/<slug>/replica-screenshots/<page>.png
  ~/.claude/design-library/brands/<slug>/replica-screenshots/<page>-thumb.png  (220x140)

The `ui/lib/library.ts#getBrandDetail` loader picks up the full-size PNG
via the `/api/brands/<slug>/file/<path>` route and exposes the relative
path as `replica_screenshot` on `BrandDetail`. The summary card then
renders that as the replica thumbnail.

Assumptions:
- `agent-browser` is on PATH (see scripts/render_scene_matrix.py for the
  same pattern).
- Pillow is importable (already an installed dependency).
- The Next dev server is running and the replica route is reachable.
  `start.sh` brings the server up at https://design-extractor.localhost/.
  If a different base URL is preferred, set DESIGN_EXTRACTOR_BASE_URL.
- This script is purely additive: brands that already render correctly
  via the existing preview endpoint continue to do so, since the UI only
  switches to the captured PNG when this file exists on disk.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Iterable

try:
    from PIL import Image
except ImportError:  # pragma: no cover - Pillow is expected to be installed
    print(
        "[capture_replica_screenshot] ERROR: Pillow is required. Install with: pip3 install Pillow",
        file=sys.stderr,
    )
    raise

LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
DEFAULT_BASE_URL = os.environ.get(
    "DESIGN_EXTRACTOR_BASE_URL", "https://design-extractor.localhost"
)
THUMB_SIZE = (220, 140)
DEFAULT_VIEWPORT = (1280, 800)
REPO_ROOT = Path(__file__).resolve().parent.parent
REPLICA_ROUTES_DIR_TEMPLATE = REPO_ROOT / "ui" / "app" / "brands" / "{slug}" / "replica"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _warn(message: str) -> None:
    print(f"[capture_replica_screenshot] {message}", file=sys.stderr)


def _replica_url(slug: str, page: str, base_url: str) -> str:
    """Build the URL for a brand's replica page.

    The homepage lives at /brands/<slug>/replica; sub-pages live at
    /brands/<slug>/replica/<page>. Trailing slashes are tolerated by Next.
    """
    base = base_url.rstrip("/")
    if page == "homepage":
        return f"{base}/brands/{slug}/replica"
    return f"{base}/brands/{slug}/replica/{page}"


def _head_ok(url: str, timeout: float = 5.0) -> bool:
    """Best-effort HEAD/GET check. Returns True when the URL is reachable
    (any 2xx/3xx). The Next dev server doesn't always honour HEAD, so we
    fall back to a small GET if HEAD fails or returns 405.

    Refuses to verify TLS for the local *.localhost cert chain used by
    portless — those are signed by a locally trusted CA but Python's
    default context may not pick that up.
    """
    import ssl

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    def _try(method: str) -> bool:
        try:
            req = urllib.request.Request(url, method=method)
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                return 200 <= resp.status < 400
        except urllib.error.HTTPError as exc:
            # 405 = method not allowed; treat HEAD specifically and retry GET.
            return False if exc.code in {405, 501} else False
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            return False

    if _try("HEAD"):
        return True
    return _try("GET")


def _ensure_agent_browser() -> None:
    if shutil.which("agent-browser") is None:
        raise RuntimeError(
            "agent-browser CLI not found on PATH. Install with: npm i -g agent-browser"
        )


def _agent_browser_capture(url: str, output: Path, viewport: tuple[int, int], slug: str) -> None:
    """Drive agent-browser to capture `url` to `output` at `viewport`."""
    width, height = viewport
    session = f"capture-replica-{slug}"
    common = ["--session", session]

    subprocess.run(
        ["agent-browser", *common, "set", "viewport", str(width), str(height)],
        check=True,
        capture_output=True,
    )
    subprocess.run(
        ["agent-browser", *common, "open", url],
        check=True,
        capture_output=True,
    )
    # Viewport (not full-page) capture: we want the above-the-fold framing for
    # a thumbnail, matching how the original screenshot in cache/<slug>/screenshots
    # is composed.
    subprocess.run(
        ["agent-browser", *common, "screenshot", str(output)],
        check=True,
        capture_output=True,
    )


def _make_thumbnail(source: Path, target: Path, size: tuple[int, int] = THUMB_SIZE) -> None:
    """Resize `source` to fit within `size` (cropping to fill), save as PNG."""
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as img:
        img = img.convert("RGB")
        # Cover: scale to fill the box, then crop to centre.
        target_w, target_h = size
        src_w, src_h = img.size
        scale = max(target_w / src_w, target_h / src_h)
        new_w = max(1, int(round(src_w * scale)))
        new_h = max(1, int(round(src_h * scale)))
        resized = img.resize((new_w, new_h), Image.LANCZOS)
        left = max(0, (new_w - target_w) // 2)
        top = 0  # top-anchored — matches the UI's object-top behavior
        right = left + target_w
        bottom = top + target_h
        thumb = resized.crop((left, top, right, bottom))
        thumb.save(target, format="PNG", optimize=True)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def capture(
    slug: str,
    page: str = "homepage",
    viewport: tuple[int, int] = DEFAULT_VIEWPORT,
    base_url: str = DEFAULT_BASE_URL,
) -> Path | None:
    """Capture a replica screenshot and return the saved PNG path.

    Returns None when the replica URL is not reachable.
    """
    _ensure_agent_browser()

    url = _replica_url(slug, page, base_url)
    if not _head_ok(url):
        _warn(f"replica URL not reachable, skipping: {url}")
        return None

    target_dir = LIBRARY_ROOT / "brands" / slug / "replica-screenshots"
    target_dir.mkdir(parents=True, exist_ok=True)
    full_path = target_dir / f"{page}.png"
    thumb_path = target_dir / f"{page}-thumb.png"

    try:
        _agent_browser_capture(url, full_path, viewport, slug)
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.decode("utf-8", errors="replace") if exc.stderr else ""
        _warn(f"agent-browser failed for {url}: {stderr.strip()}")
        return None

    if not full_path.exists() or full_path.stat().st_size < 1024:
        _warn(f"captured file is missing or suspiciously small: {full_path}")
        return None

    try:
        _make_thumbnail(full_path, thumb_path)
    except Exception as exc:  # noqa: BLE001
        _warn(f"failed to create thumbnail for {full_path}: {exc}")
        # Non-fatal: the UI uses the full-size PNG; thumb is for future use.

    return full_path


def list_replica_pages(slug: str) -> list[str]:
    """Discover every page subdirectory under ui/app/brands/<slug>/replica/
    that contains a page.tsx (and the homepage page.tsx at the root).
    Returns page slugs suitable for `capture(..., page=<slug>)`.
    """
    pages: list[str] = []
    replica_root = Path(str(REPLICA_ROUTES_DIR_TEMPLATE).format(slug=slug))
    if not replica_root.is_dir():
        return pages
    if (replica_root / "page.tsx").is_file():
        pages.append("homepage")
    for child in sorted(replica_root.iterdir()):
        if not child.is_dir():
            continue
        if (child / "page.tsx").is_file():
            pages.append(child.name)
    return pages


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _run_for_pages(slug: str, pages: Iterable[str], viewport: tuple[int, int], base_url: str) -> int:
    failures = 0
    for page in pages:
        result = capture(slug, page=page, viewport=viewport, base_url=base_url)
        if result is None:
            failures += 1
            print(f"[capture_replica_screenshot] SKIPPED slug={slug} page={page}")
        else:
            size_kb = result.stat().st_size / 1024
            print(
                f"[capture_replica_screenshot] OK slug={slug} page={page} -> {result} ({size_kb:.1f} KB)"
            )
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Capture a PNG of a brand's rendered replica route via agent-browser"
    )
    parser.add_argument("--slug", required=True, help="Brand slug, e.g. woolworths-com-au")
    parser.add_argument(
        "--page",
        default="homepage",
        help="Replica page slug (default: homepage). Ignored when --all-pages is set.",
    )
    parser.add_argument(
        "--all-pages",
        action="store_true",
        help="Capture every replica route under ui/app/brands/<slug>/replica/.",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=DEFAULT_VIEWPORT[0],
        help=f"Viewport width (default: {DEFAULT_VIEWPORT[0]}).",
    )
    parser.add_argument(
        "--height",
        type=int,
        default=DEFAULT_VIEWPORT[1],
        help=f"Viewport height (default: {DEFAULT_VIEWPORT[1]}).",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"Base URL of the running dev server (default: {DEFAULT_BASE_URL}).",
    )
    args = parser.parse_args()

    viewport = (args.width, args.height)

    try:
        _ensure_agent_browser()
    except RuntimeError as exc:
        print(f"[capture_replica_screenshot] ERROR: {exc}", file=sys.stderr)
        return 2

    if args.all_pages:
        pages = list_replica_pages(args.slug)
        if not pages:
            print(
                f"[capture_replica_screenshot] no replica pages found for slug={args.slug}",
                file=sys.stderr,
            )
            return 1
        failures = _run_for_pages(args.slug, pages, viewport, args.base_url)
        return 0 if failures == 0 else 1

    result = capture(args.slug, page=args.page, viewport=viewport, base_url=args.base_url)
    if result is None:
        return 1
    size_kb = result.stat().st_size / 1024
    print(
        f"[capture_replica_screenshot] OK slug={args.slug} page={args.page} -> {result} ({size_kb:.1f} KB)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
