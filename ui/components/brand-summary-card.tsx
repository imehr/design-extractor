"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Palette,
  Type,
  Layers,
  ImageIcon,
  Gauge,
  Calendar,
} from "lucide-react";

interface BrandSummaryCardProps {
  detail: {
    slug: string;
    name?: string;
    source_url?: string;
    extracted_at?: string;
    design_tokens?: Record<string, unknown> | null;
    component_manifest?: Record<string, unknown> | null;
    component_report?: Record<string, unknown> | null;
    rubric_report?: Record<string, unknown> | null;
    validation_report?: Record<string, unknown> | null;
    files?: string[];
    overall_score?: number | null;
    scene_matrix?: string[];
    /**
     * Relative path under brands/<slug>/ to a captured PNG of the replica
     * homepage. When set, the Replica thumbnail renders this image instead
     * of falling back to the placeholder tile.
     */
    replica_screenshot?: string | null;
  };
}

function sceneLabel(filename: string): string {
  const base = filename.replace(/\.png$/i, "");
  return base
    .split(/[-_]/)
    .map((part) =>
      part.length ? part[0].toUpperCase() + part.slice(1) : part
    )
    .join(" ");
}

interface SceneMatrixStripProps {
  slug: string;
  files: string[];
}

function SceneMatrixStrip({ slug, files }: SceneMatrixStripProps) {
  if (!files || files.length === 0) return null;
  return (
    <div
      className="flex flex-col gap-2 border-t pt-4"
      data-slot="scene-matrix-strip"
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Scene matrix
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((filename) => {
          const src = `/api/brands/${slug}/file/scene-matrix/${filename}`;
          const label = sceneLabel(filename);
          return (
            <Dialog key={filename}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="group flex flex-col items-stretch gap-1 rounded-md ring-1 ring-foreground/10 transition hover:ring-foreground/30"
                    aria-label={`Open ${label} scene`}
                  >
                    <div
                      className="overflow-hidden rounded-t-md bg-muted/30"
                      style={{ width: 100, height: 60 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${label} scene preview`}
                        width={100}
                        height={60}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    <span className="px-1.5 pb-1 text-[10px] text-muted-foreground group-hover:text-foreground">
                      {label}
                    </span>
                  </button>
                }
              />
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>{label}</DialogTitle>
                </DialogHeader>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${label} scene full size`}
                  className="h-auto w-full rounded-md ring-1 ring-foreground/10"
                />
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Parse `#rrggbb`/`#rgb`/`rgb(...)` to luminance (0..1) for choosing a
 * readable fallback tile color. Returns null for unparseable inputs.
 */
function colorLuminance(color: string): number | null {
  const hex = color.trim();
  let r: number | null = null;
  let g: number | null = null;
  let b: number | null = null;
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (hexMatch) {
    const h = hexMatch[1];
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    }
  } else {
    const rgbMatch = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(hex);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10);
      g = parseInt(rgbMatch[2], 10);
      b = parseInt(rgbMatch[3], 10);
    }
  }
  if (r === null || g === null || b === null) return null;
  // Rec. 709 luma, good enough for the "is this too dark to look like a tile" check.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Neutral fallback used when the brand's primary is too dark/black, so the
// tile reads as a missing-thumbnail placeholder instead of a black void.
const NEUTRAL_FALLBACK = "#374151";

function fallbackTileColor(primary: string): string {
  const lum = colorLuminance(primary);
  if (lum === null || lum < 0.12) return NEUTRAL_FALLBACK;
  return primary;
}

function pickPrimaryColor(tokens: Record<string, unknown> | null | undefined): string {
  if (!tokens) return "#1d1d1f";
  const colours = (tokens.colours ?? {}) as Record<string, unknown>;
  const palette = colours.palette;
  if (Array.isArray(palette) && palette.length > 0) {
    const first = palette[0] as { value?: string } | string;
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && typeof first.value === "string") {
      return first.value;
    }
  } else if (palette && typeof palette === "object") {
    for (const v of Object.values(palette as Record<string, unknown>)) {
      if (typeof v === "string" && /^#|^rgb|^hsl/.test(v)) return v;
      if (v && typeof v === "object") {
        const value = (v as { value?: unknown }).value;
        if (typeof value === "string") return value;
      }
    }
  }
  const computed = safeArray(colours.computed);
  if (computed.length > 0) {
    const first = computed[0] as { value?: string };
    if (first && typeof first.value === "string") return first.value;
  }
  return "#1d1d1f";
}

function countColors(tokens: Record<string, unknown> | null | undefined): number {
  if (!tokens) return 0;
  const colours = (tokens.colours ?? {}) as Record<string, unknown>;
  const palette = colours.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.length;
  if (palette && typeof palette === "object") {
    const keys = Object.keys(palette as Record<string, unknown>);
    if (keys.length > 0) return keys.length;
  }
  return safeArray(colours.computed).length;
}

function countFonts(tokens: Record<string, unknown> | null | undefined): number {
  if (!tokens) return 0;
  const typography = (tokens.typography ?? {}) as Record<string, unknown>;
  return safeArray(typography.families).length;
}

function countMatchedComponents(
  manifest: Record<string, unknown> | null | undefined,
  report: Record<string, unknown> | null | undefined
): number {
  // Prefer manifest if present
  if (manifest) {
    const components = safeArray(manifest.components);
    if (components.length > 0) {
      const matched = components.filter((c) => {
        const item = c as { status?: string };
        return item.status === "matched" || item.status === "verified" || item.status === "ok";
      });
      return matched.length || components.length;
    }
  }
  // Otherwise sum matched across pages in the component report
  if (report) {
    const pages = (report.pages ?? {}) as Record<string, { matched?: number }>;
    let total = 0;
    for (const key of Object.keys(pages)) {
      const m = pages[key]?.matched;
      if (typeof m === "number") total += m;
    }
    return total;
  }
  return 0;
}

function countAssets(files: string[] | undefined): number {
  if (!files) return 0;
  return files.filter((f) => f.startsWith("assets/")).length;
}

function readEvalScore(
  rubric: Record<string, unknown> | null | undefined,
  validation: Record<string, unknown> | null | undefined,
  fallback: number | null | undefined
): number | null {
  if (rubric && typeof rubric.weighted_total === "number") {
    return rubric.weighted_total as number;
  }
  if (validation) {
    const desktop = validation.desktop_avg;
    if (typeof desktop === "number") {
      return desktop > 1 ? desktop / 100 : desktop;
    }
  }
  if (typeof fallback === "number") {
    return fallback > 1 ? fallback / 100 : fallback;
  }
  return null;
}

function scoreClasses(score: number | null): {
  text: string;
  bg: string;
  ring: string;
} {
  if (score === null) {
    return { text: "text-muted-foreground", bg: "bg-muted/40", ring: "ring-foreground/10" };
  }
  if (score >= 0.85) {
    return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" };
  }
  if (score >= 0.7) {
    return { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-300" };
  }
  return { text: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" };
}

interface StatTileProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: {
    text: string;
    bg: string;
    ring: string;
  };
}

function StatTile({ label, value, icon, accent }: StatTileProps) {
  const tone = accent ?? {
    text: "text-foreground",
    bg: "bg-muted/30",
    ring: "ring-foreground/10",
  };
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg px-3 py-3 ring-1 ${tone.bg} ${tone.ring}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-semibold leading-none ${tone.text}`}>{value}</div>
    </div>
  );
}

interface ThumbnailProps {
  src: string;
  alt: string;
  label: string;
  fallbackColor: string;
  fallbackLabel: string;
}

function Thumbnail({ src, alt, label, fallbackColor, fallbackLabel }: ThumbnailProps) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className="overflow-hidden rounded-md ring-1 ring-foreground/10"
        style={{ width: 220, height: 140 }}
      >
        {errored ? (
          <div
            className="flex h-full w-full items-center justify-center text-[11px] font-medium"
            style={{
              backgroundColor: fallbackColor,
              color: "#ffffff",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
            }}
          >
            {fallbackLabel}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            width={220}
            height={140}
            className="h-full w-full object-cover object-top"
            onError={() => setErrored(true)}
          />
        )}
      </div>
    </div>
  );
}

export function BrandSummaryCard({ detail }: BrandSummaryCardProps) {
  const {
    slug,
    source_url,
    extracted_at,
    design_tokens,
    component_manifest,
    component_report,
    rubric_report,
    validation_report,
    files,
    overall_score,
    scene_matrix,
    replica_screenshot,
  } = detail;

  const displayName = detail.name && detail.name.length ? detail.name : titleCase(slug);
  const primaryColor = pickPrimaryColor(design_tokens);
  const tileFallbackColor = fallbackTileColor(primaryColor);

  const colorsCount = countColors(design_tokens);
  const fontsCount = countFonts(design_tokens);
  const componentsCount = countMatchedComponents(component_manifest, component_report);
  const assetsCount = countAssets(files);
  const evalScore = readEvalScore(rubric_report, validation_report, overall_score);
  const evalAccent = scoreClasses(evalScore);
  const evalLabel = evalScore === null ? "N/A" : `${Math.round(evalScore * 100)}%`;

  const extractedDate = extracted_at
    ? new Date(extracted_at).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const originalSrc = `/api/brands/${slug}/file/screenshots/harness/orig-homepage.png`;
  // Prefer a captured replica screenshot (a real PNG) when present; this is
  // backfilled by scripts/capture_replica_screenshot.py. Without it the
  // <img> tries to load /api/brands/<slug>/preview/homepage, which returns
  // HTML and fails the image load, falling back to the placeholder tile.
  const replicaSrc = replica_screenshot
    ? `/api/brands/${slug}/file/${replica_screenshot
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/")}`
    : `/api/brands/${slug}/preview/homepage`;

  return (
    <Card className="mb-8" data-slot="brand-summary-card">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-[20px] font-semibold leading-tight tracking-tight">
              {displayName}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              <span className="font-mono">{slug}</span>
              {source_url ? (
                <a
                  href={source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#0071e3] hover:underline"
                >
                  {source_url}
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>Extracted {extractedDate}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            label="Colors"
            value={String(colorsCount)}
            icon={<Palette className="size-3.5" />}
          />
          <StatTile
            label="Fonts"
            value={String(fontsCount)}
            icon={<Type className="size-3.5" />}
          />
          <StatTile
            label="Components"
            value={String(componentsCount)}
            icon={<Layers className="size-3.5" />}
          />
          <StatTile
            label="Assets"
            value={String(assetsCount)}
            icon={<ImageIcon className="size-3.5" />}
          />
          <StatTile
            label="EVAL Score"
            value={evalLabel}
            icon={<Gauge className="size-3.5" />}
            accent={evalAccent}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Thumbnail
            src={originalSrc}
            alt={`${displayName} original homepage`}
            label="Original"
            fallbackColor={tileFallbackColor}
            fallbackLabel="Original missing"
          />
          <Thumbnail
            src={replicaSrc}
            alt={`${displayName} replica homepage`}
            label="Replica"
            fallbackColor={tileFallbackColor}
            fallbackLabel="Replica missing"
          />
        </div>
        <SceneMatrixStrip slug={slug} files={scene_matrix ?? []} />
      </CardContent>
    </Card>
  );
}

export default BrandSummaryCard;
