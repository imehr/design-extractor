import { NextResponse } from "next/server";
import { startImprovementJob, readJobState } from "@/lib/improvement";
import { promises as fs } from "fs";
import path from "path";
import os from "os";


export const dynamic = "force-dynamic";


async function findRunningJob(slug: string) {
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
    return null;
  }
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const job = await readJobState(slug, entry.replace(/\.json$/, ""));
    if (job && job.status === "running") return job;
  }
  return null;
}


export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));

  const existing = await findRunningJob(slug);
  if (existing) {
    return NextResponse.json({ job: existing });
  }

  const job = await startImprovementJob(slug, {
    targetScore: typeof body?.targetScore === "number" ? body.targetScore : undefined,
    feedback: typeof body?.feedback === "object" && body.feedback ? body.feedback : undefined,
  });

  if (!job) {
    return NextResponse.json(
      { error: "Failed to start improvement job" },
      { status: 500 }
    );
  }

  return NextResponse.json({ job });
}
