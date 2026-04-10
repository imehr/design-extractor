---
name: shadcn-replication
description: "Convert an already-extracted design system into a faithful shadcn/Tailwind HTML replica — map tokens to tailwind.config, wire CSS custom properties, rebuild nav/hero/buttons/cards/footer from components. Trigger on 'build a replica with shadcn'; 'convert these tokens to Tailwind config'; 'rebuild this site in shadcn'; 'map extracted tokens to tailwind'; 'replicate the hero in shadcn'; 'generate a shadcn replica of the extracted brand'; 'port these design tokens into tailwind config'; 'scaffold components from the extracted tokens'; 'produce an HTML replica using shadcn primitives'. Do NOT trigger for: 'build me a shadcn app', 'bootstrap a new Next.js shadcn project', greenfield app scaffolding, 'install shadcn', or generic shadcn component questions unrelated to a prior extraction."
---

# shadcn Replication

## When this skill is active

- An extraction run has produced tokens + patterns and a visual replica is now required
- User asks to convert extracted tokens into `tailwind.config.ts` and CSS variables
- The replica-builder subagent needs to rebuild nav/hero/buttons/cards/footer from shadcn primitives
- Iterative refinement loop is patching the HTML replica and needs token-to-component mapping
- A brand is being ported into an existing shadcn-based codebase

## Core principles

- Every CSS value in the replica must reference a design token — zero hard-coded colours, zero magic numbers
- shadcn primitives are the substrate; the brand comes from token overrides, not custom components
- One replica, many viewports: desktop 1440, tablet 768, mobile 390 at minimum
- The replica is a falsifiable claim about the tokens — if it doesn't look right, the tokens are wrong
- Fidelity beats creativity: the job is to reproduce, not to improve the source

## Out of scope

- Bootstrapping a greenfield shadcn/Next.js project from nothing
- Installing shadcn components into a user's codebase
- Extracting tokens from a URL (that is the design-extraction skill's job)
- Scoring the replica against the reference (that is the visual-diff skill's job)

## Stub status

This is a Phase 1 stub. The full methodology is documented in:
- `/Users/mehran/Documents/github/design-extractor/docs/concepts.md` (Phase 6 deliverable)
- `/Users/mehran/Documents/github/design-extractor/blueprints/scaffolding-notes.md` (current scaffolding rationale)

The detailed how-to lands in Phase 2 (extraction skills). Until then, follow the principles above and reference the existing brand-extractor skill at `~/.claude/plugins/local/brand-extractor/skills/brand-extraction/SKILL.md` for proven patterns.

## Progressive disclosure (planned)

Following harness-mode 3-tier progressive disclosure (metadata -> body -> references), the detailed how-to will be split out of this file as it grows. When the skill is fleshed out, references will live at:
- `references/token-to-tailwind.md` — mapping rules from extracted tokens to `tailwind.config.ts`
- `references/component-recipes.md` — nav, hero, button, card, footer rebuild patterns
- `references/css-variables.md` — CSS custom property wiring and dark-mode handling
