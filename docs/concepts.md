# Concepts

How design-extractor works: what it extracts, how it validates, and why it is built the way it is.

## What a design system is

A design system is the set of rules — explicit and implicit — that determine how a brand's digital interface looks and behaves. design-extractor captures five categories of information:

1. **Tokens** — discrete values: colours, font families, font sizes, weights, spacing, border radii, shadows, motion durations and easings, breakpoints.
2. **Patterns** — structural relationships between tokens: spacing rhythm, type scale ratio, component density, alignment grid, CTA placement, radius language, shadow elevation system, motion language, colour temperature.
3. **Relationships** — how tokens compose into components: which radius goes on which surface, which colour is used for text vs. accents, which motion duration is used for hover vs. page transitions.
4. **Voice** — tone dimensions (formal/casual, technical/accessible, authoritative/friendly, urgent/calm), CTA patterns, microcopy conventions, language variant.
5. **Motion** — timing, easing, and choreography rules that govern transitions and animations.

These five categories are documented in a single `DESIGN.md` file per brand. See [design-md-spec.md](./design-md-spec.md) for the full schema.

## Why extraction is hard

Web design systems are not published in a standard machine-readable format. Extracting one from a live URL requires solving several problems:

- **Single-page applications** render content dynamically. CSS custom properties may be declared but the DOM is skeletal until JavaScript hydrates it. LinkedIn is the canonical example: 822 custom-property colours but only 10 computed colours until the SPA finishes loading.
- **Lazy rendering** means content below the fold does not exist in the DOM until the user scrolls. The extractor must programmatically scroll to force hydration.
- **Bot detection** (Cloudflare challenges, CAPTCHAs, fingerprinting) blocks headless browsers. The extractor uses stealth mode and falls back to Firefox.
- **Variable fonts** use non-standard axis values (Linear uses weights 510 and 590 instead of the standard 500/600). The extractor must capture these precisely rather than rounding.
- **Container queries** replace `@media` breakpoints on modern sites. Sites like Stripe and Tailwind report zero breakpoints from CSS parsing because their responsiveness lives in `@container` rules and JavaScript layout logic.
- **Cookie banners and GDPR overlays** block content capture. The extractor uses agent-browser to dismiss them.

## The 3-phase pipeline

Extraction proceeds in three phases, orchestrated by the `commands/extract-design.md` slash command:

### Phase A: Extract

Sequential and parallel agent dispatches collect raw data.

```
1. recon-agent         (sequential — gates everything else)
2. token-extractor  |
   asset-extractor  |  (parallel fan-out)
   voice-analyst    |
3. pattern-analyst     (sequential — needs tokens)
4. replica-builder     (sequential — needs all Phase A data)
```

Each agent writes structured JSON to `~/.claude/design-library/cache/<slug>/`. Agents communicate exclusively via the filesystem — no inter-agent messaging.

### Phase B: Refine

A producer-reviewer loop improves the HTML replica until it visually matches the original.

```
while overall_score < 0.85 AND iteration <= 5:
    pixel_compare.py     -> raw pixel diffs
    score_replica.py     -> weighted score + blocking failures
    visual-critic        -> LLM critique of differences
    refinement-agent     -> patches replica HTML + tokens
    re-screenshot        -> capture new iteration
    if plateau detected (delta < 0.01): break
```

The visual-critic uses an opus-class model for high-stakes critique. The refinement-agent uses sonnet for generation.

### Phase C: Publish

Three sequential agents produce the final artifacts:

```
documentarian    -> DESIGN.md
skill-packager   -> per-brand SKILL.md
librarian        -> library index registration
```

## The 5-gate validation model

Every extraction is validated against five gates. Each gate produces a pass/fail verdict with an optional confidence level.

### Gate R: Recon

**Question:** Did the page load and did we capture usable screenshots?

- Pass: Playwright navigated the URL, captured at least one desktop screenshot, and the screenshot is not blank or dominated by a single-colour overlay.
- Fail: Navigation timeout, HTTP error, or bot challenge that could not be bypassed.
- Degradation: If `networkidle` times out, the agent retries with `domcontentloaded` + fixed wait. If that also fails, `gate_R=fail` is recorded and downstream confidence drops to LOW.

### Gate T: Tokens

**Question:** Did we extract a meaningful set of design tokens?

- Pass: Non-empty colours (from either custom properties or computed styles), at least one font family, at least 3 font sizes, non-zero spacing values.
- Fail: All token categories are empty (implies the page returned no CSS at all).
- Confidence: HIGH if both custom-property and computed-style sources produce data. MEDIUM if only one source contributes. LOW if fewer than 15 computed colour entries (under-hydrated SPA pattern).

### Gate A: Assets

**Question:** Did we download logos, favicons, and icons?

- Pass: At least a favicon was captured.
- Fail: No assets found. This is a soft gate — it does not block publication.

### Gate S: Synthesis (Replica)

**Question:** Does the replica visually match the reference at the scoring threshold?

- Pass: `overall_score >= 0.85` with no blocking failures.
- Fail: Score below threshold after 5 iterations or plateau.
- The score is computed by `scripts/score_replica.py` using weighted pixel comparison across viewport sizes, structural overlay analysis, and token traceability checks.

### Gate V: Voice

