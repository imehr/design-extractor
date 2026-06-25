import { NextResponse } from "next/server";
import {
  BYOK_PROVIDERS,
  getByokKeyState,
  getByokProviderDef,
  getEnvKeyAvailability,
  importByokKeyFromEnv,
  sanitizeCustomModel,
  setByokKey,
} from "@/lib/execution-mode";
import {
  readModelProviderSettings,
  updateModelProviderSettings,
} from "@/lib/model-settings";

export const dynamic = "force-dynamic";

// GET /api/execution/byok — provider registry + masked key state + chosen
// models. Full keys never leave the server.
export async function GET() {
  try {
    const settings = await readModelProviderSettings();
    const providers = await Promise.all(
      BYOK_PROVIDERS.map(async (def) => {
        const [keyState, envKey] = await Promise.all([
          getByokKeyState(def.id),
          getEnvKeyAvailability(def.id),
        ]);
        return {
          id: def.id,
          label: def.label,
          subtitle: def.subtitle,
          docs: def.docs,
          key_env_var: envKey.varName ?? def.keyEnvVar,
          requires_key: def.endpoint?.auth !== "none",
          has_key: keyState.hasKey,
          masked_key: keyState.maskedKey,
          key_source: keyState.keySource,
          env_key_available: envKey.available,
          model: settings.byok.models[def.id] ?? "default",
        };
      })
    );
    return noStore({
      active_provider: settings.byok.active_provider,
      execution_mode: settings.execution_mode,
      providers,
    });
  } catch (error) {
    return errorJson(error);
  }
}

// POST /api/execution/byok
//   { providerId, apiKey: "sk-..." }        set key
//   { providerId, apiKey: null }            clear key
//   { providerId, import_from_env: true }   copy env key into the store
//   { providerId, model: "..." }            choose model for provider
//   { providerId, active: true }            make provider the active BYOK provider
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        providerId?: unknown;
        apiKey?: unknown;
        import_from_env?: unknown;
        model?: unknown;
        active?: unknown;
      }
    | null;
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  if (!providerId || !getByokProviderDef(providerId)) {
    return NextResponse.json(
      { error: `Unknown BYOK provider: ${providerId || "(missing)"}` },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
  try {
    if (body && "apiKey" in body) {
      if (body.apiKey !== null && typeof body.apiKey !== "string") {
        throw new Error("apiKey must be a string or null");
      }
      await setByokKey(providerId, body.apiKey as string | null);
    }

    if (body?.import_from_env === true) {
      await importByokKeyFromEnv(providerId);
    }

    const updates: Parameters<typeof updateModelProviderSettings>[0] = {};
    if (typeof body?.model === "string") {
      const model = body.model === "default" ? "default" : sanitizeCustomModel(body.model);
      if (!model) throw new Error(`Invalid model id: ${body.model}`);
      updates.byok = { models: { [providerId]: model } };
    }
    if (body?.active === true) {
      updates.byok = { ...(updates.byok ?? {}), active_provider: providerId };
      updates.execution_mode = "byok";
    }
    if (Object.keys(updates).length > 0) {
      await updateModelProviderSettings(updates);
    }

    const settings = await readModelProviderSettings();
    const keyState = await getByokKeyState(providerId);
    const envKey = await getEnvKeyAvailability(providerId);
    return noStore({
      provider_id: providerId,
      has_key: keyState.hasKey,
      masked_key: keyState.maskedKey,
      key_source: keyState.keySource,
      env_key_available: envKey.available,
      model: settings.byok.models[providerId] ?? "default",
      active_provider: settings.byok.active_provider,
      execution_mode: settings.execution_mode,
    });
  } catch (error) {
    return errorJson(error);
  }
}

function noStore(payload: unknown) {
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function errorJson(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "BYOK action failed" },
    { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
