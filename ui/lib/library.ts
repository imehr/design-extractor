import { promises as fs } from "fs";
import path from "path";
import os from "os";
import type { LibraryIndex, BrandDetail, BrandSummary } from "./types";

const LIBRARY_ROOT = path.join(os.homedir(), ".claude", "design-library");
const INDEX_PATH = path.join(LIBRARY_ROOT, "index.json");

export async function getLibraryIndex(): Promise<LibraryIndex> {
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf-8");
    return JSON.parse(raw) as LibraryIndex;
  } catch {
    return { version: "0.0.0", updated_at: "", brands: [] };
  }
}

export async function getBrandDetail(
  slug: string
): Promise<BrandDetail | null> {
  const index = await getLibraryIndex();
  const summary: BrandSummary | undefined = index.brands.find(
    (b) => b.slug === slug
  );
  if (!summary) return null;

  const brandDir = path.join(LIBRARY_ROOT, "brands", slug);

  try {
    await fs.access(brandDir);
  } catch {
    return null;
  }

  const readText = async (relativePath: string): Promise<string | null> => {
    try {
      return await fs.readFile(path.join(brandDir, relativePath), "utf-8");
    } catch {
      return null;
    }
  };

  const readJson = async (
    relativePath: string
  ): Promise<Record<string, unknown> | null> => {
    const text = await readText(relativePath);
    if (text === null) return null;
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const fileExists = async (relativePath: string): Promise<boolean> => {
    try {
      await fs.access(path.join(brandDir, relativePath));
      return true;
    } catch {
      return false;
    }
  };

  const [
    design_md,
    design_tokens,
    design_tokens_css,
    skill_md,
    metadata,
    validation_report,
    has_replica,
    has_logo,
    has_screenshots,
  ] = await Promise.all([
    readText("DESIGN.md"),
    readJson("design-tokens.json"),
    readText("design-tokens.css"),
    readText("skill/SKILL.md"),
    readJson("metadata.json"),
    readJson("validation/report.json"),
    fileExists("replica/index.html"),
    fileExists("assets/logo.svg"),
    fileExists("screenshots/reference"),
  ]);

  return {
    summary,
    design_md,
    design_tokens,
    design_tokens_css,
    skill_md,
    metadata,
    validation_report,
    has_replica,
    has_logo,
    has_screenshots,
  };
}

export async function getBrandFile(
  slug: string,
  relativePath: string
): Promise<Buffer | null> {
  const brandDir = path.join(LIBRARY_ROOT, "brands", slug);
  const resolved = path.resolve(brandDir, relativePath);

  // Path traversal protection: resolved path must stay within brand directory
  if (!resolved.startsWith(brandDir + path.sep) && resolved !== brandDir) {
    return null;
  }

  try {
    return await fs.readFile(resolved);
  } catch {
    return null;
  }
}
