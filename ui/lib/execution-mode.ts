// Execution mode backend: local CLI detection + BYOK provider registry.
//
// Ported from open-design's daemon/agents.js (AGENT_DEFS, PATH scan,
// --version probe, live model listing with fallback, liveModelCache,
// isKnownModel, sanitizeCustomModel) and adapted to Next.js route handlers.
//
// Server-side only — uses child_process / fs / os. Import exclusively from
// route handlers or server components.

import { execFile } from "child_process";
import { existsSync, promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileP = promisify(execFile);

export interface ModelOption {
  id: string;
  label: string;
}

export const DEFAULT_MODEL_OPTION: ModelOption = {
  id: "default",
  label: "Default (CLI config)",
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

// Parse one-id-per-line stdout from `<cli> models` and prepend the synthetic
// default option. Used by opencode / cursor-agent. (Port of open-design's
// parseLineSeparatedModels.)
export function parseLineSeparatedModels(stdout: string): ModelOption[] {
  const ids = String(stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  const seen = new Set<string>();
  const out: ModelOption[] = [DEFAULT_MODEL_OPTION];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label: id });
  }
  return out;
}

// Permit user-typed model ids that didn't appear in either the live listing
// or the static fallback. The value is passed as a child-process argv element
// (never a shell string) so injection isn't a concern, but we still reject
// anything that could be misread as a flag by a downstream CLI or that
// contains whitespace / control chars. (Port of open-design's
// sanitizeCustomModel.)
export function sanitizeCustomModel(id: unknown): string | null {
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > 200) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._/:@-]*$/.test(trimmed)) return null;
  return trimmed;
}

// API responses never include full keys: mask to the last 4 characters.
export function maskKey(key: unknown): string | null {
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length <= 4) return "…" + trimmed;
  return "…" + trimmed.slice(-4);
}

interface RawModelEntry {
  id: string;
  label: string;
  created: number | null;
}

// Sort newest-first by created timestamp when the API provides one;
// entries without timestamps keep their original relative order at the end.
export function sortModelsNewestFirst(entries: RawModelEntry[]): ModelOption[] {
  const withCreated = entries.filter((entry) => entry.created !== null);
  const withoutCreated = entries.filter((entry) => entry.created === null);
  withCreated.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
  return [...withCreated, ...withoutCreated].map(({ id, label }) => ({ id, label }));
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function entryString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function entryCreated(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed / 1000;
  }
  return null;
}

// OpenAI-compatible `GET /v1/models` body: { data: [{ id, created }] }.
// Anthropic uses the same shape with display_name + created_at.
export function parseOpenAiCompatibleModels(json: unknown): ModelOption[] | null {
  const record = json as { data?: unknown } | null;
  const data = asArray(record?.data);
  const entries: RawModelEntry[] = [];
  for (const item of data) {
    const row = item as Record<string, unknown>;
    const id = entryString(row?.id);
    if (!id) continue;
    const label = entryString(row?.display_name) ?? id;
    const created = entryCreated(row?.created) ?? entryCreated(row?.created_at);
    entries.push({ id, label: label === id ? id : `${label} (${id})`, created });
  }
  if (entries.length === 0) return null;
  return sortModelsNewestFirst(entries);
}

// Google Generative Language `GET /v1beta/models?key=` body:
// { models: [{ name: "models/gemini-...", displayName }] }.
export function parseGoogleModels(json: unknown): ModelOption[] | null {
  const record = json as { models?: unknown } | null;
  const models = asArray(record?.models);
  const entries: RawModelEntry[] = [];
  for (const item of models) {
    const row = item as Record<string, unknown>;
    const name = entryString(row?.name);
    if (!name) continue;
    const id = name.startsWith("models/") ? name.slice("models/".length) : name;
    entries.push({ id, label: id, created: null });
  }
  if (entries.length === 0) return null;
  return sortModelsNewestFirst(entries);
}

// Ollama `GET /api/tags` body: { models: [{ name, modified_at }] }.
export function parseOllamaTags(json: unknown): ModelOption[] | null {
  const record = json as { models?: unknown } | null;
  const models = asArray(record?.models);
  const entries: RawModelEntry[] = [];
  for (const item of models) {
    const row = item as Record<string, unknown>;
    const name = entryString(row?.name);
    if (!name) continue;
    entries.push({ id: name, label: name, created: entryCreated(row?.modified_at) });
  }
  if (entries.length === 0) return null;
  return sortModelsNewestFirst(entries);
}

// ---------------------------------------------------------------------------
// CLI registry
// ---------------------------------------------------------------------------

export interface CliDef {
  id: string;
  name: string;
  subtitle: string;
  bin: string;
  versionArgs: string[];
  badges: string[];
  docs: string;
  listModels?: {
    args: string[];
    timeoutMs: number;
    parse: (stdout: string) => ModelOption[] | null;
  };
  fallbackModels: ModelOption[];
  // argv for a trivial non-interactive prompt. `model` is pre-sanitized;
  // null means "use the CLI's default model" (no --model flag).
  buildTestArgs: (prompt: string, model: string | null) => string[];
}

