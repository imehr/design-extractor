# design-extractor

Extract a complete, validated design system from any URL — patterns and relationships, not just colours. Generates a per-brand `DESIGN.md`, an installable per-brand `SKILL.md`, and a validated replica that can be improved from the local webapp.

> **Status:** v0.3.0 — 3 brands extracted (Westpac 85%, Woolworths Group 68%, Woolworths Supermarket 86%). End-to-end pipeline: DOM extraction → React/shadcn replicas → pixel validation → design tokens + DESIGN.md + SKILL.md auto-generated. Self-improving: every extraction bug feeds back into agent/skill code.

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

```bash
/design-extractor:extract https://linear.app
/design-extractor:browse
```

## Improvement workflow

The local webapp exposes a Validation-tab `Improve Quality` action that starts a filesystem-backed improvement job. In Claude Code, the matching command is:

```bash
/design-extractor:improve <slug>
```

Each improvement iteration now:
- runs validation
- reads the live improvement manifest
- invokes Claude on the worst failing replica files
- re-validates until the score reaches target, plateaus, or needs operator help

When anti-bot protection blocks automated source capture, the system switches to assisted-capture mode instead of asking you to abandon the run.

To feed operator or review feedback back into the harness itself:

```bash
/design-extractor:learn-feedback <slug> "<feedback>"
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

Phase C — Validate (harness loop)
  run_validation_loop.py -> screenshot comparison -> improvement manifest
  validation-monitor     -> dispatch fix agents per failing page -> re-score
  STOP when avg >= 80% or plateau

Phase D — Publish (automated)
  publish_brand.py -> design-tokens.json + DESIGN.md + SKILL.md + metadata
  quality checklist -> validate colors, fonts, assets, description accuracy
  librarian        -> ~/.claude/design-library/index.json
```

### Extracted Brands

| Brand | Pages | Avg Score | Status |
|-------|-------|-----------|--------|
| Westpac | 5 | 85% | 7/8 gates |
| Woolworths Group | 5 | 68% | 7/8 gates |
| Woolworths Supermarket | 5 | 86% | 3/5 pages pass |

Claude Code still handles the brand-specific reasoning and editing work, but the control plane is now explicit:
- `scripts/run_improvement_job.py` owns retries, status files, and Claude refinement dispatch
- `scripts/run_validation_loop.py` owns validation artifacts and report generation
- `HARNESS.md` and `blueprints/generated/design-extractor-runtime.json` define the MASFactory-aligned harness contract
- the local UI at `http://localhost:5173` is the monitoring and operator surface

## Documentation

- `docs/getting-started.md` — install, first extraction, troubleshooting
- `docs/concepts.md` — extraction methodology, gates, scoring
- `docs/design-md-spec.md` — DESIGN.md schema
- `docs/per-brand-skill-spec.md` — per-brand SKILL.md format and trigger testing
- `docs/patterns-and-relationships.md` — the 15 pattern signals
- `docs/ui-guide.md` — library browser walkthrough
- `HARNESS.md` — harness contract for the hybrid MASFactory-aligned controller
- `docs/troubleshooting.md` — known failure modes and degradation rules
- `blueprints/scaffolding-notes.md` — architecture rationale
- `tests/fixtures/linear-app-ground-truth.md` — gold-standard hand-written DESIGN.md
- `tests/fixtures/baseline-report.md` — 10-URL Phase 0 stress test

## License

MIT
