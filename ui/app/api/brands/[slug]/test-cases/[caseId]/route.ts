import { NextResponse } from "next/server";
import { readTestCaseHtml } from "@/lib/test-cases";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; caseId: string }> }
) {
  const { slug, caseId } = await params;
  const html = await readTestCaseHtml(slug, caseId);
  if (!html) {
    return new NextResponse("Test case has not been generated yet.", {
      status: 404,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