export const CLI_DEFS: CliDef[] = [
  {
    id: "claude",
    name: "Claude Code",
    subtitle: "Anthropic official CLI",
    bin: "claude",
    versionArgs: ["--version"],
    badges: ["Official"],
    docs: "https://docs.anthropic.com/en/docs/claude-code",
    // No list-models subcommand; the CLI accepts short aliases and full ids.
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: "sonnet", label: "Sonnet (alias)" },
      { id: "opus", label: "Opus (alias)" },
      { id: "haiku", label: "Haiku (alias)" },
      { id: "claude-opus-4-5", label: "claude-opus-4-5" },
      { id: "claude-sonnet-4-5", label: "claude-sonnet-4-5" },
      { id: "claude-haiku-4-5", label: "claude-haiku-4-5" },
    ],
    buildTestArgs: (prompt, model) => {
      const args = ["-p", prompt, "--output-format", "text"];
      if (model) args.push("--model", model);
      return args;
    },
  },
  {
    id: "codex",
    name: "Codex CLI",
    subtitle: "OpenAI coding agent",
    bin: "codex",
    versionArgs: ["--version"],
    badges: ["Official"],
    docs: "https://developers.openai.com/codex/cli",
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: "gpt-5.5", label: "gpt-5.5" },
      { id: "gpt-5.4", label: "gpt-5.4" },
      { id: "gpt-5.4-mini", label: "gpt-5.4-mini" },
      { id: "gpt-5-codex", label: "gpt-5-codex" },
    ],
    buildTestArgs: (prompt, model) => {
      const args = ["exec", "--skip-git-repo-check"];
      if (model) args.push("--model", model);
      args.push(prompt);
      return args;
    },
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    subtitle: "Google official CLI",
    bin: "gemini",
    versionArgs: ["--version"],
    badges: ["Official"],
    docs: "https://github.com/google-gemini/gemini-cli",
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: "gemini-3-pro-preview", label: "gemini-3-pro-preview" },
      { id: "gemini-2.5-pro", label: "gemini-2.5-pro" },
      { id: "gemini-2.5-flash", label: "gemini-2.5-flash" },
    ],
    buildTestArgs: (prompt, model) => {
      const args = ["-p", prompt];
      if (model) args.push("--model", model);
      return args;
    },
  },
  {
    id: "opencode",
    name: "OpenCode",
    subtitle: "Open-source multi-provider agent",
    bin: "opencode",
    versionArgs: ["--version"],
    badges: ["Open source"],
    docs: "https://opencode.ai/docs",
    // `opencode models` prints `provider/model` per line.
    listModels: {
      args: ["models"],
      timeoutMs: 8000,
      parse: parseLineSeparatedModels,
    },
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: "anthropic/claude-sonnet-4-5", label: "anthropic/claude-sonnet-4-5" },
      { id: "openai/gpt-5.5", label: "openai/gpt-5.5" },
      { id: "google/gemini-2.5-pro", label: "google/gemini-2.5-pro" },
    ],
    buildTestArgs: (prompt, model) => {
      const args = ["run"];
      if (model) args.push("--model", model);
      args.push(prompt);
      return args;
    },
  },
  {
    id: "cursor-agent",
    name: "Cursor Agent",
    subtitle: "Cursor headless agent",
    bin: "cursor-agent",
    versionArgs: ["--version"],
    badges: ["Official"],
    docs: "https://docs.cursor.com/en/cli/overview",
    // `cursor-agent models` prints account-bound model ids per line. When the
    // user isn't authed it prints "No models available for this account."
    listModels: {
      args: ["models"],
      timeoutMs: 5000,
      parse: (stdout) => {
        const trimmed = String(stdout || "").trim();
        if (!trimmed || /no models available/i.test(trimmed)) return null;
        return parseLineSeparatedModels(trimmed);
      },
    },
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: "auto", label: "auto" },
      { id: "sonnet-4", label: "sonnet-4" },
      { id: "sonnet-4-thinking", label: "sonnet-4-thinking" },
      { id: "gpt-5", label: "gpt-5" },
    ],
    buildTestArgs: (prompt, model) => {
      const args = ["--print", prompt, "--output-format", "text"];
      if (model) args.push("--model", model);
      return args;
    },
  },
  {
    id: "kimi",
    name: "Kimi CLI",
    subtitle: "Moonshot AI agent",
    bin: "kimi",
    versionArgs: ["--version"],
    badges: ["Official"],
    docs: "https://github.com/MoonshotAI/kimi-cli",
    // TODO: open-design detects kimi models live over ACP JSON-RPC
    // (daemon/acp.js detectAcpModels — initialize / session/new handshake).
    // Porting the full stdio JSON-RPC client into a route handler is deferred;
    // we ship the static fallback list until then.
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: "kimi-code/kimi-for-coding", label: "kimi-code/kimi-for-coding" },
      { id: "kimi-k2-turbo-preview", label: "kimi-k2-turbo-preview" },
      { id: "kimi-k2-thinking", label: "kimi-k2-thinking" },
      { id: "moonshot-v1-32k", label: "moonshot-v1-32k" },
    ],
    buildTestArgs: (prompt, model) => {
      // --print is non-interactive and implicitly adds --yolo.
      const args = ["--print", "--prompt", prompt];
      if (model) args.push("--model", model);
      return args;
    },
  },
  {
    id: "qwen",
    name: "Qwen Code",
    subtitle: "Alibaba Qwen coding CLI",
    bin: "qwen",
    versionArgs: ["--version"],
    badges: ["Open source"],
    docs: "https://github.com/QwenLM/qwen-code",
    fallbackModels: [
      DEFAULT_MODEL_OPTION,
      { id: "qwen3-coder-plus", label: "qwen3-coder-plus" },
      { id: "qwen3-coder-flash", label: "qwen3-coder-flash" },
    ],
    // Qwen Code is a Gemini-CLI fork; same -p prompt flag.
    buildTestArgs: (prompt, model) => {
      const args = ["-p", prompt];
      if (model) args.push("--model", model);
      return args;
    },
  },
];

