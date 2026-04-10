---
name: visual-diff
description: "Compare a replica screenshot against the reference capture via pixelmatch, structural critique, and token traceability — score fidelity, locate drift regions, feed the refinement loop. Trigger on 'compare two screenshots'; 'score this replica'; 'pixel diff the nav'; 'how close is this replica to the source'; 'visual diff these two images'; 'where does my replica drift from the reference'; 'rate the fidelity of this rebuild'; 'compute the replica score'; 'find the mismatched regions'; 'run the visual critic on this pair'. Do NOT trigger for: 'image classification', 'OCR', 'extract text from image', general-purpose computer vision, or screenshot annotation unrelated to a replica-vs-reference pair."
---

# Visual Diff

## When this skill is active

- A replica has been rendered and must be scored against the reference capture
- Refinement loop needs a drift map to decide which tokens to patch next iteration
- User asks "how close is this" with two screenshots
- Visual-critic subagent is running the producer-reviewer loop
- Gate 5 of the extraction pipeline is evaluating whether the replica is ship-quality

## Core principles

- Three layers, not one: pixel diff (pixelmatch) + structural critique (LLM vision) + token traceability
- A numeric score is meaningless without a region map showing where the diff lives
- Blocking failures (wrong font family, wrong hero colour) halt the loop regardless of aggregate score
- Plateau detection prevents endless iteration: if score delta < 0.01 for 2 rounds, stop
- The replica is wrong until proven right — default posture is skepticism

## Out of scope

- OCR, image classification, or general computer vision
- Standalone screenshot annotation unrelated to a replica-vs-reference pair
- Patching the replica itself (that is the shadcn-replication skill's job via the refinement-agent)
- Rendering new screenshots of the source (that is the design-extraction skill's job)

## Stub status

This is a Phase 1 stub. The full methodology is documented in:
- `/Users/mehran/Documents/github/design-extractor/docs/concepts.md` (Phase 6 deliverable)
- `/Users/mehran/Documents/github/design-extractor/blueprints/scaffolding-notes.md` (current scaffolding rationale)

The detailed how-to lands in Phase 4 (visual-diff). Until then, follow the principles above and reference the existing brand-extractor skill at `~/.claude/plugins/local/brand-extractor/skills/brand-extraction/SKILL.md` for proven patterns.

## Progressive disclosure (planned)

Following harness-mode 3-tier progressive disclosure (metadata -> body -> references), the detailed how-to will be split out of this file as it grows. References will live at:
- `references/pixel-compare.md` — pixelmatch invocation, tolerance tuning, region extraction
- `references/structural-critique.md` — LLM vision prompt for layout and token-level critique
- `references/score-rubric.md` — weight formula, blocking-failure list, plateau rules
