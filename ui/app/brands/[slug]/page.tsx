"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BrandSummaryCard } from "@/components/brand-summary-card";
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Layers,
  Palette,
  Type,
  Image as ImageIcon,
  Code2,
  MonitorPlay,
  FolderOpen,
  BarChart3,
  Presentation,
  Globe2,
  Megaphone,
  PanelTop,
  Maximize2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CircleDot,
  Eye,
  RefreshCw,
  XCircle,
  Upload,
  X,
  Download,
  Loader2,
} from "lucide-react";

/* ─── types ─── */

interface ColorEntry {
  value: string;
  count: number;
  confidence?: string;
}

interface FontEntry {
  value: string;
  count: number;
}

interface SizeEntry {
  value: string;
  count: number;
}

interface DesignTokens {
  colours?: {
    computed?: ColorEntry[];
    total_raw?: number;
    total_filtered?: number;
  };
  typography?: {
    families?: FontEntry[];
    sizes?: SizeEntry[];
    gaps?: SizeEntry[];
    detected_base_unit?: string;
    scale?: string[];
  };
  spacing?: {
    paddings?: SizeEntry[];
    margins?: SizeEntry[];
  };
}

interface OriginalPageArtifact {
  slug: string;
  has_verify: boolean;
}

interface BrandArtifactsSummary {
  original_pages: OriginalPageArtifact[];
  replica_html_pages: string[];
  has_compare: boolean;
  has_design_md: boolean;
  has_tokens: boolean;
  has_tokens_json: boolean;
  has_tokens_css: boolean;
  has_open_design_export: boolean;
  has_skill: boolean;
}

interface BrandDetail {
  slug: string;
  name: string;
  source_url: string;
  extracted_at: string;
  overall_score: number | null;
  confidence: string;
  categories: string[];
  design_md: string | null;
  design_tokens: DesignTokens | null;
  design_tokens_css: string | null;
  skill_md: string | null;
  metadata: Record<string, unknown> | null;
  validation_report: Record<string, unknown> | null;
  component_manifest: Record<string, unknown> | null;
  component_report: Record<string, unknown> | null;
  has_replica: boolean;
  has_logo: boolean;
  has_screenshots: boolean;
  files: string[];
  localFiles: string[];
  artifacts?: BrandArtifactsSummary;
}

interface ImprovementJobState {
  job_id: string;
  brand: string;
  target_score: number;
  status: string;
  current_iteration: number;
  max_iterations: number;
  current_score: number | null;
  pages_needing_work: Array<{ slug?: string; current_score?: number }>;
  blocked_reason: { code: string; detail: string } | null;
  assisted_capture_steps: string[];
  last_model_summary: string | null;
  model_log_path: string | null;
  model_provider: string | null;
  last_claude_summary: string | null;
  claude_log_path: string | null;
  updated_at: string;
}

interface ComponentManifestEntry {
  type?: string;
  name?: string;
  status?: string;
  confidence?: number;
  library_file?: string | null;
  source_pages?: string[];
  evidence?: {
    source_files?: string[];
    selectors?: string[];
    markers?: string[];
  };
}

interface ComponentReportComponent {
  heading?: string;
  status?: string;
  pixel_score?: number;
  issues?: string[];
  original?: Record<string, unknown>;
  replica?: Record<string, unknown>;
}

interface ComponentReportPage {
  page?: string;
  components_original?: number;
  components_replica?: number;
  matched?: number;
  missing?: number;
  extra?: number;
  average_score?: number;
  components?: ComponentReportComponent[];
}

interface ComponentReport {
  pages?: Record<string, ComponentReportPage>;
  overall?: number;
}

interface ComponentManifest {
  components?: ComponentManifestEntry[];
  required_component_types?: string[];
  taxonomy?: string[];
}

interface ComponentCatalogueItem {
  id: string;
  name: string;
  type: string;
  status: string;
  confidence: number | null;
  sourcePages: string[];
  sourceRoute: string | null;
  libraryFile: string | null;
  evidenceMarkers: string[];
}

interface DesignElementCatalogueItem {
  id: string;
  label: string;
  value: string;
  description: string;
  tone: "color" | "type" | "shape" | "space" | "effect";
  swatch?: string;
}

interface ReplicaPage {
  name: string;
  route: string;
  previewKey: string;
  file: string;
  pageSlug: string;
  source: "react" | "html" | "screenshot";
}

type TestCaseStatus = "pending" | "completed" | "stale" | "failed";
type TestCaseFeedbackTarget = "design_md" | "skill" | "both";
type TestCaseFeedbackSentiment = "works" | "needs_work";
type BrandPackageQualityStatus = "ready" | "needs_work";
type RepairPackageMode = "docs" | "tokens" | "assets" | "identity" | "all";

interface BrandPackageQualityCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  required: boolean;
  details: string;
}

interface BrandPackageQuality {
  status: BrandPackageQualityStatus;
  score: number;
  summary: string;
  checks: BrandPackageQualityCheck[];
}

interface BrandTestCase {
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
}

interface BrandTestCaseManifest {
  version: number;
  brand_slug: string;
  source_hash: string;
  generated_at: string | null;
  updated_at: string;
  generator?: {
    version?: number;
    provider: string;
    provider_label?: string;
    provider_type?: string;
    agent?: string;
    model: string | null;
    uses_model: boolean;
    settings_integrated: boolean;
    project_override?: boolean;
    model_source?: "environment" | "project" | "settings" | "default";
    enabled?: boolean;
    command?: string | null;
    base_url?: string | null;
    description: string;
  };
  model_control?: {
    active: NonNullable<BrandTestCaseManifest["generator"]>;
    source: "environment" | "project" | "settings" | "default";
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
  };
  package_quality?: BrandPackageQuality;
  cases: BrandTestCase[];
}

interface PackageRepairResult {
  slug: string;
  mode: RepairPackageMode;
  status: "completed";
  updated_at: string;
  commands: Array<{
    command: string;
    args: string[];
    stdout: string;
    stderr: string;
  }>;
}

/* ─── color helpers ─── */

