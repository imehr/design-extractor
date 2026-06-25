# Open-Design v1 Design Bundle & Exact-Fidelity Extraction Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `design-extractor` emit the two bundle shapes Open Design (OD) consumes — (A) a self-contained **artifact bundle** that reproduces a page exactly, and (B) a full **`od-design-system-project/v1` design-system bundle** for brand-level reuse — backed by measured (not fabricated) tokens, raw CSS / keyframe capture, and multi-viewport fidelity.

**Architecture:** Python scripts in `scripts/` remain the backbone. Two new emitters (`package_artifact_bundle.py`, `build_design_system_bundle.py`) sit alongside the existing `export_open_design.py`. Extraction fidelity is upgraded in `extract_brand.py` (JS probes) + a new `measured_tokens.py` analyzer that frequency-clusters computed styles and maps them onto OD's `TOKEN_SCHEMA`. OD import is exercised via its HTTP API (`POST /api/import/folder`) and CLI (`od design-systems import-local`). Stdlib + existing deps only; no new runtime deps.

**Tech Stack:** Python 3 (stdlib + `pillow`/`numpy`/`bs4` already used), `agent-browser` CLI for capture/verification, OD's pnpm/Node toolchain (`pnpm guard`) for manifest validation, pytest for TDD.

---

## Context — what already shipped (2026-06-11 plan)

The prior plan landed the *baseline* OD support and is now in the repo:
- `scripts/mirror_original_pages.py` — offline mirror (`brands/<slug>/original/<page>/`) with localized CSS/assets/scripts-stripped. **This is the raw material for Shape A.**
- `scripts/generate_html_replicas.py` — deterministic token-styled standalone HTML.
- `scripts/export_open_design.py` — emits a 9-section `DESIGN.md` + `od:` skill + `assets/`, with `--install` and `--check`. **This is DESIGN.md-only — NOT a v1 manifest bundle.**
- Execution-mode UI (Local CLI + BYOK).

**This plan is the next phase.** It does not redo that work; it builds on the mirror (Shape A), replaces the DESIGN.md-only export with a full v1 bundle (Shape B), and fixes the extraction-quality gaps both shapes depend on.

---

## Gap Analysis (2026-06-25 audit vs. OD `design-systems/stripe/` reference + `TOKEN_SCHEMA`)

| Required by OD v1 bundle | Extractor today | Status |
|----|----|----|
| `manifest.json` (`od-design-system-project/v1`, schema-validated by `manifest.schema.ts`) | not emitted | **missing — gating file** |
| `tokens.css` mapped onto `TOKEN_SCHEMA` (`--bg/--surface/--fg/--muted/--border/--accent/...`) | emits `design-tokens.css` in **its own vocabulary** (`--color-*`) | **wrong vocabulary** |
| `design-tokens.json` in `od-design-tokens/v1` (per-token `layer/confidence/reason/sources`) | emits legacy-stage + W3C DTCG | **wrong format** |
| `components.html` fixture (every value a token ref) | none | **missing** |
| `components.manifest.json` (v1 groups: buttons/inputs/cards/badges/links/keyboard/icons/typography/layout) | none | **missing** |
| `tailwind-v4.css` `@theme` | none | **missing** |
| `USAGE.md`, `preview/`, `source/` | none | **missing** |
| Shape-A artifact bundle (`index.html` + inlined assets + `artifact.json`) | mirror exists but **not packaged/installed into OD** | **not wired** |

Extraction-quality gaps hurting *both* shapes:
- Spacing/radius/shadow tokens are **hardcoded defaults** (`publish_brand.py:519,528`; `shadows: []`) — not measured.
- Token names are noisy (`text_rgb(42,44,47)`, `bg_oklab(...)`) leak into `design-tokens.css`.
- **No raw CSS preserved** in the primary path — only computed styles. `:root` custom properties, `@media`, `@keyframes`, `@layer` are lost.
- **Single viewport** capture/validation (1280×720 only); breakpoints hardcoded `[768,1024,1280]`.
- Google Fonts `<link>` + CSS `@import` chains not resolved in the primary asset path (only the mirror walks one level).

