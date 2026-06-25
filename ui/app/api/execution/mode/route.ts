import { NextResponse } from "next/server";
import { getCliDef, sanitizeCustomModel } from "@/lib/execution-mode";
import {
  readModelProviderSettings,
  updateModelProviderSettings,
} from "@/lib/model-settings";

export const dynamic = "force-dynamic";

// GET /api/execution/mode — current execution-mode block of the settings.
export async function GET() {
  try {
    const settings = await readModelProviderSettings();
    return noStore({
      execution_mode: settings.execution_mode,
      execution_configured: settings.execution_configured,
      selected_cli: settings.selected_cli,
      byok: settings.byok,
    });
  } catch (error) {
    return errorJson(error);
  }
}

// POST /api/execution/mode { execution_mode?, selected_cli? }
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        execution_mode?: unknown;
        selected_cli?: { id?: unknown; model?: unknown };
      }
    | null;
  try {
    const updates: Parameters<typeof updateModelProviderSettings>[0] = {};

    if (body?.execution_mode !== undefined) {
      if (body.execution_mode !== "local-cli" && body.execution_mode !== "byok") {
        throw new Error(`Unknown execution mode: ${String(body.execution_mode)}`);
      }
      updates.execution_mode = body.execution_mode;
    }

    if (body?.selected_cli !== undefined) {
      const id = typeof body.selected_cli?.id === "string" ? body.selected_cli.id : "";
      if (!id || !getCliDef(id)) {
        throw new Error(`Unknown CLI id: ${id || "(missing)"}`);
      }
      let model = "default";
      if (
        typeof body.selected_cli?.model === "string" &&
        body.selected_cli.model !== "default"
      ) {
        const sanitized = sanitizeCustomModel(body.selected_cli.model);
        if (!sanitized) throw new Error(`Invalid model id: ${body.selected_cli.model}`);
        model = sanitized;
      }
      updates.selected_cli = { id, model };
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("Nothing to update: pass execution_mode and/or selected_cli");
    }

    const settings = await updateModelProviderSettings(updates);
    return noStore({
      execution_mode: settings.execution_mode,
      execution_configured: settings.execution_configured,
      selected_cli: settings.selected_cli,
      byok: settings.byok,
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
    { error: error instanceof Error ? error.message : "Execution mode action failed" },
    { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
