import { NextRequest, NextResponse } from "next/server";
import { fetchByokModels, getByokProviderDef } from "@/lib/execution-mode";

export const dynamic = "force-dynamic";

// GET /api/execution/byok/models?provider=anthropic[&refresh=1]
// Live model list for one BYOK provider, falling back to the static
// current-generation hints when the key is missing or the fetch fails.
export async function GET(request: NextRequest) {
  const providerId = request.nextUrl.searchParams.get("provider") ?? "";
  if (!providerId || !getByokProviderDef(providerId)) {
    return NextResponse.json(
      { error: `Unknown BYOK provider: ${providerId || "(missing)"}` },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const result = await fetchByokModels(providerId, { refresh });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
