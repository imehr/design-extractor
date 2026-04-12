import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "..", "state", "learning", "experiments.jsonl");
  if (!existsSync(filePath)) {
    return NextResponse.json([]);
  }
  try {
    const raw = readFileSync(filePath, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line));
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}
