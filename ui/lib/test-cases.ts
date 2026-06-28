import { createHash } from "crypto";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import {
  clearBrandTaskModelOverride,
  resolveTaskModelSelection,
  setBrandTaskModelOverride,
  type ModelProvider,
  type TaskModelSelection,
  type TaskModelSource,
} from "@/lib/model-settings";

type JsonRecord = Record<string, unknown>;

export type TestCaseStatus = "pending" | "completed" | "stale" | "failed";
export type BrandPackageQualityStatus = "ready" | "needs_work";
export type BrandPackageQualityCheckStatus = "pass" | "warn" | "fail";

export interface BrandPackageQualityCheck {
  id: string;
  label: string;
  status: BrandPackageQualityCheckStatus;
  required: boolean;
  details: string;
}

export interface BrandPackageQuality {
  status: BrandPackageQualityStatus;
  score: number;
  summary: string;
  checks: BrandPackageQualityCheck[];
}

export interface TestCaseEvalCheck {
  id: string;
  label: string;
  status: BrandPackageQualityCheckStatus;
  required: boolean;
  details: string;
  weight: number;
}

export interface TestCaseEval {
  score: number;
  blockers: number;
  checks: TestCaseEvalCheck[];
}

export interface TestCaseVisualEvalCheck {
  id: string;
  label: string;
  status: BrandPackageQualityCheckStatus;
  details: string;
}

export interface TestCaseVisualDominant {
  hex: string;
  frac: number;
  matched: boolean;
}

export interface TestCaseVisualEval {
  score: number;
  blank: boolean;
  /** Path (relative to the brand dir) to the screenshot PNG, served via the file API. */
  screenshot: string | null;
  checks: TestCaseVisualEvalCheck[];
  dominant: TestCaseVisualDominant[];
}

export interface BrandTestCase {
  id: string;
  title: string;
  shortTitle: string;
  type: string;
  description: string;
  intent: string;
  route: string;
  file: string;
  status: TestCaseStatus;
  generated_at: string | null;
  updated_at: string | null;
  source_hash: string | null;
  feedback_count: number;
  last_feedback_at: string | null;
  error?: string | null;
  /** Scored evaluation of the generated HTML against brand-evidence requirements. */
  eval?: TestCaseEval | null;
  /** Visual-fidelity evaluation (screenshot + palette alignment). Best-effort. */
  visual_eval?: TestCaseVisualEval | null;
}

export interface BrandTestCaseManifest {
  version: number;
  brand_slug: string;
  source_hash: string;
  generated_at: string | null;
  updated_at: string;
  generator: TestCaseGeneratorConfig;
  model_control: TestCaseModelControl;
  package_quality: BrandPackageQuality;
  cases: BrandTestCase[];
}

export interface TestCaseGeneratorConfig {
  version: number;
  provider: string;
  provider_label: string;
  provider_type: string;
  agent: string;
  model: string;
  uses_model: true;
  settings_integrated: boolean;
  project_override: boolean;
  model_source: TaskModelSource;
  enabled: boolean;
  command: string | null;
  base_url: string | null;
  description: string;
}

export interface TestCaseModelControl {
  active: TestCaseGeneratorConfig;
  source: TaskModelSource;
  project_override: boolean;
  settings_path: string;
  project_settings_path: string | null;
  available_providers: Array<{
    id: string;
    type: string;
    label: string;
    enabled: boolean;
    model: string;
    model_presets: string[];
    description: string | null;
  }>;
}

export interface TestCaseFeedback {
  id: string;
  case_id: string;
  target: "design_md" | "skill" | "both";
  sentiment: "works" | "needs_work";
  note: string;
  created_at: string;
}

interface GeneratedTestCaseBrief {
  id: string;
  brand_risks: string[];
  must_include: string[];
  creative_direction: string;
}

interface FooterAnatomy {
  footerColumns: string[][];
  footerAboutText: string | null;
  footerAcknowledgement: string | null;
  footerCopyright: string | null;
}

interface ComponentEvidence {
  header: boolean;
  navigation: boolean;
  footer: boolean;
  logo: boolean;
  details: Record<string, string>;
}

interface AssetCandidate {
  name: string;
  rel: string;
  src: string;
  isLogo: boolean;
}

interface FontFaceAsset {
  family: string;
  src: string;
  weight: number;
}

interface BrandContext {
  slug: string;
  name: string;
  sourceUrl: string;
  extractedAt: string;
  categories: string[];
  score: number | null;
  designMd: string;
  skillMd: string;
  designSignals: string[];
  skillSignals: string[];
  tokens: JsonRecord;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    light: string;
    text: string;
    muted: string;
    surface: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  fontFaces: FontFaceAsset[];
  logoSrc: string | null;
  lightLogoSrc: string | null;
  brandMarkLabel: string | null;
  imageSrcs: string[];
  navLabels: string[];
  footerLinks: string[];
  footerColumns: string[][];
  footerAboutText: string | null;
  footerAcknowledgement: string | null;
  footerCopyright: string | null;
  componentEvidence: ComponentEvidence;
  pageNames: string[];
  packageQuality: BrandPackageQuality;
  sourceHash: string;
}

const execFileAsync = promisify(execFile);
const LIBRARY_ROOT = path.join(os.homedir(), ".claude", "design-library");
const REPO_ROOT = path.resolve(process.cwd(), "..");
const PTY_RUNNER = path.join(REPO_ROOT, "scripts", "run_cli_with_pty.py");

/**
 * Run an agentic CLI (opencode/kimi/claude/codex/…) under a real PTY.
 *
 * These CLIs block when spawned from Node without a controlling terminal —
 * they only converge interactively. We route the call through a tiny stdlib
 * Python wrapper (scripts/run_cli_with_pty.py) that forks the command under a
 * pseudo-terminal, so the agent sees a terminal and returns its brief instead
 * of spinning until the timeout. No native Node dependencies.
 */
async function runCliWithPty(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; code: number; timedOut?: boolean }> {
  const runnerArgs = [
    PTY_RUNNER,
    "--cwd",
    cwd,
    "--timeout",
    String(Math.max(1, Math.round(timeoutMs / 1000))),
    "--",
    command,
    ...args,
  ];
  try {
    const result = await execFileAsync("python3", runnerArgs, {
      cwd: REPO_ROOT,
      maxBuffer: 16 * 1024 * 1024,
      timeout: timeoutMs + 15000,
    });
    return { stdout: (result.stdout || "").replace(/\r/g, ""), stderr: result.stderr || "", code: 0 };
  } catch (err: unknown) {
    // Agentic CLIs often exit non-zero (or get killed at the timeout) AFTER
    // writing a valid answer to stdout. Don't throw the output away — surface
    // it so the brief parser can decide. Only rethrow when there's truly nothing.
    const record = err as { stdout?: string; stderr?: string; code?: number; signal?: string; killed?: boolean };
    const stdout = (record.stdout || "").replace(/\r/g, "");
    const stderr = record.stderr || "";
    if (!stdout && !stderr) throw err;
    return { stdout, stderr, code: record.code ?? (record.killed ? 124 : 1), timedOut: Boolean(record.killed || record.signal) };
  }
}
const GENERATOR_VERSION = 5;
const TEST_CASE_GENERATOR_BASE = {
  version: GENERATOR_VERSION,
  uses_model: true,
  description:
    "Model-backed scenario brief consumed by deterministic HTML guardrail rendering from DESIGN.md, SKILL.md, tokens, assets, validation, and DOM extraction evidence.",
} as const;
const CLAUDE_TEST_CASE_TIMEOUT_MS = Number(process.env.TEST_CASE_CLAUDE_TIMEOUT_MS ?? 900000);
// Per-scenario cap for the brief step. Scenarios are generated one at a time so
// a stuck model is killed here (not after the whole-batch cap) and the run
// moves on to the next case.
const PERCASE_GENERATION_TIMEOUT_MS = Number(process.env.TEST_CASE_PERCASE_TIMEOUT_MS ?? 180000);
const CLI_TASK_RUNNER_PROVIDER_TYPES = new Set(["codex", "cursor", "kimi", "minimax", "opencode"]);

async function resolveTestCaseGeneratorSettings(slug: string): Promise<{
  generator: TestCaseGeneratorConfig;
  modelControl: TestCaseModelControl;
  selection: TaskModelSelection;
}> {
  const selection = await resolveTaskModelSelection("test_cases", slug, {
    providerId: process.env.TEST_CASE_PROVIDER,
    model: process.env.TEST_CASE_MODEL || process.env.TEST_CASE_CLAUDE_MODEL,
  });
  const generator = {
    ...TEST_CASE_GENERATOR_BASE,
    provider: selection.provider_id,
    provider_label: selection.provider_label,
    provider_type: selection.provider_type,
    agent: selection.agent,
    model: selection.model,
    settings_integrated: selection.settings_integrated,
    project_override: selection.project_override,
    model_source: selection.model_source,
    enabled: selection.enabled,
    command: selection.command,
    base_url: selection.base_url,
  };
  return {
    generator,
    modelControl: buildModelControl(generator, selection),
    selection,
  };
}

function buildModelControl(
  generator: TestCaseGeneratorConfig,
  selection: TaskModelSelection
): TestCaseModelControl {
  return {
    active: generator,
    source: selection.model_source,
    project_override: selection.project_override,
    settings_path: selection.settings_path,
    project_settings_path: selection.project_settings_path,
    available_providers: selection.available_providers.map((provider: ModelProvider) => ({
      id: provider.id,
      type: provider.type,
      label: provider.label,
      enabled: provider.enabled,
      model: provider.model,
      model_presets: provider.model_presets,
      description: provider.description,
    })),
  };
}

export const TEST_CASE_DEFINITIONS = [
  {
    id: "data-dashboard",
    title: "Data Dashboard Report",
    shortTitle: "Dashboard",
    type: "report",
    description:
      "A dense data report using the brand header, footer, navigation language, KPI callouts, graphs, and operational tables.",
    intent: "Stress-tests data density, table styling, graph color use, and executive reporting patterns.",
  },
  {
    id: "six-slide-deck",
    title: "Six Page Slide Deck",
    shortTitle: "Slide Deck",
    type: "deck",
    description:
      "A six-slide presentation system using the extracted logo, brand colors, typography, section dividers, and visual rhythm.",
    intent: "Checks whether the brand system can support presentation narrative, cover slides, charts, and closing pages.",
  },
  {
    id: "design-system-showcase",
    title: "Design System Showcase",
    shortTitle: "Showcase",
    type: "website",
    description:
      "A single long-form website page that displays the extracted design system as a living, branded specimen.",
    intent: "Verifies tokens, components, editorial hierarchy, forms, cards, image usage, and responsive section rhythm.",
  },
  {
    id: "campaign-landing",
    title: "Campaign Landing Page",
    shortTitle: "Campaign",
    type: "website",
    description:
      "A one-page campaign or product launch experience built from the same header, footer, calls to action, and content modules.",
    intent: "Tests whether the brand can produce a persuasive marketing page without drifting from its system.",
  },
  {
    id: "brand-identity-poster",
    title: "Brand Identity Poster",
    shortTitle: "Poster",
    type: "poster",
    description:
      "A one-page poster that turns the extracted identity into a focused visual specimen.",
    intent: "Checks bold type, color authority, logo treatment, composition, and brand recognizability.",
  },
] as const;

export async function getTestCases(slug: string): Promise<BrandTestCaseManifest> {
  const context = await loadBrandContext(slug);
  const existing = await readManifest(slug);
  const { generator, modelControl } = await resolveTestCaseGeneratorSettings(slug);
  return mergeManifest(slug, context.sourceHash, existing, await readFeedback(slug), context.packageQuality, generator, modelControl);
}

async function runScenarioVisualEval(
  slug: string,
  caseId: string
): Promise<TestCaseVisualEval | null> {
  // The dev server serves the scenario with working /brands/... asset paths,
  // which a file:// screenshot would lose. Prefer an explicit eval base URL,
  // then PORTLESS_URL, then the plain localhost port the server listens on.
  const base =
    process.env.SCENARIO_EVAL_BASE_URL ||
    process.env.PORTLESS_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  const url = `${base}/api/brands/${slug}/test-cases/${caseId}`;
  const outDir = path.join(LIBRARY_ROOT, "brands", slug, "test-cases");
  const script = path.join(REPO_ROOT, "scripts", "evaluate_scenario_visual.py");
  try {
    const { stdout } = await execFileAsync(
      "python3",
      [script, "--url", url, "--brand", slug, "--case-id", caseId, "--out-dir", outDir],
      { maxBuffer: 4 * 1024 * 1024, timeout: 90000 }
    );
    const result = JSON.parse((stdout || "").trim().split("\n").pop() || "{}") as {
      score?: number | null;
      status?: string;
      blank?: boolean;
      screenshot?: string | null;
      checks?: TestCaseVisualEvalCheck[];
      dominant?: TestCaseVisualDominant[];
    };
    if (!result || result.status !== "ok" || typeof result.score !== "number") return null;
    return {
      score: result.score,
      blank: Boolean(result.blank),
      screenshot: result.screenshot ?? null,
      checks: Array.isArray(result.checks) ? result.checks : [],
      dominant: Array.isArray(result.dominant) ? result.dominant : [],
    };
  } catch {
    return null;
  }
}

