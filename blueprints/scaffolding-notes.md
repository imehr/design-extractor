# Harness-Mode Scaffolding Notes

**Date:** 2026-04-10
**Methodology source:** `~/.claude/plugins/local/masfactory/skills/harness/SKILL.md`
**Use:** One-time, dev-time only. masfactory is NOT a runtime dependency of design-extractor.

This document records how the masfactory **harness-mode** methodology was applied to scaffold the design-extractor agent and skill set. The actual `.md` files in `agents/` and `skills/` are checked in as static plugin assets — masfactory is not invoked at runtime.

---

## Why scaffold-only

masfactory's `agent_node.py` (lines 334–363) shells out to Claude via:

```python
cmd = ["claude", "--print", "-p", prompt, "--model", model, "--output-format", "text"]
```

There is **no** `--allowed-tools` flag, no `--cwd`, no permission policy injection. Each agent invocation is therefore a pure text-to-JSON LLM call with no filesystem, no Bash, no Playwright, no MCP. That is fatal for design-extractor: the entire pipeline depends on Playwright screenshot capture, agent-browser navigation, pixelmatch comparison, and Jinja2 template rendering. Every one of those needs Bash + Read + Write tools at minimum.

Conclusion: masfactory's Python Runtime mode is unusable for design-extractor as a runtime engine.

masfactory's Agent Teams mode would also fail — it routes via TeamCreate/SendMessage/TaskCreate which still subprocess into `claude --print` with no tool injection.

The right pattern is **native Claude Code subagents**: `.md` files under `agents/` with `tools:` frontmatter, dispatched directly by the parent Claude Code session via the `Agent` tool. The parent honours the per-agent tool whitelist and actually runs the tools.

---

## Harness-mode methodology applied

Following `harness/SKILL.md` Phase 1–6:

### Phase 1: Domain analysis

- **Domain:** Web design system extraction and visual replication
- **Core work types:** browse (recon), extract (CSS/computed styles/assets), interpret (LLM voice/pattern/synthesis), generate (HTML replica), validate (pixel diff + structural critique), publish (DESIGN.md/SKILL.md), index (library JSON)
- **Existing inventory:** `brand-extractor` plugin already implements stages 1–5 with a generator-critic pair (`extraction-agent`, `validation-agent`). Will fork its scripts; will NOT fork its 2-agent shape.
- **Why a richer split:** brand-extractor's 2-agent shape forces one agent to wear seven hats (recon, tokens, assets, voice, synthesis, replication). For a system that runs an iterative refinement loop, splitting into single-purpose agents lets each one own a narrow contract and lets the loop re-dispatch only the agents whose outputs failed.

### Phase 2: Architecture design

- **Execution mode:** Subagents (per harness-mode decision tree). 11+ agents communicating via shared filesystem state at `~/.claude/design-library/cache/<slug>/`. No inter-agent messaging; the slash command orchestrates the dispatch order.
- **Pattern selected:** **Pipeline + Producer-Reviewer hybrid**.
  - Phase A (extract) is a Pipeline: recon → tokens/assets/voice (parallel fan-out) → patterns → replica.
  - Phase B (refine) is a Producer-Reviewer loop: replica-builder produces, visual-critic reviews, refinement-agent patches, repeat until score ≥0.85 or 5 iters.
  - Phase C (publish) is a Pipeline: documentarian → skill-packager → librarian.
- **Optimization node:** The hand-rolled refinement loop in `commands/extract-design.md` plays the optimization-node role; we don't need masfactory's `optimization` node type because the loop logic is short enough to live in a slash-command prompt.

### Phase 3: Agent definitions (11 native subagents)

| Agent | Phase | Tools | Model | Reason |
|---|---|---|---|---|
| `recon-agent` | A | Bash, Read, Write, WebFetch | sonnet | Browses, screenshots, classifies page types — needs Playwright + agent-browser |
| `token-extractor` | A | Bash, Read, Write | sonnet | Runs extract_tokens.py token stage; reads computed styles |
| `asset-extractor` | A | Bash, Read, Write | sonnet | Runs extract_tokens.py assets stage; downloads SVGs |
| `voice-analyst` | A | Read, WebFetch, Bash | sonnet | Scrapes copy and analyses tone — needs WebFetch for additional pages |
| `pattern-analyst` | A | Read, Bash | sonnet | Computes 9 measurable + 6 LLM-interpreted pattern signals |
| `replica-builder` | A | Read, Write, Bash | sonnet | Generates shadcn/Tailwind HTML, screenshots via agent-browser |
| `visual-critic` | B | Read, Bash | opus | Vision-capable LLM critique of replica vs reference (high-stakes) |
| `refinement-agent` | B | Read, Write, Edit, Bash | sonnet | Patches tokens + HTML based on critique |
| `documentarian` | C | Read, Write | sonnet | Renders DESIGN.md.jinja with collected data |
| `skill-packager` | C | Read, Write | sonnet | Renders per-brand SKILL.md.jinja with negative triggers |
| `librarian` | C | Read, Write, Bash | haiku | Updates index.json, runs apply_design.py for installs |

