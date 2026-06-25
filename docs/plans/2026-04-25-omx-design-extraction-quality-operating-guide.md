# OMX Operating Guide: Design Extraction Quality Upgrade

> **Purpose:** Explain how to use OMX, OMC, clawhip, and claw-code together for the goal: review the current design-extractor implementation, improve extraction and evaluation accuracy, generate near-identical brand replicas, and publish comprehensive `DESIGN.md` outputs aligned with the current Google `DESIGN.md` spec.

## Short Answer

Use **Claude Code + OMC/design-extractor** as the main execution surface for browser-heavy extraction work, because this repo is already a Claude Code plugin/harness and its skills depend on agent-browser-driven DOM capture.

Use **Codex + OMX** as the independent planning, audit, review, and verification layer. OMX should not replace the design-extractor pipeline. It should keep the work honest: read the repo, find the gaps, split independent workstreams, review proposed changes, validate outputs against the Google `DESIGN.md` spec, and run second-pass quality checks before the pipeline is considered improved.

Use **clawhip** as the notification/control-plane layer for long-running extraction and improvement jobs.

Use **claw-code** only as an experimental runtime/parity lab. It is not the best daily tool for this specific project yet.

## Why This Split Works

The design-extractor repo is already built around a concrete extraction harness:

- `scripts/extract_brand.py` is the current single-script orchestrator.
- `agents/dom-extractor.md` is the critical extraction agent.
- `scripts/run_validation_loop.py` owns validation artifacts.
- `scripts/run_improvement_job.py` owns improvement retries.
- `scripts/publish_brand.py` generates `DESIGN.md`, `SKILL.md`, and design tokens.
- `HARNESS.md` defines the current harness contract.

Your local project memory says the original parallel extraction fan-out was replaced because production showed that DOM extraction needs one coordinated pass. That means the right strategy is not to make OMX run the whole extraction itself. The right strategy is to let the existing harness execute, while OMX acts as the external engineering brain that reviews, plans, dispatches bounded code work, and verifies the result.

## Google DESIGN.md Spec: What Changed

As of the public `google-labs-code/design.md` repo, `DESIGN.md` is an alpha format specification for describing visual identity to coding agents. The important contract is:

- A `DESIGN.md` file has two layers:
  - YAML front matter with machine-readable design tokens.
  - Markdown body with human-readable design rationale.
- Token categories include colors, typography, rounded values, spacing, and components.
- Component tokens can reference other tokens using paths like `{colors.primary}`.
- Canonical sections include Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do's and Don'ts.
- The CLI supports:
  - `npx @google/design.md lint DESIGN.md`
  - `npx @google/design.md diff DESIGN.md DESIGN-v2.md`
  - `npx @google/design.md export --format tailwind DESIGN.md`
  - `npx @google/design.md export --format dtcg DESIGN.md`
  - `npx @google/design.md spec`

Source: <https://github.com/google-labs-code/design.md>

The implication for this repo: the current design-extractor `DESIGN.md` format is richer than Google's alpha spec, but it should become a **strict superset**. The front matter should satisfy Google's token schema, while the body keeps this repo's deeper sections: metadata, evidence, confidence, patterns, relationships, voice, assets, brand alignment, validation, and provenance.

## Desired End State

For each brand extraction, the output should include:

1. A near-identical shadcn/Tailwind replica for 4-5 representative pages.
2. Downloaded and verified source assets: images, SVGs, favicons, CSS background images, fonts.
3. A structured token set with provenance and confidence.
4. A Google-compatible `DESIGN.md` front matter block.
5. A richer design-extractor `DESIGN.md` body with evidence, patterns, relationships, voice, and validation.
6. `design-tokens.css`, Tailwind export, and DTCG token export where possible.
7. A validation report that is actionable, not just a full-page pixel score.
8. A per-brand `SKILL.md` that condenses the design system for agents.

## Recommended Tool Ownership

| Tool | Use it for | Do not use it for |
|---|---|---|
| OMC / Claude Code | Running `/design-extractor:*` commands, agent-browser extraction, visual/DOM refinement, plugin-native skills | Independent second-opinion review |
| OMX / Codex | Gap analysis, architecture review, plan generation, worker dispatch for code changes, spec compliance review, validation of outputs | Replacing the extraction harness |
| clawhip | Long-running job notifications, blocked/finished/failure events, Discord/Slack status, repo/channel routing | Scoring or extraction logic |
| claw-code | Runtime experiments, provider/tool parity, local Claude-like harness testing | Main design-extractor workflow |

