---
name: learn-feedback
description: Record user feedback and apply it to the design-extractor harness, agents, skills, and docs so future runs improve. Trigger for: learn from this feedback, update the harness based on this review, apply this critique system-wide, improve the agents from this note.
argument-hint: <slug> <feedback>
---

# /design-extractor:learn-feedback

Use the provided feedback to improve the harness itself.

The user-supplied arguments are: $ARGUMENTS

## Instructions

1. Parse the slug and the feedback text from `$ARGUMENTS`.
2. Append a structured record to `state/learning/feedback-log.jsonl`.
3. Inspect the affected surfaces:
   - `HARNESS.md`
   - `agents/`
   - `skills/`
   - `commands/`
   - `docs/`
4. Update whichever of those files should change so the feedback becomes part of future runs.
5. Re-run the most relevant verification:
   - `pytest -q` for Python/controller changes
   - `pnpm -C ui lint`
   - `pnpm -C ui exec tsc --noEmit`
6. Only recommend promotion of learned changes after harness validation passes.

## Rules

- Treat review findings and user feedback as system-improvement input, not just one-off notes.
- Prefer reusable, generalized fixes over brand-specific hacks unless the bug is truly brand-specific.
- If the feedback exposes blocked-site behavior, update the assisted-capture documentation and harness policy too.