---

## Workstreams

| WS | Scope | Depends on | Conflicts (files) |
|----|-------|------------|--------------------|
| WS1 | Shape-A artifact bundle packager + OD install wiring | existing mirror | new `scripts/package_artifact_bundle.py`; `scripts/export_open_design.py` (--install artifact) |
| WS2 | Extraction fidelity: measured tokens, raw CSS/keyframe capture, multi-viewport, clean naming, font resolution | none | `scripts/extract_brand.py` (JS probes); new `scripts/measured_tokens.py`; `scripts/publish_brand.py` |
| WS3 | Shape-B v1 design-system bundle emitter (manifest/tokens.css/components) | WS2 (measured tokens) | new `scripts/build_design_system_bundle.py`; `scripts/export_open_design.py` (delegate) |
| WS4 | Orchestrator integration, regeneration, verification gates | WS1–WS3 | `scripts/extract_brand.py` (phases); `brands/*/` regeneration |

WS1 + WS2 are independent → run as parallel subagents. WS3 starts after WS2's token analyzer exists. WS4 runs last.

---

## WS1 — Shape-A Artifact Bundle (exact page reproduction)

OD consumes a folder/ZIP whose entry is an HTML file (`claude-design-import.ts:57` chooseEntryFile). The mirror already produces that; this WS packages it and wires import.

### Task 1.1: `package_artifact_bundle.py` — self-contained HTML inliner

**Files:**
- Create: `scripts/package_artifact_bundle.py`
- Test: `tests/test_package_artifact_bundle.py`

**Behavior:** Given `brands/<slug>/original/<page>/` (from the mirror), produce `brands/<slug>/open-design/artifacts/<page>/`:
1. Inline all `<link rel=stylesheet>` and `assets/*.css` into a single `<style>` block at `<head>` top.
2. Rewrite `<img src>`, `<source srcset>`, CSS `url(...)`, `<video poster>`, `@font-face url(...)` to `data:` URIs (base64). For assets > 200 KB, keep them as relative `assets/` paths instead of inlining (configurable `--inline-threshold`).
3. Strip `<script>` (already done by mirror) and neutralize `<iframe>` (already done).
4. Emit `artifact.json` per `packages/contracts/src/api/artifacts.ts`:
   ```json
   { "version": 1, "kind": "html", "title": "<page title>",
     "entry": "index.html", "renderer": "html", "status": "complete",
     "exports": ["html","zip"], "primary": "index.html" }
   ```
5. `--zip` also writes `<page>.zip` (the whole folder) — OD's Claude-Design import path ingests this.

**Step 1: Write failing test** — assert inliner turns a fixture with `<link rel=stylesheet href="a.css">` + `assets/a.css` into a single `<style>` block and rewrites `url(b.png)` to `data:image/png;base64,...`; assert `artifact.json` has `kind:"html"`, `entry:"index.html"`.

**Step 2: Run** `pytest tests/test_package_artifact_bundle.py -v` → FAIL (module missing).

**Step 3: Implement** — BeautifulSoup (`bs4`, already a dep) for HTML transform; base64 via `base64.b64encode`; mime from extension map (`{".png":"image/png",".woff2":"font/woff2",...}`).

**Step 4: Run** → PASS. **Step 5: Commit** `feat(artifact): package mirror as self-contained OD artifact bundle`.

### Task 1.2: OD import verification (folder + zip paths)

**Files:**
- Modify: `scripts/package_artifact_bundle.py` — add `--install` (calls OD daemon) + `--verify`.
- Test: `tests/test_package_artifact_bundle.py` (extend).

**Behavior:**
- `--install` (when `OD_DAEMON_URL` set, default `http://localhost:7456`): `POST /api/import/folder` with the artifact dir; on non-200, fall back to documenting the manual CLI: `od` import. Never hard-fail if daemon is down (print instructions, exit 0).
- `--verify`: screenshot `<page>/index.html` via `agent-browser file://...` at 1280×720 and 375×812; pixel-diff against `brands/<slug>/screenshots/reference/<page>.png`; record `fidelity.json` = `{desktop_close, mobile_close}`. This is the "EXACT reproduction" score.

