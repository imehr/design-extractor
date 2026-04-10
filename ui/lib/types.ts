export interface BrandSummary {
  slug: string;
  name: string;
  source_url: string;
  extracted_at: string;
  extractor_version: string;
  overall_score: number | null;
  confidence: string;
  categories: string[];
  synthetic: boolean;
  path: string;
}

export interface LibraryIndex {
  version: string;
  updated_at: string;
  brands: BrandSummary[];
}

export interface BrandDetail {
  summary: BrandSummary;
  design_md: string | null;
  design_tokens: Record<string, unknown> | null;
  design_tokens_css: string | null;
  skill_md: string | null;
  metadata: Record<string, unknown> | null;
  validation_report: Record<string, unknown> | null;
  has_replica: boolean;
  has_logo: boolean;
  has_screenshots: boolean;
}

export const CATEGORIES = [
  "All",
  "AI & ML",
  "Dev Tools",
  "Infrastructure",
  "Fintech",
  "Enterprise",
  "Consumer",
] as const;

export type Category = (typeof CATEGORIES)[number];
