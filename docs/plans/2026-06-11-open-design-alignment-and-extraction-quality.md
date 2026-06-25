# Open-Design Alignment, Extraction Quality, Original Mirrors & Execution Mode

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan workstream-by-workstream with parallel subagents.

**Goal:** Close the extraction-quality gaps (publish pipeline, eval dimensions), add a 100% local mirror of original key pages per brand, regenerate standalone HTML replicas of key pages from design-system materials (tokens + downloaded assets, exact structure), export every brand in open-design-compatible format (9-section DESIGN.md + skill), and replicate open-design's Execution mode (Local CLI detection + BYOK with live per-provider model selectors).

**Architecture:** Python scripts remain the extraction/publish backbone (`scripts/`), per-brand artifacts live in `brands/<slug>/` (repo) and `~/.claude/design-library/brands/<slug>/` (library). The UI (Next.js, `ui/`) gains an Execution Mode settings panel backed by new API routes that port open-design's `daemon/agents.js` detection model. Open-design export is a standalone emitter that converts our 15-section DESIGN.md + DTCG tokens into the awesome-design-md 9-section schema open-design consumes.

**Tech Stack:** Python 3 (stdlib + existing deps), Next.js 16 / React 19 / TypeScript / Tailwind 4, agent-browser CLI for page capture, pytest + vitest-style route tests.

---

## Gap Analysis (2026-06-11 audit)

### Current state
- Pipeline phases 0–6 work; **Phase 7–8 (publish/index) are stubbed**: `design_md_writer.py` (860 lines, Google-spec emitter) is referenced by `publish_brand.py` but DESIGN.md/tokens/SKILL.md are not written to `brands/<slug>/` post-extraction. Only `quantium-com-au` has any `brands/` output (validation JSON only).
- **Eval dimensions exist but 4 are unwired**: `pixel_mobile.py`, `pixel_tablet.py`, `font_rendering.py`, `interactive_state.py` are registered in `scripts/eval_dimensions/` but the orchestrator only runs desktop pixel + completeness + pattern + asset + anti-slop.
- **Original-page caching is partial**: `dom-extraction/<page>-snapshot.html` stores rendered DOM only — no CSS, no asset URL rewriting; pages are not openable offline. `export_html_snapshots.py` (210 lines) fetches raw HTML over HTTP without assets.
- **No standalone HTML replicas**: replicas are Next.js pages under `ui/app/brands/<slug>/replica/` only; cannot be reviewed standalone or imported elsewhere.
- **No open-design compatibility**: open-design (`/Users/mehran/Documents/github/open-design`) consumes one `DESIGN.md` per `design-systems/<id>/` folder in the awesome-design-md **9-section schema** (H1 title, optional `> Category:` line, no YAML frontmatter; swatches regex-extracted from `- **Name:** \`#HEX\`` bullets). Our DESIGN.md is 15-section + YAML frontmatter — incompatible as-is.
- **Execution mode**: our `ui/lib/model-settings.ts` has a static provider registry with hardcoded `model_presets`; no CLI detection, no live model lists, no BYOK key management, no Test/Rescan. Open-design's `daemon/agents.js` has the full pattern: PATH scan → `--version` probe → capability flags → live model fetch (`opencode models`, `cursor-agent models`, ACP JSON-RPC for kimi/hermes) → fallback lists → `liveModelCache`.

### Workstreams
| WS | Scope | Conflicts |
|----|-------|-----------|
| WS1 | Publish pipeline completion + eval dimension wiring | `publish_brand.py`, `eval_rubric.py`, `extract_brand.py` (publish hooks) |
| WS2 | 100% original page mirror (`mirror_original_pages.py`) | new script only |
| WS3 | Standalone HTML replica generator (`generate_html_replicas.py`) + compare view | new script only |
| WS4 | Open-design export (`export_open_design.py`): 9-section DESIGN.md + od-format skill + install into open-design | new script only |
| WS5 | Execution mode UI + API: Local CLI / BYOK, detection, live models, key storage | `ui/lib/`, `ui/app/settings/`, `ui/app/api/` |
| WS6 | Integration: orchestrator hooks for WS2/WS3/WS4, `start.sh` ws-server wiring, regenerate artifacts for existing brands | `extract_brand.py`, `start.sh` (after WS1–WS4 land) |