**Step 1: Failing test** — mock `urllib.request.urlopen` for `--install`; assert correct JSON body + graceful handling when daemon returns 503. **Step 3: Implement.** **Step 5: Commit** `feat(artifact): wire OD import + fidelity verification`.

### Task 1.3: Wire into orchestrator + existing-export `--install`

**Files:**
- Modify: `scripts/export_open_design.py` — add `--artifacts` flag that, per page, calls `package_artifact_bundle.package()`; `--install` installs both the design-system (WS3) and artifacts.
- Modify: `scripts/extract_brand.py` — Phase 7.6 (after mirror Phase 4.5): call the packager if `--skip-artifact-bundle` not set.

**Definition of done (WS1):** for an existing mirrored brand, `python3 scripts/export_open_design.py --slug luminary-ai --artifacts` produces `open-design/artifacts/homepage/{index.html,artifact.json}` where `index.html` opens offline with zero external network requests, and `fidelity.json` shows `desktop_close ≥ 0.90`.

---

## WS2 — Extraction Fidelity (measured tokens, raw CSS, multi-viewport)

### Task 2.1: Raw CSS capture probe (stylesheets, `:root`, `@media`, `@keyframes`)

**Files:**
- Modify: `scripts/extract_brand.py` — new JS probe `capture_raw_css` (after `extract_dom`), writes `cache/<slug>/dom-extraction/<page>-rawcss.json`.
- Test: `tests/test_extract_raw_css.py`.

**Behavior (JS injected via `agent-browser eval`):**
1. Iterate `document.styleSheets`; for each, `sheet.cssRules` (guard CORS — `try/catch`, record `crossOrigin: true` when `SecurityError`).
2. Serialize rules into buckets: `rootVars` (declarations from `:root`/`html`), `mediaQueries` (`{query, ruleCount}`), `keyframes` (`{name, steps}`), `layers` (`@layer` names), `fontFace` (`@font-face` family + urls), `supportsRules`.
3. Store the **top-N most-relevant raw rules** (cap 50 KB/page) for fidelity.
4. Resolve cross-origin stylesheets by re-fetching their `href` via the browser `fetch()` fallback (reuse `_browser_fetch_fallback`) before serializing.

**Step 1: Failing test** — feed a fixture HTML with a `<style>` containing `:root{--brand:#fff}`, `@media(max-width:768px){...}`, `@keyframes spin{...}`; assert the probe returns all three buckets with correct values. **Step 5: Commit** `feat(extract): capture raw CSS, root vars, media queries, keyframes`.

### Task 2.2: Measured token analyzer (`measured_tokens.py`)

**Files:**
- Create: `scripts/measured_tokens.py`
- Test: `tests/test_measured_tokens.py`.

**Behavior:** Frequency-cluster computed-style values across many elements to produce *measured* (not fabricated) tokens. Input: a JS probe that samples computed styles for every visible element (sampling `font-size`, `line-height`, `letter-spacing`, `padding-*`, `margin-*`, `gap`, `border-radius`, `box-shadow`, `border-color`, `color`, `background-color`). Output: a `MeasuredTokens` dict with, per dimension, the value histogram snapped to OD scale tiers.