**Question:** Does the tone analysis align with the visual identity?

- Pass: Voice dimensions are non-empty and the voice-design alignment signal (pattern #15) is rated MEDIUM or higher.
- Fail: No copy was extractable (e.g., the page is entirely image-based). Soft gate.

## Confidence scoring

Every token, pattern signal, and gate verdict carries a confidence level:

| Level | Meaning |
|---|---|
| HIGH | Mechanically verified or supported by abundant data (e.g., spacing base unit confirmed by GCD on 50+ values). |
| MEDIUM | Plausible but based on limited data, a single source, or LLM interpretation without mechanical confirmation. |
| LOW | Best-effort guess based on degraded input. The data may be incomplete or the extraction encountered a known failure mode. |
| SKIPPED | The signal could not be computed because a required input was missing (e.g., no screenshot for density analysis). |

Confidence is determined per-signal, not globally. A single extraction can have HIGH-confidence tokens but LOW-confidence patterns if, for example, screenshots were partially captured.

## The iteration loop

The refinement loop runs a maximum of 5 iterations. On each iteration:

1. `scripts/pixel_compare.py` computes raw pixel difference maps between reference and replica screenshots.
2. `scripts/score_replica.py` produces a weighted `overall_score` (0.0 to 1.0) and a list of `blocking_failures`.
3. `agents/visual-critic.md` (opus model) generates a structured critique identifying what differs.
4. `agents/refinement-agent.md` (sonnet model) patches the replica HTML and tokens based on the critique.
5. The patched replica is re-screenshotted for the next iteration.

**Convergence:** the loop exits when `overall_score >= 0.85` and `blocking_failures` is empty.

**Plateau detection:** if the score improves by less than 0.01 between consecutive iterations, the loop exits early. This prevents wasting compute on diminishing returns.

**Typical behaviour:** most sites converge in 2-3 iterations. Complex sites (Airbnb-class) may exhaust all 5 iterations and still land below threshold — in that case the output is published with a LOW confidence flag and the user is advised to inspect manually.

## The 11-agent architecture

design-extractor uses 11 native Claude Code subagents. Each is a `.md` file under `agents/` with YAML frontmatter declaring its allowed tools and model tier.

| Agent | Phase | Model | Purpose |
|---|---|---|---|
| `recon-agent` | A | sonnet | Browse URL, capture screenshots, classify page type |
| `token-extractor` | A | sonnet | Run `scripts/extract_tokens.py`, parse CSS custom properties + computed styles |
| `asset-extractor` | A | sonnet | Download logos, favicons, icon sprites as SVGs |
| `voice-analyst` | A | sonnet | Scrape page copy, analyse tone dimensions and CTA patterns |
| `pattern-analyst` | A | sonnet | Compute 9 mechanical + 6 LLM-interpreted pattern signals |
| `replica-builder` | A | sonnet | Generate shadcn/Tailwind HTML replica from collected data |
| `visual-critic` | B | opus | Vision-based critique of replica vs. reference screenshots |
| `refinement-agent` | B | sonnet | Patch replica HTML + tokens based on critique |
| `documentarian` | C | sonnet | Render DESIGN.md from collected data |
| `skill-packager` | C | sonnet | Render per-brand SKILL.md with negative triggers |
| `librarian` | C | haiku | Update library index, copy brand to final location |

Model tiering: opus for the visual-critic (high-stakes vision task), sonnet for analysis and generation (most agents), haiku for rote indexing (librarian). No runtime framework — agents are dispatched by the `commands/extract-design.md` slash command using Claude Code's native `Agent` tool.

Agents communicate exclusively via the shared filesystem at `~/.claude/design-library/cache/<slug>/`. There is no inter-agent messaging protocol.

## Filesystem layout

All extraction data lives under `~/.claude/design-library/`. The directory structure:

```
~/.claude/design-library/
  index.json                          # Master index of all brands
  brands/
    <slug>/
      DESIGN.md                       # Full design system documentation
      design-tokens.json              # W3C DTCG 2025.10 format
      design-tokens.css               # CSS custom properties
      metadata.json                   # Library index entry
      skill/
        SKILL.md                      # Per-brand skill
        references/                   # Progressive disclosure files
      replica/
        index.html                    # Self-contained Tailwind replica
      assets/                         # Logos, favicons, icons (SVG)
      screenshots/
        reference/                    # Original site captures
        iterations/                   # Per-iteration replica captures
      validation/
        iterations.jsonl              # Per-iteration score trail
  cache/
    <slug>/                           # Working directory during extraction
      recon-output.json
      tokens-output.json
      patterns.json
      patterns-llm.json
      pixel_scores.json
      iteration_scores.json
      llm_critique.json
      patches/
```

The `cache/` directory is the working area during extraction. After Phase C completes, the `librarian` agent copies final artifacts from cache to `brands/<slug>/`. The cache is retained for debugging and re-extraction.

## What to read next

- [design-md-spec.md](./design-md-spec.md) — the DESIGN.md output schema
- [patterns-and-relationships.md](./patterns-and-relationships.md) — the 15 pattern signals in detail
- [per-brand-skill-spec.md](./per-brand-skill-spec.md) — the installable SKILL.md format
- [troubleshooting.md](./troubleshooting.md) — failure modes and degradation rules
