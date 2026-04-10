---
name: brand-linear-app
description: Apply Linear's design system — Inter Variable type, 4px base grid, dark-first surface palette, snappy 150ms transitions, soft 6px corner radii, minimal shadow language, and saturated pastel accents (pink/blue/purple/orange) on top of warm neutrals. Use when "design like Linear", "Linear-style component", "apply Linear style", "Linear theme". Do NOT trigger for Linear API integration, GraphQL queries, issue tracking, or workflow automation — those are about the Linear product, not its visual identity.
version: 1.0.0
source_url: https://linear.app
extracted_at: 2026-04-10
extractor_version: design-extractor@0.1.0
extraction_method: hand-written-ground-truth
scores:
  overall: 1.00
  tokens: 1.00
  replica: 1.00
  voice: 1.00
  patterns: 1.00
confidence: HIGH
language_variant: en-US
category_tags:
  - dev-tools
  - productivity
  - issue-tracking
  - b2b-saas
  - design-forward
---

# Linear

> Hand-written ground-truth DESIGN.md. Used as the gold standard for evaluating design-extractor's output quality during Phase 0 de-risk and Phase 4 convergence testing. Generated DESIGN.md files for `https://linear.app` should match this document on at least the Tokens, Patterns, and Voice sections (target: ≥0.85 on each).

## At a Glance

Linear is the canonical example of a "design-forward dev tool". Its visual language is **monochrome-with-pastel-accents**: a near-black surface system (`#08090a` ↔ `#f7f8f8`), Inter Variable typography tuned to fractional weights (510, 590), and a small set of saturated pastel highlights (pink, cyan, purple, orange) used sparingly for state and emphasis. Motion is **snappy** (median 150ms, sharp easing). Shadows are **almost invisible** (1px hairlines and 4px soft drops). The grid is a **4px base unit** with a 5-step breakpoint set (600/640/768/1024/1280). Everything reads "engineered, but with taste".

## Metadata

| Field | Value |
|---|---|
| Industry | Developer tools / project management |
| Category tags | dev-tools, productivity, issue-tracking, b2b-saas, design-forward |
| Source URL | https://linear.app |
| Extracted at | 2026-04-10 |
| Source title | Linear – The system for product development |
| Theme colour (meta) | `#08090a` |
| Has dark mode | Yes (dark-first; light mode is the inverted variant) |
| Language variant | en-US |
| Internal-link sample | 50 links across home/pricing/auth/about/docs/contact/other |

## Tokens

### Colours

| Token | Value | Hex | Confidence | Source |
|---|---|---|---|---|
| `colour.surface.default` | rgb(247, 248, 248) | `#f7f8f8` | HIGH | 2,701 occurrences |
| `colour.surface.inverse` | rgb(8, 9, 10) | `#08090a` | HIGH | meta theme-color + 20 occurrences |
| `colour.surface.elevated.dark` | rgba(255, 255, 255, 0.05) | `#ffffff0d` | HIGH | 130 occurrences (overlays on dark) |
| `colour.surface.elevated.dark-2` | rgba(255, 255, 255, 0.08) | `#ffffff14` | HIGH | 24 occurrences |
| `colour.text.primary` | rgb(8, 9, 10) | `#08090a` | HIGH | inverse on light surface |
| `colour.text.secondary` | rgb(98, 102, 109) | `#62666d` | HIGH | 697 occurrences |
| `colour.text.tertiary` | rgb(138, 143, 152) | `#8a8f98` | HIGH | confirmed by `--color-text-tertiary` custom property |
| `colour.text.inverse` | rgb(255, 255, 255) | `#ffffff` | HIGH | 218 occurrences |
| `colour.border.default` | rgb(208, 214, 224) | `#d0d6e0` | HIGH | 305 occurrences |
| `colour.border.strong` | rgb(226, 228, 231) | `#e2e4e7` | HIGH | 239 occurrences |
| `colour.accent.pink` | rgb(247, 156, 224) | `#f79ce0` | HIGH | 82 occurrences |
| `colour.accent.cyan` | rgb(85, 205, 255) | `#55cdff` | HIGH | 44 occurrences |
| `colour.accent.purple` | rgb(143, 164, 255) | `#8fa4ff` | HIGH | 18 occurrences |
| `colour.accent.orange` | rgb(255, 196, 124) | `#ffc47c` | HIGH | 20 occurrences |
| `colour.accent.orange-vivid` | `#ff8849` | `#ff8849` | HIGH | from `--sx-1ijrdvx` custom property |