function rgbToHex(rgb: string): string | null {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((v) => parseInt(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000" : "#ffffff";
}

function extractColors(
  tokens: DesignTokens | null,
  limit = 20
): Array<{ hex: string; count: number }> {
  const computed = tokens?.colours?.computed ?? [];
  const seen = new Set<string>();
  const result: Array<{ hex: string; count: number }> = [];
  for (const entry of computed) {
    if (result.length >= limit) break;
    const val = typeof entry.value === "string" ? entry.value : String(entry.value ?? "");
    const rgb = val.match(/rgba?\([^)]+\)/)?.[0];
    if (!rgb) continue;
    const hex = rgbToHex(rgb);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    result.push({ hex, count: entry.count });
  }
  return result;
}

function primaryFontName(value: string): string {
  return value.split(",")[0].trim().replace(/['"]/g, "");
}

/* ─── React markdown renderer (zero innerHTML) ─── */

interface MdHeading { type: "h1" | "h2" | "h3"; text: string }
interface MdParagraph { type: "p"; text: string }
interface MdListItem { type: "li"; text: string; ordered: boolean }
interface MdTable { type: "table"; headers: string[]; rows: string[][] }
interface MdBlank { type: "blank" }

type MdNode = MdHeading | MdParagraph | MdListItem | MdTable | MdBlank;

function parseMd(md: string): MdNode[] {
  const lines = md.split("\n");
  const nodes: MdNode[] = [];
  let tableHeaders: string[] | null = null;
  let tableRows: string[][] = [];
  let headerParsed = false;

  const flushTable = () => {
    if (tableHeaders) {
      nodes.push({ type: "table", headers: tableHeaders, rows: tableRows });
      tableHeaders = null;
      tableRows = [];
      headerParsed = false;
    }
  };

  for (const line of lines) {
    if (/^\|/.test(line)) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (/^\|[-:| ]+\|$/.test(line)) { headerParsed = true; continue; }
      if (!tableHeaders && !headerParsed) { tableHeaders = cells; continue; }
      if (!tableHeaders) { tableHeaders = []; }
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    if (/^### /.test(line)) { nodes.push({ type: "h3", text: line.slice(4) }); continue; }
    if (/^## /.test(line))  { nodes.push({ type: "h2", text: line.slice(3) }); continue; }
    if (/^# /.test(line))   { nodes.push({ type: "h1", text: line.slice(2) }); continue; }
    if (/^[-*] /.test(line))  { nodes.push({ type: "li", text: line.slice(2), ordered: false }); continue; }
    if (/^\d+\. /.test(line)) { nodes.push({ type: "li", text: line.replace(/^\d+\. /, ""), ordered: true }); continue; }
    if (line.trim() === "")   { nodes.push({ type: "blank" }); continue; }
    nodes.push({ type: "p", text: line });
  }
  flushTable();
  return nodes;
}

/** Render inline markdown (bold, italic, code) as React elements. */
function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  // Pattern: **bold** | *italic* | `code`
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let k = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined) parts.push(<strong key={k++}>{match[1]}</strong>);
    else if (match[2] !== undefined) parts.push(<em key={k++}>{match[2]}</em>);
    else if (match[3] !== undefined) parts.push(<code key={k++} className="rounded bg-muted/60 px-1 font-mono text-xs">{match[3]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function MarkdownView({ md }: { md: string }) {
  const nodes = parseMd(md);
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    if (node.type === "li") {
      const isOrdered = node.ordered;
      const items: string[] = [];
      while (
        i < nodes.length &&
        nodes[i].type === "li" &&
        (nodes[i] as MdListItem).ordered === isOrdered
      ) {
        items.push((nodes[i] as MdListItem).text);
        i++;
      }
      const Tag = isOrdered ? "ol" : "ul";
      elements.push(
        <Tag
          key={key++}
          className={`${isOrdered ? "list-decimal" : "list-disc"} my-2 space-y-0.5 pl-5 text-sm`}
        >
          {items.map((t, idx) => (
            <li key={idx}>
              <Inline text={t} />
            </li>
          ))}
        </Tag>
      );
      continue;
    }

    if (node.type === "h1") {
      elements.push(
        <h1 key={key++} className="mb-3 mt-4 text-xl font-bold">
          <Inline text={node.text} />
        </h1>
      );
    } else if (node.type === "h2") {
      elements.push(
        <h2 key={key++} className="mb-2 mt-6 border-b pb-1 text-lg font-semibold">
          <Inline text={node.text} />
        </h2>
      );
    } else if (node.type === "h3") {
      elements.push(
        <h3 key={key++} className="mb-1 mt-5 text-base font-semibold">
          <Inline text={node.text} />
        </h3>
      );
    } else if (node.type === "p") {
      elements.push(
        <p key={key++} className="my-1 text-sm leading-relaxed">
          <Inline text={node.text} />
        </p>
      );
    } else if (node.type === "blank") {
      elements.push(<div key={key++} className="my-1" />);
    } else if (node.type === "table") {
      elements.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {node.headers.map((h, ci) => (
                  <th
                    key={ci}
                    className="border border-border bg-muted/50 px-2 py-1 text-left font-medium"
                  >
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {node.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-border px-2 py-1">
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

/* ─── file helpers ─── */

function groupFilesByDir(files: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const f of files) {
    const parts = f.split("/");
    const dir = parts.length > 1 ? parts[0] : "(root)";
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(f);
  }
  return groups;
}

function titleCase(slug: string | undefined): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pageTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getLocalReplicaPageSlug(file: string): string | null {
  if (!file.includes("replica/") || !file.endsWith("page.tsx")) return null;
  const parts = file.split("/replica/");
  const sub = parts[1]?.replace("/page.tsx", "").replace("page.tsx", "") || "";
  return sub === "" ? "homepage" : sub;
}

function buildPreviewRoute(brandSlug: string, pageSlug: string): string {
  return `/api/brands/${brandSlug}/preview/${pageSlug}`;
}

function getReplicaPages(brand: BrandDetail): ReplicaPage[] {
  const pages = new Map<string, ReplicaPage>();

  for (const file of brand.files ?? []) {
    const htmlMatch = file.match(/^dom-extraction\/(.+)-snapshot\.html$/);
    if (htmlMatch) {
      const pageSlug = htmlMatch[1];
      pages.set(pageSlug, {
        name: pageSlug === "homepage" ? "Homepage" : pageTitle(pageSlug),
        route: buildPreviewRoute(brand.slug, pageSlug),
        previewKey: `html:${pageSlug}`,
        file,
        pageSlug,
        source: "html",
      });
    }
  }

  for (const file of brand.localFiles ?? []) {
    const pageSlug = getLocalReplicaPageSlug(file);
    if (!pageSlug || pages.has(pageSlug)) continue;
    const isHome = pageSlug === "homepage";
    const slug = isHome ? "" : pageSlug;
    pages.set(pageSlug, {
      name: isHome ? "Homepage" : pageTitle(pageSlug),
      route: `/brands/${brand.slug}/replica${slug ? `/${slug}` : ""}`,
      previewKey: `react:${pageSlug}`,
      file: `replica/${slug ? slug + "/" : ""}page.tsx`,
      pageSlug,
      source: "react",
    });
  }

  for (const file of brand.files ?? []) {
    const screenshotMatch = file.match(/^dom-extraction\/(.+)-screenshot\.png$/);
    if (screenshotMatch && !pages.has(screenshotMatch[1])) {
      const pageSlug = screenshotMatch[1];
      pages.set(pageSlug, {
        name: pageSlug === "homepage" ? "Homepage" : pageTitle(pageSlug),
        route: buildPreviewRoute(brand.slug, pageSlug),
        previewKey: `screenshot:${pageSlug}`,
        file,
        pageSlug,
        source: "screenshot",
      });
    }
  }

  const viewport = (brand.validation_report ?? {}).pixel_comparison_viewport as
    | Record<string, Record<string, number>>
    | undefined;

  Object.keys(viewport ?? {}).forEach((pageSlug) => {
    if (pages.has(pageSlug)) return;
    pages.set(pageSlug, {
      name: pageSlug === "homepage" ? "Homepage" : pageTitle(pageSlug),
      route: buildPreviewRoute(brand.slug, pageSlug),
      previewKey: `fallback:${pageSlug}`,
      file: `dom-extraction/${pageSlug}-snapshot.html`,
      pageSlug,
      source: "html",
    });
  });

  return Array.from(pages.values())
    .sort((a, b) => {
      if (a.pageSlug === "homepage") return -1;
      if (b.pageSlug === "homepage") return 1;
      return a.name.localeCompare(b.name);
    });
}

function validationScoreForPage(
  validationReport: Record<string, unknown>,
  pageSlug: string
): number | null {
  const viewport = validationReport.pixel_comparison_viewport as
    | Record<string, Record<string, number>>
    | undefined;
  const value = viewport?.[pageSlug]?.close;
  return typeof value === "number" ? value : null;
}

function statusTone(score: number | null, blockers = 0): string {
  if (blockers > 0) return "bg-red-50 text-red-700 ring-red-100";
  if (score === null) return "bg-muted text-muted-foreground ring-border";
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (score >= 60) return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-red-50 text-red-700 ring-red-100";
}

function normalizeStatusLabel(value: string | undefined): string {
  if (!value) return "AI review";
  return value.replaceAll("_", " ");
}

function isReadyComponentStatus(value: string | undefined): boolean {
  return value === "ready" || value === "verified" || value === "matched" || value === "ok";
}

function normalizePageSlug(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed, "https://design-extractor.localhost");
    const replicaMarker = `/replica/`;
    if (parsed.pathname.includes(replicaMarker)) {
      const tail = parsed.pathname.split(replicaMarker)[1]?.replace(/\/$/, "") ?? "";
      return tail || "homepage";
    }
    const previewMarker = `/preview/`;
    if (parsed.pathname.includes(previewMarker)) {
      return parsed.pathname.split(previewMarker)[1]?.replace(/\/$/, "") || "";
    }
  } catch {
    // Fall through to path/string heuristics below.
  }

  const lower = trimmed.toLowerCase();
  if (lower === "home" || lower === "homepage" || lower === "index") return "homepage";

  const noQuery = trimmed.split(/[?#]/, 1)[0];
  const replicaPathMatch = noQuery.match(/(?:^|\/)replica\/(.+?)\/page\.tsx$/);
  if (replicaPathMatch) return replicaPathMatch[1] || "homepage";
  if (/(?:^|\/)replica\/page\.tsx$/.test(noQuery)) return "homepage";

  const snapshotMatch = noQuery.match(/(?:^|\/)([^/]+)-(?:snapshot\.html|screenshot\.png)$/);
  if (snapshotMatch) return snapshotMatch[1];

  return noQuery
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .pop()
    ?.replace(/\.html$/, "")
    .replace(/\/?page\.tsx$/, "")
    || "";
}

function pageSlugFromSourcePage(sourcePage: string | undefined): string | null {
  if (!sourcePage) return null;
  const pageSlug = normalizePageSlug(sourcePage);
  return pageSlug || null;
}

function sourcePageToReplicaPage(brand: BrandDetail, sourcePage: string | undefined): ReplicaPage | null {
  const pageSlug = pageSlugFromSourcePage(sourcePage);
  if (!pageSlug) return null;
  const pages = getReplicaPages(brand);
  return pages.find((page) => page.pageSlug === pageSlug) ?? (pages.length === 1 ? pages[0] : null);
}

function componentCatalogueFromEvidence(
  brand: BrandDetail,
  manifest: ComponentManifest,
  report: ComponentReport
): ComponentCatalogueItem[] {
  const manifestItems = manifest.components ?? [];
  if (manifestItems.length > 0) {
    return manifestItems.map((component, index) => {
      const sourcePage = component.source_pages?.[0];
      const sourcePreviewPage = sourcePageToReplicaPage(brand, sourcePage);
      return {
        id: `manifest:${component.type ?? "component"}:${index}`,
        name: component.name ?? titleCase(component.type ?? "Component"),
        type: component.type ?? "component",
        status: component.status ?? "review",
        confidence: typeof component.confidence === "number" ? component.confidence : null,
        sourcePages: component.source_pages ?? [],
        sourceRoute: sourcePreviewPage?.route ?? null,
        libraryFile: component.library_file ?? null,
        evidenceMarkers: component.evidence?.markers ?? [],
      };
    });
  }

  const pages = report.pages ?? {};
  return Object.entries(pages).flatMap(([pageSlug, page]) =>
    (page.components ?? []).map((component, index) => {
      const sourcePreviewPage = sourcePageToReplicaPage(brand, pageSlug);
      return {
        id: `report:${pageSlug}:${index}`,
        name: component.heading || titleCase(component.original?.type as string | undefined) || "Component",
        type: String(component.original?.type ?? component.replica?.type ?? "component"),
        status: component.status ?? "review",
        confidence: typeof component.pixel_score === "number" ? component.pixel_score / 100 : null,
        sourcePages: [pageSlug],
        sourceRoute: sourcePreviewPage?.route ?? null,
        libraryFile: null,
        evidenceMarkers: component.issues ?? [],
      };
    })
  );
}

function flattenTokenObject(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => flattenTokenObject(item));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.$value === "string") return [record.$value];
    if (typeof record.value === "string") return [record.value];
    return Object.values(record).flatMap((item) => flattenTokenObject(item));
  }
  return [];
}

function firstTokenValue(value: unknown): string | null {
  return flattenTokenObject(value).find(Boolean) ?? null;
}

function designElementCatalogueFromTokens(tokens: Record<string, unknown> | null): DesignElementCatalogueItem[] {
  if (!tokens) return [];
  const items: DesignElementCatalogueItem[] = [];
  const palette = ((tokens.colours as Record<string, unknown> | undefined)?.palette ?? {}) as Record<string, unknown>;
  Object.entries(palette).slice(0, 12).forEach(([label, raw]) => {
    const value = firstTokenValue(raw);
    if (!value) return;
    items.push({
      id: `color:${label}`,
      label: titleCase(label.replace(/([a-z])([A-Z])/g, "$1-$2")),
      value,
      description: "Observed colour role from the extracted site palette.",
      tone: "color",
      swatch: value,
    });
  });

  const typography = (tokens.typography ?? {}) as Record<string, unknown>;
  const families = Array.isArray(typography.families) ? typography.families : [];
  families.slice(0, 4).forEach((family, index) => {
    if (!family || typeof family !== "object") return;
    const value = String((family as { value?: unknown }).value ?? "");
    if (!value) return;
    items.push({
      id: `type-family:${index}`,
      label: index === 0 ? "Primary Typeface" : "Supporting Typeface",
      value: primaryFontName(value),
      description: "Font family detected in the source and replica evidence.",
      tone: "type",
    });
  });

  const sizes = Array.isArray(typography.sizes) ? typography.sizes : [];
  sizes.slice(0, 5).forEach((size, index) => {
    if (!size || typeof size !== "object") return;
    const value = String((size as { value?: unknown }).value ?? "");
    if (!value) return;
    items.push({
      id: `type-size:${index}`,
      label: "Type Size",
      value,
      description: "Repeated text scale value observed in rendered pages.",
      tone: "type",
    });
  });

  const borderTokens = (tokens.border ?? tokens.borders ?? tokens.radii ?? {}) as Record<string, unknown>;
  Object.entries(borderTokens).slice(0, 8).forEach(([label, raw]) => {
    const value = firstTokenValue(raw);
    if (!value) return;
    items.push({
      id: `shape:${label}`,
      label: titleCase(label),
      value,
      description: "Border/radius design element used by component outlines.",
      tone: "shape",
    });
  });

  const spacing = (tokens.spacing ?? {}) as Record<string, unknown>;
  [...(Array.isArray(spacing.paddings) ? spacing.paddings : []), ...(Array.isArray(spacing.margins) ? spacing.margins : [])]
    .slice(0, 6)
    .forEach((space, index) => {
      if (!space || typeof space !== "object") return;
      const value = String((space as { value?: unknown }).value ?? "");
      if (!value) return;
      items.push({
        id: `space:${index}`,
        label: "Spacing",
        value,
        description: "Repeated padding or margin value from extracted layout rhythm.",
        tone: "space",
      });
    });

  const gradients = (tokens.gradient ?? {}) as Record<string, unknown>;
  Object.entries(gradients).slice(0, 4).forEach(([label, raw]) => {
    const value = firstTokenValue(raw);
    if (!value) return;
    items.push({
      id: `effect:${label}`,
      label: titleCase(label),
      value,
      description: "Gradient/background treatment that must be preserved in replicas.",
      tone: "effect",
    });
  });

  return items;
}

function sandboxForReplicaPage(page: Pick<ReplicaPage, "source"> | null | undefined): string | undefined {
  return page?.source === "react" ? undefined : "allow-same-origin";
}

function firstExistingBrandFile(brand: BrandDetail, candidates: string[]): string {
  const files = new Set(brand.files ?? []);
  return candidates.find((candidate) => files.has(candidate)) ?? candidates[0];
}

function brandFileUrl(brand: BrandDetail, relativePath: string): string {
  return `/api/brands/${brand.slug}/file/${relativePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

const BREAKPOINTS = [
  { label: "Desktop", width: 1440 },
  { label: "Tablet", width: 768 },
  { label: "Mobile", width: 390 },
] as const;

const TEST_CASE_REQUEST_TIMEOUT_MS = 180000;
const REPAIR_PACKAGE_REQUEST_TIMEOUT_MS = 420000;

async function fetchJsonWithTimeout<T>(
  input: string,
  init: RequestInit,
  timeoutMessage: string,
  timeoutMs = TEST_CASE_REQUEST_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response
        .json()
        .then((body) => (typeof body?.error === "string" ? body.error : null))
        .catch(() => null);
      throw new Error(detail ?? `HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/* ─── artifacts ─── */

function artifactUrl(slug: string, relativePath: string): string {
  return `/api/brands/${slug}/artifacts/${relativePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function hasAnyArtifacts(artifacts: BrandArtifactsSummary): boolean {
  return (
    artifacts.original_pages.length > 0 ||
    artifacts.replica_html_pages.length > 0 ||
    artifacts.has_compare ||
    artifacts.has_design_md ||
    artifacts.has_tokens_json ||
    artifacts.has_tokens_css ||
    artifacts.has_open_design_export ||
    artifacts.has_skill
  );
}

function ArtifactChip({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-colors hover:bg-[#0071e3]/10 hover:text-[#0071e3]"
    >
      {icon}
      {label}
      <ExternalLink className="size-3 opacity-50" />
    </a>
  );
}

function ArtifactGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[#86868b]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ArtifactsCard({
  slug,
  artifacts,
}: {
  slug: string;
  artifacts: BrandArtifactsSummary;
}) {
  const docs: { label: string; path: string }[] = [];
  if (artifacts.has_design_md) docs.push({ label: "DESIGN.md", path: "DESIGN.md" });
  if (artifacts.has_open_design_export)
    docs.push({ label: "Open-Design DESIGN.md", path: "open-design/DESIGN.md" });
  if (artifacts.has_skill) docs.push({ label: "SKILL.md", path: "skill/SKILL.md" });
  if (artifacts.has_tokens_css)
    docs.push({ label: "design-tokens.css", path: "design-tokens.css" });
  if (artifacts.has_tokens_json)
    docs.push({ label: "design-tokens.json", path: "design-tokens.json" });

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <FolderOpen className="size-4 text-[#86868b]" />
          Artifacts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {artifacts.original_pages.length > 0 && (
          <ArtifactGroup title={`Original mirror (${artifacts.original_pages.length} pages)`}>
            {artifacts.original_pages.map((page) => (
              <ArtifactChip
                key={page.slug}
                href={artifactUrl(slug, `original/${page.slug}/index.html`)}
                label={page.slug}
                icon={
                  page.has_verify ? (
                    <CheckCircle2 className="size-3 text-emerald-600" />
                  ) : (
                    <Globe2 className="size-3 text-[#86868b]" />
                  )
                }
              />
            ))}
          </ArtifactGroup>
        )}

        {(artifacts.replica_html_pages.length > 0 || artifacts.has_compare) && (
          <ArtifactGroup title="HTML replica">
            {artifacts.replica_html_pages.map((page) => (
              <ArtifactChip
                key={page}
                href={artifactUrl(slug, `replica-html/${page}.html`)}
                label={page}
                icon={<Code2 className="size-3 text-[#86868b]" />}
              />
            ))}
            {artifacts.has_compare && (
              <ArtifactChip
                href={artifactUrl(slug, "replica-html/compare.html")}
                label="Compare view"
                icon={<Eye className="size-3 text-[#86868b]" />}
              />
            )}
          </ArtifactGroup>
        )}

        {docs.length > 0 && (
          <ArtifactGroup title="Documents and tokens">
            {docs.map((doc) => (
              <ArtifactChip
                key={doc.path}
                href={artifactUrl(slug, doc.path)}
                label={doc.label}
                icon={<FileText className="size-3 text-[#86868b]" />}
              />
            ))}
          </ArtifactGroup>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── page ─── */

export default function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [replicaPage, setPreviewPage] = useState("replica");
  const [replicaWidth, setPreviewWidth] = useState(1440);
  const [improveJob, setImproveJob] = useState<ImprovementJobState | null>(null);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [startingImprove, setStartingImprove] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [qualityTarget, setQualityTarget] = useState(80);
  const [captureFiles, setCaptureFiles] = useState<File[]>([]);
  const [captureUploading, setCaptureUploading] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<"idle" | "checking" | "imported" | "not-imported">("idle");
  const [importCmdCopied, setImportCmdCopied] = useState(false);
  const [scaffoldCmdCopied, setScaffoldCmdCopied] = useState(false);
  const [gitCmdCopied, setGitCmdCopied] = useState(false);
  const [stack, setStack] = useState("next+tailwind+shadcn");
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, "good" | "needs_work">>({});
  const [testCases, setTestCases] = useState<BrandTestCaseManifest | null>(null);
  const [testCaseError, setTestCaseError] = useState<string | null>(null);
  const [generatingTestCases, setGeneratingTestCases] = useState<string[]>([]);
  const [repairingPackage, setRepairingPackage] = useState<string[]>([]);
  const [repairStatusMessage, setRepairStatusMessage] = useState<string | null>(null);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);

  const refreshBrand = useCallback(() => {
    return fetch(`/api/brands/${slug}?ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: BrandDetail) => setBrand(data))
      .catch((e) => setError(e.message));
  }, [slug]);

  const refreshTestCases = useCallback(() => {
    return fetchJsonWithTimeout<BrandTestCaseManifest>(
      `/api/brands/${slug}/test-cases?ts=${Date.now()}`,
      { cache: "no-store" },
      "Timed out while loading test cases. Restart the local dev server and try again."
    )
      .then((data: BrandTestCaseManifest) => {
        setTestCases(data);
        setActiveTestCaseId((current) => current ?? data.cases[0]?.id ?? null);
        setTestCaseError(null);
      })
      .catch((e) => setTestCaseError(e.message));
  }, [slug]);

  useEffect(() => {
    refreshBrand();
    setTestCases(null);
    setActiveTestCaseId(null);
    setActiveReviewId(null);
    setPreviewPage("replica");
  }, [refreshBrand]);

  useEffect(() => {
    if (activeTab === "test-cases") refreshTestCases();
    if (activeTab === "validation" || activeTab === "review") refreshBrand();
  }, [activeTab, refreshBrand, refreshTestCases]);

  useEffect(() => {
    const refresh = () => {
      refreshBrand();
      if (activeTab === "test-cases") refreshTestCases();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [activeTab, refreshBrand, refreshTestCases]);

  useEffect(() => {
    if (!brand) return;
    const pages = getReplicaPages(brand);
    if (pages.length === 0) return;
    if (!activeReviewId) {
      setActiveReviewId(`page:${pages[0].pageSlug}`);
    }
  }, [brand, activeReviewId]);

  useEffect(() => {
    if (!improveJob || improveJob.status !== "running") return;

    const interval = window.setInterval(() => {
      fetch(`/api/brands/${slug}/jobs/${improveJob.job_id}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data: ImprovementJobState) => {
          setImproveJob(data);
          if (data.status !== "running") {
            refreshBrand();
          }
        })
        .catch((e) => setImproveError(e.message));
    }, 2000);

    return () => window.clearInterval(interval);
  }, [slug, improveJob, refreshBrand]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleImprove() {
    setStartingImprove(true);
    setImproveError(null);
    try {
      const response = await fetch(`/api/brands/${slug}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetScore: qualityTarget }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setImproveJob(data.job as ImprovementJobState);
    } catch (e) {
      setImproveError(e instanceof Error ? e.message : "Failed to start improvement job");
    } finally {
      setStartingImprove(false);
    }
  }

  async function handleDownloadBundle() {
    setBundleLoading(true);
    setBundleError(null);
    try {
      const response = await fetch(`/api/brands/${slug}/bundle`);
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-design-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setBundleError(e instanceof Error ? e.message : "Failed to build design bundle");
    } finally {
      setBundleLoading(false);
    }
  }

  async function handleCancel() {
    if (!improveJob) return;
    try {
      await fetch(`/api/brands/${slug}/jobs/${improveJob.job_id}`, {
        method: "DELETE",
      });
      setImproveJob((prev) => prev ? { ...prev, status: "cancelled" } : null);
    } catch (e) {
      setImproveError(e instanceof Error ? e.message : "Failed to cancel job");
    }
  }

  async function handleTestCaseAction(action: "resume" | "regenerate-all" | "generate-one", caseId?: string) {
    const marker = caseId ?? action;
    setGeneratingTestCases((prev) => Array.from(new Set([...prev, marker])));
    setTestCaseError(null);
    try {
      const data = await fetchJsonWithTimeout<BrandTestCaseManifest>(
        `/api/brands/${slug}/test-cases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, caseId }),
        },
        "Timed out while loading test cases. Restart the local dev server and try again."
      );
      setTestCases(data);
      setActiveTestCaseId((current) => current ?? data.cases[0]?.id ?? null);
      await refreshBrand();
    } catch (e) {
      setTestCaseError(e instanceof Error ? e.message : "Failed to generate test cases");
    } finally {
      setGeneratingTestCases((prev) => prev.filter((item) => item !== marker));
    }
  }

  async function handleRepairPackage(mode: RepairPackageMode) {
    setRepairingPackage((prev) => Array.from(new Set([...prev, mode])));
    setTestCaseError(null);
    setRepairStatusMessage(
      `Repair running: ${mode === "all" ? "extracting identity/assets, publishing tokens, DESIGN.md, and SKILL.md" : `repairing ${mode}`} evidence. This can take a few minutes.`
    );
    try {
      const repairResult = await fetchJsonWithTimeout<PackageRepairResult>(
        `/api/brands/${slug}/repair-package`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        },
        "Timed out while repairing package evidence. Try a narrower repair action.",
        REPAIR_PACKAGE_REQUEST_TIMEOUT_MS
      );
      await refreshBrand();
      const updatedManifest = await fetchJsonWithTimeout<BrandTestCaseManifest>(
        `/api/brands/${slug}/test-cases?ts=${Date.now()}`,
        { cache: "no-store" },
        "Timed out while rechecking package evidence. Refresh the page to see the latest status."
      );
      setTestCases(updatedManifest);
      setActiveTestCaseId((current) => current ?? updatedManifest.cases[0]?.id ?? null);
      const remainingFailures = updatedManifest.package_quality?.checks.filter((check) => check.required && check.status === "fail") ?? [];
      setRepairStatusMessage(
        remainingFailures.length > 0
          ? `Repair completed (${repairResult.commands.length} steps), but required evidence is still missing: ${remainingFailures.map((check) => check.label).join(", ")}.`
          : `Repair completed (${repairResult.commands.length} steps). Required package evidence is ready.`
      );
    } catch (e) {
      setTestCaseError(e instanceof Error ? e.message : "Failed to repair package evidence");
      setRepairStatusMessage(null);
    } finally {
      setRepairingPackage((prev) => prev.filter((item) => item !== mode));
    }
  }

  async function handleTestCaseModelOverride(input: {
    useDefault?: boolean;
    providerId?: string;
    model?: string;
  }) {
    setTestCaseError(null);
    try {
      const data = await fetchJsonWithTimeout<BrandTestCaseManifest>(
        `/api/brands/${slug}/test-cases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "model-settings", ...input }),
        },
        "Timed out while saving test case model settings. Restart the local dev server and try again."
      );
      setTestCases(data);
      setActiveTestCaseId((current) => current ?? data.cases[0]?.id ?? null);
    } catch (e) {
      setTestCaseError(e instanceof Error ? e.message : "Failed to save test case model settings");
    }
  }

  async function handleTestCaseFeedback(
    caseId: string,
    target: TestCaseFeedbackTarget,
    sentiment: TestCaseFeedbackSentiment,
    note: string
  ) {
    const data = await fetchJsonWithTimeout<BrandTestCaseManifest>(
      `/api/brands/${slug}/test-cases`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", caseId, target, sentiment, note }),
      },
      "Timed out while saving test case feedback. Restart the local dev server and try again."
    );
    setTestCases(data);
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">Failed to load brand: {error}</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const tokens = brand.design_tokens as Record<string, unknown> | null;
  const colors = extractColors(brand.design_tokens);
  const typo = (tokens?.typography ?? {}) as Record<string, unknown>;
  const fontFamilies = (typo.families ?? []) as { value: string; count: number }[];
  const fontSizes = (typo.sizes ?? []) as { value: string; count: number }[];
  const fontWeights = (typo.weights ?? []) as { value: string; count: number }[];
  const lineHeights = (typo.line_heights ?? []) as { value: string; count: number }[];
  const spacingData = (tokens?.spacing ?? {}) as Record<string, unknown>;
  const spacingScale = (spacingData.scale ?? []) as string[];
  const baseUnit = spacingData.detected_base_unit as string | undefined;
  const borders = (tokens?.borders ?? {}) as Record<string, unknown>;
  const borderRadii = (borders.radii ?? []) as { value: string; count: number }[];
  const shadowList = (tokens?.shadows ?? []) as { value: string; count: number }[];
  const breakpointList = (tokens?.breakpoints ?? []) as number[];
  const transitionList = (tokens?.transitions ?? []) as { value: string; count: number }[];

  // Combine assets from brand dir AND public dir (localFiles)
  const brandAssets = brand.files.filter((f: string) => f.startsWith("assets/"));
  const publicAssets = (brand.localFiles ?? []).filter(
    (f: string) => f.startsWith("public/brands/") && !f.includes("/screenshots/") && !f.includes("/fonts/")
      && /\.(svg|png|jpg|jpeg|webp|gif|ico)$/i.test(f)
  );
  // Merge and deduplicate by filename
  const seenNames = new Set<string>();
  const allImageFiles: Array<{path: string; src: string; name: string}> = [];
  for (const f of brandAssets) {
    const name = f.split("/").pop() || f;
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    allImageFiles.push({path: f, src: `/api/brands/${brand.slug}/file/${f}`, name});
  }
  for (const f of publicAssets) {
    const name = f.split("/").pop() || f;
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    // public/brands/slug/foo.png -> /brands/slug/foo.png
    const publicPath = f.replace(/^public\//, "/");
    allImageFiles.push({path: f, src: publicPath, name});
  }
  const assetFiles = allImageFiles;
  const svgAssets = allImageFiles.filter((f) => f.name.endsWith(".svg"));
  const imgAssets = allImageFiles.filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name));

  const logoFile = svgAssets.find((f) => f.name.includes("logo"));
  const validationReport = (brand.validation_report ?? {}) as Record<string, unknown>;
  const componentReport = (brand.component_report ?? {}) as ComponentReport;
  const componentManifest = (brand.component_manifest ?? {}) as ComponentManifest;
  const replicaPages = getReplicaPages(brand);
  const componentCatalogue = componentCatalogueFromEvidence(brand, componentManifest, componentReport);
  const designElementCatalogue = designElementCatalogueFromTokens(tokens);
  const selectedReplicaPage =
    replicaPages.find((page) => page.previewKey === replicaPage) ?? replicaPages[0] ?? null;
  const validationDesktopAvg =
    typeof validationReport.desktop_avg === "number"
      ? validationReport.desktop_avg
      : typeof validationReport.viewport_avg === "number"
        ? validationReport.viewport_avg
        : null;
  const displayScore =
    validationDesktopAvg !== null ? validationDesktopAvg / 100 : brand.overall_score;
  const effectiveTarget = improveJob?.target_score ?? 80;
  const meetsQualityTarget =
    displayScore !== null && displayScore * 100 >= effectiveTarget;
  const isAssistedCaptureBlock = improveJob?.blocked_reason?.code === "anti_bot_block";

  const fileGroups = groupFilesByDir(brand.files);
  const localFileGroups = groupFilesByDir(brand.localFiles ?? []);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-2">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to library
        </Link>
      </div>

      <BrandSummaryCard detail={brand as unknown as Parameters<typeof BrandSummaryCard>[0]["detail"]} />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {brand.has_logo && logoFile && (
            <div className="flex h-14 shrink-0 items-center rounded-xl border border-[#d2d2d7]/50 bg-white px-4 py-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoFile?.src ?? ""}
                alt={`${titleCase(brand.slug)} logo`}
                className="h-9 w-auto"
              />
            </div>
          )}
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-[#1d1d1f]">
              {titleCase(brand.slug)}
            </h1>
            <a
              href={brand.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[14px] text-[#0071e3] hover:text-[#0077ED] hover:underline"
            >
              {brand.source_url}
              <ExternalLink className="size-3.5" />
            </a>
            <p className="mt-1 text-[12px] text-[#86868b]">
              Extracted on {new Date(brand.extracted_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          {(() => {
            const pct = displayScore !== null ? Math.round(displayScore * 100) : null;
            const scoreBg =
              pct === null
                ? "bg-[#f5f5f7] text-[#86868b]"
                : pct >= 80
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : pct >= 60
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    : "bg-red-50 text-red-700 ring-1 ring-red-200";
            return (
              <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[18px] font-bold ${scoreBg}`}>
                {pct !== null ? `${pct}%` : "N/A"}
                {brand.confidence && (
                  <span className="text-[12px] font-medium opacity-60">{brand.confidence}</span>
                )}
              </span>
            );
          })()}
          <div className="flex flex-wrap justify-end gap-1.5">
            {brand.categories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="rounded-md bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-medium text-[#1d1d1f]/70"
              >
                {cat}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={handleDownloadBundle}
              disabled={bundleLoading}
              className="gap-2 rounded-full bg-[#1d1d1f] px-5 text-white hover:bg-[#1d1d1f]/90"
              title="Download DESIGN.md, skill, design tokens, and logo/identity assets as one Open Design bundle"
            >
              {bundleLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {bundleLoading ? "Preparing bundle…" : "Download design bundle"}
            </Button>
            {bundleError && (
              <span className="max-w-[260px] text-right text-[11px] text-red-600">
                {bundleError}
              </span>
            )}
          </div>
        </div>
      </div>

      {brand.artifacts && hasAnyArtifacts(brand.artifacts) && (
        <ArtifactsCard slug={brand.slug} artifacts={brand.artifacts} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-6 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="design-md">DESIGN.md</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="replica">Preview</TabsTrigger>
          <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="skill">Skill</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
          <TabsTrigger value="files">Raw Files</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview">
          <div className="space-y-12">
            {/* At a Glance narrative */}
            {brand.design_md && (
              <div className="mx-auto max-w-3xl">
                <p className="text-[17px] leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
                  {(() => {
                    const lines = brand.design_md.split("\n");
                    const atGlanceIdx = lines.findIndex((l: string) => l.includes("Visual Theme") || l.includes("At a Glance"));
                    if (atGlanceIdx === -1) return brand.design_md.split("\n\n").slice(1, 3).join(" ").replace(/[#*]/g, "").trim().substring(0, 600);
                    const paragraphs: string[] = [];
                    for (let i = atGlanceIdx + 1; i < lines.length && paragraphs.length < 2; i++) {
                      const line = lines[i].trim();
                      if (line.startsWith("##")) break;
                      if (line.length > 50 && !line.startsWith("-") && !line.startsWith("*") && !line.startsWith("|")) {
                        paragraphs.push(line.replace(/[*`]/g, ""));
                      }
                    }
                    return paragraphs.join("\n\n") || "Design system extracted from the live web.";
                  })()}
                </p>
              </div>
            )}

            {/* Color palette - large swatches */}
            {colors.length > 0 && (
              <div>
                <h3 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                  Colour Palette
                </h3>
                <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                  {colors.slice(0, 10).map(({ hex, count }) => {
                    const fg = contrastColor(hex);
                    return (
                      <div key={hex} className="group">
                        <div
                          className="flex aspect-square items-end rounded-xl p-2 shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: hex, color: fg }}
                        >
                          <span className="font-mono text-[9px] font-medium opacity-80">{hex}</span>
                        </div>
                        <p className="mt-1 text-center text-[10px] text-[#86868b]">{count}x</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Typography */}
            {fontFamilies.length > 0 && (
              <div>
                <h3 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                  Typography
                </h3>
                <div className="space-y-6">
                  {fontFamilies.slice(0, 3).map((f, i) => {
                    const name = primaryFontName(f.value);
                    return (
                      <div key={i} className="flex items-baseline gap-6 border-b border-[#d2d2d7]/40 pb-6">
                        <span className="text-[40px] font-semibold leading-[1.1] text-[#1d1d1f]" style={{ fontFamily: f.value }}>
                          Aa
                        </span>
                        <div>
                          <span className="text-[17px] font-semibold text-[#1d1d1f]">{name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ×{f.count} usages
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Base Unit", value: baseUnit || "—" },
                { label: "Max Width", value: breakpointList.length > 0 ? `${Math.max(...breakpointList)}px` : "—" },
                { label: "Card Radius", value: borderRadii.length > 0 ? borderRadii[0].value : "—" },
                { label: "Motion", value: transitionList.length > 0 ? transitionList[0].value : "—" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[#f5f5f7] p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#86868b]">{s.label}</p>
                  <p className="mt-1 font-mono text-[21px] font-semibold text-[#1d1d1f]">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── REVIEW ── */}
        <TabsContent value="review">
          <DesignReviewBoard
            brand={brand}
            pages={replicaPages}
            validationReport={validationReport}
            componentReport={componentReport}
            componentManifest={componentManifest}
            activeId={activeReviewId}
            decisions={reviewDecisions}
            onActiveChange={setActiveReviewId}
            onDecision={(id, decision) =>
              setReviewDecisions((prev) => ({ ...prev, [id]: decision }))
            }
          />
        </TabsContent>

        {/* ── DESIGN.md ── */}
        <TabsContent value="design-md">
          {brand.design_md ? (
            <ScrollArea className="h-[700px]">
              <div className="rounded-lg border bg-background p-6">
                <MarkdownView md={brand.design_md} />
              </div>
            </ScrollArea>
          ) : (
            <EmptyState icon={<FileText className="size-8" />} message="No DESIGN.md available." />
          )}
        </TabsContent>

        {/* ── TOKENS ── */}
        <TabsContent value="tokens">
          <div className="space-y-6">
            {colors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="size-4" /> Colors
                    {brand.design_tokens?.colours?.total_raw !== undefined && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({brand.design_tokens.colours.total_filtered} unique of{" "}
                        {brand.design_tokens.colours.total_raw} sampled)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {colors.map(({ hex, count }) => {
                      const fg = contrastColor(hex);
                      return (
                        <div key={hex} className="overflow-hidden rounded-lg border shadow-sm">
                          <div
                            className="flex h-16 items-end p-2"
                            style={{ backgroundColor: hex, color: fg }}
                          >
                            <span className="font-mono text-[10px] font-medium opacity-90">
                              {hex}
                            </span>
                          </div>
                          <div className="bg-background px-2 py-1">
                            <span className="text-[10px] text-muted-foreground">
                              ×{count} usages
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {fontSizes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="size-4" /> Type Scale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fontSizes.slice(0, 12).map((s) => (
                      <div
                        key={s.value}
                        className="flex items-baseline gap-3 border-b pb-2 last:border-0"
                      >
                        <span className="leading-none text-foreground" style={{ fontSize: s.value }}>
                          Ag
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{s.value}</span>
                        <span className="text-xs text-muted-foreground/60">×{s.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {fontFamilies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="size-4" /> Font Families
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fontFamilies.map((f, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-baseline gap-2">
                        <span className="text-sm font-medium">{primaryFontName(f.value)}</span>
                        <span className="text-xs text-muted-foreground">{f.count} usages</span>
                      </div>
                      <p className="break-all font-mono text-[10px] text-muted-foreground">
                        {f.value}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {spacingScale.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Spacing Scale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-end gap-3">
                    {spacingScale.map((s) => (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <div
                          className="rounded bg-primary/20"
                          style={{ width: s, height: "16px", minWidth: "4px" }}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                  {baseUnit && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Base unit: <strong>{baseUnit}</strong>
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Font Weights */}
            {fontWeights.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Font Weights</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {fontWeights.map((w) => (
                      <div key={w.value} className="text-center">
                        <span className="text-2xl" style={{ fontWeight: Number(w.value) }}>Aa</span>
                        <p className="font-mono text-xs text-muted-foreground">{w.value}</p>
                        <p className="text-[10px] text-muted-foreground/60">{w.count}x</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Line Heights */}
            {lineHeights.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Line Heights</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {lineHeights.slice(0, 8).map((lh) => (
                      <div key={lh.value} className="rounded border px-3 py-2 text-center">
                        <span className="font-mono text-sm">{lh.value}</span>
                        <p className="text-[10px] text-muted-foreground">{lh.count}x</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Border Radii */}
            {borderRadii.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Border Radii</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-end gap-4">
                    {borderRadii.map((r) => (
                      <div key={r.value} className="flex flex-col items-center gap-2">
                        <div className="size-16 border-2 border-foreground/20 bg-muted" style={{ borderRadius: r.value }} />
                        <span className="font-mono text-[10px] text-muted-foreground">{r.value}</span>
                        <span className="text-[10px] text-muted-foreground/60">{r.count}x</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shadows */}
            {shadowList.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Box Shadows</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6">
                    {shadowList.map((s, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="size-20 rounded-lg bg-white" style={{ boxShadow: s.value }} />
                        <span className="max-w-32 break-all font-mono text-[10px] text-muted-foreground">{s.value}</span>
                        <span className="text-[10px] text-muted-foreground/60">{s.count}x</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Breakpoints */}
            {breakpointList.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Breakpoints</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {breakpointList.map((bp) => (
                      <div key={bp} className="rounded border px-3 py-1.5 font-mono text-xs text-muted-foreground">{bp}px</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transitions */}
            {transitionList.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Transitions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {transitionList.slice(0, 6).map((t, i) => (
                      <div key={i} className="flex items-center gap-3 rounded border px-3 py-2">
                        <span className="max-w-lg truncate font-mono text-xs text-muted-foreground">{t.value}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{t.count}x</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {brand.design_tokens_css && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="size-4" /> CSS Variables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <pre className="font-mono text-xs leading-relaxed">
                      {brand.design_tokens_css}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {!colors.length && !fontFamilies.length && !brand.design_tokens_css && (
              <EmptyState
                icon={<Palette className="size-8" />}
                message="No design tokens available."
              />
            )}
          </div>
        </TabsContent>

        {/* ── COMPONENTS ── */}
        <TabsContent value="components">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="size-4" /> Component Catalogue
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Original-site component and design-pattern inventory from the extraction manifest.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{componentCatalogue.length} components</Badge>
                    <Badge variant="outline">{componentManifest.taxonomy?.length ?? 0} tags</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {componentCatalogue.length === 0 ? (
                  <EmptyState icon={<Layers className="size-8" />} message="No component catalogue found. Run package repair or component extraction to populate this inventory." />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {componentCatalogue.map((component) => {
                      const ready = isReadyComponentStatus(component.status);
                      return (
                        <div key={component.id} className="rounded-xl border border-[#d2d2d7]/70 bg-white p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-[#1d1d1f]">{component.name}</h3>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                                  ready ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"
                                }`}>
                                  {normalizeStatusLabel(component.status)}
                                </span>
                              </div>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                type: {component.type}
                              </p>
                            </div>
                            {component.sourceRoute && (
                              <Link
                                href={component.sourceRoute}
                                target="_blank"
                                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium hover:bg-muted"
                              >
                                <ExternalLink className="size-3" /> Open
                              </Link>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg bg-[#f5f5f7] p-3">
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
                                Source
                              </p>
                              <p className="font-mono text-xs text-[#1d1d1f]">
                                {component.sourcePages.length > 0 ? component.sourcePages.join(", ") : "not mapped"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-[#f5f5f7] p-3">
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
                                Confidence
                              </p>
                              <p className="font-mono text-xs text-[#1d1d1f]">
                                {component.confidence !== null ? `${Math.round(component.confidence * 100)}%` : "manifest verified"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {[
                              ...component.evidenceMarkers.slice(0, 5),
                              ...(component.libraryFile ? [component.libraryFile] : []),
                            ].map((marker) => (
                              <span key={marker} className="rounded-full bg-[#f5f5f7] px-2 py-0.5 font-mono text-[10px] text-[#424245]">
                                {marker}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="size-4" /> Design Element Catalogue
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reusable visual elements extracted from the original site: colours, type, spacing, shapes, and effects.
                    </p>
                  </div>
                  <Badge variant="outline">{designElementCatalogue.length} elements</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {designElementCatalogue.length === 0 ? (
                  <EmptyState icon={<Palette className="size-8" />} message="No design element tokens found." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {designElementCatalogue.map((element) => (
                      <div key={element.id} className="flex min-h-24 gap-3 rounded-xl border border-[#d2d2d7]/70 bg-white p-4">
                        {element.tone === "color" && element.swatch ? (
                          <div className="h-14 w-14 shrink-0 rounded-lg border border-black/10" style={{ background: element.swatch }} />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f7] text-[#6e6e73]">
                            {element.tone === "type" ? <Type className="size-5" /> : element.tone === "shape" ? <PanelTop className="size-5" /> : element.tone === "space" ? <Maximize2 className="size-5" /> : <Palette className="size-5" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1d1d1f]">{element.label}</p>
                          <p className="truncate font-mono text-xs text-[#424245]">{element.value}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6e6e73]">{element.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="size-4" /> Shared React Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(brand.localFiles ?? []).filter((f: string) => f.startsWith("components/brands/") && f.endsWith(".tsx")).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reusable shared React files were generated yet. This brand currently has a page-level replica and a manifest-driven component catalogue.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(brand.localFiles ?? [])
                      .filter((f: string) => f.startsWith("components/brands/") && f.endsWith(".tsx"))
                      .map((f: string) => {
                        const fileName = f.split("/").pop() || f;
                        const name = fileName.replace(".tsx", "").split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
                        return (
                          <div key={f} className="rounded-lg border border-[#d2d2d7]/70 border-l-2 border-l-green-500 p-4">
                            <h3 className="mb-1 text-sm font-bold">{name}</h3>
                            <p className="font-mono text-[10px] text-muted-foreground/60">{fileName}</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorPlay className="size-4" /> Page Previews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {replicaPages.map((page) => (
                    <div key={page.name} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{page.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{page.file}</p>
                      </div>
                      <Link
                        href={page.route}
                        target="_blank"
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/80"
                      >
                        <ExternalLink className="size-3" /> Open
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── REPLICA ── */}
        <TabsContent value="replica">
          {replicaPages.length > 0 ? (
            <div className="flex flex-col gap-4">
              {/* React replica pages */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  React routes and rendered HTML snapshots discovered for this brand.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {replicaPages.map((page) => (
                    <Card key={page.name}>
                      <CardContent className="p-4">
                        <h3 className="mb-1 text-sm font-semibold">{page.name}</h3>
                        <p className="mb-3 font-mono text-[11px] text-muted-foreground">
                          {page.source === "react" ? "React route" : page.source === "html" ? "Rendered HTML" : "Screenshot"}
                        </p>
                        <div className="flex gap-2">
                          <Link
                            href={page.route}
                            target="_blank"
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                          >
                            <ExternalLink className="size-3" />
                            Open preview
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Embedded preview */}
              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Preview:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {replicaPages.map((p) => (
                      <Button
                        key={p.previewKey}
                        size="sm"
                        variant={selectedReplicaPage?.previewKey === p.previewKey ? "default" : "outline"}
                        onClick={() => setPreviewPage(p.previewKey)}
                      >
                        {p.pageSlug === "homepage" ? "Home" : p.name}
                      </Button>
                    ))}
                  </div>
                  <div className="mx-2 h-4 w-px bg-border" />
                  <span className="text-sm text-muted-foreground">Width:</span>
                  <div className="flex gap-1.5">
                    {BREAKPOINTS.map((bp) => (
                      <Button
                        key={bp.width}
                        size="sm"
                        variant={replicaWidth === bp.width ? "default" : "outline"}
                        onClick={() => setPreviewWidth(bp.width)}
                      >
                        {bp.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center overflow-auto rounded-lg border bg-muted/30 p-4 shadow-inner">
                  <div
                    className="overflow-hidden rounded-md border bg-white shadow-md transition-all"
                    style={{ width: `${replicaWidth}px`, maxWidth: "100%" }}
                  >
                    {selectedReplicaPage && (
                      <iframe
                        key={`${brand.slug}-${selectedReplicaPage.previewKey}`}
                        src={selectedReplicaPage.route}
                        title={`${brand.slug} ${selectedReplicaPage.name} preview`}
                        className="h-[700px] w-full border-0"
                        sandbox={sandboxForReplicaPage(selectedReplicaPage)}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<MonitorPlay className="size-8" />}
              message="No replica available for this brand."
            />
          )}
        </TabsContent>

        {/* ── TEST CASES ── */}
        <TabsContent value="test-cases">
          <TestCasesBoard
            brand={brand}
            manifest={testCases}
            error={testCaseError}
            repairStatusMessage={repairStatusMessage}
            generating={generatingTestCases}
            repairingPackage={repairingPackage}
            activeId={activeTestCaseId}
            onActiveChange={setActiveTestCaseId}
            onResume={() => handleTestCaseAction("resume")}
            onRegenerateAll={() => handleTestCaseAction("regenerate-all")}
            onRegenerateOne={(caseId) => handleTestCaseAction("generate-one", caseId)}
            onRepairPackage={handleRepairPackage}
            onModelOverride={handleTestCaseModelOverride}
            onSubmitFeedback={handleTestCaseFeedback}
          />
        </TabsContent>

        {/* ── ASSETS ── */}
        <TabsContent value="assets">
          {assetFiles.length === 0 ? (
            <EmptyState icon={<ImageIcon className="size-8" />} message="No assets found." />
          ) : (
            <div className="space-y-6">
              {svgAssets.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium">SVG Assets</h3>
                  <div className="flex flex-wrap gap-4">
                    {svgAssets.map((file) => (
                      <div key={file.path} className="flex flex-col gap-1.5">
                        <div className="flex h-20 w-40 items-center justify-center rounded-lg border bg-white p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.src}
                            alt={file.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <span className="max-w-40 break-all font-mono text-[10px] text-muted-foreground">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imgAssets.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium">Images ({imgAssets.length})</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {imgAssets.map((file) => (
                      <div key={file.path} className="flex flex-col gap-1.5">
                        <div className="flex h-28 items-center justify-center rounded-lg border bg-white p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.src}
                            alt={file.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <span className="break-all font-mono text-[10px] text-muted-foreground">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── SKILL ── */}
        <TabsContent value="skill">
          <div className="space-y-4">
            {/* Skill folder structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FolderOpen className="size-4" /> Skill Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {brand.files
                    .filter((f) => f.startsWith("skill/"))
                    .map((file) => (
                      <a
                        key={file}
                        href={`/api/brands/${brand.slug}/file/${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded px-2 py-1.5 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ChevronRight className="size-3 shrink-0" />
                        {file}
                      </a>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* SKILL.md content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">SKILL.md</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => brand.skill_md && handleCopy(brand.skill_md)}
                    disabled={!brand.skill_md}
                  >
                    {copied ? (
                      <><Check className="size-3" /> Copied</>
                    ) : (
                      <><Copy className="size-3" /> Copy</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {brand.skill_md || "No skill document available."}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── VALIDATION ── */}
        <TabsContent value="validation">
          <div className="space-y-10">
            {/* Verdict banner */}
            <div className={`rounded-2xl p-8 text-center ${meetsQualityTarget ? "bg-green-50" : "bg-amber-50"}`}>
              <p className="text-[40px] font-semibold leading-[1.1] tracking-tight">
                {displayScore !== null ? `${Math.round(displayScore * 100)}%` : "—"}
              </p>
              <p className="mt-2 text-[17px] text-[#86868b]">
                {meetsQualityTarget ? "Ready for review" : "Improvement recommended"}
              </p>
              <p className="mt-1 text-[13px] text-[#86868b]/60">
                Live viewport validation score across {
                  Object.keys(validationReport.pixel_comparison_viewport || {}).length
                } pages
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#86868b]">Target:</label>
                  <input
                    type="number"
                    min={50}
                    max={95}
                    value={qualityTarget}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 50 && v <= 95) setQualityTarget(v);
                    }}
                    className="h-8 w-16 rounded-lg border border-input bg-transparent px-2 text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    disabled={improveJob?.status === "running"}
                  />
                  <span className="text-xs text-[#86868b]">%</span>
                </div>
                <Button onClick={handleImprove} disabled={startingImprove || improveJob?.status === "running"}>
                  {startingImprove || improveJob?.status === "running" ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" /> Improve in progress
                    </>
                  ) : (
                    "Improve Quality"
                  )}
                </Button>
                {improveJob?.status === "running" && (
                  <Button variant="outline" onClick={handleCancel}>
                    <XCircle className="size-4" /> Cancel
                  </Button>
                )}
                {(improveJob?.status === "running" || improveJob?.status === "completed" || improveJob?.status === "failed" || improveJob?.status === "stalled") && (
                  <a
                    href={`/monitoring?job=${slug}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#d2d2d7] px-3 py-1.5 text-xs font-medium text-[#0071e3] hover:bg-[#f5f5f7]"
                  >
                    Watch in Monitoring &rarr;
                  </a>
                )}
              </div>
              {improveError && (
                <p className="mt-3 text-sm text-red-600">{improveError}</p>
              )}
            </div>

            {improveJob && (
              <div className="rounded-2xl border border-[#d2d2d7]/40 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1d1d1f]">Improvement Job</p>
                    <p className="text-xs text-[#86868b]">
                      Status: {improveJob.status} · Iteration {improveJob.current_iteration}/{improveJob.max_iterations}
                    </p>
                  </div>
                  {typeof improveJob.current_score === "number" && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {Math.round(improveJob.current_score * 100)}%
                    </Badge>
                  )}
                </div>

                {improveJob.pages_needing_work.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-[#86868b]">
                      Remaining pages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {improveJob.pages_needing_work.map((page, index) => (
                        <Badge key={`${page.slug ?? "page"}-${index}`} variant="secondary">
                          {(page.slug ?? "unknown").replaceAll("-", " ")}
                          {typeof page.current_score === "number" ? ` · ${page.current_score}%` : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {improveJob.blocked_reason && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-left">
                    <p className="text-sm font-semibold text-amber-900">
                      {isAssistedCaptureBlock ? "Assisted capture required" : "Validation refresh failed"}
                    </p>
                    <p className="mt-1 text-sm text-amber-800">{improveJob.blocked_reason.detail}</p>
                    {improveJob.assisted_capture_steps.length > 0 && (
                      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-amber-900">
                        {improveJob.assisted_capture_steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    )}
                    {isAssistedCaptureBlock && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                        <p className="mb-2 text-sm font-semibold text-[#1d1d1f]">Upload screenshots</p>
                        <p className="mb-3 text-xs text-[#86868b]">
                          Select PNG, JPG, JPEG, or WebP screenshots of the original site pages.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {captureFiles.map((file, i) => (
                            <div key={`${file.name}-${i}`} className="flex items-center gap-1.5 rounded-lg bg-[#f5f5f7] px-3 py-1.5 text-xs">
                              <span className="max-w-32 truncate font-mono text-[#1d1d1f]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setCaptureFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-[#86868b] hover:text-[#1d1d1f]"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#d2d2d7] bg-white px-3 text-xs font-medium text-[#1d1d1f] hover:bg-[#f5f5f7]">
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg,.webp"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const added = Array.from(e.target.files ?? []);
                                setCaptureFiles((prev) => [...prev, ...added]);
                                e.target.value = "";
                              }}
                            />
                            Choose files
                          </label>
                          <Button
                            size="sm"
                            disabled={captureFiles.length === 0 || captureUploading}
                            onClick={async () => {
                              setCaptureUploading(true);
                              try {
                                const fd = new FormData();
                                captureFiles.forEach((f) => fd.append("files", f));
                                const res = await fetch(`/api/brands/${slug}/assisted-capture`, {
                                  method: "POST",
                                  body: fd,
                                });
                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                const data = await res.json();
                                setCaptureFiles([]);
                                alert(`Imported ${data.count} file(s). You can now re-run improvement.`);
                              } catch (err) {
                                alert(err instanceof Error ? err.message : "Upload failed");
                              } finally {
                                setCaptureUploading(false);
                              }
                            }}
                          >
                            {captureUploading ? (
                              <><RefreshCw className="size-3 animate-spin" /> Uploading...</>
                            ) : (
                              <><Upload className="size-3" /> Upload {captureFiles.length > 0 ? `(${captureFiles.length})` : ""}</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {((improveJob.last_model_summary ?? improveJob.last_claude_summary) || (improveJob.model_log_path ?? improveJob.claude_log_path)) && (
                  <div className="mt-4 rounded-xl border border-[#d2d2d7]/40 bg-[#f5f5f7] p-4 text-left">
                    <p className="text-sm font-semibold text-[#1d1d1f]">Latest model refinement</p>
                    {improveJob.model_provider && (
                      <p className="mt-1 text-xs text-[#86868b]">{improveJob.model_provider}</p>
                    )}
                    {(improveJob.last_model_summary ?? improveJob.last_claude_summary) && (
                      <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-5 text-[#424245]">
                        {improveJob.last_model_summary ?? improveJob.last_claude_summary}
                      </pre>
                    )}
                    {(improveJob.model_log_path ?? improveJob.claude_log_path) && (
                      <p className="mt-2 font-mono text-[11px] text-[#6e6e73]">
                        Log: {improveJob.model_log_path ?? improveJob.claude_log_path}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Per-page comparison with screenshots */}
            <div>
              <h3 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Page-by-page comparison
              </h3>
              <div className="space-y-6">
                {(() => {
                  const vp = (brand.validation_report as Record<string, unknown>)?.pixel_comparison_viewport as Record<string, Record<string, number>> | undefined;
                  if (!vp) return null;
                  return Object.entries(vp).map(([slug, data]) => {
                    const score = data?.close ?? 0;
                    const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    const preview = slug === "homepage" ? `/brands/${brand.slug}/replica` : `/brands/${brand.slug}/replica/${slug}`;
                    const origImg = brandFileUrl(
                      brand,
                      firstExistingBrandFile(brand, [
                        `screenshots/harness/orig-${slug}.png`,
                        `screenshots/reference/${slug}.png`,
                        "screenshots/reference/homepage.png",
                      ])
                    );
                    const replImg = brandFileUrl(
                      brand,
                      firstExistingBrandFile(brand, [
                        `screenshots/harness/repl-${slug}.png`,
                        `replica-screenshots/${slug}.png`,
                        "replica-screenshots/homepage.png",
                      ])
                    );
                    return (
                      <div key={slug} className="rounded-xl border border-[#d2d2d7]/40 p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h4 className="text-[17px] font-semibold text-[#1d1d1f]">{name}</h4>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${score >= 70 ? "bg-green-100 text-green-800" : score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                              {score}%
                            </span>
                          </div>
                          <Link
                            href={preview}
                            target="_blank"
                            className="text-[13px] text-[#0071e3] hover:underline"
                          >
                            Open preview
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[#86868b]">Original (full page)</p>
                            <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-[#f5f5f7]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={origImg}
                                alt={`Original ${name}`}
                                className="w-full"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[#86868b]">Replica (full page)</p>
                            <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-[#f5f5f7]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={replImg}
                                alt={`Preview ${name}`}
                                className="w-full"
                              />
                            </div>
                            <p className="mt-2 text-[11px] leading-5 text-[#86868b]">
                              This image is a saved validation screenshot. Use <span className="font-medium text-[#1d1d1f]">Open preview</span> for the live route.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Validation gates */}
            <div>
              <h3 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Validation Gates
              </h3>
              <div className="space-y-2">
                {(() => {
                  const viewportEntries = Object.entries(
                    ((brand.validation_report as Record<string, unknown>)?.pixel_comparison_viewport as Record<string, Record<string, number>> | undefined) ?? {}
                  );
                  const validationPageCount = viewportEntries.length;
                  const metadataPagesExtracted =
                    typeof brand.metadata?.pages_extracted === "number" ? brand.metadata.pages_extracted : 0;
                  const domCount = brand.files.filter((f: string) =>
                    f.includes("dom-extraction") && f.endsWith(".json") && !f.endsWith("-measurements.json")
                  ).length;
                  const pageCount = Math.max(metadataPagesExtracted, domCount, validationPageCount);
                  const brandAssetCount = brand.files.filter((f: string) => f.startsWith("assets/")).length;
                  const publicAssetCount = (brand.localFiles ?? []).filter((f: string) =>
                    f.startsWith(`public/brands/${brand.slug}/`) && !f.includes("/screenshots/")
                  ).length;
                  const assetCount = brandAssetCount + publicAssetCount;
                  const replicaCount = Math.max(
                    (brand.localFiles ?? []).filter((f: string) => f.includes("replica/") && f.endsWith("page.tsx")).length,
                    brand.has_replica ? 1 : 0
                  );
                  const requiredReplicaPages = Math.max(validationPageCount, 1);
                  const vp = ((brand.validation_report as Record<string, unknown>)?.desktop_avg ?? (brand.validation_report as Record<string, unknown>)?.viewport_avg) as number | undefined;
                  return [
                    { gate: "Pages extracted", status: pageCount >= requiredReplicaPages, detail: `${pageCount} page${pageCount === 1 ? "" : "s"}` },
                    { gate: "Assets downloaded", status: assetCount > 0 || brand.has_logo, detail: `${assetCount} file${assetCount === 1 ? "" : "s"}` },
                    { gate: "React previews built", status: replicaCount >= requiredReplicaPages, detail: `${replicaCount} page${replicaCount === 1 ? "" : "s"}` },
                    { gate: "Screenshot match", status: (vp ?? 0) >= 70, detail: vp ? `${vp}% avg` : "pending" },
                    { gate: "DESIGN.md", status: brand.design_md !== null, detail: brand.design_md ? `${brand.design_md.split("\n").length} lines` : "missing" },
                    { gate: "SKILL.md", status: brand.skill_md !== null, detail: brand.skill_md ? `${brand.skill_md.split("\n").length} lines` : "missing" },
                  ];
                })().map((g) => (
                  <div key={g.gate} className="flex items-center gap-3 rounded-lg border border-[#d2d2d7]/40 px-4 py-3">
                    <div className={`size-2 rounded-full ${g.status ? "bg-green-500" : "bg-amber-500"}`} />
                    <span className="flex-1 text-sm text-[#1d1d1f]">{g.gate}</span>
                    <span className="text-[13px] text-[#86868b]">{g.detail}</span>
                    <span className={`text-xs font-medium ${g.status ? "text-green-700" : "text-amber-700"}`}>
                      {g.status ? "PASS" : "NEEDS WORK"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw report */}
            {brand.validation_report && (
              <details className="rounded-xl border border-[#d2d2d7]/40">
                <summary className="cursor-pointer px-5 py-3 text-[13px] font-medium text-[#86868b]">
                  Raw validation data
                </summary>
                <div className="border-t px-5 py-4">
                  <pre className="font-mono text-[11px] leading-relaxed text-[#86868b]">
                    {JSON.stringify(brand.validation_report, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </TabsContent>

        {/* ── USAGE ── */}
        <TabsContent value="usage">
          <div className="mx-auto max-w-3xl space-y-10">
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-[0.007em] text-[#1d1d1f]">
                Use this design system
              </h2>
              <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.374px] text-[#86868b]">
                Copy the DESIGN.md into your project and let coding agents build matching UI.
              </p>
            </div>

            {/* Quick install */}
            <div className="rounded-2xl bg-[#f5f5f7] p-8">
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Quick Start
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-[#1d1d1f]">1. Copy the DESIGN.md into your project root:</p>
                  <code className="block rounded-lg bg-[#1d1d1f] px-4 py-3 font-mono text-sm text-white">
                    cp ~/.claude/design-library/brands/{brand.slug}/DESIGN.md ./DESIGN.md
                  </code>
                </div>
                <div>
                  <p className="mb-2 text-sm text-[#1d1d1f]">2. Copy the skill for Claude Code agents:</p>
                  <code className="block rounded-lg bg-[#1d1d1f] px-4 py-3 font-mono text-sm text-white">
                    cp -r ~/.claude/design-library/brands/{brand.slug}/skill/ ./.claude/skills/{brand.slug}/
                  </code>
                </div>
                <div>
                  <p className="mb-2 text-sm text-[#1d1d1f]">3. Copy the assets (fonts, images, icons):</p>
                  <code className="block rounded-lg bg-[#1d1d1f] px-4 py-3 font-mono text-sm text-white">
                    cp -r ~/.claude/design-library/brands/{brand.slug}/assets/ ./public/brands/{brand.slug}/
                  </code>
                </div>
              </div>
            </div>

            {/* What you get */}
            <div>
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                What&apos;s Included
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { name: "DESIGN.md", desc: "Complete design system documentation (1,137 lines). Visual theme, colour palette, typography rules, component stylings, layout principles, do's/don'ts, responsive behaviour, agent prompt guide.", size: "~50KB" },
                  { name: "SKILL.md", desc: "Claude Code skill file. Drop into .claude/skills/ and agents will build matching UI automatically. 12 positive triggers, do/don't table.", size: "~5KB" },
                  { name: "design-tokens.json", desc: "Raw extracted tokens: colours, typography, spacing, radii, shadows, breakpoints, transitions. Machine-readable.", size: "~15KB" },
                  { name: "assets/", desc: "Brand fonts, logo SVG, social icon SVGs, downloaded images and backgrounds.", size: "~2MB" },
                ].map((item) => (
                  <div key={item.name} className="rounded-xl border border-[#d2d2d7]/40 p-5">
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-mono text-sm font-semibold text-[#1d1d1f]">{item.name}</h4>
                      <span className="text-[11px] text-[#86868b]">{item.size}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.38] text-[#86868b]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* React components */}
            <div>
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                React Components (shadcn/ui)
              </h3>
              <p className="mb-4 text-sm text-[#86868b]">
                Copy the pre-built React components into your Next.js project:
              </p>
              <code className="block rounded-lg bg-[#1d1d1f] px-4 py-3 font-mono text-sm text-white">
                {`cp -r {project}/ui/components/brands/${brand.slug.split("-").slice(0, -2).join("-") || brand.slug}/ ./components/brands/`}
              </code>
              <div className="mt-4 space-y-2">
                {(brand.localFiles ?? [])
                  .filter((f: string) => f.startsWith("components/brands/") && f.endsWith(".tsx"))
                  .map((f: string) => {
                    const fileName = f.split("/").pop() || f;
                    const name = fileName.replace(".tsx", "").split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
                    return (
                      <div key={f} className="flex items-center gap-2 text-[13px] text-[#1d1d1f]">
                        <div className="size-1.5 rounded-full bg-[#1d1d1f]" />
                        {name} <span className="text-[#86868b]">({fileName})</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* File locations */}
            <div>
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                File Locations
              </h3>
              <div className="space-y-3 font-mono text-[13px]">
                <div className="flex justify-between border-b border-[#d2d2d7]/40 pb-2">
                  <span className="text-[#86868b]">Library root</span>
                  <span className="text-[#1d1d1f]">~/.claude/design-library/</span>
                </div>
                <div className="flex justify-between border-b border-[#d2d2d7]/40 pb-2">
                  <span className="text-[#86868b]">Brand directory</span>
                  <span className="text-[#1d1d1f]">~/.claude/design-library/brands/{brand.slug}/</span>
                </div>
                <div className="flex justify-between border-b border-[#d2d2d7]/40 pb-2">
                  <span className="text-[#86868b]">React components</span>
                  <span className="text-[#1d1d1f]">ui/components/brands/{brand.slug}/</span>
                </div>
                <div className="flex justify-between border-b border-[#d2d2d7]/40 pb-2">
                  <span className="text-[#86868b]">Preview pages</span>
                  <span className="text-[#1d1d1f]">ui/app/brands/{brand.slug}/replica/</span>
                </div>
                <div className="flex justify-between border-b border-[#d2d2d7]/40 pb-2">
                  <span className="text-[#86868b]">Public assets</span>
                  <span className="text-[#1d1d1f]">ui/public/brands/{brand.slug}/</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-[#86868b]">Extraction cache</span>
                  <span className="text-[#1d1d1f]">~/.claude/design-library/cache/{brand.slug}/</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── PUBLISH ── */}
        <TabsContent value="publish">
          <div className="mx-auto max-w-3xl space-y-12">
            {/* Section 1: Import into agentic-designer */}
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-[0.007em] text-[#1d1d1f]">
                Import into agentic-designer
              </h2>
              <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.374px] text-[#86868b]">
                Import this brand&apos;s design tokens into agentic-designer for use in new
                projects.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5f5f7] p-8">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-[#1d1d1f]">Shell command:</p>
                  <div className="relative">
                    <code className="block w-full overflow-x-auto rounded-lg bg-[#1d1d1f] px-4 py-3 font-mono text-sm text-white">
                      npx @imehr/agentic-designer theme import
                      ~/.claude/design-library/brands/{brand.slug}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `npx @imehr/agentic-designer theme import ~/.claude/design-library/brands/${brand.slug}`
                        );
                        setImportCmdCopied(true);
                        setTimeout(() => setImportCmdCopied(false), 2000);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {importCmdCopied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      setPublishStatus("checking");
                      try {
                        const res = await fetch(
                          `/api/publish/check-status?slug=${brand.slug}`
                        );
                        const data = await res.json();
                        setPublishStatus(
                          data.imported ? "imported" : "not-imported"
                        );
                      } catch {
                        setPublishStatus("not-imported");
                      }
                    }}
                  >
                    <RefreshCw
                      className={`mr-1.5 size-3.5 ${publishStatus === "checking" ? "animate-spin" : ""}`}
                    />
                    Check Import Status
                  </Button>
                  {publishStatus === "imported" && (
                    <span className="flex items-center gap-1.5 text-sm text-[#1d1d1f]">
                      <CheckCircle2 className="size-4 text-green-600" />
                      Imported
                    </span>
                  )}
                  {publishStatus === "not-imported" && (
                    <span className="text-sm text-[#86868b]">Not imported</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Scaffold from this brand */}
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-[0.007em] text-[#1d1d1f]">
                Scaffold from this brand
              </h2>
              <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.374px] text-[#86868b]">
                Create a new project pre-configured with this brand&apos;s design system.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5f5f7] p-8">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-[#1d1d1f]">Stack:</p>
                  <select
                    value={stack}
                    onChange={(e) => setStack(e.target.value)}
                    className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#1d1d1f]/20"
                  >
                    <option value="next+tailwind+shadcn">
                      Next.js + Tailwind + shadcn/ui
                    </option>
                    <option value="react+antd">React + Ant Design</option>
                    <option value="react+tailwind+radix">
                      React + Tailwind + Radix
                    </option>
                  </select>
                </div>
                <div>
                  <p className="mb-2 text-sm text-[#1d1d1f]">Shell command:</p>
                  <div className="relative">
                    <code className="block w-full overflow-x-auto whitespace-nowrap rounded-lg bg-[#1d1d1f] px-4 py-3 font-mono text-sm text-white">
                      npx @imehr/agentic-designer init my-{brand.slug}-app --brand {brand.slug}
                      {stack !== "next+tailwind+shadcn" ? `--stack ${stack}` : ""}
                    </code>
                    <button
                      onClick={() => {
                        const cmd = `npx @imehr/agentic-designer init my-${brand.slug}-app --brand ${brand.slug}${stack !== "next+tailwind+shadcn" ? ` --stack ${stack}` : ""}`;
                        setScaffoldCmdCopied(true);
                        setTimeout(() => setScaffoldCmdCopied(false), 2000);
                        navigator.clipboard.writeText(cmd);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {scaffoldCmdCopied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Token Preview */}
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-[0.007em] text-[#1d1d1f]">
                Token Preview
              </h2>
              <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.374px] text-[#86868b]">
                How extracted tokens map to agentic-designer tokens.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5f5f7] p-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d2d2d7]/40">
                      <th className="pb-3 pr-6 text-left font-semibold text-[#1d1d1f]">
                        design-extractor
                      </th>
                      <th className="pb-3 text-left font-semibold text-[#1d1d1f]">
                        agentic-designer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d2d2d7]/40">
                    {[
                      ["colours.palette.primary", "Color.primary"],
                      ["colours.palette.surface", "Color.background"],
                      ["colours.palette.on-surface", "Color.foreground"],
                      ["colours.palette.border", "Color.border"],
                      ["typography.families[0]", "Typography.font_family"],
                      ["spacing.detected_base_unit", "Spacing.unit"],
                    ].map(([from, to]) => (
                      <tr key={from}>
                        <td className="py-2.5 pr-6 font-mono text-[13px] text-[#1d1d1f]">
                          {from}
                        </td>
                        <td className="py-2.5 font-mono text-[13px] text-[#86868b]">
                          {to}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Theme Registry */}
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-[0.007em] text-[#1d1d1f]">
                Theme Registry
              </h2>
              <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.374px] text-[#86868b]">
                The design-systems/ directory is Git-backed. Commit and push to back up this
                theme to GitHub.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5f5f7] p-8">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-[#1d1d1f]">Git command:</p>
                  <div className="relative">
                    <code className="block w-full overflow-x-auto rounded-lg bg-[#1d1d1f] px-4 py-3 font-mono text-sm text-white">
                      git add design-systems/{brand.slug}/ {"&&"} git commit -m
                      &quot;theme: import {brand.slug}&quot; {"&&"} git push
                    </code>
                    <button
                      onClick={() => {
                        const cmd = `git add design-systems/${brand.slug}/ && git commit -m "theme: import ${brand.slug}" && git push`;
                        setGitCmdCopied(true);
                        setTimeout(() => setGitCmdCopied(false), 2000);
                        navigator.clipboard.writeText(cmd);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {gitCmdCopied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── RAW FILES ── */}
        <TabsContent value="files">
          {brand.files.length === 0 ? (
            <EmptyState icon={<FolderOpen className="size-8" />} message="No files found." />
          ) : (
            <div className="space-y-4">
              {Object.entries(fileGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dir, dirFiles]) => (
                  <Card key={dir} size="sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1.5 text-sm">
                        <FolderOpen className="size-4 text-muted-foreground" />
                        {dir}
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {dirFiles.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-0.5">
                        {dirFiles.map((file) => (
                          <li key={file}>
                            <a
                              href={`/api/brands/${brand.slug}/file/${file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <ChevronRight className="size-3 shrink-0" />
                              {file}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Local React component files */}
          {(brand.localFiles ?? []).length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Local React/Next.js Files</h3>
              {Object.entries(localFileGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dir, dirFiles]) => (
                  <Card key={`local-${dir}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1.5 text-sm">
                        <Code2 className="size-4 text-green-600" />
                        {dir}
                        <Badge variant="outline" className="ml-auto text-[10px]">{dirFiles.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-0.5">
                        {dirFiles.map((file) => (
                          <li key={file} className="flex items-center gap-1.5 px-1.5 py-1 font-mono text-xs text-muted-foreground">
                            <ChevronRight className="size-3 shrink-0 text-green-600" />
                            {file}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── test cases ── */

function TestCasesBoard({
  brand,
  manifest,
  error,
  repairStatusMessage,
  generating,
  repairingPackage,
  activeId,
  onActiveChange,
  onResume,
  onRegenerateAll,
  onRegenerateOne,
  onRepairPackage,
  onModelOverride,
  onSubmitFeedback,
}: {
  brand: BrandDetail;
  manifest: BrandTestCaseManifest | null;
  error: string | null;
  repairStatusMessage: string | null;
  generating: string[];
  repairingPackage: string[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  onResume: () => void;
  onRegenerateAll: () => void;
  onRegenerateOne: (caseId: string) => void;
  onRepairPackage: (mode: RepairPackageMode) => void;
  onModelOverride: (input: { useDefault?: boolean; providerId?: string; model?: string }) => Promise<void>;
  onSubmitFeedback: (
    caseId: string,
    target: TestCaseFeedbackTarget,
    sentiment: TestCaseFeedbackSentiment,
    note: string
  ) => Promise<void>;
}) {
  const cases = manifest?.cases ?? [];
  const completedCount = cases.filter((item) => item.status === "completed").length;
  const staleCount = cases.filter((item) => item.status === "stale").length;
  const pendingCount = cases.filter((item) => item.status === "pending" || item.status === "failed").length;
  const needsResume = staleCount + pendingCount > 0;
  const busyAll = generating.includes("resume") || generating.includes("regenerate-all");
  const modelControl = manifest?.model_control;
  const activeGenerator = modelControl?.active ?? manifest?.generator;
  const [selectedProviderId, setSelectedProviderId] = useState(activeGenerator?.provider ?? "");
  const [selectedModel, setSelectedModel] = useState(activeGenerator?.model ?? "");
  const [savingModel, setSavingModel] = useState(false);
  useEffect(() => {
    setSelectedProviderId(activeGenerator?.provider ?? "");
    setSelectedModel(activeGenerator?.model ?? "");
  }, [activeGenerator?.provider, activeGenerator?.model]);
  const selectedProvider = modelControl?.available_providers.find((provider) => provider.id === selectedProviderId);
  const selectedProviderModels = Array.from(new Set([
    selectedModel,
    selectedProvider?.model,
    ...(selectedProvider?.model_presets ?? []),
  ].filter((value): value is string => Boolean(value))));
  const modelScopeLabel = activeGenerator?.project_override
    ? "Project override"
    : activeGenerator?.model_source === "settings"
      ? "Global default"
      : activeGenerator?.model_source === "environment"
        ? "Environment override"
        : "Built-in default";
  const generatorLabel = activeGenerator?.uses_model
    ? `${activeGenerator.provider_label ?? activeGenerator.provider}${activeGenerator.model ? ` · ${activeGenerator.model}` : ""}`
    : "Local renderer · no model";
  const packageQuality = manifest?.package_quality;
  const requiredFailures = packageQuality?.checks.filter((check) => check.required && check.status === "fail") ?? [];
  const blocksGeneration = requiredFailures.length > 0;
  const repairBusy = repairingPackage.length > 0;
  const activeRepairMode = repairingPackage[0] ?? null;
  const primaryActionLabel =
    blocksGeneration ? "Fix package first" : manifest === null ? "Generate Test Cases" : needsResume ? "Resume" : "All generated";
  async function saveProjectModelOverride() {
    if (!selectedProviderId) return;
    setSavingModel(true);
    try {
      await onModelOverride({
        providerId: selectedProviderId,
        model: selectedModel,
      });
    } finally {
      setSavingModel(false);
    }
  }

  async function useGlobalDefaultModel() {
    setSavingModel(true);
    try {
      await onModelOverride({ useDefault: true });
    } finally {
      setSavingModel(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#d2d2d7]/70 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d2d2d7]/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <PanelTop className="mt-0.5 size-4 text-[#6e6e73]" />
          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f]">Test Cases</h2>
            <p className="text-[13px] leading-5 text-[#6e6e73]">
              Scenario pages generated from DESIGN.md, SKILL.md, tokens, assets, validation, and DOM extraction evidence.
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#86868b]">
              Generator: {generatorLabel}
              {activeGenerator?.settings_integrated ? ` · ${modelScopeLabel}` : " · Settings model not used"}
            </p>
            {modelControl && activeGenerator && (
              <div className="mt-3 max-w-3xl rounded-lg border border-[#d2d2d7]/70 bg-white px-3 py-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73]">
                      Model Router
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[11px] text-[#424245]">
                        Provider: {activeGenerator.provider_label ?? activeGenerator.provider}
                      </span>
                      <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[11px] text-[#424245]">
                        Agent: {activeGenerator.agent ?? activeGenerator.provider_type ?? "unknown"}
                      </span>
                      <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[11px] text-[#424245]">
                        Model: {activeGenerator.model}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                        activeGenerator.project_override
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {modelScopeLabel}
                      </span>
                    </div>
                    {!activeGenerator.enabled && (
                      <p className="mt-2 text-xs text-red-600">
                        Selected provider is disabled. Choose another provider before generating.
                      </p>
                    )}
                  </div>
                  <Link
                    href="/settings"
                    className="rounded-md border border-[#d2d2d7] px-2.5 py-1.5 text-xs font-medium text-[#0071e3] hover:bg-[#f5f5f7]"
                  >
                    Settings
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto_auto]">
                  <select
                    value={selectedProviderId}
                    onChange={(event) => {
                      const provider = modelControl.available_providers.find((item) => item.id === event.target.value);
                      setSelectedProviderId(event.target.value);
                      setSelectedModel(provider?.model ?? "");
                    }}
                    disabled={busyAll || repairBusy || savingModel}
                    className="h-9 rounded-md border border-[#d2d2d7] bg-white px-2 text-sm text-[#1d1d1f]"
                  >
                    {modelControl.available_providers.map((provider) => (
                      <option key={provider.id} value={provider.id} disabled={!provider.enabled}>
                        {provider.label}{provider.enabled ? "" : " (disabled)"}
                      </option>
                    ))}
                  </select>
                  {selectedProviderModels.length > 0 ? (
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      disabled={busyAll || repairBusy || savingModel}
                      className="h-9 rounded-md border border-[#d2d2d7] bg-white px-2 text-sm text-[#1d1d1f]"
                    >
                      {selectedProviderModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      disabled={busyAll || repairBusy || savingModel}
                      className="h-9 rounded-md border border-[#d2d2d7] bg-white px-2 text-sm text-[#1d1d1f]"
                      placeholder="model name"
                    />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={useGlobalDefaultModel}
                    disabled={busyAll || repairBusy || savingModel || !activeGenerator.project_override}
                  >
                    Use global default
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveProjectModelOverride}
                    disabled={busyAll || repairBusy || savingModel || !selectedProviderId || !selectedModel}
                  >
                    {savingModel ? <RefreshCw className="size-3 animate-spin" /> : null}
                    Save project override
                  </Button>
                </div>
              </div>
            )}
            {packageQuality && (
              <div className="mt-2 max-w-3xl rounded-lg border border-[#d2d2d7]/70 bg-[#fbfbfd] px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${
                    packageQuality.status === "ready"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    package {packageQuality.score}%
                  </span>
                  <span className="text-[#6e6e73]">{packageQuality.summary}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {packageQuality.checks.map((check) => (
                    <span
                      key={check.id}
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        check.status === "pass"
                          ? "bg-emerald-50 text-emerald-700"
                          : check.status === "warn"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                      title={check.details}
                    >
                      {check.label}
                    </span>
                  ))}
                </div>
                {requiredFailures.length > 0 && (
                  <div className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-[12px] leading-5 text-red-700">
                    Fix package first: {requiredFailures.map((check) => check.label).join(", ")}. Test cases are blocked until required identity, assets, and token evidence are repaired.
                  </div>
                )}
                {(repairBusy || repairStatusMessage) && (
                  <div className={`mt-3 rounded-md border px-3 py-2 text-[12px] leading-5 ${
                    repairBusy
                      ? "border-blue-100 bg-blue-50 text-blue-700"
                      : repairStatusMessage?.includes("still missing")
                        ? "border-amber-100 bg-amber-50 text-amber-700"
                        : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  }`}>
                    {repairBusy ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="size-3 animate-spin" />
                        Repair running{activeRepairMode ? ` (${activeRepairMode})` : ""}: extracting source evidence and republishing the brand package. This page will recheck the package when it finishes.
                      </span>
                    ) : repairStatusMessage}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRepairPackage("docs")}
                    disabled={repairBusy || busyAll}
                  >
                    {repairingPackage.includes("docs") ? <RefreshCw className="size-3 animate-spin" /> : null}
                    Repair docs
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRepairPackage("identity")}
                    disabled={repairBusy || busyAll}
                  >
                    {repairingPackage.includes("identity") ? <RefreshCw className="size-3 animate-spin" /> : null}
                    Repair identity
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRepairPackage("tokens")}
                    disabled={repairBusy || busyAll}
                  >
                    {repairingPackage.includes("tokens") ? <RefreshCw className="size-3 animate-spin" /> : null}
                    Repair tokens
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRepairPackage("assets")}
                    disabled={repairBusy || busyAll}
                  >
                    {repairingPackage.includes("assets") ? <RefreshCw className="size-3 animate-spin" /> : null}
                    Repair assets
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => onRepairPackage("all")}
                    disabled={repairBusy || busyAll}
                  >
                    {repairingPackage.includes("all") ? <RefreshCw className="size-3 animate-spin" /> : null}
                    Repair all
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#d2d2d7] px-3 py-1 text-xs font-medium text-[#1d1d1f]">
            {completedCount}/{cases.length || 5} complete
          </span>
          {staleCount > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {staleCount} stale
            </span>
          )}
          <Button
            onClick={onResume}
            disabled={busyAll || repairBusy || blocksGeneration || (manifest !== null && !needsResume)}
          >
            {busyAll && generating.includes("resume") ? (
              <><RefreshCw className="size-4 animate-spin" /> Generating</>
            ) : (
              <><RefreshCw className="size-4" /> {primaryActionLabel}</>
            )}
          </Button>
          <Button variant="outline" onClick={onRegenerateAll} disabled={busyAll || repairBusy || blocksGeneration}>
            {busyAll && generating.includes("regenerate-all") ? (
              <><RefreshCw className="size-4 animate-spin" /> Regenerating</>
            ) : (
              "Regenerate all"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-h-[720px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-[#d2d2d7]/60 bg-[#fbfbfd] p-4 lg:border-b-0 lg:border-r">
          <ReviewRailItem
            icon={<BarChart3 className="size-4" />}
            title="Dashboard"
            description="Data-heavy report surface with charts, KPIs, callouts, and tables."
            badge="Report"
          />
          <ReviewRailItem
            icon={<Presentation className="size-4" />}
            title="Slide deck"
            description="Six presentation pages using brand assets and narrative hierarchy."
            badge="6 pages"
          />
          <ReviewRailItem
            icon={<Globe2 className="size-4" />}
            title="Web systems"
            description="One-page design system showcase and campaign page."
            badge="2 pages"
          />
          <ReviewRailItem
            icon={<Megaphone className="size-4" />}
            title="Feedback"
            description="Reviewer notes are saved against DESIGN.md, SKILL.md, or both."
            badge={`${cases.reduce((sum, item) => sum + item.feedback_count, 0)} notes`}
          />
        </aside>

        <div className="min-w-0 divide-y divide-[#d2d2d7]/60">
          <section className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1d1d1f]">Generated scenarios</h3>
                <p className="text-xs text-[#6e6e73]">
                  Open one test case at a time to inspect the embedded output and leave package feedback.
                </p>
              </div>
              {manifest && (
                <span className="font-mono text-[11px] text-[#6e6e73]">
                  source {manifest.source_hash}
                </span>
              )}
            </div>

            {cases.length === 0 ? (
              <EmptyState
                icon={<PanelTop className="size-8" />}
                message="No test case manifest loaded yet."
              />
            ) : (
              <div className="space-y-2">
                {cases.map((testCase) => {
                  const expanded = activeId === testCase.id;
                  const generatingCase = generating.includes(testCase.id);
                  const frameId = `test-case-frame-${testCase.id}`;
                  const route = `${testCase.route}?v=${encodeURIComponent(testCase.generated_at ?? manifest?.source_hash ?? "")}`;
                  return (
                    <div
                      key={testCase.id}
                      className={`rounded-lg border transition-colors ${
                        expanded ? "border-[#1d1d1f]/30 bg-white shadow-sm" : "border-[#d2d2d7]/60 bg-white hover:bg-[#fbfbfd]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onActiveChange(expanded ? null : testCase.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronDown className="size-4 shrink-0 text-[#6e6e73]" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0 text-[#6e6e73]" />
                          )}
                          <span className="shrink-0 text-[#6e6e73]">
                            {testCaseIcon(testCase.id)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[#1d1d1f]">{testCase.title}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${testCaseStatusTone(testCase.status)}`}>
                                {testCase.status}
                              </span>
                              {testCase.feedback_count > 0 && (
                                <span className="rounded-full border border-[#d2d2d7] px-2 py-0.5 text-[11px] text-[#6e6e73]">
                                  {testCase.feedback_count} feedback
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-[#6e6e73]">{testCase.description}</p>
                          </div>
                        </button>
                        {testCase.status === "completed" || testCase.status === "stale" ? (
                          <Link
                            href={route}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline"
                          >
                            Open <ExternalLink className="size-3" />
                          </Link>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRegenerateOne(testCase.id)}
                          disabled={generatingCase || busyAll || repairBusy || blocksGeneration}
                        >
                          {generatingCase ? (
                            <RefreshCw className="size-3 animate-spin" />
                          ) : (
                            "Regenerate"
                          )}
                        </Button>
                      </div>

                      {expanded && (
                        <div className="grid gap-4 border-t border-[#d2d2d7]/60 bg-[#fbfbfd] p-4 xl:grid-cols-[minmax(0,1fr)_330px]">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
                                  <Eye className="size-3.5" /> Embedded test output
                                </p>
                                <p className="mt-1 text-xs text-[#6e6e73]">{testCase.intent}</p>
                              </div>
                              {(testCase.status === "completed" || testCase.status === "stale") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const el = document.getElementById(frameId);
                                    void el?.requestFullscreen?.();
                                  }}
                                >
                                  <Maximize2 className="size-3.5" /> Fullscreen
                                </Button>
                              )}
                            </div>
                            <div id={frameId} className="overflow-hidden rounded-lg border border-[#d2d2d7] bg-white shadow-inner">
                              {testCase.status === "completed" || testCase.status === "stale" ? (
                                <iframe
                                  key={`${brand.slug}-${testCase.id}-${testCase.generated_at ?? ""}`}
                                  src={route}
                                  title={`${brand.slug} ${testCase.title}`}
                                  className="h-[720px] w-full border-0 bg-white"
                                  sandbox=""
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex h-[360px] items-center justify-center p-8 text-center text-sm text-[#6e6e73]">
                                  Generate this test case to inspect the rendered scenario.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">Package proof</p>
                              <p className="mt-2 text-sm leading-5 text-[#424245]">
                                This scenario is generated from the brand package. If it fails, use feedback to tighten DESIGN.md, SKILL.md, or both.
                              </p>
                              <div className="mt-3 space-y-1 font-mono text-[11px] text-[#6e6e73]">
                                <p>{testCase.file}</p>
                                <p>source {testCase.source_hash ?? manifest?.source_hash ?? "pending"}</p>
                                <p>generator {generatorLabel}</p>
                                {testCase.last_feedback_at && <p>last feedback {new Date(testCase.last_feedback_at).toLocaleString()}</p>}
                              </div>
                            </div>

                            {testCase.error && (
                              <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                                {testCase.error}
                              </div>
                            )}

                            <TestCaseFeedbackForm
                              caseId={testCase.id}
                              onSubmit={onSubmitFeedback}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function TestCaseFeedbackForm({
  caseId,
  onSubmit,
}: {
  caseId: string;
  onSubmit: (
    caseId: string,
    target: TestCaseFeedbackTarget,
    sentiment: TestCaseFeedbackSentiment,
    note: string
  ) => Promise<void>;
}) {
  const [target, setTarget] = useState<TestCaseFeedbackTarget>("both");
  const [sentiment, setSentiment] = useState<TestCaseFeedbackSentiment>("needs_work");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
        Feedback for package improvement
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as TestCaseFeedbackTarget)}
          className="h-8 rounded-lg border border-[#d2d2d7] bg-white px-2 text-xs"
        >
          <option value="both">DESIGN.md + Skill</option>
          <option value="design_md">DESIGN.md</option>
          <option value="skill">Skill</option>
        </select>
        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value as TestCaseFeedbackSentiment)}
          className="h-8 rounded-lg border border-[#d2d2d7] bg-white px-2 text-xs"
        >
          <option value="needs_work">Needs work</option>
          <option value="works">Works</option>
        </select>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What should the package learn from this test case?"
        className="mt-3 min-h-24 w-full resize-y rounded-lg border border-[#d2d2d7] bg-white p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-[#6e6e73]">{message}</span>
        <Button
          size="sm"
          disabled={submitting || note.trim().length === 0}
          onClick={async () => {
            setSubmitting(true);
            setMessage(null);
            try {
              await onSubmit(caseId, target, sentiment, note);
              setNote("");
              setMessage("Feedback saved.");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Feedback failed.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? <RefreshCw className="size-3 animate-spin" /> : "Save feedback"}
        </Button>
      </div>
    </div>
  );
}

function testCaseStatusTone(status: TestCaseStatus): string {
  if (status === "completed") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "stale") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "failed") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-[#f5f5f7] text-[#6e6e73] ring-[#d2d2d7]";
}

function testCaseIcon(id: string) {
  if (id === "data-dashboard") return <BarChart3 className="size-4" />;
  if (id === "six-slide-deck") return <Presentation className="size-4" />;
  if (id === "design-system-showcase") return <Globe2 className="size-4" />;
  if (id === "campaign-landing") return <Megaphone className="size-4" />;
  return <PanelTop className="size-4" />;
}

/* ── review board ── */

function DesignReviewBoard({
  brand,
  pages,
  validationReport,
  componentReport,
  componentManifest,
  activeId,
  decisions,
  onActiveChange,
  onDecision,
}: {
  brand: BrandDetail;
  pages: ReplicaPage[];
  validationReport: Record<string, unknown>;
  componentReport: ComponentReport;
  componentManifest: ComponentManifest;
  activeId: string | null;
  decisions: Record<string, "good" | "needs_work">;
  onActiveChange: (id: string | null) => void;
  onDecision: (id: string, decision: "good" | "needs_work") => void;
}) {
  const manifestComponents = componentManifest.components ?? [];
  const pageRows = pages.map((page) => {
    const componentPage = componentReport.pages?.[page.pageSlug];
    const score = validationScoreForPage(validationReport, page.pageSlug);
    const blockers: string[] = [];
    if (score !== null && score < 80) blockers.push(`Screenshot score ${score}%`);
    if (componentPage?.missing) blockers.push(`${componentPage.missing} missing components`);
    if (componentPage?.extra) blockers.push(`${componentPage.extra} extra components`);
    return { page, score, componentPage, blockers };
  });

  const componentBlockers = manifestComponents.filter(
    (component) => component.status && !isReadyComponentStatus(component.status)
  );
  const blockerCount =
    pageRows.reduce((sum, row) => sum + row.blockers.length, 0) + componentBlockers.length;
  const checkCount = pageRows.length + manifestComponents.length + 4;

  return (
    <div className="overflow-hidden rounded-xl border border-[#d2d2d7]/70 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d2d2d7]/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <CircleDot className="mt-0.5 size-4 text-[#6e6e73]" />
          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f]">Design Review Board</h2>
            <p className="text-[13px] leading-5 text-[#6e6e73]">
              Live review surface for extracted pages, rendered components, and validation evidence.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#d2d2d7] px-3 py-1 text-xs font-medium text-[#1d1d1f]">
            {checkCount} checks
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            blockerCount > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}>
            {blockerCount} blockers
          </span>
        </div>
      </div>

      <div className="grid min-h-[720px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-[#d2d2d7]/60 bg-[#fbfbfd] p-4 lg:border-b-0 lg:border-r">
          <ReviewRailItem
            icon={<Layers className="size-4" />}
            title="Pages"
            description="Route coverage, visual scores, and live HTML previews."
            badge={pageRows.some((row) => row.blockers.length > 0) ? `${pageRows.reduce((sum, row) => sum + row.blockers.length, 0)} blockers` : "No blockers"}
          />
          <ReviewRailItem
            icon={<Code2 className="size-4" />}
            title="Components"
            description="Rendered DOM discovery, reusable files, and extraction gaps."
            badge={componentBlockers.length > 0 ? `${componentBlockers.length} gaps` : "Ready"}
          />
          <ReviewRailItem
            icon={<Type className="size-4" />}
            title="Type"
            description="Font families, sizes, and token coverage."
            badge={brand.design_tokens ? "Tokenized" : "Pending"}
          />
          <ReviewRailItem
            icon={<ImageIcon className="size-4" />}
            title="Assets"
            description="Downloaded media, SVGs, fonts, and screenshots."
            badge={`${brand.files.filter((file) => file.startsWith("assets/")).length} files`}
          />
        </aside>

        <div className="min-w-0 divide-y divide-[#d2d2d7]/60">
          <section className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1d1d1f]">Pages</h3>
                <p className="text-xs text-[#6e6e73]">
                  Opening a page expands one large live preview and closes the previous row.
                </p>
              </div>
              <span className="text-xs text-[#6e6e73]">
                {pageRows.length} routes
              </span>
            </div>
            <div className="space-y-2">
              {pageRows.length === 0 ? (
                <EmptyState icon={<MonitorPlay className="size-8" />} message="No page previews found." />
              ) : (
                pageRows.map(({ page, score, componentPage, blockers }) => {
                  const id = `page:${page.pageSlug}`;
                  const expanded = activeId === id;
                  const findings = (componentPage?.components ?? []).filter(
                    (component) =>
                      component.status !== "matched" || (component.issues?.length ?? 0) > 0
                  );
                  return (
                    <div
                      key={id}
                      className={`rounded-lg border transition-colors ${
                        expanded ? "border-[#1d1d1f]/30 bg-white shadow-sm" : "border-[#d2d2d7]/60 bg-white hover:bg-[#fbfbfd]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onActiveChange(expanded ? null : id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronDown className="size-4 shrink-0 text-[#6e6e73]" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0 text-[#6e6e73]" />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[#1d1d1f]">{page.name}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusTone(score, blockers.length)}`}>
                                {score !== null ? `${score}%` : "No score"}
                              </span>
                            </div>
                            <p className="truncate font-mono text-[11px] text-[#6e6e73]">
                              app/brands/{brand.slug}/{page.file}
                            </p>
                          </div>
                        </button>
                        <ReviewStatus score={score} blockers={blockers.length} />
                        <Link
                          href={page.route}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline"
                        >
                          Open <ExternalLink className="size-3" />
                        </Link>
                        <ReviewDecisionButtons
                          id={id}
                          value={decisions[id]}
                          onDecision={onDecision}
                        />
                      </div>

                      {expanded && (
                        <div className="grid gap-4 border-t border-[#d2d2d7]/60 bg-[#fbfbfd] p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                          <div className="min-w-0">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
                                <Eye className="size-3.5" /> Live HTML preview
                              </p>
                              <span className="font-mono text-[11px] text-[#6e6e73]">
                                {page.route}
                              </span>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-[#d2d2d7] bg-white shadow-inner">
                              <iframe
                                key={`${brand.slug}-${page.previewKey}-review`}
                                src={page.route}
                                title={`${brand.slug} ${page.name} review preview`}
                                className="h-[660px] w-full border-0"
                                sandbox={sandboxForReplicaPage(page)}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <ReviewEvidencePanel
                              brand={brand}
                              page={page}
                              score={score}
                              blockers={blockers}
                              componentPage={componentPage}
                              findings={findings}
                              decision={decisions[id]}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1d1d1f]">Rendered Components</h3>
                <p className="text-xs text-[#6e6e73]">
                  Component extraction now uses DOM landmarks, data attributes, ARIA roles, and rendered layout heuristics.
                </p>
              </div>
              <span className="text-xs text-[#6e6e73]">
                {manifestComponents.length} detected
              </span>
            </div>
            {manifestComponents.length === 0 ? (
              <EmptyState icon={<Layers className="size-8" />} message="No component manifest found." />
            ) : (
              <div className="grid gap-2">
                {manifestComponents.map((component, index) => {
                  const id = `component:${component.type ?? "component"}:${index}`;
                  const expanded = activeId === id;
                  const sourcePreviewPage = sourcePageToReplicaPage(brand, component.source_pages?.[0]);
                  const sourceRoute = sourcePreviewPage?.route ?? null;
                  const ready = isReadyComponentStatus(component.status);
                  return (
                    <div key={id} className="rounded-lg border border-[#d2d2d7]/60 bg-white">
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onActiveChange(expanded ? null : id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronDown className="size-4 shrink-0 text-[#6e6e73]" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0 text-[#6e6e73]" />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[#1d1d1f]">{component.name ?? component.type ?? "Component"}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                                ready ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"
                              }`}>
                                {normalizeStatusLabel(component.status)}
                              </span>
                            </div>
                            <p className="truncate font-mono text-[11px] text-[#6e6e73]">
                              {component.library_file ?? `${component.source_pages?.length ?? 0} source pages`}
                            </p>
                          </div>
                        </button>
                        {typeof component.confidence === "number" && (
                          <span className="rounded-full border border-[#d2d2d7] px-2 py-0.5 font-mono text-[11px] text-[#6e6e73]">
                            {Math.round(component.confidence * 100)}%
                          </span>
                        )}
                        {sourceRoute && (
                          <Link
                            href={sourceRoute}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0071e3] hover:underline"
                          >
                            Open <ExternalLink className="size-3" />
                          </Link>
                        )}
                      </div>
                      {expanded && (
                        <div className="grid gap-4 border-t border-[#d2d2d7]/60 bg-[#fbfbfd] p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                          {sourceRoute ? (
                            <div>
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
                                Source page preview
                              </p>
                              <div className="overflow-hidden rounded-lg border border-[#d2d2d7] bg-white">
                                <iframe
                                  src={sourceRoute}
                                  title={`${component.name ?? component.type} source preview`}
                                  className="h-[520px] w-full border-0"
                                  sandbox={sandboxForReplicaPage(sourcePreviewPage)}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-[#d2d2d7] bg-white p-8 text-sm text-[#6e6e73]">
                              No source route is available for this component yet.
                            </div>
                          )}
                          <div className="space-y-3 rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">Evidence</p>
                              <p className="mt-1 text-sm text-[#1d1d1f]">
                                Type: <span className="font-mono">{component.type ?? "unknown"}</span>
                              </p>
                            </div>
                            {(component.evidence?.markers?.length ?? 0) > 0 && (
                              <div>
                                <p className="mb-1 text-xs text-[#6e6e73]">Markers</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {component.evidence?.markers?.slice(0, 8).map((marker) => (
                                    <span key={marker} className="rounded-full bg-[#f5f5f7] px-2 py-0.5 font-mono text-[10px] text-[#424245]">
                                      {marker}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(component.source_pages?.length ?? 0) > 0 && (
                              <div>
                                <p className="mb-1 text-xs text-[#6e6e73]">Source pages</p>
                                <div className="space-y-1">
                                  {component.source_pages?.slice(0, 6).map((source) => (
                                    <p key={source} className="truncate font-mono text-[11px] text-[#424245]">
                                      {source}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ReviewRailItem({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="border-b border-[#d2d2d7]/60 py-4 first:pt-1 last:border-b-0">
      <div className="mb-2 flex items-center gap-2 text-[#1d1d1f]">
        <span className="text-[#6e6e73]">{icon}</span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="text-[12px] leading-5 text-[#6e6e73]">{description}</p>
      <span className="mt-3 inline-flex rounded-full border border-[#d2d2d7] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#1d1d1f]">
        {badge}
      </span>
    </div>
  );
}

function ReviewStatus({ score, blockers }: { score: number | null; blockers: number }) {
  if (blockers > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <AlertTriangle className="size-3.5" /> Needs review
      </span>
    );
  }
  if (score !== null && score >= 80) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="size-3.5" /> AI ready
      </span>
    );
  }
  return <span className="text-xs text-amber-600">AI review</span>;
}

function ReviewDecisionButtons({
  id,
  value,
  onDecision,
}: {
  id: string;
  value: "good" | "needs_work" | undefined;
  onDecision: (id: string, decision: "good" | "needs_work") => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant={value === "good" ? "default" : "outline"}
        onClick={() => onDecision(id, "good")}
        className="h-7 px-2 text-xs"
      >
        <Check className="size-3" /> Looks good
      </Button>
      <Button
        size="sm"
        variant={value === "needs_work" ? "destructive" : "outline"}
        onClick={() => onDecision(id, "needs_work")}
        className="h-7 px-2 text-xs"
      >
        <X className="size-3" /> Needs work
      </Button>
    </div>
  );
}

function ReviewEvidencePanel({
  brand,
  page,
  score,
  blockers,
  componentPage,
  findings,
  decision,
}: {
  brand: BrandDetail;
  page: ReplicaPage;
  score: number | null;
  blockers: string[];
  componentPage: ComponentReportPage | undefined;
  findings: ComponentReportComponent[];
  decision: "good" | "needs_work" | undefined;
}) {
  const origImg = brandFileUrl(
    brand,
    firstExistingBrandFile(brand, [
      `screenshots/harness/orig-${page.pageSlug}.png`,
      `screenshots/reference/${page.pageSlug}.png`,
      "screenshots/reference/homepage.png",
    ])
  );
  const replImg = brandFileUrl(
    brand,
    firstExistingBrandFile(brand, [
      `screenshots/harness/repl-${page.pageSlug}.png`,
      `replica-screenshots/${page.pageSlug}.png`,
      "replica-screenshots/homepage.png",
    ])
  );

  return (
    <>
      <div className="rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">Review note</p>
        <p className="mt-2 text-sm text-[#424245]">
          {decision === "good"
            ? "Marked as looking good in this session."
            : decision === "needs_work"
              ? "Marked as needing work in this session."
              : "No reviewer note yet."}
        </p>
      </div>

      <div className="rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">Validation</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-[#f5f5f7] p-2">
            <p className="text-[11px] text-[#6e6e73]">Screenshot</p>
            <p className="font-mono font-semibold text-[#1d1d1f]">{score !== null ? `${score}%` : "--"}</p>
          </div>
          <div className="rounded-md bg-[#f5f5f7] p-2">
            <p className="text-[11px] text-[#6e6e73]">Components</p>
            <p className="font-mono font-semibold text-[#1d1d1f]">
              {componentPage ? `${componentPage.matched ?? 0}/${componentPage.components_original ?? 0}` : "--"}
            </p>
          </div>
        </div>
        {blockers.length > 0 && (
          <div className="mt-3 space-y-1">
            {blockers.map((blocker) => (
              <p key={blocker} className="text-xs text-red-600">{blocker}</p>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
          Saved evidence
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="overflow-hidden rounded-md border bg-[#f5f5f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={origImg} alt={`Original ${page.name}`} className="h-28 w-full object-cover object-top" />
          </div>
          <div className="overflow-hidden rounded-md border bg-[#f5f5f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={replImg} alt={`Replica ${page.name}`} className="h-28 w-full object-cover object-top" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
          Component findings
        </p>
        {findings.length === 0 ? (
          <p className="text-sm text-[#424245]">No component issues in the latest report.</p>
        ) : (
          <div className="space-y-2">
            {findings.slice(0, 5).map((finding, index) => (
              <div key={`${finding.heading ?? "finding"}-${index}`} className="rounded-md bg-[#f5f5f7] p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-[#1d1d1f]">
                    {finding.heading || "Untitled component"}
                  </p>
                  <span className="shrink-0 font-mono text-[10px] text-[#6e6e73]">
                    {typeof finding.pixel_score === "number" ? `${finding.pixel_score}%` : finding.status}
                  </span>
                </div>
                {(finding.issues?.length ?? 0) > 0 && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#6e6e73]">
                    {finding.issues?.[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── shared UI ── */

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-16 text-center">
      <div className="text-muted-foreground/40">{icon}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
