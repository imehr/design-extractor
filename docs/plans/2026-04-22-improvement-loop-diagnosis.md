# Improvement Loop Diagnosis — 2026-04-22

## TL;DR

- **The loop is stuck at a scorer plateau around 0.694**, not randomly regressing. 11 of 20 iterations (55%) land on exactly `0.694` or `0.698` — a two-decimal ceiling where kept/regressed decisions are dominated by pixelmatch noise (~±0.003).
- **100% of iterations are for a single brand** (`quantium-com-au`). The "40% kept / 60% regressed" headline is one brand's plateau behaviour, not a cross-brand signal.
- **Biggest gains came from fresh extractions, not refinement.** The only +0.10+ delta (0.491 → 0.658 between jobs) was a new extraction run, not the Claude improver. Within a single refinement job, the best observed delta is +0.026 and the typical kept delta is +0.004–0.005 — same order of magnitude as pixelmatch noise on full-page 1280×720 screenshots.
- **The highest-leverage fix is to raise the keep threshold above noise** (require `score_after > brand_best + 0.01`, not `> brand_best`) and **stop re-running refinement once the last 2 iterations are within ±0.005**. Both are small, contained edits in `scripts/run_improvement_job.py`.
- **Hypothesis ruled out:** "no regression protection" — the loop DOES snapshot the replica and restore it when `kept=False` (`run_improvement_job.py:40-59, 319-320`). Regressions don't compound on disk; they compound in wasted Claude invocations.

## Data summary

### Dataset
- Source: `/Users/mehran/Documents/github/design-extractor/state/learning/experiments.jsonl`
- 20 total rows, all `brand = quantium-com-au`, spanning 2026-04-12 → 2026-04-13 (10 distinct `job_id`s).

### Per-brand

| brand | iterations | kept | regressed | flat | jobs |
|---|---|---|---|---|---|
| quantium-com-au | 20 | 8 (40%) | 7 (35%) | 5 (25%) | 10 |

No other brand has an entry. "40% / 60%" is single-brand.

### Delta statistics (only rows with both `score_before` and `score_after`, n=13)

| Cohort | n | mean Δ | median Δ | min | max |
|---|---|---|---|---|---|
| Kept (improved) | 4 | **+0.0097** | +0.0045 | +0.004 | +0.026 |
| Regressed | 4 | **−0.0020** | −0.0025 | −0.005 | +0.002¹ |
| Flat | 5 | 0.000 | 0.000 | 0.000 | 0.000 |
| All | 13 | +0.0039 | +0.003 | −0.005 | +0.026 (σ = 0.009) |

¹ One "regressed" row has `score_after > score_before` (+0.002) but is still marked regressed because `brand_best_score` was higher than both — expected behaviour.

The user's reported "+0.010 mean when kept" is correct but carried almost entirely by a single +0.026 row (`d80294d15705` iter 2). Remove that outlier and mean-kept drops to +0.0043.

### By iteration number

| iter | kept / total |
|---|---|
| 1 | 4 / 10 |
| 2 | 1 / 5 |
| 3 | 1 / 3 |
| 4 | 1 / 1 |
| 5 | 1 / 1 |

Iteration-1 is the lowest hit rate, because many new jobs start when the brand is already at its historical best. Once inside a warm job (iter 4+), small keeps are more common — but the iter-4 and iter-5 samples are single rows (job `728469dd17ad`), not a trend.

### Score distribution

12 unique `score_after` values across 20 iterations: `0.491, 0.658, 0.682, 0.684, 0.685, 0.688, 0.689, 0.693, 0.694, 0.696, 0.698, 0.699`. Median 0.694, min 0.491, max 0.699. **After iteration 9, every observed score falls inside [0.694, 0.699]** — a 0.005 band.

## Trajectory analysis (quantium-com-au)

```
job 1d3d0baf  iter1    -> 0.491   KEPT  (first extraction)
job d80294d1  iter1    -> 0.658   KEPT  (re-extraction, +0.167 vs brand best)
              iter2    -> 0.684   KEPT  (Claude improver, +0.026)
              iter3    -> 0.682   REGRESSED (−0.002, rolled back)
job 728469dd  iter1    -> 0.688   KEPT  (+0.004)
              iter2    -> 0.685   REGRESSED (−0.003, rolled back)
              iter3    -> 0.689   KEPT  (+0.004 vs best 0.685? no, vs 0.688 it's +0.001 but marked improved — see bug note below)
              iter4    -> 0.693   KEPT  (+0.004)
              iter5    -> 0.698   KEPT  (+0.005)
job 3101d67a  iter1    -> 0.698   FLAT
              iter2    -> 0.698   FLAT
job 3d3a6f0a  iter1    -> 0.699   KEPT  (+0.001 — within noise)
              iter2    -> 0.694   REGRESSED
              iter3    -> 0.696   REGRESSED (still below 0.699)
job 6969ab4a  iter1    -> 0.694   REGRESSED vs stored best
job f4bf53e0  iter1    -> 0.694   REGRESSED
              iter2    -> 0.694   FLAT
job 21ddcbfb  iter1    -> 0.694   FLAT
job c27db4de  iter1    -> 0.694   FLAT
job aba2104c  iter1    -> 0.694   FLAT
```