**Brand impression:** monochrome dominates (95% of pixels). Accents are deployed at <5% — never as fills, almost always as 1-pixel borders, gradient stops, or icon ticks.

### Typography

| Token | Value | Confidence |
|---|---|---|
| `typography.fontFamily.primary` | Inter Variable, SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto, ... | HIGH |
| `typography.fontFamily.mono` | Berkeley Mono, ui-monospace, SF Mono, Menlo, monospace | HIGH |
| `typography.fontVariations` | `"opsz" auto` (variable optical sizing) | HIGH |
| `typography.weight.light` | 300 | MEDIUM |
| `typography.weight.regular` | 400 | HIGH |
| `typography.weight.medium` | 510 | HIGH (note: 510, not 500 — variable axis precision) |
| `typography.weight.semibold` | 590 | HIGH (note: 590, not 600) |

**Type scale (px):**

| Role | Size | rem | Source |
|---|---|---|---|
| label | 10px | 0.625 | min size, used for nav meta labels |
| caption | 12px | 0.75 | `--font-size-miniPlus`, `--text-micro-size` |
| body-sm | 13px | 0.8125 | secondary copy |
| body | 14–15px | 0.875–0.9375 | `--text-regular-size = 0.9375rem` |
| body-lg | 16px | 1.0 | input fields |
| heading-sm | 18px | 1.125 | section labels |
| h1 / title-1 | 36px | 2.25 | `--font-size-title1 = 2.25rem` |
| display | 48px | 3.0 | hero copy |
| display-lg | 64px | 4.0 | landing hero |

**Notable letter-spacing tokens:**
- `--text-regular-letter-spacing = -0.011em`
- `--title-3-letter-spacing = -0.012em`
- `--title-1-line-height = 1.4`

Linear's type scale is **hand-tuned, not algorithmic**. Body sizes follow a near-1.067 ratio (14→15→16) but display sizes jump (18→36→48→64) at no fixed ratio. This is intentional — display feels designed, not computed.

### Spacing

| Token | Value |
|---|---|
| `spacing.base` | 4px |
| `spacing.scale` | 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64 |

Base unit is **4px**, confirmed mechanically by GCD on padding/margin/gap values. Most-frequent paddings: 8px, 32px, 24px, 12px, 6px, 16px, 2px, 96px — all multiples of 2 or 4.

### Border radius

| Token | Value | Use |
|---|---|---|
| `radius.xs` | 2px | Inline tags, focus rings |
| `radius.sm` | 4px | Inputs, small buttons |
| `radius.md` | 6px | Default cards, primary buttons (most frequent) |
| `radius.lg` | 12px | Large surfaces, modals |
| `radius.full` | 50% | Avatars |

`radius.md = 6px` is the dominant value. Linear uses **soft, not pill-shaped** corners.

### Border width

| Token | Value |
|---|---|
| `border.width.default` | 1px |

Linear uses **only 1px borders**. No 2px, no 3px. This is a deliberate choice — heavier borders break the engineered feel.

### Shadow

| Token | Value | Use |
|---|---|---|
| `shadow.hairline` | `rgba(0,0,0,0.03) 0px 1.2px 0px 0px` | Top edge of elevated cards |
| `shadow.sm` | `rgba(0,0,0,0.4) 0px 2px 4px 0px` | Tooltips, dropdowns |
| `shadow.inset-glow` | `rgba(0,0,0,0.2) 0px 0px 12px 0px inset` | Active inputs (subtle vignette) |

Linear's shadow language is **near-invisible**. It uses `box-shadow` more for hairline borders than for elevation. There is no soft drop-shadow ladder like Material Design.

### Motion