export async function generateTestCases(
  slug: string,
  options: { caseId?: string; mode?: "all" | "missing" | "one" } = {}
): Promise<BrandTestCaseManifest> {
  const context = await loadBrandContext(slug);
  const { generator, modelControl, selection } = await resolveTestCaseGeneratorSettings(slug);
  const feedback = await readFeedback(slug);
  const current = mergeManifest(
    slug,
    context.sourceHash,
    await readManifest(slug),
    feedback,
    context.packageQuality,
    generator,
    modelControl
  );
  const mode = options.mode ?? (options.caseId ? "one" : "missing");
  const now = new Date().toISOString();
  const targetIds = new Set<string>(
    TEST_CASE_DEFINITIONS
      .filter((definition) => {
        if (options.caseId) return definition.id === options.caseId;
        if (mode === "all") return true;
        const currentCase = current.cases.find((item) => item.id === definition.id);
        return !currentCase || currentCase.status !== "completed";
      })
      .map((definition) => definition.id)
  );

  const casesDir = getCasesDir(slug);
  await fs.mkdir(casesDir, { recursive: true });
  const targetCaseIds = Array.from(targetIds);

  let modelGenerationError: string | null = null; // precondition block (missing evidence / disabled provider)
  let briefGenerationError: string | null = null; // model run failed — degrade to default render, do not block
  let briefsByCase = new Map<string, GeneratedTestCaseBrief>();
  if (targetCaseIds.length > 0) {
    const criticalFailures = context.packageQuality.checks.filter(
      (check) => check.required && check.status === "fail"
    );
    if (criticalFailures.length > 0) {
      modelGenerationError = `Brand package is missing required identity evidence: ${criticalFailures
        .map((check) => check.label)
        .join(", ")}. Regenerate or repair DESIGN.md/SKILL.md/assets before creating test cases.`;
    } else if (!generator.enabled) {
      modelGenerationError = `Selected model provider is disabled: ${generator.provider_label}. Use Settings or a project override to choose an enabled provider.`;
    } else {
      try {
        briefsByCase = await runModelTestCaseGenerator(context, targetCaseIds, casesDir, generator, selection);
      } catch (error) {
        // The model run failed (timeout/non-JSON/etc). Don't abort — render
        // every scenario with default content so reviewers see something + an
        // eval, and surface the failure as a per-case note.
        briefGenerationError = error instanceof Error ? error.message : "Model test case generation failed";
      }
    }
  }

  const cases: BrandTestCase[] = [];
  for (const item of current.cases) {
    if (!targetIds.has(item.id)) {
      cases.push(item);
      continue;
    }

    try {
      if (modelGenerationError) {
        throw new Error(modelGenerationError);
      }
      const brief = briefsByCase.get(item.id);
      const filePath = path.join(casesDir, item.file);
      await fs.writeFile(filePath, renderTestCase(context, item.id, brief), "utf-8");
      const html = await fs.readFile(filePath, "utf-8");
      const evaluation = evaluateTestCase(context, item.id, html);
      const blockerLabels = evaluation.checks
        .filter((c) => c.required && c.status === "fail")
        .map((c) => c.label);
      const blocked = blockerLabels.length > 0;
      const visual = await runScenarioVisualEval(slug, item.id).catch(() => null);
      // If the model brief failed, still render (default content) and surface the
      // failure as a note so the page is never "all broken" while the model is.
      const note =
        !brief && briefGenerationError
          ? `Rendered with default content — the model brief failed: ${briefGenerationError}`
          : null;
      cases.push({
        ...item,
        status: blocked ? "failed" : "completed",
        generated_at: blocked ? item.generated_at : now,
        updated_at: now,
        source_hash: context.sourceHash,
        feedback_count: item.feedback_count,
        last_feedback_at: item.last_feedback_at,
        error: blocked ? `Missing required brand evidence: ${blockerLabels.join(", ")}.` : note,
        eval: evaluation,
        visual_eval: visual,
      });
    } catch (error) {
      cases.push({
        ...item,
        status: "failed",
        updated_at: now,
        source_hash: context.sourceHash,
        feedback_count: item.feedback_count,
        last_feedback_at: item.last_feedback_at,
        error: error instanceof Error ? error.message : "Generation failed",
        eval: item.eval ?? null,
        visual_eval: item.visual_eval ?? null,
      });
    }
  }

  const manifest: BrandTestCaseManifest = {
    version: 1,
    brand_slug: slug,
    source_hash: context.sourceHash,
    generated_at: cases.every((item) => item.status === "completed") ? now : current.generated_at,
    updated_at: now,
    generator,
    model_control: modelControl,
    package_quality: context.packageQuality,
    cases,
  };
  await writeManifest(slug, manifest);
  return manifest;
}

export async function addTestCaseFeedback(
  slug: string,
  input: {
    caseId: string;
    target: "design_md" | "skill" | "both";
    sentiment: "works" | "needs_work";
    note: string;
  }
): Promise<BrandTestCaseManifest> {
  const definition = TEST_CASE_DEFINITIONS.find((item) => item.id === input.caseId);
  if (!definition) throw new Error("Unknown test case");
  const note = input.note.trim();
  if (!note) throw new Error("Feedback note is required");

  const now = new Date().toISOString();
  const feedback: TestCaseFeedback = {
    id: createHash("sha1").update(`${input.caseId}:${now}:${note}`).digest("hex").slice(0, 12),
    case_id: input.caseId,
    target: input.target,
    sentiment: input.sentiment,
    note,
    created_at: now,
  };
  await fs.mkdir(getCasesDir(slug), { recursive: true });
  await fs.appendFile(getFeedbackPath(slug), `${JSON.stringify(feedback)}\n`, "utf-8");
  await writeFeedbackSummary(slug, await readFeedback(slug));
  return getTestCases(slug);
}

export async function setTestCaseModelOverride(
  slug: string,
  input: {
    useDefault?: boolean;
    providerId?: string;
    model?: string;
  }
): Promise<BrandTestCaseManifest> {
  if (input.useDefault) {
    await clearBrandTaskModelOverride(slug, "test_cases");
    return getTestCases(slug);
  }

  if (!input.providerId) {
    throw new Error("Provider is required for a project model override");
  }

  await setBrandTaskModelOverride(slug, "test_cases", {
    provider_id: input.providerId,
    model: input.model,
  });
  return getTestCases(slug);
}

export async function readTestCaseHtml(
  slug: string,
  caseId: string
): Promise<string | null> {
  const definition = TEST_CASE_DEFINITIONS.find((item) => item.id === caseId);
  if (!definition) return null;
  const filePath = path.join(getCasesDir(slug), `${definition.id}.html`);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

async function loadBrandContext(slug: string): Promise<BrandContext> {
  const brandDir = path.join(LIBRARY_ROOT, "brands", slug);
  const cacheDir = path.join(LIBRARY_ROOT, "cache", slug);
  const metadata = await readJson(path.join(brandDir, "metadata.json"));
  const tokens = await readJson(path.join(brandDir, "design-tokens.json"));
  const validation = await readJson(path.join(brandDir, "validation", "report.json"));
  const componentManifest = await readJson(path.join(brandDir, "component-manifest.json"));
  const designMd = await readText(path.join(brandDir, "DESIGN.md"));
  const skillMd = await readText(path.join(brandDir, "skill", "SKILL.md"));
  const sourceHash = await computeSourceHash(brandDir, cacheDir);
  const domDocs = await readDomDocuments(cacheDir);
  const assets = await listBrandAssets(slug, brandDir, cacheDir, metadata, domDocs);
  const navLabels = collectDomLabels(domDocs, "header", 8);
  const brandMarkLabel = collectBrandMarkLabel(domDocs, navLabels);
  const footerLinks = collectDomLabels(domDocs, "footer", 8);
  const footerAnatomy = collectFooterAnatomy(domDocs, footerLinks);
  const componentEvidence = extractComponentEvidence(componentManifest);
  const palette = extractPalette(tokens);
  const fonts = extractFonts(tokens);
  const fontFaces = await listBrandFontFaces(slug, brandDir, cacheDir, metadata, fonts);
  const pageNames = Object.keys(
    (validation.pixel_comparison_viewport as JsonRecord | undefined) ?? {}
  );

  const context: BrandContext = {
    slug,
    name: stringValue(metadata.name) || titleFromSlug(slug),
    sourceUrl: stringValue(metadata.source_url) || "",
    extractedAt: stringValue(metadata.extracted_at) || "",
    categories: arrayOfStrings(metadata.categories),
    score: typeof metadata.overall_score === "number" ? metadata.overall_score : null,
    designMd,
    skillMd,
    designSignals: extractSignals(designMd, 5),
    skillSignals: extractSignals(skillMd, 4),
    tokens,
    palette,
    fonts,
    fontFaces,
    logoSrc: assets.logoSrc,
    lightLogoSrc: assets.lightLogoSrc,
    brandMarkLabel,
    imageSrcs: assets.imageSrcs,
    navLabels,
    footerLinks,
    footerColumns: footerAnatomy.footerColumns,
    footerAboutText: footerAnatomy.footerAboutText,
    footerAcknowledgement: footerAnatomy.footerAcknowledgement,
    footerCopyright: footerAnatomy.footerCopyright,
    componentEvidence,
    pageNames: pageNames.length > 0 ? pageNames : ["homepage"],
    packageQuality: emptyPackageQuality(),
    sourceHash,
  };
  context.packageQuality = buildPackageQuality(context);
  return context;
}

async function readManifest(slug: string): Promise<BrandTestCaseManifest | null> {
  try {
    const raw = await fs.readFile(getManifestPath(slug), "utf-8");
    return JSON.parse(raw) as BrandTestCaseManifest;
  } catch {
    return null;
  }
}

async function readFeedback(slug: string): Promise<TestCaseFeedback[]> {
  try {
    const raw = await fs.readFile(getFeedbackPath(slug), "utf-8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as TestCaseFeedback);
  } catch {
    return [];
  }
}

async function writeFeedbackSummary(
  slug: string,
  feedback: TestCaseFeedback[]
): Promise<void> {
  const byCase = new Map<string, TestCaseFeedback[]>();
  for (const item of feedback) {
    byCase.set(item.case_id, [...(byCase.get(item.case_id) ?? []), item]);
  }
  const lines = [
    "# Test Case Feedback",
    "",
    "Use these notes to improve DESIGN.md and skill/SKILL.md for this brand.",
    "",
  ];
  for (const definition of TEST_CASE_DEFINITIONS) {
    const items = byCase.get(definition.id) ?? [];
    lines.push(`## ${definition.title}`);
    if (items.length === 0) {
      lines.push("", "No feedback yet.", "");
      continue;
    }
    for (const item of items) {
      lines.push(
        `- ${item.created_at} [${item.sentiment}; target: ${item.target}] ${item.note}`
      );
    }
    lines.push("");
  }
  await fs.writeFile(
    path.join(getCasesDir(slug), "feedback-summary.md"),
    lines.join("\n"),
    "utf-8"
  );
}

async function writeManifest(slug: string, manifest: BrandTestCaseManifest): Promise<void> {
  await fs.mkdir(getCasesDir(slug), { recursive: true });
  await fs.writeFile(getManifestPath(slug), JSON.stringify(manifest, null, 2), "utf-8");
}

function mergeManifest(
  slug: string,
  sourceHash: string,
  manifest: BrandTestCaseManifest | null,
  feedback: TestCaseFeedback[],
  packageQuality: BrandPackageQuality,
  generator: TestCaseGeneratorConfig,
  modelControl: TestCaseModelControl
): BrandTestCaseManifest {
  const byId = new Map((manifest?.cases ?? []).map((item) => [item.id, item]));
  const manifestGeneratorChanged = Boolean(manifest) && (
    manifest?.generator?.version !== generator.version ||
    manifest?.generator?.provider !== generator.provider ||
    manifest?.generator?.provider_type !== generator.provider_type ||
    manifest?.generator?.agent !== generator.agent ||
    manifest?.generator?.model !== generator.model
  );
  const feedbackByCase = new Map<string, TestCaseFeedback[]>();
  for (const item of feedback) {
    feedbackByCase.set(item.case_id, [...(feedbackByCase.get(item.case_id) ?? []), item]);
  }
  const cases = TEST_CASE_DEFINITIONS.map((definition) => {
    const existing = byId.get(definition.id);
    const caseFeedback = feedbackByCase.get(definition.id) ?? [];
    const latestFeedback = caseFeedback[caseFeedback.length - 1];
    const completed = existing?.status === "completed";
    const sourceChanged = completed && existing.source_hash !== sourceHash;
    const generatorChanged = completed && manifestGeneratorChanged;
    return {
      id: definition.id,
      title: definition.title,
      shortTitle: definition.shortTitle,
      type: definition.type,
      description: definition.description,
      intent: definition.intent,
      route: `/api/brands/${slug}/test-cases/${definition.id}`,
      file: `${definition.id}.html`,
      status: sourceChanged || generatorChanged ? "stale" : existing?.status ?? "pending",
      generated_at: existing?.generated_at ?? null,
      updated_at: existing?.updated_at ?? null,
      source_hash: existing?.source_hash ?? null,
      feedback_count: caseFeedback.length,
      last_feedback_at: latestFeedback?.created_at ?? null,
      error: existing?.error ?? null,
    } satisfies BrandTestCase;
  });

  return {
    version: 1,
    brand_slug: slug,
    source_hash: sourceHash,
    generated_at: manifest?.generated_at ?? null,
    updated_at: manifest?.updated_at ?? new Date().toISOString(),
    generator,
    model_control: modelControl,
    package_quality: packageQuality,
    cases,
  };
}

async function computeSourceHash(brandDir: string, cacheDir: string): Promise<string> {
  const hash = createHash("sha256");
  const directFiles = [
    path.join(brandDir, "DESIGN.md"),
    path.join(brandDir, "design-tokens.json"),
    path.join(brandDir, "design-tokens.css"),
    path.join(brandDir, "metadata.json"),
    path.join(brandDir, "skill", "SKILL.md"),
    path.join(brandDir, "component-manifest.json"),
    path.join(brandDir, "validation", "report.json"),
    path.join(cacheDir, "validation", "component-report.json"),
  ];

  for (const filePath of directFiles) {
    await addFileToHash(hash, filePath);
  }
  await addDirToHash(hash, path.join(cacheDir, "dom-extraction"), true);
  await addDirToHash(hash, path.join(cacheDir, "assets"), false);
  return hash.digest("hex").slice(0, 16);
}

async function addDirToHash(
  hash: ReturnType<typeof createHash>,
  dirPath: string,
  readContents: boolean
): Promise<void> {
  let entries: string[];
  try {
    entries = await walkFiles(dirPath);
  } catch {
    return;
  }
  for (const filePath of entries.sort()) {
    hash.update(path.relative(dirPath, filePath));
    if (readContents) {
      await addFileToHash(hash, filePath);
    } else {
      try {
        const stat = await fs.stat(filePath);
        hash.update(`${stat.size}:${Math.round(stat.mtimeMs)}`);
      } catch {
        // ignore deleted files during hashing
      }
    }
  }
}

async function addFileToHash(
  hash: ReturnType<typeof createHash>,
  filePath: string
): Promise<void> {
  try {
    hash.update(filePath);
    hash.update(await fs.readFile(filePath));
  } catch {
    hash.update(`${filePath}:missing`);
  }
}

async function walkFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      result.push(fullPath);
    }
  }
  return result;
}

async function listBrandAssets(
  slug: string,
  brandDir: string,
  cacheDir: string,
  metadata: JsonRecord,
  domDocs: JsonRecord[]
): Promise<{ logoSrc: string | null; lightLogoSrc: string | null; imageSrcs: string[] }> {
  const candidates: AssetCandidate[] = [];
  const brandAssetsDir = path.join(brandDir, "assets");
  const cacheAssetsDir = path.join(cacheDir, "assets");
  const publicRoot = path.join(REPO_ROOT, "ui", "public", "brands");
  const publicAliases = getPublicBrandAliases(slug, metadata);

  await addAssetCandidates(candidates, brandAssetsDir, `/api/brands/${slug}/file/assets`);
  await addAssetCandidates(candidates, cacheAssetsDir, `/api/brands/${slug}/file/assets`);
  for (const alias of publicAliases) {
    await addAssetCandidates(candidates, path.join(publicRoot, alias), `/brands/${alias}`);
  }

  const logoEvidence = collectLogoEvidence(domDocs);
  const logo = chooseLogoAsset(candidates, logoEvidence, slug, metadata, false);
  const lightLogo = chooseLogoAsset(candidates, logoEvidence, slug, metadata, true) ?? logo;
  const imageSrcs = candidates
    .filter((asset) => !asset.isLogo && /\.(png|jpe?g|webp|gif|svg)$/i.test(asset.name))
    .sort((a, b) => imageAssetPriority(a.name) - imageAssetPriority(b.name))
    .slice(0, 12)
    .map((asset) => asset.src);

  return { logoSrc: logo?.src ?? null, lightLogoSrc: lightLogo?.src ?? null, imageSrcs };
}

