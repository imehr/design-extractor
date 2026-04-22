#!/usr/bin/env python3
"""
Brand Kit Extractor — path-probe first, Firecrawl/SerpAPI optional.

Discovers official press-kit / brand-guidelines pages via cheap HTTP path
probing on the source origin. Falls back to SerpAPI only when probing turns
up nothing AND the key is present.

Scrape preference: Firecrawl > Cloudflare Browser Rendering > plain urllib.
Each tier falls back on failure, so zero configuration still works.

Env (all optional — .env at repo root is auto-loaded):
    FIRECRAWL_API_KEY     — https://firecrawl.dev/ (managed headless browser)
    CLOUDFLARE_API_TOKEN  — alternative managed headless browser
    CLOUDFLARE_ACCOUNT_ID — paired with CLOUDFLARE_API_TOKEN
    SERP_API_KEY          — https://serpapi.com/ (last-resort discovery)

Usage:
    python3 scripts/brand_kit_extractor.py \\
        --brand-name "OpenAI" \\
        --slug openai-com \\
        --source-url https://openai.com \\
        --cache-dir ~/.claude/design-library/cache/openai-com \\
        --ui-dir /path/to/design-extractor/ui \\
        [--limit 40]

Exit codes:
    0  — success, empty, not_found, or gracefully skipped
    1  — hard failure (bad args)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

# Load .env at repo root before reading any os.environ keys. Stdlib-only loader.
try:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from env_loader import load_env
    load_env()
except Exception:
    pass  # .env support is best-effort — shell exports still work

SERP_ENDPOINT = "https://serpapi.com/search.json"
FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v1/scrape"
USER_AGENT = "design-extractor/1.0"

IMG_EXTS = (
    ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif",
    ".ico", ".eps", ".ai", ".pdf", ".zip",
)

PRESS_KIT_PATHS = [
    "/brand", "/brand-assets", "/brand-kit", "/brand-guidelines",
    "/press", "/press-kit", "/media", "/media-kit", "/newsroom",
    "/about/brand", "/identity", "/style-guide", "/logos",
    "/resources/brand", "/company/brand", "/company/press",
    "/assets/brand",
]


def log(msg: str) -> None:
    print(f"[brand-kit] {msg}", flush=True)


def http_get_json(url: str, timeout: int = 30) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_post_json(url: str, body: dict, headers: dict, timeout: int = 60) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json", **headers},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download(url: str, dest: Path, timeout: int = 30) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(resp.read())
        return True
    except Exception as e:
        log(f"download failed {url}: {e}")
        return False


def strip_cdn_resize(url: str) -> str:
    """Remove common CDN resize params so we get the high-fidelity source.

    Params dropped: w, h, width, height, quality, q, auto, fit, dpr.
    """
    parsed = urlparse(url)
    if not parsed.query:
        return url
    keep = [
        p for p in parsed.query.split("&")
        if not re.match(r"^(w|h|width|height|quality|q|auto|fit|dpr)=", p)
    ]
    new_query = "&".join(keep)
    return parsed._replace(query=new_query).geturl()


def probe_press_kit_paths(source_url: str, timeout: int = 5) -> list[str]:
    """Probe common press-kit paths on the source origin. Return full URLs of 200s.

    Follows redirects. If a redirect lands off-origin (e.g. brand.example.com or a
    Notion doc), the resolved URL is still kept — brands sometimes host press
    kits on separate subdomains.
    """
    parsed = urlparse(source_url)
    if not parsed.scheme or not parsed.netloc:
        log(f"invalid --source-url {source_url!r}; skipping probe")
        return []

    origin = f"{parsed.scheme}://{parsed.netloc}"
    found: list[str] = []
    seen: set[str] = set()

    for path in PRESS_KIT_PATHS:
        probe_url = origin + path
        req = urllib.request.Request(
            probe_url,
            headers={"User-Agent": USER_AGENT},
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                final_url = resp.geturl()
                status = resp.status
                # Read a tiny bit to confirm the body is reachable, then close.
                try:
                    resp.read(1)
                except Exception:
                    pass
            if status == 200 and final_url not in seen:
                seen.add(final_url)
                found.append(final_url)
                log(f"  probe hit: {path} -> {final_url}")
        except urllib.error.HTTPError as e:
            # 404/403/etc — not a press-kit page on this path
            if e.code == 200:  # unlikely but defensive
                if probe_url not in seen:
                    seen.add(probe_url)
                    found.append(probe_url)
        except Exception:
            # Connection refused, DNS error, timeout — move on silently
            pass

    return found


def discover_brand_page(brand_name: str, serp_key: str) -> list[str]:
    """Last-resort: use SerpAPI Google search to find press kit pages."""
    queries = [
        f'"{brand_name}" press kit',
        f'"{brand_name}" brand guidelines',
        f'"{brand_name}" brand assets',
        f'"{brand_name}" logo download',
    ]
    urls: list[str] = []
    for q in queries:
        params = urllib.parse.urlencode({
            "q": q,
            "api_key": serp_key,
            "engine": "google",
            "num": 5,
        })
        try:
            data = http_get_json(f"{SERP_ENDPOINT}?{params}")
            for r in data.get("organic_results", [])[:3]:
                link = r.get("link", "")
                if link:
                    urls.append(link)
        except Exception as e:
            log(f"serp query failed '{q}': {e}")

    seen: set[str] = set()
    preferred: list[str] = []
    fallback: list[str] = []
    for u in urls:
        if u in seen:
            continue
        seen.add(u)
        if re.search(
            r"/(brand|press|media|assets|logo|identity|style-guide|guidelines)\b",
            u,
            re.I,
        ):
            preferred.append(u)
        else:
            fallback.append(u)
    return (preferred + fallback)[:6]


def scrape_with_firecrawl(url: str, firecrawl_key: str) -> dict | None:
    """Scrape a page via Firecrawl v1, returning the parsed response."""
    body = {
        "url": url,
        "formats": ["markdown", "html"],
        "onlyMainContent": False,
    }
    try:
        return http_post_json(
            FIRECRAWL_ENDPOINT,
            body,
            {"Authorization": f"Bearer {firecrawl_key}"},
        )
    except Exception as e:
        log(f"firecrawl scrape failed {url}: {e}")
        return None


def scrape_with_cloudflare(url: str, api_token: str, account_id: str) -> dict | None:
    """Scrape via Cloudflare Browser Rendering /content endpoint.

    Returns the HTML body wrapped in the same shape Firecrawl does:
      {"data": {"html": "...", "markdown": ""}}
    so the downstream asset extractor is unchanged.
    """
    endpoint = (
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}"
        "/browser-rendering/content"
    )
    try:
        resp = http_post_json(
            endpoint,
            {"url": url},
            {"Authorization": f"Bearer {api_token}"},
        )
    except Exception as e:
        log(f"cloudflare scrape failed {url}: {e}")
        return None
    if not resp.get("success"):
        errors = resp.get("errors") or resp.get("messages") or "<no error detail>"
        log(f"cloudflare scrape error {url}: {errors}")
        return None
    html = resp.get("result", "") or ""
    if not html:
        return None
    return {"data": {"html": html, "markdown": ""}}


def scrape_plain(url: str, timeout: int = 20) -> dict | None:
    """Fallback scraper: stdlib-only. Returns same shape Firecrawl does."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        return {"data": {"html": html, "markdown": ""}}
    except Exception as e:
        log(f"plain scrape failed {url}: {e}")
        return None


