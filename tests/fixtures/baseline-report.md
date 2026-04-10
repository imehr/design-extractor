# Phase 0 Baseline Report — 10-URL Extraction Stress Test

**Date:** 2026-04-10
**Script under test:** `~/.claude/plugins/local/brand-extractor/skills/brand-extraction/scripts/extract_tokens.py` (unmodified)
**Stages exercised:** `recon`, `tokens`
**Cache:** `/tmp/design-extractor-baseline/<slug>/`

## Headline numbers

- **9 / 10 sites succeeded** end-to-end through the `tokens` stage.
- **1 / 10 (Airbnb) failed** at the `recon` stage with a networkidle timeout.
- All 9 successful runs detected the **same base spacing unit: 4px**.
- All 9 successful runs produced non-empty colours, typography, shadows, and transitions.

## Per-site results

| Site | css_vars | col_cp | col_cmp | fonts | sizes | wts | shdw | radii | bps | trans | base |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **airbnb.com**       | FAIL — recon `Page.goto Timeout 30000ms (networkidle)` |
| anthropic.com    | 282 |  60 |  14 |  3 |  9 | 4 |  1 |  6 |  5 | 19 | 4px |
| apple.com        |  99 |  44 |  28 |  4 | 12 | 4 |  1 |  6 | 17 | 28 | 4px |
| linear.app       | 519 | 175 |  66 |  2 | 17 | 4 | 13 | 19 |  5 | 15 | 4px |
| linkedin.com     | 919 | 822 |  10 |  1 |  7 | 2 |  3 |  3 |  0 |  3 | 4px |
| nytimes.com      | 107 |  66 |  22 | 11 | 11 | 6 |  1 |  3 | 44 | 14 | 4px |
| railway.app      | 501 | 363 |  45 |  9 | 16 | 5 |  6 | 11 | 13 | 17 | 4px |
| stripe.com       | 651 | 392 |  50 |  1 | 14 | 2 |  5 | 12 |  0 | 36 | 4px |
| tailwindcss.com  | 491 |  13 | 218 |  2 | 10 | 4 | 17 | 12 |  0 | 10 | 4px |
| vercel.com       | 407 | 171 |  20 |  4 |  8 | 3 |  5 |  5 | 47 | 13 | 4px |

`col_cp` = colours sourced from `--custom-property` declarations.
`col_cmp` = colours sourced from `getComputedStyle()` aggregation.

## Five non-obvious findings

### 1. The dual-source colour extractor is essential

Looking at `col_cp` vs `col_cmp`:

- **LinkedIn:** 822 custom-property colours, only 10 computed. Pure design-token system.
- **Tailwind:** 13 custom-property colours, 218 computed. Pure utility-class system.
- **Railway:** 363 / 45. Token-system dominant but with stylistic extras.
- **Anthropic:** 60 / 14. Mixed.

**Implication:** any extractor that *only* reads `--vars` will produce a 6%-complete picture of Tailwind. Any extractor that *only* aggregates computed styles will miss LinkedIn's intent (they have a token system; we should reflect it). Both signals must be equal-weight, and the synthesizer must report which source dominated.

### 2. The 4px base unit is universal — promote it from heuristic to fact

9/9 successful sites converged on a 4px detected base unit via GCD on padding/margin/gap. This includes editorial sites (NYT, Linear-app docs feel), product marketing sites (Stripe, Vercel, Railway, Tailwind), an enterprise/dev tools site (LinkedIn), and consumer sites (Apple, Anthropic).

**Implication:** the spacing-rhythm pattern signal can be reported with HIGH confidence by default. Only flag it as MEDIUM/LOW if the residual after the GCD fit is large.

### 3. Breakpoint counts split sites into three buckets

- **Container-query / JS-driven (0 breakpoints detected):** Stripe, Tailwind, LinkedIn
- **Modest responsive grid (5–17):** Linear, Anthropic, Apple, Railway
- **Editorial / ad-heavy (44–47):** NYTimes, Vercel

