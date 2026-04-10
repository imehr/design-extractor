# design-extractor

Extract a complete, validated design system from any URL — patterns and relationships, not just colours. Generates a per-brand `DESIGN.md`, an installable per-brand `SKILL.md`, and an iteratively-refined HTML replica that matches reference screenshots at >=0.85 similarity.

> **Status:** v0.1.0 — Phase 1 skeleton. End-to-end extraction lands in Phase 4. See `blueprints/scaffolding-notes.md` for the architecture and `tests/fixtures/baseline-report.md` for the Phase 0 stress test results.

## What it does

Given a URL, design-extractor produces:

- A `DESIGN.md` documenting tokens, typography, spacing, components, motion, voice, and **15 pattern signals** (spacing rhythm, type scale ratio, alignment grid, motion language, voice-design alignment, ...)
- A self-contained shadcn/Tailwind HTML **replica** that visually matches the reference at >=0.85 similarity
- A per-brand `SKILL.md` you can install into any project so Claude designs in that brand's style on demand
- All assets (logos, favicon, icon system) extracted as SVGs
- A validation scorecard with five gate verdicts and the iteration trail

Everything lands in `~/.claude/design-library/brands/<slug>/` and is browsable via a Next.js library UI.

## Install

```bash
# 1. Clone
git clone https://github.com/imehr/design-extractor.git ~/.claude/plugins/local/design-extractor

# 2. Python deps
python3 -m pip install --user --break-system-packages playwright pillow pixelmatch numpy
python3 -m playwright install chromium

# 3. Node deps for the library UI (only when you first run /design-extractor:browse)
# auto-installed by scripts/launch_ui.sh
```

## Quickstart

Once Phase 4 lands:

```bash
# In Claude Code
/design-extractor:extract https://linear.app
# ... watches the iteration loop converge to >=0.85 similarity
/design-extractor:browse
# ... opens http://localhost:5173 with your library
```

For now (Phase 1), the only working command is:

```bash
/design-extractor:browse-library     # opens the static Nimbus sample brand
```

## Architecture at a glance

```
/design-extractor:extract <url>

Phase A — Extract (parallel where independent)
  recon-agent     -> screenshots + page-type detection
  token-extractor -> CSS custom properties + computed styles
  asset-extractor -> logos, icons, favicons
  voice-analyst   -> tone dimensions + CTA patterns
  pattern-analyst -> 15 pattern signals (9 measurable + 6 LLM)
  replica-builder -> shadcn/Tailwind HTML replica

Phase B — Refine (loop, max 5 iters)
  pixel diff -> visual-critic -> refinement-agent -> re-render -> re-score
  STOP when overall_score >= 0.85 AND blocking_failures == []

Phase C — Publish
  documentarian  -> DESIGN.md
  skill-packager -> per-brand SKILL.md
  librarian      -> ~/.claude/design-library/index.json
```

11 native Claude Code subagents, 6 skills, hand-rolled orchestration in `commands/extract-design.md`. No runtime framework dependency.

## Documentation

- `docs/getting-started.md` — install, first extraction, troubleshooting
- `docs/concepts.md` — extraction methodology, gates, scoring
- `docs/design-md-spec.md` — DESIGN.md schema
- `docs/per-brand-skill-spec.md` — per-brand SKILL.md format and trigger testing
- `docs/patterns-and-relationships.md` — the 15 pattern signals
- `docs/ui-guide.md` — library browser walkthrough
- `docs/troubleshooting.md` — known failure modes and degradation rules
- `blueprints/scaffolding-notes.md` — architecture rationale
- `tests/fixtures/linear-app-ground-truth.md` — gold-standard hand-written DESIGN.md
- `tests/fixtures/baseline-report.md` — 10-URL Phase 0 stress test

## License

MIT
