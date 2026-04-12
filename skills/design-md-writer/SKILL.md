---
name: design-md-writer
description: "Render the canonical DESIGN.md brand document from extracted tokens, patterns, assets, voice analysis, and validation evidence — using the Jinja2 template and confidence-badged tables. Trigger on 'write a DESIGN.md'; 'format brand documentation'; 'produce the design doc for this extraction'; 'render the DESIGN.md from the cache'; 'generate the brand document'; 'compile the design system markdown'; 'write up the extraction as a DESIGN.md'; 'produce the per-brand design doc'; 'format the extracted tokens into markdown'. Do NOT trigger for: 'write project README', 'write a blog post about design', generic markdown writing, documentation for unrelated codebases, or design articles with no extraction artefacts to pull from."
---

# DESIGN.md Writer

## When this skill is active

- Phase C documentarian subagent is rendering the brand document at the end of an extraction
- All extraction artefacts exist in `~/.claude/design-library/cache/<slug>/` and must become a single canonical markdown file
- User asks for the DESIGN.md for a brand that has already been extracted
- A re-render is needed because tokens changed but the extraction cache is still valid
- The markdown companion to the `design-system.html` is being produced

## Core principles

- The document is rendered from a template, not written freehand — consistency across brands is non-negotiable
- Every token table carries a confidence badge (HIGH / MEDIUM / LOW) and sample count
- Validation evidence (pixel score, blocking failures, gate results) lives inline next to the claims it supports
- Link to artefacts, do not re-embed them: SVG logo, screenshots, design-system.html
- The reader is a senior designer auditing the extraction, not a marketing lead reading a brand deck

## Out of scope

