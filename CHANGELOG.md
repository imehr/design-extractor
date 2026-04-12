# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-04-12

### Added
- **`scripts/publish_brand.py`** — Automated publish pipeline that generates design-tokens.json, design-tokens.css, DESIGN.md, SKILL.md from DOM extraction measurements. Runs after validation to populate all UI tabs.
- **`scripts/run_validation_loop.py`** — Brand-agnostic validation harness. Captures original + replica screenshots via agent-browser, runs pixelmatch comparison, writes improvement manifest and validation report. Loads page configs from `pages.json` per brand.
- **`scripts/improvement_job.py`** — Metadata sync helper for the harness loop.
- **Publish Quality Checklist** — Runs at end of publish_brand.py. Validates: color count (>=5), font families, DESIGN.md accuracy, assets accessibility, validation report, SKILL.md existence. Reports FAIL/WARN for any issues.
- **Woolworths Supermarket extraction** (woolworths-com-au) — 5 pages, 33 assets, 85.7% avg score. Required `--headed` mode for Akamai bot detection bypass.
- **Woolworths Group extraction** (woolworthsgroup-com-au) — 5 pages, 60+ assets, 67.8% avg score. TomatoGrotesk + Montserrat fonts, 18 brand logos.
- **Docs page** (`ui/app/docs/page.tsx`) — Setup, validation, blocked-site fallback documentation.
- **Homepage usage context** — Description of what the library contains + `/extract` command hint.

### Fixed
- **Hardcoded page lists removed** — Preview tab, Validation tab comparisons, page switcher, Components tab, and Usage tab all now derive page lists dynamically from `localFiles` and `validation_report`. Zero hardcoded brand-specific strings remain in the shared brand detail component.
- **Assets tab empty** — API route `walk()` function now follows symlinks via `isSymbolicLink()` + `fs.stat()`.
- **Color extraction from multiple sources** — publish_brand.py now reads colors from: dedicated `colors` dict, `uniqueTextColors`/`uniqueBackgroundColors` arrays, section-level fields (h1.color, footer.backgroundColor), and link/button styles. Fixed Woolworths having 0 colors.
- **DESIGN.md generic description** — No longer uses hardcoded "distinctive blue" text. Now references the actual primary brand color from extracted tokens.
- **Font families list format** — publish_brand.py handles both dict and list formats for fontFamilies in measurements.
- **Validation scores not displayed** — publish_brand.py now reads validation report and sets `overall_score` in metadata.json. Also populates full 8-gate structure.
- **Homepage brands below fold** — Removed large hero + "how it works" section. Brands now immediately visible with scores.
- **Nimbus mock brand removed** — Only real extracted brands in library index.
- **Credit cards URL wrong** — Westpac credit cards used incorrect URL (`/credit-cards/` vs `/personal-banking/credit-cards/`). Added principle #9: verify URLs before extraction.

### Changed
- **Validation harness brand-agnostic** — `run_validation_loop.py` now loads page configs from `~/.claude/design-library/cache/{slug}/validation/pages.json` instead of hardcoded Westpac pages.
- **Report path fixed** — Harness writes to `~/.claude/design-library/brands/{slug}/validation/report.json` (not `cache/`), matching where the UI reads from.
- **Extract-design command** — Added Phase D (validation harness loop) and Phase E (publish_brand.py). Added principle #9 (verify URLs). Added DOM measurement step.

### Improved — Agents & Skills (self-improving pipeline)
- **`agents/validation-monitor.md`** — Rewrote to use actual harness script, Monitor tool integration, improvement manifest, DOM measurement step, correct agent-browser syntax.
- **`agents/replica-builder.md`** — Added DOM measurement before building, hero layout pattern detection (bg-overlay vs split-column), content padding detection via h1.left, agent-browser syntax fix.
- **`agents/dom-extractor.md`** — Fixed `navigate` to `open`, added URL verification step, added DOM measurements output.
- **`agents/visual-critic.md`** — Unchanged (already production-quality).
- **`commands/extract-design.md`** — Integrated harness loop + publish pipeline. Fixed agent-browser syntax in examples.
- **`skills/visual-diff/SKILL.md`** — Replaced stub with actual production methodology (capture, compare, diff, measure, fix cycle).

### Westpac Replica Improvements
- Homepage: 73.9% → 86.3% (hero height 424px matched, content padding 60px, bg image approach)
- Home Loans: 71.7% → 92.3% (hero restructured to bg-image overlay pattern, height 494px)
- Bank Accounts: 69.8% → 84.0% (hero bg-image with gradient overlay)
- Contact Us: 80.9% (stable)
- Credit Cards: 75.9% → 79.0% (hero height 403px, correct URL)
- Average: 49.9% → 84.5%

## [0.2.0] - 2026-04-11

### Added
- **Westpac extraction** (westpac-com-au) — First production extraction. 5 pages, 50+ assets, React/shadcn replicas.
- **Design Library UI** — Next.js app with 10-tab brand detail page (Overview, DESIGN.md, Tokens, Components, Preview, Assets, Skill, Validation, Usage, Raw Files).
- **DESIGN.md** for Westpac — 1,137 lines, 9-section Apple-quality design system document.
- **Shared components** — WestpacHeader, WestpacFooter, WestpacHero, WestpacCategories, WestpacSections, WestpacLogo.
- **5 replica pages** — Homepage, Credit Cards, Contact Us, Home Loans, Bank Accounts.
- **Screenshot comparison** — Side-by-side original vs replica at 1280x720 viewport.
- **Comprehensive review** (`docs/plans/2026-04-11-comprehensive-review.md`) — Honest assessment of what works and what's broken after first extraction.

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