def scrape_page(
    url: str,
    firecrawl_key: str | None,
    cloudflare_token: str | None = None,
    cloudflare_account: str | None = None,
) -> dict | None:
    """Preference: Firecrawl > Cloudflare Browser Rendering > plain urllib.
    Each tier falls back on failure so one misconfigured key doesn't block extraction.
    """
    if firecrawl_key:
        resp = scrape_with_firecrawl(url, firecrawl_key)
        if resp is not None:
            return resp
        log(f"firecrawl failed, trying next scraper for {url}")
    if cloudflare_token and cloudflare_account:
        resp = scrape_with_cloudflare(url, cloudflare_token, cloudflare_account)
        if resp is not None:
            return resp
        log(f"cloudflare failed, falling back to plain scraper for {url}")
    return scrape_plain(url)


def extract_asset_urls(firecrawl_response: dict, base_url: str) -> list[str]:
    """Pull image/asset URLs from the scrape payload."""
    urls: set[str] = set()
    data = firecrawl_response.get("data", firecrawl_response)
    html = data.get("html", "") or ""
    md = data.get("markdown", "") or ""

    for src in re.findall(r'src=["\']([^"\']+)["\']', html):
        urls.add(src)
    for href in re.findall(r'href=["\']([^"\']+)["\']', html):
        if href.lower().split("?")[0].endswith(IMG_EXTS):
            urls.add(href)
    for match in re.findall(r'\]\(([^)]+)\)', md):
        if match.lower().split("?")[0].endswith(IMG_EXTS):
            urls.add(match)

    resolved: list[str] = []
    for u in urls:
        if u.startswith("data:") or u.startswith("#"):
            continue
        if u.startswith(("http://", "https://")):
            resolved.append(u)
        elif u.startswith("//"):
            resolved.append("https:" + u)
        elif u.startswith("/"):
            resolved.append(urljoin(base_url, u))
        else:
            resolved.append(urljoin(base_url, u))
    return resolved


