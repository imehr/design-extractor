# Patterns and Relationships

design-extractor captures 15 pattern signals from every extraction. These go beyond individual tokens to describe how the brand's design system behaves as a whole.

9 signals are **mechanically measurable** (computed by `scripts/pattern_extractor.py`). 6 are **LLM-interpreted** (produced by `agents/pattern-analyst.md`).

## Why patterns matter

Tokens alone (colour #08090a, font-size 16px, radius 6px) don't capture a brand's visual identity. The identity emerges from the *relationships* between tokens: "always 4px increments", "buttons are pill-shaped but cards are softly rounded", "the type scale follows a major third ratio".

These patterns are what make a replica *feel* like the brand, even when individual tokens are approximate. They're also the most useful information for a designer applying the brand to a new project — you don't need to memorize 15 colour tokens if you know "this brand is cool-muted, uses a 4px grid, and has snappy 150ms transitions".

## The 9 mechanical signals

### 1. Spacing rhythm / base unit

**What it measures:** The greatest common divisor (GCD) of all padding, margin, and gap values, weighted by occurrence count.

**How it's computed:** Collect all px-valued paddings, margins, and gaps from the token extraction. Filter out outliers > 200px (hero-level spacing). Compute the weighted GCD. Match against known base units {4, 8, 16}. Compute residual: the percentage of values that don't divide evenly by the base unit.

**Labels:** Reported as the base unit value (e.g., "4px") plus the residual percentage.

**Confidence:** HIGH if residual < 20%, MEDIUM if 20-40%, LOW if > 40%.

**Typical values:** 4px is dominant across modern web. Linear, Stripe, Vercel, Apple, Anthropic all use 4px. 8px appears in editorial/content-heavy designs.

### 2. Type scale ratio

**What it measures:** The mathematical ratio between consecutive font sizes in the brand's typographic hierarchy.

**How it's computed:** Sort all detected font sizes ascending. Compute the ratio between each consecutive pair. Find the best-fit named ratio from: minor second (1.067), major second (1.125), minor third (1.200), major third (1.250), perfect fourth (1.333), augmented fourth (1.414), perfect fifth (1.500), golden ratio (1.618).

**Labels:** Named ratio label.

**Confidence:** HIGH if consecutive ratios vary by < 10%, MEDIUM if 10-15%, LOW if > 15%. Bespoke scales that don't fit any named ratio get LOW confidence.

**Typical values:** Most SaaS products use major second (1.125) to major third (1.250). Editorial sites often use larger ratios (perfect fourth or above).

### 3. Component density

**What it measures:** The ratio of non-background pixels to total pixels in a screenshot, indicating how "packed" the layout is.

**How it's computed:** Convert the desktop screenshot to grayscale. Threshold at the dominant background colour. Count non-background pixels / total pixels.

**Labels:** airy (< 0.3), balanced (0.3-0.5), dense (> 0.5).

**Confidence:** HIGH when screenshot is clean. SKIPPED when no screenshot is available.

**Requires:** Desktop screenshot (`--screenshot` flag).

### 4. Alignment grid

**What it measures:** The number of columns and gutter width implied by the page layout.

**How it's computed:** Take horizontal slices of the desktop screenshot at multiple y-positions. For each slice, find the x-coordinates of content-block left edges (transitions from background to non-background). Cluster these x-coordinates using Lloyd's k-means (k from 1 to 16, pick k that minimizes inertia with the fewest columns). Report column count and estimated gutter (median distance between column centers minus median column width).

**Labels:** Column count + gutter px.

**Confidence:** MEDIUM (heuristic-based).

**Requires:** Desktop screenshot.

### 5. Primary CTA placement

**What it measures:** Where the most prominent call-to-action element appears on the page.

**How it's computed:** Scan the desktop screenshot for the largest high-contrast rectangular region in the top half of the page. Classify its position: top-left, top-right, center, hero-center. Determine whether it's above or below the fold (above = within the first viewport height).

**Labels:** Region name + above/below fold.

**Confidence:** MEDIUM. This is an approximation from screenshot analysis.

**Requires:** Desktop screenshot.

### 6. Border radius language

**What it measures:** The distribution of border-radius values, which defines the brand's "sharpness" personality.

**How it's computed:** Build a histogram of all border-radius values from the token extraction. Classify by the dominant pattern.

**Labels:**
- **sharp** — all or nearly all 0px
- **soft** — mostly 2-6px
- **rounded** — 8-16px dominant
- **pill** — mostly 9999px or 50%
- **brutal-mix** — 3+ distinct clusters with no clear dominant

**Confidence:** HIGH (token data is reliable).

### 7. Shadow elevation system

**What it measures:** Whether the brand uses a structured shadow hierarchy (elevation ladder).

**How it's computed:** Cluster unique box-shadow values by blur+spread. Count distinct elevation levels.

**Labels:** flat (0-1 levels), 2-tier, 3-tier, 4+-tier.

**Confidence:** HIGH.

### 8. Motion language

**What it measures:** The timing personality of the brand's transitions.

**How it's computed:** Parse all transition values to extract durations and easing functions. Compute the median duration. Identify the most common easing function.

**Labels:**
- **snappy** — median < 200ms
- **natural** — median 200-400ms
- **luxurious** — median 400-800ms

**Confidence:** HIGH if > 5 transitions detected, MEDIUM if 2-5, LOW if 0-1.

### 9. Color temperature + saturation profile

**What it measures:** The overall warmth/coolness and vibrancy of the brand's colour palette.

**How it's computed:** Convert the top computed colours (by occurrence count) from sRGB to OKLCH colour space. Compute mean chroma (saturation proxy) and hue histogram.

**Labels:**
- Temperature: **cool** (hue weighted to blue-violet), **warm** (hue weighted to red-orange), **neutral** (even distribution)
- Saturation: **vivid** (mean chroma > 0.08), **muted** (chroma 0.02-0.08), **desaturated** (chroma < 0.02)

**Confidence:** HIGH.

## The 6 LLM-interpreted signals

These are produced by `agents/pattern-analyst.md` using vision and reasoning, not mechanical computation.

### 10. Icon style consistency

**What it observes:** Whether icons across the site follow a consistent style (line, filled, duotone, mixed) and a consistent stroke width.

**Output:** Style label + stroke width estimate.

### 11. Photography / illustration style

**What it observes:** The visual treatment of images — photography-real, stylized photography, flat illustration, 3D illustration, mixed, or none.

**Output:** Style label.

### 12. Hero structure template

**What it observes:** The layout pattern of the hero section — e.g., "centered-copy-full-bleed-gradient", "left-text-right-image", "full-bleed-video".

**Output:** Template label string.

### 13. Interaction affordance set

**What it observes:** The grammar of hover, focus, active, and disabled states. How does the brand indicate interactivity?

**Output:** Descriptive rules (e.g., "hover: opacity 0.8 + underline on text links, scale 1.02 on cards").

### 14. Typography pairing

**What it observes:** Categorizes detected font families into roles (primary/secondary/display/mono) and identifies known pairings.

**Output:** Role mapping + known-pairing match (e.g., "Inter + Berkeley Mono").

### 15. Voice-design alignment

**What it observes:** Whether the brand's copy voice reinforces or contradicts its visual identity. A clinical dark UI with playful copy is a mismatch.

**Output:** Narrative assessment + alignment score (aligned / slightly misaligned / contradictory).

## Patterns in DESIGN.md

All 15 signals appear in `## Patterns` as a table:

| # | Signal | Value | Confidence |
|---|---|---|---|
| 1 | Spacing rhythm | 4px, residual 12% | HIGH |
| 2 | Type scale ratio | 1.250 (major third) | MEDIUM |
| ... | ... | ... | ... |

They also feed the `## Relationships` narrative section, where the documentarian agent explains how patterns compose into the brand's visual identity.

## Relationships: how tokens compose into components

Beyond the 15 signals, the DESIGN.md includes a Relationships section that documents composition rules. These are not computed by a single function — they emerge from the pattern-analyst's cross-referencing of token data, component specs, and visual analysis.

Typical composition rules:

1. **Radius assignment** — which radius token is used on which surface type. Linear uses `radius.md = 6px` for all interactive surfaces except avatars (pill).
2. **Colour role mapping** — which colours are used for text vs. accents vs. surfaces. The rule "brand colours never appear in body text" is a relationship, not a token.
3. **Border consistency** — whether the brand uses a single border width (1px) or multiple. Linear and Nimbus both enforce exactly 1px borders everywhere.
4. **Button geometry** — whether all button variants share the same height/padding or diverge. Linear keeps all buttons at 36px height.
5. **Transition scope** — which motion duration is used for hover vs. page-level transitions. Most brands reserve slow durations (400ms+) for backdrop or route changes only.
6. **Spacing discipline** — whether all spacing values are multiples of the base unit, or whether exceptions exist. Strict 4px discipline means no 5px, 7px, or 13px values anywhere.

These rules connect tokens to intent. Without them, a replica might use the correct hex codes but apply them to the wrong surfaces.

## See also

- `scripts/pattern_extractor.py` — implementation of signals 1-9
- `agents/pattern-analyst.md` — agent that computes signals 10-15
- [design-md-spec.md](./design-md-spec.md) — where patterns appear in the DESIGN.md output
- [concepts.md](./concepts.md) — the extraction pipeline that feeds pattern analysis
