// Pure-function tests for the execution-mode module and the model-settings
// v2 migration. Run with: npm test (node --test, Node >= 22.6 type stripping).
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BYOK_PROVIDERS,
  DEFAULT_MODEL_OPTION,
  chatBodyError,
  envVarCandidatesFor,
  getCliDef,
  maskKey,
  parseChatOutput,
  parseGoogleModels,
  parseLineSeparatedModels,
  parseOllamaTags,
  parseOpenAiCompatibleModels,
  sanitizeCustomModel,
  scrubSecret,
  sortModelsNewestFirst,
} from "../execution-mode.ts";
import { normalizeExecutionSettings } from "../model-settings.ts";

test("parseLineSeparatedModels prepends default, dedupes, skips comments", () => {
  const models = parseLineSeparatedModels(
    "anthropic/claude-sonnet-4-5\n# comment\n\nopenai/gpt-5.5\nanthropic/claude-sonnet-4-5\n"
  );
  assert.deepEqual(models, [
    DEFAULT_MODEL_OPTION,
    { id: "anthropic/claude-sonnet-4-5", label: "anthropic/claude-sonnet-4-5" },
    { id: "openai/gpt-5.5", label: "openai/gpt-5.5" },
  ]);
});

test("parseLineSeparatedModels on empty stdout yields only the default option", () => {
  assert.deepEqual(parseLineSeparatedModels(""), [DEFAULT_MODEL_OPTION]);
});

test("cursor-agent listModels parse rejects the not-authed message", () => {
  const def = getCliDef("cursor-agent");
  assert.ok(def?.listModels);
  assert.equal(def!.listModels!.parse("No models available for this account."), null);
  assert.equal(def!.listModels!.parse("   "), null);
  const parsed = def!.listModels!.parse("auto\nsonnet-4");
  assert.deepEqual(parsed, [
    DEFAULT_MODEL_OPTION,
    { id: "auto", label: "auto" },
    { id: "sonnet-4", label: "sonnet-4" },
  ]);
});

test("sanitizeCustomModel accepts normal ids and rejects hostile input", () => {
  assert.equal(sanitizeCustomModel("claude-sonnet-4-6"), "claude-sonnet-4-6");
  assert.equal(sanitizeCustomModel("  openai/gpt-5.5  "), "openai/gpt-5.5");
  assert.equal(sanitizeCustomModel("qwen3.5:35b-a3b"), "qwen3.5:35b-a3b");
  assert.equal(sanitizeCustomModel("--model=evil"), null); // flag-shaped
  assert.equal(sanitizeCustomModel("-p"), null);
  assert.equal(sanitizeCustomModel("a b"), null); // whitespace
  assert.equal(sanitizeCustomModel(""), null);
  assert.equal(sanitizeCustomModel("x".repeat(201)), null);
  assert.equal(sanitizeCustomModel(42), null);
  assert.equal(sanitizeCustomModel("model;rm -rf"), null);
});

test("maskKey never reveals more than the last 4 characters", () => {
  assert.equal(maskKey("sk-ant-api03-abcdefgh1234"), "…1234");
  assert.equal(maskKey("abcd"), "…abcd");
  assert.equal(maskKey("  "), null);
  assert.equal(maskKey(undefined), null);
});

test("sortModelsNewestFirst orders by created desc, undated last", () => {
  const sorted = sortModelsNewestFirst([
    { id: "old", label: "old", created: 100 },
    { id: "undated", label: "undated", created: null },
    { id: "new", label: "new", created: 300 },
  ]);
  assert.deepEqual(
    sorted.map((m) => m.id),
    ["new", "old", "undated"]
  );
});

test("parseOpenAiCompatibleModels handles OpenAI created and Anthropic created_at", () => {
  const openai = parseOpenAiCompatibleModels({
    data: [
      { id: "gpt-5.4", created: 100 },
      { id: "gpt-5.5", created: 200 },
    ],
  });
  assert.deepEqual(openai?.map((m) => m.id), ["gpt-5.5", "gpt-5.4"]);

  const anthropic = parseOpenAiCompatibleModels({
    data: [
      {
        id: "claude-haiku-4-5",
        display_name: "Claude Haiku 4.5",
        created_at: "2025-10-01T00:00:00Z",
      },
      {
        id: "claude-sonnet-4-6",
        display_name: "Claude Sonnet 4.6",
        created_at: "2026-02-01T00:00:00Z",
      },
    ],
  });
  assert.deepEqual(anthropic?.map((m) => m.id), ["claude-sonnet-4-6", "claude-haiku-4-5"]);
  assert.equal(anthropic?.[0].label, "Claude Sonnet 4.6 (claude-sonnet-4-6)");

  assert.equal(parseOpenAiCompatibleModels({ data: [] }), null);
  assert.equal(parseOpenAiCompatibleModels(null), null);
  assert.equal(parseOpenAiCompatibleModels({ error: "nope" }), null);
});