- Writing project READMEs or generic markdown unrelated to an extraction
- Authoring brand strategy or marketing copy
- Running the extraction itself (that is the design-extraction skill's job)
- Updating the library index (that is the library-management skill's job)

## How it works

The DESIGN.md is generated using a Jinja2 template at `templates/DESIGN.md.jinja`. The template receives a context dictionary with all extraction artefacts and renders a structured markdown document with confidence-badged tables, token evidence, and validation scores.

## DESIGN.md structure

The rendered document has these sections in order:

### 1. YAML frontmatter

Contains machine-readable metadata: brand name, slug, source URL, extraction date, extractor version, scores, confidence level, category tags. The frontmatter also serves as a skill definition file — when installed into a project's `.claude/skills/` directory, Claude auto-loads the brand's design rules.

### 2. Brand heading + At a Glance

The brand name as an H1, followed by a prose summary paragraph. This paragraph gives a designer a quick feel for the brand's personality in 2-3 sentences.

### 3. Metadata table

A key-value table with: Industry, Category tags, Source URL, Extracted at, Source title, Theme colour, Has dark mode, Language variant. Any extra metadata fields are appended automatically.

### 4. Tokens section

The largest section, with subsections for each token category:

#### Colours

Table columns: Token | Value | Hex | Confidence | Source

Each row is one extracted colour. The `hex` column shows the colour value as a hex code. The `confidence` column shows the extraction confidence. The `source` column indicates where in the DOM the colour was found.

Below the table: brand impression paragraph, and a list of CSS custom properties if detected.

#### Typography

Table columns: Token | Value | Confidence

Contains font families, weights, and variations. Followed by a type scale table: Role | Size | rem | Source

Notable letter-spacing tokens and a typography narrative paragraph.

#### Spacing

Table: Token | Value

Reports `spacing.base` and `spacing.scale`. Includes a narrative paragraph.

#### Border radius

Table: Token | Value | Use

Each radius value with its intended use case and a narrative.

#### Border width

Table: Token | Value

#### Shadow

Table: Token | Value | Use

Each shadow value with its use case.

#### Motion

Table: Token | Value | Label

Each transition value with its classification label (snappy/natural/luxurious).

#### Breakpoints

List of breakpoint values extracted from media queries.

### 5. Typography section (detailed)

A dedicated section with deeper analysis: typography hierarchy table (Role | Size | Weight | Letter-spacing | Line-height), and a narrative paragraph about the type system.

### 6. Spacing section (detailed)

Narrative about the spacing system, base unit, container max-width, and section padding values.

### 7. Components section

Per-component descriptions with optional HTML snippets. Components covered: nav, hero, button, card, footer, form. Each component has a prose description of its visual characteristics and an embedded code snippet showing the token usage.

### 8. Patterns section

The 15-signal pattern report table:

Table columns: # | Signal | Value | Confidence

All 15 signals are listed, even if some were not extracted (those show "(not extracted)" with LOW confidence). The 15 signals are:

1. Spacing rhythm / base unit
2. Type scale ratio
3. Component density
4. Alignment grid
5. Primary CTA placement
6. Border-radius language
7. Shadow elevation system
8. Motion language
9. Colour temperature + saturation
10. Typography pairing
11. Icon style consistency
12. Photography / illustration style
13. Hero structure template
14. Interaction affordance set
15. Voice-design alignment

### 9. Relationships section

Narrative about how the brand's design elements relate to each other (e.g., "the sharp radius language reinforces the authoritative navy-red colour system").

### 10. Voice section

Tone spectrum table (Dimension | Position), list of defining traits, CTA patterns, language variant, do/don't microcopy table, and forbidden words list.

### 11. Motion section

Motion label, median duration, and per-token transition listings with labels.

### 12. Assets section

Table: Asset | Status

Tracks: Logo (light), Logo (dark), Favicon, Icon system, plus any extra assets.

### 13. Brand Alignment section

Narrative about how well the extraction captures the brand's visual identity.

### 14. How To Use section

Tailwind config snippet, shadcn theme snippet, and the apply command for installing the brand into a project.

### 15. Validation section

Gate scores table, iteration count, and final score from the validation pipeline.

### 16. Provenance section

Table: File | Origin

Lists each extraction artefact and the command that produced it.

## Confidence badges

Every token table uses three confidence levels:

| Badge | Meaning |
|---|---|
| HIGH | Extracted from multiple consistent DOM samples with high sample count |
| MEDIUM | Extracted but with limited samples or some inconsistency |
| LOW | Inferred or extracted from a single sample; needs verification |

Badges appear in the `Confidence` column of every token table. They are also aggregated into the overall `confidence` field in the frontmatter.

### Badge derivation

- Colour tokens: HIGH if seen in 3+ computed styles with consistent values, MEDIUM if 1-2, LOW if only in custom properties
- Typography tokens: HIGH if font family appears in 5+ elements, MEDIUM if 2-4, LOW if 1
- Spacing tokens: HIGH if base unit residual < 20%, MEDIUM if < 40%, LOW otherwise
- Pattern signals: each signal computes its own confidence (see pattern-detection skill)

## Procedure

### Step 1: Gather all extraction artefacts

Collect from `~/.claude/design-library/cache/<slug>/`:
- `tokens-output.json` — extracted tokens
- `patterns.json` — pattern signals
- `voice-analysis.json` — voice analysis
- `report.json` — validation report
- `metadata.json` — brand metadata

### Step 2: Prepare the template context

Build a Python dictionary with these keys:

```python
context = {
    "brand": {
        "slug": "westpac",
        "name": "Westpac",
        "source_url": "https://www.westpac.com.au",
        "extracted_at": "2026-04-10",
        "extractor_version": "0.1.0",
        "language_variant": "en-AU",
        "category": ["banking", "finance"],
    },
    "scores": {"overall": 0.95, "tokens": 0.92, "replica": 0.96, "voice": 0.88, "patterns": 0.93},
    "confidence": "HIGH",
    "extraction_method": "automated",
    "at_a_glance": "Westpac is a major Australian bank...",
    "metadata": {
        "industry": "Banking",
        "source_title": "Westpac Banking",
        "theme_colour": "#DA1710",
        "has_dark_mode": False,
    },
    "tokens": tokens_data,
    "patterns": patterns_data,
    "voice": voice_data,
    "components": components_data,
    "validation": validation_data,
    "assets": assets_data,
    "tailwind_config": "...",
    "provenance": provenance_data,
}
```

### Step 3: Render the template

```python
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader("templates/"))
template = env.get_template("DESIGN.md.jinja")
output = template.render(**context)
```

### Step 4: Write to brand directory

```python
output_path = Path.home() / ".claude/design-library/brands/<slug>/DESIGN.md"
output_path.write_text(output)
```

### Step 5: Verify the output

Check that:
- All sections are present (no empty sections without "not available" fallbacks)
- Confidence badges are populated for every table row
- Token values match the source artefacts exactly
- No template syntax errors (unrendered `{{ }}` or `{% %}`)
- The frontmatter is valid YAML

### Step 6: Re-render when tokens change

If the extraction is re-run or tokens are manually corrected, re-run the template with the updated context. The documentarian agent handles this automatically.

## Evidence tables

### Colour swatches

Each colour row should include:
- The hex value in a code span for easy copy-paste
- A visual swatch is not possible in markdown, but the hex value serves as the reference
- Source indicates the DOM location: "computed style", "CSS custom property", "inline style"

Example:

| Token | Value | Hex | Confidence | Source |
|---|---|---|---|---|
| `colour.brand.primary` | rgb(218, 23, 16) | `#DA1710` | HIGH | 5 computed styles |
| `colour.brand.secondary` | rgb(31, 28, 79) | `#1F1C4F` | HIGH | 3 computed styles |
| `colour.text.body` | rgb(24, 27, 37) | `#181B25` | HIGH | 12 computed styles |
| `colour.text.muted` | rgb(87, 95, 101) | `#575F65` | HIGH | 8 computed styles |
| `colour.border` | rgb(222, 222, 225) | `#DEDEE1` | MEDIUM | 2 computed styles |

### Type scales

Report both px and rem values, with the role derived from size context:

| Role | Size | rem | Source |
|---|---|---|---|
| hero heading | 72px | 4.5rem | h1.hero |
| section heading | 28px | 1.75rem | h2 |
| card heading | 20px | 1.25rem | h3 |
| body large | 18px | 1.125rem | p.subtitle |
| body | 16px | 1rem | p |
| small | 14px | 0.875rem | span, li |
| caption | 12px | 0.75rem | footer text |

### Spacing values

| Token | Value |
|---|---|
| `spacing.base` | 8px |
| `spacing.scale` | 0, 4, 8, 12, 16, 24, 32, 48, 60, 90 |
| `spacing.container_max` | 1280px |
| `spacing.section_padding` | 48px |

## Template reference

The Jinja2 template at `templates/DESIGN.md.jinja` uses these patterns:
- `{% if tokens is defined and tokens.colours is defined %}` — defensive checks for missing sections
- `{% for c in tokens.colours.computed %}` — iteration over token arrays
- `{{ c.confidence | default('MEDIUM') }}` — default filters for optional fields
- `{{ tokens.spacing.scale | default([]) | join(', ') }}` — list joining for spacing scales
- `{% set signal_names = [...] %}` — defining signal name lists for the patterns table

See `references/template-structure.md` for the full section-by-section template guide.

## References

- `references/template-structure.md` — The DESIGN.md template section-by-section guide
- `references/evidence-inlining.md` — Where to place screenshots, scores, validation gates (planned)
- `references/cross-links.md` — Linking to tokens.json, SVG logo, design-system.html (planned)
