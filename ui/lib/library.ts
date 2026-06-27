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
  const cacheDir = path.join(LIBRARY_ROOT, "cache", slug);

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

  const readJsonFrom = async (
    root: string,
    relativePath: string
  ): Promise<Record<string, unknown> | null> => {
    try {
      const text = await fs.readFile(path.join(root, relativePath), "utf-8");
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

  const reactReplicaExists = async (): Promise<boolean> => {
    try {
      await fs.access(
        path.join(process.cwd(), "app", "brands", slug, "replica", "page.tsx")
      );
      return true;
    } catch {
      return false;
    }
  };

  const listSceneMatrix = async (): Promise<string[]> => {
    const dir = path.join(brandDir, "scene-matrix");
    try {
      const entries = await fs.readdir(dir);
      return entries
        .filter((name) => name.toLowerCase().endsWith(".png"))
        .sort();
    } catch {
      return [];
    }
  };

  /**
   * Resolve a relative path (under brands/<slug>/) for the captured
   * replica homepage thumbnail, trying multiple known locations in order.
   * Returns null when no PNG exists.
   *
   * Order:
   *   1. brands/<slug>/replica-screenshots/homepage.png
   *      (written by scripts/capture_replica_screenshot.py)
   *   2. cache/<slug>/validation/screenshots/replica/homepage.png
   *      (written by run_validation_loop.py)
   *   3. null
   *
   * The returned path is relative to brandDir so the existing
   * /api/brands/<slug>/file/<path> route serves it directly.
   */
  const findReplicaScreenshot = async (): Promise<string | null> => {
    const captured = "replica-screenshots/homepage.png";
    try {
      await fs.access(path.join(brandDir, captured));
      return captured;
    } catch {
      // fall through
    }

    // Fall back to a validation capture in the cache dir. Surface it via a
    // symlink-like relative path: the file API rejects path traversal, so we
    // place a soft-link into the brand dir on first hit. To stay additive and
    // avoid mutating disk on a read, return null here and let the backfill
    // script populate the canonical path.
    try {
      await fs.access(
        path.join(cacheDir, "validation/screenshots/replica/homepage.png")
      );
      // Best-effort copy into the canonical brand location so the file API can serve it
      // without changing path-traversal semantics. If the copy fails, just give up.
      try {
        const target = path.join(brandDir, "replica-screenshots");
        await fs.mkdir(target, { recursive: true });
        await fs.copyFile(
          path.join(cacheDir, "validation/screenshots/replica/homepage.png"),
          path.join(target, "homepage.png")
        );
        return captured;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  };

  /**
   * Resolve the brand logo to a servable URL path. Downloaded assets live in
   * ui/public/brands/<slug>/ (not the library brand dir), and the dom-extraction
   * records the logo source, so resolve from either — canonical logo.* first,
   * then the downloaded file named by header.logo.src, persisting an inline SVG
   * as logo.svg when the logo is an inline <svg> rather than an <img>.
   */
  const findLogo = async (): Promise<string | null> => {
    const publicDir = path.join(process.cwd(), "public", "brands", slug);
    const tryFile = async (name: string): Promise<string | null> => {
      try {
        await fs.access(path.join(publicDir, name));
        return `/brands/${slug}/${name}`;
      } catch {
        return null;
      }
    };
    for (const name of ["logo.svg", "logo.png", "logo.jpg", "logo.jpeg", "logo.webp"]) {
      const found = await tryFile(name);
      if (found) return found;
    }
    for (const pageName of ["homepage", "home", "index"]) {
      try {
        const raw = await fs.readFile(
          path.join(cacheDir, "dom-extraction", `${pageName}.json`),
          "utf-8"
        );
        const dom = JSON.parse(raw) as {
          header?: { logo?: { src?: string; outerHTML?: string; type?: string } };
          logo?: { src?: string; outerHTML?: string; type?: string };
        };
        const logo = dom?.header?.logo ?? dom?.logo;
        if (logo?.src && !logo.src.startsWith("data:")) {
          try {
            const fname = path
              .basename(new URL(logo.src).pathname)
              .replace(/[^a-zA-Z0-9._-]/g, "_");
            if (fname) {
              const found = await tryFile(fname);
              if (found) return found;
            }
          } catch {
            /* malformed src — ignore */
          }
        }
        if (logo?.type === "svg" && logo.outerHTML) {
          try {
            await fs.writeFile(path.join(publicDir, "logo.svg"), String(logo.outerHTML));
            return `/brands/${slug}/logo.svg`;
          } catch {
            /* non-writable — ignore */
          }
        }
      } catch {
        /* no dom-extraction file for this page */
      }
    }
    try {
      const entries = await fs.readdir(publicDir);
      const brandWord = slug.split("-")[0].toLowerCase();
      const match = entries.find(
        (n) =>
          /^logo\./i.test(n) ||
          (n.toLowerCase().startsWith(brandWord) && /\.(svg|png)$/i.test(n))
      );
      if (match) return `/brands/${slug}/${match}`;
    } catch {
      /* no public dir */
    }
    return null;
  };

  const [
    design_md,
    design_tokens,
    design_tokens_css,
    skill_md,
    metadata,
    validation_report,
    rubric_report,
    component_manifest,
    brand_component_report,
    cache_component_report,
    has_html_replica,
    has_react_replica,
    has_screenshots,
    scene_matrix,
    replica_screenshot,
  ] = await Promise.all([
    readText("DESIGN.md"),
    readJson("design-tokens.json"),
    readText("design-tokens.css"),
    readText("skill/SKILL.md"),
    readJson("metadata.json"),
    readJson("validation/report.json"),
    readJson("validation/rubric-report.json"),
    readJson("component-manifest.json"),
    readJson("validation/component-report.json"),
    readJsonFrom(cacheDir, "validation/component-report.json"),
    fileExists("replica/index.html"),
    reactReplicaExists(),
    fileExists("screenshots/reference"),
    listSceneMatrix(),
    findReplicaScreenshot(),
  ]);

  const logo_path = await findLogo();

  return {
    summary,
    design_md,
    design_tokens,
    design_tokens_css,
    skill_md,
    metadata,
    validation_report,
    rubric_report,
    component_manifest,
    component_report: cache_component_report ?? brand_component_report,
    has_replica: has_html_replica || has_react_replica,
    has_logo: logo_path !== null,
    logo: logo_path,
    has_screenshots,
    scene_matrix,
    replica_screenshot,
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
