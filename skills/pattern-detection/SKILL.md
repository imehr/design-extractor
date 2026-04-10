---
name: pattern-detection
description: "Compute the measurable and interpretive signals that define a design's feel — spacing rhythm, type scale ratio, density, contrast energy, radius personality, motion temperament. Trigger on 'compute spacing rhythm'; 'what is the type scale ratio'; 'is this airy or dense'; 'detect the design patterns'; 'analyse the visual rhythm'; 'find the base unit'; 'is this brutalist or soft'; 'score the density of this layout'; 'what ratio is the type scale'; 'classify the design personality'; 'is the radius system sharp or pill'. Do NOT trigger for: 'explain typography theory', academic typography lessons, generic design-principles tutorials, or requests for history of grid systems with no concrete tokens to analyse."
---

# Pattern Detection

## When this skill is active

- Extracted tokens exist and need to be interpreted into a design personality
- User asks a qualitative question ("is this airy?", "is it brutalist?") that must be answered quantitatively
- A replica is drifting from the source feel and you need to diagnose which signal is off
- Cross-brand comparison: is Brand A denser than Brand B, and by how much
- Feeding pattern-analyst output into the refinement loop as objective drift metrics

## Core principles

- Feel is measurable: every subjective descriptor maps to at least one numeric signal
- Nine measurable signals (spacing GCD, type ratio, whitespace ratio, contrast energy, radius median, shadow depth, stroke weight, density, motion duration) anchor interpretation
- Six LLM-interpreted signals (personality, mood, era, genre, formality, energy) sit on top of the measurables, never replace them
- Patterns are reported with evidence: the number, the sample, the confidence
- A pattern claim with no measurable backing is discarded

## Out of scope

- Teaching typography, grid, or colour theory without concrete tokens to analyse
- Running the extraction itself (that is the design-extraction skill's job)
- Rebuilding the replica (that is the shadcn-replication skill's job)
- Scoring a rendered replica against a reference (that is the visual-diff skill's job)

## Stub status

This is a Phase 1 stub. The full methodology is documented in:
- `/Users/mehran/Documents/github/design-extractor/docs/concepts.md` (Phase 6 deliverable)
- `/Users/mehran/Documents/github/design-extractor/blueprints/scaffolding-notes.md` (current scaffolding rationale)

The detailed how-to lands in Phase 2 (extraction skills). Until then, follow the principles above and reference the existing brand-extractor skill at `~/.claude/plugins/local/brand-extractor/skills/brand-extraction/SKILL.md` for proven patterns.

## Progressive disclosure (planned)

Following harness-mode 3-tier progressive disclosure (metadata -> body -> references), the detailed how-to will be split out of this file as it grows. When the skill is fleshed out, references will live at:
- `references/measurable-signals.md` — the 9 numeric signals, formulas, and thresholds
- `references/interpretive-signals.md` — the 6 LLM signals and their evidence rules
- `references/ratio-catalogue.md` — standard type scale ratios (minor second, major third, perfect fourth, golden)
