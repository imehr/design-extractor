import { NextRequest, NextResponse } from "next/server";
import { detectClis } from "@/lib/execution-mode";

export const dynamic = "force-dynamic";

// GET /api/execution/agents       -> cached detection result
// GET /api/execution/agents?rescan=1 -> force a fresh PATH scan + probes
export async function GET(request: NextRequest) {
  const rescan = request.nextUrl.searchParams.get("rescan") === "1";
  try {
    const agents = await detectClis({ rescan });
    return NextResponse.json(
      { agents, scanned_at: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CLI detection failed" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