| Token | Value | Label |
|---|---|---|
| `motion.duration.fast` | 100ms (`color 0.1s`) | snap |
| `motion.duration.default` | 150ms (`--speed-highlightFadeOut`) | snap |
| `motion.duration.medium` | 160ms (`filter 0.16s ...`) | snap |
| `motion.duration.slow` | 400ms (`background 0.4s ease-out`) | natural |
| `motion.easing.default` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | quad-out |
| `motion.easing.dramatic` | `cubic-bezier(0.77, 0, 0.175, 1)` | quart in-out |

Median duration ≈ **150ms → SNAPPY** label per the 15-pattern rubric. Linear values "fast feedback over choreography".

### Breakpoints

`600px, 640px, 768px, 1024px, 1280px` — close to Tailwind defaults but with an extra 600 sm-edge.

## Typography

Linear uses **Inter Variable** as its primary font, with optical-sizing axis enabled (`opsz auto`). The variable axis is exploited: weights 510 and 590 are used in addition to the standard 400/600. This is a deliberate signal of typographic precision — most B2B SaaS rounds to 500/600.

**Hierarchy:**

| Role | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| Display | 64px | 590 | -0.012em | 1.1 |
| h1 / title-1 | 36px | 590 | -0.012em | 1.4 |
| h2 / title-2 | 24px | 510 | -0.011em | 1.4 |
| h3 / title-3 | 18px | 510 | -0.012em | 1.5 |
| Body | 15px | 400 | -0.011em | 24px |
| Body-sm | 13px | 400 | -0.011em | 19.5px |
| Caption | 12px | 400 | normal | 16.8px |
| Label | 10px | 510 | 0.05em | 15px |

Mono font (`Berkeley Mono`) is used for code snippets in the docs and for the "issue ID" pattern in the product (LIN-1234). Berkeley Mono is a paid font — replicas should fall back to `ui-monospace, SF Mono, Menlo`.

## Spacing

- **Base unit:** 4px (verified by GCD on observed padding/margin/gap values)
- **Scale (Fibonacci-ish):** 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64
- **Container max-width:** ~1280px (matches the largest breakpoint)
- **Section padding:** vertical sections typically use 96px top/bottom on desktop

## Components

### nav

- 64px tall
- Backdrop-filter blur on scroll (frosted glass)
- Logo left, nav links centre, CTA right
- 14px font-size for nav links, weight 510, no underline
- Hover state uses opacity transition (~150ms) not colour change
- Sticky positioning with subtle 1px bottom border (`#d0d6e0`)

### hero

- Centred copy, no full-bleed image
- 64–96px display headline, weight 590
- 18–20px subheadline, weight 400
- Two CTAs: primary (filled black) and ghost (border only)
- Background: clean `#f7f8f8` or `#08090a` depending on theme — never gradients on the hero itself
- Animated dot/grid pattern often present as a subtle backdrop

### button

- **Primary:** background `#08090a`, text `#ffffff`, padding `8px 16px`, radius `6px`, font-size `14px`, weight `510`
- **Secondary:** background `#f7f8f8`, text `#08090a`, 1px border `#d0d6e0`, otherwise identical
- **Ghost:** transparent background, text `#08090a`, no border, hover background `rgba(0,0,0,0.05)`
- **Disabled:** opacity 0.5, no colour change
- **Hover transition:** `background 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- No drop shadow on any state

### card

- 1px border `#d0d6e0`, radius `6px`, padding `24px`
- Background `#ffffff` (light) or `rgba(255,255,255,0.05)` (dark)
- No shadow except optional `shadow.hairline` on the top edge
- Cards do NOT have hover lift effects — they are static surfaces

### footer

- Dark background (`#08090a`) regardless of theme
- 6 columns of links on desktop, collapsing to 2 on mobile
- Link text 13px, weight 400, colour `#8a8f98`, hover `#ffffff`
- Top border `1px solid rgba(255,255,255,0.08)`
- Logo + tagline + copyright at bottom centre

### form

- Input height 36px, padding `8px 12px`, radius `6px`, 1px border `#d0d6e0`
- Focus state: border `#08090a` + `shadow.inset-glow`
- Label above input, 13px weight 510
- Error state: red border (`#ef4444`-ish), error text 12px below

## Patterns

