---
name: library-management
description: "Manage the local design library at ~/.claude/design-library — register extracted brands, update index.json, list installed designs, apply a stored brand to a target project via apply_design.py. Trigger on 'register this brand'; 'list installed designs'; 'apply Linear style to my project'; 'show me what is in the design library'; 'install the extracted brand into this repo'; 'update the design index'; 'which brands are in my library'; 'apply the Stripe extraction to my Next.js app'; 'register the extraction in the library'; 'pull a design from the library'. Do NOT trigger for: 'package manager', 'library science', npm/pip/uv library questions, book libraries, general dependency management, or 'library' in the sense of a code library unrelated to extracted design systems."
---

# Library Management

## When this skill is active

- Phase C librarian subagent is updating `~/.claude/design-library/index.json` at the end of an extraction
- User wants to list, search, or inspect brands already stored in the local library
- A stored brand must be applied to a target project (`apply_design.py`) — tokens copied, tailwind config merged, variables wired
- Re-indexing after manual edits to cached extractions
- Cleanup: removing stale or superseded brand entries

## Core principles

- The index is the single source of truth for what the library contains — never scan the filesystem at query time
- Every entry has a slug, source URL, extraction date, confidence summary, and pointer to its DESIGN.md
- Applying a brand to a project is a merge, not an overwrite — existing tailwind config is preserved where it doesn't conflict
- Destructive operations (delete, overwrite) always preview a diff and require confirmation
- The library is local-first: no network calls on list/apply, only on fresh extract

## Out of scope

- npm, pip, uv, or any code-library dependency management
- Book libraries, library science, or other senses of the word "library"
- Running the extraction itself (that is the design-extraction skill's job)
- Rendering the DESIGN.md (that is the design-md-writer skill's job)

## Stub status

This is a Phase 1 stub. The full methodology is documented in:
- `/Users/mehran/Documents/github/design-extractor/docs/concepts.md` (Phase 6 deliverable)
- `/Users/mehran/Documents/github/design-extractor/blueprints/scaffolding-notes.md` (current scaffolding rationale)

The detailed how-to lands in Phase 3 (design-md-writer and library-management). Until then, follow the principles above and reference the existing brand-extractor skill at `~/.claude/plugins/local/brand-extractor/skills/brand-extraction/SKILL.md` for proven patterns.

## Progressive disclosure (planned)

Following harness-mode 3-tier progressive disclosure (metadata -> body -> references), the detailed how-to will be split out of this file as it grows. References will live at:
- `references/index-schema.md` — index.json shape, required fields, slug rules
- `references/apply-design.md` — apply_design.py merge strategy, conflict handling
- `references/cleanup.md` — stale entry detection and safe removal
