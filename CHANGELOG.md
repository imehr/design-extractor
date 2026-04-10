# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Phase 1 (skeleton)
- `.claude-plugin/plugin.json` manifest
- 11 native Claude Code subagent stubs under `agents/`
- 6 skill stubs under `skills/`
- Stub commands: `extract-design`, `browse-library`, `list-designs`, `apply-design`, `seed-library`
- `scripts/update_library_index.py` — minimal index registry writer
- Hand-curated synthetic "Nimbus" sample brand under `templates/sample-brand/`
- `hooks/hooks.json` — PostToolUse formatter stub

### Added — Phase 0 (de-risk)
- `tests/fixtures/urls.txt` — 10 fixture URLs covering fintech, dev tools, infrastructure, AI, and known-hard sites
- `tests/fixtures/linear-app-ground-truth.md` — gold-standard hand-written Linear DESIGN.md (15 sections, 400+ lines)
- `tests/fixtures/baseline-report.md` — Phase 0 10-URL stress test report with graceful-degradation rules
- `blueprints/scaffolding-notes.md` — masfactory harness-mode methodology applied (architecture rationale, 11 agents, 6 skills, orchestration plan)

## [0.1.0] - TBD

Initial release. See `blueprints/scaffolding-notes.md` for the full v0.1 scope and the phased build order.
