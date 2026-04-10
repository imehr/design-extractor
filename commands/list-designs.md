---
name: list
description: List all brands installed in the local design library at ~/.claude/design-library/. Prints slug, source URL, extraction date, overall score, and category tags for each.
---

# /design-extractor:list

**Status:** Phase 1 stub.

## Behaviour

1. Read `~/.claude/design-library/index.json`.
2. Print a markdown table:
   - slug
   - source_url
   - extracted_at
   - overall_score
   - confidence
   - categories
3. If the index is empty, print "No brands installed yet. Run `/design-extractor:extract <url>` to extract one, or `/design-extractor:seed-library` to install the Nimbus sample brand."

Do NOT spawn any subagents. This is a pure read-only file inspection.
