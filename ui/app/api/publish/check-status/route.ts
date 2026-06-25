import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const indexPath = path.join(
    os.homedir(),
    ".claude",
    "design-library",
    "design-systems-index.json"
  );

  try {
    const raw = await fs.readFile(indexPath, "utf-8");
    const index = JSON.parse(raw);
    const imported = Array.isArray(index)
      ? index.some((entry: any) => entry?.slug === slug || entry?.id === slug)
      : typeof index === "object" && index !== null
        ? !!index[slug]
        : false;

    return NextResponse.json({ imported, slug });
  } catch {
    return NextResponse.json({ imported: false, slug, error: "no index" });
  }
}