export function getCliDef(id: string): CliDef | null {
  return CLI_DEFS.find((def) => def.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// CLI detection
// ---------------------------------------------------------------------------

export interface DetectedCli {
  id: string;
  name: string;
  subtitle: string;
  bin: string;
  badges: string[];
  docs: string;
  available: boolean;
  path: string | null;
  version: string | null;
  models: ModelOption[];
  modelsSource: "live" | "fallback";
}

const COMMON_BIN_DIRS = [
  path.join(os.homedir(), ".local", "bin"),
  path.join(os.homedir(), "Library", "pnpm"),
  path.join(os.homedir(), "bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
];

let cachedPathDirs: string[] | null = null;

// The Next.js dev server often runs with a minimal PATH that misses
// ~/.local/bin, pnpm global bin, etc. A login shell sources the user's
// profile, so its $PATH is the authoritative search list. Cached for the
// process lifetime; a rescan re-reads it.
async function resolvePathDirs(refresh = false): Promise<string[]> {
  if (cachedPathDirs && !refresh) return cachedPathDirs;
  let loginPath = "";
  if (process.platform !== "win32") {
    const shell = process.env.SHELL || "/bin/zsh";
    try {
      const { stdout } = await execFileP(shell, ["-lc", 'printf "%s" "$PATH"'], {
        timeout: 8000,
      });
      loginPath = stdout.trim();
    } catch {
      // Login shell failed (broken profile, etc.) — fall back to process PATH.
    }
  }
  const dirs: string[] = [];
  const seen = new Set<string>();
  for (const segment of [loginPath, process.env.PATH || ""].join(path.delimiter).split(path.delimiter)) {
    const dir = segment.trim();
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    dirs.push(dir);
  }
  for (const dir of COMMON_BIN_DIRS) {
    if (!seen.has(dir)) {
      seen.add(dir);
      dirs.push(dir);
    }
  }
  cachedPathDirs = dirs;
  return dirs;
}

function resolveBin(bin: string, dirs: string[]): string | null {
  const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const dir of dirs) {
    for (const ext of exts) {
      const full = path.join(dir, bin + ext);
      try {
        if (existsSync(full)) return full;
      } catch {
        // Unreadable dir — skip.
      }
    }
  }
  return null;
}

function childEnv(dirs: string[]): NodeJS.ProcessEnv {
  return { ...process.env, PATH: dirs.join(path.delimiter) };
}

async function fetchCliModels(
  def: CliDef,
  resolvedBin: string,
  dirs: string[]
): Promise<{ models: ModelOption[]; source: "live" | "fallback" }> {
  if (!def.listModels) return { models: def.fallbackModels, source: "fallback" };
  try {
    const { stdout } = await execFileP(resolvedBin, def.listModels.args, {
      timeout: def.listModels.timeoutMs,
      // Model lists from popular CLIs (opencode) easily exceed the default
      // 1MB buffer once every openrouter model is included.
      maxBuffer: 8 * 1024 * 1024,
      env: childEnv(dirs),
    });
    const parsed = def.listModels.parse(stdout);
    if (!parsed || parsed.length === 0) {
      return { models: def.fallbackModels, source: "fallback" };
    }
    return { models: parsed, source: "live" };
  } catch {
    return { models: def.fallbackModels, source: "fallback" };
  }
}

async function probeCli(def: CliDef, dirs: string[]): Promise<DetectedCli> {
  const base = {
    id: def.id,
    name: def.name,
    subtitle: def.subtitle,
    bin: def.bin,
    badges: def.badges,
    docs: def.docs,
  };
  const resolved = resolveBin(def.bin, dirs);
  if (!resolved) {
    return {
      ...base,
      available: false,
      path: null,
      version: null,
      models: def.fallbackModels,
      modelsSource: "fallback",
    };
  }
  let version: string | null = null;
  try {
    const { stdout } = await execFileP(resolved, def.versionArgs, {
      timeout: 5000,
      env: childEnv(dirs),
    });
    version = stdout.trim().split("\n")[0] || null;
  } catch {
    // Binary exists but --version failed; still mark available.
  }
  const { models, source } = await fetchCliModels(def, resolved, dirs);
  return {
    ...base,
    available: true,
    path: resolved,
    version,
    models,
    modelsSource: source,
  };
}

let cliCache: DetectedCli[] | null = null;
let cliDetectInFlight: Promise<DetectedCli[]> | null = null;

// Validation cache: the test endpoint accepts any model the user could have
// just picked from a live listing, plus the static fallbacks, plus sanitized
// custom ids. (Port of open-design's liveModelCache / isKnownModel.)
const liveModelCache = new Map<string, Set<string>>();

export function rememberLiveModels(cliId: string, models: ModelOption[]): void {
  if (!Array.isArray(models)) return;
  liveModelCache.set(
    cliId,
    new Set(models.map((m) => m?.id).filter((id): id is string => typeof id === "string"))
  );
}

export function isKnownModel(def: CliDef, modelId: string): boolean {
  if (!modelId) return false;
  const live = liveModelCache.get(def.id);
  if (live && live.has(modelId)) return true;
  return def.fallbackModels.some((m) => m.id === modelId);
}

export async function detectClis(options: { rescan?: boolean } = {}): Promise<DetectedCli[]> {
  if (cliCache && !options.rescan) return cliCache;
  if (cliDetectInFlight && !options.rescan) return cliDetectInFlight;
  const run = (async () => {
    const dirs = await resolvePathDirs(options.rescan === true);
    const results = await Promise.all(CLI_DEFS.map((def) => probeCli(def, dirs)));
    for (const cli of results) rememberLiveModels(cli.id, cli.models);
    cliCache = results;
    return results;
  })();
  cliDetectInFlight = run;
  try {
    return await run;
  } finally {
    if (cliDetectInFlight === run) cliDetectInFlight = null;
  }
}

// ---------------------------------------------------------------------------
// CLI test prompt
// ---------------------------------------------------------------------------

const TEST_PROMPT = "Reply with OK";
const TEST_TIMEOUT_MS = 60_000;

export interface CliTestResult {
  ok: boolean;
  latencyMs: number;
  output?: string;
  error?: string;
}

export async function testCli(cliId: string, modelId?: string | null): Promise<CliTestResult> {
  const def = getCliDef(cliId);
  if (!def) return { ok: false, latencyMs: 0, error: `Unknown CLI: ${cliId}` };

  let model: string | null = null;
  if (modelId && modelId !== "default") {
    if (isKnownModel(def, modelId)) {
      model = modelId;
    } else {
      model = sanitizeCustomModel(modelId);
      if (!model) {
        return { ok: false, latencyMs: 0, error: `Invalid model id: ${String(modelId)}` };
      }
    }
  }

  const dirs = await resolvePathDirs();
  const resolved = resolveBin(def.bin, dirs);
  if (!resolved) {
    return { ok: false, latencyMs: 0, error: `${def.name} is not installed (no ${def.bin} on PATH)` };
  }

  const args = def.buildTestArgs(TEST_PROMPT, model);
  const startedAt = Date.now();
  try {
    const { stdout } = await execFileP(resolved, args, {
      timeout: TEST_TIMEOUT_MS,
      maxBuffer: 4 * 1024 * 1024,
      env: childEnv(dirs),
    });
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      output: stdout.trim().slice(0, 2000),
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stderr?: string; killed?: boolean };
    const stderr = typeof err.stderr === "string" ? err.stderr.trim().slice(0, 2000) : "";
    const reason = err.killed
      ? `Timed out after ${TEST_TIMEOUT_MS / 1000}s`
      : stderr || err.message || "CLI exited with an error";
    return { ok: false, latencyMs: Date.now() - startedAt, error: reason };
  }
}

// ---------------------------------------------------------------------------
// BYOK provider registry
// ---------------------------------------------------------------------------

export interface ByokProviderDef {
  id: string;
  label: string;
  subtitle: string;
  keyEnvVar: string | null;
  docs: string;
  endpoint: {
    url: string;
    auth: "bearer" | "x-api-key" | "query-key" | "none";
    extraHeaders?: Record<string, string>;
  } | null;
  // Minimal chat-completion endpoint used by the connectivity test.
  // `kind` selects the request/response shape; google's URL embeds {model}.
  // `altUrls` are tried in order when the primary URL rejects the key — e.g.
  // Z.ai GLM Coding Plan keys only work on the /api/coding/ endpoint.
  chat: {
    url: string;
    altUrls?: string[];
    kind: "anthropic" | "openai-compatible" | "google" | "ollama";
  } | null;
  parse: (json: unknown) => ModelOption[] | null;
  // Current-generation static hints; the live fetch is the source of truth.
  fallbackModels: ModelOption[];
}

export const BYOK_PROVIDERS: ByokProviderDef[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    subtitle: "Claude models via the Anthropic API",
    keyEnvVar: "ANTHROPIC_API_KEY",
    docs: "https://docs.anthropic.com/en/api/models-list",
    endpoint: {
      url: "https://api.anthropic.com/v1/models",
      auth: "x-api-key",
      extraHeaders: { "anthropic-version": "2023-06-01" },
    },
    chat: { url: "https://api.anthropic.com/v1/messages", kind: "anthropic" },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "claude-opus-4-8", label: "claude-opus-4-8" },
      { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
      { id: "claude-haiku-4-5", label: "claude-haiku-4-5" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    subtitle: "GPT models via the OpenAI API",
    keyEnvVar: "OPENAI_API_KEY",
    docs: "https://platform.openai.com/docs/api-reference/models",
    endpoint: { url: "https://api.openai.com/v1/models", auth: "bearer" },
    chat: { url: "https://api.openai.com/v1/chat/completions", kind: "openai-compatible" },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "gpt-5.5", label: "gpt-5.5" },
      { id: "gpt-5.4", label: "gpt-5.4" },
      { id: "gpt-5.4-mini", label: "gpt-5.4-mini" },
    ],
  },
  {
    id: "google",
    label: "Google",
    subtitle: "Gemini models via the Generative Language API",
    keyEnvVar: "GEMINI_API_KEY",
    docs: "https://ai.google.dev/api/models",
    endpoint: {
      url: "https://generativelanguage.googleapis.com/v1beta/models",
      auth: "query-key",
    },
    chat: {
      url: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
      kind: "google",
    },
    parse: parseGoogleModels,
    fallbackModels: [
      { id: "gemini-3-pro-preview", label: "gemini-3-pro-preview" },
      { id: "gemini-3.1-flash-image-preview", label: "gemini-3.1-flash-image-preview" },
      { id: "gemini-2.5-pro", label: "gemini-2.5-pro" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    subtitle: "Multi-provider routing API",
    keyEnvVar: "OPENROUTER_API_KEY",
    docs: "https://openrouter.ai/docs/api-reference/list-available-models",
    endpoint: { url: "https://openrouter.ai/api/v1/models", auth: "bearer" },
    chat: { url: "https://openrouter.ai/api/v1/chat/completions", kind: "openai-compatible" },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "anthropic/claude-sonnet-4.6", label: "anthropic/claude-sonnet-4.6" },
      { id: "openai/gpt-5.5", label: "openai/gpt-5.5" },
      { id: "google/gemini-3-pro-preview", label: "google/gemini-3-pro-preview" },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    subtitle: "DeepSeek chat and reasoner models",
    keyEnvVar: "DEEPSEEK_API_KEY",
    docs: "https://api-docs.deepseek.com/api/list-models",
    endpoint: { url: "https://api.deepseek.com/v1/models", auth: "bearer" },
    chat: { url: "https://api.deepseek.com/v1/chat/completions", kind: "openai-compatible" },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "deepseek-chat", label: "deepseek-chat" },
      { id: "deepseek-reasoner", label: "deepseek-reasoner" },
    ],
  },
  {
    id: "moonshot",
    label: "Moonshot (Kimi)",
    subtitle: "Kimi models via the Moonshot API",
    keyEnvVar: "MOONSHOT_API_KEY",
    docs: "https://platform.moonshot.ai/docs/api/chat",
    endpoint: { url: "https://api.moonshot.ai/v1/models", auth: "bearer" },
    chat: { url: "https://api.moonshot.ai/v1/chat/completions", kind: "openai-compatible" },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "kimi-k2-thinking", label: "kimi-k2-thinking" },
      { id: "kimi-k2-turbo-preview", label: "kimi-k2-turbo-preview" },
      { id: "moonshot-v1-32k", label: "moonshot-v1-32k" },
    ],
  },
  {
    id: "minimax",
    label: "MiniMax",
    subtitle: "MiniMax M-series models",
    keyEnvVar: "MINIMAX_API_KEY",
    docs: "https://platform.minimax.io/docs",
    endpoint: { url: "https://api.minimax.io/v1/models", auth: "bearer" },
    chat: { url: "https://api.minimax.io/v1/chat/completions", kind: "openai-compatible" },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "MiniMax-M2.7", label: "MiniMax-M2.7" },
      { id: "MiniMax-M2.5", label: "MiniMax-M2.5" },
      { id: "MiniMax-M2.1", label: "MiniMax-M2.1" },
    ],
  },
  {
    id: "zai",
    label: "Z.ai (GLM)",
    subtitle: "GLM models via the Z.ai API",
    keyEnvVar: "ZAI_API_KEY",
    docs: "https://docs.z.ai/guides/llm/glm-4.7",
    endpoint: { url: "https://api.z.ai/api/paas/v4/models", auth: "bearer" },
    chat: {
      url: "https://api.z.ai/api/paas/v4/chat/completions",
      // GLM Coding Plan subscriptions are only billed on the coding endpoint;
      // the general paas endpoint answers 429 "insufficient balance" for them.
      altUrls: ["https://api.z.ai/api/coding/paas/v4/chat/completions"],
      kind: "openai-compatible",
    },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "glm-5.1", label: "glm-5.1" },
      { id: "glm-5-turbo", label: "glm-5-turbo" },
      { id: "glm-4.7", label: "glm-4.7" },
    ],
  },
  {
    id: "xai",
    label: "xAI",
    subtitle: "Grok models via the xAI API",
    keyEnvVar: "XAI_API_KEY",
    docs: "https://docs.x.ai/docs/api-reference#list-models",
    endpoint: { url: "https://api.x.ai/v1/models", auth: "bearer" },
    chat: { url: "https://api.x.ai/v1/chat/completions", kind: "openai-compatible" },
    parse: parseOpenAiCompatibleModels,
    fallbackModels: [
      { id: "grok-4", label: "grok-4" },
      { id: "grok-4-fast", label: "grok-4-fast" },
      { id: "grok-3", label: "grok-3" },
    ],
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    subtitle: "Local models, no API key required",
    keyEnvVar: null,
    docs: "https://github.com/ollama/ollama/blob/main/docs/api.md",
    endpoint: { url: "http://127.0.0.1:11434/api/tags", auth: "none" },
    chat: { url: "http://127.0.0.1:11434/api/chat", kind: "ollama" },
    parse: parseOllamaTags,
    fallbackModels: [
      { id: "qwen3.5:35b-a3b", label: "qwen3.5:35b-a3b" },
      { id: "qwen3.5:9b", label: "qwen3.5:9b" },
      { id: "qwen3-vl:32b", label: "qwen3-vl:32b" },
    ],
  },
];