test("parseGoogleModels strips the models/ prefix", () => {
  const models = parseGoogleModels({
    models: [{ name: "models/gemini-3-pro-preview" }, { name: "gemini-2.5-pro" }],
  });
  assert.deepEqual(models?.map((m) => m.id), ["gemini-3-pro-preview", "gemini-2.5-pro"]);
  assert.equal(parseGoogleModels({}), null);
});

test("parseOllamaTags reads names and sorts by modified_at", () => {
  const models = parseOllamaTags({
    models: [
      { name: "old:1b", modified_at: "2025-01-01T00:00:00Z" },
      { name: "new:7b", modified_at: "2026-01-01T00:00:00Z" },
    ],
  });
  assert.deepEqual(models?.map((m) => m.id), ["new:7b", "old:1b"]);
  assert.equal(parseOllamaTags({ models: [] }), null);
});

test("normalizeExecutionSettings defaults v1 files to unconfigured local-cli", () => {
  const migrated = normalizeExecutionSettings({
    version: 1,
    active_provider: "ollama",
    providers: {},
  });
  assert.equal(migrated.execution_mode, "local-cli");
  assert.equal(migrated.execution_configured, false);
  assert.deepEqual(migrated.selected_cli, { id: "claude", model: "default" });
  assert.deepEqual(migrated.byok, { active_provider: null, models: {} });
});

test("normalizeExecutionSettings preserves explicit v2 fields", () => {
  const migrated = normalizeExecutionSettings({
    version: 2,
    execution_mode: "byok",
    selected_cli: { id: "codex", model: "gpt-5.5" },
    byok: {
      active_provider: "anthropic",
      models: { anthropic: "claude-sonnet-4-6", broken: 42 },
    },
  });
  assert.equal(migrated.execution_mode, "byok");
  assert.equal(migrated.execution_configured, true);
  assert.deepEqual(migrated.selected_cli, { id: "codex", model: "gpt-5.5" });
  assert.deepEqual(migrated.byok, {
    active_provider: "anthropic",
    models: { anthropic: "claude-sonnet-4-6" },
  });
});

test("normalizeExecutionSettings coerces garbage execution_mode to local-cli", () => {
  const migrated = normalizeExecutionSettings({ execution_mode: "cloud-magic" });
  assert.equal(migrated.execution_mode, "local-cli");
  assert.equal(migrated.execution_configured, true);
});

// ---------------------------------------------------------------------------
// Legacy active_provider -> execution mode migration
// ---------------------------------------------------------------------------

test("migration derives selected_cli from legacy kimi active_provider", () => {
  const migrated = normalizeExecutionSettings({
    version: 2,
    active_provider: "kimi",
    providers: { kimi: { id: "kimi", model: "kimi-code/kimi-for-coding" } },
  });
  assert.equal(migrated.execution_configured, true);
  assert.equal(migrated.execution_mode, "local-cli");
  assert.deepEqual(migrated.selected_cli, { id: "kimi", model: "kimi-code/kimi-for-coding" });
});

test("migration maps every legacy CLI provider onto its execution-mode CLI", () => {
  const expectations: Array<[string, string]> = [
    ["claude-code", "claude"],
    ["codex", "codex"],
    ["cursor", "cursor-agent"],
    ["opencode", "opencode"],
  ];
  for (const [legacy, cliId] of expectations) {
    const migrated = normalizeExecutionSettings({
      active_provider: legacy,
      providers: { [legacy]: { model: "some-model" } },
    });
    assert.equal(migrated.execution_configured, true, legacy);
    assert.deepEqual(migrated.selected_cli, { id: cliId, model: "some-model" }, legacy);
  }
});

