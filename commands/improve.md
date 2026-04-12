---
name: improve
description: Improve an extracted brand until it reaches the validation target or clearly reports why it cannot. Starts the local improvement controller, inspects the live validation report, and uses the harness surfaces to decide next actions. Trigger for: improve quality, rerun validation, raise the score, fix the validation tab result, get this brand above 80 percent.
argument-hint: <slug>
---

# /design-extractor:improve

Start a real improvement run for a published brand.

The user-supplied slug is: $ARGUMENTS

## Instructions

1. Verify the UI is available at `http://localhost:5173` or start it with `bash $PLUGIN_DIR/scripts/launch_ui.sh`.
2. Run:
   ```bash
   python3 $PLUGIN_DIR/scripts/run_improvement_job.py --brand "$ARGUMENTS" --base-url http://localhost:5173 --target 80
   ```
3. Read the resulting job state from `~/.claude/design-library/cache/<slug>/jobs/`.
4. The controller should validate first, then invoke Claude against the worst failing replica files, then re-validate until target/plateau/operator-review.
5. If the job reports `assisted_capture_required`, tell the user exactly that and surface the assisted-capture steps.
6. If the job stalls or needs operator review, inspect `validation/report.json`, `validation/improvement-manifest.json`, `HARNESS.md`, and the relevant brand replica files before proposing the next fix.

## Rules

- Prefer the live validation report over stale metadata.
- Do not tell the user to pick another site when anti-bot protection blocks source capture. Switch to assisted-capture mode instead.
- Use the harness contract in `HARNESS.md` when deciding whether learned changes should be promoted.