**Mapping rules onto `TOKEN_SCHEMA`** (`packages/contracts/src/design-systems/token-schema.ts:101-198`):
- `--bg` ← modal `background-color` of `body`/`html`; `--surface` ← most frequent card/container bg ≠ `--bg`.
- `--fg` ← modal text `color`; `--muted` ← second text tier (lower frequency, lower contrast vs bg).
- `--border` ← modal `border-color` across bordered elements.
- `--accent` ← most saturated color among links/buttons (fallback: most frequent non-neutral color).
- `--font-display` ← heading font-family; `--font-body` ← body font-family (reuse `preferred_body_font_family` icon/Times filtering at `extract_brand.py:707`).
- `--text-xs..4xl` ← cluster `font-size` into 8 tiers (smallest→display), each the cluster centroid in px.
- `--leading-body`/`--leading-tight`, `--tracking-display` ← modal line-height / letter-spacing.
- `--space-1..12` ← cluster `padding`/`margin`/`gap` px values; assign nearest tier (`4,8,12,16,20,24,32,48`).
- `--radius-sm/md/lg/pill` ← cluster `border-radius` (pill = any value ≥ 999px).
- `--elev-flat/ring/raised` ← cluster `box-shadow` (ring = inset/1px outlines; raised = blurred offsets).
- `--section-y-{desktop,tablet,phone}` ← measured section vertical padding per viewport (see Task 2.4).
- `--container-max`, `--container-gutter-*` ← measured from the dominant `.container`/max-width element.
- `--motion-fast/base`, `--ease-standard` ← from captured `transition` (Task 2.3); fallback to OD defaults if absent.
- `--accent-on/hover/active`, `--success/warn/danger` ← derive `--accent-on` by contrast; others use OD fallbacks unless a semantic color is detected.

Every token carries provenance: `{value, sources:[element selectors], confidence:HIGH|MED|LOW, count}`. Confidence HIGH when frequency ≥ 5 distinct elements; MED 2–4; LOW otherwise.

**Step 1: Failing tests** — (a) cluster `[16,16,16,8,24]` → tiers `--space-2=8,--space-4=16,--space-6=24`; (b) pick `--accent` as most-saturated among `[{r,g,b}]`; (c) map text clusters to `--text-*` preserving order. **Step 5: Commit** `feat(tokens): measured token analyzer mapping computed styles to TOKEN_SCHEMA`.

### Task 2.3: Transition / keyframe capture

**Files:**
- Modify: `scripts/measured_tokens.py` — consume `rawcss.json` `keyframes` + sampled `transition`/`animation` shorthand.
- Test: `tests/test_measured_tokens.py` (extend).

**Behavior:** parse `transition` shorthand from sampled interactive elements (`a, button, [role=button], input`) → modal duration → `--motion-fast` (shortest) / `--motion-base` (modal); parse `cubic-bezier(...)` → `--ease-standard`. Capture `@keyframes` names list into `source/evidence.md` (provenance, not tokenized).

**Step 1: Failing test** — `parse_transition("color 150ms ease, opacity 200ms cubic-bezier(0.2,0,0,1)")` → `{fast:"150ms", base:"200ms", ease:"cubic-bezier(0.2,0,0,1)"}`. **Step 5: Commit** `feat(tokens): capture transitions and easing`.

### Task 2.4: Multi-viewport capture

**Files:**
- Modify: `scripts/extract_brand.py` — measurements probe loops `[1280×720, 1024×768, 375×812]` (desktop/tablet/mobile) via `page.setViewportSize`.
- Modify: `scripts/run_validation_loop.py` — screenshot original + replica at all three viewports (was desktop-only at `:36`).
- Test: `tests/test_run_validation_loop.py` (extend with monkeypatched viewport list).

**Behavior:** write `cache/<slug>/dom-extraction/<page>-viewports.json` with per-viewport section rects + container gutters → feeds `--section-y-*` / `--container-gutter-*`. Validation `report.json` gains `desktop_avg`, `tablet_avg`, `mobile_avg`.

**Step 1: Failing test** — assert validation report contains three `*_avg` keys. **Step 5: Commit** `feat(extract): multi-viewport capture and validation`.

### Task 2.5: Clean token naming + spacing/radius/shadow population

**Files:**
- Modify: `scripts/publish_brand.py` — `build_semantic_palette()` (`:560`) and token emitters consume `MeasuredTokens` when present; replace hardcoded `scale` (`:519`), `radii` (`:528`), `shadows:[]`, `transitions` (`:533`) with measured values (fallback to current defaults only when no data).
- Modify: token-name sanitizer — collapse `text_rgb(...)`/`bg_oklab(...)` into semantic names; dedupe near-identical colors (ΔE < 2).
- Test: `tests/test_publish_brand_outputs.py` (extend).

