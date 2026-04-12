import { NextRequest, NextResponse } from "next/server";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import os from "os";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const jobsDir = path.join(os.homedir(), ".claude", "design-library", "cache", slug, "jobs");
  if (!existsSync(jobsDir)) return NextResponse.json({ exists: false });

  const files = readdirSync(jobsDir).filter(f => f.endsWith(".json"));
  const jobs = files.map(f => {
    try { return JSON.parse(readFileSync(path.join(jobsDir, f), "utf-8")); } catch { return null; }
  }).filter(Boolean);

  return NextResponse.json({ exists: true, jobs });
}
