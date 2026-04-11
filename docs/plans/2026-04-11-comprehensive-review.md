# Comprehensive Review: What Works, What's Broken, What to Fix

**Date:** 2026-04-11
**Context:** After ~20 commits and a full session of iteration, the design-extractor has fundamental architectural problems that incremental fixes won't solve.

## What works

1. **DOM extraction via agent-browser** — extracting real content from 5 pages works. JSON files have accurate headings, links, images.
2. **Asset downloading** — 35+ images, fonts, social SVGs, artwork all downloaded correctly.
3. **SVG logo extraction** — the tagName bug was fixed, logos extract properly.
4. **React/shadcn components** — 5 pages built as Next.js routes with shared header/footer.
5. **Real Westpac-bold font** — downloaded and rendering correctly.
6. **DESIGN.md** — 1,137 lines of Apple-quality documentation.
7. **Brand detail UI** — 10 tabs, token viewer with swatches, radii, shadows, breakpoints.

## What's broken

### 1. The UI has no connection to Claude Code
The Next.js app at localhost:3000 is a static viewer. It reads files from disk and displays them. It cannot:
- Trigger a new extraction
- Run the validation loop
- Dispatch agents
- Start/stop the Monitor tool
- Make decisions about "done" vs "not done"

The UI should be a dashboard that CONTROLS the extraction pipeline, not just displays results.

### 2. The validation loop is documentation, not code
`agents/validation-monitor.md` describes what should happen but was never executed. The Monitor tool was started once and timed out. No agent was dispatched to improve scores. The 51% score never changed because nothing was running.

### 3. Pixel comparison is the wrong metric
Raw pixel comparison between a live website (with dynamic content, ads, cookie banners, lazy-loaded images) and a React replica will never reach 90%. The comparison needs to be:
- **Structural**: Are the correct sections present in the correct order?
- **Color**: Are the brand colors used correctly?
- **Typography**: Are the correct fonts, sizes, weights used?
- **Layout**: Are dimensions, spacing, and alignment close?
- **Content**: Does the text match what was extracted from the DOM?

### 4. Incremental UI edits are fragile
The brand detail page (page.tsx) has been edited 15+ times this session. Each edit risks breaking JSX nesting, introducing stale data, or conflicting with previous edits. The file is now ~1400 lines and unmaintainable. It needs to be split into separate components per tab.

### 5. No automation connects the pieces
The pieces exist independently:
- `extract_tokens.py` extracts tokens
- `agent-browser` captures screenshots
- `replica-builder` agent builds pages
- `visual-critic` agent critiques
- `validation-monitor` agent orchestrates

But nothing connects them into an automated pipeline that runs end-to-end. The `commands/extract-design.md` describes the pipeline but Claude Code can't execute a 150-line prompt reliably without losing context.

### 6. "Done" has no definition
There's no programmatic definition of when an extraction is complete. The validation gates are displayed in the UI but not enforced by code. No script checks all gates and outputs a verdict.

## Architecture proposal

### Layer 1: Extraction scripts (Python)
Standalone Python scripts that can be run from the command line:
```
scripts/extract_dom.py --url https://example.com --output cache/slug/
scripts/download_assets.py --cache cache/slug/ --output public/brands/slug/
scripts/compare_screenshots.py --original cache/slug/orig/ --replica cache/slug/repl/
scripts/validate_extraction.py --cache cache/slug/ --output validation-report.json
```

These scripts do the mechanical work. They don't need Claude Code.

### Layer 2: Claude Code agents (markdown)
Agents that use the scripts + creative judgment:
- `replica-builder`: reads DOM JSON + assets, writes React components
- `visual-critic`: reads comparison results, identifies what to fix
- `refinement-agent`: edits React components based on critique

### Layer 3: Orchestrator (a single script or command)
One entry point that runs the full pipeline:
```bash
python3 scripts/run_extraction.py --url https://example.com
```
This script:
1. Runs DOM extraction on 5 pages
2. Downloads all assets
3. Dispatches replica-builder agent (via claude CLI)
4. Runs screenshot comparison
5. If score < threshold, dispatches visual-critic + refinement-agent
6. Re-compares
7. Loops up to N times
8. Writes final validation report
9. Outputs verdict: PASS/FAIL with details

### Layer 4: UI (Next.js)
Reads the validation report and displays results. Does NOT control the pipeline — the pipeline is controlled by the orchestrator script.

The UI shows:
- Library index (all brands)
- Brand detail (tokens, components, preview, validation, usage)
- Validation verdict prominently displayed
- File locations and copy commands

### What this changes
- The orchestrator is a Python script, not a 150-line markdown prompt
- Validation is a script that returns exit code 0 (pass) or 1 (fail)
- The pipeline can run headless without the UI
- The UI is purely a viewer, not trying to be a controller
- Each piece is testable independently

## Immediate next steps (prioritised)

1. Write `scripts/validate_extraction.py` — checks all 8 gates, outputs verdict
2. Write `scripts/compare_screenshots.py` — structural + pixel comparison
3. Split `page.tsx` into separate tab components
4. Run the actual validation and fix what it flags
5. Redesign the homepage to match getdesign.md quality
6. Test the full pipeline on a second brand (not Westpac)
