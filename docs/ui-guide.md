# Library Browser UI Guide

The design-extractor ships with a Next.js 15 + shadcn/ui + Tailwind library browser at `ui/`.

## Launching

```
/design-extractor:browse
```

This starts a dev server at `http://localhost:5173`. On first run, dependencies install automatically (~30s). Subsequent launches are instant.

To stop the server: `pkill -f "next dev.*5173"`

## Library page (`/`)

The home page shows all extracted brands in a card grid.

### Features

- **Hero strip** — "Design Systems Extracted from the Live Web" + total brand count
- **Category tabs** — filter by: All, AI & ML, Dev Tools, Infrastructure, Fintech, Enterprise, Consumer
- **Search** — client-side filter by brand name or slug
- **Card grid** — responsive (1 column on mobile, 2 on tablet, 3 on desktop)
- **Docs** — `/docs` explains setup, architecture, blocked-site fallback, and the self-improvement loop

### Card contents

Each card displays:
- Brand name (derived from slug, title-cased)
- Source URL
- Extraction date
- Score badge (colour-coded: green >= 0.85, yellow >= 0.70, red < 0.70)
- Category badges
- Confidence badge (HIGH / MEDIUM / LOW)

Clicking a card navigates to the brand detail page.

### Empty state

If no brands are installed, the page shows instructions:
- `/design-extractor:seed-library` to install the Nimbus sample brand
- `/design-extractor:extract <url>` to extract a real brand

## Brand detail page (`/brands/<slug>`)

### Header

Shows the brand name, source URL (as a link), extraction date, and overall score badge.

### 9 tabs

#### 1. Overview

The "At a Glance" paragraph from DESIGN.md, plus the overall score, confidence level, and category tags.

#### 2. DESIGN.md

The full DESIGN.md content rendered as preformatted text with `whitespace-pre-wrap` styling.

#### 3. Tokens

The `design-tokens.css` file displayed in a styled code block. Shows all CSS custom properties for the brand.

#### 4. Components

Component previews. In v0.1 this is a placeholder indicating that live component previews will be available in a future release.

#### 5. Replica

A live iframe showing the brand's replica HTML (`replica/index.html`). Three buttons toggle the viewport width:
- Desktop (1440px)
- Tablet (768px)
- Mobile (390px)

The iframe loads via a proxy route at `/api/brands/<slug>/file/replica/index.html`.

#### 6. Assets

Displays the brand's logo SVG (inline via `<img>` tag) and favicon. Assets load via the file proxy route.

#### 7. Skill

The per-brand SKILL.md content in a code block with a "Copy to clipboard" button.

#### 8. Validation

The validation report (`validation/report.json`) rendered as formatted JSON. Shows gate verdicts, iteration scores, and the final convergence state. Displays "No validation report available" if the file doesn't exist.

The Validation tab now also:
- derives the displayed score from the live validation report
- exposes an `Improve Quality` button
- shows improvement job state (running, stalled, completed, assisted capture required)
- records the latest Claude refinement summary and log path for operator review
- surfaces assisted-capture steps when anti-bot protection blocks automated browsing

#### 9. Raw Files

A list of all files in the brand directory. Each file shows its name and path.

## Data flow

```
~/.claude/design-library/index.json
    |
    v
GET /api/library          <- lib/library.ts reads filesystem
    |
    v
Library page (app/page.tsx)
    |
    v (click card)
GET /api/brands/<slug>    <- lib/library.ts reads brand directory
    |
    v
Detail page (app/brands/[slug]/page.tsx)
    |
    v (iframe, img)
GET /api/brands/<slug>/file/<path>  <- proxies raw files with MIME types
```

All data reads are server-side via `lib/library.ts` using Node `fs/promises`. There is no caching — every request reads fresh from disk.

## Port

Default: `5173`. Change via `scripts/launch_ui.sh` or directly:

```bash
cd ui && pnpm dev --port <port>
```

## See also

- [getting-started.md](./getting-started.md) — first extraction + browsing
- [concepts.md](./concepts.md) — what the data means
- [design-md-spec.md](./design-md-spec.md) — DESIGN.md schema reference
