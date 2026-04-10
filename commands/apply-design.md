---
name: apply
description: Install a per-brand SKILL.md from the local design library into the current project so Claude designs in that brand's style on demand. Copies the brand's skill directory into .claude/skills/ and rewrites paths.
argument-hint: <slug>
---

# /design-extractor:apply

**Status:** Phase 1 stub. Real implementation lands alongside Phase 3 (`librarian` agent + `scripts/apply_design.py`).

## Behaviour (planned)

Given a brand slug like `linear-app` or `nimbus`:

1. Verify the brand exists at `~/.claude/design-library/brands/<slug>/`.
2. Copy `~/.claude/design-library/brands/<slug>/skill/` into `<current-project>/.claude/skills/brand-<slug>/`.
3. Rewrite any absolute paths in the copied SKILL.md to be relative to the project root.
4. Confirm the install with a one-line success message including the trigger phrases that will now activate the skill.
5. Refuse to overwrite an existing skill of the same name without `--force`.

The user-supplied slug is: $ARGUMENTS

## Stub behaviour

For Phase 1, just echo the planned destination path and note that the install action lands in Phase 3.