WS1–WS5 are independent and run as parallel subagents. WS6 runs after.

---

## WS1 — Publish pipeline completion & eval wiring

**Files:**
- Modify: `scripts/publish_brand.py` — call `design_md_writer.build_design_md()` and write `brands/<slug>/DESIGN.md`, `design-tokens.json`, `design-tokens.css`, `skill/SKILL.md`, `metadata.json`; mirror to `~/.claude/design-library/brands/<slug>/`.
- Modify: `scripts/eval_rubric.py` — register `pixel_mobile`, `pixel_tablet`, `font_rendering`, `interactive_state` in the default dimension set (graceful `skipped` status when inputs missing, never hard-fail).
- Modify: `scripts/update_library_index.py` — rebuild `index.json` from `brands/*/metadata.json`.
- Test: `tests/test_publish_brand_outputs.py`, extend `tests/test_extract_brand_cli.py`.

**Definition of done:** `python3 scripts/publish_brand.py --slug <slug>` on an existing cached brand produces all five artifacts; `validate_design_md()` returns zero violations; eval report JSON lists 9 dimensions (wired or skipped, never absent).

## WS2 — 100% original page mirror

**Files:**
- Create: `scripts/mirror_original_pages.py`
- Test: `tests/test_mirror_original_pages.py`

**Behavior:** For each key page in `cache/<slug>/dom-extraction/pages.json` (fallback: `*-snapshot.html` present), produce `brands/<slug>/original/<page-slug>/index.html` plus `assets/` such that the page opens offline at 100% fidelity:
1. Prefer rendered DOM snapshot (already captured); fall back to HTTP fetch with browser UA.
2. Parse for `<link rel=stylesheet>`, `<script src>`, `<img src/srcset>`, `<source>`, `<video poster>`, inline `style=`/`<style>` `url(...)` refs, favicons, web-app manifests, and fonts referenced from downloaded CSS (`@font-face` `url(...)` — recurse one level into CSS).
3. Download every asset (reuse `cache/<slug>/assets/` when already present, content-hash filenames), rewrite all references to relative local paths.
4. Write `manifest.json` per page: original URL, capture time, asset count, bytes, failures (403/404 listed, never silent).
5. `--verify` mode: open `index.html` via `agent-browser` `file://` and screenshot; fail if console shows >N missing-resource errors.

## WS3 — Standalone HTML replicas from design-system materials

**Files:**
- Create: `scripts/generate_html_replicas.py`
- Test: `tests/test_generate_html_replicas.py`

