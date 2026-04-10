# Component-First Extraction Method

**Date:** 2026-04-10
**Problem:** Replicas are fabricated from screenshots rather than extracted from DOM. Wrong text, wrong links, wrong assets. Visual similarity is cosmetic, not structural.

## The method

### Principle: Extract, don't imagine

Every piece of content in the replica must come from the actual DOM. No fabricated copy, no placeholder icons, no invented navigation links.

### Step 1: Component inventory from DOM

For each page, use agent-browser to:
1. Identify all semantic sections (header, nav, hero, main sections, footer)
2. For each section, extract:
   - Actual HTML structure (simplified)
   - All text content (innerText)
   - All image URLs (img src, background-image)
   - All inline SVGs (outerHTML)
   - All link hrefs and text
   - Computed styles (bg, padding, font sizes, colors)
   - Bounding box dimensions

### Step 2: Asset download

For each extracted asset:
- Download all `<img>` sources to `assets/images/`
- Save all inline SVGs to `assets/svgs/`
- Download CSS background-image URLs to `assets/backgrounds/`
- Capture social media icon SVGs verbatim
- Download favicon variants

### Step 3: Component-level screenshots

For each component on the original site:
```bash
agent-browser eval "document.querySelector('footer').scrollIntoView()"
agent-browser screenshot --clip "footer" footer-original.png
```

Do this ACROSS pages to verify the component is consistent:
- footer from homepage
- footer from credit cards page
- footer from contact page
Compare: are they identical? If yes, extract once. If different, document variants.

### Step 4: Build replica component using extracted data

Build each component using:
- Actual text from DOM extraction (not from screenshot reading)
- Actual SVG icons downloaded from the site
- Actual image URLs or downloaded copies
- Measured dimensions and computed styles
- Tailwind/shadcn classes mapping to extracted tokens

### Step 5: Component-level screenshot comparison

Screenshot JUST the replica component at the same viewport width.
Compare pixel-by-pixel with the original component screenshot.
Identify specific differences.

### Step 6: Fix differences one-by-one

Each difference gets a specific fix:
- Wrong link text -> update from DOM extraction
- Wrong icon -> replace with extracted SVG
- Wrong spacing -> update from computed styles
- Wrong color -> update from computed styles

### What changes in the agents

| Agent | Old approach | New approach |
|-------|------------|-------------|
| replica-builder | Read tokens JSON, generate blind HTML | Extract actual DOM per component, download assets, build from real content |
| visual-critic | Compare tiny component crops | Compare component-level screenshots at same viewport |
| asset-extractor | Only logos and favicons | ALL images, SVGs, background images, social icons |
| refinement-agent | Tweak CSS values from critique | Replace fabricated content with extracted content |

### Evaluation improvements

1. **Component isolation**: Score each component independently (header, hero, cards, footer)
2. **Content accuracy**: Check that every text string in the replica exists in the DOM extraction
3. **Asset matching**: Check that every image/SVG in the replica was extracted from the site
4. **Layout comparison**: Compare component bounding boxes (width, height, position)
5. **Cross-page consistency**: Same component on different pages should produce same replica

### Demo: Footer extraction

Extract footer from 3 pages, compare, build one accurate footer component, verify.

Pages: homepage, credit cards, contact us
Expected: footer is identical across all three (shared layout)
Method: Extract DOM content from each, diff, build replica from extracted data, screenshot compare
