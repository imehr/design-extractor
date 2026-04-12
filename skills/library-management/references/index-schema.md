# Index Schema — Full Specification

Complete schema documentation for `index.json` and `metadata.json` files used by the design library.

---

## index.json

**Location:** `~/.claude/design-library/index.json`

**Purpose:** Master registry of all extracted brands. This is the single source of truth for what the library contains. Never scan the filesystem to discover brands — always read this file.

### Full schema

```json
{
  "version": "0.1.0",
  "updated_at": "2026-04-10T12:30:00Z",
  "brands": [
    {
      "slug": "westpac",
      "name": "Westpac",
      "source_url": "https://www.westpac.com.au",
      "extracted_at": "2026-04-10",
      "extractor_version": "0.1.0",
      "overall_score": 0.95,
      "confidence": "HIGH",
      "categories": ["banking", "finance"],
      "synthetic": false,
      "path": "/Users/mehran/.claude/design-library/brands/westpac"
    },
    {
      "slug": "woolworths-com-au",
      "name": "Woolworths",
      "source_url": "https://www.woolworths.com.au",
      "extracted_at": "2026-04-09",
      "extractor_version": "0.1.0",
      "overall_score": 0.88,
      "confidence": "HIGH",
      "categories": ["retail", "grocery"],
      "synthetic": false,
      "path": "/Users/mehran/.claude/design-library/brands/woolworths-com-au"
    },
    {
      "slug": "woolworths-group",
      "name": "Woolworths Group",
      "source_url": "https://www.woolworthsgroup.com.au",
      "extracted_at": "2026-04-11",
      "extractor_version": "0.1.0",
      "overall_score": 0.82,
      "confidence": "MEDIUM",
      "categories": ["corporate", "retail"],
      "synthetic": false,
      "path": "/Users/mehran/.claude/design-library/brands/woolworths-group"
    },
    {
      "slug": "nimbus",
      "name": "Nimbus",
      "source_url": "https://nimbus.example.com",
      "extracted_at": "2026-04-10",
      "extractor_version": "0.1.0",
      "overall_score": 0.95,
      "confidence": "HIGH",
      "categories": ["dev-tools", "infrastructure"],
      "synthetic": true,
      "path": "/Users/mehran/.claude/design-library/brands/nimbus"
    }
  ]
}
```

### Field reference

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `version` | string | yes | `"0.1.0"` | Schema version for forward compatibility |
| `updated_at` | string | yes | current UTC ISO | Timestamp of last modification |
| `brands` | array | yes | `[]` | Ordered list of brand records |
| `brands[].slug` | string | yes | — | URL-safe identifier, unique within index |
| `brands[].name` | string | yes | slug value | Human-readable brand name |
| `brands[].source_url` | string | yes | `""` | Original URL the design was extracted from |
| `brands[].extracted_at` | string | yes | `""` | ISO date string of when extraction was performed |
| `brands[].extractor_version` | string | yes | `""` | Version of design-extractor that produced this |
| `brands[].overall_score` | float or null | yes | `null` | Aggregate quality score from validation (0.0-1.0) |
| `brands[].confidence` | string | yes | `"UNKNOWN"` | HIGH / MEDIUM / LOW / UNKNOWN |
| `brands[].categories` | string[] | yes | `[]` | Industry or style category tags |
| `brands[].synthetic` | boolean | yes | `false` | True for generated design systems, not real websites |
| `brands[].path` | string | yes | auto-derived | Absolute filesystem path to brand directory |

### Ordering

Brands are sorted alphabetically by `slug` using standard string comparison. The `update_library_index.py` script maintains this ordering on every write.

### Upsert behaviour

When `--add` is called with a slug that already exists in the index, the existing entry is removed and the new entry is appended before sorting. This means:
- All fields are replaced (no partial merge)
- The `updated_at` timestamp is refreshed
- The brand directory path is recalculated

---

## metadata.json

**Location:** `~/.claude/design-library/brands/<slug>/metadata.json`

**Purpose:** Per-brand metadata file produced by the extraction pipeline. This is the source file that `update_library_index.py` reads when registering a brand.

### Full schema

```json
{
  "name": "Westpac",
  "slug": "westpac",
  "source_url": "https://www.westpac.com.au",
  "extracted_at": "2026-04-10",
  "extractor_version": "0.1.0",
  "extraction_method": "automated",
  "language_variant": "en-AU",
  "overall_score": 0.95,
  "confidence": "HIGH",
  "scores": {
    "tokens": 0.92,
    "replica": 0.96,
    "voice": 0.88,
    "patterns": 0.93,
    "overall": 0.95
  },
  "categories": ["banking", "finance"],
  "category": ["banking", "finance"],
  "synthetic": false,
  "has_dark_mode": false,
  "theme_colour": "#DA1710"
}
```

### Field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Human-readable brand name |
| `slug` | string | no | Brand slug (can be derived from name) |
| `source_url` | string | yes | URL the design was extracted from |
| `extracted_at` | string | yes | ISO date of extraction |
| `extractor_version` | string | yes | design-extractor version |
| `extraction_method` | string | no | "automated" or "manual" |
| `language_variant` | string | no | Language code (e.g., "en-AU", "en-US") |
| `overall_score` | float or null | no | Aggregate score (can also be in `scores.overall`) |
| `confidence` | string | no | HIGH / MEDIUM / LOW / UNKNOWN |
| `scores` | object | no | Per-dimension scores from validation |
| `scores.tokens` | float | no | Token extraction quality |
| `scores.replica` | float | no | Visual replica accuracy |
| `scores.voice` | float | no | Voice analysis coverage |
| `scores.patterns` | float | no | Pattern detection quality |
| `scores.overall` | float | no | Weighted aggregate |
| `categories` | string[] | no | Category tags (preferred field name) |
| `category` | string[] | no | Alternative field name for categories (legacy) |
| `synthetic` | boolean | no | Whether this is a generated design system |
| `has_dark_mode` | boolean | no | Whether the source site has dark mode |
| `theme_colour` | string | no | Brand's primary theme colour |

### Score derivation

The `overall_score` in the index record is read from:
1. `metadata.overall_score` (top-level field)
2. Fallback: `metadata.scores.overall` (nested in scores object)
3. Fallback: `null` (no score available)

---

## Brand directory contents

A fully extracted brand directory contains these files:

```
~/.claude/design-library/brands/<slug>/
  metadata.json              # Brand metadata (required for registration)
  DESIGN.md                  # Rendered brand document
  design-tokens.css          # CSS custom properties
  design-tokens.json         # Raw token data
  tokens-output.json         # Full extraction output (pre-pattern)
  patterns.json              # Pattern signal output
  patterns-llm.json          # Human-readable pattern summary
  voice-analysis.json        # Voice analysis output
  report.json                # Validation report
  screenshot-desktop.png     # Desktop screenshot (1440px wide)
  screenshot-mobile.png      # Mobile screenshot (optional)
  assets/
    logo.svg                 # Brand logo (light variant)
    logo-dark.svg            # Brand logo (dark variant, optional)
    favicon.ico              # Favicon (optional)
```

### Minimum files for registration

Only `metadata.json` is required to register a brand. The other files are optional and their absence does not prevent registration.

### Minimum files for apply

The `apply_design.py` script looks for at least one of: `design-tokens.css`, `DESIGN.md`, `design-tokens.json`. If none exist, the apply fails.

---

## Schema version history

| Version | Date | Changes |
|---|---|---|
| 0.1.0 | 2026-04-10 | Initial schema with basic brand records |
