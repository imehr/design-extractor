# 2026-05-14 — Extraction Quality & DESIGN.md Overhaul

> Take the design-extractor from "extracts and replicates" to "URL → live progress → near-pixel-perfect replica → Google-spec-compliant DESIGN.md → installable per-brand skill" — folding in huashu-design's prescriptive design intelligence to generate brand-tinted materials, not just tokens.

Plan author: Claude (Opus 4.7)
Date: 2026-05-14
Owner: Mehran Mozaffari
Working dir: `/Users/mehran/Documents/github/design-extractor`

---

## 0. The single thread

```
URL → live progress UI → cached HTML + assets + logo + tokens →
  shadcn replica (faithful) → multi-dimension EVAL → improvement loop →
  Google-spec DESIGN.md + installable SKILL.md +
  3-variant brand-material gallery (huashu-style)
```

Every phase below serves that thread. Anything not on it is explicitly **out of scope** (see §6).

---

## 1. Gap analysis (verified from current repo)

### 1.1 Pipeline
- `scripts/extract_brand.py` runs 10 sequential phases via `claude --print` + subprocess + agent-browser inline JS. 14 `agents/*.md` exist but are NOT invoked via SDK. (Noted — not fixing in this pass.)
- `scripts/ws_extraction_server.py` exists but is **not launched by `start.sh`**. UI hardcodes `ws://localhost:8765` and tells the user to start it manually. Live-progress story is broken-by-default.
- 8 scripts are dead code (`apply_design.py`, `render_replica.py`, `screenshot_components.py`, `score_replica.py`, `pixel_compare.py`, `pattern_extractor.py`, `compare_components.py`, `segment_compare.py`). Noted — not deleting in this pass.

### 1.2 UI
- Landing page (`ui/app/page.tsx`) is text-first, no hero visual, hardcoded changelog, search is top-right small. Extract CTA buried in dark card.
- `ui/app/brands/[slug]/page.tsx` is 29k tokens monolithic — no above-fold "what this brand has" card, no visual diff side-by-side, improvement job is fire-and-forget (no streaming feedback).
- Colors hardcoded inline across UI — no design tokens file for the tool's own surface.

### 1.3 EVAL
- Pixel: pixelmatch at threshold=0.1 (exact) and 0.3 (lenient). Single viewport **1280×720 only**.
- Component validator pairs by heading+type+position (55-pt threshold), 6 weighted component categories (V-PIX-01…V-PIX-06).
- Pattern detection: 9 measurable signals (spacing GCD, type scale, density, grid, CTA, radius, shadow, motion, color).
- **Missing:** mobile/tablet viewports, hover/focus/active states, font-rendering parity, dark mode, animation parity, WCAG contrast, semantic-HTML match, anti-slop lint.

### 1.4 DESIGN.md
- `publish_brand.py:642` emits `DESIGN.md` via Python f-strings (no Jinja, no frontmatter). Custom 9-section numbered structure: Visual Theme → Colour Palette → Typography → Layout → Component Patterns → Buttons → Do's/Don'ts → Responsive → Agent Prompt Guide.
- `agents/documentarian.md` references `$PLUGIN_DIR/templates/DESIGN.md.jinja` — **file does not exist**. Agent contract drifted from publisher.
- **Google DESIGN.md spec** (verified against `github.com/google-labs-code/design.md/blob/main/docs/spec.md` 2026-05-14): YAML frontmatter (required `name`, optional `version`/`description`, plus `colors`/`typography`/`rounded`/`spacing`/`components` token trees) + 8 sections in fixed order (Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts). Colors must be `#RRGGBB` SRGB. Tokens referenced inline as `{path.to.token}`. Duplicate section headings = REJECT.
- We are missing: frontmatter, Elevation & Depth, Shapes, `{path.to.token}` refs, canonical section names without numeric prefixes.

### 1.5 huashu-design fold-ins
- `brand-spec.md` template — adds vibe keywords, signature 120% details, forbidden zones, logo-first treatment. Slot into DESIGN.md Overview.
- `references/critique-guide.md` — 5-dimension review rubric with scene-weighting + "Quick Wins (5-min fixes)" report template. Mirror in `visual-critic`.
- `references/design-styles.md` — 20 design philosophies with token-DNA. Build classifier: extracted tokens → nearest philosophy → 3-variant remix.
- `references/tweaks-system.md` — localStorage `useTweaks()` panel. Wrap replica with live token-nudge controls.
- §6 anti-slop checklist — banned patterns (cyber-neon, emoji icons, AI cyber-purple gradients, Inter for display, `#0D1117` dark). Lint generated replicas against this list, whitelist only patterns present in the **source** URL.

---

## 2. Revised plan — phased

### Phase 1 — Foundation (parallel, no inter-dependencies)

