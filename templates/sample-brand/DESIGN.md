---
name: brand-nimbus
description: Apply Nimbus's calm-tech cloud SaaS design system — Inter primary type, 4px base grid, near-white `#FAFBFC` surfaces with a single cobalt `#4A6FF5` accent, soft violet `#9B8CFF` highlights, generous whitespace, 12px default radii with pill CTAs, and almost-invisible elevation (1–2px soft drops). Use when "design like Nimbus", "Nimbus-style cloud SaaS landing page", "apply Nimbus calm-tech aesthetic", "Nimbus marketing page", "Nimbus brand", "Nimbus theme", "calm infrastructure SaaS look". Do NOT trigger for cloud infrastructure architecture, AWS, GCP, Azure, Kubernetes, container orchestration, deployment pipelines, devops tooling, IaC, Terraform, or any real cloud provider topic — Nimbus is a synthetic design brand, not a cloud product.
version: 0.1.0
source_url: https://nimbus.example.com
extracted_at: 2026-04-10
extractor_version: design-extractor@0.1.0
extraction_method: hand-curated-seed
scores:
  overall: 0.95
  tokens: 1.00
  replica: 0.92
  voice: 0.94
  patterns: 0.96
confidence: HIGH
language_variant: en-US
category:
  - dev-tools
  - infrastructure
category_tags:
  - dev-tools
  - infrastructure
  - b2b-saas
  - calm-tech
  - marketing-site
synthetic: true
---

# Nimbus

> Hand-curated synthetic brand seeded into the design library so Phase 1 can demonstrate the library browser before any real extraction has run. Nimbus is **not a real company** — it exists only as reference seed data for the `design-extractor` plugin. Tagline: *"Infrastructure that gets out of your way."*

## At a Glance

Nimbus is a fictional cloud infrastructure SaaS whose visual language is **calm, near-white, and blue-leaning**. The surface system is a warm-cool off-white (`#FAFBFC`) paired with pure-white elevated cards, held together by a single cobalt accent (`#4A6FF5`) and a soft violet highlight (`#9B8CFF`). Typography is **Inter at confident-but-not-loud weights** (400, 500, 600) with generous line-height. The grid is a **4px base unit**, radii run **4 / 8 / 12 / pill**, and elevation is **almost invisible** — single-digit alpha shadows that read as depth hints rather than drop shadows. Motion is **natural** (median 200ms, gentle `ease-out`). The net impression is "quiet tooling that won't fight you" — the opposite of hype-driven developer marketing.

## Metadata

| Field | Value |
|---|---|
| Industry | Cloud infrastructure / developer tools (synthetic) |
| Category tags | dev-tools, infrastructure, b2b-saas, calm-tech |
| Source URL | https://nimbus.example.com |
| Extracted at | 2026-04-10 |
| Source title | Nimbus – Infrastructure that gets out of your way |
| Theme colour (meta) | `#FAFBFC` |
| Has dark mode | No (light-only seed; a dark variant may be added in v0.2) |
| Language variant | en-US |
| Synthetic | true (hand-curated seed data, not a scrape) |

## Tokens

### Colours

| Token | Value | Hex | Confidence | Source |
|---|---|---|---|---|
| `colour.surface.default` | rgb(250, 251, 252) | `#FAFBFC` | HIGH | page background, hand-curated |
| `colour.surface.elevated` | rgb(255, 255, 255) | `#FFFFFF` | HIGH | cards, nav, dialogs |
| `colour.surface.muted` | rgb(245, 247, 250) | `#F5F7FA` | HIGH | secondary fills, input backgrounds |
| `colour.text.primary` | rgb(15, 20, 25) | `#0F1419` | HIGH | body and heading default |
| `colour.text.secondary` | rgb(92, 100, 115) | `#5C6473` | HIGH | subheadings, supporting copy |
| `colour.text.tertiary` | rgb(142, 150, 165) | `#8E96A5` | HIGH | meta, timestamps, hints |
| `colour.text.inverse` | rgb(255, 255, 255) | `#FFFFFF` | HIGH | text on primary fills |
| `colour.border.default` | rgb(229, 232, 238) | `#E5E8EE` | HIGH | card borders, dividers |
| `colour.border.strong` | rgb(213, 218, 227) | `#D5DAE3` | HIGH | input borders, focus-adjacent |
| `colour.accent.primary` | rgb(74, 111, 245) | `#4A6FF5` | HIGH | cobalt — primary CTA, links |
| `colour.accent.primary-hover` | rgb(59, 92, 214) | `#3B5CD6` | HIGH | primary hover |
| `colour.accent.secondary` | rgb(155, 140, 255) | `#9B8CFF` | HIGH | soft violet — gradient stops, secondary highlights |
| `colour.state.success` | rgb(34, 197, 94) | `#22C55E` | HIGH | success toasts, status dots |
| `colour.state.warning` | rgb(245, 158, 11) | `#F59E0B` | MEDIUM | inferred from "calm palette" rules |
| `colour.state.danger` | rgb(239, 68, 68) | `#EF4444` | MEDIUM | destructive actions only |

