import { NextResponse } from "next/server";
import { readJobState } from "@/lib/improvement";


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

  return NextResponse.json(job);
}
