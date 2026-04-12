"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type AgentStatus = "pending" | "running" | "completed" | "error";
type ExtractionState = "idle" | "running" | "complete" | "error";

const WS_URL = "ws://localhost:8765";

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

interface LogEntry {
  ts: string;
  agent: string;
  level: string;
  message: string;
}

interface SkillEntry {
  id: string;
  name: string;
  task_family: string;
  capabilities: string[];
  freshness: string;
  contract_score: number;
  success_count: number;
  last_updated: string;
  path: string;
}

interface SkillsRegistry {
  version: string;
  updated_at: string;
  skills: SkillEntry[];
}

interface ChangelogEntry {
  timestamp: string;
  change_type: string;
  description: string;
  affected_files: string[];
  brand: string;
  validation_before: number | null;
  validation_after: number | null;
  source: string;
}

interface ExperimentEntry {
  timestamp?: string;
  agent?: string;
  phase?: string;
  status?: string;
  score?: number;
  [key: string]: unknown;
}

interface SourceFile {
  path: string;
  content: string;
  size: number;
}

const AGENT_NODES = [
  { id: "recon-agent", phase: "A", row: 0, label: "recon-agent", model: "sonnet", role: "Page discovery & classification", file: "agents/recon-agent.md", outputs: "page-manifest.json" },
  { id: "dom-extractor", phase: "A", row: 1, label: "dom-extractor", model: "sonnet", role: "Live DOM measurement (agent-browser eval)", file: "agents/dom-extractor.md", outputs: "dom-extraction/*.json" },
  { id: "asset-extractor", phase: "A", row: 2, label: "asset-extractor", model: "sonnet", role: "Download fonts, images, SVGs", file: "agents/asset-extractor.md", outputs: "assets/" },
  { id: "voice-analyst", phase: "A", row: 3, label: "voice-analyst", model: "sonnet", role: "Brand voice & tone analysis", file: "agents/voice-analyst.md", outputs: "voice-analysis.json" },
  { id: "pattern-analyst", phase: "A", row: 4, label: "pattern-analyst", model: "sonnet", role: "9 measurable + 6 interpretive signals", file: "agents/pattern-analyst.md", outputs: "patterns.json" },
  { id: "replica-builder", phase: "B", row: 0, label: "replica-builder", model: "sonnet", role: "React/shadcn replica generation", file: "agents/replica-builder.md", outputs: "ui/app/brands/<slug>/replica/*" },
  { id: "visual-critic", phase: "C", row: 0, label: "visual-critic", model: "opus", role: "Vision-capable structural comparison", file: "agents/visual-critic.md", outputs: "critique JSON, issue lists" },
  { id: "refinement-agent", phase: "D", row: 0, label: "refinement-agent", model: "sonnet", role: "Patch replicas from visual-critic feedback", file: "agents/refinement-agent.md", outputs: "Updated replica pages/components" },
  { id: "validation-monitor", phase: "D", row: 1, label: "validation-monitor", model: "opus", role: "Autonomous orchestrator: loop until target", file: "agents/validation-monitor.md", outputs: "Orchestration plan, manifest" },
  { id: "documentarian", phase: "E", row: 0, label: "documentarian", model: "sonnet", role: "DESIGN.md from Jinja2 template", file: "agents/documentarian.md", outputs: "DESIGN.md" },
  { id: "skill-packager", phase: "E", row: 1, label: "skill-packager", model: "sonnet", role: "Per-brand SKILL.md with triggers", file: "agents/skill-packager.md", outputs: "skill/SKILL.md" },
  { id: "librarian", phase: "E", row: 2, label: "librarian", model: "haiku", role: "Library index & apply_design.py", file: "agents/librarian.md", outputs: "~/.claude/design-library/" },
];

const DAG_EDGES: { from: string; to: string; label?: string; dashed?: boolean }[] = [
  { from: "recon-agent", to: "dom-extractor", label: "page manifest" },
  { from: "recon-agent", to: "asset-extractor" },
  { from: "recon-agent", to: "voice-analyst" },
  { from: "recon-agent", to: "pattern-analyst" },
  { from: "dom-extractor", to: "replica-builder", label: "DOM JSON" },
  { from: "asset-extractor", to: "replica-builder", label: "assets" },
  { from: "pattern-analyst", to: "replica-builder" },
  { from: "voice-analyst", to: "replica-builder" },
  { from: "replica-builder", to: "visual-critic", label: "replica pages" },
  { from: "visual-critic", to: "refinement-agent", label: "critique" },
  { from: "refinement-agent", to: "validation-monitor", label: "patches" },
  { from: "validation-monitor", to: "visual-critic", label: "re-score", dashed: true },
  { from: "validation-monitor", to: "documentarian", label: "validated" },
  { from: "documentarian", to: "skill-packager" },
  { from: "skill-packager", to: "librarian" },
];