## The Practical Workflow

### Phase 0: Start With A Clean Operating Surface

Before asking agents to improve anything, check repo state and current outputs:

```bash
cd /Users/mehran/Documents/github/design-extractor
git status --short
python3 scripts/extraction_stats.py || true
```

Do not overwrite uncommitted brand outputs. At the time this guide was written, the repo had untracked UniSuper brand UI artifacts under:

- `ui/app/brands/unisuper-com-au/`
- `ui/components/brands/unisuper-com-au/`
- `ui/public/brands/unisuper-com-au/`

Those should be preserved unless intentionally regenerated.

### Phase 1: Use OMX For A Current-State Audit

Run Codex through OMX from the design-extractor repo:

```bash
cd /Users/mehran/Documents/github/design-extractor
omx --madmax --high
```

Inside OMX, start with an audit prompt:

```text
$ralplan "Review the current design-extractor implementation for extraction accuracy, replica fidelity, evaluation quality, and DESIGN.md generation. Produce a gap analysis and implementation plan. Treat Google google-labs-code/design.md alpha spec as the target compatibility layer, while preserving design-extractor's richer DESIGN.md body."
```

Ask OMX to inspect these files specifically:

- `HARNESS.md`
- `README.md`
- `docs/design-md-spec.md`
- `docs/plans/2026-04-22-improvement-loop-diagnosis.md`
- `agents/dom-extractor.md`
- `agents/replica-builder.md`
- `agents/visual-critic.md`
- `agents/refinement-agent.md`
- `skills/design-extraction/SKILL.md`
- `skills/design-md-writer/SKILL.md`
- `templates/DESIGN.md.jinja`
- `scripts/extract_brand.py`
- `scripts/run_validation_loop.py`
- `scripts/run_improvement_job.py`
- `scripts/compare_components.py`
- `scripts/segment_compare.py`
- `scripts/publish_brand.py`

Expected OMX output:

- A gap analysis.
- A revised plan.
- A task split by independent workstream.
- Concrete verification commands.
- Risks and rollback boundaries.

### Phase 2: Use OMC For Live Extraction And Visual Work

The actual extraction/improvement loop should stay in Claude Code because the plugin commands are already there:

```text
/design-extractor:extract https://example.com
/design-extractor:improve <brand-slug>
/design-extractor:browse
```

For this quality-upgrade project, the live extraction run should target at least 3 benchmark brands:

- One existing strong brand, e.g. Westpac.
- One plateau/problem brand, e.g. Quantium or Woolworths Group.
- One new complex brand with rich imagery, nested CSS backgrounds, and responsive layouts.

The goal is to avoid tuning the scorer to one brand's failure mode.

### Phase 3: Use OMX `$team` For Bounded Code Workstreams

Once `$ralplan` produces an approved plan, use OMX team mode for independent engineering tasks. A good split is:

```text
$team 5:executor "Execute the approved design-extractor quality plan. Split work into: Google DESIGN.md compatibility, DOM/material extraction accuracy, replica fidelity builder improvements, evaluation/scoring improvements, and benchmark/reporting. Preserve existing generated brand outputs unless the task explicitly regenerates a brand."
```

Recommended worker ownership:

| Worker | Scope | Likely files |
|---|---|---|
| Spec worker | Google `DESIGN.md` compatibility | `docs/design-md-spec.md`, `templates/DESIGN.md.jinja`, `scripts/publish_brand.py`, tests |
| Extraction worker | Better raw material capture | `agents/dom-extractor.md`, `scripts/extract_brand.py`, `scripts/brand_kit_extractor.py`, asset download scripts |
| Replica worker | More faithful React/shadcn output | `agents/replica-builder.md`, UI brand component patterns, generated component validation |
| Evaluation worker | Better scoring and critique | `scripts/run_validation_loop.py`, `scripts/run_improvement_job.py`, `scripts/compare_components.py`, `scripts/segment_compare.py`, `agents/visual-critic.md` |
| Benchmark worker | Golden fixtures and regression gates | `tests/fixtures/*`, `tests/*`, docs/plans, validation reports |

OMX is useful here because it can force each worker to stay inside a bounded ownership area and then ask a verifier to check the combined result.

### Phase 4: Upgrade Extraction Accuracy

The current extraction principle is correct: extract, do not imagine. The upgrade should make it stricter.

Required improvements:

