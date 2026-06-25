// Client-safe helpers for showing the current Execution mode selection.
// (ui/lib/execution-mode.ts is server-only — it imports child_process — so
// pages that just need a label use this module with /api/execution/mode.)

export interface ExecutionModePayload {
  execution_mode: "local-cli" | "byok";
  execution_configured: boolean;
  selected_cli: { id: string; model: string };
  byok: { active_provider: string | null; models: Record<string, string> };
}

export interface ExecutionSelectionDisplay {
  providerLabel: string;
  modelLabel: string;
}

// Display names for the CLI registry ids (mirrors CLI_DEFS in
// execution-mode.ts, which cannot be imported into client components).
const CLI_LABELS: Record<string, string> = {
  claude: "Claude Code",
  codex: "Codex CLI",
  gemini: "Gemini CLI",
  opencode: "OpenCode",
  "cursor-agent": "Cursor Agent",
  kimi: "Kimi CLI",
  qwen: "Qwen Code",
};

function titleCase(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function describeExecutionSelection(
  payload: ExecutionModePayload | null
): ExecutionSelectionDisplay {
  if (!payload) {
    return { providerLabel: "Selected provider", modelLabel: "selected" };
  }
  if (payload.execution_mode === "byok" && payload.byok?.active_provider) {
    const providerId = payload.byok.active_provider;
    return {
      providerLabel: `${titleCase(providerId)} (BYOK)`,
      modelLabel: payload.byok.models?.[providerId] || "default",
    };
  }
  const cliId = payload.selected_cli?.id || "claude";
  return {
    providerLabel: CLI_LABELS[cliId] ?? titleCase(cliId),
    modelLabel: payload.selected_cli?.model || "default",
  };
}
