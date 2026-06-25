import { promises as fs } from "fs";
import os from "os";
import path from "path";

type JsonRecord = Record<string, unknown>;

export type TaskModelSource = "environment" | "project" | "settings" | "default";

export interface ModelProvider {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  command: string | null;
  model: string;
  base_url: string | null;
  timeout_seconds: number;
  temperature: number | null;
  num_ctx: number | null;
  allowed_tools: string[];
  permission_mode: string | null;
  model_presets: string[];
  description: string | null;
}

export type ExecutionMode = "local-cli" | "byok";

export interface SelectedCliSettings {
  id: string;
  model: string;
}

export interface ByokSettings {
  active_provider: string | null;
  // Per-provider chosen model id (keys live in byok.json, not here).
  models: Record<string, string>;
}

export interface ModelProviderSettings {
  version: number;
  execution_mode: ExecutionMode;
  // False until the user has explicitly saved an execution-mode choice.
  // While false, task resolution keeps the legacy active_provider behavior
  // so the v2 migration cannot silently reroute existing installs.
  execution_configured: boolean;
  selected_cli: SelectedCliSettings;
  byok: ByokSettings;
  active_provider: string;
  phase_overrides: JsonRecord;
  providers: Record<string, ModelProvider>;
}

export interface BrandTaskModelOverride {
  provider_id: string;
  model: string;
  updated_at: string;
}

export interface TaskModelSelection {
  task: string;
  provider_id: string;
  provider_label: string;
  provider_type: string;
  agent: string;
  command: string | null;
  model: string;
  base_url: string | null;
  enabled: boolean;
  timeout_seconds: number;
  temperature: number | null;
  num_ctx: number | null;
  allowed_tools: string[];
  permission_mode: string | null;
  model_source: TaskModelSource;
  settings_integrated: boolean;
  project_override: boolean;
  settings_path: string;
  project_settings_path: string | null;
  available_providers: ModelProvider[];
  execution_mode: ExecutionMode;
  selected_cli: SelectedCliSettings;
}