export function getByokProviderDef(id: string): ByokProviderDef | null {
  return BYOK_PROVIDERS.find((def) => def.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// BYOK key storage (~/.claude/design-library/settings/byok.json, chmod 600)
// ---------------------------------------------------------------------------

const BYOK_STORE_PATH = path.join(
  os.homedir(),
  ".claude",
  "design-library",
  "settings",
  "byok.json"
);

interface ByokStoreEntry {
  api_key?: string;
  updated_at?: string;
}

interface ByokStore {
  version: number;
  providers: Record<string, ByokStoreEntry>;
}

async function readByokStore(): Promise<ByokStore> {
  try {
    const raw = JSON.parse(await fs.readFile(BYOK_STORE_PATH, "utf-8")) as Partial<ByokStore>;
    const providers =
      raw && typeof raw.providers === "object" && raw.providers !== null && !Array.isArray(raw.providers)
        ? (raw.providers as Record<string, ByokStoreEntry>)
        : {};
    return { version: typeof raw?.version === "number" ? raw.version : 1, providers };
  } catch {
    return { version: 1, providers: {} };
  }
}

async function writeByokStore(store: ByokStore): Promise<void> {
  await fs.mkdir(path.dirname(BYOK_STORE_PATH), { recursive: true });
  await fs.writeFile(BYOK_STORE_PATH, JSON.stringify(store, null, 2), { encoding: "utf-8", mode: 0o600 });
  // writeFile's mode only applies on create; enforce it for pre-existing files.
  await fs.chmod(BYOK_STORE_PATH, 0o600);
}

// ---------------------------------------------------------------------------
// Environment key discovery (process.env + login-shell fallback)
// ---------------------------------------------------------------------------

// Some providers accept more than one well-known env var name; the first hit
// wins. Every name here is a fixed allowlist entry — these strings are the
// only ones ever passed to the login shell, so there is no injection surface.
const ENV_VAR_CANDIDATES: Record<string, string[]> = {
  anthropic: ["ANTHROPIC_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  google: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
  moonshot: ["MOONSHOT_API_KEY"],
  minimax: ["MINIMAX_API_KEY"],
  zai: ["ZAI_API_KEY"],
  xai: ["XAI_API_KEY"],
};

export function envVarCandidatesFor(providerId: string): string[] {
  return ENV_VAR_CANDIDATES[providerId] ?? [];
}

const ALLOWED_ENV_VARS = new Set(Object.values(ENV_VAR_CANDIDATES).flat());

// The Next dev server often runs without the user's login-shell environment,
// so process.env misses keys exported from ~/.zshrc. Fall back to printenv in
// a login shell. Values are cached per process; never logged.
const loginEnvCache = new Map<string, string | null>();

async function readEnvVar(varName: string): Promise<string | null> {
  if (!ALLOWED_ENV_VARS.has(varName) || !/^[A-Z][A-Z0-9_]*$/.test(varName)) return null;
  const direct = process.env[varName];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (loginEnvCache.has(varName)) return loginEnvCache.get(varName) ?? null;
  let value: string | null = null;
  if (process.platform !== "win32") {
    const shell = process.env.SHELL || "/bin/zsh";
    try {
      // varName comes from the fixed allowlist above — not user input.
      const { stdout } = await execFileP(shell, ["-lc", `printenv ${varName}`], {
        timeout: 8000,
      });
      const trimmed = stdout.replace(/\n+$/, "").trim();
      if (trimmed) value = trimmed;
    } catch {
      // printenv exits 1 when unset; broken profiles also land here.
    }
  }
  loginEnvCache.set(varName, value);
  return value;
}

// First env var (allowlisted) that holds a non-empty value for this provider.
async function readProviderEnvKey(
  providerId: string
): Promise<{ varName: string; value: string } | null> {
  for (const varName of envVarCandidatesFor(providerId)) {
    const value = await readEnvVar(varName);
    if (value) return { varName, value };
  }
  return null;
}

export interface EnvKeyAvailability {
  available: boolean;
  varName: string | null;
}

// Availability flag for the UI ("Import from environment"). Never the value.
export async function getEnvKeyAvailability(providerId: string): Promise<EnvKeyAvailability> {
  const hit = await readProviderEnvKey(providerId);
  return { available: hit !== null, varName: hit?.varName ?? null };
}

// Copy the env key into the persistent store (byok.json, 0600).
export async function importByokKeyFromEnv(providerId: string): Promise<ByokKeyState> {
  const def = getByokProviderDef(providerId);
  if (!def) throw new Error(`Unknown BYOK provider: ${providerId}`);
  const hit = await readProviderEnvKey(providerId);
  if (!hit) {
    throw new Error(
      `No environment key found for ${def.label} (checked ${envVarCandidatesFor(providerId).join(", ") || "no vars"})`
    );
  }
  return setByokKey(providerId, hit.value);
}

// Effective key: stored value wins, then environment (incl. login shell).
async function readStoredKey(providerId: string): Promise<string | null> {
  const store = await readByokStore();
  const key = store.providers[providerId]?.api_key;
  if (typeof key === "string" && key.trim()) return key.trim();
  const hit = await readProviderEnvKey(providerId);
  return hit?.value ?? null;
}

export interface ByokKeyState {
  providerId: string;
  hasKey: boolean;
  maskedKey: string | null;
  keySource: "stored" | "environment" | null;
}

// Masked key state for the UI. NEVER returns the full key.
export async function getByokKeyState(providerId: string): Promise<ByokKeyState> {
  const store = await readByokStore();
  const stored = store.providers[providerId]?.api_key;
  if (typeof stored === "string" && stored.trim()) {
    return {
      providerId,
      hasKey: true,
      maskedKey: maskKey(stored),
      keySource: "stored",
    };
  }
  const def = getByokProviderDef(providerId);
  const envKey = def?.keyEnvVar ? process.env[def.keyEnvVar] : undefined;
  if (typeof envKey === "string" && envKey.trim()) {
    return {
      providerId,
      hasKey: true,
      maskedKey: maskKey(envKey),
      keySource: "environment",
    };
  }
  return { providerId, hasKey: false, maskedKey: null, keySource: null };
}

// Set (string) or clear (null) the stored key for a provider.
export async function setByokKey(providerId: string, apiKey: string | null): Promise<ByokKeyState> {
  const def = getByokProviderDef(providerId);
  if (!def) throw new Error(`Unknown BYOK provider: ${providerId}`);
  const store = await readByokStore();
  if (apiKey === null) {
    delete store.providers[providerId];
  } else {
    const trimmed = apiKey.trim();
    if (!trimmed) throw new Error("API key must not be empty");
    if (/[\r\n\0]/.test(trimmed) || trimmed.length > 4096) {
      throw new Error("API key contains invalid characters");
    }
    store.providers[providerId] = {
      api_key: trimmed,
      updated_at: new Date().toISOString(),
    };
  }
  await writeByokStore(store);
  byokModelCache.delete(providerId);
  return getByokKeyState(providerId);
}

// ---------------------------------------------------------------------------
// BYOK live model fetch
// ---------------------------------------------------------------------------

export interface ByokModelsResult {
  providerId: string;
  models: ModelOption[];
  source: "live" | "fallback";
  error: string | null;
}

const BYOK_FETCH_TIMEOUT_MS = 8000;
const byokModelCache = new Map<string, ByokModelsResult>();

export async function fetchByokModels(
  providerId: string,
  options: { refresh?: boolean } = {}
): Promise<ByokModelsResult> {
  const def = getByokProviderDef(providerId);
  if (!def) {
    return {
      providerId,
      models: [],
      source: "fallback",
      error: `Unknown BYOK provider: ${providerId}`,
    };
  }
  const cached = byokModelCache.get(providerId);
  if (cached && cached.source === "live" && !options.refresh) return cached;

  const fallback: ByokModelsResult = {
    providerId,
    models: def.fallbackModels,
    source: "fallback",
    error: null,
  };
  if (!def.endpoint) return fallback;

  const key = await readStoredKey(providerId);
  if (def.endpoint.auth !== "none" && !key) {
    return { ...fallback, error: "No API key configured; showing static list" };
  }

  let url = def.endpoint.url;
  const headers: Record<string, string> = { ...(def.endpoint.extraHeaders ?? {}) };
  if (def.endpoint.auth === "bearer" && key) headers.Authorization = `Bearer ${key}`;
  if (def.endpoint.auth === "x-api-key" && key) headers["x-api-key"] = key;
  if (def.endpoint.auth === "query-key" && key) {
    url += (url.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(key);
  }

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(BYOK_FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      // Do not echo response bodies — they can quote the (invalid) key.
      return { ...fallback, error: `HTTP ${response.status} from ${def.label} models endpoint` };
    }
    const json = (await response.json()) as unknown;
    const models = def.parse(json);
    if (!models || models.length === 0) {
      return { ...fallback, error: `Empty model list from ${def.label}` };
    }
    const result: ByokModelsResult = { providerId, models, source: "live", error: null };
    byokModelCache.set(providerId, result);
    return result;
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? `Timed out after ${BYOK_FETCH_TIMEOUT_MS / 1000}s`
        : error instanceof Error
          ? error.message
          : "Model fetch failed";
    return { ...fallback, error: message };
  }
}

// ---------------------------------------------------------------------------
// BYOK connectivity test (one tiny chat completion per provider)
// ---------------------------------------------------------------------------

const BYOK_TEST_PROMPT = "Reply with OK";
const BYOK_TEST_TIMEOUT_MS = 30_000;
// Reasoning models (glm-5.1, kimi-k2-thinking, ...) burn output tokens on
// hidden reasoning before the visible reply; a tiny cap yields an empty
// content field with finish_reason "length".
const BYOK_TEST_MAX_TOKENS = 512;

// Provider error bodies can quote the credential that was sent (e.g. on a
// 401). Strip every occurrence before the text can reach a response or log.
export function scrubSecret(text: string, secret: string | null): string {
  if (!secret || secret.length < 4) return text;
  return text.split(secret).join("***");
}

export interface ByokTestResult {
  ok: boolean;
  latencyMs: number;
  model: string | null;
  output?: string;
  error?: string;
}

function buildChatRequest(
  kind: NonNullable<ByokProviderDef["chat"]>["kind"],
  baseUrl: string,
  model: string,
  key: string | null
): { url: string; headers: Record<string, string>; body: Record<string, unknown> } {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  switch (kind) {
    case "anthropic":
      if (key) headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
      return {
        url: baseUrl,
        headers,
        body: {
          model,
          max_tokens: BYOK_TEST_MAX_TOKENS,
          messages: [{ role: "user", content: BYOK_TEST_PROMPT }],
        },
      };
    case "google": {
      let url = baseUrl.replace("{model}", encodeURIComponent(model));
      if (key) url += (url.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(key);
      return {
        url,
        headers,
        body: {
          contents: [{ parts: [{ text: BYOK_TEST_PROMPT }] }],
          generationConfig: { maxOutputTokens: BYOK_TEST_MAX_TOKENS },
        },
      };
    }
    case "ollama":
      return {
        url: baseUrl,
        headers,
        body: {
          model,
          stream: false,
          messages: [{ role: "user", content: BYOK_TEST_PROMPT }],
        },
      };
    default:
      // openai-compatible (openai, openrouter, deepseek, moonshot, minimax,
      // zai, xai)
      if (key) headers.Authorization = `Bearer ${key}`;
      return {
        url: baseUrl,
        headers,
        body: {
          model,
          max_tokens: BYOK_TEST_MAX_TOKENS,
          messages: [{ role: "user", content: BYOK_TEST_PROMPT }],
        },
      };
  }
}

// Pull the assistant text out of the provider-specific response shape.
// Returns null when the shape is unrecognized.
export function parseChatOutput(
  kind: NonNullable<ByokProviderDef["chat"]>["kind"],
  json: unknown
): string | null {
  const root = json as Record<string, unknown> | null;
  if (!root || typeof root !== "object") return null;
  if (kind === "anthropic") {
    const content = asArray(root.content);
    const texts = content
      .map((block) => entryString((block as Record<string, unknown>)?.text))
      .filter((text): text is string => text !== null);
    return texts.length > 0 ? texts.join(" ") : null;
  }
  if (kind === "google") {
    const candidate = asArray(root.candidates)[0] as Record<string, unknown> | undefined;
    const content = candidate?.content as Record<string, unknown> | undefined;
    const texts = asArray(content?.parts)
      .map((part) => entryString((part as Record<string, unknown>)?.text))
      .filter((text): text is string => text !== null);
    return texts.length > 0 ? texts.join(" ") : null;
  }
  if (kind === "ollama") {
    const message = root.message as Record<string, unknown> | undefined;
    return entryString(message?.content);
  }
  // openai-compatible
  const choice = asArray(root.choices)[0] as Record<string, unknown> | undefined;
  const message = choice?.message as Record<string, unknown> | undefined;
  return entryString(message?.content);
}

// Some OpenAI-compatible APIs (MiniMax) report failures inside an HTTP 200
// body via base_resp. Returns an error string or null.
export function chatBodyError(json: unknown): string | null {
  const root = json as Record<string, unknown> | null;
  if (!root || typeof root !== "object") return null;
  const baseResp = root.base_resp as Record<string, unknown> | undefined;
  if (baseResp && typeof baseResp.status_code === "number" && baseResp.status_code !== 0) {
    return entryString(baseResp.status_msg) ?? `Provider error ${baseResp.status_code}`;
  }
  const error = root.error as Record<string, unknown> | string | undefined;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    return entryString(error.message) ?? "Provider returned an error";
  }
  return null;
}

export async function testByokProvider(
  providerId: string,
  modelId?: string | null
): Promise<ByokTestResult> {
  const def = getByokProviderDef(providerId);
  if (!def || !def.chat) {
    return { ok: false, latencyMs: 0, model: null, error: `Unknown BYOK provider: ${providerId}` };
  }

  let model: string | null = null;
  if (modelId && modelId !== "default") {
    model = sanitizeCustomModel(modelId);
    if (!model) {
      return { ok: false, latencyMs: 0, model: null, error: `Invalid model id: ${String(modelId)}` };
    }
  }
  if (!model) model = def.fallbackModels[0]?.id ?? null;
  if (!model) {
    return { ok: false, latencyMs: 0, model: null, error: `No model available for ${def.label}` };
  }

  const requiresKey = def.endpoint?.auth !== "none";
  const key = await readStoredKey(providerId);
  if (requiresKey && !key) {
    return {
      ok: false,
      latencyMs: 0,
      model,
      error: `No API key configured for ${def.label}`,
    };
  }

  // Try the primary endpoint, then any alternates (e.g. Z.ai's coding-plan
  // endpoint). The first success wins; otherwise the last failure is returned.
  const urls = [def.chat.url, ...(def.chat.altUrls ?? [])];
  let lastFailure: ByokTestResult | null = null;
  for (const baseUrl of urls) {
    const { url, headers, body } = buildChatRequest(
      def.chat.kind,
      baseUrl,
      model,
      requiresKey ? key : null
    );
    const startedAt = Date.now();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(BYOK_TEST_TIMEOUT_MS),
        cache: "no-store",
      });
      const latencyMs = Date.now() - startedAt;
      const text = await response.text();
      if (!response.ok) {
        const detail = scrubSecret(text.slice(0, 300), key);
        lastFailure = {
          ok: false,
          latencyMs,
          model,
          error: `HTTP ${response.status} from ${def.label}${detail ? ` — ${detail}` : ""}`,
        };
        continue;
      }
      let json: unknown = null;
      try {
        json = JSON.parse(text);
      } catch {
        lastFailure = { ok: false, latencyMs, model, error: `Non-JSON response from ${def.label}` };
        continue;
      }
      const bodyError = chatBodyError(json);
      if (bodyError) {
        lastFailure = {
          ok: false,
          latencyMs,
          model,
          error: scrubSecret(bodyError.slice(0, 300), key),
        };
        continue;
      }
      const output = parseChatOutput(def.chat.kind, json);
      if (output === null) {
        lastFailure = {
          ok: false,
          latencyMs,
          model,
          error: `Unexpected response shape from ${def.label}`,
        };
        continue;
      }
      return { ok: true, latencyMs, model, output: scrubSecret(output.slice(0, 500), key) };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const message =
        error instanceof Error && error.name === "TimeoutError"
          ? `Timed out after ${BYOK_TEST_TIMEOUT_MS / 1000}s`
          : error instanceof Error
            ? error.message
            : "Connectivity test failed";
      lastFailure = { ok: false, latencyMs, model, error: scrubSecret(message, key) };
    }
  }
  return (
    lastFailure ?? { ok: false, latencyMs: 0, model, error: `No endpoint configured for ${def.label}` }
  );
}
