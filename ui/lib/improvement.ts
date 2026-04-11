import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { randomUUID } from "crypto";


export interface ImprovementJobState {
  job_id: string;
  brand: string;
  target_score: number;
  base_url: string;
  status: string;
  max_iterations: number;
  current_iteration: number;
  current_score: number | null;
  pages_needing_work: Array<Record<string, unknown>>;
  blocked_reason: Record<string, string> | null;
  assisted_capture_steps: string[];
  feedback: Record<string, unknown>;
  history: number[];
  updated_at: string;
}


function getCacheDir(slug: string): string {
  return path.join(os.homedir(), ".claude", "design-library", "cache", slug);
}


function getJobsDir(slug: string): string {
  return path.join(getCacheDir(slug), "jobs");
}


export function getJobPath(slug: string, jobId: string): string {
  return path.join(getJobsDir(slug), `${jobId}.json`);
}


export async function readJobState(
  slug: string,
  jobId: string
): Promise<ImprovementJobState | null> {
  try {
    const raw = await fs.readFile(getJobPath(slug, jobId), "utf-8");
    return JSON.parse(raw) as ImprovementJobState;
  } catch {
    return null;
  }
}


export async function startImprovementJob(
  slug: string,
  options: { targetScore?: number; feedback?: Record<string, unknown> } = {}
): Promise<ImprovementJobState | null> {
  const projectRoot = path.resolve(process.cwd(), "..");
  const scriptPath = path.join(projectRoot, "scripts", "run_improvement_job.py");
  const jobId = randomUUID().replace(/-/g, "").slice(0, 12);
  const args = [
    scriptPath,
    "--brand",
    slug,
    "--job-id",
    jobId,
    "--base-url",
    "http://localhost:5173",
    "--target",
    String(options.targetScore ?? 80),
  ];

  if (options.feedback && Object.keys(options.feedback).length > 0) {
    args.push("--feedback-json", JSON.stringify(options.feedback));
  }

  const child = spawn("python3", args, {
    cwd: projectRoot,
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  const jobPath = getJobPath(slug, jobId);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const raw = await fs.readFile(jobPath, "utf-8");
      return JSON.parse(raw) as ImprovementJobState;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  return null;
}