const LIBRARY_ROOT = path.join(os.homedir(), ".claude", "design-library");
const MODEL_SETTINGS_PATH = path.join(LIBRARY_ROOT, "settings", "model-providers.json");
const DEFAULT_PROVIDER_ID = "claude-code";
// Schema v2 adds execution_mode / selected_cli / byok (WS5). v1 files are
// migrated in-memory by normalizeExecutionSettings and rewritten as v2 on the
// next update; all v1 fields are preserved untouched.
const SETTINGS_VERSION = 2;
const DEFAULT_SELECTED_CLI: SelectedCliSettings = { id: "claude", model: "default" };
// Maps execution-mode CLI ids onto the legacy provider registry so the
// existing runner wiring (test-cases.ts, extract_brand.py) keeps working
// when a CLI is selected. CLIs without a legacy provider (gemini, qwen) get
// a synthetic `local-cli-<id>` selection instead.
const CLI_PROVIDER_MAP: Record<string, string> = {
  claude: "claude-code",
  codex: "codex",
  "cursor-agent": "cursor",
  kimi: "kimi",
  opencode: "opencode",
};
const CLI_COMMAND_MAP: Record<string, string> = {
  claude: "claude",
  codex: "codex",
  gemini: "gemini",
  opencode: "opencode",
  "cursor-agent": "cursor-agent",
  kimi: "kimi",
  qwen: "qwen",
};
const DEFAULT_MODEL_PROVIDERS: Record<string, ModelProvider> = {
  "claude-code": {
    id: "claude-code",
    type: "claude-code",
    label: "Claude Code",
    enabled: true,
    command: "claude",
    model: "sonnet",
    base_url: null,
    timeout_seconds: 1500,
    temperature: null,
    num_ctx: null,
    allowed_tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permission_mode: "bypassPermissions",
    model_presets: ["sonnet", "opus", "haiku"],
    description: "Claude Code CLI with filesystem tools.",
  },
  codex: {
    id: "codex",
    type: "codex",
    label: "Codex",
    enabled: false,
    command: "codex",
    model: "gpt-5.5",
    base_url: null,
    timeout_seconds: 1500,
    temperature: null,
    num_ctx: null,
    allowed_tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permission_mode: "never",
    model_presets: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.3-codex", "gpt-5.2-codex", "gpt-5.2"],
    description: "Codex CLI non-interactive exec with repo access.",
  },
  cursor: {
    id: "cursor",
    type: "cursor",
    label: "Cursor Agent",
    enabled: false,
    command: "cursor",
    model: "gpt-5",
    base_url: null,
    timeout_seconds: 1500,
    temperature: null,
    num_ctx: null,
    allowed_tools: ["read", "edit", "bash"],
    permission_mode: "force",
    model_presets: ["gpt-5", "sonnet-4", "sonnet-4-thinking"],
    description: "Cursor agent CLI in print mode with workspace access.",
  },
  kimi: {
    id: "kimi",
    type: "kimi",
    label: "Kimi Code",
    enabled: false,
    command: "kimi",
    model: "kimi-code/kimi-for-coding",
    base_url: null,
    timeout_seconds: 1500,
    temperature: null,
    num_ctx: null,
    allowed_tools: ["read", "edit", "bash"],
    permission_mode: "yolo",
    model_presets: ["kimi-code/kimi-for-coding", "kimi-for-coding/k2p6", "kimi-for-coding/k2p5", "kimi-for-coding/kimi-k2-thinking"],
    description: "Kimi CLI non-interactive agent runner.",
  },
  minimax: {
    id: "minimax",
    type: "minimax",
    label: "MiniMax",
    enabled: false,
    command: "codex",
    model: "codex-MiniMax-M2.1",
    base_url: null,
    timeout_seconds: 1500,
    temperature: null,
    num_ctx: null,
    allowed_tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permission_mode: "never",
    model_presets: ["codex-MiniMax-M2.1", "MiniMax-M2.7", "MiniMax-M2.7-highspeed", "MiniMax-M2.5", "MiniMax-M2.5-highspeed", "MiniMax-M2.1", "MiniMax-M2"],
    description: "MiniMax models routed through the local Codex provider profile.",
  },
  opencode: {
    id: "opencode",
    type: "opencode",
    label: "OpenCode",
    enabled: false,
    command: "opencode",
    model: "opencode/big-pickle",
    base_url: null,
    timeout_seconds: 1500,
    temperature: null,
    num_ctx: null,
    allowed_tools: ["read", "edit", "bash"],
    permission_mode: "dangerously-skip-permissions",
    model_presets: [
      "opencode/big-pickle",
      "opencode/minimax-m2.5-free",
      "kimi-for-coding/k2p6",
      "kimi-for-coding/k2p5",
      "kimi-for-coding/kimi-k2-thinking",
      "minimax/MiniMax-M2.7",
      "minimax/MiniMax-M2.7-highspeed",
      "minimax/MiniMax-M2.5",
      "minimax/MiniMax-M2.5-highspeed",
      "zai/glm-5.1",
      "zai/glm-5-turbo",
      "zai/glm-4.7",
    ],
    description: "OpenCode CLI task runner using locally configured providers.",
  },
  ollama: {
    id: "ollama",
    type: "ollama",
    label: "Ollama",
    enabled: true,
    command: "codex",
    model: "qwen3.5:35b-a3b",
    base_url: "http://127.0.0.1:11434",
    timeout_seconds: 1800,
    temperature: 0.2,
    num_ctx: 32768,
    allowed_tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permission_mode: "never",
    model_presets: [
      "qwen3.5:35b-a3b",
      "qwen3.5:9b",
      "qwen3-vl:32b",
      "moondream:1.8b-v2-fp16",
      "moondream:1.8b-v2-q8_0",
      "hf.co/bartowski/UI-TARS-7B-DPO-GGUF:Q4_K_M",
      "qwen2.5vl:7b",
      "qwen2.5vl:3b",
      "hf.co/OBLITERATUS/gemma-4-E4B-it-OBLITERATED:latest",
      "gemma4-obliterated:q5km",
      "gemma4:e4b",
      "qwen3:4b",
      "qwen2.5:3b-instruct",
      "qwen3:1.7b",
    ],
    description: "Local Ollama models routed through Codex OSS for agentic file edits.",
  },
  "local-openai": {
    id: "local-openai",
    type: "local-openai",
    label: "Local OpenAI-compatible",
    enabled: false,
    command: null,
    model: "qwen2.5-coder",
    base_url: "http://localhost:1234/v1",
    timeout_seconds: 1800,
    temperature: 0.2,
    num_ctx: null,
    allowed_tools: [],
    permission_mode: null,
    model_presets: ["qwen2.5-coder", "qwen3", "gemma-3-27b", "gemma4"],
    description: "LM Studio, vLLM, llama.cpp server, or another local compatible endpoint.",
  },
};

