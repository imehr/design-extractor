#!/usr/bin/env python3
"""
Download Board of Directors headshot photos from the Nine for Brands About page.

The site blocks direct downloads, so we navigate in a Playwright browser context
first, then use page.request.get() to fetch images with the browser's cookies/headers.
"""

import asyncio
import os
from pathlib import Path
from urllib.parse import urljoin

from playwright.async_api import async_playwright

OUTPUT_DIR = Path(
    "/Users/mehran/Documents/github/design-extractor/ui/public/brands/nineforbrands/directors"
)
URL = "https://www.nineforbrands.com.au/about/"


async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1440, "height": 900},
        )
        page = await context.new_page()

        print(f"Navigating to {URL}")
        await page.goto(URL, wait_until="domcontentloaded", timeout=60000)

        # Wait extra for lazy-loaded images
        print("Waiting 5s for lazy loading...")
        await page.wait_for_timeout(5000)

        # Scroll down to trigger any remaining lazy loads
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(2000)

        # ---- Strategy 1: Look for images inside circular containers ----
        # Find images whose parent/ancestor has border-radius >= 50% or relevant class names
        candidate_urls = []

        # Check for circular containers via computed style
        circular_imgs = await page.evaluate("""
            () => {
                const results = [];
                const imgs = document.querySelectorAll('img');
                for (const img of imgs) {
                    // Skip tiny images (icons, spacers)
                    const rect = img.getBoundingClientRect();
                    if (rect.width < 80 || rect.height < 80) continue;

                    // Check the image itself and up to 3 ancestors for border-radius
                    let el = img;
                    let isCircular = false;
                    let hasRelevantClass = false;
                    for (let i = 0; i < 4; i++) {
                        if (!el) break;
                        const style = window.getComputedStyle(el);
                        const br = style.borderRadius;
                        // Check for 50% or high pixel values relative to size
                        if (br === '50%' || br === '9999px' || br === '100%') {
                            isCircular = true;
                        }
                        // Also check for parsed numeric values
                        const brVal = parseFloat(br);
                        if (!isNaN(brVal) && brVal > 0) {
                            const parentRect = el.getBoundingClientRect();
                            if (brVal >= parentRect.width / 2 * 0.9) {
                                isCircular = true;
                            }
                        }
                        // Check clip-path for circle
                        const clip = style.clipPath;
                        if (clip && clip.includes('circle')) {
                            isCircular = true;
                        }
                        // Check class names
                        const cls = (el.className || '').toString().toLowerCase();
                        if (/round|circle|director|team|person|headshot|portrait|avatar|staff|bio/.test(cls)) {
                            hasRelevantClass = true;
                        }
                        el = el.parentElement;
                    }

                    if (isCircular || hasRelevantClass) {
                        const src = img.currentSrc || img.src;
                        if (src && !src.startsWith('data:')) {
                            results.push({
                                src: src,
                                width: rect.width,
                                height: rect.height,
                                alt: img.alt || '',
                                isCircular: isCircular,
                                hasRelevantClass: hasRelevantClass,
                            });
                        }
                    }
                }
                return results;
            }
        """)

        print(f"\nStrategy 1 (circular/class-based): found {len(circular_imgs)} images")
        for img in circular_imgs:
            print(f"  - {img['alt'][:50]:50s}  {img['width']:.0f}x{img['height']:.0f}  circular={img['isCircular']}  class={img['hasRelevantClass']}")
            if img["src"] not in candidate_urls:
                candidate_urls.append(img["src"])

        # ---- Strategy 2: Fallback - all decent-sized images in main content ----
        if len(candidate_urls) < 4:
            print("\nFallback: looking for all images > 100x100 in main content area...")
            fallback_imgs = await page.evaluate("""
                () => {
                    const results = [];
                    // Try to find main content area
                    const main = document.querySelector('main, .main, .content, .page-content, article, [role="main"]')
                                 || document.body;
                    const imgs = main.querySelectorAll('img');
                    for (const img of imgs) {
                        const rect = img.getBoundingClientRect();
                        if (rect.width < 100 || rect.height < 100) continue;
                        const src = img.currentSrc || img.src;
                        if (src && !src.startsWith('data:')) {
                            results.push({
                                src: src,
                                width: rect.width,
                                height: rect.height,
                                alt: img.alt || '',
                            });
                        }
                    }
                    return results;
                }
            """)

            print(f"  Found {len(fallback_imgs)} images in fallback")
            for img in fallback_imgs:
                print(f"  - {img['alt'][:50]:50s}  {img['width']:.0f}x{img['height']:.0f}")
                if img["src"] not in candidate_urls:
                    candidate_urls.append(img["src"])

        # ---- Strategy 3: Look specifically for srcset or data-src attributes ----
        if len(candidate_urls) < 4:
            print("\nStrategy 3: checking data-src and srcset attributes...")
            lazy_imgs = await page.evaluate("""
                () => {
                    const results = [];
                    const imgs = document.querySelectorAll('img[data-src], img[data-lazy-src], img[srcset], source[srcset]');
                    for (const img of imgs) {
                        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
                        const srcset = img.getAttribute('srcset') || '';
                        // Extract the highest resolution from srcset
                        let bestSrc = dataSrc;
                        if (srcset) {
                            const parts = srcset.split(',').map(s => s.trim().split(/\\s+/));
                            // Sort by descriptor (width or density), pick largest
                            let maxW = 0;
                            for (const [url, descriptor] of parts) {
                                const w = parseInt(descriptor) || 0;
                                if (w > maxW || !bestSrc) {
                                    maxW = w;
                                    bestSrc = url;
                                }
                            }
                        }
                        if (bestSrc && !bestSrc.startsWith('data:')) {
                            results.push({ src: bestSrc, alt: img.alt || '' });
                        }
                    }
                    return results;
                }
            """)
            print(f"  Found {len(lazy_imgs)} lazy/srcset images")
            for img in lazy_imgs:
                if img["src"] not in candidate_urls:
                    candidate_urls.append(img["src"])

        # Deduplicate and resolve relative URLs
        seen = set()
        unique_urls = []
        for url in candidate_urls:
            full_url = urljoin(URL, url)
            # Normalize - strip query params for dedup but keep for download
            base_url = full_url.split("?")[0]
            if base_url not in seen:
                seen.add(base_url)
                unique_urls.append(full_url)

        print(f"\n{'='*60}")
        print(f"Total unique candidate image URLs: {len(unique_urls)}")
        print(f"{'='*60}")

        # Download each image
        downloaded = []
        for i, url in enumerate(unique_urls, 1):
            filename = f"director-{i}.jpg"
            filepath = OUTPUT_DIR / filename
            print(f"\nDownloading [{i}/{len(unique_urls)}]: {url[:100]}...")

            try:
                response = await page.request.get(url, timeout=15000)
                if response.ok:
                    body = await response.body()
                    filepath.write_bytes(body)
                    size_kb = len(body) / 1024
                    print(f"  Saved: {filepath} ({size_kb:.1f} KB)")
                    downloaded.append((filename, len(body), url))
                else:
                    print(f"  Failed: HTTP {response.status}")
            except Exception as e:
                print(f"  Error: {e}")

        await browser.close()

    # Summary
    print(f"\n{'='*60}")
    print(f"DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Images downloaded: {len(downloaded)}")
    for filename, size, url in downloaded:
        print(f"  {filename:20s}  {size/1024:8.1f} KB  {url[:80]}")

    if len(downloaded) < 4:
        print(f"\nWARNING: Only {len(downloaded)} images downloaded (expected at least 4)")
    else:
        print(f"\nAll {len(downloaded)} director headshots downloaded.")


if __name__ == "__main__":
    asyncio.run(main())