The 15-signal pattern report:

| # | Signal | Value | Confidence |
|---|---|---|---|
| 1 | Spacing rhythm / base unit | 4px (mechanical, verified) | HIGH |
| 2 | Type scale ratio | hand-tuned (no fixed ratio); body uses ~1.067, display uses ad-hoc steps | HIGH |
| 3 | Component density | balanced (slightly airy on landing, dense in app) | MEDIUM |
| 4 | Alignment grid | 12-column on desktop, 1280px container, 32px gutter (estimated) | MEDIUM |
| 5 | Primary CTA placement | top-right (header) and centre (hero); never sticky-bottom | HIGH |
| 6 | Border-radius language | soft (6px dominant); avatars are pill (50%) | HIGH |
| 7 | Shadow elevation system | minimal — 1 hairline, 1 small drop, 1 inset glow. No 5-step ladder. | HIGH |
| 8 | Motion language | snappy (median 150ms, sharp `cubic-bezier(0.25, 0.46, 0.45, 0.94)`) | HIGH |
| 9 | Colour temperature + saturation | cool/neutral mass with warm pastel accents; mean chroma very low | HIGH |
| 10 | Typography pairing | Inter Variable + Berkeley Mono (premium pairing — both paid/loved) | HIGH |
| 11 | Icon style consistency | line icons, 1.5px stroke, 16/20/24px sizes, lucide-style | HIGH |
| 12 | Photography / illustration style | minimal photography; abstract gradient/dot illustrations only | MEDIUM |
| 13 | Hero structure template | centred-copy, no-image, 2-CTA, animated-dot-backdrop | HIGH |
| 14 | Interaction affordance set | hover = opacity or background subtle; focus = ring (1px outline) + offset; active = darken; disabled = opacity 0.5 | HIGH |
| 15 | Voice-design alignment | strong alignment — terse copy mirrors restrained visuals; both signal "engineered taste" | HIGH |

## Relationships

**Tokens compose into components via these consistent rules:**

1. Every interactive surface uses `radius.md = 6px` unless it's pill (avatars) or square (focus rings).
2. Every text element uses `colour.text.{primary|secondary|tertiary}` from a 3-step neutral scale; brand colours never appear in body text.
3. Every container uses `border.width.default = 1px` with `colour.border.default`. There is no second border-width token.
4. Every button gets the same height bucket (36px) and the same padding ratio (8/16). Variant differs only in fill colour.
5. Every transition uses `motion.duration.default = 150ms` with `motion.easing.default`. Slow transitions (400ms+) are reserved for backdrop changes only.
6. Spacing is always a multiple of `spacing.base = 4`. There are no 5px, 7px, or 13px values in the system.

**Relationship-to-brand-feel:**
- The 4px grid + 1px borders + 6px radii + minimal shadows together produce the "thin, precise, engineered" look.
- The pastel accent palette + animated illustrations soften this engineering feel into "approachable".
- Snappy motion + small text + dense information density signal "made by people who use this every day".

## Voice

**Tone spectrum:**

| Dimension | Position |
|---|---|
| formal ↔ casual | leans casual (50%) |
| technical ↔ accessible | technical with explanations (70%) |
| authoritative ↔ friendly | authoritative (60%) |
| urgent ↔ calm | calm (75%) |

**3 defining traits:**

1. **Concise and declarative** — sentences average 8 words. "The system for product development." not "Linear is a system designed to help product development teams collaborate effectively."
2. **Specific over generic** — copy names features, not categories. "Cycles, projects, and roadmaps" not "powerful planning tools".
3. **Quietly opinionated** — no hedging, no "we believe", no "perhaps". "Issues are the unit of work."

**CTA patterns:**

- "Start building" (primary verb pattern: imperative + gerund)
- "Try Linear" (one-word imperative + brand)
- "Read the changelog" (specific noun, not "Learn more")
- "Explore the API" (action verb + specific noun)
- Avoid: "Get started", "Sign up free", "Click here"

**Language variant:** en-US (color, organize, behavior, customize)

**Microcopy do/don't:**

