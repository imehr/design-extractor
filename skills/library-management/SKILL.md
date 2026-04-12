---
name: library-management
description: "Manage the local design library at ~/.claude/design-library — register extracted brands, update index.json, list installed designs, apply a stored brand to a target project via apply_design.py. Trigger on 'register this brand'; 'list installed designs'; 'apply Linear style to my project'; 'show me what is in the design library'; 'install the extracted brand into this repo'; 'update the design index'; 'which brands are in my library'; 'apply the Stripe extraction to my Next.js app'; 'register the extraction in the library'; 'pull a design from the library'. Do NOT trigger for: 'package manager', 'library science', npm/pip/uv library questions, book libraries, general dependency management, or 'library' in the sense of a code library unrelated to extracted design systems."
---

# Library Management

## When this skill is active

- Phase C librarian subagent is updating `~/.claude/design-library/index.json` at the end of an extraction
- User wants to list, search, or inspect brands already stored in the local library
- A stored brand must be applied to a target project (`apply_design.py`) — tokens copied, tailwind config merged, variables wired
- Re-indexing after manual edits to cached extractions
- Cleanup: removing stale or superseded brand entries

## Core principles

- The index is the single source of truth for what the library contains — never scan the filesystem at query time
- Every entry has a slug, source URL, extraction date, confidence summary, and pointer to its DESIGN.md
- Applying a brand to a project is a merge, not an overwrite — existing tailwind config is preserved where it doesn't conflict
- Destructive operations (delete, overwrite) always preview a diff and require confirmation
- The library is local-first: no network calls on list/apply, only on fresh extract

## Out of scope

