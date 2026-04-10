# Full Plugin Overhaul Plan

**Date:** 2026-04-10
**Goal:** Transform design-extractor from a token-scraping tool into a visual-first design system extractor that produces pixel-accurate shadcn/React component replicas, validated by screenshot comparison.

## What needs to change

### 1. Extraction method: DOM extraction, not screenshot imagination

**Current:** Look at screenshot, fabricate HTML from description
**Target:** Extract actual DOM structure, text, links, assets per component via agent-browser eval

For each page:
- Navigate with agent-browser
- For each component (header, hero, content, footer): extract innerHTML, innerText, all links, all images, all SVGs, computed styles, bounding boxes
- Download ALL assets: images, SVGs, backgrounds, social icons
- Save extracted data as JSON per component per page

### 2. Replicas: shadcn/React components, not raw HTML

**Current:** Standalone HTML files with inline styles and Tailwind CDN
**Target:** React components in the `ui/` Next.js app using shadcn/ui, Tailwind, and Lucide React icons

Structure:
```
ui/app/brands/[slug]/replica/
  layout.tsx          -- shared layout with extracted header/footer
  page.tsx            -- homepage replica
  credit-cards/page.tsx
  contact-us/page.tsx
  home-loans/page.tsx
  bank-accounts/page.tsx

ui/components/brands/westpac/
  westpac-header.tsx   -- shadcn: NavigationMenu, Button, DropdownMenu
  westpac-footer.tsx   -- shadcn: Separator, links
  westpac-hero.tsx     -- extracted hero with real copy
  westpac-cards.tsx    -- shadcn: Card components
  westpac-form.tsx     -- shadcn: Input, Select, Button
  westpac-sidebar.tsx  -- shadcn: navigation sidebar
```

Icons: Use Lucide React for generic icons (Search, Phone, Home, CreditCard, etc.). Use extracted SVGs for brand-specific assets (Westpac W logo, social icons).

### 3. Multi-page extraction (minimum 5 pages)

Pages to extract:
1. Homepage (/)
2. Credit Cards (/personal-banking/credit-cards/)
3. Contact Us (/contact-us/)
4. Home Loans (/personal-banking/home-loans/)
5. Bank Accounts (/personal-banking/bank-accounts/)

For each page:
- Full DOM extraction per component
- Asset download
- Reference screenshot at 1440px
- Component-level screenshots

### 4. Evaluation: component-level screenshot comparison

**Current:** Compare tiny DOM element crops against full-width replica sections
**Target:** Compare component screenshots at same viewport between original and replica

Process:
1. Screenshot each component on the original site (scroll into view, capture)
2. Screenshot the same component in the replica
3. Pixel-compare at same dimensions
4. LLM structural critique of differences
5. Score per component, aggregate to page score

### 5. UI: Full design system viewer

The brand detail page at `/brands/[slug]` must show:

**Overview tab:**
- Brand name, logo, source URL, extraction date
- Score badge with confidence
- At-a-glance summary (color palette swatches, font stack preview, spacing scale visual)
- Key metrics: pages extracted, components replicated, overall score

**DESIGN.md tab:**
- Rendered markdown (not raw pre tag) -- use a markdown renderer
- All sections: tokens, patterns, components, voice, relationships

**Tokens tab:**
- Color palette with visual swatches (hex + name + confidence badge)
- Typography scale with live previews
- Spacing scale visual ruler
- Border radius previews (rounded boxes)
- Shadow elevation previews
- Motion/transition previews

**Components tab:**
- Per-component: original screenshot | replica screenshot | diff
- Score per component
- Live rendered shadcn component below each comparison

**Replica tab:**
- Iframe or embedded render of each replicated page
- Page selector to switch between homepage, credit cards, contact, etc.
- Side-by-side toggle: original screenshot | replica

**Assets tab:**
- Logo SVG rendered
- Favicon variants
- Social icons
- All downloaded images with source URLs

**Skill tab:**
- Rendered SKILL.md
- Copy button
- Install command

**Validation tab:**
- Score trail per iteration
- Per-component pass/fail table
- Blocking failures
- Comparison images (before/after per iteration)

**Raw Files tab:**
- Directory tree of all brand files
- Click to view any file

### 6. Agent updates

| Agent | Key change |
|-------|-----------|
| replica-builder | Extract DOM per component, build shadcn React components |
| asset-extractor | Download ALL images, SVGs, backgrounds, not just logos |
| visual-critic | Compare component screenshots, not full pages |
| refinement-agent | Fix extracted content mismatches, not CSS tweaks |
| pattern-analyst | Compute from successful replica CSS, not raw tokens |

### 7. Skill updates

| Skill | Key change |
|-------|-----------|
| design-extraction | Document DOM extraction method, multi-page requirement |
| visual-diff | Component-level comparison, not full-page |
| shadcn-replication | New: build shadcn components from extracted data |

## Execution order

### Phase 1: DOM extraction infrastructure
- [ ] Build extraction script that uses agent-browser eval to extract per-component data
- [ ] Build asset downloader that saves all images/SVGs/backgrounds
- [ ] Extract 5 westpac pages, save JSON + assets

### Phase 2: shadcn component replicas
- [ ] Build shared westpac-header component (shadcn NavigationMenu + Button)
- [ ] Build shared westpac-footer component
- [ ] Build per-page components (hero variants, card grids, sidebars, forms)
- [ ] Wire up as Next.js pages under ui/app/brands/[slug]/replica/

### Phase 3: Evaluation pipeline
- [ ] Component-level screenshot capture (original + replica)
- [ ] Pixel comparison at matching viewports
- [ ] LLM structural critique per component
- [ ] Score aggregation

### Phase 4: UI enrichment
- [ ] Markdown renderer for DESIGN.md tab
- [ ] Token viewer with visual swatches
- [ ] Component comparison view (original | replica | diff)
- [ ] Multi-page replica selector
- [ ] Asset gallery
- [ ] Validation score trail

### Phase 5: Agent/skill updates
- [ ] Update all agent .md files with new methodology
- [ ] Update skill descriptions and triggers
- [ ] Update extract-design command with new pipeline flow
- [ ] Re-generate DESIGN.md and SKILL.md from improved data
