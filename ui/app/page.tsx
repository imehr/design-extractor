"use client";

import { useEffect, useState } from "react";
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

export default function HomePage() {
  const [library, setLibrary] = useState<LibraryIndex | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      {/* Header with context */}
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

          {/* Usage hint */}
          <div className="mt-4 rounded-lg bg-[#f5f5f7] px-4 py-3">
            <p className="text-[13px] text-[#6e6e73]">
              <span className="font-medium text-[#1d1d1f]">Extract a new site:</span>{" "}
              run <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px] text-[#1d1d1f]">/extract https://example.com</code> in Claude Code.{" "}
              <span className="font-medium text-[#1d1d1f]">Use in your project:</span>{" "}
              copy the DESIGN.md into your repo and agents will match the brand automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Brand list — immediately visible */}
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