**Brand impression:** near-white dominates (≈92% of pixels). Cobalt is used sparingly as a single "where-to-look" signal — primary CTAs, active links, focus rings. Violet appears only in gradient stops and on soft highlight surfaces. Neutrals carry the layout; colour carries intent.

### Typography

| Token | Value | Confidence |
|---|---|---|
| `typography.fontFamily.primary` | `Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | HIGH |
| `typography.fontFamily.mono` | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` | HIGH |
| `typography.weight.regular` | 400 | HIGH |
| `typography.weight.medium` | 500 | HIGH |
| `typography.weight.semibold` | 600 | HIGH |

**Type scale (px):**

| Role | Size | rem | Weight | Line-height |
|---|---|---|---|---|
| caption | 12px | 0.75 | 500 | 1.5 |
| body-sm | 14px | 0.875 | 400 | 1.55 |
| body | 16px | 1.0 | 400 | 1.6 |
| body-lg | 18px | 1.125 | 400 | 1.6 |
| heading-sm | 20px | 1.25 | 600 | 1.4 |
| h3 | 24px | 1.5 | 600 | 1.35 |
| h2 | 32px | 2.0 | 600 | 1.25 |
| h1 | 44px | 2.75 | 600 | 1.15 |
| display | 56px | 3.5 | 600 | 1.1 |

Nimbus's scale is close to a **1.25 (major third) ratio** between display headings and a **1.125 (major second) ratio** between body and small heading. Letter-spacing is normal for body, with a `-0.01em` tightening on display/h1 only.

### Spacing

| Token | Value |
|---|---|
| `spacing.base` | 4px |
| `spacing.scale` | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128 |

Generous by default: hero sections use **96–128px** vertical padding on desktop, cards use **24–32px** internal padding, nav sits at **72px** tall. Nimbus leaves more air than its peers on purpose — the whitespace is the brand.

### Border radius

| Token | Value | Use |
|---|---|---|
| `radius.sm` | 4px | Inline tags, small chips, focus rings |
| `radius.md` | 8px | Inputs, secondary buttons, small cards |
| `radius.lg` | 12px | Default cards, modals, media frames |
| `radius.full` | 9999px | Primary CTAs (pill), avatars, status dots |

Primary CTAs are **pill** — this is the single strongest radius signal. Everything else uses 12px by default.

### Border width

| Token | Value |
|---|---|
| `border.width.default` | 1px |

Only 1px. Matches Linear's rule — heavier borders would break the calm.

### Shadow

| Token | Value | Use |
|---|---|---|
| `shadow.xs` | `0 1px 2px rgba(15, 20, 25, 0.04)` | Resting cards |
| `shadow.sm` | `0 1px 2px rgba(15, 20, 25, 0.04), 0 1px 1px rgba(15, 20, 25, 0.06)` | Nav on scroll, elevated cards |
| `shadow.md` | `0 4px 12px rgba(15, 20, 25, 0.06), 0 2px 4px rgba(15, 20, 25, 0.04)` | Dropdowns, popovers |
| `shadow.focus` | `0 0 0 3px rgba(74, 111, 245, 0.25)` | Focus ring on interactive elements |

Nimbus's elevation is **almost invisible** — alphas stay at 0.04–0.06. No Material Design ladder.

### Motion

| Token | Value | Label |
|---|---|---|
| `motion.duration.fast` | 120ms | snap |
| `motion.duration.default` | 200ms | natural |
| `motion.duration.slow` | 320ms | natural |
| `motion.easing.default` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | ease-out |
| `motion.easing.dramatic` | `cubic-bezier(0.65, 0, 0.35, 1)` | ease-in-out |

Median duration ≈ **200ms → NATURAL** label per the 15-pattern rubric. Nimbus values "unhurried feedback" over "snappy clicks".

### Breakpoints

