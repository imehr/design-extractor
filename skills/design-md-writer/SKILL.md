---
name: design-md-writer
description: "Render the canonical DESIGN.md brand document from extracted tokens, patterns, assets, voice analysis, and validation evidence — using the Jinja2 template and confidence-badged tables. Trigger on 'write a DESIGN.md'; 'format brand documentation'; 'produce the design doc for this extraction'; 'render the DESIGN.md from the cache'; 'generate the brand document'; 'compile the design system markdown'; 'write up the extraction as a DESIGN.md'; 'produce the per-brand design doc'; 'format the extracted tokens into markdown'. Do NOT trigger for: 'write project README', 'write a blog post about design', generic markdown writing, documentation for unrelated codebases, or design articles with no extraction artefacts to pull from."
---

# DESIGN.md Writer

## When this skill is active

- Phase C documentarian subagent is rendering the brand document at the end of an extraction
- All extraction artefacts exist in `~/.claude/design-library/cache/<slug>/` and must become a single canonical markdown file
- User asks for the DESIGN.md for a brand that has already been extracted
- A re-render is needed because tokens changed but the extraction cache is still valid
- The markdown companion to the `design-system.html` is being produced

## Core principles

- The document is rendered from a template, not written freehand — consistency across brands is non-negotiable
- Every token table carries a confidence badge (HIGH / MEDIUM / LOW) and sample count
- Validation evidence (pixel score, blocking failures, gate results) lives inline next to the claims it supports
- Link to artefacts, do not re-embed them: SVG logo, screenshots, design-system.html
- The reader is a senior designer auditing the extraction, not a marketing lead reading a brand deck

## Out of scope

- Writing project READMEs or generic markdown unrelated to an extraction
- Authoring brand strategy or marketing copy
- Running the extraction itself (that is the design-extraction skill's job)
- Updating the library index (that is the library-management skill's job)

## Stub status

This is a Phase 1 stub. The full methodology is documented in:
- `/Users/mehran/Documents/github/design-extractor/docs/concepts.md` (Phase 6 deliverable)
- `/Users/mehran/Documents/github/design-extractor/blueprints/scaffolding-notes.md` (current scaffolding rationale)

The detailed how-to lands in Phase 3 (design-md-writer and library-management). Until then, follow the principles above and reference the existing brand-extractor skill at `~/.claude/plugins/local/brand-extractor/skills/brand-extraction/SKILL.md` for proven patterns.

## Progressive disclosure (planned)

Following harness-mode 3-tier progressive disclosure (metadata -> body -> references), the detailed how-to will be split out of this file as it grows. References will live at:
- `references/design-md-template.md` — section order, required fields, confidence badge rules
- `references/evidence-inlining.md` — where to place screenshots, scores, validation gates
- `references/cross-links.md` — linking to tokens.json, SVG logo, design-system.html