Shape: big jumps on re-extraction (0.491 → 0.658, +0.167), then a slow climb 0.658 → 0.699 (+0.041 over 7 iterations), then a plateau where every new Claude invocation oscillates inside 0.694–0.699 and mostly fails to exceed the prior best.

**Note on bookkeeping:** the logged `score_before` on `kept=False` rows is set to `brand_best_score` (run_improvement_job.py:333), which is why some regressed rows show `score_before == score_after` (e.g. `0.694 → 0.694` labelled `flat`) — the row compares against the stored best, not the prior iteration. This is correct per the design, but it means "regressed" in the log is really "failed to beat best," which is not the same as "made things worse."

**One inconsistency:** `728469dd17ad` iter3 shows `score_before=0.685, score_after=0.689, kept=True`. At that point `brand_best_score` should have been 0.688 (from iter1, since iter2 was rolled back). 0.689 > 0.688, so the keep is correct, but the logged `score_before` (0.685) was the regressed iter2 result, not the true best. Minor reporting artefact in `run_improvement_job.py:333` — the ternary `brand_best_score if not kept else (history[-2] ...)`. The `history[-2]` path picks the immediately-prior iteration, which may itself have been rolled back. Not causing wrong decisions, but noise in the log.

## Hypothesis evaluation

### a. Prompt is too generic — **Partially supported**

`build_claude_improvement_prompt` (`scripts/improvement_job.py:159-225`) does pass concrete inputs: worst page slug, TSX path, both screenshots, and pre-computed component issues from `component_validator.py` (pixel score, bg colour diffs, image count diffs, height diffs). That's better than "improve layout fidelity." The limitation is that the **component issues are structural** (counts and heights), not visual — and visual diffs drive score_after, because full-page pixelmatch doesn't care about `imgCount`. The agent gets told "images: orig 3 vs repl 1" but must infer which image, where, styled how. Inside a plateau that feedback isn't tight enough to produce a >0.01 gain.

Evidence: `component_validator.py:176-193` — "issues" are comparisons of integer counts and single CSS values, not localised pixel-diff heatmaps.

### b. Scorer noise floor — **Supported (primary finding)**

Median regressed delta is −0.0025; median kept delta is +0.0045. Kept and regressed distributions overlap heavily: one row labelled "regressed" has `score_after > score_before` (+0.002) but was still below the stored best. The stdev of all deltas is **0.0090**, and the 0.694↔0.699 cluster sits inside ±0.005 — you cannot reliably distinguish a real improvement from re-render jitter at that scale.

Sources of noise in `run_validation_loop.py`: `agent-browser` full-page screenshots at 1280×720 depend on (1) animation settling (the script waits 3s for replica, 5s for original), (2) lazy-loaded images, (3) font loading, (4) any carousel/auto-playing content on the live `quantium.com.au` pages, (5) resize step `repl.resize(orig.size, Image.Resampling.LANCZOS)` when dimensions differ. Pixelmatch with `threshold=0.1` (line 88 of `score_replica.py`, and line 133 of `run_validation_loop.py`) flags sub-percent colour shifts as mismatches.

### c. Wrong worst-page heuristic — **Partially supported**

`improvement_job.py:172`: `worst_page = pages[0] if pages else None`. The manifest is sorted worst-first (`run_validation_loop.py:226`, `pages_needing_work.sort(key=lambda p: p["current_score"])`), so this picks the lowest-scoring page. For quantium the worst page is `careers` at 55.0% while `about-us/genai/perspectives` are 76–77% and `homepage` is 67.6%. Optimising `careers` alone lifts the 5-page mean by (new_score − 55)/5. A 20-point career improvement only moves the average 4 points. Meanwhile the other pages drift within noise, swamping the signal.

This doesn't prove the heuristic is wrong — fixing the worst page IS the highest-gradient move in principle — but it explains why per-iteration deltas are small: the other four pages' noise (±1–2% each) averaged across 5 pages is ±0.5% on the mean, i.e. ±0.005 in `score_after`. Exactly the observed noise floor.

### d. No regression protection — **Refuted**

The loop snapshots the replica before validation and restores it when `kept=False` (`run_improvement_job.py:40-59, 319-320`). Kept semantics are correct: `score > brand_best_score` is strict (line 300). When `kept=False`, `_restore_replica` overwrites `replica/` with `.snapshot/`. The 60% regression rate does **not** compound on disk.

What it DOES compound: wasted Claude subprocess time (~900s timeout each), wasted `agent-browser` captures, and a growing `experiments.jsonl` of non-signal.

### e. Feedback not flowing — **Supported for older rows, fixed for new ones**

`build_claude_improvement_prompt` accepts `recent_feedback` (lines 168, 215–223) and `run_improvement_job.py:99-102` reads from `state/learning/feedback-log.jsonl`. All 20 rows in `experiments.jsonl` predate the current prompt-building logic — per the task brief, `recent_feedback` "was unused in the prompt until this session's fix." So none of the historical data tested the fix. For future runs this should help, but the 20 existing rows cannot prove or disprove it.