// Legacy active_provider ids that map onto an execution-mode CLI. Providers
// with no CLI equivalent (ollama, local-openai, minimax) are intentionally
// absent: those installs stay execution_configured=false and keep the legacy
// active_provider resolution.
const LEGACY_PROVIDER_TO_CLI: Record<string, string> = {
  "claude-code": "claude",
  codex: "codex",
  cursor: "cursor-agent",
  kimi: "kimi",
  opencode: "opencode",
};

// Pure v1 -> v2 migration for the execution-mode block. Exported for tests.
// Unknown or missing values default to local-cli + Claude Code so existing
// installs behave exactly as before the schema bump. When the file has no
// execution block but its legacy active_provider has a CLI equivalent, the
// selection is derived from it (one-time migration) so the Execution mode
// panel can fully replace the legacy provider panel without changing which
// runner handles tasks.
export function normalizeExecutionSettings(raw: JsonRecord): {
  execution_mode: ExecutionMode;
  execution_configured: boolean;
  selected_cli: SelectedCliSettings;
  byok: ByokSettings;
} {
  const mode = stringValue(raw.execution_mode);
  const execution_mode: ExecutionMode = mode === "byok" ? "byok" : "local-cli";
  let execution_configured =
    raw.execution_mode !== undefined ||
    raw.selected_cli !== undefined ||
    raw.byok !== undefined;

  const rawCli = asRecord(raw.selected_cli);
  const selected_cli: SelectedCliSettings = {
    id: stringValue(rawCli.id) || DEFAULT_SELECTED_CLI.id,
    model: stringValue(rawCli.model) || DEFAULT_SELECTED_CLI.model,
  };

  if (!execution_configured) {
    const legacyProvider = stringValue(raw.active_provider);
    const cliId = legacyProvider ? LEGACY_PROVIDER_TO_CLI[legacyProvider] : undefined;
    if (legacyProvider && cliId) {
      const provider = asRecord(asRecord(raw.providers)[legacyProvider]);
      selected_cli.id = cliId;
      selected_cli.model = stringValue(provider.model) || "default";
      execution_configured = true;
    }
  }

  const rawByok = asRecord(raw.byok);
  const models: Record<string, string> = {};
  for (const [providerId, model] of Object.entries(asRecord(rawByok.models))) {
    const value = stringValue(model);
    if (value) models[providerId] = value;
  }
  const byok: ByokSettings = {
    active_provider: stringValue(rawByok.active_provider),
    models,
  };
  return { execution_mode, execution_configured, selected_cli, byok };
}

export async function readModelProviderSettings(): Promise<ModelProviderSettings> {
  const raw = await readJson(MODEL_SETTINGS_PATH);
  const providersRecord = asRecord(raw.providers);
  const providers: Record<string, ModelProvider> = defaultProviders();

  for (const [providerId, providerValue] of Object.entries(providersRecord)) {
    const provider = normalizeProvider(providerId, asRecord(providerValue));
    providers[provider.id] = provider;
  }

  if (!providers[DEFAULT_PROVIDER_ID]) {
    providers[DEFAULT_PROVIDER_ID] = defaultProvider();
  }

  const activeProvider = stringValue(raw.active_provider) || DEFAULT_PROVIDER_ID;
  return {
    version: SETTINGS_VERSION,
    ...normalizeExecutionSettings(raw),
    active_provider: providers[activeProvider] ? activeProvider : DEFAULT_PROVIDER_ID,
    phase_overrides: asRecord(raw.phase_overrides),
    providers,
  };
}

