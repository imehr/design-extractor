import { promises as fs } from "fs";
import path from "path";

/**
 * Per-brand artifacts generated into the repo (NOT ~/.claude/design-library):
 *   <repo>/brands/<slug>/
 *     original/<page>/index.html + assets/ + verify.png + manifest.json
 *     replica-html/<page>.html + compare.html + assets/ + screenshots/
 *     open-design/DESIGN.md + skill/SKILL.md
 *     DESIGN.md, design-tokens.json, design-tokens.css, skill/SKILL.md, metadata.json
 *
 * Repo root convention matches ui/lib/package-repair.ts and ui/lib/test-cases.ts:
 * the Next.js app runs from <repo>/ui, so the repo root is one level up.
 */
const REPO_ROOT = path.resolve(process.cwd(), "..");
const REPO_BRANDS_ROOT = path.join(REPO_ROOT, "brands");

export interface OriginalPageArtifact {
  slug: string;
  has_verify: boolean;
}

export interface BrandArtifactsSummary {
  original_pages: OriginalPageArtifact[];
  replica_html_pages: string[];
  has_compare: boolean;
  has_design_md: boolean;
  has_tokens: boolean;
  has_tokens_json: boolean;
  has_tokens_css: boolean;
  has_open_design_export: boolean;
  has_skill: boolean;
}

/** A slug must be a single path segment (no separators, no dot-prefix). */
function isSafeSlug(slug: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(slug) && !slug.includes("..");
}

function brandArtifactsDir(slug: string): string | null {
  if (!isSafeSlug(slug)) return null;
  return path.join(REPO_BRANDS_ROOT, slug);
}

/**
 * Read an artifact file from <repo>/brands/<slug>/<relativePath>.
 * Returns null for missing files or any path that escapes the brand dir.
 */
export async function getBrandArtifactFile(
  slug: string,
  relativePath: string
): Promise<Buffer | null> {
  const brandDir = brandArtifactsDir(slug);
  if (!brandDir) return null;

  const resolved = path.resolve(brandDir, relativePath);
  // Path traversal protection: resolved path must stay within the brand dir.
  if (!resolved.startsWith(brandDir + path.sep)) {
    return null;
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) return null;
    return await fs.readFile(resolved);
  } catch {
    return null;
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Summarize which repo artifacts exist for a brand by reading
 * <repo>/brands/<slug>/. Never throws; missing dirs produce empty lists.
 */
export async function getBrandArtifactsSummary(
  slug: string
): Promise<BrandArtifactsSummary> {
  const empty: BrandArtifactsSummary = {
    original_pages: [],
    replica_html_pages: [],
    has_compare: false,
    has_design_md: false,
    has_tokens: false,
    has_tokens_json: false,
    has_tokens_css: false,
    has_open_design_export: false,
    has_skill: false,
  };

  const brandDir = brandArtifactsDir(slug);
  if (!brandDir) return empty;

  // original/<page>/index.html (+ optional verify.png)
  const original_pages: OriginalPageArtifact[] = [];
  try {
    const entries = await fs.readdir(path.join(brandDir, "original"), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const pageDir = path.join(brandDir, "original", entry.name);
      if (!(await fileExists(path.join(pageDir, "index.html")))) continue;
      original_pages.push({
        slug: entry.name,
        has_verify: await fileExists(path.join(pageDir, "verify.png")),
      });
    }
    original_pages.sort((a, b) => a.slug.localeCompare(b.slug));
  } catch {
    // no original/ dir
  }

  // replica-html/<page>.html (compare.html reported separately)
  let replica_html_pages: string[] = [];
  let has_compare = false;
  try {
    const entries = await fs.readdir(path.join(brandDir, "replica-html"), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
      if (entry.name === "compare.html") {
        has_compare = true;
        continue;
      }
      replica_html_pages.push(entry.name.replace(/\.html$/, ""));
    }
    replica_html_pages = replica_html_pages.sort((a, b) => a.localeCompare(b));
  } catch {
    // no replica-html/ dir
  }

  const [has_design_md, has_tokens_json, has_tokens_css, has_open_design_export, has_skill] =
    await Promise.all([
      fileExists(path.join(brandDir, "DESIGN.md")),
      fileExists(path.join(brandDir, "design-tokens.json")),
      fileExists(path.join(brandDir, "design-tokens.css")),
      fileExists(path.join(brandDir, "open-design", "DESIGN.md")),
      fileExists(path.join(brandDir, "skill", "SKILL.md")),
    ]);

  return {
    original_pages,
    replica_html_pages,
    has_compare,
    has_design_md,
    has_tokens: has_tokens_json || has_tokens_css,
    has_tokens_json,
    has_tokens_css,
    has_open_design_export,
    has_skill,
  };
}
