# Design Extractor Harness

## Purpose

`design-extractor` extracts reusable design systems from live websites, validates the extracted work, and publishes brand artifacts that other coding agents can reuse.

## Mission

Turn the current plugin from a collection of useful scripts and prompts into a real, governed harness:
- one executable control plane for improvement jobs
- one live validation source of truth
- one feedback-to-learning path
- one explicit blocked-site fallback

## Canonical Harness Surfaces

- Runtime controller: `scripts/run_improvement_job.py`
- Validation worker: `scripts/run_validation_loop.py`
- Publisher: `scripts/publish_brand.py`
- Improvement helpers: `scripts/improvement_job.py`
- MASFactory blueprint: `blueprints/generated/design-extractor-runtime.json`
- UI job routes: `ui/app/api/brands/[slug]/improve/route.ts`, `ui/app/api/brands/[slug]/jobs/[jobId]/route.ts`
- Validation UI: `ui/app/brands/[slug]/page.tsx`

## Active Scope

This harness governs:
- validation and quality-improvement runs
- metadata/report synchronization
- feedback capture and learning backlog
- blocked-site fallback for anti-bot-protected sources

It does not yet replace every extraction worker with MASFactory runtime nodes. Tool-using browser and script execution remains in local controller code.

## Operating Domains

### 1. Tool-Using Control Plane

Local Python and Next.js code owns:
- shelling out to browser and validation scripts
- job lifecycle and polling state
- metadata synchronization
- assisted-capture fallback

### 2. MASFactory Learning Plane

MASFactory governs:
- harness contract
- blueprint structure
- feedback and promotion rules
- experiment/learning state layout

### 3. Claude Code Agent Plane

Claude Code plugin commands and agent markdown files govern:
- operator-assisted improvement
- feedback-driven updates to agent and skill prompts
- session-level guided refinement

## Runtime Assets

- Brand cache: `~/.claude/design-library/cache/<slug>/`
- Published brand: `~/.claude/design-library/brands/<slug>/`
- Improvement jobs: `~/.claude/design-library/cache/<slug>/jobs/`
- Validation report: `~/.claude/design-library/brands/<slug>/validation/report.json`
- Improvement manifest: `~/.claude/design-library/cache/<slug>/validation/improvement-manifest.json`

## Knowledge And Memory Assets

- Feedback ledger: `state/learning/feedback-log.jsonl`
- Learning notes: `state/learning/README.md`
- Repo plan: `docs/plans/2026-04-12-masfactory-harness-redesign.md`
- MASFactory integration guide: `blueprints/generated/design-extractor-runtime.json`

## Operating Cadences

### Validation Run

1. Start job from UI or CLI command.
2. Run validation worker.
3. Sync metadata from current report.
4. Decide:
   - complete
   - continue
   - plateau/stalled
   - assisted-capture required

### Feedback Run

1. Capture user or review feedback.
2. Append to feedback ledger.
3. Map feedback to affected agents, skills, or harness docs.
4. Apply updates.
5. Re-run validation or harness checks.

## Decision Rules

- Validation UI must prefer live report data over cached metadata.
- Learned skills promote only after harness validation passes.
- Anti-bot-protected sites must not be silently retried forever.
- When automated browsing is blocked, the system must switch to assisted-capture mode and say so explicitly.
- Improvement loops are bounded by target, plateau detection, and max iterations.

## Standard Outputs

- validation job state JSON
- synchronized `metadata.json`
- updated `validation/report.json`
- improvement manifest
- feedback ledger entries
- updated docs and harness assets when feedback is applied

## Orchestrator Responsibilities

- create and update job state
- keep brand metadata aligned with validation output
- detect blocked-site conditions
- expose polling-friendly status for the UI
- preserve enough run history for later learning and debugging

## Change Rules

- Do not introduce a second score source of truth.
- Do not add prompt-only orchestration when an executable controller is required.
- Do not auto-promote learned skills without validation evidence.
- Prefer reusable helpers with tests over inline route logic.

## Validation Checklist

- `run_validation_loop.py` defaults to the real UI port
- index generation reads the active metadata schema
- validation UI derives readiness from current report data
- improvement jobs write durable status files
- blocked-site conditions surface assisted-capture guidance
- feedback ledger exists and is documented

