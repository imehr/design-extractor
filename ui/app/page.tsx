"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight } from "lucide-react";

interface BrandSummary {
  slug: string;
  name: string;
  source_url: string;
  extracted_at: string;
  overall_score: number | null;
  confidence: string;
  categories: string[];
  validation_status?: string;
}

interface LibraryIndex {
  brands: BrandSummary[];
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function deriveBrandName(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "");
    const parts = host.split(".");
    return parts.length > 2
      ? parts
          .slice(0, -1)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" ")
      : parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return url;
  }
}

function brandThumbnailUrl(slug: string): string {
  return `/api/brands/${slug}/file/screenshots/reference/homepage.png`;
}

function brandThumbnailFallbackUrl(slug: string): string {
  // Some brands (e.g. westpac-com-au) only have desktop-full.png, not homepage.png.
  return `/api/brands/${slug}/file/screenshots/reference/desktop-full.png`;
}

function extractedAtMs(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareByFreshness(a: BrandSummary, b: BrandSummary): number {
  const byDate = extractedAtMs(b.extracted_at) - extractedAtMs(a.extracted_at);
  if (byDate !== 0) return byDate;
  return (a.name || a.slug).localeCompare(b.name || b.slug);
}

function BrandThumb({
  slug,
  alt,
  priority,
  sizes,
  className,
}: {
  slug: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const [src, setSrc] = useState(brandThumbnailUrl(slug));
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      unoptimized
      onError={() => {
        const fb = brandThumbnailFallbackUrl(slug);
        if (src !== fb) setSrc(fb);
      }}
    />
  );
}

const CHANGELOG: { tag: string; entries: string[] }[] = [
  {
    tag: "v0.4",
    entries: [
      "Validation now uses the live report as the UI score source.",
      "Improve Quality starts a tracked filesystem-backed job.",
      "Blocked sites switch to assisted capture instead of a dead-end.",
    ],
  },
];

export default function HomePage() {
  const [library, setLibrary] = useState<LibraryIndex | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [extractUrl, setExtractUrl] = useState("");
  const [extractName, setExtractName] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/library")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: LibraryIndex) => setLibrary(data))
      .catch((e) => setError(e.message));
  }, []);

  const libraryBrands = useMemo(() => {
    if (!library) return [];
    return [...library.brands].sort(compareByFreshness);
  }, [library]);

  // Top-scoring brands drive the rotating hero + examples carousel.
  const heroBrands = useMemo(() => {
    const scored = [...libraryBrands]
      .filter((b) => b.overall_score !== null)
      .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
    return scored.slice(0, 5);
  }, [libraryBrands]);

  const exampleBrands = useMemo(() => heroBrands.slice(0, 4), [heroBrands]);

  useEffect(() => {
    if (heroBrands.length < 2) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroBrands.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [heroBrands.length]);

  if (error)
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  if (!library)
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-[color:var(--app-muted)]">Loading...</p>
      </div>
    );

  const filtered = libraryBrands.filter(
    (b) =>
      !search ||
      b.slug.includes(search.toLowerCase()) ||
      (b.name || "").toLowerCase().includes(search.toLowerCase())
  );

  function handleExtract() {
    const url = extractUrl.trim();
    if (!url) return;
    const name = extractName.trim() || deriveBrandName(url);
    const qs = new URLSearchParams({ url, name }).toString();
    router.push(`/extract?${qs}`);
  }

  function applyExample(brand: BrandSummary) {
    setExtractUrl(brand.source_url);
    setExtractName(brand.name || titleCase(brand.slug));
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--app-bg)", color: "var(--app-fg)" }}
    >
      {/* Above-fold split: hero (left) + extract form (right) */}
      <section className="px-6 pt-10 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* LEFT 60% — hero text + rotating brand screenshot */}
            <div className="lg:col-span-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                Design Library
              </p>
              <h1 className="mt-2 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[40px]">
                Extract any website&rsquo;s design system.
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-[1.55] text-[color:var(--app-muted)]">
                Tokens, fonts, assets, React/shadcn replicas, and a Google-spec
                DESIGN.md that coding agents use to build matching UI &mdash;
                from a single URL.
              </p>

              {/* Rotating brand hero */}
              <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl border border-[color:var(--app-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(15,23,42,0.06)]">
                {heroBrands.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-sm text-[color:var(--app-muted)]">
                    No extracted brands yet
                  </div>
                ) : (
                  heroBrands.map((b, i) => (
                    <Link
                      key={b.slug}
                      href={`/brands/${b.slug}`}
                      aria-hidden={i !== heroIndex}
                      tabIndex={i === heroIndex ? 0 : -1}
                      className="absolute inset-0 transition-opacity duration-700 ease-out"
                      style={{ opacity: i === heroIndex ? 1 : 0 }}
                    >
                      <BrandThumb
                        slug={b.slug}
                        alt={`${b.name || titleCase(b.slug)} homepage screenshot`}
                        priority={i === 0}
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        className="object-cover object-top"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-5 py-4 text-white">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold tracking-tight">
                            {b.name || titleCase(b.slug)}
                          </p>
                          <p className="truncate text-[12px] text-white/70">
                            {b.source_url}
                          </p>
                        </div>
                        {b.overall_score !== null && (
                          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-medium backdrop-blur">
                            {Math.round(b.overall_score * 100)}%
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}

                {/* Pagination dots */}
                {heroBrands.length > 1 && (
                  <div className="absolute right-4 top-4 flex gap-1.5">
                    {heroBrands.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.preventDefault();
                          setHeroIndex(i);
                        }}
                        aria-label={`Show brand ${i + 1}`}
                        className={
                          i === heroIndex
                            ? "h-1.5 w-5 rounded-full bg-white shadow"
                            : "h-1.5 w-1.5 rounded-full bg-white/55 transition-all hover:bg-white/80"
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 40% — extract form, sticky on desktop */}
            <div className="lg:col-span-5">
              <Card
                className="gap-0 p-6 lg:sticky lg:top-20"
                style={{
                  background: "var(--app-surface)",
                  borderColor: "var(--app-border)",
                }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  Extract a new design system
                </p>
                <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">
                  Paste a URL. Watch agents work.
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-[color:var(--app-muted)]">
                  The pipeline discovers pages, downloads assets, builds
                  shadcn replicas, and validates against the source.
                </p>

                <div className="mt-5 space-y-3">
                  <div>
                    <label
                      htmlFor="extract-url"
                      className="mb-1.5 block text-[12px] font-medium text-[color:var(--app-fg)]"
                    >
                      Website URL
                    </label>
                    <Input
                      id="extract-url"
                      type="url"
                      placeholder="https://example.com"
                      value={extractUrl}
                      onChange={(e) => {
                        setExtractUrl(e.target.value);
                        if (!extractName && e.target.value) {
                          setExtractName(deriveBrandName(e.target.value));
                        }
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                      className="h-11 text-[14px]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="extract-name"
                      className="mb-1.5 block text-[12px] font-medium text-[color:var(--app-fg)]"
                    >
                      Brand name
                    </label>
                    <Input
                      id="extract-name"
                      placeholder="Auto-derived from URL"
                      value={extractName}
                      onChange={(e) => setExtractName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                      className="h-11 text-[14px]"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleExtract}
                    disabled={!extractUrl.trim()}
                    className="h-11 w-full text-[14px] font-medium"
                    style={{
                      background: "var(--app-accent)",
                      color: "var(--app-accent-fg)",
                    }}
                  >
                    Extract design system
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Examples carousel — "Try one of these" */}
          {exampleBrands.length > 0 && (
            <div className="mt-10">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                  Try one of these
                </p>
                <p className="text-[12px] text-[color:var(--app-muted)]">
                  Click to pre-fill the form
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {exampleBrands.map((b) => (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => applyExample(b)}
                    className="group block overflow-hidden rounded-xl border border-[color:var(--app-border)] bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[color:var(--app-bg)]">
                      <BrandThumb
                        slug={b.slug}
                        alt={`${b.name || titleCase(b.slug)} preview`}
                        sizes="(min-width: 1024px) 22vw, 50vw"
                        className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[13px] font-semibold tracking-tight">
                        {b.name || titleCase(b.slug)}
                      </p>
                      <p className="truncate text-[11px] text-[color:var(--app-muted)]">
                        {b.source_url}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Brand library grid */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-semibold tracking-tight">
                Library
              </h2>
              <p className="mt-0.5 text-[13px] text-[color:var(--app-muted)]">
                {library.brands.length} design system
                {library.brands.length !== 1 ? "s" : ""} extracted
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--app-muted)]" />
              <Input
                placeholder="Search designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[color:var(--app-border)] bg-white p-12 text-center">
              <p className="text-sm text-[color:var(--app-muted)]">
                No designs found.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[color:var(--app-border)] bg-white">
              {filtered.map((brand, i) => {
                const pct =
                  brand.overall_score !== null
                    ? Math.round(brand.overall_score * 100)
                    : null;
                const scoreColor =
                  pct === null
                    ? "bg-[color:var(--app-bg)] text-[color:var(--app-muted)]"
                    : pct >= 80
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : pct >= 60
                        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        : "bg-red-50 text-red-700 ring-1 ring-red-200";

                return (
                  <Link
                    key={brand.slug}
                    href={`/brands/${brand.slug}`}
                    className={`group flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-[color:var(--app-bg)] ${
                      i !== filtered.length - 1
                        ? "border-b border-[color:var(--app-border)]"
                        : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[15px] font-semibold tracking-[-0.005em] group-hover:text-[color:var(--app-accent)]">
                          {brand.name || titleCase(brand.slug)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${scoreColor}`}
                        >
                          {pct !== null ? `${pct}%` : "N/A"}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-[color:var(--app-muted)]">
                        <span className="truncate">{brand.source_url}</span>
                        <span className="shrink-0 text-[color:var(--app-border)]">
                          &middot;
                        </span>
                        <span className="shrink-0 text-[12px]">
                          {brand.extracted_at
                            ? new Date(brand.extracted_at).toLocaleDateString(
                                "en-AU",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-1.5">
                      {brand.categories.slice(0, 3).map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* What's New changelog card */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="gap-0 p-5"
              style={{
                background: "var(--app-surface)",
                borderColor: "var(--app-border)",
              }}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                What&rsquo;s new
              </p>
              <h3 className="mt-1 text-[16px] font-semibold tracking-tight">
                Recent improvements
              </h3>
              <div className="mt-3 space-y-3">
                {CHANGELOG.map((release) => (
                  <div key={release.tag}>
                    <p className="text-[11px] font-medium text-[color:var(--app-muted)]">
                      {release.tag}
                    </p>
                    <ul className="mt-1 space-y-1 text-[13px] leading-[1.5]">
                      {release.entries.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Link
              href="/docs"
              className="group block rounded-xl border border-[color:var(--app-border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                System atlas
              </p>
              <h3 className="mt-1 text-[16px] font-semibold tracking-tight">
                Harness, runtime, agents &amp; skills
              </h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--app-muted)]">
                Architecture, agent DAG, skill map, blocked-site policy, and
                self-improvement loop.
              </p>
              <p className="mt-3 inline-flex items-center text-[13px] font-medium text-[color:var(--app-accent)]">
                Read the atlas
                <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
