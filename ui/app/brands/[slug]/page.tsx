"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/score-badge";
import {
  ExternalLink,
  Copy,
  Check,
  FileText,
  Layers,
  Palette,
  Type,
  Image,
  Code2,
  MonitorPlay,
  FolderOpen,
  ChevronRight,
  RefreshCw,
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
  has_replica: boolean;
  has_logo: boolean;
  has_screenshots: boolean;
  files: string[];
  localFiles: string[];
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
  updated_at: string;
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
    const rgb = entry.value.match(/rgba?\([^)]+\)/)?.[0];
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

const BREAKPOINTS = [
  { label: "Desktop", width: 1440 },
  { label: "Tablet", width: 768 },
  { label: "Mobile", width: 390 },
] as const;

/* ─── page ─── */

export default function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [replicaPage, setPreviewPage] = useState("replica");
  const [replicaWidth, setPreviewWidth] = useState(1440);
  const [improveJob, setImproveJob] = useState<ImprovementJobState | null>(null);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [startingImprove, setStartingImprove] = useState(false);

  useEffect(() => {
    fetch(`/api/brands/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: BrandDetail) => setBrand(data))
      .catch((e) => setError(e.message));
  }, [slug]);

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
            fetch(`/api/brands/${slug}`)
              .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
              })
              .then((fresh: BrandDetail) => setBrand(fresh))
              .catch(() => {
                // Leave the current brand detail in place if the refresh fails.
              });
          }
        })
        .catch((e) => setImproveError(e.message));
    }, 2000);

    return () => window.clearInterval(interval);
  }, [slug, improveJob]);

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
        body: JSON.stringify({ targetScore: 80 }),
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

  const assetFiles = brand.files.filter((f) => f.startsWith("assets/"));
  const svgAssets = assetFiles.filter((f) => f.endsWith(".svg"));
  const imgAssets = assetFiles.filter((f) => !f.endsWith(".svg"));

  const logoFile = svgAssets.find((f) => f.includes("logo"));
  const validationReport = (brand.validation_report ?? {}) as Record<string, unknown>;
  const validationViewportAvg =
    typeof validationReport.viewport_avg === "number"
      ? validationReport.viewport_avg
      : null;
  const displayScore =
    validationViewportAvg !== null ? validationViewportAvg / 100 : brand.overall_score;
  const qualityTarget = improveJob?.target_score ?? 80;
  const meetsQualityTarget =
    displayScore !== null && displayScore * 100 >= qualityTarget;

  const fileGroups = groupFilesByDir(brand.files);
  const localFileGroups = groupFilesByDir(brand.localFiles ?? []);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-2">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to library
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {brand.has_logo && logoFile && (
            <div className="flex h-12 shrink-0 items-center rounded-lg border bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/brands/${brand.slug}/file/${logoFile}`}
                alt={`${titleCase(brand.slug)} logo`}
                className="h-8 w-auto"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {titleCase(brand.slug)}
            </h1>
            <a
              href={brand.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {brand.source_url}
              <ExternalLink className="size-3" />
            </a>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Extracted {new Date(brand.extracted_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ScoreBadge score={displayScore} confidence={brand.confidence} />
          <div className="flex flex-wrap justify-end gap-1">
            {brand.categories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-6 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="design-md">DESIGN.md</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="replica">Preview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="skill">Skill</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
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
                { label: "Base Unit", value: baseUnit || "4px" },
                { label: "Max Width", value: "1280px" },
                { label: "Card Radius", value: "16px" },
                { label: "Motion", value: "200ms ease" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[#f5f5f7] p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#86868b]">{s.label}</p>
                  <p className="mt-1 font-mono text-[21px] font-semibold text-[#1d1d1f]">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
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
          <div className="space-y-4">
            {/* Shared components */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="size-4" /> Shared Components (React/shadcn)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(brand.localFiles ?? [])
                    .filter((f: string) => f.startsWith("components/brands/") && f.endsWith(".tsx"))
                    .map((f: string) => {
                      const fileName = f.split("/").pop() || f;
                      const name = fileName.replace(".tsx", "").split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
                      return (
                        <Card key={f} className="border-l-2 border-l-green-500">
                          <CardContent className="p-4">
                            <h3 className="mb-1 text-sm font-bold">{name}</h3>
                            <p className="font-mono text-[10px] text-muted-foreground/60">{fileName}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Page replicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorPlay className="size-4" /> Page Previews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(() => {
                    const replicaFiles = (brand.localFiles ?? []).filter((f: string) => f.includes("replica/") && f.endsWith("page.tsx"));
                    return replicaFiles.map((f: string) => {
                      const parts = f.split("/replica/");
                      const sub = parts[1]?.replace("/page.tsx", "") || "";
                      const isHome = sub === "page.tsx" || sub === "";
                      const slug = isHome ? "" : sub;
                      const name = isHome ? "Homepage" : slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                      return { name, path: `/brands/${brand.slug}/replica${slug ? `/${slug}` : ""}`, file: `replica/${slug ? slug + "/" : ""}page.tsx` };
                    });
                  })().map((page) => (
                    <div key={page.name} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{page.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{page.file}</p>
                      </div>
                      <Link
                        href={page.path}
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
          {true ? (
            <div className="flex flex-col gap-4">
              {/* React replica pages */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  These pages are built with React, shadcn/ui, Tailwind, and Lucide icons using extracted content and downloaded assets.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(() => {
                    const replicaFiles = (brand.localFiles ?? []).filter((f: string) => f.includes("replica/") && f.endsWith("page.tsx"));
                    return replicaFiles.map((f: string) => {
                      const parts = f.split("/replica/");
                      const sub = parts[1]?.replace("/page.tsx", "") || "";
                      const isHome = sub === "page.tsx" || sub === "";
                      const slug = isHome ? "" : sub;
                      const name = isHome ? "Homepage" : slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                      return { name, path: `/brands/${brand.slug}/replica${slug ? `/${slug}` : ""}` };
                    });
                  })().map((page) => (
                    <Card key={page.name}>
                      <CardContent className="p-4">
                        <h3 className="mb-1 text-sm font-semibold">{page.name}</h3>
                        <div className="flex gap-2">
                          <Link
                            href={page.path}
                            target="_blank"
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                          >
                            <ExternalLink className="size-3" />
                            Open page
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
                    {(() => {
                      const replicaFiles = (brand.localFiles ?? []).filter((f: string) => f.includes("replica/") && f.endsWith("page.tsx"));
                      return replicaFiles.map((f: string) => {
                        const parts = f.split("/replica/");
                        const sub = parts[1]?.replace("/page.tsx", "") || "";
                        const isHome = sub === "page.tsx" || sub === "";
                        const slug = isHome ? "" : sub;
                        const label = isHome ? "Home" : slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                        return { label, path: `replica${slug ? `/${slug}` : ""}` };
                      });
                    })().map((p) => (
                      <Button
                        key={p.label}
                        size="sm"
                        variant={replicaPage === p.path ? "default" : "outline"}
                        onClick={() => setPreviewPage(p.path)}
                      >
                        {p.label}
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
                    <iframe
                      key={`${brand.slug}-${replicaPage}`}
                      src={`/brands/${brand.slug}/${replicaPage}`}
                      title={`${brand.slug} replica`}
                      className="h-[700px] w-full border-0"
                    />
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

        {/* ── ASSETS ── */}
        <TabsContent value="assets">
          {assetFiles.length === 0 ? (
            <EmptyState icon={<Image className="size-8" />} message="No assets found." />
          ) : (
            <div className="space-y-6">
              {svgAssets.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium">SVG Assets</h3>
                  <div className="flex flex-wrap gap-4">
                    {svgAssets.map((file) => (
                      <div key={file} className="flex flex-col gap-1.5">
                        <div className="flex h-20 w-40 items-center justify-center rounded-lg border bg-white p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/brands/${brand.slug}/file/${file}`}
                            alt={file}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <span className="max-w-40 break-all font-mono text-[10px] text-muted-foreground">
                          {file.replace("assets/", "")}
                        </span>
                        <a
                          href={`/api/brands/${brand.slug}/file/${file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline"
                        >
                          Open
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imgAssets.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium">Other Assets</h3>
                  <div className="flex flex-wrap gap-4">
                    {imgAssets.map((file) => {
                      const ext = file.split(".").pop()?.toLowerCase() ?? "";
                      const isImg = ["png", "jpg", "jpeg", "gif", "webp", "ico"].includes(ext);
                      return (
                        <div key={file} className="flex flex-col gap-1.5">
                          <div className="flex h-20 w-24 items-center justify-center rounded-lg border bg-white p-3">
                            {isImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`/api/brands/${brand.slug}/file/${file}`}
                                alt={file}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <FileText className="size-6 text-muted-foreground" />
                            )}
                          </div>
                          <span className="max-w-24 break-all font-mono text-[10px] text-muted-foreground">
                            {file.replace("assets/", "")}
                          </span>
                          <a
                            href={`/api/brands/${brand.slug}/file/${file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline"
                          >
                            Open
                          </a>
                        </div>
                      );
                    })}
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
                  Object.keys(validationReport.pixel_comparison_viewport || {}).length || 5
                } pages
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={handleImprove} disabled={startingImprove || improveJob?.status === "running"}>
                  {startingImprove || improveJob?.status === "running" ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" /> Improve in progress
                    </>
                  ) : (
                    "Improve Quality"
                  )}
                </Button>
                <span className="text-xs text-[#86868b]">
                  Target: {qualityTarget}% · live report overrides stale metadata
                </span>
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
                    <p className="text-sm font-semibold text-amber-900">Assisted capture required</p>
                    <p className="mt-1 text-sm text-amber-800">{improveJob.blocked_reason.detail}</p>
                    {improveJob.assisted_capture_steps.length > 0 && (
                      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-amber-900">
                        {improveJob.assisted_capture_steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
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
                    // Try multiple screenshot path patterns
                    const origImg = `/api/brands/${brand.slug}/file/screenshots/harness/orig-${slug}.png`;
                    const replImg = `/api/brands/${brand.slug}/file/screenshots/harness/repl-${slug}.png`;
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
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[#86868b]">Original (1280x720)</p>
                            <div className="overflow-hidden rounded-lg border bg-[#f5f5f7]">
                              <img
                                src={origImg}
                                alt={`Original ${name}`}
                                className="w-full"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[#86868b]">Preview (1280x720)</p>
                            <div className="overflow-hidden rounded-lg border bg-[#f5f5f7]">
                              <img
                                src={replImg}
                                alt={`Preview ${name}`}
                                className="w-full"
                              />
                            </div>
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
                  const domCount = brand.files.filter((f: string) => f.includes("dom-extraction") && f.endsWith(".json")).length;
                  const assetCount = brand.files.filter((f: string) => f.startsWith("assets/")).length;
                  const replicaCount = (brand.localFiles ?? []).filter((f: string) => f.includes("replica/") && f.endsWith("page.tsx")).length;
                  const vp = (brand.validation_report as Record<string, unknown>)?.viewport_avg as number | undefined;
                  return [
                    { gate: "Pages extracted", status: domCount >= 4, detail: `${domCount} pages` },
                    { gate: "Assets downloaded", status: assetCount >= 10, detail: `${assetCount} files` },
                    { gate: "React previews built", status: replicaCount >= 3, detail: `${replicaCount} pages` },
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
