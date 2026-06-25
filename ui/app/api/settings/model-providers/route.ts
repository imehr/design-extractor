import { NextResponse } from "next/server";
import {
  readModelProviderSettings,
  updateModelProviderSettings,
} from "@/lib/model-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return noStoreJson(await readModelProviderSettings());
  } catch (error) {
    return errorJson(error);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    return noStoreJson(await updateModelProviderSettings({
      active_provider: typeof body.active_provider === "string" ? body.active_provider : undefined,
      providers: typeof body.providers === "object" && body.providers ? body.providers : undefined,
    }));
  } catch (error) {
    return errorJson(error);
  }
}

function noStoreJson(payload: unknown) {
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function errorJson(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Model provider settings action failed" },
    {
      status: 400,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
