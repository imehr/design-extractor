import { NextResponse } from "next/server";
import { getCliDef, testCli } from "@/lib/execution-mode";

export const dynamic = "force-dynamic";

// POST /api/execution/agents/test { id, model? }
// Runs a trivial non-interactive prompt through the selected CLI and reports
// ok / latency / output (or stderr on failure). Model ids are validated
// against the live/fallback lists or sanitized inside testCli.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { id?: unknown; model?: unknown }
    | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id || !getCliDef(id)) {
    return NextResponse.json(
      { error: `Unknown CLI id: ${id || "(missing)"}` },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
  const model = typeof body?.model === "string" ? body.model : null;
  const result = await testCli(id, model);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
