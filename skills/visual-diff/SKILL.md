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

## How it works

1. **Capture** — Use agent-browser to screenshot original pages and replica pages at identical viewport (1280x720)
   - `agent-browser open "{url}" --session orig && agent-browser screenshot {path} --session orig`

2. **Compare** — Run `python3 scripts/run_validation_loop.py --brand {slug} --score-only` to pixel-compare all pages

3. **Generate diff images** — Use pixelmatch to produce red/yellow diff images showing exactly where pixels diverge

4. **Identify root causes** — Use agent-browser eval to measure exact DOM positions on originals and compare with replica CSS values

5. **Fix cycle** — Edit React components, re-screenshot replica, re-compare, loop

## Key thresholds

- Target: 80% viewport pixel match (close threshold=0.3)
- Hero sections: Use agent-browser eval to get exact height, text position, image position
- Content padding: Measure h1.left from original, use px-[{value}px] in replica

## Progressive disclosure

Following harness-mode 3-tier progressive disclosure (metadata -> body -> references), detailed how-to content is split into reference files as it grows. References:
- `references/pixel-compare.md` — pixelmatch invocation, tolerance tuning, region extraction
- `references/structural-critique.md` — LLM vision prompt for layout and token-level critique
- `references/score-rubric.md` — weight formula, blocking-failure list, plateau rules
