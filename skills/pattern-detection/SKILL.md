---
name: pattern-detection
description: "Compute the measurable and interpretive signals that define a design's feel — spacing rhythm, type scale ratio, density, contrast energy, radius personality, motion temperament. Trigger on 'compute spacing rhythm'; 'what is the type scale ratio'; 'is this airy or dense'; 'detect the design patterns'; 'analyse the visual rhythm'; 'find the base unit'; 'is this brutalist or soft'; 'score the density of this layout'; 'what ratio is the type scale'; 'classify the design personality'; 'is the radius system sharp or pill'. Do NOT trigger for: 'explain typography theory', academic typography lessons, generic design-principles tutorials, or requests for history of grid systems with no concrete tokens to analyse."
---

# Pattern Detection

## When this skill is active

- Extracted tokens exist and need to be interpreted into a design personality
- User asks a qualitative question ("is this airy?", "is it brutalist?") that must be answered quantitatively
- A replica is drifting from the source feel and you need to diagnose which signal is off
- Cross-brand comparison: is Brand A denser than Brand B, and by how much
- Feeding pattern-analyst output into the refinement loop as objective drift metrics

## Core principles

- Feel is measurable: every subjective descriptor maps to at least one numeric signal
- Nine measurable signals anchor interpretation; LLM-interpreted signals sit on top, never replace them
- Patterns are reported with evidence: the number, the sample, the confidence
- A pattern claim with no measurable backing is discarded

## Out of scope

