import { NextResponse } from "next/server";
import { getByokProviderDef, testByokProvider } from "@/lib/execution-mode";
import { readModelProviderSettings } from "@/lib/model-settings";

export const dynamic = "force-dynamic";

// POST /api/execution/byok/test { providerId, model? }
// Sends one tiny chat completion ("Reply with OK") to the provider with the
// stored key (or environment fallback). The response never contains the key.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { providerId?: unknown; model?: unknown }
    | null;
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  if (!providerId || !getByokProviderDef(providerId)) {
    return NextResponse.json(
      { error: `Unknown BYOK provider: ${providerId || "(missing)"}` },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // Explicit model wins; otherwise the provider's configured model from
  // settings; otherwise testByokProvider falls back to the first known model.
  let model: string | null = typeof body?.model === "string" ? body.model : null;
  if (!model) {
    try {
      const settings = await readModelProviderSettings();
      const configured = settings.byok.models[providerId];
      if (configured && configured !== "default") model = configured;
    } catch {
      // Settings unreadable — proceed with the registry fallback model.
    }
  }

  const result = await testByokProvider(providerId, model);
  return NextResponse.json(
    { provider_id: providerId, ...result },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