export async function updateModelProviderSettings(input: {
  active_provider?: string;
  providers?: Record<string, { model?: string; enabled?: boolean }>;
  execution_mode?: ExecutionMode;
  selected_cli?: { id?: string; model?: string };
  byok?: { active_provider?: string | null; models?: Record<string, string> };
}): Promise<ModelProviderSettings> {
  const settings = await readModelProviderSettings();
  const rawSettings = await readJson(MODEL_SETTINGS_PATH);
  const rawProviders = asRecord(rawSettings.providers);
  if (input.active_provider) {
    if (!settings.providers[input.active_provider]) {
      throw new Error(`Unknown provider: ${input.active_provider}`);
    }
    settings.active_provider = input.active_provider;
    rawSettings.active_provider = input.active_provider;
  }

  const executionTouched =
    input.execution_mode !== undefined ||
    input.selected_cli !== undefined ||
    input.byok !== undefined;
  if (executionTouched) settings.execution_configured = true;

  if (input.execution_mode !== undefined) {
    if (input.execution_mode !== "local-cli" && input.execution_mode !== "byok") {
      throw new Error(`Unknown execution mode: ${String(input.execution_mode)}`);
    }
    settings.execution_mode = input.execution_mode;
  }

  if (input.selected_cli !== undefined) {
    const id = stringValue(input.selected_cli.id);
    const model = stringValue(input.selected_cli.model);
    if (input.selected_cli.id !== undefined && !id) {
      throw new Error("selected_cli.id must be a non-empty string");
    }
    settings.selected_cli = {
      id: id ?? settings.selected_cli.id,
      model: model ?? (input.selected_cli.model === undefined ? settings.selected_cli.model : "default"),
    };
  }

  if (input.byok !== undefined) {
    if (input.byok.active_provider !== undefined) {
      settings.byok.active_provider =
        input.byok.active_provider === null ? null : stringValue(input.byok.active_provider);
    }
    for (const [providerId, model] of Object.entries(input.byok.models ?? {})) {
      const value = stringValue(model);
      if (value) settings.byok.models[providerId] = value;
      else delete settings.byok.models[providerId];
    }
  }

  for (const [providerId, patch] of Object.entries(input.providers ?? {})) {
    const provider = settings.providers[providerId];
    if (!provider) throw new Error(`Unknown provider: ${providerId}`);
    const rawProvider = asRecord(rawProviders[providerId]);
    if (typeof patch.model === "string" && patch.model.trim()) {
      provider.model = patch.model.trim();
      rawProvider.model = provider.model;
    }
    if (typeof patch.enabled === "boolean") {
      provider.enabled = patch.enabled;
      rawProvider.enabled = provider.enabled;
    }
    rawProviders[providerId] = rawProvider;
  }

  rawSettings.version = SETTINGS_VERSION;
  // Only persist the execution block once the user has explicitly chosen —
  // its mere presence on disk flips execution_configured to true.
  if (settings.execution_configured) {
    rawSettings.execution_mode = settings.execution_mode;
    rawSettings.selected_cli = { ...settings.selected_cli };
    rawSettings.byok = {
      active_provider: settings.byok.active_provider,
      models: { ...settings.byok.models },
    };
  }
  rawSettings.active_provider = settings.active_provider;
  rawSettings.phase_overrides = settings.phase_overrides;
  rawSettings.providers = rawProviders;
  await fs.mkdir(path.dirname(MODEL_SETTINGS_PATH), { recursive: true });
  await fs.writeFile(
    MODEL_SETTINGS_PATH,
    JSON.stringify(rawSettings, null, 2),
    "utf-8"
  );
  return readModelProviderSettings();
}

