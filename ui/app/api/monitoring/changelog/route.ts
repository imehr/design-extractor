import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "..", "state", "learning", "changelog.json");
  if (!existsSync(filePath)) {
    return NextResponse.json([]);
  }
  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
