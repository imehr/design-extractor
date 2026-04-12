# Template Structure — DESIGN.md.jinja Section-by-Section Guide

Detailed breakdown of `templates/DESIGN.md.jinja`, explaining each section, required context variables, and rendering behaviour.

---

## Template location

`/Users/mehran/Documents/github/design-extractor/templates/DESIGN.md.jinja`

---

## Section 1: YAML frontmatter (lines 1-23)

### Template code

```jinja2
---
name: brand-{{ brand.slug | default('unknown') }}
description: >-
  Apply {{ brand.name | default('Brand') }}'s design system.
  ...
version: 1.0.0
source_url: {{ brand.source_url | default('N/A') }}
extracted_at: {{ brand.extracted_at | default('N/A') }}
scores:
  overall: {{ scores.overall | default(0.0) }}
  tokens: {{ scores.tokens | default(0.0) }}
  replica: {{ scores.replica | default(0.0) }}
  voice: {{ scores.voice | default(0.0) }}
  patterns: {{ scores.patterns | default(0.0) }}
confidence: {{ confidence | default('UNKNOWN') }}
---
```

### Required context variables

| Variable | Type | Used for |
|---|---|---|
| `brand.slug` | string | Skill name identifier |
| `brand.name` | string | Trigger description |
| `brand.source_url` | string | Source URL metadata |
| `brand.extracted_at` | string | Extraction timestamp |
| `brand.extractor_version` | string | Version tracking |
| `scores.overall` | float | Overall quality score |
| `scores.tokens` | float | Token extraction score |
| `scores.replica` | float | Replica accuracy score |
| `scores.voice` | float | Voice analysis score |
| `scores.patterns` | float | Pattern detection score |
| `confidence` | string | Aggregate confidence badge |

### Rendering notes

- All values use `| default()` filters so the template renders even with missing data
- The `description` field contains trigger phrases that make the rendered DESIGN.md work as a skill
- Category tags are rendered as a YAML list if `brand.category` is defined

---

## Section 2: Brand heading + At a Glance (lines 25-31)

### Template code

```jinja2
# {{ brand.name | default('Brand') }}

> Auto-generated DESIGN.md for {{ brand.name | default('Brand') }} ({{ brand.source_url | default('N/A') }}).

## At a Glance

{{ at_a_glance | default('No summary available. Re-run the documentarian agent to generate an at-a-glance paragraph.') }}
```

### Required context variables

| Variable | Type | Used for |
|---|---|---|
| `brand.name` | string | H1 heading |
| `brand.source_url` | string | Blockquote attribution |
| `at_a_glance` | string | 2-3 sentence brand personality summary |

### Rendering notes

- The `at_a_glance` paragraph should be written by the documentarian agent, not extracted mechanically
- If missing, a fallback message directs the user to re-run the agent

---

## Section 3: Metadata table (lines 33-46)

### Template code

```jinja2
## Metadata

| Field | Value |
|---|---|
| Industry | {{ metadata.industry | default('N/A') }} |
| Category tags | {{ brand.category | default([]) | join(', ') }} |
| Source URL | {{ brand.source_url | default('N/A') }} |
| Extracted at | {{ brand.extracted_at | default('N/A') }} |
| Source title | {{ metadata.source_title | default('N/A') }} |
| Theme colour (meta) | {{ metadata.theme_colour | default('N/A') }} |
| Has dark mode | {{ metadata.has_dark_mode | default('Unknown') }} |
| Language variant | {{ brand.language_variant | default('en-US') }} |
```

### Required context variables

| Variable | Type | Used for |
|---|---|---|
| `metadata.industry` | string | Industry classification |
| `metadata.source_title` | string | Page title from extraction |
| `metadata.theme_colour` | string | Theme colour from meta tags |
| `metadata.has_dark_mode` | boolean or string | Dark mode detection result |
| `brand.language_variant` | string | Language code |
| `metadata.extra` | dict | Additional key-value pairs |

### Rendering notes

- The `metadata.extra` dict is iterated to append additional rows to the table
- Category tags are joined with `, ` for display

---

## Section 4: Tokens - Colours (lines 47-62)

### Template code structure