function collectLogoEvidence(documents: JsonRecord[]): string[] {
  const values: string[] = [];
  for (const document of documents) {
    const header = asRecord(document.header);
    const footer = asRecord(document.footer);
    pushLogoValue(values, header.logo);
    pushLogoValue(values, footer.logo);
    for (const image of arrayOfRecords(header.logoImages)) pushLogoValue(values, image);
    for (const image of arrayOfRecords(header.images)) pushLogoValue(values, image);
  }
  return uniqueStrings(values);
}

function pushLogoValue(values: string[], value: unknown): void {
  if (typeof value === "string") {
    if (value.trim()) values.push(value.trim());
    return;
  }
  const record = asRecord(value);
  for (const key of ["localFile", "src", "href"]) {
    const text = stringValue(record[key]);
    if (text) values.push(text);
  }
}

function chooseLogoAsset(
  candidates: AssetCandidate[],
  logoEvidence: string[],
  slug: string,
  metadata: JsonRecord,
  light: boolean
): AssetCandidate | null {
  const logoCandidates = candidates.filter((asset) => asset.isLogo);
  if (logoCandidates.length === 0) return null;
  const scored = logoCandidates
    .filter((asset) => !light || /white|light|reverse|footer/i.test(asset.name))
    .map((asset) => ({
      asset,
      score: scoreLogoCandidate(asset, logoEvidence, slug, metadata, light),
    }))
    .sort((a, b) => a.score - b.score || a.asset.rel.localeCompare(b.asset.rel));
  return scored[0]?.asset ?? null;
}

function scoreLogoCandidate(
  asset: AssetCandidate,
  logoEvidence: string[],
  slug: string,
  metadata: JsonRecord,
  light: boolean
): number {
  const name = asset.name.toLowerCase();
  const rel = asset.rel.toLowerCase();
  let score = 100;
  if (/\.svg$/i.test(name)) score -= 10;
  if (asset.src.startsWith("/brands/")) score -= 4;
  if (light && /white|light|reverse|footer/i.test(name)) score -= 25;
  if (!light && /white|light|reverse|footer/i.test(name)) score += 20;
  if (name === "logo.svg") score -= 35;
  if (name === "logo-white.svg" || name === "logo-light.svg") score -= 30;

  const brandKeys = brandAssetKeys(slug, metadata);
  if (brandKeys.some((key) => name.includes(key) || rel.includes(key))) score -= 28;

  const matchedEvidence = logoEvidence.some((evidence) => {
    const evidencePath = normalizeAssetPath(evidence);
    const evidenceName = evidencePath.split("/").pop() ?? "";
    return Boolean(
      evidencePath &&
        (rel.endsWith(evidencePath) ||
          asset.src.toLowerCase().endsWith(evidencePath) ||
          (evidenceName && name === evidenceName))
    );
  });
  if (matchedEvidence) score -= 60;
  if (looksLikeClientLogo(asset, brandKeys, matchedEvidence)) score += 80;
  return score;
}

function looksLikeClientLogo(asset: AssetCandidate, brandKeys: string[], matchedEvidence: boolean): boolean {
  if (matchedEvidence) return false;
  const name = asset.name.toLowerCase();
  if (!/logo[-_]/.test(name) && !/[-_]logo/.test(name)) return false;
  if (brandKeys.some((key) => name.includes(key))) return false;
  return !/^logo(\.(svg|png|jpe?g|webp|gif)|-(white|light|reverse|footer)\.)/i.test(name);
}

