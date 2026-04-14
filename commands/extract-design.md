---
name: extract
description: Extract a complete design system from a URL — DOM content, assets, fonts, and React/shadcn component replicas validated by screenshot comparison. Produces DESIGN.md, SKILL.md, and installable brand components.
argument-hint: <url>
---

# /design-extractor:extract

Extract a complete design system from a URL and publish it to the local design library.

The user-supplied URL is: $ARGUMENTS

## Run the orchestrator

The entire pipeline is a single Python script. Run it:

```bash
python3 scripts/extract_brand.py --url $ARGUMENTS
```

This handles everything: URL verification, page identification, DOM extraction, asset download, replica building (via Claude), validation, publishing, and library registration. Each step validates its outputs before proceeding.

Add `--headed` if the site has bot detection (e.g., Woolworths, Akamai-protected sites).

If the script fails at the replica building step, it will print which files are missing. Fix them manually, then re-run with `--skip-existing` to continue from where it stopped.

## What the script does (for reference)

## Core principles (learned from production use)

1. **Extract, don't imagine** — every text string, link, icon, and image comes from the actual DOM, never fabricated from screenshots
2. **Download ALL assets** — images, fonts, SVGs, background images. Verify downloads are actual files, not HTML error pages
3. **Build with React/shadcn** — replicas are Next.js pages with shadcn/ui, Tailwind, and Lucide React icons. Never standalone HTML files
4. **Minimum 4-5 pages** — one page cannot capture the design essence. Extract home, product, contact, and 1-2 more
5. **Screenshot-validate every component** — capture original and replica at same viewport, compare, fix differences, repeat
6. **No emojis** — use SVG icons from Lucide React or extracted from the site. Never emoji characters
7. **No stale data** — when rebuilding, immediately update or remove old scores. Every visible metric must reflect current state
8. **Self-improving** — every issue found during extraction must update agent/skill files, not just be noted
9. **Verify original URLs before extraction** — test each URL returns 200, not a redirect or 404. Use `agent-browser open` + check the page title

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

### Step 1: Discover pages (recon-agent)

Dispatch `agents/recon-agent.md` to browse the target site and discover key pages:
- Navigates to the homepage with agent-browser
- Extracts all internal links
- Classifies into page types (homepage, listing, detail, contact, about)
- Captures reference screenshots
- Produces `{cache_dir}/page-manifest.json` with the page list

The recon-agent is scoped to **page discovery only** — it does not extract styles or tokens.

### Step 2: Extract DOM from each page (dom-extractor)

For each page in the manifest, dispatch `agents/dom-extractor.md` which uses agent-browser eval to perform the actual live DOM extraction:
- Header/nav: utility links, nav links, logo SVG
- Main content: headings, links, images, text
- Footer: links, social SVGs, legal text
- Fonts: @font-face declarations with source URLs
- Background images: CSS background-image URLs
- Computed styles: key measurements (heights, font sizes, colors, padding)

**`dom-extractor` is the primary extraction agent.** It handles the actual DOM measurement and style extraction via agent-browser eval — this is not done by recon-agent, token-extractor, or asset-extractor.

Output: `{cache_dir}/dom-extraction/{page-slug}.json` + reference screenshot per page

After extracting DOM, run DOM measurement to capture exact hero heights, content padding, and section positions for each page. Use agent-browser eval to measure bounding rects of key sections (hero, nav, content blocks, footer). Store in `{cache_dir}/dom-extraction/{page-slug}-measurements.json`.

### Step 3: Download ALL assets (asset-extractor)

Dispatch `agents/asset-extractor.md` to download assets found by dom-extractor:
- Reads `{cache_dir}/dom-extraction/*.json` for asset URLs
- Images: download to `{UI_DIR}/public/brands/{slug}/`
- Fonts: resolve relative URLs against stylesheet URL, download to `{UI_DIR}/public/brands/{slug}/fonts/`
- Social SVGs: extract from footer DOM, save to `{UI_DIR}/public/brands/{slug}/social/`
- Background images: download to `{UI_DIR}/public/brands/{slug}/`
- Logo SVG: extract inline from header DOM

**Verify every download**: run `file` command to confirm it's an actual asset, not an HTML error page.

The asset-extractor is scoped to **asset download and management** — it is a post-extraction step that reads what dom-extractor found.

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

1. Open the original URL with `agent-browser open {original-url}`, then capture with `agent-browser screenshot {cache_dir}/screenshots/reference/{page-slug}.png`
2. Open the replica URL with `agent-browser open http://localhost:3000/brands/{slug}/replica/{page-slug}`, then capture with `agent-browser screenshot {cache_dir}/screenshots/comparison/{page-slug}.png`
3. Compare the two screenshots visually
4. List every difference with exact values (wrong color, wrong spacing, wrong font, missing section, wrong content)
5. Fix each difference in the React component
6. Re-screenshot and re-compare
7. Repeat until the screenshots match

### Step 9: Component-level comparison

For key components (header, footer, hero):
1. Scroll the component into view on the original site, then `agent-browser screenshot {cache_dir}/screenshots/reference/{page-slug}-{component}.png`
2. Scroll the same component into view on the replica, then `agent-browser screenshot {cache_dir}/screenshots/comparison/{page-slug}-{component}.png`
3. Compare side-by-side
4. Fix differences

## Phase D — Validation harness loop

Run the validation harness to score all replicas:
```bash
python3 scripts/run_validation_loop.py --brand {slug} --base-url http://localhost:3000 --target 80
```

This captures screenshots of originals and replicas, runs pixel comparison, and writes:
- `~/.claude/design-library/brands/{slug}/validation/report.json` — gates and scores
- `~/.claude/design-library/cache/{slug}/validation/improvement-manifest.json` — pages that need work

If average score < 80%, dispatch the validation-monitor agent to improve replicas:
```
dispatch agents/validation-monitor.md with:
  slug = {slug}
  base_url = http://localhost:3000
  target = 80
```

The monitor will:
1. Read the improvement manifest
2. For each failing page, use agent-browser eval to measure original DOM
3. Dispatch parallel subagents to fix each page's React components
4. Re-run the harness
5. Loop until scores reach target or plateau

If the site is blocked by anti-bot protection, the improvement job will be blocked with `anti_bot_block`. If blocked, run `python3 scripts/ingest_assisted_capture.py --brand <slug> --screenshots-dir <dir>` to import manual captures, then re-run the improvement flow.

## Phase E — Publish artifacts

Before any manual steps, run the publish pipeline to generate all brand artifacts:
```bash
python3 scripts/publish_brand.py --brand {slug}
```

This generates:
- `design-tokens.json` — synthesized from DOM extraction measurements (colors, typography, spacing, layout)
- `design-tokens.css` — CSS custom properties for all tokens
- `DESIGN.md` — 9-section design system document
- `skill/SKILL.md` — installable brand skill with triggers and quick reference
- Updated `metadata.json` with publish flags

## Phase E (continued) — Publish

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
