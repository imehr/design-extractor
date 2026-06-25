// Server-only — uses child_process / fs / os. Import exclusively from route
// handlers (e.g. app/api/brands/[slug]/bundle/route.ts), never from a client
// component.
import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(process.cwd(), "..");
const EXPORT_SCRIPT = path.join(REPO_ROOT, "scripts/export_open_design.py");
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export interface DesignBundle {
  filename: string;
  bytes: Buffer;
}

/**
 * Build the Open Design bundle for a brand and return the zip bytes.
 *
 * Delegates to scripts/export_open_design.py --zip, which regenerates the
 * open-design export (DESIGN.md + skill/ with tokens + assets/ with logo SVGs)
 * and zips it under a single brand-<slug>/ folder — the exact shape open-design
 * consumes. The temp dir is always cleaned up.
 */
export async function buildDesignBundle(slug: string): Promise<DesignBundle> {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`invalid slug: ${slug}`);
  }
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `design-bundle-${slug}-`));
  const zipPath = path.join(tmpDir, `${slug}-design-bundle.zip`);
  try {
    await execFileAsync("python3", [EXPORT_SCRIPT, "--slug", slug, "--zip", zipPath], {
      cwd: REPO_ROOT,
      timeout: 120000,
      maxBuffer: 16 * 1024 * 1024,
    });
    const bytes = await fs.readFile(zipPath);
    if (bytes.length === 0) {
      throw new Error("bundle export produced an empty archive");
    }
    return { filename: `${slug}-design-bundle.zip`, bytes };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