function brandAssetKeys(slug: string, metadata: JsonRecord): string[] {
  const sourceHost = (() => {
    try {
      return new URL(stringValue(metadata.source_url)).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  const raw = [slug, slug.replace(/-com(-au)?$/, ""), slug.split("-")[0], stringValue(metadata.name), sourceHost.split(".")[0]];
  return uniqueStrings(
    raw
      .flatMap((value) => value.split(/[^a-z0-9]+/i))
      .map((value) => value.toLowerCase())
      .filter((value) => value.length >= 3)
  );
}

function normalizeAssetPath(value: string): string {
  const lower = value.toLowerCase().split("#")[0].split("?")[0];
  try {
    const url = new URL(lower);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return lower
      .replace(/^\/+/, "")
      .replace(/^brands\/[^/]+\//, "")
      .replace(/^api\/brands\/[^/]+\/file\/assets\//, "");
  }
}

function imageAssetPriority(name: string): number {
  const lower = name.toLowerCase();
  if (/hero|banner|staff|store|team|office|impact|nature|community|contact/.test(lower)) return 0;
  if (/\.(jpe?g|webp)$/i.test(lower)) return 1;
  if (/divider|icon|logo|brand|agw|bigw|quantium|cartology|wpay|mydeal|milkrun/.test(lower)) return 4;
  if (/\.svg$/i.test(lower)) return 5;
  return 2;
}

function getPublicBrandAliases(slug: string, metadata: JsonRecord): string[] {
  const aliases = new Set<string>([slug]);
  const sourceUrl = stringValue(metadata.source_url);
  const name = stringValue(metadata.name);
  if (sourceUrl) {
    try {
      const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
      aliases.add(host.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase());
      aliases.add(host.split(".")[0]?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ?? "");
    } catch {
      // Ignore malformed source URLs.
    }
  }
  if (name) {
    aliases.add(name.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase());
  }
  for (const alias of Array.from(aliases)) {
    if (alias.endsWith("-com-au")) aliases.add(alias.replace(/-com-au$/, ""));
    if (alias.endsWith("group")) aliases.add(`${alias.slice(0, -"group".length)}-group`.replace(/--+/g, "-"));
    if (alias.includes("group-com-au")) aliases.add(alias.replace("group-com-au", "group"));
  }
  return Array.from(aliases).filter(Boolean);
}

async function addAssetCandidates(
  candidates: AssetCandidate[],
  dirPath: string,
  srcPrefix: string
): Promise<void> {
  let files: string[];
  try {
    files = await walkFiles(dirPath);
  } catch {
    return;
  }
  for (const filePath of files) {
    const rel = path.relative(dirPath, filePath).split(path.sep).join("/");
    if (rel.includes("screenshots/") || rel.includes("fonts/")) continue;
    if (!/\.(svg|png|jpe?g|webp|gif)$/i.test(rel)) continue;
    const name = path.basename(rel);
    candidates.push({
      name,
      rel,
      src: `${srcPrefix}/${rel}`,
      isLogo: /logo|wordmark|lockup|brand-mark|mark/i.test(name),
    });
  }
}

async function listBrandFontFaces(
  slug: string,
  brandDir: string,
  cacheDir: string,
  metadata: JsonRecord,
  fonts: BrandContext["fonts"]
): Promise<FontFaceAsset[]> {
  const targets = uniqueStrings([fonts.heading, fonts.body].map((font) => font.replaceAll("\"", "")));
  const candidates: Array<{ name: string; src: string }> = [];
  const publicRoot = path.join(REPO_ROOT, "ui", "public", "brands");
  const publicAliases = getPublicBrandAliases(slug, metadata);
  await addFontCandidates(candidates, path.join(brandDir, "assets", "fonts"), `/api/brands/${slug}/file/assets/fonts`);
  await addFontCandidates(candidates, path.join(cacheDir, "assets", "fonts"), `/api/brands/${slug}/file/assets/fonts`);
  for (const alias of publicAliases) {
    await addFontCandidates(candidates, path.join(publicRoot, alias, "fonts"), `/brands/${alias}/fonts`);
  }

  const faces: FontFaceAsset[] = [];
  for (const family of targets) {
    const normalizedFamily = normalizeFontKey(family);
    if (!normalizedFamily || /arial|helvetica|roboto|sansserif|serif|monospace/.test(normalizedFamily)) continue;
    const match = candidates
      .map((candidate) => ({ candidate, score: scoreFontCandidate(candidate.name, normalizedFamily) }))
      .filter((item) => item.score < 100)
      .sort((a, b) => a.score - b.score || a.candidate.name.localeCompare(b.candidate.name))[0]?.candidate;
    if (match) {
      faces.push({
        family,
        src: match.src,
        weight: fontWeightFromName(match.name),
      });
    }
  }
  return faces;
}

async function addFontCandidates(
  candidates: Array<{ name: string; src: string }>,
  dirPath: string,
  srcPrefix: string
): Promise<void> {
  let files: string[];
  try {
    files = await walkFiles(dirPath);
  } catch {
    return;
  }
  for (const filePath of files) {
    const rel = path.relative(dirPath, filePath).split(path.sep).join("/");
    if (!/\.(woff2?|ttf|otf)$/i.test(rel)) continue;
    candidates.push({ name: path.basename(rel), src: `${srcPrefix}/${rel}` });
  }
}

function scoreFontCandidate(name: string, normalizedFamily: string): number {
  const normalizedName = normalizeFontKey(name.replace(/\.(woff2?|ttf|otf)$/i, ""));
  if (normalizedName === normalizedFamily) return 0;
  if (normalizedName.includes(normalizedFamily) || normalizedFamily.includes(normalizedName)) return 10;
  const compactFamily = normalizedFamily.replace(/(regular|medium|light|bold|webfont)$/g, "");
  if (compactFamily && normalizedName.includes(compactFamily)) return 20;
  return 100;
}

function normalizeFontKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fontWeightFromName(name: string): number {
  const lower = name.toLowerCase();
  if (/bold|black|heavy/.test(lower)) return 700;
  if (/medium|semi/.test(lower)) return 500;
  if (/light|thin/.test(lower)) return 300;
  return 400;
}

async function readDomDocuments(cacheDir: string): Promise<JsonRecord[]> {
  let files: string[];
  try {
    files = await walkFiles(path.join(cacheDir, "dom-extraction"));
  } catch {
    return [];
  }

  const documents: JsonRecord[] = [];
  for (const filePath of files) {
    if (!filePath.endsWith(".json") || filePath.endsWith("-measurements.json")) continue;
    documents.push(await readJson(filePath));
    if (documents.length >= 8) break;
  }
  return documents;
}

function collectDomLabels(
  documents: JsonRecord[],
  key: "header" | "footer",
  limit: number
): string[] {
  const labels: string[] = [];
  for (const document of documents) {
    collectReadableText(asRecord(document[key]), labels, limit * 3);
    for (const section of collectIdentitySections(document, key)) {
      collectSectionLabels(section, labels, limit * 3);
    }
  }
  return uniqueStrings(labels).slice(0, limit);
}

function collectIdentitySections(document: JsonRecord, key: "header" | "footer"): JsonRecord[] {
  const sections = Array.isArray(document.sections) ? document.sections : [];
  return sections
    .map((section) => asRecord(section))
    .filter((section) => {
      const tag = stringValue(section.tag).toLowerCase();
      const role = stringValue(section.role).toLowerCase();
      const className = stringValue(section.className).toLowerCase();
      if (key === "header") {
        return tag === "header" || tag === "nav" || role === "banner" || role === "navigation" || className.includes("nav");
      }
      return tag === "footer" || role === "contentinfo" || className.includes("footer");
    });
}

function collectSectionLabels(section: JsonRecord, labels: string[], limit: number): void {
  collectReadableText(section.links, labels, limit);
  collectReadableText(section.images, labels, limit);
  const textItems = Array.isArray(section.text) ? section.text : [];
  for (const item of textItems) {
    const text = typeof item === "string" ? item.trim().replace(/\s+/g, " ") : "";
    if (isReadableFooterText(text)) labels.push(text);
    if (labels.length >= limit) return;
  }
}

function collectBrandMarkLabel(documents: JsonRecord[], navLabels: string[]): string | null {
  for (const document of documents) {
    for (const section of collectIdentitySections(document, "header")) {
      const links = Array.isArray(section.links) ? section.links.map((item) => asRecord(item)) : [];
      const homeLink = links.find((item) => {
        const href = stringValue(item.href);
        return href.endsWith("/") || /\/(home)?$/i.test(href);
      }) ?? links[0];
      const text = stringValue(homeLink?.text).trim();
      if (isReadableLabel(text)) return text;
    }
  }
  return navLabels[0] ?? null;
}

function extractComponentEvidence(manifest: JsonRecord): ComponentEvidence {
  const components = Array.isArray(manifest.components)
    ? manifest.components.map((item) => asRecord(item))
    : [];
  const readyStatuses = new Set(["ready", "verified", "matched", "ok", "pass", "completed"]);
  const readyComponents = components.filter((component) => {
    const status = stringValue(component.status).toLowerCase();
    return !status || readyStatuses.has(status);
  });
  const textFor = (component: JsonRecord): string =>
    [
      stringValue(component.type),
      stringValue(component.name),
      stringValue(component.library_file),
      arrayOfStrings(component.source_pages).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  const readyByPattern = (pattern: RegExp) => readyComponents.find((component) =>
    pattern.test(textFor(component))
  );
  const headerComponent = readyByPattern(/\b(header|masthead|top\s*bar|hero)\b/);
  const navigationComponent = readyByPattern(/\b(nav|navigation|menu|tabs?|header|masthead|hero)\b/);
  const footerComponent = readyByPattern(/\bfooter|contentinfo|social|sponsor\b/);
  const logoComponent = readyByPattern(/\b(logo|wordmark|brand\s*mark|brand|hero|header)\b/);
  const detailFor = (component: JsonRecord | undefined, fallback: string): string => {
    if (!component) return "";
    return stringValue(component.library_file) || stringValue(component.name) || stringValue(component.type) || fallback;
  };
  return {
    header: Boolean(headerComponent),
    navigation: Boolean(navigationComponent),
    footer: Boolean(footerComponent),
    logo: Boolean(logoComponent),
    details: {
      header: detailFor(headerComponent, "header"),
      navigation: detailFor(navigationComponent, "navigation"),
      footer: detailFor(footerComponent, "footer"),
      logo: detailFor(logoComponent, "logo"),
    },
  };
}

function collectFooterAnatomy(documents: JsonRecord[], fallbackLinks: string[]): FooterAnatomy {
  let footerColumns: string[][] = [];
  let footerAboutText: string | null = null;
  let footerAcknowledgement: string | null = null;
  let footerCopyright: string | null = null;

  for (const document of documents) {
    const footer = asRecord(document.footer);
    if (Object.keys(footer).length === 0) continue;

    footerAboutText ||= stringValue(asRecord(footer.aboutUs).text) || findFooterTextByKey(footer, /about|mission|summary/);
    footerAcknowledgement ||= stringValue(footer.acknowledgementOfCountry) || findFooterTextByKey(footer, /acknowledg|reconciliation|traditional owner/);
    footerCopyright ||= stringValue(footer.copyright) || findFooterTextByKey(footer, /copyright|rights reserved|©/);

    const quickLinks = asRecord(footer.quickLinks);
    const linkColumns = Object.values(quickLinks)
      .map((value) => collectFooterLinkLabels(value, 12))
      .filter((items) => items.length > 0);
    if (linkColumns.length > footerColumns.length) footerColumns = linkColumns;

    const addresses = [
      collectAddressLines(asRecord(footer.postalAddress)),
      collectAddressLines(asRecord(footer.streetAddress)),
    ].filter((items) => items.length > 0);
    if (addresses.length > 0) {
      footerColumns = [...footerColumns, ...addresses].slice(0, 4);
    }

    for (const section of collectIdentitySections(document, "footer")) {
      const labels: string[] = [];
      collectSectionLabels(section, labels, 16);
      const linkLabels = Array.isArray(section.links)
        ? section.links.map((item) => stringValue(asRecord(item).text)).filter(isReadableLabel)
        : [];
      const textLabels = Array.isArray(section.text)
        ? section.text.filter((item): item is string => typeof item === "string").map((item) => item.trim().replace(/\s+/g, " ")).filter(isReadableFooterText)
        : [];
      if (linkLabels.length > 0) footerColumns.push(uniqueStrings(linkLabels));
      if (textLabels.length > 0) footerColumns.push(uniqueStrings(textLabels));
      footerAboutText ||= textLabels[0] ?? null;
      footerCopyright ||= textLabels.find((item) => /©|copyright|rights/i.test(item)) ?? null;
      if (labels.length > 0 && footerColumns.length === 0) {
        footerColumns.push(uniqueStrings(labels));
      }
    }

    if (footerColumns.length > 0 && (footerAboutText || footerAcknowledgement || footerCopyright)) break;
  }

  if (footerColumns.length === 0 && fallbackLinks.length > 0) {
    footerColumns = chunkStrings(fallbackLinks, 4);
  }

  return {
    footerColumns: footerColumns.slice(0, 4),
    footerAboutText,
    footerAcknowledgement,
    footerCopyright,
  };
}

function collectFooterLinkLabels(value: unknown, limit: number): string[] {
  const labels: string[] = [];
  collectReadableText(value, labels, limit * 2);
  return uniqueStrings(labels)
    .filter((label) => !/^learn more$/i.test(label))
    .slice(0, limit);
}

function collectAddressLines(record: JsonRecord): string[] {
  const lines = arrayOfStrings(record.lines);
  return lines.length > 0 ? lines : [];
}

function findFooterTextByKey(value: unknown, pattern: RegExp): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFooterTextByKey(item, pattern);
      if (found) return found;
    }
    return null;
  }
  const record = value as JsonRecord;
  for (const [key, item] of Object.entries(record)) {
    const text = stringValue(item).trim();
    if (text && (pattern.test(key) || pattern.test(text)) && text.length > 16 && text.length < 1000) {
      return text;
    }
    const found = findFooterTextByKey(item, pattern);
    if (found) return found;
  }
  return null;
}

function chunkStrings(values: string[], chunkCount: number): string[][] {
  const unique = uniqueStrings(values);
  const perChunk = Math.max(1, Math.ceil(unique.length / chunkCount));
  const chunks: string[][] = [];
  for (let index = 0; index < unique.length; index += perChunk) {
    chunks.push(unique.slice(index, index + perChunk));
  }
  return chunks;
}

function collectReadableText(value: unknown, labels: string[], limit: number): void {
  if (labels.length >= limit) return;
  if (Array.isArray(value)) {
    for (const item of value) collectReadableText(item, labels, limit);
    return;
  }
  if (!value || typeof value !== "object") return;

  const record = value as JsonRecord;
  for (const key of ["text", "label", "title", "alt", "heading", "name"]) {
    const text = stringValue(record[key]).trim();
    if (isReadableLabel(text)) labels.push(text);
  }
  for (const item of Object.values(record)) {
    collectReadableText(item, labels, limit);
  }
}

function isReadableLabel(value: string): boolean {
  if (value.length < 2 || value.length > 64) return false;
  if (/^https?:\/\//i.test(value) || value.includes("/content/")) return false;
  if (/\.(svg|png|jpe?g|webp|gif)$/i.test(value)) return false;
  return /[\p{L}\p{N}]/u.test(value);
}

function isReadableFooterText(value: string): boolean {
  if (value.length < 2 || value.length > 180) return false;
  if (/^https?:\/\//i.test(value) || value.includes("/content/")) return false;
  return /[\p{L}\p{N}]/u.test(value);
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, " ");
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function emptyPackageQuality(): BrandPackageQuality {
  return {
    status: "needs_work",
    score: 0,
    summary: "Brand package quality has not been evaluated yet.",
    checks: [],
  };
}

function buildPackageQuality(context: BrandContext): BrandPackageQuality {
  const docs = `${context.designMd}\n${context.skillMd}`.toLowerCase();
  const designMd = context.designMd.toLowerCase();
  const skillMd = context.skillMd.toLowerCase();
  const tokenCoverage = summarizeTokenCoverage(context);
  const hasLogoEvidence = Boolean(context.logoSrc || context.brandMarkLabel || context.componentEvidence.logo);
  const hasFooterEvidence = Boolean(
    context.footerColumns.length >= 1 ||
    context.footerLinks.length >= 1 ||
    context.footerAboutText ||
    context.footerCopyright ||
    context.componentEvidence.footer
  );
  const checks: BrandPackageQualityCheck[] = [
    {
      id: "logo-asset",
      label: "Logo/wordmark",
      required: true,
      status: hasLogoEvidence ? "pass" : "fail",
      details: context.logoSrc
        ? `Logo source: ${context.logoSrc}`
        : context.brandMarkLabel
          ? `Source uses text wordmark: ${context.brandMarkLabel}`
          : context.componentEvidence.logo
            ? `Generated component evidence: ${context.componentEvidence.details.logo}`
            : "No extracted logo asset or source wordmark was found for this brand.",
    },
    {
      id: "header-navigation",
      label: "Header navigation",
      required: true,
      status: context.navLabels.length >= 3 || context.componentEvidence.navigation ? "pass" : "fail",
      details: context.navLabels.length > 0
        ? `Detected nav: ${context.navLabels.slice(0, 6).join(", ")}`
        : context.componentEvidence.navigation
          ? `Generated component evidence: ${context.componentEvidence.details.navigation}`
          : "No rendered header navigation labels were found in DOM extraction. Repair identity evidence before generating test cases.",
    },
    {
      id: "footer-system",
      label: "Footer system",
      required: true,
      status: hasFooterEvidence ? "pass" : "fail",
      details: context.footerColumns.length > 0
        ? `Detected ${context.footerColumns.length} extracted footer group${context.footerColumns.length === 1 ? "" : "s"}.`
        : context.footerLinks.length > 0
          ? `Detected footer labels: ${context.footerLinks.slice(0, 6).join(", ")}`
          : context.componentEvidence.footer
            ? `Generated component evidence: ${context.componentEvidence.details.footer}`
            : "No rendered footer labels were found in DOM extraction. Repair identity evidence before generating test cases.",
    },
    {
      id: "white-logo-asset",
      label: "White logo asset",
      required: false,
      status: context.lightLogoSrc && context.lightLogoSrc !== context.logoSrc ? "pass" : "warn",
      details: context.lightLogoSrc && context.lightLogoSrc !== context.logoSrc
        ? `White/reversed logo source: ${context.lightLogoSrc}`
        : "No separate white/reversed logo asset was found; dark footer/logo treatments may be less faithful.",
    },
    {
      id: "token-catalog",
      label: "Token catalog",
      required: true,
      status:
        Number(tokenCoverage.colors) >= 4 &&
        Number(tokenCoverage.typography) >= 4 &&
        Number(tokenCoverage.spacing) >= 4 &&
        Number(tokenCoverage.radii) >= 1
          ? "pass"
          : "fail",
      details: `colors ${tokenCoverage.colors}, typography ${tokenCoverage.typography}, spacing ${tokenCoverage.spacing}, radii ${tokenCoverage.radii}.`,
    },
    {
      id: "advanced-tokens",
      label: "Advanced tokens",
      required: false,
      status:
        Number(tokenCoverage.shadows) > 0 &&
        Number(tokenCoverage.breakpoints) > 0 &&
        Number(tokenCoverage.transitions) > 0
          ? "pass"
          : "warn",
      details: `shadows ${tokenCoverage.shadows}, breakpoints ${tokenCoverage.breakpoints}, transitions ${tokenCoverage.transitions}. Missing families are shown in the design-system test case.`,
    },
    {
      id: "brand-imagery",
      label: "Brand imagery",
      required: true,
      status: context.imageSrcs.length >= 1 ? "pass" : "fail",
      details: context.imageSrcs.length >= 1
        ? `${context.imageSrcs.length} reusable image assets found.`
        : "No reusable brand imagery was found. Repair assets before generating test cases.",
    },
    {
      id: "design-logo-header-footer",
      label: "DESIGN.md identity guidance",
      required: false,
      status: /logo/.test(designMd) && /header|navigation|nav/.test(designMd) && /footer/.test(designMd)
        ? "pass"
        : "warn",
      details: "DESIGN.md should explicitly document logo usage, header/nav behavior, and footer structure.",
    },
    {
      id: "skill-logo-header-footer",
      label: "SKILL.md identity guidance",
      required: false,
      status: /logo/.test(skillMd) && /header|navigation|nav/.test(skillMd) && /footer/.test(skillMd)
        ? "pass"
        : "warn",
      details: "SKILL.md should carry logo, header/nav, and footer rules so future agents do not lose brand identity.",
    },
    {
      id: "source-docs",
      label: "Source package docs",
      required: true,
      status: docs.includes("design system") && context.designMd.length > 200 ? "pass" : "fail",
      details: "DESIGN.md and SKILL.md must exist before scenario generation.",
    },
  ];
  const total = checks.length;
  const score = Math.round(
    (checks.reduce((sum, check) => {
      if (check.status === "pass") return sum + 1;
      if (check.status === "warn") return sum + 0.5;
      return sum;
    }, 0) / total) * 100
  );
  const failedRequired = checks.filter((check) => check.required && check.status === "fail");
  const warnings = checks.filter((check) => check.status === "warn");
  return {
    status: failedRequired.length === 0 && warnings.length === 0 ? "ready" : "needs_work",
    score,
    summary:
      failedRequired.length > 0
        ? `Missing required identity evidence: ${failedRequired.map((check) => check.label).join(", ")}.`
        : warnings.length > 0
          ? `Usable, but package documentation needs identity improvements: ${warnings.map((check) => check.label).join(", ")}.`
          : "Ready for model-backed scenario generation.",
    checks,
  };
}

async function readJson(filePath: string): Promise<JsonRecord> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as JsonRecord;
  } catch {
    return {};
  }
}

async function readText(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

function getCasesDir(slug: string): string {
  return path.join(LIBRARY_ROOT, "brands", slug, "test-cases");
}

function getFeedbackPath(slug: string): string {
  return path.join(getCasesDir(slug), "feedback.jsonl");
}

function getManifestPath(slug: string): string {
  return path.join(getCasesDir(slug), "manifest.json");
}

async function runModelTestCaseGenerator(
  context: BrandContext,
  caseIds: string[],
  casesDir: string,
  generator: TestCaseGeneratorConfig,
  selection: TaskModelSelection
): Promise<Map<string, GeneratedTestCaseBrief>> {
  if (generator.provider_type === "claude-code") {
    return runClaudeCodeTestCaseGenerator(context, caseIds, casesDir, generator);
  }
  if (generator.provider_type === "ollama") {
    return runOllamaTestCaseGenerator(context, caseIds, casesDir, generator, selection);
  }
  if (generator.provider_type === "local-openai") {
    return runOpenAICompatibleTestCaseGenerator(context, caseIds, casesDir, generator, selection);
  }
  if (CLI_TASK_RUNNER_PROVIDER_TYPES.has(generator.provider_type)) {
    return runCliTaskRunnerTestCaseGenerator(context, caseIds, casesDir, generator, selection);
  }
  throw new Error(
    `Test case generation is not wired for ${generator.provider_label} (${generator.provider_type}). Choose a supported provider in model settings.`
  );
}

async function runClaudeCodeTestCaseGenerator(
  context: BrandContext,
  caseIds: string[],
  casesDir: string,
  generator: TestCaseGeneratorConfig
): Promise<Map<string, GeneratedTestCaseBrief>> {
  const prompt = buildClaudeTestCasePrompt(context, caseIds, casesDir);
  const logPath = path.join(casesDir, "generation.log");
  const briefPath = path.join(casesDir, "generation-brief.json");
  const args = [
    "--print",
    "-p",
    prompt,
    "--output-format",
    "text",
    "--permission-mode",
    "bypassPermissions",
    "--allowedTools",
    "Read",
  ];
  if (generator.model && generator.model !== "default") {
    args.splice(1, 0, "--model", generator.model);
  }
  try {
    const result = await execFileAsync(
      "claude",
      args,
      {
        cwd: REPO_ROOT,
        timeout: CLAUDE_TEST_CASE_TIMEOUT_MS,
        maxBuffer: 8 * 1024 * 1024,
      }
    );
    await fs.writeFile(
      logPath,
      [
        `provider=${generator.provider}`,
        `provider_label=${generator.provider_label}`,
        `provider_type=${generator.provider_type}`,
        `agent=${generator.agent}`,
        `model=${generator.model}`,
        `model_source=${generator.model_source}`,
        `settings_integrated=${generator.settings_integrated}`,
        `project_override=${generator.project_override}`,
        `generated_at=${new Date().toISOString()}`,
        "",
        result.stdout,
        result.stderr,
      ].join("\n"),
      "utf-8"
    );
    const briefs = parseClaudeTestCaseBrief(result.stdout);
    await fs.writeFile(
      briefPath,
      JSON.stringify({ cases: Array.from(briefs.values()) }, null, 2),
      "utf-8"
    );
    return briefs;
  } catch (error) {
    const detail = formatClaudeGenerationError(error);
    await fs.writeFile(
      logPath,
      [
        `provider=${generator.provider}`,
        `provider_label=${generator.provider_label}`,
        `provider_type=${generator.provider_type}`,
        `agent=${generator.agent}`,
        `model=${generator.model}`,
        `model_source=${generator.model_source}`,
        `settings_integrated=${generator.settings_integrated}`,
        `project_override=${generator.project_override}`,
        `failed_at=${new Date().toISOString()}`,
        "",
        detail,
      ].join("\n"),
      "utf-8"
    );
    throw new Error(`Claude Code could not generate the requested test cases. ${detail}`);
  }
}

async function runOllamaTestCaseGenerator(
  context: BrandContext,
  caseIds: string[],
  casesDir: string,
  generator: TestCaseGeneratorConfig,
  selection: TaskModelSelection
): Promise<Map<string, GeneratedTestCaseBrief>> {
  const prompt = buildClaudeTestCasePrompt(context, caseIds, casesDir);
  const baseUrl = generator.base_url || "http://127.0.0.1:11434";
  const url = `${baseUrl.replace(/\/$/, "")}/api/generate`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: generator.model,
      prompt,
      stream: false,
      options: {
        temperature: selection.temperature ?? 0.2,
        num_ctx: selection.num_ctx ?? 32768,
      },
    }),
    signal: AbortSignal.timeout(Math.min(selection.timeout_seconds * 1000, CLAUDE_TEST_CASE_TIMEOUT_MS)),
  });
  const raw = await response.text();
  if (!response.ok) {
    await writeModelGenerationLog(casesDir, generator, raw, true);
    throw new Error(`Ollama could not generate the requested test cases. HTTP ${response.status}: ${raw.slice(0, 500)}`);
  }
  const parsed = safeJson(raw);
  const output = stringValue(parsed.response) || raw;
  await writeModelGenerationLog(casesDir, generator, output, false);
  return writeBriefsFromOutput(casesDir, output);
}