```jinja2
### Colours

| Token | Value | Hex | Confidence | Source |
{% for c in tokens.colours.computed %}
| `{{ c.token }}` | {{ c.value }} | `{{ c.hex }}` | {{ c.confidence }} | {{ c.source }} |
{% endfor %}

**Brand impression:** {{ tokens.colours.brand_impression }}

#### Custom Properties
{% for prop, value in tokens.colours.custom_properties.items() %}
- `{{ prop }}`: `{{ value }}`
{% endfor %}
```

### Required context variables

| Variable | Type | Used for |
|---|---|---|
| `tokens.colours.computed` | array of dicts | Colour token rows |
| `tokens.colours.computed[].token` | string | Token name |
| `tokens.colours.computed[].value` | string | CSS value (rgb, hsl, etc.) |
| `tokens.colours.computed[].hex` | string | Hex representation |
| `tokens.colours.computed[].confidence` | string | HIGH / MEDIUM / LOW |
| `tokens.colours.computed[].source` | string | Where the colour was found |
| `tokens.colours.brand_impression` | string | Prose description of colour palette |
| `tokens.colours.custom_properties` | dict | CSS custom properties map |

### Rendering notes

- Colours are rendered as a markdown table with 5 columns
- Brand impression is a prose paragraph below the table
- Custom properties are listed as bullet points in a subsection

---

## Section 5: Tokens - Typography (lines 64-87)

### Sub-tables rendered

1. **Families, weights, variations** — Token | Value | Confidence
2. **Type scale (px)** — Role | Size | rem | Source
3. **Notable letter-spacing** — bullet list
4. **Typography narrative** — prose paragraph

### Required context variables

| Variable | Type | Used for |
|---|---|---|
| `tokens.typography.families` | array | Font family tokens |
| `tokens.typography.weights` | array | Font weight tokens |
| `tokens.typography.variations` | array | Font variation tokens |
| `tokens.typography.scale` | array | Type scale entries |
| `tokens.typography.scale[].role` | string | Role label (hero, h2, body, etc.) |
| `tokens.typography.scale[].size` | string | Size in px |
| `tokens.typography.scale[].rem` | string | Size in rem |
| `tokens.typography.scale[].source` | string | DOM source |
| `tokens.typography.letter_spacing` | array | Notable letter-spacing values |
| `tokens.typography.narrative` | string | Typography system prose |

---

## Section 6: Tokens - Spacing (lines 89-99)

### Template code

```jinja2
### Spacing

| Token | Value |
|---|---|
| `spacing.base` | {{ tokens.spacing.base | default('N/A') }} |
| `spacing.scale` | {{ tokens.spacing.scale | default([]) | join(', ') }} |

{{ tokens.spacing.narrative }}
```

### Required context variables

| Variable | Type | Used for |
|---|---|---|
| `tokens.spacing.base` | string | Base unit (e.g., "8px") |
| `tokens.spacing.scale` | string[] | Scale values list |
| `tokens.spacing.narrative` | string | Spacing system prose |
| `tokens.spacing.container_max` | string | Max container width |
| `tokens.spacing.section_padding` | string | Section padding value |

---

## Section 7: Tokens - Border radius, width, shadow, motion, breakpoints (lines 101-143)

Each subsection follows the same pattern: a markdown table with token rows, followed by an optional narrative paragraph.

### Border radius

Table: Token | Value | Use
Requires: `tokens.borders.radius`, `tokens.borders.radius_narrative`

### Border width

Table: Token | Value
Requires: `tokens.borders.width`, `tokens.borders.width_narrative`

### Shadow

Table: Token | Value | Use
Requires: `tokens.shadows`, `shadow_narrative`

### Motion

Table: Token | Value | Label
Requires: `tokens.transitions`, `motion_narrative`

### Breakpoints

Inline list of breakpoint values.
Requires: `tokens.breakpoints`

---

## Section 8: Typography (detailed) (lines 145-155)

Narrative paragraph plus optional hierarchy table.

Table: Role | Size | Weight | Letter-spacing | Line-height

Requires: `typography_narrative`, `typography_hierarchy`

---

## Section 9: Spacing (detailed) (lines 157-162)

Narrative about the spacing system, container max-width, section padding.