`640px, 768px, 1024px, 1280px, 1536px` — standard Tailwind defaults. Nimbus does not customize breakpoints.

## Typography

Nimbus uses **Inter** as primary type, falling back through `system-ui` for environments without Inter loaded. Weights stay in the 400/500/600 band — no 300s (too thin for the calm surface), no 700s (too assertive). Display copy uses 600 at a slight negative tracking (`-0.01em`) so large headings read as confident without becoming loud.

**Hierarchy:**

| Role | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| Display | 56px | 600 | -0.01em | 1.1 |
| h1 | 44px | 600 | -0.01em | 1.15 |
| h2 | 32px | 600 | normal | 1.25 |
| h3 | 24px | 600 | normal | 1.35 |
| heading-sm | 20px | 600 | normal | 1.4 |
| body-lg | 18px | 400 | normal | 1.6 |
| body | 16px | 400 | normal | 1.6 |
| body-sm | 14px | 400 | normal | 1.55 |
| caption | 12px | 500 | 0.01em | 1.5 |

Mono font (`JetBrains Mono`) is used for inline code, CLI snippets, and resource identifiers (`nbs-4f2a-7b1c`). It is the only place monospace appears — never for headings.

## Spacing

- **Base unit:** 4px
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
- **Container max-width:** 1200px
- **Section padding:** 96–128px vertical on desktop, 64px on mobile
- **Card padding:** 24–32px
- **Nav height:** 72px

## Components

### nav

- 72px tall, sticky, `#FFFFFF` background
- Subtle `1px solid #E5E8EE` bottom border that appears on scroll
- Logo left, 4 nav links centre-left, primary CTA right
- 14px nav links, weight 500, `#5C6473` at rest, `#0F1419` on hover
- Primary CTA is pill, cobalt, `#FFFFFF` text, `padding: 10px 20px`

### hero

- Centred copy, max-width 880px
- 56px display headline, weight 600, `#0F1419`
- 20px subhead, weight 400, `#5C6473`, max-width 640px, line-height 1.6
- Two CTAs: primary (pill, cobalt) and secondary (pill, 1px border `#E5E8EE`, white background)
- 96–128px vertical padding
- Optional soft radial gradient from `#9B8CFF` at 8% alpha in the top-right as decoration — never a full-bleed image

### button

- **Primary:** background `#4A6FF5`, text `#FFFFFF`, padding `12px 24px`, radius `9999px` (pill), font-size 15px, weight 500
- **Primary hover:** background `#3B5CD6`, transition 200ms ease-out
- **Secondary:** background `#FFFFFF`, text `#0F1419`, 1px border `#E5E8EE`, otherwise identical
- **Secondary hover:** border `#D5DAE3`, background `#F5F7FA`
- **Ghost:** transparent background, text `#4A6FF5`, no border, hover background `rgba(74, 111, 245, 0.08)`
- **Disabled:** opacity 0.5, cursor not-allowed
- **Focus:** `0 0 0 3px rgba(74, 111, 245, 0.25)` ring
- No drop shadow on any state

### card

- Background `#FFFFFF`, 1px border `#E5E8EE`, radius `12px`, padding `24px` (or `32px` for feature cards)
- Optional `shadow.xs` at rest, `shadow.sm` on hover
- Heading `20px / 600`, body `16px / 400 / #5C6473`, generous `16px` gap between elements
- Icon at top in a `48x48` rounded square (`radius.md`, `#F5F7FA` background) with cobalt stroke

### footer

