"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

// ---------------------------------------------------------------------------
// Types mirrored from the execution API payloads
// ---------------------------------------------------------------------------

interface ModelOption {
  id: string;
  label: string;
}

interface DetectedAgent {
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

interface ByokProviderState {
  id: string;
  label: string;
  subtitle: string;
  docs: string;
  key_env_var: string | null;
  requires_key: boolean;
  has_key: boolean;
  masked_key: string | null;
  key_source: "stored" | "environment" | null;
  env_key_available: boolean;
  model: string;
}

interface ByokModelsState {
  models: ModelOption[];
  source: "live" | "fallback";
  error: string | null;
}

interface CliTestState {
  running: boolean;
  ok?: boolean;
  latencyMs?: number;
  output?: string;
  error?: string;
}

type ExecutionMode = "local-cli" | "byok";

const CUSTOM_MODEL_SENTINEL = "__custom__";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#6e6e73] hover:text-[#1d1d1f]">
          <ArrowLeft className="size-4" /> Back to library
        </Link>

        <ExecutionModePanel />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Execution mode panel (Local CLI | BYOK)
// ---------------------------------------------------------------------------

function ExecutionModePanel() {
  const [mode, setMode] = useState<ExecutionMode>("local-cli");
  const [selectedCli, setSelectedCli] = useState<{ id: string; model: string }>({
    id: "claude",
    model: "default",
  });
  const [agents, setAgents] = useState<DetectedAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [byokProviders, setByokProviders] = useState<ByokProviderState[]>([]);
  const [byokActive, setByokActive] = useState<string | null>(null);
  const [byokModels, setByokModels] = useState<Record<string, ByokModelsState>>({});
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<Record<string, CliTestState>>({});
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async (rescan: boolean) => {
    if (rescan) setRescanning(true);
    try {
      const response = await fetch(`/api/execution/agents${rescan ? "?rescan=1" : ""}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAgents(Array.isArray(data.agents) ? data.agents : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "CLI detection failed");
    } finally {
      setAgentsLoading(false);
      setRescanning(false);
    }
  }, []);

  const loadByok = useCallback(async () => {
    try {
      const response = await fetch("/api/execution/byok", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setByokProviders(Array.isArray(data.providers) ? data.providers : []);
      setByokActive(typeof data.active_provider === "string" ? data.active_provider : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load BYOK providers");
    }
  }, []);

  useEffect(() => {
    fetch("/api/execution/mode", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (data.execution_mode === "byok" || data.execution_mode === "local-cli") {
          setMode(data.execution_mode);
        }
        if (data.selected_cli?.id) {
          setSelectedCli({
            id: data.selected_cli.id,
            model: data.selected_cli.model || "default",
          });
        }
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Failed to load execution mode"));
    loadAgents(false);
    loadByok();
  }, [loadAgents, loadByok]);

  const installedCount = useMemo(() => agents.filter((agent) => agent.available).length, [agents]);

  async function persistMode(nextMode: ExecutionMode) {
    setMode(nextMode);
    setError(null);
    try {
      const response = await fetch("/api/execution/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ execution_mode: nextMode }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? `HTTP ${response.status}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save execution mode");
    }
  }

  async function persistCli(id: string, model: string) {
    setSelectedCli({ id, model });
    setError(null);
    try {
      const response = await fetch("/api/execution/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ execution_mode: "local-cli", selected_cli: { id, model } }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? `HTTP ${response.status}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save CLI selection");
    }
  }

  async function runTest(agentId: string) {
    const model = selectedCli.id === agentId ? selectedCli.model : "default";
    setTests((current) => ({ ...current, [agentId]: { running: true } }));
    try {
      const response = await fetch("/api/execution/agents/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agentId, model }),
      });
      const data = await response.json();
      setTests((current) => ({
        ...current,
        [agentId]: {
          running: false,
          ok: Boolean(data.ok),
          latencyMs: typeof data.latencyMs === "number" ? data.latencyMs : undefined,
          output: typeof data.output === "string" ? data.output : undefined,
          error: typeof data.error === "string" ? data.error : undefined,
        },
      }));
    } catch (caught) {
      setTests((current) => ({
        ...current,
        [agentId]: {
          running: false,
          ok: false,
          error: caught instanceof Error ? caught.message : "Test failed",
        },
      }));
    }
  }

  const loadByokModels = useCallback(async (providerId: string, refresh: boolean) => {
    try {
      const params = new URLSearchParams({ provider: providerId });
      if (refresh) params.set("refresh", "1");
      const response = await fetch(`/api/execution/byok/models?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setByokModels((current) => ({
        ...current,
        [providerId]: {
          models: Array.isArray(data.models) ? data.models : [],
          source: data.source === "live" ? "live" : "fallback",
          error: typeof data.error === "string" ? data.error : null,
        },
      }));
    } catch (caught) {
      setByokModels((current) => ({
        ...current,
        [providerId]: {
          models: [],
          source: "fallback",
          error: caught instanceof Error ? caught.message : "Model fetch failed",
        },
      }));
    }
  }, []);

  // Lazily fetch model lists for all BYOK providers once the tab is shown.
  useEffect(() => {
    if (mode !== "byok") return;
    for (const provider of byokProviders) {
      if (!byokModels[provider.id]) loadByokModels(provider.id, false);
    }
  }, [mode, byokProviders, byokModels, loadByokModels]);

  async function postByok(payload: Record<string, unknown>) {
    setError(null);
    const response = await fetch("/api/execution/byok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.error ?? `HTTP ${response.status}`);
    }
    return response.json();
  }

  async function saveKey(providerId: string) {
    const draft = (keyDrafts[providerId] ?? "").trim();
    if (!draft) return;
    try {
      await postByok({ providerId, apiKey: draft });
      setKeyDrafts((current) => ({ ...current, [providerId]: "" }));
      await loadByok();
      await loadByokModels(providerId, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save key");
    }
  }

  async function clearKey(providerId: string) {
    try {
      await postByok({ providerId, apiKey: null });
      await loadByok();
      await loadByokModels(providerId, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to clear key");
    }
  }

  async function setActiveByok(providerId: string) {
    setByokActive(providerId);
    try {
      await postByok({ providerId, active: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to set active provider");
    }
  }

  async function setByokModel(providerId: string, model: string) {
    setByokProviders((current) =>
      current.map((provider) => (provider.id === providerId ? { ...provider, model } : provider))
    );
    try {
      await postByok({ providerId, model });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save model");
    }
  }

  async function importKeyFromEnv(providerId: string) {
    try {
      await postByok({ providerId, import_from_env: true });
      await loadByok();
      await loadByokModels(providerId, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to import key from environment");
    }
  }

  // BYOK test results live in the same map as CLI tests, namespaced by id.
  async function runByokTest(providerId: string, model: string) {
    const key = `byok:${providerId}`;
    setTests((current) => ({ ...current, [key]: { running: true } }));
    try {
      const response = await fetch("/api/execution/byok/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, model }),
      });
      const data = await response.json();
      setTests((current) => ({
        ...current,
        [key]: {
          running: false,
          ok: Boolean(data.ok),
          latencyMs: typeof data.latencyMs === "number" ? data.latencyMs : undefined,
          output: typeof data.output === "string" ? data.output : undefined,
          error: typeof data.error === "string" ? data.error : undefined,
        },
      }));
    } catch (caught) {
      setTests((current) => ({
        ...current,
        [key]: {
          running: false,
          ok: false,
          error: caught instanceof Error ? caught.message : "Test failed",
        },
      }));
    }
  }

  return (
    <section className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">Settings</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1d1d1f]">Execution mode</h1>
      <p className="mt-1 text-sm leading-6 text-[#6e6e73]">
        Choose how extraction, improvement, and test-case tasks run: a locally installed CLI
        agent, or a provider API with your own key. This selection applies everywhere unless a
        brand has a project override.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-[#d2d2d7]/70 bg-white p-1.5 shadow-sm" role="tablist" aria-label="Execution mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "local-cli"}
          onClick={() => persistMode("local-cli")}
          className={
            "rounded-lg px-4 py-3 text-left transition " +
            (mode === "local-cli" ? "bg-[#0071e3] text-white shadow" : "text-[#1d1d1f] hover:bg-[#f5f5f7]")
          }
        >
          <span className="block text-sm font-semibold">Local CLI</span>
          <span className={"mt-0.5 block text-xs " + (mode === "local-cli" ? "text-white/80" : "text-[#86868b]")}>
            {agentsLoading ? "Scanning…" : `${installedCount} installed`}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "byok"}
          onClick={() => persistMode("byok")}
          className={
            "rounded-lg px-4 py-3 text-left transition " +
            (mode === "byok" ? "bg-[#0071e3] text-white shadow" : "text-[#1d1d1f] hover:bg-[#f5f5f7]")
          }
        >
          <span className="block text-sm font-semibold">BYOK</span>
          <span className={"mt-0.5 block text-xs " + (mode === "byok" ? "text-white/80" : "text-[#86868b]")}>
            Bring your own API key
          </span>
        </button>
      </div>

      {mode === "local-cli" ? (
        <div className="mt-5">
          <p className="text-sm text-[#6e6e73]">Pick the CLI that runs your prompts.</p>
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">
              Your CLIs ({installedCount})
            </h2>
            <Button variant="outline" size="sm" onClick={() => loadAgents(true)} disabled={rescanning}>
              <RefreshCw className={"size-3.5" + (rescanning ? " animate-spin" : "")} />
              Rescan
            </Button>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {agentsLoading ? (
              <div className="rounded-xl border border-[#d2d2d7]/70 bg-white px-5 py-6 text-sm text-[#6e6e73] shadow-sm">
                Scanning PATH for installed CLIs…
              </div>
            ) : (
              agents.map((agent) => (
                <CliCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedCli.id === agent.id}
                  selectedModel={selectedCli.id === agent.id ? selectedCli.model : "default"}
                  test={tests[agent.id]}
                  onSelect={() =>
                    agent.available &&
                    persistCli(agent.id, selectedCli.id === agent.id ? selectedCli.model : "default")
                  }
                  onModelChange={(model) => persistCli(agent.id, model)}
                  onTest={() => runTest(agent.id)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-sm text-[#6e6e73]">
            Store a key per provider, then click a card to make it the active provider. Keys are
            saved to a local file readable only by your user and are never sent to the browser.
          </p>
          {byokActive === null && byokProviders.length > 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No active provider selected yet. Click a provider card to activate it.
            </p>
          )}
          <div className="mt-3 flex flex-col gap-3">
            {byokProviders.map((provider) => (
              <ByokCard
                key={provider.id}
                provider={provider}
                active={byokActive === provider.id}
                models={byokModels[provider.id]}
                keyDraft={keyDrafts[provider.id] ?? ""}
                test={tests[`byok:${provider.id}`]}
                onKeyDraftChange={(value) =>
                  setKeyDrafts((current) => ({ ...current, [provider.id]: value }))
                }
                onSaveKey={() => saveKey(provider.id)}
                onClearKey={() => clearKey(provider.id)}
                onImportEnv={() => importKeyFromEnv(provider.id)}
                onActivate={() => setActiveByok(provider.id)}
                onModelChange={(model) => setByokModel(provider.id, model)}
                onRefreshModels={() => loadByokModels(provider.id, true)}
                onTest={() => runByokTest(provider.id, provider.model)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Monogram({ label, highlighted }: { label: string; highlighted: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-semibold " +
        (highlighted ? "bg-[#0071e3] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]")
      }
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

function CliCard({
  agent,
  selected,
  selectedModel,
  test,
  onSelect,
  onModelChange,
  onTest,
}: {
  agent: DetectedAgent;
  selected: boolean;
  selectedModel: string;
  test: CliTestState | undefined;
  onSelect: () => void;
  onModelChange: (model: string) => void;
  onTest: () => void;
}) {
  const [customMode, setCustomMode] = useState(false);
  const knownIds = useMemo(() => new Set(agent.models.map((model) => model.id)), [agent.models]);
  const customActive = customMode || (selectedModel !== "default" && !knownIds.has(selectedModel));
  const selectValue = customActive ? CUSTOM_MODEL_SENTINEL : selectedModel;

  return (
    <div
      className={
        "rounded-xl border bg-white px-5 py-4 shadow-sm transition " +
        (selected
          ? "border-[#0071e3] ring-2 ring-[#0071e3]/15"
          : "border-[#d2d2d7]/70 hover:border-[#b8b8bd]") +
        (agent.available ? "" : " opacity-60")
      }
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onSelect}
          disabled={!agent.available}
          className="flex min-w-0 flex-1 items-start gap-4 text-left"
          aria-pressed={selected}
        >
          <Monogram label={agent.name} highlighted={selected} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#1d1d1f]">{agent.name}</span>
              {agent.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]"
                >
                  {badge}
                </span>
              ))}
              {!agent.available && (
                <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  Not installed
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs text-[#86868b]">{agent.subtitle}</span>
            <span className="mt-1 block truncate text-xs text-[#6e6e73]" title={agent.path ?? undefined}>
              {agent.available ? agent.version ?? "Installed" : `No ${agent.bin} on PATH`}
            </span>
          </span>
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={!agent.available || test?.running}
        >
          {test?.running ? <RefreshCw className="size-3.5 animate-spin" /> : null}
          Test
        </Button>
      </div>

      {agent.available && (
        <div className="mt-3 grid items-end gap-3 border-t border-[#d2d2d7]/50 pt-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
                Model
              </span>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (agent.modelsSource === "live"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-[#f5f5f7] text-[#86868b]")
                }
              >
                {agent.modelsSource === "live" ? "Live from CLI" : "Default (CLI config)"}
              </span>
            </div>
            <select
              aria-label={`${agent.name} model`}
              value={selectValue}
              onChange={(event) => {
                if (event.target.value === CUSTOM_MODEL_SENTINEL) {
                  setCustomMode(true);
                } else {
                  setCustomMode(false);
                  onModelChange(event.target.value);
                }
              }}
              className="h-9 w-full rounded-md border border-[#d2d2d7] bg-white px-2 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
            >
              {agent.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
              {customActive && !knownIds.has(selectedModel) && selectedModel !== "default" ? (
                <option value={CUSTOM_MODEL_SENTINEL}>Custom: {selectedModel}</option>
              ) : (
                <option value={CUSTOM_MODEL_SENTINEL}>Custom…</option>
              )}
            </select>
            {customActive && (
              <input
                type="text"
                defaultValue={knownIds.has(selectedModel) ? "" : selectedModel === "default" ? "" : selectedModel}
                placeholder="Type a model id and press Enter"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const value = (event.target as HTMLInputElement).value.trim();
                    if (value) {
                      setCustomMode(false);
                      onModelChange(value);
                    }
                  }
                }}
                className="mt-2 h-9 w-full rounded-md border border-[#d2d2d7] bg-white px-2 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
              />
            )}
          </div>
        </div>
      )}

      {test && !test.running && (
        <div
          className={
            "mt-3 rounded-lg px-3 py-2 text-xs " +
            (test.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")
          }
        >
          {test.ok ? (
            <span>
              OK in {((test.latencyMs ?? 0) / 1000).toFixed(1)}s
              {test.output ? ` — ${test.output.slice(0, 120)}` : ""}
            </span>
          ) : (
            <span>Failed{test.error ? ` — ${test.error.slice(0, 300)}` : ""}</span>
          )}
        </div>
      )}
    </div>
  );
}

function ByokCard({
  provider,
  active,
  models,
  keyDraft,
  test,
  onKeyDraftChange,
  onSaveKey,
  onClearKey,
  onImportEnv,
  onActivate,
  onModelChange,
  onRefreshModels,
  onTest,
}: {
  provider: ByokProviderState;
  active: boolean;
  models: ByokModelsState | undefined;
  keyDraft: string;
  test: CliTestState | undefined;
  onKeyDraftChange: (value: string) => void;
  onSaveKey: () => void;
  onClearKey: () => void;
  onImportEnv: () => void;
  onActivate: () => void;
  onModelChange: (model: string) => void;
  onRefreshModels: () => void;
  onTest: () => void;
}) {
  const modelOptions = models?.models ?? [];
  const optionIds = new Set(modelOptions.map((model) => model.id));
  // Testable when a key is stored, an env key can be used server-side, or no
  // key is needed at all (Ollama).
  const testable = provider.has_key || provider.env_key_available || !provider.requires_key;

  return (
    <div
      className={
        "rounded-xl border bg-white px-5 py-4 shadow-sm transition " +
        (active ? "border-[#0071e3] ring-2 ring-[#0071e3]/15" : "border-[#d2d2d7]/70 hover:border-[#b8b8bd]")
      }
    >
      <div className="flex items-start gap-4">
        <button type="button" onClick={onActivate} className="flex min-w-0 flex-1 items-start gap-4 text-left" aria-pressed={active}>
          <Monogram label={provider.label} highlighted={active} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#1d1d1f]">{provider.label}</span>
              {active && (
                <span className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#0071e3]">
                  Active
                </span>
              )}
              {!provider.requires_key && (
                <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6e6e73]">
                  No key needed
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs text-[#86868b]">{provider.subtitle}</span>
            {provider.has_key && (
              <span className="mt-1 block text-xs text-[#6e6e73]">
                Key {provider.masked_key}
                {provider.key_source === "environment" ? ` (from ${provider.key_env_var})` : " (saved)"}
              </span>
            )}
            {!provider.has_key && provider.env_key_available && (
              <span className="mt-1 block text-xs text-[#6e6e73]">
                Key available in environment ({provider.key_env_var})
              </span>
            )}
          </span>
        </button>
        <div className="flex shrink-0 gap-2">
          {!provider.has_key && provider.env_key_available && (
            <Button variant="outline" size="sm" onClick={onImportEnv}>
              Import from environment
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onTest} disabled={!testable || test?.running}>
            {test?.running ? <RefreshCw className="size-3.5 animate-spin" /> : null}
            Test
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-[#d2d2d7]/50 pt-3 md:grid-cols-2">
        {provider.requires_key && (
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
              API key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                autoComplete="off"
                value={keyDraft}
                placeholder={provider.has_key ? `Stored ${provider.masked_key}` : "Paste API key"}
                onChange={(event) => onKeyDraftChange(event.target.value)}
                className="h-9 w-full rounded-md border border-[#d2d2d7] bg-white px-2 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
              />
              <Button variant="outline" size="sm" onClick={onSaveKey} disabled={!keyDraft.trim()}>
                Save
              </Button>
              {provider.has_key && provider.key_source === "stored" && (
                <Button variant="outline" size="sm" onClick={onClearKey}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
              Model
            </span>
            <span
              className={
                "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                (models?.source === "live" ? "bg-emerald-50 text-emerald-700" : "bg-[#f5f5f7] text-[#86868b]")
              }
            >
              {models?.source === "live" ? "Live from API" : "Static list"}
            </span>
            <button
              type="button"
              onClick={onRefreshModels}
              className="text-[11px] font-medium text-[#0071e3] hover:underline"
            >
              Refresh
            </button>
          </div>
          <select
            aria-label={`${provider.label} model`}
            value={optionIds.has(provider.model) || provider.model === "default" ? provider.model : provider.model}
            onChange={(event) => onModelChange(event.target.value)}
            className="h-9 w-full rounded-md border border-[#d2d2d7] bg-white px-2 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
          >
            <option value="default">Default (provider picks)</option>
            {!optionIds.has(provider.model) && provider.model !== "default" && (
              <option value={provider.model}>{provider.model}</option>
            )}
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          {models?.error && <p className="mt-1 text-xs text-[#86868b]">{models.error}</p>}
        </div>
      </div>

      {test && !test.running && (
        <div
          className={
            "mt-3 rounded-lg px-3 py-2 text-xs " +
            (test.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")
          }
        >
          {test.ok ? (
            <span>
              OK in {((test.latencyMs ?? 0) / 1000).toFixed(1)}s
              {test.output ? ` — ${test.output.slice(0, 120)}` : ""}
            </span>
          ) : (
            <span>Failed{test.error ? ` — ${test.error.slice(0, 300)}` : ""}</span>
          )}
        </div>
      )}
    </div>
  );
}