- Teaching typography, grid, or colour theory without concrete tokens to analyse
- Running the extraction itself (that is the design-extraction skill's job)
- Rebuilding the replica (that is the shadcn-replication skill's job)
- Scoring a rendered replica against a reference (that is the visual-diff skill's job)

## How it works

The `pattern_extractor.py` script computes 9 mechanically measurable signals from extracted design tokens. Each signal produces a value, a human-readable label, and a confidence rating (HIGH / MEDIUM / LOW / SKIPPED).

### Signal 1: Spacing rhythm

Computes the greatest common divisor (GCD) of all observed padding, margin, and gap values to identify the base grid unit. The script tests candidates 4px, 8px, 16px, and the empirical GCD. The winner has the lowest residual percentage (values not divisible by the candidate). A residual under 20% is HIGH confidence, under 40% is MEDIUM, above is LOW.

### Signal 2: Type scale ratio

Sorts all unique font sizes, computes successive ratios between consecutive sizes, and matches the median ratio against named ratios: minor second (1.067), major second (1.125), minor third (1.200), major third (1.250), perfect fourth (1.333), augmented fourth (1.414), perfect fifth (1.500), golden ratio (1.618). A spread under 0.15 between min and max ratio gives HIGH confidence.

### Signal 3: Component density

Analyses a desktop screenshot as grayscale. Identifies the background colour as the most common luminance value. Counts pixels that deviate from background by more than 30 units. The ratio of non-background to total pixels classifies the layout: under 0.3 = airy, 0.3-0.5 = balanced, above 0.5 = dense. Requires Pillow.

### Signal 4: Alignment grid

Scans a desktop screenshot at 5 vertical positions (20%, 35%, 50%, 65%, 80% height). At each scanline, detects left-edge transitions where content differs from the background row median by more than 40 luminance units. Runs k-means clustering on the detected left edges for k=2..16, penalising complexity with k*5. Reports the best column count and the gutter width between clusters.

### Signal 5: CTA placement

Analyses the top half of a screenshot. Computes the mean RGB of the entire top half, then measures colour deviation in 4 regions: top-left, top-right, hero-center, and center. The region with the highest mean deviation from the average is the likely CTA location. Always reports above_fold=True since it only analyses the top half.

### Signal 6: Border radius language

Clusters all observed border-radius values into 4 categories: sharp (0px), soft (2-6px), rounded (8-16px), pill (50%, 9999px, or >16px). If more than 3 clusters each exceed 10% of total count, labels it "brutal-mix". Otherwise the dominant cluster gives the label. HIGH confidence when the dominant cluster exceeds 50%.

### Signal 7: Shadow elevation

Parses all CSS box-shadow values to extract (blur, spread) pairs. Buckets pairs by rounding to the nearest 4px. Counts unique buckets: 0 = flat, 1-2 = 2-tier, 3 = 3-tier, 4+ = 4+-tier. This reveals how many distinct elevation levels the design system uses.

### Signal 8: Motion language

Extracts durations and easing functions from CSS transition values. Computes the weighted median duration in milliseconds. Classifies: under 200ms = snappy, 200-400ms = natural, above 400ms = luxurious. Reports the dominant easing function (ease, ease-in-out, linear, or cubic-bezier). Requires at least 5 duration samples for HIGH confidence.

### Signal 9: Colour temperature

Converts all extracted colours to OKLCH colour space. Computes mean chroma (saturation) and identifies the dominant hue range by binning hue angles into 30-degree sectors. Classifies temperature: warm if warm hues (red/orange/yellow/rose) exceed 60% of chromatic colours, cool if cool hues (teal/cyan/blue/violet) exceed 60%, otherwise neutral. Saturation: vivid if mean chroma > 0.08, muted otherwise. Produces labels like "warm-vivid", "cool-muted", "neutral".

## Procedure

### Step 1: Gather inputs

Ensure the extraction pipeline has produced:
- `tokens-output.json` with sections: spacing, typography, borders, shadows, transitions, colours
- A desktop screenshot PNG (1440px wide preferred) for density, grid, and CTA signals

### Step 2: Run the pattern extractor

```bash
python scripts/pattern_extractor.py \
  --tokens ~/.claude/design-library/cache/<slug>/tokens-output.json \
  --screenshot ~/.claude/design-library/cache/<slug>/screenshot-desktop.png \
  --output ~/.claude/design-library/cache/<slug>/patterns.json
```

If no screenshot is available, omit `--screenshot`. Signals 3-5 will be marked SKIPPED.

### Step 3: Read and interpret the output

The script writes two outputs:
- `patterns.json` — machine-readable: `{url, signals: {signal_name: {value, label, confidence}}, metadata: {signals_computed, signals_skipped, extraction_time_ms}}`
- `patterns-llm.json` — human-readable summary (printed to stdout, redirect if needed)

### Step 4: Evaluate significance

A signal is significant when:
- Spacing rhythm: residual_pct < 30% (base unit is real, not noise)
- Type scale ratio: confidence is HIGH or MEDIUM and label is not "insufficient data"
- Component density: ratio > 0.5 (dense) or < 0.25 (very airy) — extreme values drive personality
- Alignment grid: columns >= 3 with confidence MEDIUM or higher
- CTA placement: deviation score > 50 (strong colour contrast in CTA region)
- Border radius: dominant cluster > 60% of total (strong personality, not mixed)
- Shadow elevation: tier count >= 2 (systematic elevation, not ad-hoc)
- Motion language: median duration > 0 (transitions exist) with HIGH confidence
- Colour temperature: mean_chroma > 0.05 and confidence is HIGH or MEDIUM

### Step 5: Feed into refinement

When the replica is drifting, compare signal values between source and replica:
- Delta in base_unit -> spacing tokens need correction
- Delta in type scale ratio -> font-size tokens need correction
- Delta in density -> layout/padding tokens need adjustment
- Delta in border radius label -> radius tokens need correction
- Delta in colour temperature -> colour palette needs adjustment

## Output format

### patterns.json

```json
{
  "url": "https://www.westpac.com.au",
  "signals": {
    "spacing_rhythm": { "base_unit": "16px", "residual_pct": 12.3, "confidence": "HIGH" },
    "type_scale_ratio": { "ratio": 1.250, "label": "major third", "confidence": "HIGH" },
    "component_density": { "ratio": 0.42, "label": "balanced", "confidence": "HIGH" },
    "alignment_grid": { "columns": 4, "gutter_px": 24, "confidence": "MEDIUM" },
    "cta_placement": { "region": "hero-center", "above_fold": true, "confidence": "MEDIUM" },
    "border_radius_language": { "histogram": {"0px": 45, "3px": 12, "8px": 30}, "label": "sharp", "confidence": "MEDIUM" },
    "shadow_elevation": { "unique_clusters": 2, "label": "2-tier", "confidence": "HIGH" },
    "motion_language": { "median_duration_ms": 150, "dominant_easing": "ease", "label": "snappy", "confidence": "HIGH" },
    "color_temperature": { "mean_chroma": 0.1876, "dominant_hue_range": "red", "label": "warm-vivid", "confidence": "HIGH" }
  },
  "metadata": { "signals_computed": 9, "signals_skipped": 0, "extraction_time_ms": 42 }
}
```

### patterns-llm.json

Same structure but with an additional `interpretations` field containing one-sentence human-readable descriptions of each signal.

## Thresholds summary

| Signal | Threshold for HIGH | Threshold for MEDIUM | Threshold for LOW |
|---|---|---|---|
| Spacing rhythm | residual < 20% | residual < 40% | residual >= 40% |
| Type scale ratio | spread < 0.15 | spread < 0.4 | spread >= 0.4 or no match |
| Component density | screenshot available | — | no screenshot |
| Alignment grid | >= 4 detected edges | — | < 4 edges |
| CTA placement | screenshot available | — | no screenshot |
| Border radius | dominant > 50% | dominant <= 50% | no radii detected |
| Shadow elevation | >= 3 shadow samples | < 3 samples | no shadows |
| Motion language | >= 5 duration samples | < 5 samples | no transitions |
| Colour temperature | >= 10 colour samples | < 10 samples | no colours |

## References

- `references/mechanical-signals.md` — Detailed formulas, thresholds, and worked examples for each of the 9 signals
- `references/interpretive-signals.md` — The 6 LLM-interpreted signals and their evidence rules (planned)
- `references/ratio-catalogue.md` — Standard type scale ratios with numeric values (planned)
