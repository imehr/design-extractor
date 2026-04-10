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
  LayoutTemplate,
  MonitorPlay,
  FolderOpen,
  ChevronRight,
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

const REPLICA_PAGES = ["index.html", "credit-cards.html", "contact-us.html"];

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
  const [replicaPage, setReplicaPage] = useState("replica");
  const [replicaWidth, setReplicaWidth] = useState(1440);

  useEffect(() => {
    fetch(`/api/brands/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: BrandDetail) => setBrand(data))
      .catch((e) => setError(e.message));
  }, [slug]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  const availableReplicaPages = REPLICA_PAGES.filter((p) =>
    brand.files.some((f) => f === `replica/${p}`)
  );

  const summaryParagraph = brand.design_md
    ? brand.design_md
        .split("\n\n")
        .map((p) => p.trim())
        .find((p) => p.length > 40 && !p.startsWith("#")) ?? ""
    : "";

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
          <ScoreBadge score={brand.overall_score} confidence={brand.confidence} />
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
          <TabsTrigger value="replica">Replica</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="skill">Skill</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="files">Raw Files</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-4">
                <div className="mb-3 flex items-center gap-3">
                  <ScoreBadge score={brand.overall_score} confidence={brand.confidence} />
                  <span className="text-sm text-muted-foreground">
                    Confidence: <strong>{brand.confidence || "unknown"}</strong>
                  </span>
                </div>
                {summaryParagraph && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {summaryParagraph}
                  </p>
                )}
              </CardContent>
            </Card>

            {colors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="size-4" /> Color Palette
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {colors.slice(0, 10).map(({ hex, count }) => (
                      <div key={hex} className="flex flex-col items-center gap-1">
                        <div
                          className="size-12 rounded-lg border shadow-sm"
                          style={{ backgroundColor: hex }}
                          title={`${hex} (×${count})`}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {hex}
                        </span>
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
                    <Type className="size-4" /> Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fontFamilies.slice(0, 3).map((f, i) => {
                    const name = primaryFontName(f.value);
                    return (
                      <div key={i} className="flex items-baseline gap-3">
                        <span className="text-2xl" style={{ fontFamily: f.value }}>
                          Aa
                        </span>
                        <div>
                          <span className="text-sm font-medium">{name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ×{f.count} usages
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
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
                        <span className="text-xs text-muted-foreground">×{f.count} usages</span>
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
                  {[
                    { name: "WestpacHeader", file: "westpac-header.tsx", desc: "Utility bar + nav with active state, logo, Sign in button, search", uses: "shadcn Button, Lucide Search" },
                    { name: "WestpacFooter", file: "westpac-footer.tsx", desc: "Link columns with chevrons, social SVGs, legal text, Aboriginal artwork", uses: "shadcn Separator, Lucide ChevronRight" },
                    { name: "WestpacHero", file: "westpac-hero.tsx", desc: "Red hero with serif heading, subtitle, CTA, phone mockup", uses: "Custom Westpac-bold font" },
                    { name: "WestpacLogo", file: "westpac-logo.tsx", desc: "Extracted SVG W mark as React component", uses: "Inline SVG" },
                    { name: "WestpacCategories", file: "westpac-categories.tsx", desc: "6-tile grid: Home loans, Bank accounts, Credit cards, Personal loans, Business, More", uses: "Lucide Home, Landmark, CreditCard, etc." },
                    { name: "WestpacSections", file: "westpac-sections.tsx", desc: "Best Banking App, Security, Property Investment, Help, Quick Links, Legal", uses: "shadcn Card, Button, Separator" },
                  ].map((comp) => (
                    <Card key={comp.name} className="border-l-2 border-l-green-500">
                      <CardContent className="p-4">
                        <h3 className="mb-1 text-sm font-bold">{comp.name}</h3>
                        <p className="mb-2 text-xs text-muted-foreground">{comp.desc}</p>
                        <p className="font-mono text-[10px] text-muted-foreground/60">{comp.file}</p>
                        <Badge variant="secondary" className="mt-2 text-[10px]">{comp.uses}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Page replicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorPlay className="size-4" /> Page Replicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { name: "Homepage", path: `/brands/${brand.slug}/replica`, file: "replica/page.tsx" },
                    { name: "Credit Cards", path: `/brands/${brand.slug}/replica/credit-cards`, file: "replica/credit-cards/page.tsx" },
                    { name: "Contact Us", path: `/brands/${brand.slug}/replica/contact-us`, file: "replica/contact-us/page.tsx" },
                  ].map((page) => (
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
          {brand.has_replica ? (
            <div className="flex flex-col gap-4">
              {/* React replica pages */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  These pages are built with React, shadcn/ui, Tailwind, and Lucide icons using extracted content and downloaded assets.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { name: "Homepage", path: `/brands/${brand.slug}/replica`, desc: "Hero, category tiles, security, property investment, help" },
                    { name: "Credit Cards", path: `/brands/${brand.slug}/replica/credit-cards`, desc: "Product cards, FAQ, feature grid" },
                    { name: "Contact Us", path: `/brands/${brand.slug}/replica/contact-us`, desc: "Sidebar nav, support contacts, app steps" },
                  ].map((page) => (
                    <Card key={page.name}>
                      <CardContent className="p-4">
                        <h3 className="mb-1 text-sm font-semibold">{page.name}</h3>
                        <p className="mb-3 text-xs text-muted-foreground">{page.desc}</p>
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
                  <div className="flex gap-1.5">
                    {[
                      { label: "Home", path: "replica" },
                      { label: "Credit Cards", path: "replica/credit-cards" },
                      { label: "Contact Us", path: "replica/contact-us" },
                    ].map((p) => (
                      <Button
                        key={p.label}
                        size="sm"
                        variant={replicaPage === p.path ? "default" : "outline"}
                        onClick={() => setReplicaPage(p.path)}
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
                        onClick={() => setReplicaWidth(bp.width)}
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
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => brand.skill_md && handleCopy(brand.skill_md)}
                disabled={!brand.skill_md}
              >
                {copied ? (
                  <>
                    <Check className="size-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" /> Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
              {brand.skill_md || "No skill document available."}
            </pre>
          </div>
        </TabsContent>

        {/* ── VALIDATION ── */}
        <TabsContent value="validation">
          {brand.validation_report ? (
            <ScrollArea className="h-[600px]">
              <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed">
                {JSON.stringify(brand.validation_report, null, 2)}
              </pre>
            </ScrollArea>
          ) : (
            <EmptyState
              icon={<FileText className="size-8" />}
              message="No validation report available."
            />
          )}
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