Requires: `spacing_narrative`, `tokens.spacing.container_max`, `tokens.spacing.section_padding`

---

## Section 10: Components (lines 164-181)

Iterates over component keys: nav, hero, button, card, footer, form.

Each component renders:
1. H3 heading with component name
2. Description paragraph
3. Optional HTML snippet in a code block

```jinja2
{% for comp_key in ['nav', 'hero', 'button', 'card', 'footer', 'form'] %}
{% if components[comp_key] is defined %}
### {{ comp_key }}

{{ components[comp_key].description }}

{% if components[comp_key].html_snippet %}
```html
{{ components[comp_key].html_snippet }}
```
{% endif %}
{% endif %}
{% endfor %}
```

Requires: `components`, `components[<key>].description`, `components[<key>].html_snippet`

---

## Section 11: Patterns (lines 183-224)

The 15-signal pattern report table.

```jinja2
{% set signal_names = [
  'spacing_rhythm', 'type_scale_ratio', 'component_density',
  'alignment_grid', 'primary_cta_placement', 'border_radius_language',
  'shadow_elevation_system', 'motion_language', 'colour_temperature',
  'typography_pairing', 'icon_style', 'photography_style',
  'hero_structure', 'interaction_affordance', 'voice_design_alignment'
] %}
```

Each signal row: `| # | Signal label | value | confidence |`

If a signal is not in the patterns dict, it renders as "(not extracted)" with LOW confidence.

Requires: `patterns`, `patterns[<signal_name>].value`, `patterns[<signal_name>].confidence`

---

## Section 12: Relationships (lines 226-228)

Narrative paragraph about how design elements relate to each other.

Requires: `relationships_narrative`

---

## Section 13: Voice (lines 230-262)

Subsections rendered:
1. Tone spectrum table: Dimension | Position
2. Defining traits list
3. CTA patterns list
4. Language variant
5. Do/don't microcopy table
6. Forbidden words list

Requires: `voice.tone_spectrum`, `voice.traits`, `voice.cta_patterns`, `voice.language_variant`, `voice.do_dont`, `voice.forbidden_words`

---

## Section 14: Motion (lines 264-276)

Label, median duration, per-token transition listing, and example transitions.

Requires: `motion_label`, `motion_median_duration`, `tokens.transitions`, `motion_examples`

---

## Section 15: Assets (lines 278-288)

Table: Asset | Status

Tracks: Logo (light), Logo (dark), Favicon, Icon system, plus extras.

Requires: `assets.logo`, `assets.logo_dark`, `assets.favicon`, `assets.icons`, `assets.extra`

---

## Section 16: Brand Alignment (lines 290-292)

Narrative about extraction quality vs. brand identity.

Requires: `brand_alignment_narrative`

---

## Section 17: How To Use (lines 294-317)

Three subsections:
1. Tailwind config snippet (code block)
2. shadcn theme snippet (code block, optional)
3. Apply command: `/design-extractor:apply-design <slug>`

Requires: `tailwind_config`, `shadcn_theme`, `brand.slug`

---

## Section 18: Validation (lines 319-329)

Gate scores table, iteration count, final score.

Requires: `validation.gates`, `validation.iteration_count`, `validation.final_score`, `scores.overall`

---

## Section 19: Provenance (lines 331-341)

Table: File | Origin

Lists extraction artefacts and their producing commands.

Requires: `provenance` (or falls back to hardcoded defaults based on `brand.source_url`)

---

## Template rendering checklist

Before shipping a rendered DESIGN.md, verify:

- [ ] All 19 sections are present (even if some contain fallback text)
- [ ] YAML frontmatter is valid (no unescaped special characters in strings)
- [ ] Every table row has the correct number of pipe-separated columns
- [ ] Confidence badges are HIGH/MEDIUM/LOW (not empty or misspelled)
- [ ] Hex colour values are in `#RRGGBB` format
- [ ] Token values match the source `tokens-output.json` exactly
- [ ] Pattern signal names match the template's `signal_names` array
- [ ] Code blocks are properly fenced with triple backticks
- [ ] No unrendered Jinja2 syntax (`{{ }}` or `{% %}`)
- [ ] The `brand.slug` in the apply command matches the actual slug
