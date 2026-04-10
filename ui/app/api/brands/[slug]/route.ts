import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { getBrandDetail } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const brand = await getBrandDetail(slug);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // List files in the brand directory
  const brandDir = path.join(
    os.homedir(),
    ".claude",
    "design-library",
    "brands",
    slug
  );
  let files: string[] = [];
  try {
    const walk = async (dir: string, prefix = ""): Promise<string[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const result: string[] = [];
      for (const entry of entries) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.name.startsWith(".")) continue;
        if (entry.isDirectory()) {
          result.push(...(await walk(path.join(dir, entry.name), rel)));
        } else {
          result.push(rel);
        }
      }
      return result;
    };
    files = await walk(brandDir);
  } catch {
    // ignore
  }

  // Flatten: spread summary fields to top level for the page component
  const { summary, ...rest } = brand;
  return NextResponse.json({ ...summary, ...rest, files });
}
