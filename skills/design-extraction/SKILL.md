---
name: design-extraction
description: "Extract complete design systems from live URLs via DOM extraction, asset downloading, and React/shadcn component replication validated by screenshot comparison. Trigger on 'extract design system from URL'; 'extract design tokens from this site'; 'what does this site look like'; 'reverse-engineer this brand'; 'pull the design system out of <url>'; 'clone the look of <site>'; 'replicate this website'; 'build a local version of <url>'; 'capture the visual language of this page'; 'mine tokens from <url>'. Do NOT trigger for: 'design from scratch', 'create a new brand', greenfield visual design work, logo creation, or brand strategy with no source URL."
---

# Design Extraction

## When this skill is active

- User supplies a live URL and asks for its colours, type scale, spacing, components, or voice
- Existing brand/site needs to be reverse-engineered into reusable tokens and React components
- A screenshot + URL is provided with "make this into a design system"
- Migration work where the source of truth is a deployed site, not a Figma file
- User wants a local replica of a website built with shadcn/React

## Core principles

1. **Extract, don't imagine** — every text, link, icon, and image comes from the actual DOM via agent-browser eval, never fabricated from looking at screenshots
2. **Download ALL assets** — images, custom fonts, SVGs, background images. Verify each download is a real file (not HTML error page)
3. **Build with React/shadcn** — replicas are Next.js pages with shadcn/ui, Tailwind, Lucide React. Never standalone HTML files or iframes
4. **Minimum 4-5 pages** — one page cannot capture the design essence. Extract homepage + product + contact + 1-2 more
5. **Screenshot-validate every component** — capture original and replica screenshots, compare, fix differences, repeat until matching
6. **No emojis in design files** — use Lucide React icons or extracted SVGs
7. **No stale data** — update or remove old scores when rebuilding. Every visible metric must be current
8. **Self-improving** — every issue found during extraction must update the relevant agent/skill code

## Method: DOM extraction → asset download → shadcn build → screenshot validation

### Phase A: Extract (per page)
Use agent-browser to navigate each page and extract actual DOM content:
- Header/nav structure, links, logo SVG
- Main content headings, links, images, text
- Footer structure, social icons, legal text
- Custom font @font-face declarations with source URLs
- Background image URLs from computed styles
- Key measurements (heights, font sizes, colors, padding)

### Phase B: Build (React/shadcn)
Create shared brand components (header, footer, logo) and per-page replicas:
- Use extracted text content — never fabricate
- Download and embed real images, fonts, social SVGs
- Register custom fonts via @font-face in globals.css
- Use shadcn components (Button, Card, Input, Separator, Tabs)
- Use Lucide React for generic icons

### Phase C: Validate (screenshot comparison)
For each page and component:
1. Screenshot the original with agent-browser
2. Screenshot the replica at the same viewport
3. Compare visually — list every difference
4. Fix each difference in the React component
5. Re-screenshot and repeat until matching

### Phase D: Publish
- Extract tokens FROM the validated replica
- Generate DESIGN.md and SKILL.md
- Register in the design library with current (not stale) scores
- Ensure the brand detail UI links to React pages, shows live tokens

## Out of scope

- Inventing new brand identities without a source URL
- Building standalone HTML files (must be React/shadcn)
- Using emojis as icon placeholders
- Leaving stale scores or metrics visible
- Single-page extraction (minimum 4-5 pages required)

## Reference documentation

- Pipeline redesign plan: `docs/plans/2026-04-10-pipeline-redesign.md`
- Component extraction method: `docs/plans/2026-04-10-component-extraction-method.md`
- Full plugin overhaul: `docs/plans/2026-04-10-full-plugin-overhaul.md`
