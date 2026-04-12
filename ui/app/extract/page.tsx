"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AgentStatus = "pending" | "running" | "completed" | "error";
type ExtractionState = "idle" | "running" | "complete" | "error";

const PIPELINE = [
  {
    phase: "A",
    label: "Extract",
    agents: [
      { id: "recon-agent", model: "sonnet", role: "Page discovery" },
      { id: "dom-extractor", model: "sonnet", role: "Live DOM measurement" },
      { id: "asset-extractor", model: "sonnet", role: "Download assets" },
    ],
  },
  {
    phase: "B",
    label: "Build",
    agents: [
      { id: "replica-builder", model: "sonnet", role: "React/shadcn replicas" },
    ],
  },
  {
    phase: "C",
    label: "Validate",
    agents: [
      { id: "visual-critic", model: "opus", role: "Visual comparison" },
    ],
  },
  {
    phase: "D",
    label: "Improve",
    agents: [
      { id: "refinement-agent", model: "sonnet", role: "Patch replicas" },
      { id: "validation-monitor", model: "opus", role: "Orchestrator loop" },
    ],
  },
  {
    phase: "E",
    label: "Publish",
    agents: [
      { id: "documentarian", model: "sonnet", role: "DESIGN.md" },
      { id: "skill-packager", model: "sonnet", role: "SKILL.md" },
      { id: "librarian", model: "haiku", role: "Index update" },
    ],
  },
];

const ALL_AGENT_IDS = PIPELINE.flatMap((p) => p.agents.map((a) => a.id));

