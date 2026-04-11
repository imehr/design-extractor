import { NextResponse } from "next/server";
import { startImprovementJob } from "@/lib/improvement";


export const dynamic = "force-dynamic";


export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
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
