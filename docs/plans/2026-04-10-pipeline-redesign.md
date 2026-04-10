# Pipeline Redesign: Visual-First Screenshot Comparison

**Date:** 2026-04-10
**Trigger:** Westpac extraction produced a replica with zero resemblance to the actual site. Root cause: the pipeline builds from tokens (blind to layout) instead of building from screenshots (matching visual reality).

## Gap Analysis

### What the current pipeline does (wrong)

```
tokens → generate blind → compare → tweak colours → declare done
```

1. Extract tokens (colours, spacing, radii) from computed styles
2. Generate a "component showcase" page from tokens alone — no reference to what the site actually looks like
3. Pixel-compare tiny component crops (36x36px card vs full-width section) — meaningless scores
4. Refinement loop tweaks colours/spacing but cannot fix fundamentally wrong page structure
5. Result: a design-system documentation page, not a replica of the actual site

### What the pipeline should do (user's vision)

```
screenshot all pages → replicate each in shadcn → screenshot replica → compare → fix diffs → repeat until identical
```

1. Use agent-browser to capture full-page screenshots of ALL key pages (home, product, form, etc.)
2. For each page, an agent LOOKS at the screenshot and builds a shadcn/Tailwind replica that matches the visual layout
3. Screenshot the replica at the same viewport
4. Side-by-side comparison (pixel + structural)
5. Identify SPECIFIC differences (wrong colour at this element, wrong spacing here, missing logo there)
6. Fix each difference surgically
7. Repeat until the screenshots are identical
8. THEN extract tokens from the successful replica as a byproduct

### Five root-cause failures

| # | Failure | Root cause | Fix |
|---|---------|-----------|-----|
| 1 | Logo not extracted | SVG tagName case bug | Fixed (toUpperCase) |
| 2 | Replica layout wrong | Builder generates from tokens, never looks at screenshots | Builder must READ reference screenshots as primary input |
| 3 | Component score meaningless | Reference captures are tiny DOM elements (36x36), replica captures are full sections | Compare full-page screenshots at same viewport, not component crops |
| 4 | No shadcn components | Replica uses raw Tailwind CDN, not shadcn/ui | Build replica as a Next.js page with shadcn components |
| 5 | Single page only | Only extracts homepage | Capture and replicate multiple page types |

## Revised Pipeline Design

### Phase A: Capture (multi-page)

```
1. recon-agent         → browse site, identify key page URLs
2. screenshot-agent    → agent-browser captures of each page at 1440px
                         Output: screenshots/reference/{page-slug}-desktop.png
3. page-classifier     → for each screenshot, describe:
                         - layout structure (header, hero, grid, footer)
                         - component inventory (nav type, card type, form type)
                         - colour dominant regions
                         - typography observations
```

### Phase B: Replicate (per-page shadcn build)

```
4. For each key page:
   a. replica-builder  → READ the reference screenshot
                         BUILD a shadcn/Tailwind page matching it
                         USE extracted logo SVG
                         Output: replica/{page-slug}.html

   b. screenshot-agent → capture replica at same viewport
                         Output: screenshots/replica/{page-slug}-desktop.png
```

### Phase C: Compare & Fix (iterative loop per page)

```
5. While not identical AND iteration < 10:
   a. visual-critic    → LOOK at both screenshots side by side
                         List EVERY difference with exact values
                         Priority: layout > colours > spacing > typography > images

   b. fix-agent        → Fix each difference in order of priority
                         One Edit per difference
                         Re-screenshot after fixes

   c. Score            → pixel-compare full-page screenshots
                         If score > 0.95 → done
                         If plateau → done
```

### Phase D: Extract & Publish

```
6. token-extractor     → extract tokens FROM the successful replica CSS
                         (tokens are now a byproduct, not the input)
7. pattern-analyst     → compute signals from tokens + screenshots
8. voice-analyst       → unchanged
9. documentarian       → DESIGN.md from all data
10. skill-packager     → per-brand SKILL.md
11. librarian          → register in library
```

### Key architectural changes

1. **Screenshots are the source of truth**, not computed styles
2. **Replica-builder reads screenshots** as primary input, not token JSON
3. **Full-page comparison** at matching viewports, not component crops
4. **shadcn/ui components** for the replica, not raw Tailwind CDN
5. **Multi-page capture** (home, product, form pages)
6. **Tokens are extracted FROM the replica** after visual convergence, not before

### Agent changes needed

| Agent | Current | Proposed |
|-------|---------|----------|
| recon-agent | Playwright recon + basic screenshots | agent-browser multi-page capture with cookie dismissal |
| replica-builder | Generate from tokens (blind) | READ screenshot + build matching shadcn page |
| visual-critic | Compare component crops | Compare full-page screenshots, cite exact pixel locations |
| refinement-agent | Tweak CSS values | Surgical edits per identified difference |
| token-extractor | Run first (input to builder) | Run last (extract from successful replica) |
| screenshot-agent | NEW | agent-browser capture of replica pages |
| page-classifier | NEW | Describe layout/components from screenshot |

## Execution order

1. Capture westpac.com.au key pages with agent-browser (home, personal banking, credit cards)
2. For homepage: build shadcn replica matching the screenshot
3. Screenshot replica, compare, identify diffs
4. Fix diffs one by one
5. Repeat until matching
6. Then extract tokens from the successful replica
