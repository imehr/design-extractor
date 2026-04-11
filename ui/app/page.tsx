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
      {/* Hero */}
      <section className="bg-[#f5f5f7] px-6 py-20 text-center">
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight text-[#1d1d1f]">
          Design System Inspirations
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[17px] leading-[1.47] tracking-[-0.374px] text-[#86868b]">
          Drop into your project and let coding agents build matching UI.
        </p>
        <div className="mx-auto mt-8 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#86868b]" />
            <Input
              placeholder="Search all designs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg border-[#d2d2d7] bg-white pl-9 text-sm"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-[#d2d2d7]/40 px-6 py-16">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-12 text-center">
          {[
            { step: "1", title: "Extract", desc: "Point at a URL. Tokens, assets, fonts, and voice are extracted from the live DOM." },
            { step: "2", title: "Preview", desc: "React/shadcn components replicate the design. Screenshot-validated against original." },
            { step: "3", title: "Use", desc: "Copy the DESIGN.md into your project. Coding agents build matching UI." },
          ].map((s) => (
            <div key={s.step}>
              <div className="mx-auto mb-3 flex size-8 items-center justify-center rounded-full bg-[#1d1d1f] text-xs font-semibold text-white">
                {s.step}
              </div>
              <h3 className="text-sm font-semibold text-[#1d1d1f]">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.38] text-[#86868b]">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <code className="rounded-lg bg-[#f5f5f7] px-4 py-2 font-mono text-[13px] text-[#1d1d1f]">
            npx design-extractor extract https://example.com
          </code>
        </div>
      </section>

      {/* Brand list */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-[21px] font-semibold leading-[1.19] tracking-[0.011em] text-[#1d1d1f]">
              Find Designs
            </h2>
            <span className="text-[13px] text-[#86868b]">{filtered.length} designs</span>
          </div>

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