**Step 1: Failing test** — given a `MeasuredTokens` fixture, assert `design-tokens.json` `borders.radii` equals measured radii (not `["0px","4px","8px","16px","9999px"]`) and no token name matches `^(text|bg)_`. **Step 5: Commit** `feat(publish): measured spacing/radius/shadow tokens, clean semantic naming`.

### Task 2.6: Google Fonts + CSS `@import` chain resolution

**Files:**
- Modify: `scripts/extract_brand.py` asset phase (`:1616-1636`) — resolve `<link rel=stylesheet href="...fonts.googleapis.com...">` and `@import` chains (depth ≤ 3), download the CSS + referenced woff2, register `@font-face`.
- Test: `tests/test_extract_assets.py`.

**Step 1: Failing test** — given a `<link href="https://fonts.googleapis.com/css2?family=Inter">` (mocked response with `@font-face` + woff2 url), assert both the CSS and the woff2 are downloaded. **Step 5: Commit** `feat(assets): resolve Google Fonts and CSS @import chains`.

**Definition of done (WS2):** `python3 scripts/extract_brand.py --url <site>` produces `rawcss.json`, measured `design-tokens.json` (no hardcoded defaults when data exists), three-viewport validation, zero `text_rgb(...)` token names, and resolved Google Fonts. `pytest tests/` green.

---

## WS3 — Shape-B v1 Design-System Bundle (brand reuse)

Emits the complete `od-design-system-project/v1` folder matching `design-systems/stripe/`. Depends on WS2 measured tokens.

### Task 3.1: `build_design_system_bundle.py` skeleton + `manifest.json`

**Files:**
- Create: `scripts/build_design_system_bundle.py`
- Test: `tests/test_build_design_system_bundle.py`.

**Behavior:** produce `brands/<slug>/open-design/design-system/` with a `manifest.json` valid against `manifest.schema.ts`:
```json
{ "schemaVersion": "od-design-system-project/v1",
  "id": "<slug>", "name": "<Brand>", "category": "<mapped from CATEGORY_LABELS>",
  "description": "...", "source": {"type":"bundled","origin":"design-extractor"},
  "files": {"design":"DESIGN.md","tokens":"tokens.css","designTokens":"design-tokens.json",
            "tailwind":"tailwind-v4.css","components":"components.html"},
  "usage":"USAGE.md", "componentsManifest":"components.manifest.json",
  "importMode":"normalized",
  "craft": {"applies":[],"suggested":["color","accessibility-baseline"],"exemptions":[]},
  "assetsDir":"assets", "fonts":[...], "preview":{"dir":"preview","pages":[...]} }
```
Slug must match `/^[a-z0-9]+(?:-[a-z0-9]+)$/` (`expectSlug`). No unknown top-level keys (see `ALLOWED_TOP_LEVEL_KEYS`).

**Step 1: Failing test** — assert emitted `manifest.json` passes a faithful Python port of `validateDesignSystemProjectManifest` (write `scripts/_od_manifest_validator.py` porting the ~80 lines of `manifest.schema.ts`). **Step 5: Commit** `feat(od-bundle): emit schema-valid v1 manifest.json`.

### Task 3.2: `tokens.css` mapped onto `TOKEN_SCHEMA`

**Files:**
- Modify: `scripts/build_design_system_bundle.py`.
- Test: `tests/test_build_design_system_bundle.py` (extend).

**Behavior:** emit `tokens.css` with a single `:root {}` block declaring every required `TOKEN_SCHEMA` token, values from WS2 `MeasuredTokens`. A2 tokens with OD `fallback` values when not measured (`--accent-hover: color-mix(in oklab, var(--accent), black 8%)`, etc. — copy fallbacks verbatim from `token-schema.ts:122-191`). Dark mode under `[data-theme="dark"] {}` (empty or best-effort inferred). Site-specific extras appended as Layer-C custom properties (allowed — schema only enforces required keys).