const PHASE_STYLES: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  A: { dot: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30" },
  B: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30" },
  C: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/30" },
  D: { dot: "bg-violet-500", bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-500/30" },
  E: { dot: "bg-slate-400", bg: "bg-slate-400/10", text: "text-slate-500", border: "border-slate-400/30" },
};

const MODEL_STYLES: Record<string, string> = {
  opus: "border-red-400/40 bg-red-500/15 text-red-300",
  sonnet: "border-blue-400/40 bg-blue-500/15 text-blue-300",
  haiku: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
};

const WS_URL = "ws://localhost:8765";

interface LogEntry {
  ts: string;
  agent: string;
  level: string;
  message: string;
}

function modelBadgeCls(model: string) {
  return MODEL_STYLES[model] ?? "border-slate-400/40 bg-slate-500/15 text-slate-300";
}

function deriveBrandName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.split(".")[0];
  } catch {
    return "";
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

function StatusIcon({ status }: { status: AgentStatus }) {
  switch (status) {
    case "completed":
      return (
        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6l2.5 2.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      );
    case "running":
      return (
        <span className="relative flex size-5 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400/40" />
          <span className="relative inline-flex size-2.5 rounded-full bg-blue-400" />
        </span>
      );
    case "error":
      return (
        <span className="flex size-5 items-center justify-center rounded-full bg-red-500/20 text-red-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </span>
      );
    default:
      return <span className="flex size-5 items-center justify-center rounded-full border border-white/10" />;
  }
}

function getPhaseProgress(agentStatuses: Record<string, AgentStatus>): number {
  const total = ALL_AGENT_IDS.length;
  const done = ALL_AGENT_IDS.filter((id) => agentStatuses[id] === "completed").length;
  const running = ALL_AGENT_IDS.filter((id) => agentStatuses[id] === "running").length;
  return total === 0 ? 0 : (done + running * 0.5) / total;
}

function getCurrentPhase(agentStatuses: Record<string, AgentStatus>): string | null {
  for (const phase of PIPELINE) {
    for (const agent of phase.agents) {
      if (agentStatuses[agent.id] === "running") return `${phase.phase}: ${phase.label}`;
    }
  }
  for (const phase of PIPELINE) {
    for (const agent of phase.agents) {
      if (agentStatuses[agent.id] === "error") return `${phase.phase}: ${phase.label} (error)`;
    }
  }
  return null;
}

export default function ExtractPage() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [extractionState, setExtractionState] = useState<ExtractionState>("idle");
  const [inputUrl, setInputUrl] = useState("");
  const [inputName, setInputName] = useState("");
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState("Ready. Enter a URL to begin extraction.");
  const logEndRef = useRef<HTMLDivElement>(null);
  const pendingStartRef = useRef<{ url: string; name: string } | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const handleEvent = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case "agent_started":
        setAgentStatuses((prev) => ({ ...prev, [data.agent as string]: "running" }));
        setStatusMessage(`Running ${(data.agent as string)}...`);
        break;
      case "agent_completed":
        setAgentStatuses((prev) => ({ ...prev, [data.agent as string]: "completed" }));
        break;
      case "agent_log":
      case "claude_output":
        addLog({ ts: new Date().toISOString(), agent: (data.agent as string) ?? "system", level: "info", message: data.message as string });
        break;
      case "error":
        setAgentStatuses((prev) => {
          if (data.agent) return { ...prev, [data.agent as string]: "error" };
          return prev;
        });
        addLog({ ts: new Date().toISOString(), agent: (data.agent as string) ?? "system", level: "error", message: data.message as string });
        if (data.agent) setStatusMessage(`Error in ${(data.agent as string)}: ${(data.message as string).slice(0, 80)}`);
        break;
      case "validation_score":
        setCurrentScore(data.score as number);
        setStatusMessage(`Validation score: ${Math.round((data.score as number) * 100)}%`);
        break;
      case "blocked_site":
        addLog({ ts: new Date().toISOString(), agent: "system", level: "warn", message: `Blocked: ${data.reason}. Fallback: ${data.fallback}` });
        break;
      case "extraction_complete":
        setExtractionState("complete");
        setFinalScore(data.final_score as number);
        setStatusMessage(`Extraction complete. Final score: ${Math.round((data.final_score as number) * 100)}%`);
        break;
    }
  }, [addLog]);

  const handleEventRef = useRef(handleEvent);
  handleEventRef.current = handleEvent;

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => {
        setConnected(true);
        if (pendingStartRef.current) {
          const { url, name } = pendingStartRef.current;
          pendingStartRef.current = null;
          socket.send(JSON.stringify({ type: "start_extraction", url, brand_name: name, max_pages: 5 }));
          setExtractionState("running");
          setStatusMessage("Connected! Starting extraction...");
        }
      };
      socket.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => {
        socket.close();
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleEventRef.current(data);
        } catch {}
      };
      setWs(socket);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  function startExtraction() {
    if (!inputUrl.trim()) return;
    const name = inputName.trim() || deriveBrandName(inputUrl);
    ws?.send(JSON.stringify({ type: "start_extraction", url: inputUrl, brand_name: name, max_pages: 5 }));
    setExtractionState("running");
    setLogs([]);
    setAgentStatuses({});
    setCurrentScore(null);
    setFinalScore(null);
    setStatusMessage("Starting extraction...");
  }

  function cancelExtraction() {
    ws?.send(JSON.stringify({ type: "cancel" }));
    setExtractionState("idle");
    setStatusMessage("Extraction cancelled.");
  }

  function copyAllLogs() {
    const text = filteredLogs.map((l) => `[${formatTime(l.ts)}] [${l.agent}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
  }

  const progress = getPhaseProgress(agentStatuses);
  const currentPhase = getCurrentPhase(agentStatuses);
  const isRunning = extractionState === "running";

  const uniqueAgents = Array.from(new Set(logs.map((l) => l.agent)));
  const filteredLogs = agentFilter === "all" ? logs : logs.filter((l) => l.agent === agentFilter);

  const scoreDisplay = finalScore ?? currentScore;

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#1e293b] bg-[#0f172a]">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Agent Pipeline</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {PIPELINE.map((phase) => {
              const style = PHASE_STYLES[phase.phase];
              return (
                <div key={phase.phase} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className={`size-2 rounded-full ${style.dot}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${style.text}`}>
                      Phase {phase.phase} — {phase.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {phase.agents.map((agent) => {
                      const status = agentStatuses[agent.id] ?? "pending";
                      const isActive = status === "running";
                      return (
                        <div
                          key={agent.id}
                          className={`rounded-lg border px-3 py-2.5 transition-all ${
                            isActive
                              ? `border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_-4px_rgba(59,130,246,0.3)]`
                              : status === "completed"
                              ? "border-emerald-500/20 bg-emerald-500/5"
                              : status === "error"
                              ? "border-red-500/30 bg-red-500/5"
                              : "border-white/5 bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <StatusIcon status={status} />
                              <span className="truncate font-mono text-[12px] font-medium text-slate-200">
                                {agent.id}
                              </span>
                            </div>
                            <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${modelBadgeCls(agent.model)}`}>
                              {agent.model}
                            </span>
                          </div>
                          <p className="mt-1 pl-7 text-[11px] text-slate-500">{agent.role}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-y-auto bg-white">
          <div className="mx-auto w-full max-w-2xl px-8 py-10">
            <div className="mb-8">
              <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
                Extract Design System
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#86868b]">
                Enter a website URL to extract its complete design system. The agent pipeline will discover pages, measure components, build replicas, and validate the output.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#6e6e73]">Website URL</label>
                <Input
                  placeholder="https://example.com"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (!inputName && e.target.value) {
                      setInputName(deriveBrandName(e.target.value));
                    }
                  }}
                  disabled={isRunning}
                  className="h-11 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-[15px] px-4"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#6e6e73]">Brand Name <span className="text-[#86868b]">(auto-derived from URL)</span></label>
                <Input
                  placeholder="my-brand"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  disabled={isRunning}
                  className="h-9 rounded-lg border-[#d2d2d7] bg-[#f5f5f7] px-3 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                {isRunning ? (
                  <Button variant="destructive" size="lg" onClick={cancelExtraction} className="rounded-xl px-6">
                    Cancel
                  </Button>
                ) : !connected ? (
                  <div className="w-full">
                    <Button
                      size="lg"
                      onClick={() => {
                        if (!inputUrl.trim()) return;
                        setExtractionState("running");
                        setLogs([]);
                        setAgentStatuses({});
                        setCurrentScore(null);
                        setFinalScore(null);
                        setStatusMessage("Waiting for server connection...");
                        addLog({ ts: new Date().toISOString(), agent: "system", level: "warn", message: "WebSocket server not running. Start it with: python3 scripts/ws_extraction_server.py" });
                        addLog({ ts: new Date().toISOString(), agent: "system", level: "info", message: "The UI will connect automatically once the server starts. Leaving this page will NOT cancel the extraction." });
                        pendingStartRef.current = { url: inputUrl, name: inputName.trim() || deriveBrandName(inputUrl) };
                      }}
                      disabled={!inputUrl.trim()}
                      className="rounded-xl bg-[#0071e3] px-6 hover:bg-[#0077ED] disabled:opacity-40"
                    >
                      Extract Design System
                    </Button>
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-[12px] font-medium text-amber-800">WebSocket server not running</p>
                      <p className="mt-1 text-[11px] text-amber-700">
                        Start it in a separate terminal:
                      </p>
                      <code className="mt-1.5 block rounded-lg bg-amber-900/10 px-3 py-2 font-mono text-[11px] text-amber-900">
                        python3 scripts/ws_extraction_server.py
                      </code>
                      <p className="mt-1.5 text-[11px] text-amber-600">
                        The extraction will begin automatically once the server connects. You can also use the CLI directly:
                      </p>
                      <code className="mt-1.5 block rounded-lg bg-amber-900/10 px-3 py-2 font-mono text-[11px] text-amber-900">
                        claude /extract {inputUrl || "https://example.com"}
                      </code>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    onClick={startExtraction}
                    disabled={!inputUrl.trim()}
                    className="rounded-xl bg-[#0071e3] px-6 hover:bg-[#0077ED] disabled:opacity-40"
                  >
                    Extract Design System
                  </Button>
                )}

                {connected && (
                  <span className="flex items-center gap-1.5 text-[12px] text-[#86868b]">
                    <span className="size-2 rounded-full bg-green-500" />
                    Server connected
                  </span>
                )}
              </div>
            </div>

            {(isRunning || extractionState === "complete") && (
              <div className="mt-10 space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#6e6e73]">
                      {currentPhase ? `Phase: ${currentPhase}` : extractionState === "complete" ? "Complete" : "Preparing..."}
                    </span>
                    <span className="font-mono text-[12px] text-[#6e6e73]">
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e8e8ed]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        extractionState === "complete"
                          ? "bg-emerald-500"
                          : "bg-[#0071e3]"
                      }`}
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                </div>

                {scoreDisplay != null && (
                  <div className="rounded-2xl border border-[#d2d2d7]/50 bg-[#f5f5f7] p-5">
                    <div className="flex items-baseline gap-3">
                      <span className={`text-4xl font-semibold tracking-tight ${
                        scoreDisplay >= 0.8
                          ? "text-emerald-600"
                          : scoreDisplay >= 0.6
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}>
                        {Math.round(scoreDisplay * 100)}%
                      </span>
                      <span className="text-[13px] text-[#86868b]">
                        {extractionState === "complete" ? "Final validation score" : "Current validation score"}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          scoreDisplay >= 0.8
                            ? "bg-emerald-500"
                            : scoreDisplay >= 0.6
                            ? "bg-amber-500"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${Math.round(scoreDisplay * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-[#f5f5f7] px-4 py-3">
                  <p className="text-[13px] text-[#6e6e73]">
                    <span className="font-medium text-[#1d1d1f]">Status:</span> {statusMessage}
                  </p>
                </div>

                {extractionState === "complete" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-[14px] font-medium text-emerald-800">
                      Extraction finished successfully.
                    </p>
                    <p className="mt-1 text-[13px] text-emerald-700">
                      Check the Library page to view the extracted design system.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <aside className="flex w-[400px] shrink-0 flex-col border-l border-[#1e293b] bg-[#0f172a]">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Live Output</h2>
            <div className="flex items-center gap-2">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="h-6 rounded border border-white/10 bg-white/5 px-1.5 text-[10px] text-slate-400 outline-none"
              >
                <option value="all">All agents</option>
                {uniqueAgents.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <button
                onClick={copyAllLogs}
                disabled={filteredLogs.length === 0}
                className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:bg-white/10 disabled:opacity-30"
              >
                Copy All
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[12px] leading-5">
            {filteredLogs.length === 0 && (
              <p className="py-8 text-center text-[12px] text-slate-600">
                {connected ? "Waiting for output..." : "Not connected to server."}
              </p>
            )}
            {filteredLogs.map((log, i) => (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="shrink-0 text-slate-600">{formatTime(log.ts)}</span>
                <span className={`shrink-0 font-medium ${
                  log.level === "error"
                    ? "text-red-400"
                    : log.level === "warn"
                    ? "text-amber-400"
                    : log.level === "success"
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}>
                  [{log.agent}]
                </span>
                <span className={`break-all ${
                  log.level === "error"
                    ? "text-red-300"
                    : log.level === "warn"
                    ? "text-amber-300"
                    : log.level === "success"
                    ? "text-emerald-300"
                    : "text-slate-300"
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {logs.length > 0 && (
            <div className="border-t border-white/5 px-4 py-2">
              <span className="text-[10px] text-slate-600">
                {logs.length} log entries
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
