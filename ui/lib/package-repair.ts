import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

type JsonRecord = Record<string, unknown>;

export type RepairPackageMode = "docs" | "tokens" | "assets" | "identity" | "all";

export interface PackageRepairResult {
  slug: string;
  mode: RepairPackageMode;
  status: "completed";
  updated_at: string;
  commands: Array<{
    command: string;
    args: string[];
    stdout: string;
    stderr: string;
  }>;
}

const execFileAsync = promisify(execFile);
const LIBRARY_ROOT = path.join(os.homedir(), ".claude", "design-library");
const REPO_ROOT = path.resolve(process.cwd(), "..");
const PUBLISH_SCRIPT = path.join(REPO_ROOT, "scripts/publish_brand.py");
const EXTRACT_SCRIPT = path.join(REPO_ROOT, "scripts/extract_brand.py");
const AGENT_BROWSER = "agent-browser";

export async function repairBrandPackage(
  slug: string,
  mode: RepairPackageMode
): Promise<PackageRepairResult> {
  const normalizedMode = normalizeRepairPackageMode(mode);
  const commands: PackageRepairResult["commands"] = [];
  const repairOrder = "Repair order: extract identity/assets, publish tokens/CSS, regenerate DESIGN.md, regenerate SKILL.md";

  if (normalizedMode === "assets" || normalizedMode === "identity" || normalizedMode === "all") {
    commands.push(...await cleanupAgentBrowserSessions(slug));
    const sourceUrl = await readSourceUrl(slug);
    if (!sourceUrl) {
      throw new Error("Cannot repair assets because metadata.source_url is missing.");
    }
    commands.push(await runCommand(
      "python3",
      [
        EXTRACT_SCRIPT,
        "--url",
        sourceUrl,
        "--skip-replicas",
        "--skip-validation",
        "--skip-publish",
      ],
      360000
    ));
  }

  if (normalizedMode === "docs" || normalizedMode === "identity") {
    commands.push(await runCommand("python3", [PUBLISH_SCRIPT, "--brand", slug, "--docs-only"], 120000));
  } else if (normalizedMode === "tokens") {
    commands.push(await runCommand("python3", [PUBLISH_SCRIPT, "--brand", slug, "--tokens-only"], 120000));
  } else if (normalizedMode === "all") {
    const publishResult = await runCommand("python3", [PUBLISH_SCRIPT, "--brand", slug], 180000);
    publishResult.stdout = `${repairOrder}\n${publishResult.stdout}`;
    commands.push(publishResult);
  } else if (normalizedMode === "assets") {
    commands.push(await runCommand("python3", [PUBLISH_SCRIPT, "--brand", slug, "--docs-only"], 120000));
  }

  return {
    slug,
    mode: normalizedMode,
    status: "completed",
    updated_at: new Date().toISOString(),
    commands,
  };
}

export function normalizeRepairPackageMode(value: unknown): RepairPackageMode {
  if (value === "docs" || value === "tokens" || value === "assets" || value === "identity" || value === "all") {
    return value;
  }
  return "docs";
}

async function cleanupAgentBrowserSessions(
  slug: string
): Promise<PackageRepairResult["commands"]> {
  const commands: PackageRepairResult["commands"] = [];
  try {
    const listResult = await runCommand(AGENT_BROWSER, ["session", "list"], 15000);
    commands.push(listResult);
    const sessions = parseAgentBrowserSessions(listResult.stdout)
      .filter((session) => shouldCloseAgentBrowserSession(session, slug))
      .slice(0, 60);

    for (const session of sessions) {
      commands.push(await runBestEffortCommand(AGENT_BROWSER, ["close", "--session", session], 8000));
    }
  } catch (error) {
    commands.push({
      command: AGENT_BROWSER,
      args: ["session", "list"],
      stdout: "",
      stderr: `agent-browser cleanup skipped: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
  return commands;
}

function parseAgentBrowserSessions(output: string): string[] {
  return output
    .split("\n")
    .map((line) => line.replace(/^→\s*/, "").trim())
    .filter((line) => line && line !== "Active sessions:" && line !== "default");
}

function shouldCloseAgentBrowserSession(session: string, slug: string): boolean {
  if (session === `assets-${slug}` || session === `dl-${slug}`) return true;
  if (session.startsWith(`dom-${slug}-`)) return true;
  if (session.startsWith("cv-o-") || session.startsWith("cv-r-")) return true;
  if (
    session.startsWith("verify-") ||
    session.startsWith("recon-") ||
    session.startsWith("orig-") ||
    session.startsWith("repl-")
  ) {
    const timestamp = Number(session.split("-").at(-1));
    const nowSeconds = Math.floor(Date.now() / 1000);
    return Number.isFinite(timestamp) ? timestamp < nowSeconds - 30 : true;
  }
  return false;
}

async function runCommand(
  command: string,
  args: string[],
  timeout: number
): Promise<PackageRepairResult["commands"][number]> {
  const result = await execFileAsync(command, args, {
    cwd: REPO_ROOT,
    timeout,
    maxBuffer: 12 * 1024 * 1024,
  });
  return {
    command,
    args,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function runBestEffortCommand(
  command: string,
  args: string[],
  timeout: number
): Promise<PackageRepairResult["commands"][number]> {
  try {
    return await runCommand(command, args, timeout);
  } catch (error) {
    return {
      command,
      args,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

async function readSourceUrl(slug: string): Promise<string | null> {
  const metadataPath = path.join(LIBRARY_ROOT, "brands", slug, "metadata.json");
  try {
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8")) as JsonRecord;
    const sourceUrl = metadata.source_url;
    return typeof sourceUrl === "string" && sourceUrl.trim() ? sourceUrl.trim() : null;
  } catch {
    return null;
  }
}