const PHASE_META: Record<string, { label: string; color: string; bg: string; border: string; accent: string }> = {
  A: { label: "Extract", color: "blue", bg: "bg-blue-50", border: "border-blue-300", accent: "text-blue-700" },
  B: { label: "Build", color: "green", bg: "bg-green-50", border: "border-green-300", accent: "text-green-700" },
  C: { label: "Validate", color: "amber", bg: "bg-amber-50", border: "border-amber-300", accent: "text-amber-700" },
  D: { label: "Improve", color: "purple", bg: "bg-purple-50", border: "border-purple-300", accent: "text-purple-700" },
  E: { label: "Publish", color: "gray", bg: "bg-gray-100", border: "border-gray-300", accent: "text-gray-700" },
};

function deriveBrandName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.split(".")[0];
  } catch {
    return "";
  }
}

function deriveSlug(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.replace(/\./g, "-");
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

function modelBadgeCls(model: string) {
  return MODEL_STYLES[model] ?? "border-slate-400/40 bg-slate-500/15 text-slate-300";
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

function modelBadge(model: string) {
  const styles: Record<string, string> = {
    opus: "border-red-200 bg-red-50 text-red-700",
    sonnet: "border-blue-200 bg-blue-50 text-blue-700",
    haiku: "border-green-200 bg-green-50 text-green-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${styles[model] ?? "border-gray-200 bg-gray-50 text-gray-700"}`}>
      {model}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-[#e8e8ed] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] text-[#6e6e73]">{pct}%</span>
    </div>
  );
}

function CodePreviewPanel({ file, onClose }: { file: string | null; onClose: () => void }) {
  const [source, setSource] = useState<SourceFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setSource(null); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/monitoring/source?file=${encodeURIComponent(file)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSource(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [file]);

  if (!file) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[640px] max-w-[90vw] border-l border-[#d2d2d7] bg-white shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-[#d2d2d7]/40 px-5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1d1d1f] truncate">{file}</p>
          {source && (
            <p className="text-[11px] text-[#86868b] mt-0.5 font-mono">
              {source.size.toLocaleString()} chars &middot; design-extractor/{file}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <button
            onClick={() => { navigator.clipboard.writeText(source?.content ?? ""); }}
            disabled={!source}
            className="rounded-lg border border-[#d2d2d7] px-3 py-1.5 text-xs font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-40"
          >
            Copy
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#d2d2d7] px-3 py-1.5 text-xs font-medium text-[#1d1d1f] hover:bg-[#f5f5f7]"
          >
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[#1e1e2e]">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#86868b]">Loading...</p>
          </div>
        )}
        {error && (
          <div className="p-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {source && (
          <pre className="p-4 font-mono text-[12px] leading-5 text-[#cdd6f4] whitespace-pre overflow-x-auto">
            <code>{source.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function ExtractionTab({
  connected,
  extractionState,
  setExtractionState,
  agentStatuses,
  logs,
  inputUrl,
  setInputUrl,
  inputName,
  setInputName,
  currentScore,
  finalScore,
  statusMessage,
  onStart,
  onCancel,
  onResume,
  resumableJob,
}: {
  connected: boolean;
  extractionState: ExtractionState;
  setExtractionState: (s: ExtractionState) => void;
  agentStatuses: Record<string, AgentStatus>;
  logs: LogEntry[];
  inputUrl: string;
  setInputUrl: (v: string) => void;
  inputName: string;
  setInputName: (v: string) => void;
  currentScore: number | null;
  finalScore: number | null;
  statusMessage: string;
  onStart: () => void;
  onCancel: () => void;
  onResume: () => void;
  resumableJob: { slug: string; jobs: { status?: string; agent?: string }[] } | null;
}) {
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isRunning = extractionState === "running";
  const scoreDisplay = finalScore ?? currentScore;
  const progress = getPhaseProgress(agentStatuses);
  const currentPhase = getCurrentPhase(agentStatuses);
  const uniqueAgents = Array.from(new Set(logs.map((l) => l.agent)));
  const filteredLogs = agentFilter === "all" ? logs : logs.filter((l) => l.agent === agentFilter);

  function copyAllLogs() {
    const text = filteredLogs.map((l) => `[${formatTime(l.ts)}] [${l.agent}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
  }

  if (!isRunning && extractionState !== "complete") {
    return (
      <div className="mx-auto max-w-xl pt-8">
        <div className="space-y-5">
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
              className="h-11 rounded-xl border-[#d2d2d7] bg-[#f5f5f7] text-[15px] px-4"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6e6e73]">Brand Name <span className="text-[#86868b]">(auto-derived from URL)</span></label>
            <Input
              placeholder="my-brand"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="h-9 rounded-lg border-[#d2d2d7] bg-[#f5f5f7] px-3 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {!connected ? (
              <div className="w-full">
                <Button
                  size="lg"
                  onClick={onStart}
                  disabled={!inputUrl.trim()}
                  className="rounded-xl bg-[#0071e3] px-6 hover:bg-[#0077ED] disabled:opacity-40"
                >
                  Start Extraction
                </Button>
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[12px] font-medium text-amber-800">WebSocket server not running</p>
                  <p className="mt-1 text-[11px] text-amber-700">Start it in a separate terminal:</p>
                  <code className="mt-1.5 block rounded-lg bg-amber-900/10 px-3 py-2 font-mono text-[11px] text-amber-900">
                    python3 scripts/ws_extraction_server.py
                  </code>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={onStart}
                disabled={!inputUrl.trim()}
                className="rounded-xl bg-[#0071e3] px-6 hover:bg-[#0077ED] disabled:opacity-40"
              >
                Start Extraction
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className={`size-2 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`} />
            <span className="text-[12px] text-[#86868b]">
              Server {connected ? "connected" : "offline"}
            </span>
          </div>

          {resumableJob && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[13px] font-medium text-blue-800">
                Previous extraction found for this URL
              </p>
              <p className="mt-1 text-[12px] text-blue-700">
                {resumableJob.jobs.length} job(s) exist, some with failed or stalled status.
              </p>
              <Button
                size="sm"
                onClick={onResume}
                className="mt-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Resume previous extraction
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center gap-3 pb-4 border-b border-[#d2d2d7]/40 mb-4">
        <Input
          value={inputUrl}
          disabled
          className="h-9 flex-1 rounded-lg border-[#d2d2d7] bg-[#f5f5f7] px-3 text-sm opacity-60"
        />
        {isRunning && (
          <Button variant="destructive" size="sm" onClick={onCancel} className="rounded-lg px-4">
            Cancel
          </Button>
        )}
        {scoreDisplay != null && (
          <div className="flex items-center gap-2 rounded-lg border border-[#d2d2d7]/50 bg-[#f5f5f7] px-3 py-1.5">
            <span className={`text-lg font-semibold ${
              scoreDisplay >= 0.8 ? "text-emerald-600" : scoreDisplay >= 0.6 ? "text-amber-600" : "text-red-600"
            }`}>
              {Math.round(scoreDisplay * 100)}%
            </span>
            <span className="text-[10px] text-[#86868b]">score</span>
          </div>
        )}
        {extractionState === "complete" && !isRunning && (
          <Button
            size="sm"
            onClick={() => {
              setExtractionState("idle");
            }}
            className="rounded-lg bg-[#0071e3] hover:bg-[#0077ED] text-white px-4"
          >
            New Extraction
          </Button>
        )}
      </div>

      {extractionState === "complete" && !isRunning && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[13px] font-medium text-emerald-800">Extraction finished successfully.</p>
          <p className="mt-1 text-[12px] text-emerald-700">Check the Library page to view the extracted design system.</p>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="w-[300px] shrink-0 rounded-2xl border border-[#1e293b] bg-[#0f172a] overflow-hidden flex flex-col">
          <div className="border-b border-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Agent Pipeline</h2>
              <span className="font-mono text-[11px] text-slate-500">{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  extractionState === "complete" ? "bg-emerald-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
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
                              ? "border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_-4px_rgba(59,130,246,0.3)]"
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
        </div>

        <div className="flex-1 flex flex-col rounded-2xl border border-[#1e293b] bg-[#0f172a] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Live Output</h2>
              <span className="text-[10px] text-slate-600">{statusMessage}</span>
            </div>
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
              <span className="text-[10px] text-slate-600">{logs.length} log entries</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentDAGTab({ experiments, onViewSource }: { experiments: ExperimentEntry[]; onViewSource: (file: string) => void }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const phases = ["A", "B", "C", "D", "E"];
  const COL_W = 220;
  const GAP = 60;
  const NODE_H = 56;
  const NODE_GAP = 8;
  const PAD_X = 40;
  const PAD_Y = 60;

  const nodesByPhase = phases.map((p) => AGENT_NODES.filter((n) => n.phase === p));
  const colHeights = nodesByPhase.map((nodes) => nodes.length * (NODE_H + NODE_GAP) - NODE_GAP);
  const maxH = Math.max(...colHeights);

  const totalW = PAD_X * 2 + phases.length * COL_W + (phases.length - 1) * GAP;
  const totalH = PAD_Y * 2 + maxH + 30;

  const getNodeCenter = (id: string) => {
    const node = AGENT_NODES.find((n) => n.id === id)!;
    const phaseIdx = phases.indexOf(node.phase);
    const phaseNodes = nodesByPhase[phaseIdx];
    const rowIdx = phaseNodes.indexOf(node);
    const colH = colHeights[phaseIdx];
    const x = PAD_X + phaseIdx * (COL_W + GAP) + COL_W / 2;
    const yOffset = (maxH - colH) / 2;
    const y = PAD_Y + yOffset + rowIdx * (NODE_H + NODE_GAP) + NODE_H / 2;
    return { x, y, node };
  };

  const connectedEdges = DAG_EDGES.filter((e) => {
    if (!hoveredNode) return true;
    return e.from === hoveredNode || e.to === hoveredNode;
  });
  const isEdgeDimmed = (edge: typeof DAG_EDGES[0]) => hoveredNode !== null && edge.from !== hoveredNode && edge.to !== hoveredNode;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-[#6e6e73]">
        Directed acyclic graph of the extraction pipeline. Click any agent to preview its source file. Hover to highlight connections.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[#d2d2d7]/40 bg-white">
        <svg width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`} className="block min-w-[${totalW}px]">
          <defs>
            <marker id="arrow" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#86868b" />
            </marker>
            <marker id="arrow-dim" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#d2d2d7" />
            </marker>
            <marker id="arrow-loop" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#7c3aed" />
            </marker>
          </defs>

          {phases.map((p, i) => {
            const meta = PHASE_META[p];
            const colH = colHeights[i];
            const yOffset = (maxH - colH) / 2;
            const x = PAD_X + i * (COL_W + GAP);
            const y = PAD_Y + yOffset - 28;
            return (
              <g key={p}>
                <rect x={x - 10} y={y} width={COL_W + 20} height={colH + 44} rx={16} fill={meta.bg === "bg-blue-50" ? "#eff6ff" : meta.bg === "bg-green-50" ? "#f0fdf4" : meta.bg === "bg-amber-50" ? "#fffbeb" : meta.bg === "bg-purple-50" ? "#faf5ff" : "#f9fafb"} stroke={meta.border === "border-blue-300" ? "#93c5fd" : meta.border === "border-green-300" ? "#86efac" : meta.border === "border-amber-300" ? "#fcd34d" : meta.border === "border-purple-300" ? "#c4b5fd" : "#d1d5db"} strokeWidth="1.5" />
                <text x={x + COL_W / 2} y={y + 18} textAnchor="middle" className="text-[11px] font-semibold" fill={meta.accent === "text-blue-700" ? "#1d4ed8" : meta.accent === "text-green-700" ? "#15803d" : meta.accent === "text-amber-700" ? "#b45309" : meta.accent === "text-purple-700" ? "#7e22ce" : "#374151"}>
                  Phase {p} — {meta.label}
                </text>
              </g>
            );
          })}

          {DAG_EDGES.map((edge, i) => {
            const from = getNodeCenter(edge.from);
            const to = getNodeCenter(edge.to);
            const dimmed = isEdgeDimmed(edge);
            const isLoop = edge.dashed;

            if (isLoop) {
              const loopPath = `M ${from.x} ${from.y + NODE_H / 2 + 4} C ${from.x - 80} ${from.y + NODE_H / 2 + 80}, ${to.x - 80} ${to.y + NODE_H / 2 + 80}, ${to.x} ${to.y + NODE_H / 2 + 4}`;
              return (
                <g key={`e-${i}`}>
                  <path d={loopPath} fill="none" stroke={dimmed ? "#e5e7eb" : "#7c3aed"} strokeWidth={dimmed ? 1 : 1.5} strokeDasharray="5 3" markerEnd={dimmed ? "url(#arrow-dim)" : "url(#arrow-loop)"} opacity={dimmed ? 0.3 : 0.7} />
                  {edge.label && !dimmed && (
                    <text x={(from.x + to.x) / 2 - 60} y={Math.max(from.y, to.y) + NODE_H / 2 + 60} className="text-[9px] fill-[#7c3aed] font-medium" textAnchor="middle">
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            }

            const x1 = from.x + COL_W / 2 - 2;
            const y1 = from.y;
            const x2 = to.x - COL_W / 2 + 2;
            const y2 = to.y;

            const samePhase = from.node.phase === to.node.phase;
            const sx = samePhase ? from.x + COL_W / 2 : x1;
            const sy = y1;
            const ex = samePhase ? to.x + COL_W / 2 : x2;
            const ey = y2;

            return (
              <g key={`e-${i}`}>
                <line x1={samePhase ? sx : sx} y1={sy} x2={samePhase ? ex : ex} y2={ey} stroke={dimmed ? "#e5e7eb" : "#86868b"} strokeWidth={dimmed ? 0.8 : 1.2} markerEnd={dimmed ? "url(#arrow-dim)" : "url(#arrow)"} opacity={dimmed ? 0.25 : 0.6} />
                {edge.label && !dimmed && !samePhase && (
                  <text x={(sx + ex) / 2} y={(sy + ey) / 2 - 4} className="text-[8px] fill-[#86868b]" textAnchor="middle">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {AGENT_NODES.map((node) => {
            const { x, y } = getNodeCenter(node.id);
            const isHovered = hoveredNode === node.id;
            const isConnected = hoveredNode ? DAG_EDGES.some((e) => (e.from === hoveredNode && e.to === node.id) || (e.to === hoveredNode && e.from === node.id)) : true;
            const dimmed = hoveredNode !== null && !isHovered && !isConnected;
            const lastRun = experiments.find((e) => e.agent === node.id);

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                opacity={dimmed ? 0.3 : 1}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onViewSource(node.file)}
              >
                <rect x={x - COL_W / 2 + 6} y={y - NODE_H / 2} width={COL_W - 12} height={NODE_H} rx={10} fill={isHovered ? "#f0f4ff" : "white"} stroke={isHovered ? "#0071e3" : "#d2d2d7"} strokeWidth={isHovered ? 1.5 : 1} />
                <text x={x - COL_W / 2 + 16} y={y - 8} className="text-[11px] font-mono font-semibold fill-[#1d1d1f]">
                  {node.label}
                </text>
                <text x={x - COL_W / 2 + 16} y={y + 10} className="text-[9px] fill-[#86868b]">
                  {node.role.length > 32 ? node.role.slice(0, 32) + "..." : node.role}
                </text>
                <rect x={x + COL_W / 2 - 56} y={y - NODE_H / 2 + 6} width={38} height={16} rx={8} fill={node.model === "opus" ? "#fef2f2" : node.model === "haiku" ? "#f0fdf4" : "#eff6ff"} stroke={node.model === "opus" ? "#fca5a5" : node.model === "haiku" ? "#86efac" : "#93c5fd"} strokeWidth="0.8" />
                <text x={x + COL_W / 2 - 37} y={y - NODE_H / 2 + 17} className="text-[8px] font-medium" textAnchor="middle" fill={node.model === "opus" ? "#b91c1c" : node.model === "haiku" ? "#15803d" : "#1d4ed8"}>
                  {node.model}
                </text>
                {lastRun?.score != null && (
                  <text x={x + COL_W / 2 - 8} y={y + 16} className="text-[8px] font-medium" textAnchor="end" fill={lastRun.score >= 0.8 ? "#15803d" : lastRun.score >= 0.5 ? "#b45309" : "#b91c1c"}>
                    {(lastRun.score * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <Card className="rounded-[24px] border-[#d2d2d7]/50">
        <CardHeader>
          <CardTitle>Data flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5 text-xs">
            {phases.map((p) => {
              const meta = PHASE_META[p];
              const agents = AGENT_NODES.filter((n) => n.phase === p);
              return (
                <div key={p} className="rounded-xl bg-[#f5f5f7] p-3">
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${meta.accent === "text-blue-700" ? "text-blue-700" : meta.accent === "text-green-700" ? "text-green-700" : meta.accent === "text-amber-700" ? "text-amber-700" : meta.accent === "text-purple-700" ? "text-purple-700" : "text-gray-700"}`}>
                    Phase {p}: {meta.label}
                  </p>
                  <div className="mt-2 space-y-1">
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => onViewSource(a.file)}
                        className="block w-full text-left font-mono text-[10px] text-[#0071e3] hover:underline truncate"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SkillsProgressTab({ skills, onViewSource }: { skills: SkillEntry[]; onViewSource: (file: string) => void }) {
  if (skills.length === 0) {
    return (
      <div className="rounded-xl bg-[#f5f5f7] p-12 text-center">
        <p className="text-sm text-[#86868b]">No skill registry data available. Run an extraction to populate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-[#6e6e73]">
        Skill quality scores from the learning registry. Click any skill name to preview its source file.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
          <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{skills.filter((s) => s.freshness === "active").length}</p>
          <p className="mt-1 text-xs text-[#86868b]">Active skills</p>
        </div>
        <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
          <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{skills.filter((s) => s.freshness === "candidate").length}</p>
          <p className="mt-1 text-xs text-[#86868b]">Candidates</p>
        </div>
        <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
          <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{skills.reduce((sum, s) => sum + s.success_count, 0)}</p>
          <p className="mt-1 text-xs text-[#86868b]">Total successes</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#d2d2d7]/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d2d2d7]/40 bg-[#f5f5f7] text-left text-xs text-[#86868b]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Freshness</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Successes</th>
              <th className="px-4 py-3 font-medium">Last Updated</th>
              <th className="px-4 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => (
              <tr key={skill.id} className="border-b border-[#d2d2d7]/20 last:border-0 hover:bg-[#f5f5f7]/50">
                <td className="px-4 py-3">
                  <button onClick={() => onViewSource(skill.path)} className="font-mono text-xs font-semibold text-[#0071e3] hover:underline text-left">
                    {skill.name}
                  </button>
                  <p className="text-[11px] text-[#86868b] mt-0.5">{skill.task_family}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    skill.freshness === "active"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}>
                    {skill.freshness}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ScoreBar score={skill.contract_score} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#6e6e73]">{skill.success_count}</td>
                <td className="px-4 py-3 text-xs text-[#86868b]">{skill.last_updated}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onViewSource(skill.path)} className="font-mono text-[10px] text-[#0071e3] hover:underline">
                    {skill.path}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChangelogTab({ entries, onViewSource }: { entries: ChangelogEntry[]; onViewSource: (file: string) => void }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-[#f5f5f7] p-12 text-center">
        <p className="text-sm text-[#86868b]">No changelog entries available.</p>
      </div>
    );
  }

  const byBrand = entries.reduce<Record<string, ChangelogEntry[]>>((acc, entry) => {
    const key = entry.brand || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-[#6e6e73]">
        Timeline of all system changes driven by extraction feedback and self-improvement.
      </p>

      {Object.entries(byBrand).map(([brand, items]) => (
        <div key={brand}>
          <h3 className="mb-3 text-lg font-semibold text-[#1d1d1f]">{brand}</h3>
          <div className="relative space-y-0 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-[#d2d2d7]">
            {items.map((entry, i) => {
              const ts = entry.timestamp ? new Date(entry.timestamp) : null;
              return (
                <div key={i} className="relative pb-4">
                  <div className="absolute -left-[1.125rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-blue-400 bg-white" />
                  <div className="rounded-xl border border-[#d2d2d7]/40 bg-white p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-[#86868b]">{ts ? ts.toLocaleString() : "—"}</span>
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
                        entry.change_type === "harness_change"
                          ? "border-purple-200 bg-purple-50 text-purple-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}>
                        {entry.change_type}
                      </span>
                      {entry.validation_before != null && entry.validation_after != null && (
                        <span className="text-[9px] font-mono">
                          <span className="text-red-600">{(entry.validation_before * 100).toFixed(0)}%</span>
                          <span className="text-[#86868b] mx-0.5">→</span>
                          <span className={entry.validation_after > entry.validation_before ? "text-green-700" : "text-red-700"}>
                            {(entry.validation_after * 100).toFixed(0)}%
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-5 text-[#1d1d1f]">{entry.description}</p>
                    {entry.affected_files && entry.affected_files.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.affected_files.map((f) => (
                          <button key={f} onClick={() => onViewSource(f)} className="font-mono text-[10px] rounded bg-[#f5f5f7] px-1.5 py-0.5 text-[#0071e3] hover:underline">
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedbackTab({ entries }: { entries: Record<string, unknown>[] }) {
  const [search, setSearch] = useState("");

  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-[#f5f5f7] p-12 text-center">
        <p className="text-sm text-[#86868b]">No feedback entries recorded yet.</p>
      </div>
    );
  }

  const filtered = entries.filter((e) => {
    if (!search) return true;
    return JSON.stringify(e).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-[#6e6e73]">
        Searchable log of all feedback captured during extractions. Each entry represents a learning signal.
      </p>

      <input
        type="text"
        placeholder="Search feedback..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 w-full max-w-md rounded-lg border border-[#d2d2d7] bg-[#f5f5f7] px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
      />

      <div className="space-y-2">
        {filtered.map((entry, i) => (
          <div key={i} className="rounded-xl border border-[#d2d2d7]/40 bg-white p-3">
            <pre className="font-mono text-[11px] text-[#4a4a4f] whitespace-pre-wrap leading-5">
              {JSON.stringify(entry, null, 2)}
            </pre>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[#86868b] py-4">No matching feedback entries.</p>
        )}
      </div>
    </div>
  );
}

function JobProgressTab({ slug, job, onViewSource }: { slug: string | null; job: Record<string, unknown> | null; onViewSource: (file: string) => void }) {
  if (!slug) {
    return (
      <div className="rounded-xl bg-[#f5f5f7] p-12 text-center">
        <p className="text-sm text-[#86868b]">No job selected. Navigate from a brand page's "Improve Quality" button, or select a brand below.</p>
      </div>
    );
  }

  const status = (job?.status as string) ?? "unknown";
  const score = job?.current_score as number | null;
  const target = job?.target_score as number | null;
  const iteration = job?.current_iteration as number | null;
  const maxIter = job?.max_iterations as number | null;
  const history = (job?.history as number[]) ?? [];
  const summary = job?.last_claude_summary as string | null;
  const logPath = job?.claude_log_path as string | null;
  const blocked = job?.blocked_reason as Record<string, string> | null;
  const pagesNeedingWork = (job?.pages_needing_work as unknown[]) ?? [];
  const scoreDir = job?.score_direction as string | null;

  const statusColors: Record<string, string> = {
    running: "text-blue-700 bg-blue-50 border-blue-200",
    completed: "text-green-700 bg-green-50 border-green-200",
    failed: "text-red-700 bg-red-50 border-red-200",
    stalled: "text-amber-700 bg-amber-50 border-amber-200",
    max_iterations_reached: "text-amber-700 bg-amber-50 border-amber-200",
    assisted_capture_required: "text-purple-700 bg-purple-50 border-purple-200",
    cancelled: "text-gray-700 bg-gray-50 border-gray-200",
  };
  const statusStyle = statusColors[status] ?? "text-gray-700 bg-gray-50 border-gray-200";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">Job: {slug}</h2>
          <p className="text-sm text-[#86868b]">
            {status === "running" ? "Improvement job is actively running. This page auto-refreshes every 3 seconds." : `Job ended with status: ${status}`}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyle}`}>
          {status === "running" && <span className="mr-1.5 size-2 rounded-full bg-blue-500 animate-pulse" />}
          {status}
        </span>
      </div>

      {!job && (
        <div className="rounded-xl bg-[#f5f5f7] p-8 text-center">
          <p className="text-sm text-[#86868b]">No job data found for this brand. Start an improvement from the brand page.</p>
        </div>
      )}

      {job && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
              <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                {score != null ? `${Math.round(score * 100)}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-[#86868b]">Current Score</p>
            </div>
            <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
              <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                {target != null ? `${Math.round(target)}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-[#86868b]">Target</p>
            </div>
            <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
              <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                {iteration ?? "—"} / {maxIter ?? "—"}
              </p>
              <p className="mt-1 text-xs text-[#86868b]">Iterations</p>
            </div>
            <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4">
              <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                {pagesNeedingWork.length}
              </p>
              <p className="mt-1 text-xs text-[#86868b]">Pages Needing Work</p>
            </div>
          </div>

          {history.length > 0 && (
            <div className="rounded-2xl border border-[#d2d2d7]/40 p-5">
              <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f]">Score History</h3>
              <div className="flex items-end gap-3 h-32">
                {history.map((s, i) => {
                  const pct = Math.round(s * 100);
                  const h = Math.max(pct, 5);
                  const color = pct >= (target ?? 80) ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400";
                  const dir = i > 0 && s < history[i - 1] ? "border-red-300 bg-red-50" : "";
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[10px] font-mono text-[#6e6e73]">{pct}%</span>
                      <div className={`w-full ${color} rounded-t ${dir}`} style={{ height: `${h}%` }} />
                      <span className="text-[10px] text-[#86868b]">#{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {blocked && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Blocked: {blocked.detail || blocked.code}</p>
              {blocked.code === "anti_bot_block" && (
                <p className="mt-2 text-xs text-red-700">
                  Run <code className="rounded bg-red-100 px-1">python3 scripts/ingest_assisted_capture.py --brand {slug} --screenshots-dir &lt;dir&gt;</code> to import manual captures.
                </p>
              )}
            </div>
          )}

          {summary && (
            <div className="rounded-2xl border border-[#d2d2d7]/40 p-5">
              <h3 className="mb-2 text-sm font-semibold text-[#1d1d1f]">Last Claude Summary</h3>
              <pre className="text-xs text-[#4a4a4f] whitespace-pre-wrap leading-5">{summary}</pre>
            </div>
          )}

          {logPath && (
            <div className="rounded-xl bg-[#f5f5f7] px-4 py-3">
              <p className="text-[12px] text-[#6e6e73]">Claude log: <code className="text-[#1d1d1f]">{logPath}</code></p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MonitoringPageWrapper() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center p-8"><p className="text-sm text-[#86868b]">Loading...</p></div>}>
      <MonitoringPage />
    </Suspense>
  );
}

function MonitoringPage() {
  const [skillsData, setSkillsData] = useState<SkillsRegistry | null>(null);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [feedback, setFeedback] = useState<Record<string, unknown>[]>([]);
  const [experiments, setExperiments] = useState<ExperimentEntry[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const [connected, setConnected] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [extractionState, setExtractionState] = useState<ExtractionState>("idle");
  const [inputUrl, setInputUrl] = useState("");
  const [inputName, setInputName] = useState("");
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready. Enter a URL to begin extraction.");
  const [resumableJob, setResumableJob] = useState<{ slug: string; jobs: { status?: string; agent?: string }[] } | null>(null);
  const [brandJobSlug, setBrandJobSlug] = useState<string | null>(null);
  const [brandJob, setBrandJob] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("extraction");

  const searchParams = useSearchParams();
  const wsRef = useState<WebSocket | null>(null);
  const pendingStartRef = useRef<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/monitoring/skills").then((r) => r.json()).then((data) => setSkillsData(data)).catch(() => {});
    fetch("/api/monitoring/changelog").then((r) => r.json()).then((data) => setChangelog(Array.isArray(data) ? data : [])).catch(() => {});
    fetch("/api/monitoring/feedback").then((r) => r.json()).then((data) => setFeedback(Array.isArray(data) ? data : [])).catch(() => {});
    fetch("/api/monitoring/experiments").then((r) => r.json()).then((data) => setExperiments(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const jobSlug = searchParams.get("job");
    if (jobSlug) {
      setBrandJobSlug(jobSlug);
      setActiveTab("job-progress");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!brandJobSlug) return;
    let interval: ReturnType<typeof setInterval>;
    const poll = () => {
      fetch(`/api/brands/${brandJobSlug}/jobs`)
        .then((r) => r.json())
        .then((jobs) => {
          if (Array.isArray(jobs) && jobs.length > 0) {
            setBrandJob(jobs[0] as Record<string, unknown>);
          }
        })
        .catch(() => {});
    };
    poll();
    interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [brandJobSlug]);

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
      wsRef[1](socket);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  const checkResumable = useCallback(async (url: string) => {
    const slug = deriveSlug(url);
    if (!slug) { setResumableJob(null); return; }
    try {
      const res = await fetch(`/api/extraction/status?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.exists && data.jobs?.some((j: { status?: string }) => j.status === "failed" || j.status === "stalled")) {
        setResumableJob({ slug, jobs: data.jobs });
      } else {
        setResumableJob(null);
      }
    } catch {
      setResumableJob(null);
    }
  }, []);

  function startExtraction() {
    if (!inputUrl.trim()) return;
    const name = inputName.trim() || deriveBrandName(inputUrl);
    const ws = wsRef[0];
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setExtractionState("running");
      setLogs([]);
      setAgentStatuses({});
      setCurrentScore(null);
      setFinalScore(null);
      setStatusMessage("Waiting for server connection...");
      addLog({ ts: new Date().toISOString(), agent: "system", level: "warn", message: "WebSocket server not running. Start it with: python3 scripts/ws_extraction_server.py" });
      addLog({ ts: new Date().toISOString(), agent: "system", level: "info", message: "The UI will connect automatically once the server starts." });
      pendingStartRef.current = { url: inputUrl, name };
      return;
    }
    ws.send(JSON.stringify({ type: "start_extraction", url: inputUrl, brand_name: name, max_pages: 5 }));
    setExtractionState("running");
    setLogs([]);
    setAgentStatuses({});
    setCurrentScore(null);
    setFinalScore(null);
    setStatusMessage("Starting extraction...");
  }

  function cancelExtraction() {
    const ws = wsRef[0];
    ws?.send(JSON.stringify({ type: "cancel" }));
    setExtractionState("idle");
    setStatusMessage("Extraction cancelled.");
  }

  function resumeExtraction() {
    const ws = wsRef[0];
    if (!inputUrl.trim()) return;
    const name = inputName.trim() || deriveBrandName(inputUrl);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "start_extraction", url: inputUrl, brand_name: name, max_pages: 5, resume: true }));
    }
    setExtractionState("running");
    setLogs([]);
    setAgentStatuses({});
    setCurrentScore(null);
    setFinalScore(null);
    setStatusMessage("Resuming extraction...");
    setResumableJob(null);
  }

  const handleViewSource = useCallback((file: string) => {
    setPreviewFile(file);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setInputUrl(url);
    if (!inputName && url) {
      setInputName(deriveBrandName(url));
    }
    checkResumable(url);
  }, [inputName, checkResumable]);

  const skills = skillsData?.skills ?? [];

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f7f9fc_0%,#ffffff_28%,#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8">
          <Badge variant="outline" className="mb-3">Monitoring</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">
            System Monitor
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6e6e73]">
            Run extractions, monitor the agent pipeline, and review skill quality, change history, and feedback signals.
          </p>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="mb-6 gap-0.5">
            <TabsTrigger value="extraction">Extraction</TabsTrigger>
            <TabsTrigger value="job-progress">Job Progress</TabsTrigger>
            <TabsTrigger value="agent-dag">Agent DAG</TabsTrigger>
            <TabsTrigger value="skills-progress">Skills Progress</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
            <TabsTrigger value="feedback">Feedback History</TabsTrigger>
          </TabsList>

          <TabsContent value="extraction">
            <ExtractionTab
              connected={connected}
              extractionState={extractionState}
              setExtractionState={setExtractionState}
              agentStatuses={agentStatuses}
              logs={logs}
              inputUrl={inputUrl}
              setInputUrl={handleUrlChange}
              inputName={inputName}
              setInputName={setInputName}
              currentScore={currentScore}
              finalScore={finalScore}
              statusMessage={statusMessage}
              onStart={startExtraction}
              onCancel={cancelExtraction}
              onResume={resumeExtraction}
              resumableJob={resumableJob}
            />
          </TabsContent>

          <TabsContent value="job-progress">
            <JobProgressTab slug={brandJobSlug} job={brandJob} onViewSource={handleViewSource} />
          </TabsContent>

          <TabsContent value="agent-dag">
            <AgentDAGTab experiments={experiments} onViewSource={handleViewSource} />
          </TabsContent>

          <TabsContent value="skills-progress">
            <SkillsProgressTab skills={skills} onViewSource={handleViewSource} />
          </TabsContent>

          <TabsContent value="changelog">
            <ChangelogTab entries={changelog} onViewSource={handleViewSource} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab entries={feedback} />
          </TabsContent>
        </Tabs>
      </div>

      <CodePreviewPanel file={previewFile} onClose={handleClosePreview} />
    </div>
  );
}
