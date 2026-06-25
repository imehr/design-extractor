# UI Extraction Pipeline Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every URL submitted from the UI run the complete extraction orchestrator and produce a reviewable library package with pages, HTML snapshots, tokens, DESIGN.md, SKILL.md, components, validation evidence, and a registered library entry.

**Architecture:** The WebSocket server should stop relying on loosely scoped agent side effects for extraction. It should run `scripts/extract_brand.py` as the canonical end-to-end pipeline, stream its output into the existing monitoring UI, and keep a minimal metadata/index fallback only for visibly failed packages.

**Tech Stack:** Python WebSocket runner, `extract_brand.py`, Next.js UI, pytest, ESLint.

---

### Task 1: Add Orchestrator Command Tests

**Files:**
- Modify: `tests/test_model_provider_routing.py`
- Modify: `scripts/ws_extraction_server.py`

**Steps:**
1. Add a test that a `ExtractionJob(url, max_pages=10)` builds an `extract_brand.py --url <url> --page-limit 10` command.
2. Add a test that a missing/low `max_pages` is clamped to at least 5 and at most 10.
3. Run `python3 -m pytest tests/test_model_provider_routing.py -q` and verify the new tests fail before implementation.

### Task 2: Run the Canonical Orchestrator from WebSocket

**Files:**
- Modify: `scripts/ws_extraction_server.py`

**Steps:**
1. Add `build_orchestrator_command()` and route `ExtractionJob.run()` through it.
2. Stream the subprocess output as `agent_log` events.
3. Map `extract_brand.py` phases to the existing UI agents: recon, DOM, assets, replica, validation, documentarian, librarian.
4. Keep metadata/index fallback after a failed orchestrator run, but do not report green success on failure.

### Task 3: Make UI Defaults Match the Package Contract

**Files:**
- Modify: `ui/app/extract/page.tsx`

**Steps:**
1. Change `max_pages` sent by the UI from 5 to 10.
2. Keep the warning completion state for failed phases.
3. Run `pnpm --dir ui lint -- app/extract/page.tsx`.

### Task 4: Verify End-to-End Readiness

**Files:**
- No production edits unless tests expose a gap.

**Steps:**
1. Run `python3 -m pytest tests/test_update_library_index.py tests/test_model_provider_routing.py -q`.
2. Run `python3 -m py_compile scripts/ws_extraction_server.py scripts/update_library_index.py`.
3. Restart `scripts/ws_extraction_server.py`.
4. Verify `/api/library` and the browser still show newly indexed brands.