- Background `#FAFBFC` (same as page surface — footer doesn't invert)
- Top border `1px solid #E5E8EE`
- 4 link columns on desktop, collapsing to 2 on mobile
- Column header 14px / 600 / `#0F1419`
- Link 14px / 400 / `#5C6473`, hover `#0F1419`
- Logo + tagline top-left, copyright bottom-left, social icons bottom-right
- 64px top padding, 48px bottom padding

### form

- Input height 44px, padding `12px 16px`, radius `8px`, 1px border `#E5E8EE`, background `#FFFFFF`
- Focus: border `#4A6FF5` + `shadow.focus` ring
- Label above input, 14px / 500 / `#0F1419`, 8px gap
- Helper text 12px / 400 / `#8E96A5` below
- Error state: border `#EF4444`, helper text `#EF4444`

## Patterns

The 15-signal pattern report:

| # | Signal | Value | Confidence |
|---|---|---|---|
| 1 | Spacing rhythm / base unit | 4px (mechanical; GCD of observed paddings) | HIGH |
| 2 | Type scale ratio | ~1.25 for headings, ~1.125 for body/sub | HIGH |
| 3 | Component density | airy (hero padding 96–128px, card gap 24–32px) | HIGH |
| 4 | Alignment grid | 12-column, 1200px container, 32px gutter | HIGH |
| 5 | Primary CTA placement | top-right (nav) + centre (hero); never sticky-bottom | HIGH |
| 6 | Border-radius language | mixed: 12px default surfaces, pill (9999px) for primary CTAs | HIGH |
| 7 | Shadow elevation system | minimal — xs/sm/md only, all alphas ≤ 0.06 | HIGH |
| 8 | Motion language | natural (median 200ms, gentle `cubic-bezier(0.22,0.61,0.36,1)`) | HIGH |
| 9 | Colour temperature + saturation | cool neutral mass with one saturated cobalt accent + muted violet highlight | HIGH |
| 10 | Typography pairing | Inter + JetBrains Mono (free, open, "calm dev" pairing) | HIGH |
| 11 | Icon style consistency | line icons, 1.5px stroke, 20/24px sizes, lucide-style, cobalt on `#F5F7FA` bg | HIGH |
| 12 | Photography / illustration style | no photography; soft radial gradients and abstract dot/grid patterns only | HIGH |
| 13 | Hero structure template | centred copy, no image, 2 pill CTAs, optional soft gradient backdrop | HIGH |
| 14 | Interaction affordance set | hover = colour shift or subtle bg; focus = 3px cobalt ring; active = darken; disabled = opacity 0.5 | HIGH |
| 15 | Voice-design alignment | strong — calm copy ("gets out of your way") mirrors whitespace-heavy restrained visuals | HIGH |

## Relationships

**Tokens compose into components via these consistent rules:**

1. Every primary CTA is **pill-shaped** (`radius.full`). Every other interactive surface uses `radius.md = 8px` or `radius.lg = 12px`.
2. Colour is used for **intent, not decoration**. Cobalt = "this is the action". Violet = "this is a highlight/illustration". Everything else is neutral.
3. Every text element uses `colour.text.{primary|secondary|tertiary}` from a 3-step neutral scale. Brand colours never appear in body copy.
4. Every container uses `border.width.default = 1px` with `colour.border.default`. There is no second border-width token.
5. Every transition uses `motion.duration.default = 200ms` with `motion.easing.default`. Slow transitions (320ms) are reserved for page-level state changes.
6. Spacing is always a multiple of `spacing.base = 4`. No 5px, 7px, or 13px values exist.

**Relationship-to-brand-feel:**

- The 4px grid + 1px borders + low-alpha shadows + generous whitespace together produce the "calm, unhurried" feel.
- The single cobalt accent against the near-white surface is what turns that calm into "directed" — you always know where to click.
- The pill primary CTA is the one piece of visual assertiveness in the system: it tells the user "when Nimbus wants your attention, it uses this shape".

## Voice

**Tone spectrum:**

| Dimension | Position |
|---|---|
| formal ↔ casual | leans casual (55%) |
| technical ↔ accessible | technical-but-accessible (60%) |
| authoritative ↔ friendly | friendly (55%) |
| urgent ↔ calm | very calm (85%) |

**3 defining traits:**

1. **Confident without hype** — sentences state facts without superlatives. "Deploy in one command." not "Lightning-fast deploys in seconds!".
2. **Technical but plain** — uses concrete nouns (CLI, region, workload) without acronym walls. Explains only when the explanation is useful.
3. **Out-of-your-way** — the voice actively resists being memorable. Copy is short because the product wants you to close the tab and go build.

**CTA patterns:**

- "Start deploying" (imperative + gerund)
- "Read the docs" (specific noun)
- "Talk to us" (plain invitation, no "Contact sales")
- "See pricing" (direct verb + noun)
- Avoid: "Get started for free", "Sign up now", "Book a demo today"

**Tagline:** *"Infrastructure that gets out of your way."*

**Language variant:** en-US (color, behavior, organize, optimize)

**Microcopy do/don't:**

| Do | Don't |
|---|---|
| "Deploy in one command." | "Deploy your apps with ease, instantly!" |
| "Regions are picked automatically." | "Our intelligent global edge network decides for you!" |
| "Pricing scales with usage." | "Affordable, transparent, pay-as-you-go billing that grows with you." |

## Motion

- **Label:** natural
- **Median duration:** 200ms
- **Default easing:** `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out)
- **Dramatic easing:** `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out — used for route/theme changes)
- **Example transitions:**
  - `color 120ms ease-out` for link hover
  - `background 200ms cubic-bezier(0.22, 0.61, 0.36, 1)` for button hover
  - `box-shadow 200ms ease-out` for card hover elevation
  - `opacity 320ms ease-in-out` for page-level transitions

