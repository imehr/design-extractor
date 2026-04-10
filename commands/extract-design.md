---
name: extract
description: Extract a complete design system from a URL — DOM content, assets, fonts, and React/shadcn component replicas validated by screenshot comparison. Produces DESIGN.md, SKILL.md, and installable brand components.
argument-hint: <url>
---

# /design-extractor:extract

Extract a complete design system from a URL and publish it to the local design library.

The user-supplied URL is: $ARGUMENTS

## Core principles (learned from production use)

1. **Extract, don't imagine** — every text string, link, icon, and image comes from the actual DOM, never fabricated from screenshots
2. **Download ALL assets** — images, fonts, SVGs, background images. Verify downloads are actual files, not HTML error pages
3. **Build with React/shadcn** — replicas are Next.js pages with shadcn/ui, Tailwind, and Lucide React icons. Never standalone HTML files
4. **Minimum 4-5 pages** — one page cannot capture the design essence. Extract home, product, contact, and 1-2 more
5. **Screenshot-validate every component** — capture original and replica at same viewport, compare, fix differences, repeat
6. **No emojis** — use SVG icons from Lucide React or extracted from the site. Never emoji characters
7. **No stale data** — when rebuilding, immediately update or remove old scores. Every visible metric must reflect current state
8. **Self-improving** — every issue found during extraction must update agent/skill files, not just be noted

## Setup

Derive the slug from the URL:
- `https://www.westpac.com.au` → `westpac-com-au`
- `https://linear.app` → `linear-app`

Variables:
- `url` = the full URL
- `slug` = the derived slug
- `cache_dir` = `~/.claude/design-library/cache/{slug}`
- `PLUGIN_DIR` = the plugin directory
- `UI_DIR` = `{PLUGIN_DIR}/ui`

Create directories:
```bash
mkdir -p {cache_dir}/{dom-extraction,screenshots/reference,screenshots/comparison,assets/images,assets/fonts,assets/social-icons,validation}
mkdir -p {UI_DIR}/public/brands/{slug}/{fonts,social}
mkdir -p {UI_DIR}/components/brands/{slug}
mkdir -p {UI_DIR}/app/brands/{slug}/replica
```

## Phase A — Multi-page DOM extraction

### Step 1: Identify key pages (4-5 minimum)

Navigate to the homepage with agent-browser. Extract all internal links. Classify into page types:
- Homepage (required)
- Product/service listing (required)
- Product/service detail
- Contact/support (required)
- About/info
- Any page with forms, tables, or unique layouts

### Step 2: Extract DOM from each page

For each page, dispatch `agents/dom-extractor.md` which uses agent-browser eval to extract:
- Header/nav: utility links, nav links, logo SVG
- Main content: headings, links, images, text
- Footer: links, social SVGs, legal text
- Fonts: @font-face declarations with source URLs
- Background images: CSS background-image URLs
- Computed styles: key measurements (heights, font sizes, colors, padding)

Output: `{cache_dir}/dom-extraction/{page-slug}.json` + reference screenshot per page

### Step 3: Download ALL assets

For each unique asset found across all pages:
- Images: download to `{UI_DIR}/public/brands/{slug}/`
- Fonts: resolve relative URLs against stylesheet URL, download to `{UI_DIR}/public/brands/{slug}/fonts/`
- Social SVGs: extract from footer DOM, save to `{UI_DIR}/public/brands/{slug}/social/`
- Background images: download to `{UI_DIR}/public/brands/{slug}/`
- Logo SVG: extract inline from header DOM

**Verify every download**: run `file` command to confirm it's an actual asset, not an HTML error page.

### Step 4: Register fonts

Add `@font-face` declarations to `{UI_DIR}/app/globals.css` for each custom font downloaded.

## Phase B — React/shadcn component replicas

### Step 5: Build shared components

Create shared brand components at `{UI_DIR}/components/brands/{slug}/`:
- `{brand}-logo.tsx` — SVG logo as React component
- `{brand}-header.tsx` — using shadcn NavigationMenu, Button, Lucide Search icon. Include active page state with red underline. Full-width bars.
- `{brand}-footer.tsx` — using extracted link columns, real social SVGs, legal text, any artwork. Separator component.

Every text string in these components must come from the DOM extraction JSON.

### Step 6: Build per-page replicas

For each extracted page, create a Next.js page at `{UI_DIR}/app/brands/{slug}/replica/{page-slug}/page.tsx`:
- Import shared header/footer components
- Build page-specific sections using extracted headings, text, links, images
- Use shadcn Card, Button, Input, Separator, Badge, Tabs where appropriate
- Use Lucide React icons for generic icons
- Use downloaded images via `/brands/{slug}/filename` paths
- Use real custom fonts via the fontFamily CSS property

### Step 7: TypeScript verification
```bash
cd {UI_DIR} && npx tsc --noEmit
```
Fix any type errors before proceeding.

## Phase C — Screenshot validation

### Step 8: Compare each page

For each replicated page:

1. Navigate agent-browser to the original URL, screenshot the viewport
2. Navigate agent-browser to the replica URL (localhost:3000/brands/{slug}/replica/...), screenshot the viewport
3. Compare the two screenshots visually
4. List every difference with exact values (wrong color, wrong spacing, wrong font, missing section, wrong content)
5. Fix each difference in the React component
6. Re-screenshot and re-compare
7. Repeat until the screenshots match

### Step 9: Component-level comparison

For key components (header, footer, hero):
1. Scroll the component into view on the original site, screenshot
2. Scroll the same component into view on the replica, screenshot
3. Compare side-by-side
4. Fix differences

## Phase D — Publish

### Step 10: Extract tokens from successful replicas

Now that the replicas are visually accurate, extract design tokens FROM them:
- Color palette (from the extracted computed styles)
- Typography scale
- Spacing values
- Border radii
- Shadows
- Motion/transitions

### Step 11: Generate DESIGN.md

Dispatch `agents/documentarian.md` to produce the canonical design system document from extracted tokens, patterns, voice analysis, and validated replica data.

### Step 12: Generate SKILL.md

Dispatch `agents/skill-packager.md` to produce the installable per-brand skill with positive/negative triggers.

### Step 13: Register in library

Update `~/.claude/design-library/index.json` and write `metadata.json` with:
- Score: null (pending proper evaluation) or computed from screenshot comparison
- Confidence: based on extraction quality
- Pages extracted/replicated counts
- replica_type: "react_shadcn"

### Step 14: Update brand detail page

Ensure the Replica tab at `/brands/{slug}` links to the React pages, not HTML iframes. Verify the Overview tab shows current tokens. Remove any stale scores.

## Completion

Report:
1. Brand slug and library path
2. Pages extracted and replicated
3. Components built (shared + per-page)
4. Assets downloaded (images, fonts, SVGs)
5. Any degraded signals or missing content
6. Links to the replica pages at localhost:3000