**Behavior:** For each key page, emit `brands/<slug>/replica-html/<page-slug>.html` — a single standalone HTML file that preserves the exact extracted DOM structure (sections, nav, hero, cards, footer, headings, copy, links) but is styled exclusively from design-system materials:
1. Source structure from `dom-extraction/<page>.json` + snapshot HTML (deterministic transform; no fabricated content — per repo rule "extract don't imagine").
2. Generate `<style>` from `design-tokens.json`/`design-tokens.css` CSS custom properties (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`); all rules reference tokens, no magic hex values.
3. Reference downloaded assets via relative paths into `../original/<page>/assets/` or `brands/<slug>/assets/` (all images, logos, fonts — never hotlink, never emoji icons).
4. Emit `brands/<slug>/replica-html/compare.html` — side-by-side iframe view (original mirror left, token replica right, page switcher).
5. `--verify`: screenshot replica via agent-browser; record score next to original.

## WS4 — Open-design export

**Files:**
- Create: `scripts/export_open_design.py`
- Test: `tests/test_export_open_design.py`

**Behavior:** Convert a published brand into open-design's exact format:
1. Emit 9-section DESIGN.md (Visual Theme & Atmosphere / Color Palette & Roles / Typography Rules / Component Stylings / Layout Principles / Depth & Elevation / Do's and Don'ts / Responsive Behavior / Agent Prompt Guide) with H1 title + `> Category: <industry>` line, **no YAML frontmatter**. Colors as `- **Name:** \`#HEX\`` bullets so open-design's swatch regex (`daemon/design-systems.js`) extracts them.
2. Write to `brands/<slug>/open-design/DESIGN.md`; `--install` copies to `/Users/mehran/Documents/github/open-design/design-systems/brand-<slug>/DESIGN.md`.
3. Emit od-format skill `brands/<slug>/open-design/skill/SKILL.md` with `od:` frontmatter extensions (`mode: design-system`, `design_system.requires: true`, `preview.type: html`) per open-design `docs/skills-protocol.md`; `--install` copies into open-design `skills/brand-<slug>/`.
4. Round-trip check in tests: title/category/swatch extraction reproduced with the same regexes open-design uses.

## WS5 — Execution mode (Local CLI + BYOK)

**Files:**
- Create: `ui/lib/execution-mode.ts` (CLI registry + detection + BYOK provider registry + live model fetching)
- Create: `ui/app/api/execution/agents/route.ts` (GET detect/rescan), `ui/app/api/execution/agents/test/route.ts` (POST test prompt), `ui/app/api/execution/byok/route.ts` (GET/POST keys+models), `ui/app/api/execution/byok/models/route.ts` (GET live model list per provider)
- Modify: `ui/app/settings/page.tsx` — Execution mode panel (Local CLI | BYOK tab toggle, CLI cards with badges/version/model selector/Test, Rescan button) matching the open-design screenshot
- Modify: `ui/lib/model-settings.ts` — `execution_mode: "local-cli" | "byok"` + byok block in `model-providers.json` (schema version bump w/ migration)
- Test: `ui/lib/__tests__/execution-mode.test.ts` (or repo's existing test convention)

**Local CLI detection (port of open-design `daemon/agents.js`):** declarative `AGENT_DEFS` for claude / codex / gemini / opencode / cursor-agent / kimi / qwen: PATH resolution, `--version` probe, live model list (`opencode models`, `cursor-agent models` line-parsed with 5s timeout and fallback list), result cache with Rescan invalidation. Test = run trivial prompt through the CLI with 30s timeout, report ok/fail + latency.

**BYOK registry:** Anthropic, OpenAI, Google (Gemini), OpenRouter, DeepSeek, Moonshot (Kimi), MiniMax, Z.ai (GLM), xAI, Ollama-local. Keys stored at `~/.claude/design-library/settings/byok.json` chmod 600, **never** sent to the browser (masked `sk-…last4`). Model selectors fetch live from each provider's list-models endpoint (`/v1/models` for Anthropic/OpenAI/OpenRouter/DeepSeek/xAI; `models.list` for Google; Ollama `/api/tags`), sorted newest-first, with current-generation static fallbacks per provider so the dropdown is never empty.

**Wiring:** extraction model selection (`resolveTaskModelSelection`, `extract_brand.py` runner registry, `ws_extraction_server.py`) honors `execution_mode`: local-cli → detected CLI + chosen model; byok → provider+model via API runner.

## WS6 — Integration & regeneration (after WS1–WS5)

1. `extract_brand.py`: add Phase 4.5 (mirror originals → WS2) and Phase 5.5 (HTML replicas → WS3), Phase 7 publish (WS1) + open-design export (WS4) — flags to skip.
2. `start.sh`: launch `ws_extraction_server.py` alongside `next dev` (idempotent, portless-friendly).
3. Regenerate for existing cached brands (`quantium-com-au`, `luminary-ai`, `ailearninglab-live`, `stateofaidesign-com` + any with dom-extraction data): publish → mirror → HTML replicas → open-design export. Evidence: screenshots of mirror + replica + compare view; open-design picks up installed design systems.
4. Update `ui/app/brands/[slug]/page.tsx` to link Original mirror / HTML replica / compare view when present.

---

## Verification gates (whole plan)
1. `pytest tests/` green.
2. `cd ui && npx tsc --noEmit` green; UI builds.
3. For at least 2 brands: `brands/<slug>/` contains DESIGN.md (0 validator violations), design-tokens.json, skill/SKILL.md, original/<page>/index.html (opens offline, screenshot evidence), replica-html/<page>.html + compare.html (screenshot evidence), open-design/DESIGN.md.
4. Open-design `GET /api/design-systems` lists installed brand systems with correct swatches (or equivalent: `node` snippet running open-design's parse on our file).
5. Settings page shows Execution mode panel: detected CLIs with versions + live models; BYOK tab with provider cards + model selectors; settings persist across reload.