- Verify every URL returns a real page before extraction.
- Capture 4-5 pages per brand minimum.
- Extract visible DOM content after removing script/style/noscript noise.
- Capture header/logo through explicit logo selectors, not only `header`/`nav`.
- Walk descendants for CSS background images, not just section roots.
- Build mandatory fallback pools:
  - `allImages`
  - `allBackgroundImages`
  - `allFonts`
  - `allSvgSymbols`
  - `allInteractiveStates`
- Capture computed styles for representative elements:
  - nav links
  - buttons
  - cards
  - forms
  - hero headings
  - section headings
  - footer links
- Capture responsive measurements at desktop, tablet, and mobile viewports.
- Store provenance for every material:
  - source URL
  - CSS selector or DOM path
  - bounding box
  - computed style
  - screenshot reference

The output should make it impossible for the replica builder to invent content because it lacks data.

### Phase 5: Upgrade Replica Fidelity

The replica should be judged as a brand artifact, not just a rough page reconstruction.

Replica builder requirements:

- Use actual downloaded assets, not placeholders.
- Use real logos, not text stand-ins.
- Use actual fonts where legally/downloadably available; otherwise document fallback clearly.
- Build shared components first:
  - header/nav
  - footer
  - button variants
  - cards
  - forms
  - hero layout patterns
- Build page-specific sections only after shared components are stable.
- Preserve text, links, image ordering, and section hierarchy from DOM extraction.
- Avoid standalone HTML. Continue using React/shadcn/Tailwind.
- Add component-level acceptance snapshots before full-page scoring.

The critical shift: do not allow a full-page score to hide a broken component. A missing logo, wrong hero image, or wrong nav structure should be blocking even if the average score looks acceptable.

### Phase 6: Upgrade Evaluation

The current improvement-loop diagnosis already found that full-page pixelmatch plateaus around scorer noise for some brands. The new evaluator should be multi-signal.

Recommended scoring model:

| Signal | Purpose |
|---|---|
| Full-page pixel score | Broad visual regression signal |
| Component crop score | Actionable local fidelity |
| Segment score | Section-level layout fidelity |
| DOM structure score | Ensures content hierarchy and counts match |
| Asset completeness score | Ensures images/fonts/logos/backgrounds are real |
| Token fidelity score | Ensures extracted tokens match computed styles |
| Responsive score | Ensures desktop/tablet/mobile fidelity |
| DESIGN.md lint score | Ensures output is structurally valid |
| Human/vision critique score | Catches brand impression failures |

Keep the noise-floor fixes from the existing diagnosis:

- Require an improvement delta above the score noise band before keeping a refinement.
- Stop early when recent iterations stay inside the noise band.
- Track whether a job is `extract`, `refine`, `validate`, or `publish`.

Expected evaluation outputs:

- `validation/report.json`
- component-level screenshots
- diff heatmaps
- worst-page and worst-component rankings
- root-cause labels, not just numbers
- a short "next best fix" section for the improvement agent

### Phase 7: Make Google DESIGN.md Compatibility A Gate

For every generated `DESIGN.md`, run:

```bash
npx @google/design.md lint ~/.claude/design-library/brands/<slug>/DESIGN.md
npx @google/design.md export --format tailwind ~/.claude/design-library/brands/<slug>/DESIGN.md > /tmp/<slug>-tailwind.theme.json
npx @google/design.md export --format dtcg ~/.claude/design-library/brands/<slug>/DESIGN.md > /tmp/<slug>-tokens.json
```

If the Google CLI cannot parse the front matter, the publish step should fail or mark the brand as not publishable.

The design-extractor-specific body can remain richer than Google's spec. The compatibility requirement is that the token layer is valid and exportable.

### Phase 8: Use clawhip For Long-Running Visibility

Install or configure clawhip for both Codex and Claude Code events:

```bash
clawhip hooks install --provider codex --scope project
clawhip hooks install --provider claude-code --scope global
clawhip config verify-bindings
```

Use clawhip to route:

- extraction started
- validation failed
- improvement plateaued
- assisted capture required
- publish completed
- tests failed
- PR created

For this repo, useful routing metadata:

- `repo_path=/Users/mehran/Documents/github/design-extractor`
- `provider=codex` or `provider=claude-code`
- `event=SessionStart|Stop|PreToolUse|PostToolUse|UserPromptSubmit`
- `brand_slug`
- `job_id`
- `score_before`
- `score_after`
- `blocked_reason`

This gives you a real operating loop instead of waiting for a long extraction run to silently stall.

## Suggested OMX Prompt Pack

### Audit Prompt