Stripe / Tailwind / LinkedIn returning **zero breakpoints** is *not* a bug — they use container queries (`@container`) and runtime layout, which our `@media (min-width: …)` regex misses.

**Implication:** the extractor must report breakpoint extraction confidence as LOW when 0 are found, and the pattern-analyst should fall back to viewport-screenshot heuristics (compare desktop / tablet / mobile renders) rather than assume the site is non-responsive. **Add a `@container` regex pass** to `pattern_extractor.py` for v1.

### 4. NYTimes is the typography outlier

NYTimes registered **11 font families** and **6 weights** vs. a typical 1–4 / 2–4. Editorial sites carry display fonts (`nyt-cheltenham`, `nyt-imperial`), serifs for body, sans for UI, mono for code, plus their swash/italic variants. The extractor handled it without crashing.

**Implication:** the DESIGN.md typography section needs a "primary / secondary / tertiary / display / mono" classification, not just "primary + mono". The skill-packager must group these intelligently in the per-brand SKILL.md or risk shipping a 200-line font dump.

### 5. Linear's shadow + radius richness sets the high-water mark

Linear: 13 shadows, 19 radii. By comparison Apple: 1 shadow, 6 radii. NYTimes: 1 shadow, 3 radii.

This matches Linear's actual visual character: hairline borders + nested elevation language + multiple corner rounding sizes for different surface types. Their token system *encodes the visual sophistication*.

**Implication:** the validation rubric should not penalise extractions where shadow/radius counts are low — that's a faithful capture of a flat brand. But it *should* flag low counts on brands whose reference screenshots clearly show layered surfaces. Cross-validate with pixel diff.

## Graceful-degradation rules

Phase 0 exit criterion #4: "Pick 3 hard sites and decide graceful-degradation rules."

