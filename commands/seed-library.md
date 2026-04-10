---
name: seed-library
description: Seed the local design library at ~/.claude/design-library/ with the synthetic Nimbus sample brand. Idempotent — re-running has no effect if Nimbus is already installed.
---

# /design-extractor:seed-library

**Status:** Phase 1 working command.

## Behaviour

1. Ensure `~/.claude/design-library/brands/nimbus/` exists by copying everything under `<plugin-dir>/templates/sample-brand/` into it.
2. Run `python3 <plugin-dir>/scripts/update_library_index.py --add nimbus --metadata <plugin-dir>/templates/sample-brand/metadata.json` to register Nimbus in `index.json`.
3. Print confirmation with the install path and next-step suggestions:
   - `/design-extractor:browse-library` to inspect Nimbus
   - `/design-extractor:apply-design nimbus` to install Nimbus's SKILL.md into the current project

## Stub instructions for Claude

When this command is invoked:

1. Use Bash to copy `templates/sample-brand/` (relative to `$CLAUDE_PLUGIN_DIR`) into `~/.claude/design-library/brands/nimbus/`. Use `cp -R` with `-n` so existing files are not overwritten.
2. Run the update_library_index.py script with the appropriate arguments.
3. Report success with the canonical Nimbus paths.

If `~/.claude/design-library/` does not exist, create it first with `mkdir -p`.

Do NOT spawn any subagents.
