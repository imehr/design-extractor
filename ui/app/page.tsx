"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { Search } from "lucide-react";

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
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function deriveBrandName(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    let host = u.hostname.replace(/^www\./, "");
    const parts = host.split(".");
    return parts.length > 2 ? parts.slice(0, -1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ") : parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return url;
  }
}

export default function HomePage() {
  const [library, setLibrary] = useState<LibraryIndex | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [extractUrl, setExtractUrl] = useState("");
  const [extractName, setExtractName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/library")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: LibraryIndex) => setLibrary(data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="flex flex-1 items-center justify-center p-8"><p className="text-sm text-red-600">Failed to load: {error}</p></div>;
  if (!library) return <div className="flex flex-1 items-center justify-center p-8"><p className="text-sm text-[#86868b]">Loading...</p></div>;

  const filtered = library.brands.filter((b) =>
    !search || b.slug.includes(search.toLowerCase()) || (b.name || "").toLowerCase().includes(search.toLowerCase())
  );

  function handleExtract() {
    if (!extractUrl.trim()) return;
    const name = extractName.trim() || deriveBrandName(extractUrl);
    router.push(`/monitoring?extract=${encodeURIComponent(extractUrl)}&name=${encodeURIComponent(name)}`);
  }

  return (
    <div>
      <section className="px-6 pt-8 pb-2">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
                Design Library
              </h1>
              <p className="mt-1 max-w-lg text-[14px] leading-relaxed text-[#86868b]">
                Extracted design systems from live websites. Each entry contains tokens, fonts, assets,
                React/shadcn replicas, and a DESIGN.md that coding agents use to build matching UI.
              </p>
            </div>
            <div className="relative w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#86868b]" />
              <Input
                placeholder="Search designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-lg border-[#d2d2d7] bg-[#f5f5f7] pl-9 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#d2d2d7]/50 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_100%)] p-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">Extract a new design system</label>
                <Input
                  placeholder="https://example.com"
                  value={extractUrl}
                  onChange={(e) => {
                    setExtractUrl(e.target.value);
                    if (!extractName && e.target.value) setExtractName(deriveBrandName(e.target.value));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                  className="h-10 rounded-lg border-white/15 bg-white/10 text-[14px] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0"
                />
              </div>
              <div className="w-44">
                <Input
                  placeholder="Brand name"
                  value={extractName}
                  onChange={(e) => setExtractName(e.target.value)}
                  className="h-10 rounded-lg border-white/15 bg-white/10 text-[14px] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0"
                />
              </div>
              <button
                onClick={handleExtract}
                disabled={!extractUrl.trim()}
                className="h-10 shrink-0 rounded-lg bg-[#0071e3] px-6 text-[14px] font-medium text-white hover:bg-[#0077ED] disabled:opacity-40 transition-colors"
              >
                Extract
              </button>
            </div>
            <p className="mt-3 text-[12px] text-white/40">
              Enter any website URL. The agent pipeline will discover pages, extract design tokens, build replicas, and validate the output.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <Link
              href="/docs"
              className="rounded-2xl border border-[#d2d2d7]/50 bg-white p-5 transition-transform hover:-translate-y-0.5"
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#86868b]">System Atlas</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#1d1d1f]">
                Harness, Runtime, Agents & Skills
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6e6e73]">
                Architecture, agent DAG, skill map, blocked-site policy, and self-improvement loop.
              </p>
            </Link>

            <div className="rounded-2xl border border-[#d2d2d7]/50 bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#86868b]">What Changed</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[#1d1d1f]">
                <p>Validation now uses the live report as the UI score source.</p>
                <p>Improve Quality starts a tracked filesystem-backed job.</p>
                <p>Blocked sites switch to assisted capture instead of a dead-end.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-4xl">

          {filtered.length === 0 ? (
            <div className="rounded-xl bg-[#f5f5f7] p-12 text-center">
              <p className="text-sm text-[#86868b]">No designs found.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filtered.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="group flex items-center justify-between border-b border-[#d2d2d7]/40 py-4 transition-colors hover:bg-[#f5f5f7]/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[17px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] group-hover:text-[#0071e3]">
                        {brand.name || titleCase(brand.slug)}
                      </span>
                      <ScoreBadge score={brand.overall_score} confidence={brand.confidence} />
                    </div>
                    <p className="mt-0.5 text-[13px] text-[#86868b]">
                      {brand.source_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {brand.categories.slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
