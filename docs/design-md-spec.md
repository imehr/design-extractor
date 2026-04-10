# DESIGN.md Specification

The `DESIGN.md` is the primary artifact of every extraction. It documents the complete design system of a brand in a structured, machine-readable-friendly markdown format with YAML frontmatter.

For the gold-standard example, see `tests/fixtures/linear-app-ground-truth.md`. For a synthetic seed example, see `templates/sample-brand/DESIGN.md`.

## YAML frontmatter

Every DESIGN.md begins with a YAML frontmatter block delimited by `---`. The following fields are defined:

### Required fields

| Field | Type | Description |
|---|---|---|
| `name` | string | Skill identifier. Format: `brand-<slug>`. Example: `brand-linear-app`. |
| `description` | string | One-paragraph description including positive trigger phrases ("Use when...") and negative trigger phrases ("Do NOT trigger for..."). This is the primary signal for Claude's skill auto-loading. |
| `version` | semver | Version of this DESIGN.md. Initial extractions use `1.0.0`. |
| `source_url` | URL | The URL that was extracted. |
| `extracted_at` | date | ISO 8601 date of extraction. |
| `extractor_version` | string | Plugin version. Format: `design-extractor@<semver>`. |
| `extraction_method` | enum | One of: `automated`, `hand-written-ground-truth`, `hand-curated-seed`. |
| `scores` | object | Validation scores (see below). |
| `confidence` | enum | Overall confidence: `HIGH`, `MEDIUM`, or `LOW`. |
| `language_variant` | string | English variant detected in copy: `en-US`, `en-GB`, `en-AU`, etc. |
| `category_tags` | list | Freeform tags for library browsing. Examples: `dev-tools`, `b2b-saas`, `e-commerce`. |

### Scores object

```yaml
scores:
  overall: 0.87
  tokens: 0.92
  replica: 0.85
  voice: 0.80
  patterns: 0.90
```

Each score is a float from 0.0 to 1.0. `overall` is the weighted average. Auto-generated extractions report the score from the final refinement iteration. Hand-written ground-truth files use 1.00.

### Optional fields

| Field | Type | Description |
|---|---|---|
| `synthetic` | boolean | `true` if this is seed data, not a real extraction. |
| `category` | list | Deprecated; use `category_tags`. |

## Body sections

The DESIGN.md body contains 15 sections in a fixed order. Each section uses `##` headings. Subsections use `###`.

### 1. Title (`# <Brand Name>`)

The top-level heading is the brand name (e.g., `# Linear`). Followed by an optional blockquote noting provenance (hand-written, auto-generated, synthetic).

### 2. At a Glance

A 3-5 sentence summary of the brand's visual character. Covers: dominant colour strategy, typography, spacing base unit, motion feel, and overall impression. This section is the "elevator pitch" for the design system.

Example from the Linear ground-truth:

> Linear is the canonical example of a "design-forward dev tool". Its visual language is **monochrome-with-pastel-accents**: a near-black surface system (`#08090a` to `#f7f8f8`), Inter Variable typography tuned to fractional weights (510, 590), and a small set of saturated pastel highlights (pink, cyan, purple, orange) used sparingly for state and emphasis. Motion is **snappy** (median 150ms, sharp easing). Shadows are **almost invisible** (1px hairlines and 4px soft drops). The grid is a **4px base unit** with a 5-step breakpoint set.

### 3. Metadata

A table of factual metadata: industry, category tags, source URL, extraction date, source page title, theme colour, dark mode support, language variant, internal link count.

### 4. Tokens

The largest section. Contains subsections for each token category:

- **Colours** — table with columns: Token, Value, Hex, Confidence, Source. Ends with a "Brand impression" paragraph summarizing colour distribution.
- **Typography** — table of font families, weights, and variable-font axis settings. Followed by a type scale table (Role, Size, rem, Source) and notable letter-spacing tokens.
- **Spacing** — base unit, scale values, and a note on detection method (GCD on observed padding/margin/gap).
- **Border radius** — table with Token, Value, Use. Notes on dominant radius value.
- **Border width** — table of border-width tokens.
- **Shadow** — table with Token, Value, Use. Notes on shadow philosophy (minimal, Material-like ladder, etc.).
- **Motion** — table with Token, Value, Label. Duration labels: `snap` (<200ms), `natural` (200-400ms), `luxurious` (>400ms). Easing names where identifiable (quad-out, quart in-out, etc.).
- **Breakpoints** — comma-separated pixel values. Notes on responsive strategy (media queries, container queries, JS-driven).