test("migration leaves providers without CLI equivalents unconfigured", () => {
  for (const legacy of ["ollama", "local-openai", "minimax"]) {
    const migrated = normalizeExecutionSettings({
      active_provider: legacy,
      providers: { [legacy]: { model: "anything" } },
    });
    assert.equal(migrated.execution_configured, false, legacy);
    assert.deepEqual(migrated.selected_cli, { id: "claude", model: "default" }, legacy);
  }
});

test("migration does not override an explicit execution block", () => {
  const migrated = normalizeExecutionSettings({
    active_provider: "kimi",
    providers: { kimi: { model: "kimi-code/kimi-for-coding" } },
    execution_mode: "local-cli",
    selected_cli: { id: "claude", model: "claude-sonnet-4-6" },
  });
  assert.deepEqual(migrated.selected_cli, { id: "claude", model: "claude-sonnet-4-6" });
});

test("migration with missing provider model falls back to default", () => {
  const migrated = normalizeExecutionSettings({ active_provider: "codex", providers: {} });
  assert.deepEqual(migrated.selected_cli, { id: "codex", model: "default" });
  assert.equal(migrated.execution_configured, true);
});

// ---------------------------------------------------------------------------
// BYOK env import + connectivity test helpers
// ---------------------------------------------------------------------------

test("envVarCandidatesFor covers all keyed providers and only allowlisted names", () => {
  for (const def of BYOK_PROVIDERS) {
    const candidates = envVarCandidatesFor(def.id);
    if (def.keyEnvVar === null) {
      assert.deepEqual(candidates, [], def.id);
    } else {
      assert.ok(candidates.includes(def.keyEnvVar), `${def.id} includes ${def.keyEnvVar}`);
      for (const name of candidates) {
        assert.match(name, /^[A-Z][A-Z0-9_]*$/, `${def.id} candidate ${name}`);
      }
    }
  }
  assert.deepEqual(envVarCandidatesFor("google"), ["GEMINI_API_KEY", "GOOGLE_API_KEY"]);
  assert.deepEqual(envVarCandidatesFor("not-a-provider"), []);
});

test("every BYOK provider has a chat endpoint for the connectivity test", () => {
  for (const def of BYOK_PROVIDERS) {
    assert.ok(def.chat, `${def.id} has chat config`);
    assert.match(def.chat!.url, /^https?:\/\//, def.id);
  }
});

test("scrubSecret removes every occurrence of the key", () => {
  const key = "sk-test-abcdef123456";
  const text = `Invalid token ${key}; please rotate ${key} now`;
  const scrubbed = scrubSecret(text, key);
  assert.equal(scrubbed.includes(key), false);
  assert.equal(scrubbed, "Invalid token ***; please rotate *** now");
  assert.equal(scrubSecret("no secrets here", null), "no secrets here");
  // Tiny "secrets" are not scrubbed (would mangle unrelated text).
  assert.equal(scrubSecret("a b c", "b"), "a b c");
});

test("parseChatOutput handles all four response shapes", () => {
  assert.equal(
    parseChatOutput("anthropic", { content: [{ type: "text", text: "OK" }] }),
    "OK"
  );
  assert.equal(
    parseChatOutput("openai-compatible", { choices: [{ message: { content: "OK" } }] }),
    "OK"
  );
  assert.equal(
    parseChatOutput("google", {
      candidates: [{ content: { parts: [{ text: "OK" }] } }],
    }),
    "OK"
  );
  assert.equal(parseChatOutput("ollama", { message: { content: "OK" } }), "OK");
  assert.equal(parseChatOutput("openai-compatible", { unexpected: true }), null);
  assert.equal(parseChatOutput("anthropic", null), null);
});

test("chatBodyError surfaces MiniMax base_resp and OpenAI error objects", () => {
  assert.equal(
    chatBodyError({ base_resp: { status_code: 1004, status_msg: "invalid api key" } }),
    "invalid api key"
  );
  assert.equal(chatBodyError({ base_resp: { status_code: 0, status_msg: "ok" } }), null);
  assert.equal(chatBodyError({ error: { message: "bad model" } }), "bad model");
  assert.equal(chatBodyError({ error: "plain string error" }), "plain string error");
  assert.equal(chatBodyError({ choices: [] }), null);
});
