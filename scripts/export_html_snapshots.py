#!/usr/bin/env python3
"""Export source website pages from pages.json as local HTML snapshots."""

from __future__ import annotations

import argparse
import concurrent.futures
import email.message
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


LIBRARY_ROOT = Path.home() / ".claude" / "design-library"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


@dataclass(frozen=True)
class Page:
    slug: str
    url: str


@dataclass(frozen=True)
class ExportResult:
    slug: str
    url: str
    status: str
    bytes_written: int = 0
    effective_url: str | None = None
    error: str | None = None


def load_pages(brand: str) -> list[Page]:
    pages_path = LIBRARY_ROOT / "cache" / brand / "validation" / "pages.json"
    with pages_path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)

    if isinstance(raw, list):
        items = [
            (
                str(item.get("slug") or item.get("page_slug") or item.get("id") or "").strip(),
                item,
            )
            for item in raw
            if isinstance(item, dict)
        ]
    elif isinstance(raw, dict):
        items = [(str(slug), item) for slug, item in raw.items() if isinstance(item, dict)]
    else:
        raise ValueError(f"Unsupported pages.json structure: {type(raw).__name__}")

    pages: list[Page] = []
    for slug, item in items:
        page_slug = "homepage" if slug in {"", "/", "home"} else slug
        url = str(item.get("original_url") or item.get("url") or item.get("source_url") or "").strip()
        if not page_slug or not url:
            continue
        pages.append(Page(slug=page_slug, url=url))
    return pages


def response_charset(headers: email.message.Message) -> str:
    content_type = headers.get("content-type", "")
    message = email.message.Message()
    message["content-type"] = content_type
    return message.get_content_charset() or "utf-8"


def fetch_html(page: Page, timeout: float, user_agent: str, refresh: bool, output_dir: Path, cache_dir: Path) -> ExportResult:
    output_path = output_dir / f"{page.slug}-snapshot.html"
    cache_path = cache_dir / f"{page.slug}-snapshot.html"
    if output_path.exists() and cache_path.exists() and not refresh:
        return ExportResult(page.slug, page.url, "skipped", bytes_written=output_path.stat().st_size)

    request = urllib.request.Request(
        page.url,
        headers={
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-AU,en;q=0.9",
        },
    )

    try:
        context = ssl.create_default_context()
        with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
            payload = response.read()
            effective_url = response.geturl()
            charset = response_charset(response.headers)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return ExportResult(page.slug, page.url, "failed", error=str(exc))

    try:
        html = payload.decode(charset, errors="replace")
    except LookupError:
        html = payload.decode("utf-8", errors="replace")

    if "<html" not in html.lower():
        return ExportResult(page.slug, page.url, "failed", effective_url=effective_url, error="response did not contain an HTML document")

    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    cache_path.write_text(html, encoding="utf-8")
    return ExportResult(page.slug, page.url, "written", bytes_written=len(html.encode("utf-8")), effective_url=effective_url)


def write_manifest(brand: str, results: list[ExportResult], output_dir: Path, cache_dir: Path) -> None:
    payload: dict[str, Any] = {
        "brand": brand,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total": len(results),
        "written": sum(1 for result in results if result.status == "written"),
        "skipped": sum(1 for result in results if result.status == "skipped"),
        "failed": sum(1 for result in results if result.status == "failed"),
        "files": [
            {
                "slug": result.slug,
                "url": result.url,
                "effective_url": result.effective_url,
                "status": result.status,
                "bytes_written": result.bytes_written,
                "error": result.error,
                "file": f"dom-extraction/{result.slug}-snapshot.html",
            }
            for result in sorted(results, key=lambda item: item.slug)
        ],
    }
    text = json.dumps(payload, indent=2)
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "html-snapshots-manifest.json").write_text(text, encoding="utf-8")
    (cache_dir / "html-snapshots-manifest.json").write_text(text, encoding="utf-8")


def update_metadata(brand: str, results: list[ExportResult]) -> None:
    metadata_path = LIBRARY_ROOT / "brands" / brand / "metadata.json"
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return

    ok_count = sum(1 for result in results if result.status in {"written", "skipped"})
    metadata["html_pages_extracted"] = ok_count
    metadata["html_snapshots_updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Export pages.json URLs as local HTML snapshots.")
    parser.add_argument("--brand", required=True, help="Brand slug, for example quantium-com-au")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent fetch workers")
    parser.add_argument("--timeout", type=float, default=30.0, help="Request timeout in seconds")
    parser.add_argument("--refresh", action="store_true", help="Overwrite existing HTML snapshots")
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    args = parser.parse_args()

    pages = load_pages(args.brand)
    if not pages:
        print(f"No pages found for {args.brand}", file=sys.stderr)
        return 1

    output_dir = LIBRARY_ROOT / "brands" / args.brand / "dom-extraction"
    cache_dir = LIBRARY_ROOT / "cache" / args.brand / "dom-extraction"

    results: list[ExportResult] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        future_map = {
            executor.submit(fetch_html, page, args.timeout, args.user_agent, args.refresh, output_dir, cache_dir): page
            for page in pages
        }
        for future in concurrent.futures.as_completed(future_map):
            result = future.result()
            results.append(result)
            marker = "ok" if result.status in {"written", "skipped"} else "fail"
            detail = f"{result.bytes_written} bytes" if result.bytes_written else result.error or ""
            print(f"[{marker}] {result.slug}: {result.status} {detail}".rstrip())

    write_manifest(args.brand, results, output_dir, cache_dir)
    update_metadata(args.brand, results)

    failed = [result for result in results if result.status == "failed"]
    print(
        json.dumps(
            {
                "brand": args.brand,
                "total": len(results),
                "html_snapshots": len(results) - len(failed),
                "failed": len(failed),
                "output_dir": str(output_dir),
            },
            indent=2,
        )
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