export async function resolveTaskModelSelection(
  task: "test_cases",
  slug?: string,
  env: { providerId?: string; model?: string } = {}
): Promise<TaskModelSelection> {
  const settings = await readModelProviderSettings();
  const projectPath = slug ? getBrandTaskModelPath(slug, task) : null;
  const projectOverride = projectPath ? await readProjectOverride(projectPath) : null;
  const phaseOverride = asRecord(settings.phase_overrides[task]);

  const envProviderId = env.providerId?.trim();
  const envModel = env.model?.trim();
  const phaseProviderId = stringValue(phaseOverride.provider_id) || stringValue(phaseOverride.provider);
  const phaseModel = stringValue(phaseOverride.model);

  let model_source: TaskModelSource = "default";
  let providerId = DEFAULT_PROVIDER_ID;
  let model: string | null = null;
  let project_override = false;

  if (envProviderId || envModel) {
    providerId = envProviderId || settings.active_provider;
    model = envModel || null;
    model_source = "environment";
  } else if (projectOverride) {
    providerId = projectOverride.provider_id;
    model = projectOverride.model;
    project_override = true;
    model_source = "project";
  } else if (phaseProviderId || phaseModel || settings.active_provider) {
    providerId = phaseProviderId || settings.active_provider;
    model = phaseModel || null;
    model_source = "settings";
  }

  // Execution-mode selection (WS5) replaces the "active_provider" tier of the
  // precedence chain: environment and project/phase overrides still win, but
  // the global default now follows the Execution mode panel.
  const useExecutionSelection =
    settings.execution_configured &&
    (model_source === "default" ||
      (model_source === "settings" && !phaseProviderId && !phaseModel));

  if (useExecutionSelection && settings.execution_mode === "byok" && settings.byok.active_provider) {
    const byokProvider = settings.byok.active_provider;
    const byokModel = settings.byok.models[byokProvider] || "default";
    return {
      task,
      provider_id: `byok-${byokProvider}`,
      provider_label: `${titleCase(byokProvider)} (BYOK)`,
      provider_type: `byok-${byokProvider}`,
      agent: "byok-api",
      command: null,
      model: byokModel,
      base_url: null,
      enabled: true,
      timeout_seconds: 1500,
      temperature: null,
      num_ctx: null,
      allowed_tools: [],
      permission_mode: null,
      model_source: "settings",
      settings_integrated: true,
      project_override: false,
      settings_path: MODEL_SETTINGS_PATH,
      project_settings_path: projectPath,
      available_providers: Object.values(settings.providers),
      execution_mode: settings.execution_mode,
      selected_cli: settings.selected_cli,
    };
  }

  if (useExecutionSelection && settings.execution_mode === "local-cli") {
    const cliId = settings.selected_cli.id;
    const cliModel = settings.selected_cli.model;
    const mappedProviderId = CLI_PROVIDER_MAP[cliId];
    if (mappedProviderId && settings.providers[mappedProviderId]) {
      providerId = mappedProviderId;
      if (cliModel && cliModel !== "default") model = cliModel;
      model_source = "settings";
    } else if (!mappedProviderId && CLI_COMMAND_MAP[cliId]) {
      // CLIs without a legacy provider entry (gemini, qwen): synthesize a
      // selection so callers can still see what was chosen. Runners that
      // don't support it surface their usual "not wired" error.
      return {
        task,
        provider_id: `local-cli-${cliId}`,
        provider_label: titleCase(cliId),
        provider_type: `local-cli-${cliId}`,
        agent: `${CLI_COMMAND_MAP[cliId]}-cli`,
        command: CLI_COMMAND_MAP[cliId],
        model: cliModel || "default",
        base_url: null,
        enabled: true,
        timeout_seconds: 1500,
        temperature: null,
        num_ctx: null,
        allowed_tools: [],
        permission_mode: null,
        model_source: "settings",
        settings_integrated: true,
        project_override: false,
        settings_path: MODEL_SETTINGS_PATH,
        project_settings_path: projectPath,
        available_providers: Object.values(settings.providers),
        execution_mode: settings.execution_mode,
        selected_cli: settings.selected_cli,
      };
    }
  }

  const provider = settings.providers[providerId] ?? settings.providers[DEFAULT_PROVIDER_ID] ?? defaultProvider();
  const selectedModel = model || provider.model || "default";
  return {
    task,
    provider_id: provider.id,
    provider_label: provider.label,
    provider_type: provider.type,
    agent: agentLabel(provider),
    command: provider.command,
    model: selectedModel,
    base_url: provider.base_url,
    enabled: provider.enabled,
    timeout_seconds: provider.timeout_seconds,
    temperature: provider.temperature,
    num_ctx: provider.num_ctx,
    allowed_tools: provider.allowed_tools,
    permission_mode: provider.permission_mode,
    model_source,
    settings_integrated: model_source === "settings" || model_source === "project" || model_source === "environment",
    project_override,
    settings_path: MODEL_SETTINGS_PATH,
    project_settings_path: projectPath,
    available_providers: Object.values(settings.providers),
    execution_mode: settings.execution_mode,
    selected_cli: settings.selected_cli,
  };
}