**Step 1: Failing test** — assert `:root` contains all of `--bg,--surface,--fg,--muted,--border,--accent,--font-display,--font-body,--text-xs..--text-4xl,--container-max`; assert every `var(--x)` resolves; assert A2 unmeasured tokens use OD fallbacks. **Step 5: Commit** `feat(od-bundle): tokens.css mapped to TOKEN_SCHEMA with fallbacks`.

### Task 3.3: `design-tokens.json` in `od-design-tokens/v1`

**Files:**
- Modify: `scripts/build_design_system_bundle.py`.
- Test: `tests/test_build_design_system_bundle.py` (extend).

**Behavior:** port `renderDesignTokensJson` (`derived-token-outputs.ts:16-41`) to Python. One entry per declared token:
```json
{ "schemaVersion":1, "format":"od-design-tokens/v1", "contract":"TOKEN_SCHEMA",
  "generatedAt":"...", "source":{"tokensCss":"tokens.css","tokenContractReport":"source/token-contract.report.json"},
  "summary": {"totalTokens","declaredTokens","layerCounts","score","grade","recommendRebuild":false},
  "tokens":[{"name":"--bg","value":"#fff","type":"color","layer":"A1-identity",
             "confidence":"high","reason":"modal body background across N elements",
             "sources":["body","html"],"sourceName":"--bg"}] }
```
Token `type` inferred from name via the same rules as `inferDesignTokenType` (`derived-token-outputs.ts:59-98`).

**Step 1: Failing test** — assert `type` inference (`--bg`→`color`, `--font-body`→`fontFamily`, `--text-base`→`dimension`, `--ease-standard`→`cubicBezier`, `--motion-base`→`duration`, `--elev-ring`→`shadow`); assert `summary.layerCounts` matches declared. **Step 5: Commit** `feat(od-bundle): design-tokens.json in od-design-tokens/v1`.

### Task 3.4: `components.html` + `components.manifest.json`

**Files:**
- Modify: `scripts/build_design_system_bundle.py`.
- Test: `tests/test_build_design_system_bundle.py` (extend).

**Behavior:**
1. Synthesize `components.html`: a fixture rendering detected components (buttons/inputs/cards/badges/links/kbd/icons/typography/layout) where **every value is a `var(--token)` reference** — no literal hex/px. Component detection reuses `pattern_extractor.categorize_component()` + the DOM-extraction section data (which buttons/cards exist).
2. Emit `components.manifest.json` (schema v1) by porting `extractComponentsManifest` (`components-manifest.ts:147-197`): groups = the 9 `ComponentManifestGroupId`s with `present/selectors/classes/elements/tokenReferences`; `literals` counts hardcoded colors/px/fonts in the fixture (target: all zero).
3. Write `tailwind-v4.css` via a port of `renderTailwindV4Css` (`derived-token-outputs.ts:43-57`) using `TAILWIND_V4_THEME_BINDINGS`.

**Step 1: Failing test** — assert fixture has no literal `#hex` or `\dpx` outside `:root`; assert manifest `groups[buttons].present` true when a `.btn` is in the fixture; assert `literals.colorExpressions == 0`. **Step 5: Commit** `feat(od-bundle): components.html fixture + v1 manifest + tailwind theme`.

### Task 3.5: `DESIGN.md` alignment + `USAGE.md` + preview pages

**Files:**
- Modify: `scripts/build_design_system_bundle.py`.
- Test: `tests/test_build_design_system_bundle.py` (extend).

**Behavior:**
1. `DESIGN.md`: **9 numbered headings** in OD canonical order (`## 1. Visual Theme & Atmosphere` … `## 9. Anti-patterns`), H1 title + `> Category:` line, `:root {}` CSS block (dark via `[data-theme="dark"]`), and the `Font labels for catalog extraction:` block (`Display:`/`Body:`/`Mono:`) the daemon regex needs (`docs/design-systems.md:113-123`). Reuse existing `export_open_design.py` prose generation but **reorder/rename sections** (current set diverges from canonical) and drop YAML frontmatter.
2. `USAGE.md`: agent-facing router (when to use, quick token reference).
3. `preview/colors.html`, `preview/typography.html`, `preview/spacing.html` — static pages showing tokens (mirror `stripe/preview/*`).

