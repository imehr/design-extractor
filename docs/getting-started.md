# Getting Started

Install design-extractor, run your first extraction, and browse the results.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | Required for extraction scripts |
| Node.js | 20+ | Required for the library browser UI |
| pnpm | latest | Node package manager for the UI |
| Playwright | via pip | Chromium automation for screenshots |
| pixelmatch | via pip | Pixel-level comparison for replica scoring |
| Pillow | via pip | Image analysis for pattern signals |
| numpy | via pip | Used by alignment grid and density computations |

Claude Code must be installed and configured. design-extractor runs as a Claude Code plugin — it dispatches native subagents and Python scripts from within a Claude Code session.

## Install

Clone the plugin into your local Claude Code plugins directory:

```bash
git clone https://github.com/imehr/design-extractor.git \
  ~/.claude/plugins/local/design-extractor
```

Install Python dependencies:

```bash
python3 -m pip install --user --break-system-packages \
  playwright pillow pixelmatch numpy
```

Install Chromium for Playwright:

```bash
python3 -m playwright install chromium
```

Node dependencies for the library browser UI are auto-installed by `scripts/launch_ui.sh` on first run. No manual `pnpm install` is needed unless you want to pre-fetch them:

```bash
cd ~/.claude/plugins/local/design-extractor/ui && pnpm install
```

## First extraction

In a Claude Code session, run:

```
/design-extractor:extract https://linear.app
```

The plugin will:

1. Dispatch `agents/recon-agent.md` to capture screenshots and classify the page.
2. Fan out `agents/token-extractor.md`, `agents/asset-extractor.md`, and `agents/voice-analyst.md` in parallel.
3. Run `agents/pattern-analyst.md` to compute the 15 pattern signals.
4. Generate a shadcn/Tailwind HTML replica via `agents/replica-builder.md`.
5. Enter the refinement loop (max 5 iterations) until the replica scores >=0.85 similarity or plateaus.
6. Publish `DESIGN.md`, a per-brand `SKILL.md`, and register the brand in the library.

Progress is reported to the Claude Code session after each phase.

## Inspecting the output

After extraction, the brand lives at:

```
~/.claude/design-library/brands/linear-app/
  DESIGN.md              # Full design system documentation
  design-tokens.json     # W3C DTCG 2025.10 tokens
  design-tokens.css      # CSS custom properties
  metadata.json          # Library index entry
  skill/
    SKILL.md             # Per-brand skill for auto-loading
    references/          # Progressive disclosure files
  replica/
    index.html           # Self-contained Tailwind replica
  assets/
    logo.svg             # Extracted SVG assets
    favicon.svg
  screenshots/
    reference/           # Original site captures
    iterations/          # Each refinement iteration
  validation/
    iterations.jsonl     # Per-iteration scores and critiques
```

`DESIGN.md` is the primary artifact. It documents tokens, typography, spacing, components, the 15 pattern signals, voice analysis, and brand alignment. See [design-md-spec.md](./design-md-spec.md) for the full schema.

## Browsing the library

Launch the library browser UI:

```
/design-extractor:browse
```

This starts a Next.js dev server at `http://localhost:5173`. The UI reads brand data from `~/.claude/design-library/` and presents a card grid with category filtering, search, and per-brand detail pages. See [ui-guide.md](./ui-guide.md) for a walkthrough.

The UI now also includes:
- a `/docs` page with a step-by-step operator guide
- an `Improve Quality` action on the Validation tab
- live job monitoring for Claude-backed refinement passes
- assisted-capture guidance when source sites block automated browsing

## Installing a brand into a project

To make Claude auto-load a brand's design rules whenever you mention it:

```
/design-extractor:apply linear-app
```

This copies the per-brand `SKILL.md` into your project's `.claude/skills/brand-linear-app/SKILL.md`. See [per-brand-skill-spec.md](./per-brand-skill-spec.md) for how auto-loading works.

## Troubleshooting Playwright

### Chromium won't launch (headless mode)

On macOS, ensure you installed Chromium via Playwright (not Homebrew). The Playwright-managed binary includes the flags needed for headless operation:

```bash
python3 -m playwright install chromium
```

If you see `Browser was not found`, run `python3 -m playwright install --with-deps chromium` to install system-level dependencies.

### Bot detection / Cloudflare challenges

Some sites block headless Chromium. The `recon-agent` uses stealth mode by default (modifies navigator properties, disables automation signals). If a site still blocks extraction, the harness should not tell you to give up on the brand. The correct flow is:

1. Retry once with a headed browser.
2. If the block persists, mark the run as assisted-capture-required.
3. Import screenshots and page metadata from a normal browser session.
4. Re-run the improvement flow so replica refinement and validation can continue.

Woolworths is the current stress case for this path. See [troubleshooting.md](./troubleshooting.md) for the full degradation table.

### Screenshots are blank or partial

This usually means the page uses `networkidle` wait strategies that never resolve on analytics-heavy sites. The extractor defaults to `wait_until="domcontentloaded"` with a fixed timeout, which handles most cases. If screenshots are still incomplete, the replica will score lower and the validation report will flag the degradation.

## Available commands

| Command | Description |
|---|---|
| `/design-extractor:extract <url>` | Run full extraction pipeline on a URL |
| `/design-extractor:browse` | Launch the library browser UI |
| `/design-extractor:improve <slug>` | Start an improvement job for a brand |
| `/design-extractor:learn-feedback <slug> "<feedback>"` | Feed operator feedback back into the harness |
| `/design-extractor:apply <slug>` | Install a brand's SKILL.md into the current project |
| `/design-extractor:list` | List all brands in the library |
| `/design-extractor:seed-library` | Populate the library with the Nimbus sample brand |

## What to read next

- [concepts.md](./concepts.md) — extraction methodology, the 5-gate model, scoring
- [design-md-spec.md](./design-md-spec.md) — the DESIGN.md schema
- [patterns-and-relationships.md](./patterns-and-relationships.md) — the 15 pattern signals
- [troubleshooting.md](./troubleshooting.md) — known failure modes and degradation rules