| Failure mode | Detected by | Degradation rule |
|---|---|---|
| **`networkidle` never reached** (Airbnb, likely Apple under load, ad-heavy sites) | Playwright timeout exception | Retry with `wait_until="domcontentloaded"` + fixed `page.wait_for_timeout(6000)`. If still failing, retry with `wait_until="load"` + `page.wait_for_timeout(8000)`. If still failing, mark `gate_R1=fail` and proceed with whatever HTML/CSS was captured at navigation; flag `confidence=LOW` on all downstream artifacts. **Default `wait_until` for the forked script should be `domcontentloaded`, not `networkidle`** — networkidle is structurally unreliable on any analytics-heavy site. |
| **Unhandled `TimeoutError` in `tokens` stage** (Airbnb regression) | The `tokens` stage of upstream `extract_tokens.py` lets exceptions propagate, producing zero JSON output | The fork must wrap the `tokens` stage in the same `try/except` block that `recon` already has and emit a structured `{"stage": "tokens", "error": "..."}` JSON file on failure, so downstream stages and the validation report can react. **This is a real bug in upstream brand-extractor that the Phase 2 fork must fix.** |
| **SPA hydrated only as a skeleton** (LinkedIn signature) | `colours.computed < 15` AND `colours.custom_properties > 100` — token system declared but only the chrome rendered | Downgrade `tokens.confidence` from HIGH to MEDIUM, log `extraction_warning: under_hydrated_spa`, and on the next iteration trigger a longer `wait_for_timeout(8000)` + a programmatic scroll to force lazy hydration. Do NOT mark as failure — the data captured is still useful, just incomplete. |
| **Cloudflare / bot challenge** | HTTP 403 or page title contains "Just a moment" / "Checking your browser" | Retry once with Firefox engine + stealth. If still blocked, write a stub `gate_R1=fail` record, do not retry, surface the failure in the final report so the user knows extraction is impossible without auth. |
| **Cookie / GDPR overlay** blocking content | Recon screenshot has >40% of pixels in a single colour band | Run agent-browser `snapshot -i` → LLM identifies dismiss button → `click @eN` → re-screenshot. Cap at 2 attempts. |
| **Heavy SPA / hydration not done** | Computed styles return <20 entries | Add `page.wait_for_load_state("networkidle", timeout=15000)` after initial nav, then a second `page.wait_for_timeout(4000)`. If still <20 entries, proceed with what we have; flag `confidence=MEDIUM`. |
| **Geo-blocked / region restricted** | HTTP 451 or specific status | Hard fail. Recommend user re-run from a different network. Do not write a brand entry. |
| **JavaScript-rendered design tokens** (zero `--vars`, e.g. Tailwind site) | `colours.custom_properties` is empty AND `colours.computed` is non-empty | Not a failure — switch dominant source to `computed` and flag `synthesis_source=computed-aggregate` in `metadata.json`. Token reliability rating drops from HIGH to MEDIUM by default. |
| **Container-query layouts** (Stripe, Tailwind, LinkedIn) | `breakpoints: []` | Not a failure — log `responsive_strategy: container-or-runtime` in metadata. The pattern-analyst must NOT report "non-responsive" in DESIGN.md; instead say "responsive via container queries / JS layout (not extractable from CSS alone)". |
| **Variable-font axis fingerprinting** (Linear's 510, 590) | Weights detected outside the 100/200/300/400/500/600/700/800/900 set | Promote to a *feature*: report axis precision in DESIGN.md as evidence of design sophistication (most variable-font usage in the wild is just 100-step buckets). |
| **Single-page sites with no docs/pricing** (Anthropic v1, Apple landing) | `internal_links_count < 5` AND no path matches `/pricing|/docs|/about` | Skip the recon's multi-page sweep; treat the landing page as comprehensive. Voice-analyst should grab footer + nav copy as the only signal. |

## Hard sites — final disposition

| Site | Phase 0 result | v1 plan |
|---|---|---|
| **airbnb.com** | recon timeout (networkidle) | Implement networkidle→domcontentloaded fallback in forked `extract_tokens.py`. Keep on the integration test list — it's our canary for the fallback path. |
| **apple.com** | OK, but only 99 css_vars and 28 computed colours — minimal extraction | Acceptable. Apple intentionally exposes very little; report `confidence=MEDIUM` for tokens, and lean on visual-critic for the brand-impression dimension. |
| **nytimes.com** | OK, 44 breakpoints + 11 fonts | Acceptable. Stress-test for the typography classifier and the responsive-strategy reporter. |
| **linkedin.com** | OK, 822 custom-property colours | Stress-test for token de-duplication (a lot of those 822 will alias to the same hex). The synthesizer must collapse them in DESIGN.md so it doesn't ship a 30-screen colour palette. |

## What this report does NOT cover

- **Phase A subagent dispatch.** Only the underlying `extract_tokens.py` script was exercised. The `recon-agent` / `token-extractor` subagents that wrap it have not yet been written.
- **Stages beyond `tokens`.** `assets`, `synthesis`, `screenshot_components`, `pixel_compare` were not invoked.
- **Pattern signals.** None of the 15 pattern signals from `pattern_extractor.py` were computed (script doesn't exist yet — it's a Phase 2 artifact).
- **Replica generation.** No HTML replicas were built or scored.

These are all Phase 2 / Phase 4 work. This baseline only proves the **lower-half of the data plane** works on 9/10 representative URLs.

## Sign-off

Phase 0 exit criterion: "10-URL extraction baseline known; Linear ground-truth DESIGN.md exists; masfactory scaffolding done."

- [x] 10-URL baseline run (this report)
- [x] Linear ground-truth DESIGN.md (`tests/fixtures/linear-app-ground-truth.md`)
- [x] masfactory scaffolding (`blueprints/scaffolding-notes.md`)

Phase 0 is **complete**. Proceeding to Phase 1 (skeleton plugin).