- npm, pip, uv, or any code-library dependency management
- Book libraries, library science, or other senses of the word "library"
- Running the extraction itself (that is the design-extraction skill's job)
- Rendering the DESIGN.md (that is the design-md-writer skill's job)

## How it works

The design library lives at `~/.claude/design-library/`. It is a local-only registry of extracted brand design systems. Two Python scripts manage it:

- `scripts/update_library_index.py` — maintains the master index and brand registration
- `scripts/apply_design.py` — installs brand artefacts into a target project directory

## Directory structure

```
~/.claude/design-library/
  index.json                          # Master registry of all brands
  brands/
    <slug>/
      metadata.json                   # Brand metadata (name, source_url, scores, categories)
      DESIGN.md                       # Rendered brand document
      design-tokens.css               # CSS custom properties
      design-tokens.json              # Raw token data
      screenshot-desktop.png          # Desktop screenshot
      patterns.json                   # Pattern signal output
      voice-analysis.json             # Voice analysis output
      assets/                         # SVG logos, favicons, icons
```

## Index schema

The `index.json` file at `~/.claude/design-library/index.json` has this structure:

```json
{
  "version": "0.1.0",
  "updated_at": "2026-04-10T00:00:00Z",
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
    }
  ]
}
```

Each brand record contains:

| Field | Type | Description |
|---|---|---|
| slug | string | URL-safe identifier, derived from brand name or domain |
| name | string | Human-readable brand name |
| source_url | string | Original URL the design was extracted from |
| extracted_at | string | ISO date of extraction |
| extractor_version | string | Version of design-extractor that produced this extraction |
| overall_score | float or null | Aggregate quality score (0.0-1.0) from validation pipeline |
| confidence | string | HIGH / MEDIUM / LOW / UNKNOWN |
| categories | string[] | Industry or style category tags |
| synthetic | boolean | True for generated/synthetic design systems (e.g., Nimbus) |
| path | string | Absolute path to the brand directory on disk |

## Procedure: List brands

### Step 1: Run the list command

```bash
python scripts/update_library_index.py --list
```

### Step 2: Read the output

The script prints one line per brand:

```
westpac              https://www.westpac.com.au           score=0.95 HIGH
woolworths-com-au    https://www.woolworths.com.au        score=0.88 HIGH
nimbus               https://nimbus.example.com           score=0.95 HIGH
```

### Step 3: If the library is empty

The script prints `(library is empty)`. Run an extraction first using the design-extraction skill.

## Procedure: Add (register) a brand

### Step 1: Ensure metadata.json exists

The brand directory at `~/.claude/design-library/brands/<slug>/` must contain a `metadata.json` file. This file is produced by the extraction pipeline and contains:

```json
{
  "name": "Westpac",
  "source_url": "https://www.westpac.com.au",
  "extracted_at": "2026-04-10",
  "extractor_version": "0.1.0",
  "overall_score": 0.95,
  "confidence": "HIGH",
  "categories": ["banking", "finance"],
  "synthetic": false
}
```

### Step 2: Run the add command

```bash
python scripts/update_library_index.py \
  --add westpac \
  --metadata ~/.claude/design-library/brands/westpac/metadata.json
```

### Step 3: Verify registration

The script prints:

```
registered westpac in /Users/mehran/.claude/design-library/index.json
```

If the brand slug already exists in the index, the old entry is replaced (upsert behaviour). Brands are sorted alphabetically by slug in the index.

### Step 4: Confirm with list

```bash
python scripts/update_library_index.py --list
```

Verify the new brand appears with correct score and confidence.

## Procedure: Remove a brand

### Step 1: Run the remove command

```bash
python scripts/update_library_index.py --remove westpac
```

### Step 2: Verify removal

The script prints:

```
removed westpac from /Users/mehran/.claude/design-library/index.json
```

If the slug was not in the index, the script prints a warning and exits with success:

```
warning: westpac was not in the index
```

### Important note

The remove command only removes the brand from the index. It does NOT delete the brand directory at `~/.claude/design-library/brands/<slug>/`. To fully clean up, manually remove the directory:

```bash
rm -rf ~/.claude/design-library/brands/westpac
```

## Procedure: Apply a brand to a project

### Step 1: Identify the brand slug

List available brands to find the correct slug:

```bash
python scripts/update_library_index.py --list
```

### Step 2: Run the apply command

```bash
python scripts/apply_design.py \
  --brand westpac \
  --target-dir /path/to/my/project
```

### Step 3: Review installed files

The script copies the following files from the brand directory to the target project root:

| Source file | Destination |
|---|---|
| `design-tokens.css` | `<target-dir>/design-tokens.css` |
| `DESIGN.md` | `<target-dir>/DESIGN.md` |
| `design-tokens.json` | `<target-dir>/design-tokens.json` |

The script prints:

```
Installed westpac into /path/to/my/project:
  design-tokens.css
  DESIGN.md
  design-tokens.json
```

### Step 4: Verify the install

Check that the files exist in the target directory and contain the expected brand data:

```bash
ls /path/to/my/project/design-tokens.css
ls /path/to/my/project/DESIGN.md
ls /path/to/my/project/design-tokens.json
```

### Step 5: Wire into the project

After applying, the project needs to:
1. Import `design-tokens.css` in the main CSS entry point
2. Reference the tokens in `tailwind.config.ts` using the values from `design-tokens.json`
3. Use the DESIGN.md as a reference when building components

## Error handling

| Error | Cause | Resolution |
|---|---|---|
| `Brand not found: <path>` | Brand slug does not exist in library | Run `--list` to check available brands |
| `No installable artifacts found` | Brand directory has none of the expected files | Re-run extraction for this brand |
| `error: metadata file not found` | `--metadata` path does not exist | Check the path, ensure extraction completed |
| `--add requires --metadata` | `--add` was passed without `--metadata` | Provide the metadata.json path |

## Slug conventions

Brand slugs are derived from the source domain or brand name:
- Domain-based: `westpac`, `woolworths-com-au`, `woolworths-group`
- Name-based (synthetic): `nimbus`, `linear`
- Lowercase, hyphens for spaces/dots, no special characters

## References

- `references/index-schema.md` — Full index.json and metadata.json schemas with examples
- `references/apply-design.md` — apply_design.py merge strategy and conflict handling (planned)
- `references/cleanup.md` — Stale entry detection and safe removal (planned)
