"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BrandSummary {
  slug: string;
  name: string;
  source_url: string;
  extracted_at: string;
  overall_score: number | null;
  categories: string[];
}

interface LibraryIndex {
  brands: BrandSummary[];
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const AGENTS = [
  { name: "recon-agent",        phase: "Extract",  role: "Browse the target site, capture multi-breakpoint screenshots, classify page types, produce the initial recon manifest.",                   outputs: "recon-output.json, screenshots/",         model: "sonnet",  updated: "2026-04-11" },
  { name: "token-extractor",    phase: "Extract",  role: "Mine colours, typography, spacing, radii, and shadows from computed styles with confidence scores.",                                      outputs: "tokens-output.json",                       model: "sonnet",  updated: "2026-04-11" },
  { name: "asset-extractor",    phase: "Extract",  role: "Download logos, favicons, SVGs, fonts, and key brand images from the recon HTML.",                                                       outputs: "assets-output.json, assets/",              model: "sonnet",  updated: "2026-04-11" },
  { name: "voice-analyst",      phase: "Extract",  role: "Analyse visible copy, tone, vocabulary, and CTA patterns to build the brand voice profile.",                                             outputs: "voice-analysis.json",                      model: "sonnet",  updated: "2026-04-11" },
  { name: "pattern-analyst",    phase: "Extract",  role: "Compute measurable pattern signals (spacing rhythm, type scale, density) and interpretive signals (airiness, formality).",                outputs: "patterns.json, patterns-llm.json",         model: "sonnet",  updated: "2026-04-11" },
  { name: "dom-extractor",      phase: "Extract",  role: "Extract DOM content, measurements, and images (including CSS background-image URLs) via agent-browser eval. Captures hero height, padding, font sizes, colors, and section structure with sectionCount for completeness validation.",  outputs: "dom-extraction/*.json",                    model: "sonnet",  updated: "2026-04-13" },
  { name: "replica-builder",    phase: "Build",    role: "Generate React/shadcn replicas from extracted tokens and DOM measurements. Requires section completeness: every H2 in DOM extraction must have a corresponding replica section. Detects hero layout patterns (bg-overlay vs split-column).",  outputs: "ui/app/brands/<slug>/replica/*",           model: "sonnet",  updated: "2026-04-13" },
  { name: "visual-critic",      phase: "Validate", role: "Vision-capable structural comparison of replica vs reference screenshots. Produces concrete fix guidance.",                                outputs: "critique JSON, issue lists",               model: "opus",    updated: "2026-04-11" },
  { name: "refinement-agent",   phase: "Improve",  role: "Patch replica tokens and HTML/Tailwind based on visual-critic feedback, then hand back for re-scoring.",                                  outputs: "updated replica pages/components",         model: "sonnet",  updated: "2026-04-11" },
  { name: "validation-monitor", phase: "Improve",  role: "Autonomous orchestrator: run harness, read manifests, dispatch parallel fix agents, loop until target score.",                             outputs: "manifest-driven orchestration plan",       model: "opus",    updated: "2026-04-12" },
  { name: "documentarian",      phase: "Publish",  role: "Render the canonical DESIGN.md from cache evidence using the Jinja2 template with confidence-badged tables.",                             outputs: "DESIGN.md",                                model: "sonnet",  updated: "2026-04-11" },
  { name: "skill-packager",     phase: "Publish",  role: "Package the brand as an installable SKILL.md with positive and negative triggers.",                                                       outputs: "skill/SKILL.md, references/",              model: "sonnet",  updated: "2026-04-11" },
  { name: "librarian",          phase: "Publish",  role: "Copy cache artifacts to the installed library path, update index.json, run apply_design.py on request.",                                  outputs: "~/.claude/design-library/brands/<slug>/",  model: "haiku",   updated: "2026-04-11" },
];

const SKILLS = [
  { name: "design-extraction",  purpose: "End-to-end extraction discipline: extract, don't imagine; build React replicas; keep scores fresh.",              triggers: "extract design system, reverse-engineer site, replicate this website",         status: "production" },
  { name: "design-md-writer",   purpose: "Render DESIGN.md from validated extraction artifacts and evidence.",                                               triggers: "write DESIGN.md, compile brand document, produce the design doc",             status: "production" },
  { name: "library-management", purpose: "Register brands in the local design library, list installed designs, apply a brand to a project.",                 triggers: "register this brand, apply this design, list installed designs",               status: "production" },
  { name: "pattern-detection",  purpose: "Turn tokens into measurable personality signals: density, scale ratio, rhythm, contrast energy.",                  triggers: "compute spacing rhythm, detect design patterns, classify personality",         status: "production" },
  { name: "shadcn-replication", purpose: "Map extracted evidence into React/shadcn replicas with CSS custom properties and shared components.",              triggers: "build a shadcn replica, convert tokens to Tailwind, port tokens",             status: "production" },
  { name: "visual-diff",        purpose: "Score replica fidelity via pixelmatch and feed the refinement loop with concrete screenshot drift.",               triggers: "compare screenshots, score this replica, run visual diff",                    status: "production" },
];

const SELF_IMPROVEMENT: Record<string, { feedback: string; changed: string; files: string }[]> = {
  "Westpac (2026-04-11)": [
    { feedback: "Hardcoded page lists in UI",            changed: "Made all page lists data-driven from localFiles/validation_report",                  files: "ui/app/brands/[slug]/page.tsx" },
    { feedback: "Assets tab empty (symlinks)",            changed: "API route follows symlinks via isSymbolicLink() + fs.stat()",                        files: "ui/app/api/brands/[slug]/route.ts" },
    { feedback: "Publish phase never ran",                changed: "Created publish_brand.py with full pipeline",                                        files: "scripts/publish_brand.py" },
    { feedback: "Token format mismatch",                  changed: "Fixed to {value, count} format",                                                     files: "scripts/publish_brand.py" },
    { feedback: "Validation scores missing",              changed: "publish reads report, sets overall_score in metadata",                                files: "scripts/publish_brand.py" },
    { feedback: "Harness was Westpac-only",               changed: "Made brand-agnostic via pages.json config per brand",                                files: "scripts/run_validation_loop.py" },
    { feedback: "Wrong credit cards URL",                 changed: "Added principle #9: verify URLs before extraction",                                   files: "commands/extract-design.md" },
    { feedback: "Hero layout wrong",                      changed: "Added DOM measurement + pattern detection (bg-overlay vs split-column)",              files: "agents/replica-builder.md" },
  ],
  "Woolworths Group (2026-04-11)": [
    { feedback: "Colors missing from tokens",             changed: "Extract from uniqueTextColors arrays + section fields",                               files: "scripts/publish_brand.py" },
    { feedback: "DESIGN.md says \"blue\"",                changed: "Use actual primary color from tokens, not hardcoded string",                          files: "scripts/publish_brand.py" },
    { feedback: "No quality gate on publish",             changed: "Added Publish Quality Checklist with FAIL/WARN gates",                               files: "scripts/publish_brand.py" },
    { feedback: "fontFamilies as list",                   changed: "Handle both dict and list formats for fontFamilies",                                  files: "scripts/publish_brand.py" },
  ],
  "Woolworths Supermarket (2026-04-12)": [
    { feedback: "Bot detection blocks headless",          changed: "Use --headed flag for Akamai bypass",                                                files: "Documented in pipeline" },
    { feedback: "Assets in wrong directory",              changed: "Copy to cache + symlink to brands dir",                                              files: "scripts/publish_brand.py" },
  ],
  "Quantium (2026-04-13)": [
    { feedback: "Team photos missing (gray placeholders)", changed: "Added CSS background-image extraction (Step 7.5) — sites use bg-image for photos",  files: "agents/dom-extractor.md" },
    { feedback: "Replica only rendered hero section",      changed: "Added section completeness requirement — every H2 must have a replica section",      files: "agents/replica-builder.md" },
    { feedback: "Section count not validated on publish",  changed: "Quality checklist compares H2 count in replica vs DOM extraction sections",          files: "scripts/publish_brand.py" },
    { feedback: "extractColors crash on non-string value", changed: "Coerce entry.value to string before .match()",                                      files: "ui/app/brands/[slug]/page.tsx" },
    { feedback: "rgb_to_hex crash on list input",          changed: "Check isinstance(rgb_str, str) before .startswith()",                               files: "scripts/publish_brand.py" },
    { feedback: "About-us had 3 directors, original 15",   changed: "Expanded to 7 directors + 8 executives with real downloaded CSS bg-image photos",   files: "about-us/page.tsx, dom-extractor.md" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Changelog entries as structured data                               */
/* ------------------------------------------------------------------ */

interface ChangelogEntry {
  version: string;
  date: string;
  sections: { heading: string; items: string[] }[];
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "0.3.0",
    date: "2026-04-12",
    sections: [
      {
        heading: "Added",
        items: [
          "scripts/publish_brand.py -- Automated publish pipeline that generates design-tokens.json, design-tokens.css, DESIGN.md, SKILL.md from DOM extraction measurements.",
          "scripts/run_validation_loop.py -- Brand-agnostic validation harness. Captures original + replica screenshots via agent-browser, runs pixelmatch comparison, writes improvement manifest and validation report.",
          "scripts/improvement_job.py -- Metadata sync helper for the harness loop.",
          "Publish Quality Checklist -- Validates: color count (>=5), font families, DESIGN.md accuracy, assets accessibility, validation report, SKILL.md existence.",
          "Woolworths Supermarket extraction (woolworths-com-au) -- 5 pages, 33 assets, 85.7% avg score. Required --headed mode for Akamai bot detection bypass.",
          "Woolworths Group extraction (woolworthsgroup-com-au) -- 5 pages, 60+ assets, 67.8% avg score. TomatoGrotesk + Montserrat fonts, 18 brand logos.",
          "Docs page (ui/app/docs/page.tsx) -- Setup, validation, blocked-site fallback documentation.",
          "Homepage usage context -- Description of what the library contains + /extract command hint.",
        ],
      },
      {
        heading: "Fixed",
        items: [
          "Hardcoded page lists removed -- Preview tab, Validation tab, page switcher, Components tab, and Usage tab all now derive page lists dynamically.",
          "Assets tab empty -- API route walk() function now follows symlinks.",
          "Color extraction from multiple sources -- publish_brand.py now reads colors from dedicated colors dict, uniqueTextColors/uniqueBackgroundColors arrays, section-level fields, and link/button styles.",
          "DESIGN.md generic description -- No longer uses hardcoded \"distinctive blue\" text. References actual primary brand color from tokens.",
          "Font families list format -- publish_brand.py handles both dict and list formats for fontFamilies.",
          "Validation scores not displayed -- publish_brand.py now reads validation report and sets overall_score in metadata.json.",
          "Homepage brands below fold -- Removed large hero + \"how it works\" section. Brands immediately visible.",
          "Nimbus mock brand removed -- Only real extracted brands in library index.",
          "Credit cards URL wrong -- Westpac credit cards used incorrect URL. Added principle #9: verify URLs before extraction.",
        ],
      },
      {
        heading: "Changed",
        items: [
          "Validation harness brand-agnostic -- run_validation_loop.py loads page configs from pages.json instead of hardcoded Westpac pages.",
          "Report path fixed -- Harness writes to brands/{slug}/validation/report.json, matching where the UI reads.",
          "Extract-design command -- Added Phase D (validation harness loop) and Phase E (publish_brand.py). Added DOM measurement step.",
        ],
      },
      {
        heading: "Improved -- Agents & Skills",
        items: [
          "agents/validation-monitor.md -- Rewrote to use actual harness script, Monitor tool integration, improvement manifest, DOM measurement step.",
          "agents/replica-builder.md -- Added DOM measurement before building, hero layout pattern detection, content padding detection.",
          "agents/dom-extractor.md -- Fixed navigate to open, added URL verification step.",
          "commands/extract-design.md -- Integrated harness loop + publish pipeline. Fixed agent-browser syntax.",
          "skills/visual-diff/SKILL.md -- Replaced stub with actual production methodology.",
        ],
      },
      {
        heading: "Westpac Replica Improvements",
        items: [
          "Homepage: 73.9% to 86.3% (hero height 424px matched, content padding 60px)",
          "Home Loans: 71.7% to 92.3% (hero restructured to bg-image overlay pattern, height 494px)",
          "Bank Accounts: 69.8% to 84.0% (hero bg-image with gradient overlay)",
          "Contact Us: 80.9% (stable)",
          "Credit Cards: 75.9% to 79.0% (hero height 403px, correct URL)",
          "Average: 49.9% to 84.5%",
        ],
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-04-11",
    sections: [
      {
        heading: "Added",
        items: [
          "Westpac extraction (westpac-com-au) -- First production extraction. 5 pages, 50+ assets, React/shadcn replicas.",
          "Design Library UI -- Next.js app with 10-tab brand detail page.",
          "DESIGN.md for Westpac -- 1,137 lines, 9-section Apple-quality design system document.",
          "Shared components -- WestpacHeader, WestpacFooter, WestpacHero, WestpacCategories, WestpacSections, WestpacLogo.",
          "5 replica pages -- Homepage, Credit Cards, Contact Us, Home Loans, Bank Accounts.",
          "Screenshot comparison -- Side-by-side original vs replica at 1280x720 viewport.",
          "Comprehensive review (docs/plans/2026-04-11-comprehensive-review.md) -- Honest assessment of what works and what is broken after first extraction.",
        ],
      },
    ],
  },
  {
    version: "Phase 1",
    date: "skeleton",
    sections: [
      {
        heading: "Added -- Phase 1 (skeleton)",
        items: [
          ".claude-plugin/plugin.json manifest",
          "11 native Claude Code subagent stubs under agents/",
          "6 skill stubs under skills/",
          "Stub commands: extract-design, browse-library, list-designs, apply-design, seed-library",
          "scripts/update_library_index.py -- minimal index registry writer",
          "Hand-curated synthetic \"Nimbus\" sample brand under templates/sample-brand/",
          "hooks/hooks.json -- PostToolUse formatter stub",
        ],
      },
    ],
  },
  {
    version: "Phase 0",
    date: "de-risk",
    sections: [
      {
        heading: "Added -- Phase 0 (de-risk)",
        items: [
          "tests/fixtures/urls.txt -- 10 fixture URLs covering fintech, dev tools, infrastructure, AI, and known-hard sites",
          "tests/fixtures/linear-app-ground-truth.md -- gold-standard hand-written Linear DESIGN.md (15 sections, 400+ lines)",
          "tests/fixtures/baseline-report.md -- Phase 0 10-URL stress test report with graceful-degradation rules",
          "blueprints/scaffolding-notes.md -- masfactory harness-mode methodology (architecture rationale, 11 agents, 6 skills, orchestration plan)",
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function phaseColor(phase: string): string {
  switch (phase) {
    case "Extract":  return "bg-blue-50 text-blue-700 border-blue-200";
    case "Build":    return "bg-green-50 text-green-700 border-green-200";
    case "Validate": return "bg-amber-50 text-amber-700 border-amber-200";
    case "Improve":  return "bg-purple-50 text-purple-700 border-purple-200";
    case "Publish":  return "bg-gray-50 text-gray-700 border-gray-200";
    default:         return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function phaseBg(phase: string): string {
  switch (phase) {
    case "A": return "border-blue-300 bg-blue-50";
    case "B": return "border-green-300 bg-green-50";
    case "C": return "border-amber-300 bg-amber-50";
    case "D": return "border-purple-300 bg-purple-50";
    case "E": return "border-gray-300 bg-gray-100";
    default:  return "border-gray-200 bg-gray-50";
  }
}

function phaseAccent(phase: string): string {
  switch (phase) {
    case "A": return "text-blue-700";
    case "B": return "text-green-700";
    case "C": return "text-amber-700";
    case "D": return "text-purple-700";
    case "E": return "text-gray-700";
    default:  return "text-gray-600";
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
      <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{value}</p>
      <p className="mt-1 text-xs text-[#86868b]">{label}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center py-1">
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none" className="text-[#d2d2d7]">
        <path d="M10 4 L10 18 M5 14 L10 20 L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline DAG                                                       */
/* ------------------------------------------------------------------ */

interface PipelinePhase {
  id: string;
  label: string;
  title: string;
  steps: string[];
}

const PIPELINE: PipelinePhase[] = [
  {
    id: "A",
    label: "Phase A",
    title: "Extract",
    steps: [
      "agent-browser open URL --headed",
      "dom-extractor (5 pages in parallel)",
      "asset download (fonts, images, SVGs)",
      "DOM measurements (hero height, padding, colors)",
    ],
  },
  {
    id: "B",
    label: "Phase B",
    title: "Build",
    steps: [
      "Shared components (header, footer, logo)",
      "5 replica pages (React/shadcn)",
    ],
  },
  {
    id: "C",
    label: "Phase C",
    title: "Validate",
    steps: [
      "run_validation_loop.py",
      "Screenshot originals via agent-browser",
      "Screenshot replicas from localhost",
      "Pixel comparison (pixelmatch, threshold 0.3)",
      "Write report.json + improvement-manifest.json",
    ],
  },
  {
    id: "D",
    label: "Phase D",
    title: "Improve (loop)",
    steps: [
      "Read improvement manifest",
      "DOM measurement of original (agent-browser eval)",
      "Dispatch fix agents per failing page",
      "Re-capture, re-score",
      "Stop when avg >= 80% or plateau",
    ],
  },
  {
    id: "E",
    label: "Phase E",
    title: "Publish",
    steps: [
      "publish_brand.py",
      "design-tokens.json (from DOM measurements)",
      "design-tokens.css (CSS custom properties)",
      "DESIGN.md (9-section document)",
      "SKILL.md (installable skill)",
      "Quality checklist validation",
      "Library index registration",
    ],
  },
];

function PipelineBox({ phase }: { phase: PipelinePhase }) {
  return (
    <div className={`rounded-2xl border-2 ${phaseBg(phase.id)} p-5`}>
      <div className="flex items-center gap-3">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${phaseAccent(phase.id)}`}>
          {phase.label}
        </span>
        <span className="text-sm font-semibold text-[#1d1d1f]">{phase.title}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {phase.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-sm leading-6 text-[#4a4a4f]">
            <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-40" />
            <span className="font-mono text-xs">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 1: Overview                                                    */
/* ------------------------------------------------------------------ */

function OverviewTab({ brands }: { brands: BrandSummary[] }) {
  return (
    <div className="space-y-8">
      {/* What it does */}
      <Card className="rounded-[24px] border-[#d2d2d7]/50">
        <CardHeader>
          <CardTitle>What is design-extractor?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-[#4a4a4f]">
          <p>
            A Claude Code plugin that extracts complete design systems from live URLs. It captures
            tokens (colors, typography, spacing), downloads assets, measures DOM geometry, builds
            React/shadcn replicas, validates them via screenshot comparison, and iteratively improves
            until the replica converges with the original.
          </p>
          <p>
            The output is a per-brand <span className="font-mono text-xs bg-[#f5f5f7] px-1.5 py-0.5 rounded">DESIGN.md</span> document
            and an installable <span className="font-mono text-xs bg-[#f5f5f7] px-1.5 py-0.5 rounded">SKILL.md</span> that
            teaches Claude to design in that brand{"'"}s style on demand.
          </p>
        </CardContent>
      </Card>

      {/* How to use */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-[#d2d2d7]/50">
          <CardHeader>
            <CardTitle>How to extract</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-[#0f172a] p-4 font-mono text-sm text-green-400">
              <span className="text-[#6e6e73]">$</span> /extract https://example.com
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6e6e73]">
              Run this command in Claude Code. The plugin handles recon, extraction, replica building,
              validation, and publishing automatically. The full pipeline takes 10-30 minutes depending
              on site complexity.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-[#d2d2d7]/50">
          <CardHeader>
            <CardTitle>How to use the output</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-[#1d1d1f]">
              <li>
                Copy <span className="font-mono text-xs bg-[#f5f5f7] px-1.5 py-0.5 rounded">DESIGN.md</span> into
                your project root
              </li>
              <li>
                Or install the skill:
                <div className="mt-2 rounded-xl bg-[#0f172a] p-3 font-mono text-xs text-green-400">
                  <span className="text-[#6e6e73]">$</span> /apply-design westpac-com-au
                </div>
              </li>
              <li>
                Claude will now design in that brand{"'"}s style for any UI work in the project
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[24px] border-[#d2d2d7]/50">
        <CardHeader>
          <CardTitle>Monitoring Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-[#4a4a4f]">
            Track agent DAG execution, skill quality over time, changelogs from self-improvement, and feedback history. Live data from the MASFactory harness.
          </p>
          <Link href="/monitoring" className="mt-3 inline-flex items-center text-sm font-medium text-[#0071e3] hover:underline">
            Open Monitoring →
          </Link>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Agents" value="13" />
        <Stat label="Skills" value="6" />
        <Stat label="Scripts" value="12" />
        <Stat label="Extracted brands" value={String(brands.length)} />
      </div>

      {/* Extracted brands */}
      {brands.length > 0 && (
        <Card className="rounded-[24px] border-[#d2d2d7]/50">
          <CardHeader>
            <CardTitle>Extracted Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d2d2d7]/40 text-left text-xs text-[#86868b]">
                    <th className="pb-3 pr-4 font-medium">Brand</th>
                    <th className="pb-3 pr-4 font-medium">Source URL</th>
                    <th className="pb-3 pr-4 font-medium">Score</th>
                    <th className="pb-3 pr-4 font-medium">Extracted</th>
                    <th className="pb-3 font-medium">Categories</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.slug} className="border-b border-[#d2d2d7]/20 last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/brands/${b.slug}`} className="font-medium text-[#0071e3] hover:underline">
                          {b.name || b.slug}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-[#6e6e73]">{b.source_url}</td>
                      <td className="py-3 pr-4">
                        {b.overall_score != null ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.overall_score >= 80
                              ? "bg-green-50 text-green-700"
                              : b.overall_score >= 60
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          }`}>
                            {b.overall_score.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-[#86868b]">--</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#6e6e73]">{b.extracted_at?.slice(0, 10) ?? "--"}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {b.categories?.map((c) => (
                            <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 2: Pipeline                                                    */
/* ------------------------------------------------------------------ */

function PipelineTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-[#6e6e73]">
        The full extraction pipeline runs through five phases. Each phase produces artifacts consumed
        by the next. Phase D loops until convergence.
      </p>

      <div className="space-y-0">
        {PIPELINE.map((phase, i) => (
          <div key={phase.id}>
            <PipelineBox phase={phase} />
            {i < PIPELINE.length - 1 && <Arrow />}
          </div>
        ))}
      </div>

      {/* Flow summary */}
      <Card className="rounded-[24px] border-[#d2d2d7]/50">
        <CardHeader>
          <CardTitle>Key execution details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-[#f5f5f7] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Browser</p>
              <p className="mt-2 text-sm leading-6 text-[#1d1d1f]">
                agent-browser with <span className="font-mono text-xs">--headed</span> flag. Required for sites with bot detection (Akamai, Cloudflare).
              </p>
            </div>
            <div className="rounded-xl bg-[#f5f5f7] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Comparison</p>
              <p className="mt-2 text-sm leading-6 text-[#1d1d1f]">
                pixelmatch at threshold 0.3, viewport 1280x720. Scores written to <span className="font-mono text-xs">report.json</span>.
              </p>
            </div>
            <div className="rounded-xl bg-[#f5f5f7] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Convergence</p>
              <p className="mt-2 text-sm leading-6 text-[#1d1d1f]">
                Loop stops when average score {">"}= 80%, score plateaus for 3 iterations, or max iterations reached.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 3: Agents                                                      */
/* ------------------------------------------------------------------ */

function AgentsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-[#6e6e73]">
        13 agents, each with a defined phase, model, and output contract. Highlighted agents are the
        ones most recently improved by the self-improvement loop.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d2d2d7]/40 text-left text-xs text-[#86868b]">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Phase</th>
              <th className="pb-3 pr-4 font-medium">Role</th>
              <th className="pb-3 pr-4 font-medium">Key Outputs</th>
              <th className="pb-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((agent) => {
              const isHighlighted = ["dom-extractor", "replica-builder", "validation-monitor", "visual-critic"].includes(agent.name);
              return (
                <tr
                  key={agent.name}
                  className={`border-b border-[#d2d2d7]/20 last:border-0 ${isHighlighted ? "bg-blue-50/40" : ""}`}
                >
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs font-semibold text-[#1d1d1f]">{agent.name}</span>
                    {isHighlighted && (
                      <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" title="Key agent" />
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${phaseColor(agent.phase)}`}>
                      {agent.phase}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs leading-5 text-[#4a4a4f]">{agent.role}</td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-[#6e6e73]">{agent.outputs}</td>
                  <td className="py-3 text-xs text-[#86868b]">{agent.updated}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Key agents detail cards */}
      <h3 className="pt-4 text-lg font-semibold text-[#1d1d1f]">Key agents</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-blue-200 bg-blue-50/30">
          <CardContent className="pt-5">
            <p className="font-mono text-sm font-semibold text-blue-700">dom-extractor</p>
            <p className="mt-2 text-sm leading-6 text-[#4a4a4f]">
              Measures exact live DOM geometry via <span className="font-mono text-xs">agent-browser eval</span>.
              Captures hero height, padding, font sizes, and background colors from the actual rendered page.
              Runs in parallel across 5 pages.
            </p>
            <p className="mt-2 font-mono text-xs text-[#86868b]">Model: sonnet</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-green-200 bg-green-50/30">
          <CardContent className="pt-5">
            <p className="font-mono text-sm font-semibold text-green-700">replica-builder</p>
            <p className="mt-2 text-sm leading-6 text-[#4a4a4f]">
              Generates React/shadcn replicas with a DOM measurement step before building.
              Detects hero layout patterns (bg-overlay vs split-column) and uses content padding
              from h1.left measurements. Screenshots via agent-browser for scoring.
            </p>
            <p className="mt-2 font-mono text-xs text-[#86868b]">Model: sonnet</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-purple-200 bg-purple-50/30">
          <CardContent className="pt-5">
            <p className="font-mono text-sm font-semibold text-purple-700">validation-monitor</p>
            <p className="mt-2 text-sm leading-6 text-[#4a4a4f]">
              Autonomous orchestrator that runs the validation harness, reads improvement manifests,
              dispatches parallel fix agents per failing page, and uses the Monitor tool to stream
              progress. Loops until target score or plateau.
            </p>
            <p className="mt-2 font-mono text-xs text-[#86868b]">Model: opus</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-amber-200 bg-amber-50/30">
          <CardContent className="pt-5">
            <p className="font-mono text-sm font-semibold text-amber-700">visual-critic</p>
            <p className="mt-2 text-sm leading-6 text-[#4a4a4f]">
              Vision-capable (Opus model) structural comparison of replica vs reference screenshots.
              Produces concrete fix guidance with pixel-level drift regions. Feeds the refinement
              agent with actionable issue lists.
            </p>
            <p className="mt-2 font-mono text-xs text-[#86868b]">Model: opus</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 4: Skills                                                      */
/* ------------------------------------------------------------------ */

function SkillsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-[#6e6e73]">
        6 skills, each teachable knowledge that Claude Code can invoke when the right trigger is detected.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d2d2d7]/40 text-left text-xs text-[#86868b]">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Purpose</th>
              <th className="pb-3 pr-4 font-medium">Triggers</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map((skill) => (
              <tr key={skill.name} className="border-b border-[#d2d2d7]/20 last:border-0">
                <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#1d1d1f]">{skill.name}</td>
                <td className="py-3 pr-4 text-xs leading-5 text-[#4a4a4f]">{skill.purpose}</td>
                <td className="py-3 pr-4 font-mono text-[11px] text-[#6e6e73]">{skill.triggers}</td>
                <td className="py-3">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                    {skill.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 5: Changelog                                                   */
/* ------------------------------------------------------------------ */

function ChangelogTab() {
  return (
    <div className="space-y-8">
      {CHANGELOG_ENTRIES.map((entry) => (
        <div key={entry.version} className="rounded-2xl border border-[#d2d2d7]/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-[#1d1d1f]">
              {entry.version.startsWith("Phase") ? entry.version : `v${entry.version}`}
            </h2>
            <Badge variant="outline" className="text-[10px]">{entry.date}</Badge>
          </div>
          {entry.sections.map((section) => (
            <div key={section.heading} className="mt-4">
              <h3 className="text-sm font-semibold text-[#4a4a4f] mb-2">{section.heading}</h3>
              <ul className="space-y-1.5 pl-4">
                {section.items.map((item, i) => (
                  <li key={i} className="text-xs leading-6 text-[#4a4a4f] list-disc">
                    {item.includes(" -- ") ? (
                      <>
                        <span className="font-semibold text-[#1d1d1f]">{item.split(" -- ")[0]}</span>
                        {" -- "}
                        {item.split(" -- ").slice(1).join(" -- ")}
                      </>
                    ) : (
                      item
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 6: Self-Improvement Log                                        */
/* ------------------------------------------------------------------ */

function SelfImprovementTab() {
  return (
    <div className="space-y-8">
      <p className="text-sm text-[#86868b]">
        Live self-improvement data with scores and timelines is available on the <Link href="/monitoring" className="text-[#0071e3] hover:underline">Monitoring Dashboard</Link>.
      </p>

      <div className="rounded-2xl bg-[#eef6ff] p-5">
        <p className="text-sm font-semibold text-[#1d1d1f]">How self-improvement works</p>
        <p className="mt-2 text-sm leading-6 text-[#4a4a4f]">
          Every extraction produces feedback. That feedback updates the plugin code itself --
          agents, skills, scripts, and commands. The table below shows the exact trail: what was
          learned, what changed, and which files were modified. This is not documentation -- it is
          the actual audit log of the system getting better.
        </p>
      </div>

      {Object.entries(SELF_IMPROVEMENT).map(([brand, rows]) => (
        <div key={brand}>
          <h3 className="mb-3 text-lg font-semibold text-[#1d1d1f]">{brand}</h3>
          <div className="overflow-x-auto rounded-2xl border border-[#d2d2d7]/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d2d2d7]/40 bg-[#f5f5f7] text-left text-xs text-[#86868b]">
                  <th className="px-4 py-3 font-medium">Feedback</th>
                  <th className="px-4 py-3 font-medium">What Changed</th>
                  <th className="px-4 py-3 font-medium">Files Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-[#d2d2d7]/20 last:border-0">
                    <td className="px-4 py-3 text-xs text-[#1d1d1f]">{row.feedback}</td>
                    <td className="px-4 py-3 text-xs leading-5 text-[#4a4a4f]">{row.changed}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6e6e73]">{row.files}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Timeline visualization */}
      <Card className="rounded-[24px] border-[#d2d2d7]/50">
        <CardHeader>
          <CardTitle>Improvement timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-[#d2d2d7]">
            <div className="relative">
              <div className="absolute -left-[1.125rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-blue-400 bg-white" />
              <p className="text-sm font-semibold text-[#1d1d1f]">2026-04-11 -- Westpac</p>
              <p className="text-xs text-[#6e6e73]">First production extraction. 8 feedback items fed back into 7 files. Score: 49.9% to 84.5%.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[1.125rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-green-400 bg-white" />
              <p className="text-sm font-semibold text-[#1d1d1f]">2026-04-11 -- Woolworths Group</p>
              <p className="text-xs text-[#6e6e73]">4 feedback items fixed color extraction and quality gates. Score: 67.8%.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[1.125rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-amber-400 bg-white" />
              <p className="text-sm font-semibold text-[#1d1d1f]">2026-04-12 -- Woolworths Supermarket</p>
              <p className="text-xs text-[#6e6e73]">2 feedback items addressed bot detection and asset directory handling. Score: 85.7%.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);

  useEffect(() => {
    fetch("/api/library")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: LibraryIndex) => setBrands(data.brands ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f7f9fc_0%,#ffffff_28%,#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Page header */}
        <section className="mb-8">
          <Badge variant="outline" className="mb-3">Reference</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">
            design-extractor
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6e6e73]">
            Extract design systems from live URLs. Build validated React/shadcn replicas.
            Publish reusable brand documents and installable skills.
          </p>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList variant="line" className="mb-6 gap-0.5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
            <TabsTrigger value="self-improvement">Self-Improvement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab brands={brands} />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineTab />
          </TabsContent>

          <TabsContent value="agents">
            <AgentsTab />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsTab />
          </TabsContent>

          <TabsContent value="changelog">
            <ChangelogTab />
          </TabsContent>

          <TabsContent value="self-improvement">
            <SelfImprovementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