async function runOpenAICompatibleTestCaseGenerator(
  context: BrandContext,
  caseIds: string[],
  casesDir: string,
  generator: TestCaseGeneratorConfig,
  selection: TaskModelSelection
): Promise<Map<string, GeneratedTestCaseBrief>> {
  const prompt = buildClaudeTestCasePrompt(context, caseIds, casesDir);
  const baseUrl = generator.base_url || "http://localhost:1234/v1";
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const url = normalizedBaseUrl.endsWith("/v1")
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || "local"}`,
    },
    body: JSON.stringify({
      model: generator.model,
      temperature: selection.temperature ?? 0.2,
      messages: [
        { role: "system", content: "Return only compact JSON. No markdown." },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(Math.min(selection.timeout_seconds * 1000, CLAUDE_TEST_CASE_TIMEOUT_MS)),
  });
  const raw = await response.text();
  if (!response.ok) {
    await writeModelGenerationLog(casesDir, generator, raw, true);
    throw new Error(`OpenAI-compatible provider could not generate the requested test cases. HTTP ${response.status}: ${raw.slice(0, 500)}`);
  }
  const parsed = safeJson(raw);
  const choices = Array.isArray(parsed.choices) ? parsed.choices : [];
  const message = asRecord(asRecord(choices[0]).message);
  const output = stringValue(message.content) || raw;
  await writeModelGenerationLog(casesDir, generator, output, false);
  return writeBriefsFromOutput(casesDir, output);
}

async function runCliTaskRunnerTestCaseGenerator(
  context: BrandContext,
  caseIds: string[],
  casesDir: string,
  generator: TestCaseGeneratorConfig,
  selection: TaskModelSelection
): Promise<Map<string, GeneratedTestCaseBrief>> {
  // Generate one brief per case. Each prompt is tiny (a single scenario) so a
  // slow/agentic model converges quickly, and one stuck case cannot sink the
  // rest — cases without a brief fall back to the default template render and
  // are flagged by the eval instead of aborting the whole run.
  const briefs = new Map<string, GeneratedTestCaseBrief>();
  const failures: string[] = [];
  const perCaseTimeout = Math.min(selection.timeout_seconds * 1000, PERCASE_GENERATION_TIMEOUT_MS); // 3 min/case
  for (const caseId of caseIds) {
    const prompt = buildClaudeTestCasePrompt(context, [caseId], casesDir);
    const { command, args, cwd } = await buildCliTaskRunnerCommand(generator, prompt);
    try {
      const result = await runCliWithPty(command, args, cwd, perCaseTimeout);
      const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      const brief = parseClaudeTestCaseBrief(output).get(caseId);
      if (brief) {
        briefs.set(caseId, brief);
      } else {
        failures.push(`${caseId} (no JSON brief in output)`);
      }
      await writeModelGenerationLog(
        casesDir,
        generator,
        `[${caseId} ok]\n${output.slice(0, 4000)}`,
        false
      );
    } catch (error) {
      const detail = formatClaudeGenerationError(error);
      failures.push(`${caseId} (${detail})`);
      await writeModelGenerationLog(casesDir, generator, `[${caseId} failed] ${detail}`, true);
    }
  }
  await fs.writeFile(
    path.join(casesDir, "generation-brief.json"),
    JSON.stringify({ cases: Array.from(briefs.values()) }, null, 2),
    "utf-8"
  );
  if (briefs.size === 0) {
    throw new Error(
      `${generator.provider_label} produced no usable briefs — ${failures.length}/${caseIds.length} failed (${failures.join("; ")}). See test-cases/generation.log and switch to a faster model if this recurs.`
    );
  }
  return briefs;
}

async function buildCliTaskRunnerCommand(
  generator: TestCaseGeneratorConfig,
  prompt: string
): Promise<{ command: string; args: string[]; cwd: string }> {
  const command = generator.command || generator.provider_type;
  const model = generator.model && generator.model !== "default" ? generator.model : null;

  // These CLIs are agentic (file/bash tools). Two things make them spin instead
  // of returning the JSON brief: repo access (the agent wanders) and the repo's
  // own agent config (AGENTS.md / .opencode), which they load from cwd. The
  // brand package is already in the prompt, so run them in a dedicated EMPTY
  // workdir used as both --dir/--cd/--workspace AND cwd.
  const workdir = path.join(os.tmpdir(), "design-extractor-brief-workdir");
  await fs.mkdir(workdir, { recursive: true });

  if (generator.provider_type === "codex") {
    const args = ["exec", "--cd", workdir, "--dangerously-bypass-approvals-and-sandbox"];
    if (model) args.push("--model", model);
    args.push(prompt);
    return { command, args, cwd: workdir };
  }

  if (generator.provider_type === "minimax") {
    const args = ["exec", "--cd", workdir, "--profile", "m21", "--dangerously-bypass-approvals-and-sandbox"];
    if (model) args.push("--model", model);
    args.push(prompt);
    return { command, args, cwd: workdir };
  }

  if (generator.provider_type === "cursor") {
    const args = ["agent", "--print", "--output-format", "text", "--force", "--trust", "--workspace", workdir];
    if (model) args.push("--model", model);
    args.push(prompt);
    return { command, args, cwd: workdir };
  }

  if (generator.provider_type === "kimi") {
    const args = ["--print", "--final-message-only", "--work-dir", workdir, "--output-format", "text"];
    if (model) args.push("--model", model);
    args.push("--prompt", prompt);
    return { command, args, cwd: workdir };
  }

  if (generator.provider_type === "opencode") {
    const args = ["run", "--dir", workdir, "--dangerously-skip-permissions", "--format", "default"];
    if (model) args.push("--model", model);
    args.push(prompt);
    return { command, args, cwd: workdir };
  }

  throw new Error(`Unsupported CLI task runner: ${generator.provider_label} (${generator.provider_type})`);
}

async function writeBriefsFromOutput(
  casesDir: string,
  output: string
): Promise<Map<string, GeneratedTestCaseBrief>> {
  const briefs = parseClaudeTestCaseBrief(output);
  await fs.writeFile(
    path.join(casesDir, "generation-brief.json"),
    JSON.stringify({ cases: Array.from(briefs.values()) }, null, 2),
    "utf-8"
  );
  return briefs;
}

async function writeModelGenerationLog(
  casesDir: string,
  generator: TestCaseGeneratorConfig,
  output: string,
  failed: boolean
): Promise<void> {
  await fs.writeFile(
    path.join(casesDir, "generation.log"),
    [
      `provider=${generator.provider}`,
      `provider_label=${generator.provider_label}`,
      `provider_type=${generator.provider_type}`,
      `agent=${generator.agent}`,
      `model=${generator.model}`,
      `model_source=${generator.model_source}`,
      `settings_integrated=${generator.settings_integrated}`,
      `project_override=${generator.project_override}`,
      `${failed ? "failed" : "generated"}_at=${new Date().toISOString()}`,
      "",
      output,
    ].join("\n"),
    "utf-8"
  );
}

function parseClaudeTestCaseBrief(output: string): Map<string, GeneratedTestCaseBrief> {
  const briefs = new Map<string, GeneratedTestCaseBrief>();
  const jsonText = extractJsonObject(output);
  if (!jsonText) return briefs;
  try {
    const parsed = JSON.parse(jsonText) as JsonRecord;
    const cases = Array.isArray(parsed.cases) ? parsed.cases : [];
    for (const item of cases) {
      const record = asRecord(item);
      const id = stringValue(record.id);
      if (!id) continue;
      briefs.set(id, {
        id,
        brand_risks: arrayOfStrings(record.brand_risks),
        must_include: arrayOfStrings(record.must_include),
        creative_direction: stringValue(record.creative_direction),
      });
    }
  } catch {
    return briefs;
  }
  return briefs;
}

function extractJsonObject(output: string): string | null {
  const fenced = output.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced?.startsWith("{")) return fenced;
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return output.slice(start, end + 1);
}

function buildClaudeTestCasePrompt(
  context: BrandContext,
  caseIds: string[],
  casesDir: string
): string {
  const definitions = TEST_CASE_DEFINITIONS.filter((definition) => caseIds.includes(definition.id));
  // Keep the brief lean: the host renders the final HTML from guarded templates,
  // so the model only needs identity + case intent to write creative direction.
  // The previous prompt shipped a full rendered draft per case plus 9KB of
  // DESIGN.md/SKILL.md prose, which made the agent ingest ~15KB and spin.
  const payload = {
    brand: {
      slug: context.slug,
      name: context.name,
      source_url: context.sourceUrl,
      categories: context.categories,
    },
    identity: {
      logo_src: context.logoSrc,
      light_logo_src: context.lightLogoSrc,
      nav_labels: context.navLabels,
      footer_labels: context.footerLinks,
      footer_columns: context.footerColumns,
      footer_about_text: context.footerAboutText,
      footer_acknowledgement: context.footerAcknowledgement,
      image_srcs: context.imageSrcs.slice(0, 12),
      palette: context.palette,
      fonts: context.fonts,
    },
    cases: definitions.map((definition) => ({
      id: definition.id,
      title: definition.title,
      type: definition.type,
      intent: definition.intent,
    })),
  };

  return [
    "You are a creative director producing brand acceptance test briefs.",
    "Respond with ONLY a JSON object. Do NOT use any tools. Do NOT read, write, or explore files.",
    "Do NOT wrap the answer in markdown. Output the JSON and stop immediately.",
    "The host application renders the final HTML from your brief, so you write creative direction only.",
    "",
    "For each case produce: brand_risks (ways the rendered page could drift off-brand),",
    "must_include (concrete elements/copy/sections), creative_direction (a tight paragraph in the brand voice).",
    "Stay loyal to the provided identity (logo_src, nav_labels, footer, palette, fonts).",
    "- Slide deck: exactly six slides, logo on every slide.",
    "- Dashboard/report: data-dense (KPIs, tables, charts).",
    "- Showcase: a living design-system specimen.",
    "- Campaign: one persuasive page. Poster: a bold identity poster.",
    "",
    'Return ONLY: {"cases":[{"id":"...","brand_risks":["..."],"must_include":["..."],"creative_direction":"..."}]}',
    "",
    "Brand package:",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

function summarizeLocalDraft(html: string): JsonRecord {
  return {
    has_html_document: /<html[\s>]/i.test(html),
    has_header: /<header[\s>]/i.test(html),
    has_footer: /<footer[\s>]/i.test(html),
    has_brand_logo_class: html.includes("brand-logo"),
    has_table: /<table[\s>]/i.test(html),
    has_svg_chart: /<svg[\s>]/i.test(html),
    approximate_sections: (html.match(/<section[\s>]/gi) ?? []).length,
  };
}

function formatClaudeGenerationError(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown CLI error";
  const record = error as { message?: unknown; stderr?: unknown; stdout?: unknown; signal?: unknown; code?: unknown; killed?: unknown };
  const stderr = typeof record.stderr === "string" ? record.stderr.trim() : "";
  const stdout = typeof record.stdout === "string" ? record.stdout.trim() : "";
  // The bulk of a CLI failure's stderr/stdout is the echoed prompt — drop it so
  // the surfaced error is the actionable part, not 15KB of prompt text.
  const stripPrompt = (text: string) =>
    text
      .split(/\n(?=Error|Timed out|Exit|✘|⨯|failed|ERR)/)[0]
      .replace(/Command failed:[\s\S]*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  let message = stripPrompt(stderr) || stripPrompt(stdout) || (typeof record.message === "string" ? record.message : "CLI failed");
  if (record.killed || record.signal === "SIGTERM") {
    const secs = Math.round(PERCASE_GENERATION_TIMEOUT_MS / 1000);
    message = `model did not finish within ${secs}s — it likely hung or over-produced. Try a faster/more compliant model. ${message}`;
  }
  if (typeof record.code !== "undefined" && record.code !== null) {
    message = `Exit ${String(record.code)}. ${message}`;
  }
  return truncateForPrompt(message, 600);
}

function evaluateTestCase(
  context: BrandContext,
  caseId: string,
  html: string
): TestCaseEval {
  const lower = html.toLowerCase();
  const requiresChrome = caseId !== "brand-identity-poster";
  const checks: TestCaseEvalCheck[] = [];
  const add = (
    id: string,
    label: string,
    status: BrandPackageQualityCheckStatus,
    required: boolean,
    details: string,
    weight = 1
  ): void => {
    checks.push({ id, label, status, required, details, weight });
  };

  const hasDoc = /<html[\s>]/i.test(html) && /<body[\s>]/i.test(html);
  add("html-doc", "Complete HTML document", hasDoc ? "pass" : "fail", true, hasDoc ? "<html>/<body> present." : "Missing a complete <html>/<body> document.", 2);

  if (context.logoSrc) {
    const has = html.includes(context.logoSrc);
    add("logo-asset", "Extracted logo asset", has ? "pass" : "fail", true, has ? `References ${context.logoSrc}.` : "Generated HTML does not reference the extracted logo asset.", 2);
  }
  const hasLogoClass = /brand-logo/.test(html);
  add("brand-logo-class", "Visible .brand-logo sizing", hasLogoClass ? "pass" : "fail", true, hasLogoClass ? ".brand-logo class applied (logo keeps width/height)." : "Missing .brand-logo class — the logo may collapse to natural size.", 2);

  if (requiresChrome) {
    const hasHeader = /<header[\s>]/i.test(html);
    add("header", "Brand header", hasHeader ? "pass" : "fail", true, hasHeader ? "<header> present." : "No <header> element.", 1);
    const hasFooter = /<footer[\s>]/i.test(html);
    add("footer", "Brand footer", hasFooter ? "pass" : "fail", true, hasFooter ? "<footer> present." : "No <footer> element.", 1);
    const hasFooterAnatomy = html.includes("brand-footer-link-grid");
    add("footer-anatomy", "Extracted footer anatomy", hasFooterAnatomy ? "pass" : "warn", false, hasFooterAnatomy ? "Footer link grid rendered." : "No brand-footer-link-grid — footer columns may be generic.", 1);

    if (context.navLabels.length >= 3) {
      const navHits = context.navLabels.slice(0, 5).filter((l) => l && lower.includes(l.toLowerCase())).length;
      add("nav-labels", "Extracted navigation labels", navHits >= 3 ? "pass" : navHits >= 1 ? "warn" : "fail", true, `${navHits}/${Math.min(5, context.navLabels.length)} of the top nav labels found.`);
    }
    if (context.footerLinks.length >= 2) {
      const footerHits = context.footerLinks.slice(0, 5).filter((l) => l && lower.includes(l.toLowerCase())).length;
      add("footer-labels", "Extracted footer labels", footerHits >= 1 ? "pass" : "warn", false, `${footerHits} footer labels matched.`);
    }
    const imageHits = context.imageSrcs.filter((src) => src && html.includes(src)).length;
    add("real-imagery", "Real extracted imagery", imageHits >= 1 ? "pass" : "warn", false, `${imageHits} extracted image(s) reused.`);
  }

  // Token-system usage: the guarded templates emit brand CSS variables, so a
  // healthy render references var(--brand-…) many times. Near-zero means the
  // render bypassed the token system (generic styling).
  const tokenRefs = (html.match(/var\(--brand-/g) ?? []).length;
  add("token-usage", "Brand token system", tokenRefs >= 10 ? "pass" : tokenRefs >= 3 ? "warn" : "fail", false, `${tokenRefs} brand token references.`);

  const placeholders = ["lorem ipsum", "placeholder", "replace me", "your text here", "sample text", "todo:"];
  const foundPlaceholders = placeholders.filter((p) => lower.includes(p));
  add("no-placeholders", "No placeholder text", foundPlaceholders.length === 0 ? "pass" : "fail", true, foundPlaceholders.length ? `Found: ${foundPlaceholders.join(", ")}.` : "Clean of placeholder text.");

  if (caseId === "six-slide-deck") {
    const slideLogos = (html.match(/class="brand-slide-logo"/g) ?? []).length;
    add("slide-logos", "Logo on every slide", slideLogos >= 6 ? "pass" : slideLogos >= 3 ? "warn" : "fail", true, `${slideLogos} slide-logo treatments (need 6).`);
  }
  if (caseId === "design-system-showcase") {
    const sections = ["token-matrix", "Typography tokens", "Spacing tokens", "Radius tokens", "Shadow tokens", "Breakpoint tokens"];
    const missing = sections.filter((s) => !html.includes(s));
    add("token-sections", "All token sections", missing.length === 0 ? "pass" : "warn", true, missing.length ? `Missing: ${missing.join(", ")}.` : "All token sections present.", 2);
  }

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0) || 1;
  const earned = checks.reduce(
    (sum, c) => sum + c.weight * (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0),
    0
  );
  return {
    score: Math.round((earned / totalWeight) * 100),
    blockers: checks.filter((c) => c.required && c.status === "fail").length,
    checks,
  };
}

function truncateForPrompt(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[truncated ${value.length - maxChars} chars]`;
}

