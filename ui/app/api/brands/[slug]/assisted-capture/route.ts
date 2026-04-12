import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { homedir } from "os";

const BRANDS_BASE = path.join(homedir(), ".claude", "design-library");
const CACHE_BASE = path.join(BRANDS_BASE, "cache");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const formData = await request.formData();

  const screenshotsDir = path.join(CACHE_BASE, slug, "screenshots", "harness");
  await mkdir(screenshotsDir, { recursive: true });

  const imported: string[] = [];

  const files = formData.getAll("files") as File[];
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const destPath = path.join(screenshotsDir, file.name);
    await writeFile(destPath, buffer);
    imported.push(file.name);
  }

  const domExport = formData.get("domExport") as File | null;
  if (domExport) {
    const domDir = path.join(CACHE_BASE, slug, "dom-extraction");
    await mkdir(domDir, { recursive: true });
    const bytes = await domExport.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(domDir, "manual-export.json"), buffer);
    imported.push("manual-export.json");
  }

  const metadataPath = path.join(BRANDS_BASE, "brands", slug, "metadata.json");
  const metadataDir = path.dirname(metadataPath);
  await mkdir(metadataDir, { recursive: true });

  let metadata: Record<string, unknown> = {};
  if (existsSync(metadataPath)) {
    const raw = readFileSync(metadataPath, "utf-8");
    try { metadata = JSON.parse(raw); } catch { metadata = {}; }
  }
  metadata.assisted_capture = true;
  metadata.capture_method = "manual_upload";
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  return NextResponse.json({ imported, count: imported.length });
}