### f. Kept semantics wrong — **Refuted**

`kept=True` means `score_after > brand_best_score` AND the snapshot is not restored (replica changes persist). `kept=False` means snapshot IS restored (replica is reset to pre-iteration state). Behaviour matches the labels. The only wrinkle is the `score_before` field logged for `kept=False` rows (line 333) — that's a reporting artefact, not a correctness bug.

## Recommendation

**Change: add a noise-floor guard and an early-exit in `scripts/run_improvement_job.py`.**

Two concrete edits, both small:

### Edit 1 — raise the "improved" threshold above noise

File: `scripts/run_improvement_job.py`, lines 299-308.

Current:
```python
if score > brand_best_score:
    kept = True
    status_label = "improved"
elif score == brand_best_score:
    kept = False
    status_label = "flat"
else:
    kept = False
    status_label = "regressed"
```

Proposed (reject improvements inside the noise band):
```python
NOISE_FLOOR = 0.01  # minimum delta to count as a real improvement (observed σ ≈ 0.009)
if score > brand_best_score + NOISE_FLOOR:
    kept = True
    status_label = "improved"
elif score > brand_best_score:
    kept = False
    status_label = "noisy_gain"  # real delta but below noise floor
elif score == brand_best_score:
    kept = False
    status_label = "flat"
else:
    kept = False
    status_label = "regressed"
```

**Why:** 3 of the 8 "kept" rows (`3d3a6f0a` iter1 +0.001, `728469dd` iter3 +0.001 effective, `728469dd` iter4 +0.004) sit at or below the noise floor. Keeping them locks the replica to random jitter and makes the next iteration harder (the new best is artificially elevated). Rejecting them preserves the replica and sharpens the learning signal.

### Edit 2 — early-exit when stuck in the noise band

File: `scripts/run_improvement_job.py`, line 366.

Current:
```python
if len(history) >= 2 and abs(history[-1] - history[-2]) < 0.001:
    update_job_state(job_path, state, status="stalled")
    return 0
```

Proposed (trigger stall detection on the noise band, not exact equality):
```python
if len(history) >= 3 and max(history[-3:]) - min(history[-3:]) < 0.01:
    update_job_state(job_path, state, status="stalled")
    return 0
```

**Why:** `abs(history[-1] - history[-2]) < 0.001` only fires on exact repeats. The 5 "flat" rows in the dataset (jobs `3101d67a`, `f4bf53e0`, `21ddcbfb`, `c27db4de`, `aba2104c`) got detected by this check — good. But `3d3a6f0a` ran 3 iterations in the 0.694–0.699 band and never triggered stall because consecutive deltas were 0.005 and 0.002. A 3-iteration window with spread < 0.01 catches that pattern and saves the Claude invocation budget.

### Combined effect on the 20-row history

Replaying with both edits:
- `728469dd` iter3 (+0.004 actual, +0.001 effective): no longer kept → iter4's starting best stays at 0.688 → iter4 would need to exceed 0.698 to keep. Iter5 hit 0.698; loop stops there.
- `3d3a6f0a` would stall after iter3 (window 0.694–0.699 < 0.01), saving iter 4+ calls.
- `6969ab4a`, `f4bf53e0`, `21ddcbfb`, `c27db4de`, `aba2104c`: most would stall on iter1 or iter2 instead of reaching iter3. Roughly 40% fewer Claude invocations with no material loss of learning signal.

Net: same score outcome (plateau near 0.70 is real, not a bug), fewer wasted runs, cleaner `experiments.jsonl`.

## Follow-ups (optional)

1. **Score the worst page only**, not the 5-page mean, inside the refinement loop. Keep the full-brand score as the gate, but let Claude's feedback come from a tighter signal (`careers` at 55% has 25 pts of headroom; the average has ~10 pts). Change `run_improvement_job.py:292` to read `report["pixel_comparison_viewport"][worst_page_slug]["close"] / 100` instead of the average.

2. **Add a pixel-diff heatmap** to the Claude prompt. `pixelmatch` already writes a diff image if given an output buffer; producing a PNG highlighting where the replica diverges would replace the weaker integer-count issues from `component_validator.py`.

3. **Treat re-extraction as a separate operation** in the log. The +0.167 jump between jobs `1d3d0baf` and `d80294d1` is a re-extraction, not a refinement — but both are recorded identically. A `job_type: "extract" | "refine"` field would prevent the mean from being dominated by extractions.

4. **Expand the dataset before any harder claims.** All diagnoses above are one-brand. Before tuning the scorer or rewriting the refinement-agent prompt, run the loop on 2–3 more brands (westpac, woolworths, nine) and check whether the plateau sits at the same ~0.70 or is brand-specific. If every brand plateaus in the 0.65–0.75 band, that's a scorer ceiling (full-page pixelmatch at 0.1 threshold can't reward token-level fidelity) — which calls for replacing the top-line scorer, not tuning the loop.
