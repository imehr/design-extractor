import { NextResponse } from "next/server";
import { readJobState } from "@/lib/improvement";
import { promises as fs } from "fs";
import path from "path";
import os from "os";


export const dynamic = "force-dynamic";


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const jobsDir = path.join(
    os.homedir(),
    ".claude",
    "design-library",
    "cache",
    slug,
    "jobs"
  );

  let entries: string[];
  try {
    entries = await fs.readdir(jobsDir);
  } catch {
    return NextResponse.json([]);
  }

  const jobs: Record<string, unknown>[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const job = await readJobState(slug, entry.replace(/\.json$/, ""));
    if (job) jobs.push(job as unknown as Record<string, unknown>);
  }

  jobs.sort((a, b) => {
    const aTime = a.updated_at ? new Date(a.updated_at as string).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at as string).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json(jobs);
}