function renderTestCase(
  context: BrandContext,
  id: string,
  brief?: GeneratedTestCaseBrief
): string {
  if (id === "data-dashboard") return renderShell(context, renderDashboard(context), "Dashboard Report", "", brief);
  if (id === "six-slide-deck") return renderShell(context, renderDeck(context), "Six Page Slide Deck", "deck-mode", brief);
  if (id === "design-system-showcase") return renderShell(context, renderShowcase(context), "Design System Showcase", "", brief);
  if (id === "campaign-landing") return renderShell(context, renderCampaign(context), "Campaign Landing Page", "", brief);
  if (id === "brand-identity-poster") return renderShell(context, renderPoster(context), "Brand Identity Poster", "poster-mode", brief);
  throw new Error(`Unknown test case: ${id}`);
}

function renderShell(
  context: BrandContext,
  body: string,
  title: string,
  modeClass = "",
  brief?: GeneratedTestCaseBrief
): string {
  const palette = context.palette;
  const nav = context.navLabels.length >= 3
    ? context.navLabels.slice(0, 6)
    : ["Overview", "Signals", "System", "Evidence"];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(context.name)} - ${escapeHtml(title)}</title>
  <style>
    ${renderFontFaceCss(context.fontFaces)}
    :root {
      --brand-primary: ${palette.primary};
      --brand-secondary: ${palette.secondary};
      --brand-accent: ${palette.accent};
      --brand-dark: ${palette.dark};
      --brand-light: ${palette.light};
      --brand-surface: ${palette.surface};
      --brand-text: ${palette.text};
      --brand-muted: ${palette.muted};
      --font-heading: ${context.fonts.heading};
      --font-body: ${context.fonts.body};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--brand-text);
      background: linear-gradient(180deg, var(--brand-light), #fff 42%, var(--brand-surface));
      font-family: var(--font-body), Arial, sans-serif;
      letter-spacing: 0;
    }
    h1, h2, h3, .display { font-family: var(--font-heading), var(--font-body), Arial, sans-serif; letter-spacing: 0; }
    a { color: inherit; text-decoration: none; }
    .brand-header {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      min-height: 76px;
      padding: 18px clamp(24px, 6vw, 80px);
      background: color-mix(in srgb, #fff 92%, var(--brand-primary));
      border-bottom: 1px solid color-mix(in srgb, var(--brand-primary) 16%, transparent);
    }
    .brand-lockup { display: flex; align-items: center; gap: 16px; min-width: 0; flex: 0 0 auto; }
    .brand-logo { display: block; flex: 0 0 auto; width: clamp(150px, 18vw, 230px); height: auto; max-height: 52px; object-fit: contain; }
    .wordmark { font-weight: 800; font-size: 20px; color: var(--brand-dark); }
    .nav { display: flex; align-items: center; gap: 22px; color: color-mix(in srgb, var(--brand-text) 66%, #777); font-size: 13px; font-weight: 650; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 12px;
      background: color-mix(in srgb, var(--brand-primary) 10%, #fff);
      color: var(--brand-primary);
      font-weight: 750;
      font-size: 12px;
    }
    main { min-height: 70vh; }
    .section { padding: clamp(38px, 6vw, 86px) clamp(24px, 6vw, 80px); }
    .eyebrow { color: var(--brand-primary); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
    .hero-title { margin: 16px 0 0; max-width: 920px; color: var(--brand-dark); font-size: clamp(42px, 7vw, 92px); line-height: .94; font-weight: 850; }
    .lead { max-width: 760px; color: color-mix(in srgb, var(--brand-text) 68%, #777); font-size: clamp(17px, 2vw, 22px); line-height: 1.45; }
    .grid { display: grid; gap: 18px; }
    .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .card {
      border: 1px solid color-mix(in srgb, var(--brand-primary) 14%, #d7d7d7);
      border-radius: 8px;
      background: color-mix(in srgb, #fff 88%, var(--brand-light));
      box-shadow: 0 24px 80px rgba(10, 20, 30, .07);
    }
    .metric { padding: 22px; }
    .metric strong { display: block; color: var(--brand-dark); font-size: clamp(30px, 4vw, 54px); line-height: 1; }
    .metric span { display: block; margin-top: 8px; color: color-mix(in srgb, var(--brand-text) 62%, #777); font-size: 13px; line-height: 1.4; }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      border-radius: 8px;
      padding: 0 16px;
      background: var(--brand-primary);
      color: #fff;
      font-weight: 800;
    }
    .button.secondary { background: var(--brand-dark); }
    .brand-footer {
      padding: clamp(42px, 6vw, 76px) clamp(24px, 6vw, 80px);
      background: var(--brand-dark);
      color: #fff;
    }
    .brand-footer-inner { max-width: 1240px; margin: 0 auto; display: grid; gap: 34px; }
    .brand-footer-top { display: grid; grid-template-columns: minmax(260px, .95fr) minmax(0, 1.55fr); gap: clamp(28px, 5vw, 70px); align-items: start; }
    .brand-footer-logo { display: block; width: min(230px, 70vw); height: auto; max-height: 72px; object-fit: contain; margin-bottom: 20px; }
    .brand-footer p { margin: 8px 0 0; color: rgba(255,255,255,.7); line-height: 1.6; }
    .brand-footer-link-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 22px; }
    .brand-footer-column strong { display: block; margin-bottom: 12px; color: rgba(255,255,255,.55); font-size: 11px; text-transform: uppercase; letter-spacing: .12em; }
    .brand-footer-column span { display: block; margin: 0 0 9px; color: rgba(255,255,255,.86); font-size: 13px; line-height: 1.35; }
    .brand-footer-acknowledgement { border-top: 1px solid rgba(255,255,255,.16); padding-top: 24px; max-width: 980px; }
    .brand-footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; border-top: 1px solid rgba(255,255,255,.16); padding-top: 20px; color: rgba(255,255,255,.62); font-size: 12px; }
    .chart { width: 100%; min-height: 220px; }
    .bar { height: 10px; border-radius: 999px; background: color-mix(in srgb, var(--brand-primary) 20%, #fff); overflow: hidden; }
    .bar > i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent)); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 14px 12px; border-bottom: 1px solid color-mix(in srgb, var(--brand-primary) 12%, #ddd); text-align: left; }
    th { color: color-mix(in srgb, var(--brand-text) 62%, #777); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    .image-tile { min-height: 260px; background-size: cover; background-position: center; border-radius: 8px; }
    .brand-slide-logo { display: block; width: clamp(140px, 14vw, 240px); max-height: 70px; object-fit: contain; }
    .token-matrix { display: grid; gap: 22px; }
    .token-section { overflow: hidden; }
    .token-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .token-table td:first-child { width: 26%; font-weight: 750; color: var(--brand-dark); }
    .token-swatch { display: inline-block; width: 38px; height: 24px; border-radius: 4px; border: 1px solid rgba(0,0,0,.14); vertical-align: middle; margin-right: 10px; }
    .brief-note { border-left: 4px solid var(--brand-primary); padding: 14px 16px; background: color-mix(in srgb, var(--brand-primary) 7%, #fff); color: var(--brand-muted); line-height: 1.55; }
    .deck-mode body, .poster-mode body { background: #101010; }
    @media (max-width: 860px) {
      .brand-header, .brand-footer-top { grid-template-columns: 1fr; align-items: start; }
      .nav { display: none; }
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .hero-title { font-size: 46px; }
    }
  </style>
</head>
<body class="${modeClass}">
  <header class="brand-header">
    <div class="brand-lockup">
      ${context.logoSrc ? `<img class="brand-logo" src="${escapeAttr(context.logoSrc)}" alt="${escapeAttr(context.name)} logo" />` : `<span class="wordmark">${escapeHtml(context.brandMarkLabel ?? context.name)}</span>`}
    </div>
    <nav class="nav">${nav.map((item) => `<span>${item}</span>`).join("")}</nav>
    <span class="pill">Generated test case</span>
  </header>
  <main>${body}${renderBriefEvidence(brief)}</main>
  ${renderBrandFooter(context)}
</body>
</html>`;
}

function renderFontFaceCss(fontFaces: FontFaceAsset[]): string {
  return fontFaces
    .map((face) => {
      const format = face.src.endsWith(".woff2") ? "woff2" : face.src.endsWith(".woff") ? "woff" : "truetype";
      return `@font-face { font-family: "${cssString(face.family)}"; src: url("${cssString(face.src)}") format("${format}"); font-weight: ${face.weight}; font-style: normal; font-display: swap; }`;
    })
    .join("\n    ");
}

function renderDashboard(context: BrandContext): string {
  const palette = context.palette;
  return `
    <section class="section">
      <div class="eyebrow">Performance intelligence</div>
      <h1 class="hero-title">${escapeHtml(context.name)} operating report</h1>
      <p class="lead">A dense executive dashboard proving the brand can support high-information reporting without losing its own navigation, hierarchy, and visual signal.</p>
      <div class="grid grid-4" style="margin-top:36px">
        ${metric("94.2%", "Brand system coverage across extracted pages")}
        ${metric("18", "Reusable interface patterns detected")}
        ${metric(context.score ? `${Math.round(context.score * 100)}%` : "Live", "Latest validation confidence")}
        ${metric("5", "Scenario test cases generated")}
      </div>
      ${renderPackageEvidence(context)}
    </section>
    <section class="section" style="padding-top:0">
      <div class="grid grid-2">
        <div class="card" style="padding:26px">
          <div class="eyebrow">Monthly signal</div>
          <h2 style="margin:10px 0 18px;font-size:30px">Design fit by channel</h2>
          <svg class="chart" viewBox="0 0 680 260" role="img" aria-label="Line chart">
            <defs>
              <linearGradient id="line" x1="0" x2="1">
                <stop offset="0" stop-color="${palette.primary}" />
                <stop offset="1" stop-color="${palette.accent}" />
              </linearGradient>
            </defs>
            ${[40, 90, 140, 190, 240].map((y) => `<line x1="0" y1="${y}" x2="680" y2="${y}" stroke="#d9dee8" stroke-width="1" />`).join("")}
            <polyline points="24,198 120,168 216,180 312,112 408,126 504,82 620,58" fill="none" stroke="url(#line)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
            ${["Web", "Deck", "Report", "Poster"].map((label, i) => `<text x="${80 + i * 150}" y="246" fill="#747982" font-size="18">${label}</text>`).join("")}
          </svg>
        </div>
        <div class="card" style="padding:26px">
          <div class="eyebrow">Priority callouts</div>
          <h2 style="margin:10px 0 18px;font-size:30px">Readiness summary</h2>
          ${progress("Visual identity", 92)}
          ${progress("Navigation reuse", 87)}
          ${progress("Data density", 78)}
          ${progress("Presentation range", 83)}
          <div style="margin-top:24px;padding:18px;border-left:6px solid ${palette.primary};background:${alpha(palette.primary, 0.08)}">
            <strong>Recommendation</strong>
            <p style="margin:6px 0 0;line-height:1.45">Keep header, footer, logo treatment, and color tokens locked while testing more complex product and reporting pages.</p>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:18px;overflow:hidden">
        <table>
          <thead><tr><th>Scenario</th><th>Evidence</th><th>Risk</th><th>Action</th></tr></thead>
          <tbody>
            ${["Homepage system", "Report module", "Slide story", "Poster identity", "Campaign page"].map((item, index) => `
              <tr>
                <td><strong>${item}</strong></td>
                <td>${context.pageNames[index % context.pageNames.length].replaceAll("-", " ")}</td>
                <td>${["Low", "Medium", "Medium", "Low", "Medium"][index]}</td>
                <td><span class="pill">Review</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderDeck(context: BrandContext): string {
  const slides = [
    ["01", "Brand system stress test", "Six-slide deck generated from extracted assets, typography, colors, and layout decisions."],
    ["02", "What the extraction knows", `${context.pageNames.length} page patterns, ${context.categories.length || 3} category signals, and a living validation score.`],
    ["03", "Visual territory", "Logo scale, color contrast, editorial hierarchy, and image posture carried into a presentation surface."],
    ["04", "Operating metrics", "A slide format for reporting, board updates, quarterly reviews, and stakeholder readouts."],
    ["05", "Reusable modules", "Cards, callouts, charts, section headers, and footers remain consistent across generated artifacts."],
    ["06", "Ready for review", "Use these slides to judge whether the brand can leave the source website and still feel coherent."],
  ];
  return `
    <section class="section" style="display:grid;gap:28px;background:#111">
      ${slides.map(([num, title, text], index) => `
        <article class="card" style="aspect-ratio:16/9;min-height:520px;display:grid;grid-template-columns:1.05fr .95fr;overflow:hidden;background:${index % 2 === 0 ? "var(--brand-light)" : "var(--brand-dark)"};color:${index % 2 === 0 ? "var(--brand-text)" : "#fff"}">
          <div style="padding:54px;display:flex;flex-direction:column;justify-content:space-between">
            ${renderSlideLogo(context, index % 2 !== 0)}
            <div>
              <div class="eyebrow">Slide ${num}</div>
              <h1 style="margin:18px 0 0;font-size:clamp(46px,6vw,82px);line-height:.95">${escapeHtml(title)}</h1>
              <p style="max-width:660px;font-size:24px;line-height:1.35;color:${index % 2 === 0 ? "color-mix(in srgb, var(--brand-text) 64%, #777)" : "rgba(255,255,255,.74)"}">${escapeHtml(text)}</p>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
              <span class="pill">${escapeHtml(context.name)}</span>
              <span style="font-weight:800">${num}/06</span>
            </div>
          </div>
          <div style="position:relative;background:${index % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)"};overflow:hidden">
            <div style="position:absolute;inset:12%;border:2px solid rgba(255,255,255,.44);border-radius:8px"></div>
            <div style="position:absolute;right:-12%;bottom:-14%;width:60%;aspect-ratio:1;border-radius:999px;background:rgba(255,255,255,.22)"></div>
            ${context.imageSrcs[index] ? `<div style="position:absolute;inset:20% 12%;border-radius:8px;background:url('${escapeAttr(context.imageSrcs[index])}') center/cover;box-shadow:0 40px 90px rgba(0,0,0,.22)"></div>` : ""}
          </div>
        </article>`).join("")}
    </section>
    <section class="section">${renderPackageEvidence(context)}</section>`;
}

function renderShowcase(context: BrandContext): string {
  const colors = extractColorTokenRows(context).slice(0, 12);
  const heroImage = context.imageSrcs[0] ?? "";
  return `
    <section class="section" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,440px);gap:44px;align-items:end">
      <div>
        <div class="eyebrow">Living design system</div>
        <h1 class="hero-title">${escapeHtml(context.name)} design system specimen</h1>
        <p class="lead">A long-form brand specimen using the extracted logo, real navigation labels, footer structure, imagery, color roles, typography, data modules, cards, forms, and campaign components.</p>
      </div>
      <div class="card" style="overflow:hidden;background:var(--brand-dark);color:#fff">
        <div class="image-tile" style="min-height:320px;background-image:url('${escapeAttr(heroImage)}');background-color:var(--brand-primary)"></div>
        <div style="padding:20px;display:grid;gap:12px">
          <div class="eyebrow">Identity evidence</div>
          <strong style="font-size:26px;line-height:1.1">${escapeHtml(context.navLabels.slice(0, 4).join(" / ") || context.name)}</strong>
        </div>
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <h2 style="font-size:42px;margin:0 0 18px">Color roles</h2>
      <div class="grid grid-3">
        ${colors.map((item) => `
          <div class="card" style="padding:22px;background:${escapeAttr(item.value)};color:${contrastText(item.value)};min-height:150px;display:flex;flex-direction:column;justify-content:space-between">
            <strong>${escapeHtml(item.label)}</strong>
            <span style="font-family:monospace">${escapeHtml(item.value)}</span>
          </div>`).join("")}
      </div>
      ${renderPackageEvidence(context)}
    </section>
    <section class="section" style="padding-top:0">
      <h2 style="font-size:42px;margin:0 0 18px">Full design token catalog</h2>
      <p class="lead">This specimen exposes every captured token family, so gaps in extraction are visible before the brand is reused in dashboards, decks, posters, or campaign work.</p>
      ${renderTokenMatrix(context)}
    </section>
    <section class="section" style="padding-top:0">
      <h2 style="font-size:42px;margin:0 0 18px">Header and footer anatomy</h2>
      <div class="grid grid-2">
        <div class="card" style="padding:26px">
          <div class="eyebrow">Navigation</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
            ${context.navLabels.slice(0, 8).map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join("")}
          </div>
          <p style="line-height:1.55;color:var(--brand-muted);margin-top:18px">The generated scenarios reuse rendered DOM navigation labels instead of generic placeholder routes.</p>
        </div>
        <div class="card" style="padding:26px;background:var(--brand-dark);color:#fff">
          <div class="eyebrow">Footer</div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px;color:rgba(255,255,255,.82)">
            ${context.footerLinks.slice(0, 8).map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
          </div>
          <p style="line-height:1.55;color:rgba(255,255,255,.68);margin-top:18px">Footer labels are pulled from extracted page evidence and carried across every page-based test case.</p>
        </div>
      </div>
      ${renderFooterSpecimen(context)}
    </section>
    <section class="section" style="background:var(--brand-dark);color:#fff">
      <div class="grid grid-2">
        <div>
          <div class="eyebrow">Typography</div>
          <h2 style="font-size:64px;line-height:.95;margin:14px 0">Sharp hierarchy, visible rhythm.</h2>
        </div>
        <div class="card" style="padding:28px;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18)">
          <p style="font-size:22px;line-height:1.45">Heading: ${escapeHtml(context.fonts.heading)}</p>
          <p style="font-size:18px;line-height:1.55;color:rgba(255,255,255,.72)">Body: ${escapeHtml(context.fonts.body)}</p>
          <p style="line-height:1.7;color:rgba(255,255,255,.72)">The specimen keeps letter spacing neutral, uses large type only for hero-level hierarchy, and holds cards to a restrained 8px radius.</p>
        </div>
      </div>
    </section>
    <section class="section">
      <h2 style="font-size:42px;margin:0 0 18px">Component range</h2>
      <div class="grid grid-3">
        ${["Navigation", "Callout", "Form"].map((title, index) => `
          <div class="card" style="padding:26px">
            <span class="pill">${String(index + 1).padStart(2, "0")}</span>
            <h3 style="font-size:28px;margin:18px 0 8px">${title}</h3>
            <p style="line-height:1.55;color:var(--brand-muted)">A reusable module rendered with the extracted color, type, and spacing language.</p>
            ${index === 2 ? `<input aria-label="Email" placeholder="name@company.com" style="width:100%;height:44px;border:1px solid #d4d7dd;border-radius:8px;padding:0 12px;margin-top:16px" />` : `<a class="button" style="margin-top:16px">Inspect module</a>`}
          </div>`).join("")}
      </div>
      <div class="grid grid-3" style="margin-top:18px">
        ${context.imageSrcs.slice(0, 3).map((src, index) => `
          <div class="image-tile" style="background-image:url('${escapeAttr(src)}')">
            <span class="pill" style="margin:16px">Asset ${index + 1}</span>
          </div>`).join("")}
      </div>
    </section>`;
}

function renderCampaign(context: BrandContext): string {
  return `
    <section class="section" style="display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:38px;align-items:center">
      <div>
        <div class="eyebrow">Campaign launch</div>
        <h1 class="hero-title">A brand campaign that still feels like ${escapeHtml(context.name)}</h1>
        <p class="lead">A one-page launch surface built to test campaign-level persuasion, product messaging, feature cards, proof points, and conversion calls to action.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:28px">
          <a class="button">Start campaign</a>
          <a class="button secondary">View system</a>
        </div>
      </div>
      <div class="card" style="padding:16px">
        <div class="image-tile" style="background-image:url('${escapeAttr(context.imageSrcs[0] ?? "")}');background-color:var(--brand-primary)"></div>
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="grid grid-3">
        ${["Built from evidence", "Designed for action", "Measured by validation"].map((title, index) => `
          <div class="card" style="padding:28px">
            <span class="pill">${index + 1}</span>
            <h2 style="font-size:30px;margin:18px 0 10px">${title}</h2>
            <p style="line-height:1.55;color:var(--brand-muted)">The page reuses extracted brand patterns while moving into a new content job.</p>
          </div>`).join("")}
      </div>
    </section>
    <section class="section" style="background:var(--brand-primary);color:#fff">
      <div class="grid grid-2" style="align-items:center">
        <h2 style="font-size:58px;line-height:1;margin:0">From source website to reusable campaign system.</h2>
        <div class="card" style="padding:28px;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.28)">
          ${progress("Brand memory", 91)}
          ${progress("Conversion clarity", 84)}
          ${progress("Visual consistency", 88)}
        </div>
      </div>
      ${renderPackageEvidence(context)}
    </section>`;
}

function renderPoster(context: BrandContext): string {
  return `
    <section class="section" style="min-height:1100px;display:flex;justify-content:center;background:#111">
      <article style="width:min(860px,100%);aspect-ratio:4/5;background:linear-gradient(145deg,var(--brand-primary),var(--brand-dark));color:#fff;position:relative;overflow:hidden;padding:54px;border-radius:8px;box-shadow:0 60px 160px rgba(0,0,0,.35)">
        <div style="position:absolute;inset:auto -16% -10% auto;width:68%;aspect-ratio:1;border-radius:999px;background:rgba(255,255,255,.14)"></div>
        <div style="position:absolute;inset:34% auto auto -10%;width:42%;height:10px;background:var(--brand-accent);transform:rotate(-28deg)"></div>
        <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            ${context.logoSrc ? `<img class="brand-logo" src="${escapeAttr(context.logoSrc)}" alt="${escapeAttr(context.name)} logo" style="width:clamp(150px,18vw,240px);height:auto;max-height:86px;filter:brightness(0) invert(1)" />` : `<strong style="font-size:28px">${escapeHtml(context.brandMarkLabel ?? context.name)}</strong>`}
            <h1 style="font-size:clamp(70px,11vw,140px);line-height:.82;margin:76px 0 0;max-width:720px">${escapeHtml(context.name)} identity study</h1>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:end">
              <p style="font-size:22px;line-height:1.32;max-width:420px;color:rgba(255,255,255,.78)">A single-page poster generated from the extracted brand DNA: logo, colors, typography, layout density, and image posture.</p>
            <div style="justify-self:end;text-align:right">
              <div style="font-size:80px;font-weight:850;line-height:.85">${context.score ? Math.round(context.score * 100) : "ID"}%</div>
              <div style="margin-top:10px;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.7)">Validation signal</div>
            </div>
          </div>
        </div>
      </article>
    </section>`;
}

function renderPackageEvidence(context: BrandContext): string {
  const designSignals = context.designSignals.length > 0
    ? context.designSignals
    : ["DESIGN.md did not expose enough direct guidance for this scenario."];
  const skillSignals = context.skillSignals.length > 0
    ? context.skillSignals
    : ["SKILL.md did not expose enough direct guidance for this scenario."];
  return `
    <div class="card" style="margin-top:30px;padding:24px">
      <div class="eyebrow">Generated from package evidence</div>
      <div class="grid grid-2" style="margin-top:16px">
        <div>
          <h3 style="margin:0 0 10px;font-size:22px">DESIGN.md signals</h3>
          <ul style="margin:0;padding-left:18px;line-height:1.55;color:var(--brand-muted)">
            ${designSignals.slice(0, 4).map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <h3 style="margin:0 0 10px;font-size:22px">Skill signals</h3>
          <ul style="margin:0;padding-left:18px;line-height:1.55;color:var(--brand-muted)">
            ${skillSignals.slice(0, 4).map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>`;
}

function renderBriefEvidence(brief?: GeneratedTestCaseBrief): string {
  if (!brief || (!brief.creative_direction && brief.must_include.length === 0)) return "";
  const requirements = brief.must_include.length > 0
    ? `<ul style="margin:10px 0 0;padding-left:18px">${brief.must_include.slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  return `
    <section class="section" style="padding-top:0">
      <details class="brief-note">
        <summary style="cursor:pointer;font-weight:800;color:var(--brand-dark)">Model brief applied</summary>
        ${brief.creative_direction ? `<p style="margin:6px 0 0">${escapeHtml(brief.creative_direction)}</p>` : ""}
        ${requirements}
      </details>
    </section>`;
}

function renderBrandFooter(context: BrandContext): string {
  const columns = getFooterColumns(context);
  const about = context.footerAboutText ||
    `Generated from extracted HTML, tokens, assets, validation evidence, and ${context.name} design documentation.`;
  const logo = context.lightLogoSrc ?? context.logoSrc;
  return `
  <footer class="brand-footer">
    <div class="brand-footer-inner">
      <div class="brand-footer-top">
        <div>
          ${logo ? `<img class="brand-footer-logo" src="${escapeAttr(logo)}" alt="${escapeAttr(context.name)} logo" />` : `<strong style="font-size:24px">${escapeHtml(context.brandMarkLabel ?? context.name)}</strong>`}
          <p>${escapeHtml(about)}</p>
          ${context.sourceUrl ? `<p><strong>Source:</strong> ${escapeHtml(context.sourceUrl)}</p>` : ""}
        </div>
        <div class="brand-footer-link-grid">
          ${columns.map((items, index) => `
            <div class="brand-footer-column">
              <strong>${escapeHtml(footerColumnTitle(index))}</strong>
              ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>`).join("")}
        </div>
      </div>
      ${context.footerAcknowledgement ? `
        <div class="brand-footer-acknowledgement">
          <strong>Acknowledgement</strong>
          <p>${escapeHtml(context.footerAcknowledgement)}</p>
        </div>` : ""}
      <div class="brand-footer-bottom">
        <span>${escapeHtml(context.footerCopyright ?? `${context.name} brand test case`)}</span>
        <span>Header, footer, logo, and token usage are required package evidence.</span>
      </div>
    </div>
  </footer>`;
}

function renderFooterSpecimen(context: BrandContext): string {
  const columns = getFooterColumns(context);
  return `
      <div class="card" style="margin-top:18px;padding:26px;background:var(--brand-dark);color:#fff">
        <div class="eyebrow">Extracted footer specimen</div>
        <div class="brand-footer-link-grid" style="margin-top:20px">
          ${columns.map((items, index) => `
            <div class="brand-footer-column">
              <strong>${escapeHtml(footerColumnTitle(index))}</strong>
              ${items.slice(0, 8).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>`).join("")}
        </div>
        ${context.footerAcknowledgement ? `<p style="max-width:980px;margin-top:18px;color:rgba(255,255,255,.72)">${escapeHtml(context.footerAcknowledgement)}</p>` : ""}
      </div>`;
}

function getFooterColumns(context: BrandContext): string[][] {
  if (context.footerColumns.length > 0) return context.footerColumns;
  const labels = context.footerLinks.length > 0 ? context.footerLinks : context.navLabels;
  return chunkStrings(labels, 3);
}

function footerColumnTitle(index: number): string {
  return ["Quick links", "Company", "Contact", "Legal"][index] ?? `Column ${index + 1}`;
}

function renderSlideLogo(context: BrandContext, inverse: boolean): string {
  const src = inverse
    ? context.lightLogoSrc ?? context.logoSrc
    : context.logoSrc ?? context.lightLogoSrc;
  if (!src) {
    return `<strong class="brand-slide-logo" style="font-size:24px">${escapeHtml(context.brandMarkLabel ?? context.name)}</strong>`;
  }
  const fallbackFilter = inverse && src === context.logoSrc ? "filter:brightness(0) invert(1);" : "";
  return `<img class="brand-slide-logo" src="${escapeAttr(src)}" alt="${escapeAttr(context.name)} logo" style="${fallbackFilter}" />`;
}

function renderTokenMatrix(context: BrandContext): string {
  return `
      <div class="token-matrix">
        ${renderTokenSection("Color tokens", extractColorTokenRows(context), true)}
        ${renderTokenSection("Typography tokens", extractTypographyTokenRows(context))}
        ${renderTokenSection("Spacing tokens", extractSpacingTokenRows(context))}
        ${renderTokenSection("Radius tokens", extractRadiusTokenRows(context))}
        ${renderTokenSection("Shadow tokens", extractShadowTokenRows(context))}
        ${renderTokenSection("Breakpoint tokens", extractBreakpointTokenRows(context))}
        ${renderTokenSection("Transition tokens", extractTransitionTokenRows(context))}
      </div>`;
}

interface TokenDisplayRow {
  label: string;
  value: string;
  meta: string;
}

function renderTokenSection(title: string, rows: TokenDisplayRow[], colorSwatches = false): string {
  const bodyRows = rows.length > 0
    ? rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          <td>${colorSwatches ? `<span class="token-swatch" style="background:${escapeAttr(row.value)}"></span>` : ""}<code>${escapeHtml(row.value)}</code></td>
          <td>${escapeHtml(row.meta)}</td>
        </tr>`).join("")
    : `<tr><td colspan="3">No ${escapeHtml(title.toLowerCase())} captured in design-tokens.json.</td></tr>`;
  return `
        <div class="card token-section">
          <div style="padding:22px 22px 0">
            <h3 style="margin:0;font-size:26px">${escapeHtml(title)}</h3>
          </div>
          <table class="token-table">
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;
}

function extractColorTokenRows(context: BrandContext): TokenDisplayRow[] {
  const rows: TokenDisplayRow[] = [];
  const colours = asRecord(context.tokens.colours);
  const palette = asRecord(colours.palette);
  for (const [label, value] of Object.entries(palette)) {
    const string = stringValue(value);
    if (string) {
      rows.push({ label: humanizeToken(label), value: colorToHex(string) ?? string, meta: "palette" });
    }
  }
  const computed = Array.isArray(colours.computed) ? (colours.computed as JsonRecord[]) : [];
  for (const item of computed) {
    const value = stringValue(item.value);
    if (!value) continue;
    rows.push({
      label: humanizeToken(stringValue(item.role) || "computed"),
      value: colorToHex(value) ?? value,
      meta: [stringValue(item.confidence), item.count ? `${String(item.count)} samples` : "", stringValue(item.source)]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return uniqueTokenRows(rows).slice(0, 80);
}

function extractTypographyTokenRows(context: BrandContext): TokenDisplayRow[] {
  const typography = asRecord(context.tokens.typography);
  const rows = [
    ...tokenArrayRows("Family", typography.families),
    ...tokenArrayRows("Size", typography.sizes),
    ...tokenArrayRows("Weight", typography.weights),
    ...tokenArrayRows("Line height", typography.line_heights),
    ...tokenArrayRows("Letter spacing", typography.letter_spacings),
  ];
  const samples = asRecord(typography.samples);
  for (const [name, sample] of Object.entries(samples)) {
    const sampleRecord = asRecord(sample);
    const value = [
      stringValue(sampleRecord.fontFamily),
      stringValue(sampleRecord.fontSize),
      stringValue(sampleRecord.fontWeight),
      stringValue(sampleRecord.lineHeight),
    ].filter(Boolean).join(" / ");
    if (value) rows.push({ label: `Sample: ${humanizeToken(name)}`, value, meta: stringValue(sampleRecord.color) });
  }
  return rows;
}

function extractSpacingTokenRows(context: BrandContext): TokenDisplayRow[] {
  const spacing = asRecord(context.tokens.spacing);
  const rows: TokenDisplayRow[] = [];
  for (const key of ["detected_base_unit", "content_padding", "max_width"]) {
    const value = stringValue(spacing[key]);
    if (value) rows.push({ label: humanizeToken(key), value, meta: "spacing scalar" });
  }
  const scale = arrayOfStrings(spacing.scale);
  rows.push(...scale.map((value, index) => ({ label: `Scale ${index + 1}`, value, meta: "spacing scale" })));
  rows.push(...tokenArrayRows("Padding", spacing.paddings));
  rows.push(...tokenArrayRows("Margin", spacing.margins));
  rows.push(...tokenArrayRows("Gap", spacing.gaps));
  return rows;
}

function extractRadiusTokenRows(context: BrandContext): TokenDisplayRow[] {
  const borders = asRecord(context.tokens.borders);
  const border = asRecord(context.tokens.border);
  const radii = asRecord(context.tokens.radii);
  const rounded = asRecord(context.tokens.rounded);
  const rows: TokenDisplayRow[] = [
    ...tokenArrayRows("Radius", borders.radii),
    ...tokenArrayRows("Radius", radii.values),
    ...tokenArrayRows("Radius", rounded.values),
  ];

  for (const [name, value] of Object.entries({ ...border, ...radii, ...rounded })) {
    if (name === "$type" || name === "values") continue;
    const record = asRecord(value);
    const tokenValue = stringValue(record.value) || stringValue(record.$value) || stringValue(value);
    if (!tokenValue) continue;
    if (!/radius|rounded|corner/i.test(name) && !/\b\d+(?:\.\d+)?(?:px|rem|em)\b|9999px/.test(tokenValue)) {
      continue;
    }
    rows.push({
      label: humanizeToken(name),
      value: tokenValue,
      meta: stringValue(record.$type) || "radius token",
    });
  }

  return uniqueTokenRows(rows);
}

function extractShadowTokenRows(context: BrandContext): TokenDisplayRow[] {
  return tokenArrayRows("Shadow", context.tokens.shadows);
}

function extractBreakpointTokenRows(context: BrandContext): TokenDisplayRow[] {
  const breakpoints = Array.isArray(context.tokens.breakpoints) ? context.tokens.breakpoints : [];
  return breakpoints.map((value, index) => ({
    label: `Breakpoint ${index + 1}`,
    value: `${String(value)}px`,
    meta: "responsive breakpoint",
  }));
}

function extractTransitionTokenRows(context: BrandContext): TokenDisplayRow[] {
  return tokenArrayRows("Transition", context.tokens.transitions);
}

function tokenArrayRows(label: string, value: unknown): TokenDisplayRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    if (typeof item === "string" || typeof item === "number") {
      return { label: `${label} ${index + 1}`, value: String(item), meta: "" };
    }
    const record = asRecord(item);
    return {
      label: `${label} ${index + 1}`,
      value: stringValue(record.value) || stringValue(record.$value) || JSON.stringify(record),
      meta: record.count ? `${String(record.count)} samples` : "",
    };
  });
}

function uniqueTokenRows(rows: TokenDisplayRow[]): TokenDisplayRow[] {
  const seen = new Set<string>();
  const result: TokenDisplayRow[] = [];
  for (const row of rows) {
    const key = `${row.label}:${row.value}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function summarizeTokenCoverage(context: BrandContext): JsonRecord {
  return {
    colors: extractColorTokenRows(context).length,
    typography: extractTypographyTokenRows(context).length,
    spacing: extractSpacingTokenRows(context).length,
    radii: extractRadiusTokenRows(context).length,
    shadows: extractShadowTokenRows(context).length,
    breakpoints: extractBreakpointTokenRows(context).length,
    transitions: extractTransitionTokenRows(context).length,
  };
}

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metric(value: string, label: string): string {
  return `<div class="card metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function progress(label: string, value: number): string {
  return `
    <div style="margin:16px 0">
      <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:8px;font-size:13px;font-weight:750">
        <span>${escapeHtml(label)}</span><span>${value}%</span>
      </div>
      <div class="bar"><i style="width:${value}%"></i></div>
    </div>`;
}

function extractPalette(tokens: JsonRecord): BrandContext["palette"] {
  const palette = asRecord(asRecord(tokens.colours).palette);
  const computed = Array.isArray(asRecord(tokens.colours).computed)
    ? (asRecord(tokens.colours).computed as JsonRecord[])
    : [];
  const values = uniqueStrings(computed.flatMap((entry) => colorValuesFromUnknown(entry.value)));
  const roleValue = (pattern: RegExp): string | null => {
    for (const entry of computed) {
      const role = stringValue(entry.role).toLowerCase();
      if (pattern.test(role)) {
        const colors = colorValuesFromUnknown(entry.value);
        if (colors[0]) return colors[0];
      }
    }
    return null;
  };
  const nonNeutral = values.find((value) => isChromaticColor(value));
  const darkCandidate =
    colorToHex(stringValue(palette.footerDark)) ??
    colorToHex(stringValue(palette.darkNavy)) ??
    roleValue(/footer.*bg|dark|text/) ??
    values.find((value) => isDarkColor(value)) ??
    "#111827";
  const primary =
    colorToHex(stringValue(palette.primary)) ??
    roleValue(/primary|accent|link|button|icon/) ??
    nonNeutral ??
    darkCandidate;
  const secondary =
    colorToHex(stringValue(palette.secondary)) ??
    darkCandidate ??
    values.find((value) => value.toLowerCase() !== primary.toLowerCase()) ??
    "#111827";
  const accent =
    colorToHex(stringValue(palette.accent)) ??
    colorToHex(stringValue(palette.iconBlue)) ??
    nonNeutral ??
    values.find((value) => value.toLowerCase() !== primary.toLowerCase() && value.toLowerCase() !== secondary.toLowerCase()) ??
    "#38bdf8";
  const dark =
    colorToHex(stringValue(palette.dark)) ??
    colorToHex(stringValue(palette.textDark)) ??
    darkCandidate;
  const light =
    colorToHex(stringValue(palette.backgroundLight)) ??
    colorToHex(stringValue(palette.light)) ??
    roleValue(/hero.*bg|background.*light|surface/) ??
    values.find((value) => !isDarkColor(value) && value.toLowerCase() !== "#ffffff") ??
    "#f6f7fb";
  const text =
    colorToHex(stringValue(palette.text)) ??
    colorToHex(stringValue(palette.bodyText)) ??
    roleValue(/text/) ??
    "#202020";
  return {
    primary,
    secondary,
    accent,
    dark,
    light,
    text,
    muted: "#68707d",
    surface: "#ffffff",
  };
}

function extractFonts(tokens: JsonRecord): BrandContext["fonts"] {
  const families = asRecord(tokens.typography).families;
  if (Array.isArray(families)) {
    const entries = families
      .map((entry) => asRecord(entry))
      .map((entry) => ({
        role: stringValue(entry.role).toLowerCase(),
        name: stringValue(entry.value).split(",")[0].trim().replaceAll("\"", "").replaceAll("'", ""),
      }))
      .filter((entry) => entry.name && !/font awesome|material icons/i.test(entry.name));
    const heading = entries.find((entry) => entry.role === "heading")?.name ?? entries[0]?.name ?? "Arial";
    const body = entries.find((entry) => entry.role === "body")?.name ?? entries.find((entry) => entry.name !== heading)?.name ?? heading;
    return {
      heading: cssFont(heading),
      body: cssFont(body),
    };
  }
  return { heading: "Arial", body: "Arial" };
}

function cssFont(font: string): string {
  return font.includes(" ") ? `"${font}"` : font;
}

function colorValuesFromUnknown(value: unknown): string[] {
  if (typeof value === "string") {
    const direct = colorToHex(value);
    if (direct) return [direct];
    return Array.from(value.matchAll(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)|#[0-9a-f]{3,6}/gi))
      .map((match) => colorToHex(match[0]))
      .filter(Boolean) as string[];
  }
  if (Array.isArray(value)) return value.flatMap((item) => colorValuesFromUnknown(item));
  return [];
}

function isChromaticColor(hex: string): boolean {
  const clean = colorToHex(hex);
  if (!clean) return false;
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return Math.max(r, g, b) - Math.min(r, g, b) > 30;
}

function isDarkColor(hex: string): boolean {
  const clean = colorToHex(hex);
  if (!clean) return false;
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.35;
}

function colorToHex(value: string): string | null {
  if (!value) return null;
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[0];
  if (hex) {
    if (hex.length === 4) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
    }
    return hex.toUpperCase();
  }
  const rgb = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgb) return null;
  return `#${[rgb[1], rgb[2], rgb[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function contrastText(hex: string): string {
  const clean = colorToHex(hex) ?? "#ffffff";
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#101010" : "#ffffff";
}

function alpha(hex: string, amount: number): string {
  const clean = colorToHex(hex) ?? "#000000";
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${amount})`;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractSignals(markdown: string, limit: number): string[] {
  const preferred = [
    "must",
    "use",
    "avoid",
    "color",
    "colour",
    "typography",
    "layout",
    "component",
    "hero",
    "button",
    "navigation",
    "brand",
  ];
  return markdown
    .split("\n")
    .map((line) => line.replace(/^[-*#\s`>]+/, "").trim())
    .filter((line) => line.length >= 32 && line.length <= 180)
    .filter((line) => preferred.some((word) => line.toLowerCase().includes(word)))
    .slice(0, limit);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function arrayOfRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map((item) => asRecord(item)).filter((item) => Object.keys(item).length > 0) : [];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function safeJson(value: string): JsonRecord {
  try {
    return JSON.parse(value) as JsonRecord;
  } catch {
    return {};
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function cssString(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}