## Assets

| Asset | Status |
|---|---|
| Logo (primary) | Inline SVG wordmark at `assets/logo.svg` — geometric "N" mark + Nimbus wordmark |
| Favicon | Inline SVG at `assets/favicon.svg` — cobalt rounded square with white "N" |
| Icon system | Not shipped with seed; replicas should use `lucide-react` with 1.5px stroke |
| Illustrations | Not shipped; use soft radial gradients (`#9B8CFF` at 8% alpha) as decoration |

All assets are **self-contained** — no external URL references. This is a seed brand; its assets exist only inside this template directory.

## Brand Alignment

Nimbus's voice and visuals are designed to reinforce the same message: **quiet competence**. The copy refuses to shout, and so do the visuals — generous whitespace, a single accent colour, shadows you can barely see, 200ms animations that finish before you notice them. The one piece of visual assertiveness (the pill primary CTA) matches the one piece of voice assertiveness ("Infrastructure that gets out of your way" — an opinionated claim delivered without exclamation points).

There is no internal contradiction. A brand with calm copy and loud visuals would feel dishonest; Nimbus passes this test because its designer removed everything that wasn't load-bearing, from the prose to the pixels.

## How To Use

### Tailwind config snippet

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: "#FAFBFC", elevated: "#FFFFFF", muted: "#F5F7FA" },
        text: { DEFAULT: "#0F1419", secondary: "#5C6473", tertiary: "#8E96A5" },
        border: { DEFAULT: "#E5E8EE", strong: "#D5DAE3" },
        accent: { DEFAULT: "#4A6FF5", hover: "#3B5CD6", secondary: "#9B8CFF" },
        success: "#22C55E",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: { sm: "4px", md: "8px", lg: "12px", full: "9999px" },
      spacing: { px: "1px", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px", "10": "40px", "12": "48px", "16": "64px", "20": "80px", "24": "96px", "32": "128px" },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 20, 25, 0.04)",
        sm: "0 1px 2px rgba(15, 20, 25, 0.04), 0 1px 1px rgba(15, 20, 25, 0.06)",
        md: "0 4px 12px rgba(15, 20, 25, 0.06), 0 2px 4px rgba(15, 20, 25, 0.04)",
        focus: "0 0 0 3px rgba(74, 111, 245, 0.25)",
      },
      transitionDuration: { fast: "120ms", DEFAULT: "200ms", slow: "320ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    },
  },
} satisfies Config;
```

### Apply this brand to a project

```bash
/design-extractor:apply-design nimbus
```

This copies the per-brand SKILL.md into your project's `.claude/skills/` so Claude auto-loads Nimbus's design rules whenever you ask for "Nimbus-style" anything.

## Validation

This is a hand-curated seed brand. It bypasses the extraction+validation pipeline and is scored as perfect-by-construction:

| Section | Score | Notes |
|---|---|---|
| Tokens | 1.00 | Hand-authored against the calm-cloud palette spec |
| Patterns | 0.96 | 15/15 signals filled, minor uncertainty on state.warning/danger inference |
| Voice | 0.94 | Tagline and microcopy authored; no real corpus to sample |
| Replica | 0.92 | Self-contained HTML replica present and matches tokens |
| Overall | 0.95 | Used as library demo and trigger test for Phase 1 |

The <1.00 overall score is intentional: Nimbus is a seed, not a ground-truth fixture. The real ground-truth is `tests/fixtures/linear-app-ground-truth.md`.

## Provenance

| File | Origin |
|---|---|
| `DESIGN.md` | Hand-authored by design-extractor Phase 1 author, 2026-04-10 |
| `design-tokens.json` | Hand-authored W3C DTCG 2025.10 format |
| `design-tokens.css` | Hand-authored CSS custom properties (mirrors JSON) |
| `assets/logo.svg`, `assets/favicon.svg` | Inline SVG, hand-drawn geometric wordmark |
| `skill/SKILL.md` | Hand-authored per-brand skill with negative triggers |
| `replica/index.html` | Hand-authored self-contained Tailwind-CDN landing page |
| `metadata.json` | Hand-authored library index entry |