| # | Subject | Output | Owner agent |
|---|---|---|---|
| 1.1 | Wire `ws_extraction_server.py` into `start.sh` so live-progress works out of the box | `start.sh` spawns Next AND the Python WS server; both stop together; idempotent on rerun | one general-purpose subagent |
| 1.2 | Build the new DESIGN.md emitter (Google-spec compliant) | New `scripts/design_md_writer.py` that emits frontmatter + 8 canonical sections + `{path.to.token}` refs; replaces `generate_design_md` in `publish_brand.py`; one full DESIGN.md regenerated for `quantium-com-au` as golden sample; unit test in `tests/test_publish_brand_identity_docs.py` checks frontmatter parses + section order + no duplicates | one feature-dev:code-architect subagent |
| 1.3 | EVAL framework refactor — extensible rubric scaffold | New `scripts/eval_rubric.py` with named dimensions, weights, thresholds; existing pixel/pattern checks slot in as dimensions; report shape stable for UI consumption | one general-purpose subagent |

**Definition of done for Phase 1:** `bash start.sh` launches the WS server, `python3 scripts/publish_brand.py --slug quantium-com-au` emits a Google-spec-valid DESIGN.md, `python3 scripts/eval_rubric.py --brand quantium-com-au` runs the current pixel + pattern checks through the new rubric and matches the legacy report.

### Phase 2 — Quality uplift (after Phase 1)

| # | Subject | Output |
|---|---|---|
| 2.1 | EVAL: add 3 high-leverage dimensions | Mobile (375×667) + tablet (768×1024) + desktop (1280×720) pixelmatch (already have desktop); hover/focus state capture; font-rendering parity (family + weight + computed line-height); each emits dimension score + threshold; rolled into per-brand overall score with weights |
| 2.2 | Landing-page redesign | Above-fold extracted-brand hero (one rotating screenshot from registered brand), prominent extract form (URL + Brand Name), examples carousel ("Try one of these"), changelog moved to dedicated card; uses real shadcn primitives only; design tokens for the tool itself in `ui/app/globals.css` |
| 2.3 | Anti-slop lint in `component_validator.py` | New `scripts/anti_slop_lint.py`: AST-walks generated `*.tsx` for banned patterns (cyber-neon gradients, emoji-as-icon, `Inter` for display headings, `#0D1117` solid-background hero, `border-l-N` accent cards); whitelist patterns that appear in source DOM extraction; emits warnings list into the EVAL report |
| 2.4 | Brand detail page — above-fold summary card | One card at top of `ui/app/brands/[slug]/page.tsx` summarising: # colors, # fonts, # components, # downloaded assets, overall score, last extracted, side-by-side original vs replica thumbnail; tabs still below for deep dives |

**Definition of done for Phase 2:** Landing page renders rotating brand hero; a fresh extraction of any URL passes the EVAL rubric at mobile + tablet + desktop; anti-slop lint reports zero violations on a known-good brand and ≥1 violation on a deliberately broken test case.

### Phase 3 — Generative materials (after Phase 2)

| # | Subject | Output |
|---|---|---|
| 3.1 | 20-philosophy classifier | `scripts/classify_philosophy.py`: given a `design-tokens.json`, returns the nearest 3 philosophies from huashu's 20-philosophy index with similarity scores |
| 3.2 | 3-variant Tweaks panel | `ui/components/brands/tweaks-panel.tsx` — localStorage-backed primary-color / font-scale / density / radius sliders that re-skin the replica live; mounted on `ui/app/brands/[slug]/replica/page.tsx` behind a "Remix" toggle |
| 3.3 | Per-brand scene matrix | `scripts/render_scene_matrix.py`: renders 6 canonical layouts (hero, pricing card, dashboard tile, mobile screen, blog index, sign-in form) with the brand's tokens applied; outputs to `brands/{slug}/scene-matrix/*.png`; surfaced on the brand detail page as a gallery |

**Definition of done for Phase 3:** Extracting a new URL produces a `scene-matrix/` directory with 6 PNGs that visibly use the brand's color + type + radius language; the Tweaks panel lets the user nudge a primary-color hue and the replica re-renders without page reload; the classifier explains "this brand is closest to Pentagram-style information architecture" in the DESIGN.md Overview.

---

## 3. EVAL rubric — explicit thresholds (Phase 1 framework, Phase 2 fills in)

| Dimension | Sub-metrics | Pass threshold | Weight | Source |
|---|---|---|---|---|
| Pixel fidelity (desktop) | pixelmatch exact (t=0.1) + lenient (t=0.3) | exact ≥85%, lenient ≥95% | 0.25 | existing |
| Pixel fidelity (mobile) | pixelmatch at 375×667 | exact ≥80% | 0.15 | Phase 2.1 |
| Pixel fidelity (tablet) | pixelmatch at 768×1024 | exact ≥82% | 0.10 | Phase 2.1 |
| Interactive state parity | hover/focus pixelmatch on primary CTA & links | exact ≥80% | 0.10 | Phase 2.1 |
| Font rendering parity | font-family + weight + computed line-height ±2px | 100% family, line-height delta < 2px | 0.10 | Phase 2.1 |
| Component completeness | matched / (matched + missing + extra) from `component_validator.py` | ≥0.85 | 0.10 | existing |
| Pattern fidelity | 9 pattern signals match within tolerance | ≥7 of 9 within tolerance | 0.10 | existing |
| Asset fidelity | every img/bg-image in source resolves in replica with same format | 100% | 0.05 | existing |
| Anti-slop | banned-pattern count not present in source | 0 violations | 0.05 | Phase 2.3 |

