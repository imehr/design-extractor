import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET() {
  const registryPath = path.join(process.cwd(), "..", "state", "learning", "registry.json");
  if (!existsSync(registryPath)) {
    return NextResponse.json({ skills: [] });
  }
  try {
    const data = JSON.parse(readFileSync(registryPath, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ skills: [] });
  }
}