**Step 1: Failing test** — assert DESIGN.md has all 9 `## N.` headings in canonical order, a `:root{}` block, and the three `Display:/Body:/Mono:` font labels; assert `--check` (round-trip parser) extracts title + category + swatches. **Step 5: Commit** `feat(od-bundle): DESIGN.md aligned to 9-section schema + preview + USAGE`.

### Task 3.6: Delegate `export_open_design.py` to the bundle + `--install`/`--check`

**Files:**
- Modify: `scripts/export_open_design.py` — replace its direct DESIGN.md emission with a call to `build_design_system_bundle.build()`; keep `--install` (copy `design-system/` → `<od-root>/design-systems/brand-<slug>/`) and `--check` (run `scripts/_od_manifest_validator.py` + the parser port). `--artifacts` (WS1) installs artifacts too.

**Step 1: Failing test** — assert `export_open_design --slug luminary-ai` produces a folder that passes the manifest validator AND `--check` round-trip. **Step 5: Commit** `refactor(od-export): delegate to v1 design-system bundle emitter`.

**Definition of done (WS3):** `python3 scripts/export_open_design.py --slug <slug> --check` passes both the Python manifest-validator port and the OD parser round-trip; `design-system/` contains all 8 files and mirrors `stripe/`'s shape.

---

## WS4 — Integration, Regeneration, Verification (after WS1–WS3)

### Task 4.1: Orchestrator phases

**Files:** Modify `scripts/extract_brand.py` — Phase 7.6 (artifact bundle, WS1), Phase 7.7 (design-system bundle, WS3), guarded by `--skip-artifact-bundle` / `--skip-design-system-bundle`. Update `main()` flag list.

**Step 1: Failing test** — `test_extract_brand_cli.py`: assert new flags exist and default-on. **Step 5: Commit** `feat(orchestrator): add artifact + design-system bundle phases`.

### Task 4.2: Regenerate ≥3 brands end-to-end

**Steps:** For `luminary-ai`, `westpac`, `quantium-com-au` (have cached mirror + dom-extraction): run `python3 scripts/extract_brand.py --url <site> --skip-replicas --skip-html-replicas` (reuse cache, rebuild tokens + bundles). Capture evidence.

### Task 4.3: Live OD import acceptance test (manual, document)

**Steps:** Start OD daemon (`cd ~/Documents/github/open-design && pnpm dev`); run `export_open_design --slug luminary-ai --install --artifacts`; confirm:
1. `od design-systems import-local` (or folder import) lists `brand-luminary-ai` with correct swatches.
2. Artifact `homepage/index.html` renders in OD preview iframe with `fidelity.desktop_close ≥ 0.90`.
3. `pnpm guard` in OD passes on the installed `design-systems/brand-luminary-ai/`.

Record results in `brands/luminary-ai/open-design/install-evidence.md`.

---

## Verification gates (whole plan)

1. `pytest tests/` green (existing 57 + new tests).
2. `python3 scripts/_od_manifest_validator.py` accepts every `brands/*/open-design/design-system/manifest.json`.
3. `export_open_design --check` round-trips title/category/swatches for ≥3 brands.
4. `cd ~/Documents/github/open-design && pnpm guard` passes with one installed extractor brand.
5. For ≥2 brands: artifact `index.html` opens offline with zero external network requests; `fidelity.json` `desktop_close ≥ 0.90`, `mobile_close ≥ 0.80`.
6. `design-tokens.json` contains zero hardcoded-default spacing/radius/shadow tokens when extraction data exists; zero `text_rgb(...)`/`bg_oklab(...)` token names.

---

## Out of scope (explicit)

- React/Next.js replica changes (the React replica is the weakest artifact; this plan invests in HTML/mirror fidelity instead).
- OD's W3C DTCG token consumption (OD does **not** consume DTCG — it uses `tokens.css` + `od-design-tokens/v1`).
- `.pen` / "pencil" MCP output — unrelated toolchain, not consumed by OD.
- SPAs requiring interaction/scroll to render (capture is initial-load only).