export async function setBrandTaskModelOverride(
  slug: string,
  task: "test_cases",
  input: { provider_id: string; model?: string }
): Promise<BrandTaskModelOverride> {
  const settings = await readModelProviderSettings();
  const provider = settings.providers[input.provider_id];
  if (!provider) throw new Error(`Unknown provider: ${input.provider_id}`);
  if (!provider.enabled) throw new Error(`Provider is disabled: ${provider.label}`);

  const override: BrandTaskModelOverride = {
    provider_id: provider.id,
    model: (input.model?.trim() || provider.model || "default"),
    updated_at: new Date().toISOString(),
  };
  const filePath = getBrandTaskModelPath(slug, task);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(override, null, 2), "utf-8");
  return override;
}

export async function clearBrandTaskModelOverride(
  slug: string,
  task: "test_cases"
): Promise<void> {
  try {
    await fs.unlink(getBrandTaskModelPath(slug, task));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function getBrandTaskModelPath(slug: string, task: "test_cases"): string {
  const fileName = task === "test_cases" ? "test-case-model.json" : `${task}-model.json`;
  return path.join(LIBRARY_ROOT, "brands", slug, "settings", fileName);
}

function normalizeProvider(id: string, input: JsonRecord): ModelProvider {
  const fallback = defaultProviderFor(id);
  const model = stringValue(input.model) || fallback?.model || "default";
  return {
    id: stringValue(input.id) || fallback?.id || id,
    type: stringValue(input.type) || fallback?.type || id,
    label: stringValue(input.label) || fallback?.label || titleCase(id),
    enabled: typeof input.enabled === "boolean" ? input.enabled : fallback?.enabled ?? true,
    command: stringValue(input.command) || fallback?.command || null,
    model,
    base_url: stringValue(input.base_url) || fallback?.base_url || null,
    timeout_seconds: numberValue(input.timeout_seconds) ?? fallback?.timeout_seconds ?? 1500,
    temperature: numberValue(input.temperature) ?? fallback?.temperature ?? null,
    num_ctx: numberValue(input.num_ctx) ?? fallback?.num_ctx ?? null,
    allowed_tools: mergeStringList(arrayOfStrings(input.allowed_tools), fallback?.allowed_tools ?? []),
    permission_mode: stringValue(input.permission_mode) || fallback?.permission_mode || null,
    model_presets: mergeModelPresets(model, arrayOfStrings(input.model_presets), fallback?.model_presets ?? []),
    description: stringValue(input.description) || fallback?.description || null,
  };
}

function agentLabel(provider: ModelProvider): string {
  if (provider.type === "claude-code") return "claude-cli";
  if (provider.type === "ollama") return "ollama-http";
  if (provider.type === "local-openai") return "openai-compatible-http";
  if (provider.type === "codex") return "codex-cli";
  return provider.command ? `${provider.command}-cli` : provider.type;
}

async function readProjectOverride(filePath: string): Promise<BrandTaskModelOverride | null> {
  const raw = await readJson(filePath);
  const providerId = stringValue(raw.provider_id);
  const model = stringValue(raw.model);
  if (!providerId || !model) return null;
  return {
    provider_id: providerId,
    model,
    updated_at: stringValue(raw.updated_at) || "",
  };
}

async function readJson(filePath: string): Promise<JsonRecord> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as JsonRecord;
  } catch {
    return {};
  }
}

function defaultProvider(): ModelProvider {
  return defaultProviderFor(DEFAULT_PROVIDER_ID) ?? normalizeProvider(DEFAULT_PROVIDER_ID, {});
}

function defaultProviders(): Record<string, ModelProvider> {
  return Object.fromEntries(
    Object.entries(DEFAULT_MODEL_PROVIDERS).map(([id, provider]) => [id, cloneProvider(provider)])
  );
}

function defaultProviderFor(id: string): ModelProvider | null {
  const provider = DEFAULT_MODEL_PROVIDERS[id];
  return provider ? cloneProvider(provider) : null;
}

function cloneProvider(provider: ModelProvider): ModelProvider {
  return {
    ...provider,
    allowed_tools: [...provider.allowed_tools],
    model_presets: [...provider.model_presets],
  };
}

function mergeModelPresets(model: string, configured: string[], fallback: string[]): string[] {
  return mergeStringList([model, ...configured], fallback);
}

function mergeStringList(configured: string[], fallback: string[]): string[] {
  return Array.from(new Set([...configured, ...fallback].filter((item) => item.trim().length > 0)));
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function titleCase(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
