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
      {/* Compact header with search */}
      <section className="px-6 pt-8 pb-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
              Design Library
            </h1>
            <p className="mt-0.5 text-[13px] text-[#86868b]">{filtered.length} extracted design systems</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#86868b]" />
            <Input
              placeholder="Search designs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg border-[#d2d2d7] bg-[#f5f5f7] pl-9 text-sm"
            />
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
