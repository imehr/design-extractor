"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/score-badge";
import { ReplicaIframe } from "@/components/replica-iframe";

interface BrandDetail {
  slug: string;
  source_url: string;
  extracted_at: string;
  overall_score: number | null;
  confidence: string;
  categories: string[];
  design_md: string | null;
  design_tokens_css: string | null;
  skill_md: string | null;
  validation_report: Record<string, unknown> | null;
  files: string[];
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        <p className="text-sm text-destructive">
          Failed to load brand: {error}
        </p>
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

  const overviewText = brand.design_md
    ? brand.design_md.split("\n\n").slice(0, 3).join("\n\n")
    : "No design documentation available.";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-2">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Back to library
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {titleCase(brand.slug)}
          </h1>
          <a
            href={brand.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline"
          >
            {brand.source_url}
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            Extracted {new Date(brand.extracted_at).toLocaleDateString()}
          </p>
        </div>
        <ScoreBadge score={brand.overall_score} confidence={brand.confidence} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-4 flex-wrap">
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

        <TabsContent value="overview">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ScoreBadge
                score={brand.overall_score}
                confidence={brand.confidence}
              />
              <span className="text-sm text-muted-foreground">
                Confidence: {brand.confidence || "unknown"}
              </span>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">
              {overviewText}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="design-md">
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
            {brand.design_md || "No DESIGN.md available."}
          </pre>
        </TabsContent>

        <TabsContent value="tokens">
          <pre className="overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed">
            {brand.design_tokens_css || "No design tokens available."}
          </pre>
        </TabsContent>

        <TabsContent value="components">
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Component previews will be available after Phase 5 completion
            </p>
          </div>
        </TabsContent>

        <TabsContent value="replica">
          <ReplicaIframe slug={brand.slug} />
        </TabsContent>

        <TabsContent value="assets">
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium">Logo</h3>
              <div className="inline-block rounded-lg border bg-white p-4">
                <img
                  src={`/api/brands/${brand.slug}/file/assets/logo.svg`}
                  alt={`${titleCase(brand.slug)} logo`}
                  className="h-16 w-auto"
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Favicon</h3>
              <div className="inline-block rounded-lg border bg-white p-4">
                <img
                  src={`/api/brands/${brand.slug}/file/assets/favicon.ico`}
                  alt={`${titleCase(brand.slug)} favicon`}
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="skill">
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => brand.skill_md && handleCopy(brand.skill_md)}
                disabled={!brand.skill_md}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
              {brand.skill_md || "No skill document available."}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="validation">
          {brand.validation_report ? (
            <pre className="overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed">
              {JSON.stringify(brand.validation_report, null, 2)}
            </pre>
          ) : (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No validation report
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="files">
          {brand.files.length > 0 ? (
            <ul className="space-y-1">
              {brand.files.map((file) => (
                <li key={file} className="font-mono text-sm text-muted-foreground">
                  {file}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No files found.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
