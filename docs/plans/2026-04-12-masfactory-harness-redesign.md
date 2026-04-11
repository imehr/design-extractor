# MASFactory Harness Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn `design-extractor` into a real MASFactory-aligned, self-improving harness with a working local improvement controller, blocked-site fallback, and UI documentation.

**Architecture:** Keep tool-using extraction and validation in local Python/Next.js control-plane code, but make MASFactory the harness contract and learning surface. The plugin will use a hybrid model: executable local controller for scripts and browser work, plus MASFactory-compatible `HARNESS.md`, blueprint, feedback ledger, and promotion rules for skills and agent guidance.

**Tech Stack:** Python 3.11, Next.js 16, React 19, TypeScript 5, pytest, MASFactory runtime assets, Claude Code plugin commands.

---

### Task 1: Lock The Harness Contract

**Files:**
- Create: `HARNESS.md`
- Create: `blueprints/generated/design-extractor-runtime.json`
- Create: `docs/plans/2026-04-12-masfactory-harness-redesign.md`

**Step 1: Write the harness contract**

Document:
- purpose and mission
- canonical runtime surfaces
- job state and learning state paths
- blocked-site fallback policy
- promotion rules for learned skills

**Step 2: Add MASFactory blueprint scaffold**

Create a runtime blueprint that documents:
- validation/improvement workflow shape
- optimization loop ownership
- skill registry configuration
- experiment ledger path

**Step 3: Verify files exist**

Run: `test -f HARNESS.md && test -f blueprints/generated/design-extractor-runtime.json`

Expected: exit `0`

### Task 2: Fix Validation And Metadata Contract Drift

**Files:**
- Modify: `scripts/run_validation_loop.py`
- Modify: `scripts/update_library_index.py`
- Create: `scripts/improvement_job.py`
- Modify: `tests/test_update_library_index.py`
- Create: `tests/test_improvement_job.py`

**Step 1: Write failing tests**

Cover:
- index generation reads top-level `overall_score`
- metadata sync derives status from `validation/report.json`
- blocked-site detection maps Akamai/EdgeSuite access denial to assisted-capture mode

**Step 2: Run tests to verify failure**

Run: `pytest tests/test_update_library_index.py tests/test_improvement_job.py -q`

Expected: failures proving current schema drift and missing controller helpers

**Step 3: Implement minimal fixes**

Add:
- correct default UI port `5173`
- schema fallback in `update_library_index.py`
- metadata/report sync helper in `scripts/improvement_job.py`
- blocked-site detection and job-state helper logic

**Step 4: Re-run targeted tests**

Run: `pytest tests/test_update_library_index.py tests/test_improvement_job.py -q`

Expected: all targeted tests pass

### Task 3: Add The Local Improvement Controller

**Files:**
- Create: `scripts/run_improvement_job.py`
- Modify: `scripts/improvement_job.py`
- Create: `ui/app/api/brands/[slug]/improve/route.ts`
- Create: `ui/app/api/brands/[slug]/jobs/[jobId]/route.ts`

**Step 1: Write failing controller tests**

If practical in Python, cover:
- job-state JSON lifecycle
- score synchronization after each validation pass
- assisted-capture state when anti-bot protection is detected

**Step 2: Implement the controller**

Requirements:
- create a job id
- write incremental job state to disk
- call `run_validation_loop.py`
- sync `metadata.json` from current report
- stop on pass, plateau, max iterations, or blocked-site fallback

**Step 3: Implement API routes**

Requirements:
- POST creates a job and spawns the controller
- GET returns current job state for polling

**Step 4: Verify script help and API types**

Run:
- `python3 scripts/run_improvement_job.py --help`
- `pnpm -C ui exec tsc --noEmit`

Expected: help renders, typecheck passes

### Task 4: Wire The Validation Tab

**Files:**
- Modify: `ui/app/brands/[slug]/page.tsx`
- Modify: `ui/app/layout.tsx`
- Modify: `ui/app/api/brands/[slug]/route.ts`

**Step 1: Derive the displayed score from live validation data**

Use `validation_report.viewport_avg` as the primary score when present.

**Step 2: Add the Improve Quality button**

Behavior:
- POST to `/api/brands/<slug>/improve`
- poll `/api/brands/<slug>/jobs/<jobId>`
- show running, blocked, stalled, or completed states

**Step 3: Add blocked-site guidance**

If status is `assisted_capture_required`, show exact next steps in the UI rather than generic failure text.

**Step 4: Verify lint/typecheck**

Run:
- `pnpm -C ui lint`
- `pnpm -C ui exec tsc --noEmit`

Expected: no errors

### Task 5: Add UI Documentation

**Files:**
- Create: `ui/app/docs/page.tsx`
- Modify: `ui/app/page.tsx`
- Modify: `ui/app/layout.tsx`
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/ui-guide.md`

**Step 1: Add a Docs page in the web UI**

Cover:
- step-by-step use
- extraction workflow
- validation workflow
- blocked-site fallback
- how feedback improves skills and harness assets

**Step 2: Link the docs from the UI shell**

Add visible navigation from header/home.

**Step 3: Update repo docs**

Make the CLI/plugin docs consistent with the new controller and docs page.

**Step 4: Verify build**

Run: `pnpm -C ui build`

Expected: successful production build

### Task 6: Add Feedback-To-Learning Surfaces

**Files:**
- Create: `state/learning/.gitkeep`
- Create: `state/learning/README.md`
- Modify: `HARNESS.md`
- Modify: `README.md`
- Create: `commands/improve.md`
- Create: `commands/learn-feedback.md`

**Step 1: Define feedback storage**

Create canonical files for:
- feedback log
- learning backlog
- promotion review notes

**Step 2: Add plugin commands**

Commands should instruct Claude Code to:
- record feedback
- update relevant agent/skill/harness files
- rerun validation where appropriate

**Step 3: Document promotion gates**

Learned skills promote only after harness validation passes.

**Step 4: Verify command files exist**

Run: `test -f commands/improve.md && test -f commands/learn-feedback.md`

Expected: exit `0`

### Task 7: Update MASFactory Repo Documentation

**Files:**
- Create: `/Users/mehran/Documents/github/masfactory/docs/guides/tool-using-hybrid-harnesses.md`
- Modify: `/Users/mehran/Documents/github/masfactory/README.md`

**Step 1: Add a guide**

Describe the hybrid pattern for tool-using plugins:
- MASFactory as harness and learning layer
- local controller for tools and browser automation
- job state and contract feedback loop

**Step 2: Link it from README**

Add a short pointer in the relevant execution/harness section.

**Step 3: Verify no accidental code changes**

Run: `git -C /Users/mehran/Documents/github/masfactory diff --stat`

Expected: docs-only change set unless intentionally expanded

### Task 8: Final Verification

**Files:**
- Verify all touched files

**Step 1: Run Python tests**

Run: `pytest -q`

**Step 2: Run UI verification**

Run:
- `pnpm -C ui lint`
- `pnpm -C ui exec tsc --noEmit`
- `pnpm -C ui build`

**Step 3: Report actual status**

Summarize:
- what is implemented now
- what remains intentionally future work
- exact verification evidence
