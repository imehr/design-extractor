"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandCard } from "@/components/brand-card";
import { CategoryTabs } from "@/components/category-tabs";
import {
  Search,
  Palette,
  Code2,
  Download,
  ExternalLink,
  Layers,
  Zap,
} from "lucide-react";

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

const CATEGORIES = [
  "All",
  "Banking",
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
        <p className="text-sm text-destructive">Failed to load library: {error}</p>
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
      (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
      b.source_url.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      category === "All" ||
      b.categories.some((c) => c.toLowerCase().includes(category.toLowerCase()));
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      {/* Hero section */}
      <div className="border-b bg-gradient-to-b from-white to-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Design System Inspirations
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Drop into your project and let coding agents build matching UI.
            Design tokens, components, voice guidelines, and validated previews extracted from live websites.
          </p>

          {/* Search */}
          <div className="mx-auto mt-8 flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <span>{library.brands.length} designs</span>
            <span>DESIGN.md + SKILL.md</span>
            <span>React/shadcn previews</span>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="border-b px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-lg font-semibold">How it works</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Extract</h3>
              <p className="text-xs text-muted-foreground">
                Point at any URL. The pipeline extracts tokens, assets, fonts, and voice from the live DOM.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Preview</h3>
              <p className="text-xs text-muted-foreground">
                React/shadcn components replicate the design. Screenshot-validated against the original.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Use</h3>
              <p className="text-xs text-muted-foreground">
                Copy the DESIGN.md into your project. Coding agents build matching UI automatically.
              </p>
            </div>
          </div>

          {/* Usage command */}
          <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-center">
            <p className="mb-2 text-xs text-muted-foreground">Add a design system to your project:</p>
            <code className="rounded bg-background px-3 py-1.5 font-mono text-sm">
              npx design-extractor extract https://example.com
            </code>
          </div>
        </div>
      </div>

      {/* Brand grid */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Find Designs</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} results</p>
          </div>
          <CategoryTabs
            categories={CATEGORIES}
            active={category}
            onChange={setCategory}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">No designs match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