| Do | Don't |
|---|---|
| "Issues are the unit of work" | "Manage your issues with ease" |
| "Set due dates per cycle" | "Get organized with deadlines" |
| "Built for speed" | "Lightning-fast performance" |

## Motion

- **Label:** snappy
- **Median duration:** 150ms
- **Default easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (quad-out)
- **Dramatic easing:** `cubic-bezier(0.77, 0, 0.175, 1)` (quart in-out — used for backdrop changes)
- **Example transitions:**
  - `color 100ms` for link hover
  - `background 150ms` for button hover
  - `filter 160ms cubic-bezier(0.25, 0.46, 0.45, 0.94)` for image hover
  - `background 400ms ease-out` for theme switch

## Assets

| Asset | Status |
|---|---|
| Logo (light) | SVG, single mark + wordmark variants |
| Logo (dark) | Inverted variant exists |
| Favicon | `.ico` + `apple-touch-icon` + manifest icons |
| Icon system | Custom SVG sprite (lucide-style line icons) |
| Custom illustrations | Animated gradient orbs, dot grids, abstract product shots |

(Asset extraction is deferred to the actual extraction script — this is a hand-written reference.)

## Brand Alignment

Linear's **voice and visuals reinforce each other**. The terse, declarative copy ("Issues are the unit of work") mirrors the restrained 1px borders and 4px grid: both communicate "we removed everything that wasn't load-bearing". The pastel accent palette and snappy 150ms transitions add the human touch that prevents the engineering precision from feeling cold. There is no internal contradiction — a product that wrote "Built for speed" but used 600ms ease-in-out animations would feel false; Linear doesn't.

The mono font (Berkeley Mono) for issue IDs is the strongest single signal of design alignment: it visually tells you "this thing has a stable identity, like a commit hash", which matches the product's claim to be the source of truth for engineering work.

## How To Use

### Tailwind config snippet

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: "#f7f8f8", inverse: "#08090a" },
        text: { DEFAULT: "#08090a", secondary: "#62666d", tertiary: "#8a8f98" },
        border: { DEFAULT: "#d0d6e0", strong: "#e2e4e7" },
        accent: { pink: "#f79ce0", cyan: "#55cdff", purple: "#8fa4ff", orange: "#ffc47c" },
      },
      fontFamily: {
        sans: ['"Inter Variable"', '"SF Pro Display"', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"Berkeley Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      fontWeight: { medium: "510", semibold: "590" },
      borderRadius: { sm: "4px", DEFAULT: "6px", lg: "12px" },
      spacing: { px: "1px", "0.5": "2px", "1": "4px", "1.5": "6px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px", "10": "40px", "12": "48px", "16": "64px" },
      transitionDuration: { fast: "100ms", DEFAULT: "150ms", slow: "400ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" },
    },
  },
} satisfies Config;
```

### Apply this brand to a project

```bash
/design-extractor:apply-design linear-app
```

This copies the per-brand SKILL.md into your project's `.claude/skills/` so Claude auto-loads Linear's design rules whenever you ask for "Linear-style" anything.

## Validation

This is a hand-written ground-truth document, so it bypasses the validation pipeline. Auto-generated DESIGN.md files for `https://linear.app` are scored against this document on:

| Section | Target similarity |
|---|---|
| Tokens (colours, type, spacing, radius, shadow, motion) | ≥0.90 |
| Patterns (15 signals) | ≥0.85 |
| Voice (tone + traits + CTAs) | ≥0.80 |
| Components (HTML snippets feasibility) | ≥0.75 |

A generated DESIGN.md scoring ≥0.85 average across the four sections is considered a Phase 4 pass for the linear.app fixture.

## Provenance

| File | Origin |
|---|---|
| `recon-output.json` | `extract_tokens.py --stage recon --url https://linear.app` (Phase 0 baseline run, 2026-04-10) |
| `tokens-output.json` | `extract_tokens.py --stage tokens --url https://linear.app` (Phase 0 baseline run, 2026-04-10) |
| Hand-written sections (At a Glance, Voice, Brand Alignment) | Manual authoring by Phase 0 author for ground-truth purposes |
| Numerical token tables | Distilled from real `tokens-output.json` cache at `/tmp/design-extractor-baseline/linear-app/` |