### 5. Typography (expanded)

Repeats the hierarchy from Tokens/Typography in a wider table format with columns: Role, Size, Weight, Letter-spacing, Line-height. Adds notes on font pairing rationale and fallback strategy.

### 6. Spacing (expanded)

Repeats base unit and scale. Adds container max-width, section padding conventions, and notes on whitespace philosophy.

### 7. Components

Per-component documentation for the major UI elements found on the page. Each component is a `###` subsection. Common components:

- `nav` — height, background, border, sticky behaviour, link styles, CTA placement
- `hero` — layout, headline/subhead sizes, CTA arrangement, background treatment
- `button` — variants (primary, secondary, ghost, disabled), padding, radius, transitions
- `card` — border, radius, padding, shadow, hover behaviour
- `footer` — background, column layout, link styles, border
- `form` — input height, padding, radius, focus state, label/error styles

Each component spec lists exact token values (hex codes, pixel sizes, transition values).

### 8. Patterns

The 15-signal pattern report in table format. Columns: #, Signal, Value, Confidence. See [patterns-and-relationships.md](./patterns-and-relationships.md) for what each signal measures.

### 9. Relationships

A numbered list of composition rules: how tokens combine into components. Each rule states a constraint (e.g., "Every interactive surface uses `radius.md = 6px` unless it's pill (avatars) or square (focus rings)"). Followed by a "Relationship-to-brand-feel" paragraph connecting the rules to the brand's visual impression.

### 10. Voice

Four subsections:

- **Tone spectrum** — table of 4 dimensions (formal/casual, technical/accessible, authoritative/friendly, urgent/calm) with percentage positions.
- **3 defining traits** — numbered list of named traits with example copy.
- **CTA patterns** — bullet list of CTA verbs + noun patterns, with an "Avoid" list.
- **Language variant** — en-US / en-GB / en-AU and microcopy do/don't table.

### 11. Motion (expanded)

Label (snappy/natural/luxurious), median duration, default and dramatic easings with named curves, and example transitions for common interactions.

### 12. Assets

Table of asset types (logo variants, favicon, icon system, illustrations) with extraction status.

### 13. Brand Alignment

A 2-3 paragraph analysis of how voice and visuals reinforce each other. Identifies any contradictions (e.g., calm copy with loud visuals). This section is generated by the LLM based on the voice and pattern data.

### 14. How To Use

Contains:

- A Tailwind config snippet (`tailwind.config.ts`) that implements the extracted tokens.
- An apply command: `/design-extractor:apply-design <slug>`.

### 15. Validation

Gate scores table (Section, Target similarity or Score) and provenance notes.

## Provenance

The final section is a table mapping each data file to its origin (script invocation, hand-authored, etc.).

## Relationship to per-brand SKILL.md

The DESIGN.md is the comprehensive reference. The per-brand SKILL.md is a condensed operational version — it inlines the most critical tokens and component rules so Claude can apply them without reading the full DESIGN.md. The SKILL.md uses progressive disclosure: it references files under `skill/references/` for detail that does not fit in the 500-line skill body.

See [per-brand-skill-spec.md](./per-brand-skill-spec.md) for the SKILL.md schema.

## Automated vs. hand-written DESIGN.md files

The `extraction_method` field distinguishes three types:

- `automated` — produced by the extraction pipeline. All sections are machine-generated. Scores reflect the validation pipeline's assessment.
- `hand-written-ground-truth` — authored manually by a human as a benchmark for evaluating automated output. The Linear ground-truth at `tests/fixtures/linear-app-ground-truth.md` is the canonical example. Scores are 1.00 by definition.
- `hand-curated-seed` — authored manually as library seed data. The Nimbus sample at `templates/sample-brand/DESIGN.md` exists so the library browser has content before any real extraction has run.

Automated DESIGN.md files are scored against hand-written ground-truths when both exist for the same URL. The target similarities by section are: Tokens >=0.90, Patterns >=0.85, Voice >=0.80, Components >=0.75.

## Versioning

The `version` field uses semver. Initial automated extractions produce `1.0.0`. If the same URL is re-extracted (e.g., after the site redesigns), the version increments. The library retains only the latest version per slug — older versions are overwritten.

Hand-written ground-truths and seed data are versioned independently from automated extractions.
