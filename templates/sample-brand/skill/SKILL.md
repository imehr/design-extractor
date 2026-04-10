---
name: brand-nimbus
description: Apply Nimbus's calm-tech cloud SaaS design system. Use when the user says "design like Nimbus", "Nimbus style", "Nimbus-style landing page", "apply Nimbus brand", "Nimbus theme", "Nimbus marketing page", "calm infrastructure SaaS look", "build me a page that looks like Nimbus", "use the Nimbus tokens", or any similar request to replicate the Nimbus visual identity (near-white surfaces, cobalt `#4A6FF5` accent, Inter type, pill primary CTAs, generous whitespace). Do NOT trigger for cloud infrastructure architecture, AWS, GCP, Azure, Kubernetes, Terraform, container orchestration, deployment pipelines, devops tooling, IaC, observability, or any real cloud product — Nimbus is a synthetic *design* brand, not a cloud product. Do NOT trigger for "nimbus 2000" (broomstick), weather/clouds, or the Nimbus note-taking app.
version: 0.1.0
source_brand: nimbus
source_url: https://nimbus.example.com
extracted_at: 2026-04-10
synthetic: true
---

# Nimbus — per-brand design skill

> Auto-installed by `/design-extractor:apply-design nimbus`. When this skill loads, you are about to produce UI that must look and feel like **Nimbus** — a calm, near-white, cobalt-accented cloud SaaS brand.

## When to use this skill

Trigger positively on phrases like:

- "design X like Nimbus"
- "Nimbus-style landing page / marketing page / pricing page"
- "apply the Nimbus brand to this component"
- "use Nimbus tokens"
- "build me a page that looks like Nimbus"
- "calm cloud SaaS look like Nimbus"
- "Nimbus hero section"
- "Nimbus card"
- "Nimbus button"
- "Nimbus theme"
- "make this feel like Nimbus"

## When NOT to use this skill

Do **not** trigger on:

- Cloud infrastructure topics: AWS, GCP, Azure, Kubernetes, Docker, Terraform, Pulumi, Helm, container orchestration, load balancers, VPCs, S3, EC2, Cloud Run, Lambda
- Deployment / devops: CI/CD pipelines, GitHub Actions, ArgoCD, Flux, observability, Prometheus, Grafana, logging, tracing, SRE
- Infrastructure-as-code authoring of any kind
- The word "cloud" used to mean actual cloud computing
- "Nimbus 2000" or any Harry Potter broomstick reference
- Weather or meteorology ("nimbus cloud")
- The Nimbus Note app or any other product called Nimbus
- Generic cloud architecture diagrams

**The rule:** if the user is asking about *how infrastructure actually works*, this skill is wrong. This skill is only for *visual design that imitates the Nimbus brand's aesthetic*.

## Nimbus in one sentence

Calm, near-white surfaces + one cobalt accent + pill primary CTAs + generous whitespace + almost-invisible shadows + Inter typography + natural 200ms motion. The opposite of hype-driven developer marketing.

## Core tokens (inline — use these exact values)

### Colours

```
surface.default    #FAFBFC   (page bg, warm-cool near-white)
surface.elevated   #FFFFFF   (cards, nav, dialogs)
surface.muted      #F5F7FA   (secondary fills, input bg)

text.primary       #0F1419   (body + headings)
text.secondary     #5C6473   (subheads, supporting)
text.tertiary      #8E96A5   (meta, hints)
text.inverse       #FFFFFF

border.default     #E5E8EE
border.strong      #D5DAE3

accent.primary         #4A6FF5   (cobalt — CTAs, links, focus)
accent.primary-hover   #3B5CD6
accent.secondary       #9B8CFF   (soft violet — gradients only)

state.success     #22C55E
```

### Typography

- Primary: `Inter, system-ui, -apple-system, sans-serif`
- Mono: `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`
- Weights: 400 / 500 / 600 (never 300, never 700)
- Display 56px / h1 44px / h2 32px / h3 24px / body 16px / body-sm 14px
- Line-height: 1.1 for display, 1.25 for h1/h2, 1.6 for body
- Letter-spacing: `-0.01em` on display/h1 only

