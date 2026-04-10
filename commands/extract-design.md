---
name: extract
description: Extract a complete design system from a URL — tokens, patterns, voice, and an iteratively-refined shadcn/Tailwind HTML replica that converges to >=0.85 visual similarity. Produces a per-brand DESIGN.md and an installable per-brand SKILL.md in ~/.claude/design-library/.
argument-hint: <url>
---

# /design-extractor:extract

Extract a complete design system from a URL and publish it to the local design library.

The user-supplied URL is: $ARGUMENTS

## Setup

Derive the slug from the URL by stripping the protocol and path, then replacing dots with hyphens:
- `https://linear.app` -> `linear-app`
- `https://stripe.com/pricing` -> `stripe-com`

Set the following variables for all subsequent agent dispatches:
- `url` = the full URL as provided
- `slug` = the derived slug
- `cache_dir` = `~/.claude/design-library/cache/{slug}`
- `PLUGIN_DIR` = the directory containing this plugin (the parent of `commands/`)

Create the cache directory:
```bash
mkdir -p {cache_dir}/{recon,screenshots/reference,screenshots/iterations,replica,assets,validation,patches,skill,skill/references}
```

## Phase A — Extract

### Step 1: Reconnaissance (sequential — gates everything else)

Dispatch `agents/recon-agent.md` with:
- `url` and `cache_dir`

Wait for completion. If recon-output.json contains `"error"`, report it to the user and ask whether to continue with degraded extraction or abort.

### Step 2: Parallel extraction (fan-out)

Dispatch these three agents in parallel using the Agent tool with `run_in_background: true`:

1. **token-extractor** — `agents/token-extractor.md` with `url`, `cache_dir`
2. **asset-extractor** — `agents/asset-extractor.md` with `url`, `cache_dir`
3. **voice-analyst** — `agents/voice-analyst.md` with `url`, `cache_dir`

Wait for all three to complete. Check each output file for errors. Report any failures but continue — partial data is acceptable.

### Step 3: Pattern analysis (sequential — needs tokens)

Dispatch `agents/pattern-analyst.md` with `cache_dir`. It reads `tokens-output.json` and reference screenshots.

Wait for completion. Expected outputs: `patterns.json` and `patterns-llm.json`.

### Step 4: Replica generation (sequential — needs all Phase A data)

Dispatch `agents/replica-builder.md` with `cache_dir`. It reads tokens, patterns, and voice data to generate `replica/index.html`, then screenshots it.

Wait for completion. Expected outputs: `replica/index.html` and `screenshots/iterations/1/*.png`.

## Phase B — Evaluate and refine (max 5 iterations)

Initialize: `iteration = 1`, `prev_score = 0.0`

### Loop

While `iteration <= 5`:

#### B.1 — Score the current replica

Run pixel comparison:
```bash
python3 $PLUGIN_DIR/scripts/pixel_compare.py \
  --original-dir {cache_dir}/screenshots/reference/ \
  --replica-dir {cache_dir}/screenshots/iterations/{iteration}/ \
  --output-json {cache_dir}/pixel_scores.json
```

Run weighted scoring:
```bash
python3 $PLUGIN_DIR/scripts/score_replica.py \
  --reference-dir {cache_dir}/screenshots/reference/ \
  --replica-dir {cache_dir}/screenshots/iterations/{iteration}/ \
  --output {cache_dir}/iteration_scores.json
```

Read `iteration_scores.json`. Extract `overall_score` and `blocking_failures`.

#### B.2 — Check convergence

If `overall_score >= 0.85 AND blocking_failures == []`:
- Log: "Converged at iteration {iteration} with score {overall_score}"
- Break the loop.

If `iteration > 1 AND (overall_score - prev_score) < 0.01`:
- Log: "Plateau detected at iteration {iteration} (delta < 0.01). Early exit."
- Break the loop.

Update `prev_score = overall_score`.

#### B.3 — Visual critique

Dispatch `agents/visual-critic.md` with `cache_dir` and `iteration`.

Wait for completion. Expected output: `llm_critique.json`.

#### B.4 — Refinement

Dispatch `agents/refinement-agent.md` with `cache_dir`, `iteration`, and `next_iteration = iteration + 1`.

Wait for completion. Expected outputs: updated `replica/index.html`, new screenshots at `screenshots/iterations/{iteration+1}/`, patch log at `patches/{iteration}.json`.

Increment `iteration`.

### End of loop

Append iteration results to `{cache_dir}/validation/iterations.jsonl` (one JSON object per line per iteration).

Report the final score and iteration count to the user.

## Phase C — Publish

### Step 6: Documentation

Dispatch `agents/documentarian.md` with `cache_dir`, `url`, `slug`.

Wait for completion. Expected output: `{cache_dir}/DESIGN.md`.

### Step 7: Skill packaging

Dispatch `agents/skill-packager.md` with `cache_dir`, `url`, `slug`.

Wait for completion. Expected outputs: `{cache_dir}/skill/SKILL.md` and `{cache_dir}/skill/references/*.{json,md,html}`.

### Step 8: Library registration

Dispatch `agents/librarian.md` with `cache_dir`, `slug`.

Wait for completion. Expected: brand entry at `~/.claude/design-library/brands/{slug}/`, updated `index.json`.

## Completion

Report to the user:
1. Brand slug and library path
2. Final overall score and iteration count
3. Any degraded signals (confidence < HIGH)
4. Next steps: `/design-extractor:browse` to view in the library UI, `/design-extractor:apply {slug}` to install the brand's SKILL.md

If the final score is below 0.85, note the confidence level and suggest the user inspect the replica manually.