```text
$ralplan "Audit design-extractor for brand replica accuracy and DESIGN.md output quality. Read HARNESS.md, README.md, docs/design-md-spec.md, docs/plans/2026-04-22-improvement-loop-diagnosis.md, agents/dom-extractor.md, agents/visual-critic.md, skills/design-extraction/SKILL.md, skills/design-md-writer/SKILL.md, templates/DESIGN.md.jinja, and scripts/publish_brand.py. Compare the current format with google-labs-code/design.md alpha spec. Produce a gap analysis and an implementation plan with tests."
```

### Code Work Prompt

```text
$team 5:executor "Implement the approved plan for design-extractor quality. Keep workstreams isolated: spec compatibility, material extraction, replica builder, evaluation/scoring, benchmarks. Do not overwrite generated brand artifacts unless assigned. Each worker must report files changed and verification evidence."
```

### Verification Prompt

```text
$ralph "Verify the design-extractor quality upgrade end to end. Run unit tests, run Google DESIGN.md lint/export on a generated brand, inspect validation reports, confirm score gates are not stale, and produce a concise pass/fail report with exact commands and artifacts."
```

### Second-Opinion Review Prompt

```text
omx exec -C /Users/mehran/Documents/github/design-extractor "Review the current diff as a strict code reviewer. Focus on whether extraction accuracy, validation signal quality, and Google DESIGN.md compatibility truly improved. Prioritize bugs, regressions, stale-score risks, and missing tests."
```

## What To Build First

Do not start with the replica builder. Start with evidence and gates.

Recommended first implementation slice:

1. Add Google `DESIGN.md` lint/export validation to publish or test flow.
2. Add a benchmark fixture for one known brand with expected token/component coverage.
3. Add asset completeness checks for logos, CSS background images, fonts, and real image files.
4. Improve validation reporting so it identifies the worst component and exact missing material.
5. Only then change replica generation prompts or component code.

This prevents "better looking" replicas that still publish invalid or unverifiable design systems.

## Quality Gates

A brand should not be marked `publishable` unless all of these pass:

- 4-5 representative pages extracted.
- No dead URLs.
- Logo present as real SVG/IMG.
- CSS background images captured and downloaded.
- Fonts captured or fallback documented.
- Component inventory includes nav, hero, button, card/content block, footer, and forms when present.
- Desktop and mobile screenshots exist.
- Worst component has an actionable critique.
- No stale score fields in metadata or UI.
- `DESIGN.md` front matter passes `npx @google/design.md lint`.
- `DESIGN.md` exports to Tailwind or DTCG without fatal error.
- Per-brand `SKILL.md` references the generated `DESIGN.md` and critical token rules.

## How To Think About "Almost Identical"

"Almost identical" should be made measurable:

- Page-level visual score is useful but insufficient.
- Component-level score should be the main improvement signal.
- A missing real logo is an automatic fail.
- A missing hero/background image is an automatic fail for that section.
- Wrong typography family or weight is a high-severity fail.
- Wrong spacing rhythm across repeated components is a high-severity fail.
- DESIGN.md claims without provenance should reduce confidence.

The target is not just a screenshot that looks close once. The target is a reusable brand system that lets future agents build new screens in the same style.

## Recommended Operating Pattern For This Project

Use this loop:

1. **OMX:** audit and plan.
2. **OMC/design-extractor:** run extraction and live visual improvement.
3. **OMX team:** implement isolated harness improvements.
4. **OMC/design-extractor:** regenerate one or two benchmark brands.
5. **OMX verifier:** validate tests, output artifacts, Google `DESIGN.md` compatibility, and stale-score risks.
6. **clawhip:** notify on blocked/finished/failure states.
7. **Project memory:** record what improved and which agent/skill files changed.

That matches the way this repo already works and the way you prefer to work: documented plan, parallel work only where safe, real outputs, screenshot evidence, no stale metrics, and no overwriting completed brand work.

## Source Notes

Local repo sources used:

- `README.md`
- `HARNESS.md`
- `docs/design-md-spec.md`
- `docs/plans/2026-04-22-improvement-loop-diagnosis.md`
- `skills/design-extraction/SKILL.md`
- `skills/design-md-writer/SKILL.md`
- `agents/dom-extractor.md`
- `agents/visual-critic.md`
- project memory under `/Users/mehran/.claude/projects/-Users-mehran-Documents-github-design-extractor/memory/`

External source checked on 2026-04-25:

- Google Labs `DESIGN.md` repository: <https://github.com/google-labs-code/design.md>