### Spacing (4px base)

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`
Hero sections: **96–128px** vertical padding. Cards: **24–32px** internal padding. Nav: **72px** tall.

### Radii

- `sm = 4px` (focus rings, small tags)
- `md = 8px` (inputs, secondary buttons)
- `lg = 12px` (cards — the default)
- `full = 9999px` (primary CTAs, avatars)

### Shadows (near-invisible — never exceed alpha 0.06)

- `xs: 0 1px 2px rgba(15,20,25,0.04)`
- `sm: 0 1px 2px rgba(15,20,25,0.04), 0 1px 1px rgba(15,20,25,0.06)`
- `md: 0 4px 12px rgba(15,20,25,0.06), 0 2px 4px rgba(15,20,25,0.04)`
- `focus: 0 0 0 3px rgba(74,111,245,0.25)`

### Motion

- Default duration: **200ms** (natural, not snappy)
- Default easing: `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out)
- Link hover: `color 120ms ease-out`
- Button hover: `background 200ms ease-out`

## Component rules

### Button

1. Primary: cobalt `#4A6FF5` bg, white text, **pill** radius `9999px`, `padding: 12px 24px`, font-size 15px, weight 500.
2. Primary hover: bg `#3B5CD6`, 200ms ease-out transition.
3. Secondary: white bg, `#0F1419` text, 1px `#E5E8EE` border, same pill shape, same padding.
4. Ghost: transparent bg, cobalt text, no border, hover bg `rgba(74,111,245,0.08)`.
5. Focus: always 3px cobalt ring (`shadow.focus`), never an outline.
6. Disabled: `opacity: 0.5; cursor: not-allowed`, no colour change.
7. Never use drop shadows on buttons.
8. Never use gradient fills on buttons.

### Card

1. White bg (`#FFFFFF`), 1px `#E5E8EE` border, **12px** radius, `24px` padding (or `32px` for feature cards).
2. Optional `shadow.xs` at rest, `shadow.sm` on hover.
3. Heading 20px / 600, body 16px / 400 / `#5C6473`, 16px gap between elements.
4. Feature cards get a 48x48 icon frame: `#F5F7FA` bg, `radius.md`, cobalt line icon inside.
5. Cards never hover-lift by more than 2px. No scale transforms.

### Hero

1. Centred copy, max-width 880px for the container, 640px for the subhead.
2. 56px display headline, weight 600, `-0.01em` tracking, `#0F1419`.
3. 20px subhead, weight 400, `#5C6473`, line-height 1.6.
4. Two CTAs: primary (pill cobalt) + secondary (pill white-with-border). Side by side, 16px gap.
5. 96–128px vertical padding.
6. Optional decoration: a soft radial gradient from `#9B8CFF` at 8% alpha in the top-right. Never a full-bleed image. Never a stock photo.
7. No floating product screenshots. No video loops.

## Voice guardrails

Nimbus copy is **confident without hype**.

- Do: "Deploy in one command." / "Regions are picked automatically." / "Pricing scales with usage."
- Don't: "Lightning-fast deploys!" / "Effortlessly manage your entire infrastructure!" / "Affordable, transparent, pay-as-you-go billing."
- No exclamation points. No superlatives. No "effortlessly", "seamlessly", "unleash", "supercharge".
- CTAs are plain verbs + plain nouns: "Start deploying", "Read the docs", "See pricing", "Talk to us". Never "Get started for free!" or "Book your demo today!".
- Tagline: **"Infrastructure that gets out of your way."** — use it verbatim when a tagline slot is present.

## Install command

```bash
/design-extractor:apply-design nimbus
```

This copies this skill into the target project's `.claude/skills/brand-nimbus/SKILL.md` so the rules auto-load on matching prompts.

## Source

- `DESIGN.md` — full 15-section design spec at `templates/sample-brand/DESIGN.md`
- `design-tokens.json` — W3C DTCG 2025.10 format tokens
- `design-tokens.css` — `:root` custom properties
- `replica/index.html` — self-contained Tailwind-CDN landing page reference
- `metadata.json` — library index entry

Nimbus is **synthetic seed data**. Do not confuse it with a real cloud provider.
