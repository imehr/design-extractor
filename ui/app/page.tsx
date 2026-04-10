"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { BrandCard } from "@/components/brand-card";
import { CategoryTabs } from "@/components/category-tabs";

interface BrandSummary {
  slug: string;
  source_url: string;
  extracted_at: string;
  overall_score: number | null;
  confidence: string;
  categories: string[];
}

interface LibraryIndex {
  brands: BrandSummary[];
}

const CATEGORIES = [
  "All",
  "AI & ML",
  "Dev Tools",
  "Infrastructure",
  "Fintech",
  "Enterprise",
  "Consumer",
];

export default function HomePage() {
  const [library, setLibrary] = useState<LibraryIndex | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: LibraryIndex) => setLibrary(data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">
          Failed to load library: {error}
        </p>
      </div>
    );
  }

  if (!library) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Loading library...</p>
      </div>
    );
  }

  const filtered = library.brands.filter((b) => {
    const matchesSearch =
      !search ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      b.source_url.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      category === "All" || b.categories.includes(category);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Design Systems Extracted from the Live Web
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {library.brands.length} brand
          {library.brands.length !== 1 ? "s" : ""} in library
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryTabs
          categories={CATEGORIES}
          active={category}
          onChange={setCategory}
        />
        <Input
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 && library.brands.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No brands extracted yet. Run the extractor to populate the library:
          </p>
          <pre className="mt-3 inline-block rounded bg-muted px-3 py-1.5 text-xs font-mono">
            npx design-extractor extract https://example.com
          </pre>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No brands match your filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((brand) => (
            <BrandCard key={brand.slug} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
