---
name: learn-feedback
description: Record user feedback and apply it to the design-extractor harness, agents, skills, and docs so future runs improve. Trigger for: learn from this feedback, update the harness based on this review, apply this critique system-wide, improve the agents from this note.
argument-hint: [--brand <slug>] [--page <slug>] <feedback text>
---

# /design-extractor:learn-feedback

Use the provided feedback to improve the harness itself.

The user-supplied arguments are: $ARGUMENTS

## Procedure

### Step 1 — Collect feedback

Parse `$ARGUMENTS` to extract:

- `--brand <slug>` (optional) — the brand this feedback relates to
- `--page <slug>` (optional) — the specific page this feedback relates to
- The remaining positional text is the feedback body

If no brand or page is provided, proceed with `brand: null` and `page: null`.

### Step 2 — Append to feedback log

Before making any file changes, log the feedback entry.

Run:

```
python3 scripts/improvement_job.py append-feedback --brand "<slug>" --page "<slug>" --feedback "<text>"
```

Or, if that CLI path is unavailable, append directly to `state/learning/feedback-log.jsonl` using the `append_feedback_entry` pattern from `scripts/improvement_job.py`:

```python
entry = {
    "brand": brand_slug,
    "page": page_slug,
    "feedback_text": feedback_body,
    "source": "user",
    "category": classify(feedback_body)
}
```

The `category` field should be auto-classified from the feedback text content using these keywords:

| Category | Keywords |
|---|---|
| `layout` | layout, spacing, width, height, margin, padding, gap, alignment, overflow, positioning |
| `color` | color, colour, shade, tint, gradient, opacity, background-color, foreground |
| `typography` | font, typeface, weight, size, line-height, letter-spacing, text-decoration |
| `blocked-site` | blocked, captcha, access denied, bot detection, anti-bot, 403, paywall |
| `documentation` | docs, documentation, readme, unclear, confusing, missing docs, instructions |
| `library` | library, index, catalog, registry, skill list, missing component |

### Step 3 — Classify affected surface

Based on the category determined in Step 2, identify the agent and skill to patch:

| Category | Agent | Skill | File to read |
|---|---|---|---|
| `layout` | `replica-builder` | `shadcn-replication` | `agents/replica-builder.md` → `skills/shadcn-replication.md` |
| `color` | `dom-extractor` | `design-extraction` | `agents/dom-extractor.md` → `skills/design-extraction.md` |
| `typography` | `dom-extractor` | `pattern-detection` | `agents/dom-extractor.md` → `skills/pattern-detection.md` |
| `blocked-site` | `recon-agent` | `design-extraction` | `agents/recon-agent.md` → `skills/design-extraction.md` |
| `documentation` | `documentarian` | `design-md-writer` | `agents/documentarian.md` → `skills/design-md-writer.md` |
| `library` | `librarian` | `library-management` | `agents/librarian.md` → `skills/library-management.md` |

If the feedback spans multiple categories, repeat Steps 3–6 for each.

### Step 4 — Read the affected file

Open the identified agent `.md` file and skill `.md` file. Understand the current principles, steps, and thresholds before editing.

### Step 5 — Generate a patch

Determine what principle, step, or threshold should be added or changed in the agent or skill file. The change must:

- Address the root cause, not just the symptom
- Be generalized so it applies to future runs, not just the specific brand
- Be minimal — add or adjust one principle/step/threshold, not rewrite the file

Write the edit to the affected `.md` file.

### Step 6 — Log the change

Run:

```
python3 scripts/skill_manager.py log-change --type <agent_update|skill_patch> --description "<what changed>" --files "<affected files>" --brand "<slug>" --source feedback
```

Use `agent_update` when the change is in an `agents/*.md` file.
Use `skill_patch` when the change is in a `skills/*.md` file.

### Step 7 — Verify

Run:

```
pytest tests/ -q
```

If tests fail:

1. Revert the file change made in Step 5
2. Append a note to `state/learning/feedback-log.jsonl` with `{"brand": "<slug>", "page": null, "feedback_text": "REVERTED: <original feedback>", "source": "system", "category": "<category>", "reason": "pytest regression after patch"}`

### Step 8 — Report

Tell the user:

- What feedback was logged (category, brand, page)
- Which agent/skill file was patched
- What specific change was made (principle added, threshold adjusted, etc.)
- The changelog entry ID or timestamp
- Whether pytest passed or the change was reverted

## Rules

- Every feedback entry MUST be logged to `state/learning/feedback-log.jsonl` before any file changes are made.
- Every file change MUST be logged to the changelog via `python3 scripts/skill_manager.py log-change`.
- If pytest fails after a change, revert the change immediately and record the revert in the feedback ledger.
- Classification must always resolve to an agent/skill pair. If the feedback is ambiguous, choose the pair that covers the most likely root cause.
- Treat review findings and user feedback as system-improvement input, not just one-off notes.
- Prefer reusable, generalized fixes over brand-specific hacks unless the bug is truly brand-specific.
- If the feedback exposes blocked-site behavior, update the assisted-capture documentation and harness policy too.