def safe_filename(url: str) -> str:
    name = os.path.basename(urlparse(url).path) or "asset"
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name[:120] or "asset"


def write_report(cache_kit_dir: Path, report: dict) -> None:
    cache_kit_dir.mkdir(parents=True, exist_ok=True)
    (cache_kit_dir / "report.json").write_text(json.dumps(report, indent=2))


def write_status(cache_kit_dir: Path, status: dict) -> None:
    cache_kit_dir.mkdir(parents=True, exist_ok=True)
    (cache_kit_dir / "status.json").write_text(json.dumps(status, indent=2))


def merge_inventory(cache_dir: Path, downloaded_count: int,
                    pages_scraped: list[str], all_assets: list[dict]) -> None:
    inv_path = cache_dir / "assets-inventory.json"
    if not inv_path.exists():
        return
    try:
        inv = json.loads(inv_path.read_text())
        inv["brand_kit"] = {
            "downloaded": downloaded_count,
            "pages": pages_scraped,
            "files": [a["filename"] for a in all_assets if a["downloaded"]],
        }
        inv_path.write_text(json.dumps(inv, indent=2))
        log(f"merged brand_kit section into {inv_path}")
    except Exception as e:
        log(f"inventory merge failed: {e}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-name", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--cache-dir", required=True, type=Path)
    ap.add_argument("--ui-dir", required=True, type=Path)
    ap.add_argument(
        "--source-url",
        default=None,
        help="Target site URL for path-probe discovery (e.g. https://openai.com).",
    )
    ap.add_argument("--limit", type=int, default=40)
    args = ap.parse_args()

    cache_dir = args.cache_dir.expanduser()
    ui_dir = args.ui_dir.expanduser()

    serp_key = os.environ.get("SERP_API_KEY")
    firecrawl_key = os.environ.get("FIRECRAWL_API_KEY")
    cloudflare_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    cloudflare_account = os.environ.get("CLOUDFLARE_ACCOUNT_ID")

    cache_kit_dir = cache_dir / "brand-kit"
    cache_kit_dir.mkdir(parents=True, exist_ok=True)

    # True skip: no source URL means we can't path-probe and have nothing else.
    if not args.source_url and not serp_key:
        log("skipped — no --source-url and no SERP_API_KEY fallback")
        write_status(cache_kit_dir, {
            "status": "skipped",
            "reason": "no --source-url provided and SERP_API_KEY not set",
        })
        return 0

    if not args.source_url:
        log("no --source-url provided; path probing disabled, will try SerpAPI")

    # Phase 1: path-probe
    candidate_pages: list[str] = []
    discovery_method = "none"
    if args.source_url:
        log(f"path-probing press-kit paths on {args.source_url}")
        candidate_pages = probe_press_kit_paths(args.source_url)
        log(f"path probe found {len(candidate_pages)} candidate page(s)")
        if candidate_pages:
            discovery_method = "path-probe"

    # Phase 2: SerpAPI fallback — only if probing found nothing and key is set
    if not candidate_pages and serp_key:
        log(f"falling back to SerpAPI discovery for {args.brand_name!r}")
        candidate_pages = discover_brand_page(args.brand_name, serp_key)
        log(f"serpapi found {len(candidate_pages)} candidate page(s)")
        if candidate_pages:
            discovery_method = "serpapi"

    # Skip path: no source-url AND SerpAPI found nothing (rare — handled above too)
    if not args.source_url and not candidate_pages:
        write_status(cache_kit_dir, {
            "status": "skipped",
            "reason": "no --source-url provided and SerpAPI fallback empty",
        })
        return 0

    out_dir = ui_dir / "public" / "brands" / args.slug / "brand-kit"

    # If nothing was discovered through either method, emit a not_found report.
    if not candidate_pages:
        report = {
            "status": "not_found",
            "brand_name": args.brand_name,
            "source_url": args.source_url,
            "discovery_method": "none",
            "pages_discovered": [],
            "pages_scraped": [],
            "assets": [],
            "download_dir": str(out_dir),
            "downloaded_count": 0,
        }
        write_report(cache_kit_dir, report)
        log("done — no press-kit pages discovered (path-probe + SerpAPI)")
        return 0

    out_dir.mkdir(parents=True, exist_ok=True)

    all_assets: list[dict] = []
    pages_scraped: list[str] = []
    if firecrawl_key:
        scrape_mode = "firecrawl"
    elif cloudflare_token and cloudflare_account:
        scrape_mode = "cloudflare"
    else:
        scrape_mode = "plain"
    log(f"scraping candidates with {scrape_mode}")

    # Cap scraping at 3 pages to match prior budget.
    for page_url in candidate_pages[:3]:
        log(f"scraping {page_url}")
        resp = scrape_page(page_url, firecrawl_key, cloudflare_token, cloudflare_account)
        if not resp:
            continue
        pages_scraped.append(page_url)
        asset_urls = extract_asset_urls(resp, page_url)
        log(f"  {len(asset_urls)} asset URL(s) found")
        for aurl in asset_urls[: args.limit]:
            clean = strip_cdn_resize(aurl)
            fname = safe_filename(clean)
            dest = out_dir / fname
            if dest.exists():
                all_assets.append({
                    "source_url": clean,
                    "source_page": page_url,
                    "filename": fname,
                    "downloaded": True,
                    "note": "already existed",
                })
                continue
            ok = download(clean, dest)
            all_assets.append({
                "source_url": clean,
                "source_page": page_url,
                "filename": fname,
                "downloaded": ok,
            })

    downloaded_count = sum(1 for a in all_assets if a["downloaded"])
    status = "ok" if downloaded_count > 0 else "empty"

    report = {
        "status": status,
        "brand_name": args.brand_name,
        "source_url": args.source_url,
        "discovery_method": discovery_method,
        "scrape_mode": scrape_mode,
        "pages_discovered": candidate_pages,
        "pages_scraped": pages_scraped,
        "assets": all_assets,
        "download_dir": str(out_dir),
        "downloaded_count": downloaded_count,
    }
    write_report(cache_kit_dir, report)
    log(
        f"done — status={status}, {downloaded_count}/{len(all_assets)} "
        f"downloaded to {out_dir}"
    )

    merge_inventory(cache_dir, downloaded_count, pages_scraped, all_assets)
    return 0


if __name__ == "__main__":
    sys.exit(main())
