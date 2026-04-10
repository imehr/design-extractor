---
name: design-extraction
description: "Extract complete design systems from live URLs via Playwright recon, computed-style token mining, asset harvesting, and LLM voice analysis. Trigger on 'extract design system from URL'; 'extract design tokens from this site'; 'what does this site look like'; 'reverse-engineer this brand'; 'pull the design system out of <url>'; 'clone the look of <site>'; 'capture the visual language of this page'; 'mine tokens from <url>'; 'snapshot the brand'; 'audit the design of this URL'. Do NOT trigger for: 'design from scratch', 'create a new brand', greenfield visual design work, logo creation, or brand strategy with no source URL."
---

# Design Extraction

## When this skill is active

- User supplies a live URL and asks for its colours, type scale, spacing, components, or voice
- Existing brand/site needs to be reverse-engineered into reusable tokens
- A screenshot + URL is provided with "make this into a design system"
- Migration work where the source of truth is a deployed site, not a Figma file
- Audit tasks where the user wants to know what design decisions a site has made

## Core principles

- The source of truth is the live computed DOM, not a human's recollection of the brand
- Frequency analysis beats single-sample inspection: a token is a token when it repeats
- Confidence must travel with every extracted value (HIGH / MEDIUM / LOW)
- Extraction without validation is a guess; every token claim must survive a visual replica
- Noise (third-party widgets, ad scripts, inline browser defaults) is excluded before synthesis

## Out of scope

- Inventing new brand identities without a source URL
- Running the full refinement loop (that is the visual-diff skill's job)
- Writing the DESIGN.md output file (that is the design-md-writer skill's job)
- Registering the result in the library index (that is the library-management skill's job)

## Stub status

This is a Phase 1 stub. The full methodology is documented in:
- `/Users/mehran/Documents/github/design-extractor/docs/concepts.md` (Phase 6 deliverable)
- `/Users/mehran/Documents/github/design-extractor/blueprints/scaffolding-notes.md` (current scaffolding rationale)

The detailed how-to lands in Phase 2 (extraction skills). Until then, follow the principles above and reference the existing brand-extractor skill at `~/.claude/plugins/local/brand-extractor/skills/brand-extraction/SKILL.md` for proven patterns.

## Progressive disclosure (planned)

Following harness-mode 3-tier progressive disclosure (metadata -> body -> references), the detailed how-to will be split out of this file as it grows. When the skill is fleshed out, references will live at:
- `references/recon-checklist.md` — reconnaissance steps, breakpoints, bot-detection workarounds
- `references/token-mining.md` — computed-style walker, frequency scoring, confidence rubric
- `references/voice-analysis.md` — tone dimensions, CTA patterns, language variant detection
- `references/noise-filter.md` — third-party and default-value exclusion rules
