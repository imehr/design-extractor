import { NextResponse } from "next/server";
import { readJobState, getJobPath } from "@/lib/improvement";
import { promises as fs } from "fs";


export const dynamic = "force-dynamic";


export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ slug: string; jobId: string }>;
  }
) {
  const { slug, jobId } = await params;
  const job = await readJobState(slug, jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const response: Record<string, unknown> = { ...job };
  if (job.status === "running" && job.updated_at) {
    const elapsed = Date.now() - new Date(job.updated_at).getTime();
    if (elapsed > 10 * 60 * 1000) {
      response.stale = true;
    }
  }

  return NextResponse.json(response);
}


export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ slug: string; jobId: string }>;
  }
) {
  const { slug, jobId } = await params;
  const job = await readJobState(slug, jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  job.status = "cancelled";
  job.updated_at = new Date().toISOString();

  const jobPath = getJobPath(slug, jobId);
  await fs.writeFile(jobPath, JSON.stringify(job, null, 2));

  return NextResponse.json(job);
}