Overall pass: weighted sum ≥ 0.85. Per-dimension critical-fail: any dimension below half its threshold blocks publish regardless of total.

---

## 4. DESIGN.md target shape (Google-spec compliant)

```markdown
---
version: alpha
name: <Brand Name>
description: <one-line voice + product description>
colors:
  primary: "#RRGGBB"
  surface: "#RRGGBB"
  on-surface: "#RRGGBB"
  accent: "#RRGGBB"
  # …extracted palette
typography:
  display:
    fontFamily: "<extracted display family>"
    fontSize: "<px|rem>"
    fontWeight: <number>
    lineHeight: <number|rem>
  body:
    fontFamily: "<extracted body family>"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
---

# <Brand Name> Design System

## Overview
Voice, vibe keywords, signature 120% details, forbidden zones. (huashu §1.a fold-in.)

## Colors
Token table referencing `{colors.*}`. Role-by-role guidance: where each token is used,
contrast ratios, accessibility notes.

## Typography
`{typography.display}` and `{typography.body}` usage rules, hierarchy, line-length
constraints.

## Layout
Max width, grid columns, header/hero/footer measurements, breakpoint rules.

## Elevation & Depth
Shadow scale (or "flat — no elevation" if the brand is genuinely flat).

## Shapes
Border-radius scale from `{rounded.*}`. When to use pill vs sharp vs md.

## Components
Composite-reference blocks for `button-primary`, `card`, `nav-link`, `input`, `hero`,
`footer`. Each uses `{path.to.token}` refs only.

## Do's and Don'ts
- Do: …
- Don't: … (incl. anti-slop violations specific to this brand)

<!-- Project extensions, preserved by spec as unknown sections -->
## Agent Prompt Guide
How agents should apply this DESIGN.md when generating new pages.

## Provenance
Source URL, extraction date, EVAL score breakdown, classifier nearest-philosophy match.
```

---

## 5. Per-brand skill (installable in other projects)

`brands/<slug>/skill/SKILL.md` already exists. Phase 1.2 extends it with:
- Frontmatter pointer to the new Google-spec DESIGN.md
- `## Apply this brand` block listing the three commands a user runs in another project to install: `cp design-tokens.json …`, `cp DESIGN.md …`, `cp -r assets/ public/brands/<slug>/`
- A `## Scene examples` block linking the Phase 3.3 scene-matrix PNGs

The `design-extractor:apply-design` skill already handles install; no changes needed there.

---

## 6. Explicitly NOT in this pass

(Per advisor pushback — scope discipline.)

- Rewriting `extract_brand.py` to invoke the 14 `agents/*.md` via the agent SDK. Current `claude --print` + subprocess works; quality, not architecture, is the user's complaint.
- Deleting the 8 dead scripts. Note them in a follow-up plan.
- Splitting `ui/app/brands/[slug]/page.tsx` (29k tokens monolithic) — only add the above-fold summary card.
- Splitting `ui/app/monitoring/page.tsx` kitchen-sink — leave as is.
- Adding the remaining 8 EVAL dimensions (dark mode, animation parity, WCAG contrast, semantic-HTML, asset compression, sub-pixel spacing, overflow detection, z-index stacking, scroll/parallax, canvas/WebGL/video). Framework will be extensible; future plan adds them.
- Replacing inline JS in `extract_dom()` with the dom-extractor agent.

---

## 7. Execution order

1. **Phase 1**: dispatch 3 parallel subagents (1.1, 1.2, 1.3). Wait for all three.
2. **Phase 1 gate**: regenerate `quantium-com-au` DESIGN.md and confirm it parses against Google spec; confirm `start.sh` spawns WS server; confirm `eval_rubric.py` matches legacy scores.
3. **Phase 2**: dispatch 4 parallel subagents (2.1, 2.2, 2.3, 2.4). Wait for all four.
4. **Phase 2 gate**: fresh extraction of a new URL passes EVAL at mobile+tablet+desktop; landing page renders new hero.
5. **Phase 3**: dispatch 3 parallel subagents (3.1, 3.2, 3.3). Wait for all three.
6. **Phase 3 gate**: a brand surfaces a 6-PNG scene matrix and a Tweaks panel re-skins the replica live.

---

## 8. Evidence requirements (per user's "honest done" rule)

For every phase gate above:
- Screenshot of the relevant UI page in agent-browser (1280×800 + 375×667 where UI is affected)
- Console output of `python3 scripts/<script>.py` showing the new artifact path + score
- Diff of the regenerated DESIGN.md for `quantium-com-au` (Phase 1.2 gate specifically)
- Saved into `docs/plans/2026-05-14-evidence/` as PNG + text logs
