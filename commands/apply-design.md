---
name: apply
description: Install a per-brand SKILL.md from the local design library into the current project so Claude designs in that brand's style on demand. Copies the brand's skill directory into .claude/skills/ and rewrites paths.
argument-hint: <slug>
---

# /design-extractor:apply

**Status:** Implemented. Token/DESIGN.md copying via `scripts/apply_design.py`. Skill installation is Phase 3.

## Usage

```bash
python3 scripts/apply_design.py --brand <slug> --target-dir <path>
```

## Behaviour

Given a brand slug like `linear-app` or `nimbus`:

1. Verify the brand exists at `~/.claude/design-library/brands/<slug>/`.
2. Copy `design-tokens.css`, `DESIGN.md`, and `design-tokens.json` into the target project root.
3. Print each file that was copied.
4. Exit 1 if the brand directory is missing or no installable artifacts exist.

The user-supplied slug is: $ARGUMENTS

## Planned (Phase 3)

- Copy `skill/` into `<current-project>/.claude/skills/brand-<slug>/`.
- Rewrite absolute paths in SKILL.md to be relative to the project root.
- `--force` flag to overwrite existing skill of the same name.
