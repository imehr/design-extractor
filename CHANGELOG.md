# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-04-22

### Added
- **`agents/brand-kit-extractor.md` + `scripts/brand_kit_extractor.py`** — new optional Phase 4b agent. Discovers official press-kit / brand-guidelines pages via HTTP path probing (no keys needed). Falls back to SerpAPI only when probing finds nothing. Three-tier scraping preference: Firecrawl → Cloudflare Browser Rendering → plain urllib. Live-tested against perplexity.ai: 43 authentic brand assets downloaded from sources link-walking would never reach.
- **`scripts/telemetry.py`** — shared helper. `write_phase_event`, `read_all_phase_events`, `read_all_brands`, `read_experiments`. Writes `<ms-ts>-<phase>-<status>.json` events so filenames sort chronologically.
- **`scripts/extraction_stats.py`** — aggregator CLI. Text + `--json` modes, summary + `--brand <slug>` detail. Reports per-phase median/p95 duration, per-brand score progression, end-to-end success rate. `SUCCESS_THRESHOLD=0.85`, `PARTIAL_THRESHOLD=0.70`.
- **`scripts/env_loader.py` + `.env.example`** — stdlib-only `.env` loader. Shell-exported values override file values. Documents all optional API keys (`FIRECRAWL_API_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SERP_API_KEY`).
- **Inline-embedded SKILL.md** — `templates/SKILL.md.jinja` gets a new `## Full reference (embedded)` section that inlines DESIGN.md, compact tokens JSON, and components block. Installed brand skills are now self-contained.
- **Component category regex** — `scripts/pattern_extractor.py` adds `CATEGORY_PATTERNS` + `categorize_component()`. Outputs `component_categories` dict feeding replica-builder.
- **CLI polish in `extract_brand.py`** — guarded `rich` import with plain-text fallback. `phase_banner`, `step`, `ok`, `warn`, `fail` helpers replace ad-hoc prints.
- **Phase 4b wiring** — `extract_brand.py` dispatches `brand_kit_extractor.py` alongside Phase 4 asset-extractor; wrapped so it can never fail the pipeline.
- **Telemetry migration** — `ws_extraction_server.py::_save_job_state` delegates to `telemetry.write_phase_event`; UI resume fields preserved via `extra=` dict.
- **25 new pytest cases** — `test_brand_kit_extractor.py`, `test_categorize_component.py`, `test_skill_template.py`, `test_extract_brand_cli.py`, `test_package_brand.py`. All unit-testable; no network or live API calls in tests.
- **Baseline fixture seeded** — `tests/fixtures/baseline/linear-app/` (20KB JSON, from nineforbrands extraction) + `scripts/seed_test_baseline.sh` idempotent seeder. 14 integration tests that previously erred on missing `/tmp/` fixture now run on committed data.
- **`docs/plans/2026-04-22-improvement-loop-diagnosis.md`** — root-cause analysis of the 40%/60% improvement loop kept/regressed ratio. Pixelmatch noise floor (σ ≈ 0.009) identified as primary cause.

### Fixed
- **Stale improvement_job test assertions** — `test_build_claude_command_uses_print_prompt_and_tools` no longer asserts a non-existent `--tools` flag; `test_build_claude_improvement_prompt_includes_pages_and_feedback` asserts current `64.1%` instead of stale `67.8%`. `build_claude_improvement_prompt` now actually inlines `recent_feedback` notes (was accepted as kwarg but silently ignored).
- **Baseline-coupled tests skip cleanly** when fixture is absent instead of erroring.

### Changed
- **Improvement-loop thresholds** (`scripts/run_improvement_job.py`) — "improved" requires `score > best + 0.01`; "regressed" requires `score < best - 0.01`; band between labelled `noise` and not kept. Stall detection widened from 2-iter delta < 0.001 to 3-iter window spread < 0.01. Expected to cut wasted Claude runs ~40% without losing real gains.

### Testing
- `pytest tests/ -q` → **57 passed, 1 skipped** (baseline before session: 17 passed, 3 failed, 13 errored).
- Live end-to-end verified: Firecrawl OK, SerpAPI OK; Cloudflare adapter wired (auth depends on user-supplied token scope).

### Notes
- Plugin version bumped 0.1.0 → 0.4.0 to align `plugin.json`/`marketplace.json` with the CHANGELOG's actual progression (0.1.0 → 0.2.0 → 0.3.0 → 0.3.1 → 0.4.0). Previous manifests were out of sync.

## [0.3.1] - 2026-04-13

### Added
- **Quantium extraction** (quantium-com-au) — 5 pages, 42 assets, custom QuantiumPro fonts (woff2/woff/ttf), monochrome design with coral accent. Partner logos include Anthropic, OpenAI, Google Cloud, AWS.
- **CSS background-image extraction** — `agents/dom-extractor.md` Step 7.5 extracts images from CSS `background-image` property, not just `<img>` tags. Fixes missing team photos, hero backgrounds, and card images that use CSS backgrounds.
- **Section completeness requirement** — `agents/replica-builder.md` now requires every H2 in DOM extraction to have a corresponding replica section. Lists commonly missed sections (partner logos, value props, stats, CTAs).
- **Section completeness validation** — `scripts/publish_brand.py` quality checklist now compares H2 count in each replica vs section count in DOM extraction, flagging incomplete pages.

### Fixed
- **extractColors TypeError** — `entry.value.match()` crashed on non-string values. Now coerces to string before matching.
- **rgb_to_hex crash on lists** — `publish_brand.py` handles non-string color values (lists, numbers) without crashing.
- **Incomplete replicas** — Quantium homepage rebuilt from 1 section (hero only) to all 8 sections. About-us page expanded from 3 placeholder directors to 7 directors + 8 executives with real downloaded photos.
- **Team photos invisible to extraction** — Photos rendered via CSS `background-image` were completely missed by `<img>` tag extraction. Now captured via Step 7.5.

### Improved — Agents & Skills
- **`agents/dom-extractor.md`** — Added CSS background-image extraction (Step 7.5), content quality requirements (strip scripts, 2000-char limit, sectionType/sectionCount fields).
- **`agents/replica-builder.md`** — Added section completeness requirement with checklist of commonly missed sections.

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