Model tiering follows harness-mode: opus for critical/high-quality (visual-critic), sonnet for analysis/generation (most agents), haiku for rote indexing (librarian).

### Phase 4: Skill definitions (6 skills)

| Skill | Triggers (positive) | Negative triggers |
|---|---|---|
| `design-extraction` | "extract design system from URL", "what does this site look like", "reverse-engineer this brand" | "design from scratch", "create a new brand" |
| `pattern-detection` | "compute spacing rhythm", "what's the type scale ratio", "is this airy or dense" | "explain typography theory" |
| `shadcn-replication` | "build a replica with shadcn", "convert these tokens to Tailwind config" | "build me a shadcn app" |
| `visual-diff` | "compare two screenshots", "score this replica", "pixel diff the nav" | "image classification", "OCR" |
| `design-md-writer` | "write a DESIGN.md", "format brand documentation" | "write project README" |
| `library-management` | "register this brand", "list installed designs", "apply Linear style to my project" | "package manager", "library science" |

Per harness-mode rules:
- Each skill body ≤500 lines, with progressive disclosure into `references/`
- Aggressive triggers in description so skills auto-load when relevant
- Explicit negative triggers to prevent overlap with unrelated tasks (especially per-brand SKILL.md files which carry brand names that conflict with API/product references — e.g. "Stripe API" must NOT trigger the Stripe-design skill)

### Phase 5: Orchestration (slash command, no blueprint)

The orchestrator is `commands/extract-design.md` — a Claude Code slash command that the parent session executes. It drives the agents with explicit Agent-tool dispatches in this order:

```
Phase A (sequential within agent, parallel where independent):
  1. recon-agent
  2. [token-extractor || asset-extractor || voice-analyst]   (parallel)
  3. pattern-analyst
  4. replica-builder

Phase B (loop, max 5 iters):
  while overall_score < 0.85 OR blocking_failures != []:
    5a. python scripts/pixel_compare.py
    5b. python scripts/score_replica.py
    5c. visual-critic
    5d. refinement-agent
    5e. python scripts/render_replica.py
    if iteration > 1 AND score_delta < 0.01:
      break  # plateau

Phase C (sequential):
  6. documentarian
  7. skill-packager
  8. librarian
```

No `HARNESS.md` is generated for design-extractor itself (as harness-mode normally requires) because the equivalent SOP lives in `docs/concepts.md` and the plan file. A `HARNESS.md` would duplicate them.

### Phase 6: Validation checklist (deferred to Phase 1 of build)

- [ ] All agent files have valid YAML frontmatter
- [ ] Skill descriptions are pushy (≥6 trigger phrases)
- [ ] No conflicts with existing local plugins (brand-extractor, masfactory, autoagent)
- [ ] Skill bodies ≤500 lines
- [ ] Per-brand SKILL.md test: 5 should-trigger and 5 should-NOT-trigger phrases pass

These checks run during Phase 1 (skeleton plugin) and Phase 3 (publication).

---

## What we are NOT doing from harness-mode

- **No masfactory blueprint JSON.** No `blueprints/generated/design-extractor.json`. No `engine/runtime` invocation.
- **No skill registry / contract evaluator.** Skills are static `.md` files; the autoagent self-improvement loop (Phase 7, deferred) will edit them in-place between runs based on benchmark scores, not via masfactory's auto-promotion gate.
- **No `HARNESS.md` SOP file.** Replaced by `docs/concepts.md` and the implementation plan.

---

## References

- `~/.claude/plugins/local/masfactory/skills/harness/SKILL.md` — harness-mode methodology
- `~/.claude/plugins/local/masfactory/engine/nodes/agent_node.py` — proves the `claude --print -p` constraint
- `~/.claude/plugins/local/brand-extractor/agents/extraction-agent.md` — the 2-agent shape we are NOT copying
- `~/.claude/plans/sequential-percolating-puffin.md` — the implementation plan
