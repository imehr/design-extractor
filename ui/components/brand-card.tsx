"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";

interface BrandSummary {
  slug: string;
  source_url: string;
  extracted_at: string;
  overall_score: number | null;
  confidence: string;
  categories: string[];
}

interface BrandCardProps {
  brand: BrandSummary;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link href={`/brands/${brand.slug}`} className="block">
      <Card className="h-full transition-shadow hover:ring-2 hover:ring-ring/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{titleCase(brand.slug)}</CardTitle>
            <ScoreBadge
              score={brand.overall_score}
              confidence={brand.confidence}
            />
          </div>
          <CardDescription className="truncate">
            {brand.source_url}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {brand.categories.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <span className="text-xs text-muted-foreground">
            {new Date(brand.extracted_at).toLocaleDateString()}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
