import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, realpathSync } from "fs";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const ALLOWED_DIRS = ["agents", "skills", "commands", "hooks", "blueprints"];
const ALLOWED_FILES = ["HARNESS.md"];

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("file");
  if (!filePath) {
    return NextResponse.json({ error: "file parameter required" }, { status: 400 });
  }

  const normalized = path.normalize(filePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  const segments = normalized.split("/");
  const topLevel = segments[0];
  if (!ALLOWED_DIRS.includes(topLevel) && !ALLOWED_FILES.includes(normalized)) {
    return NextResponse.json({ error: "path not in allowed directories" }, { status: 403 });
  }

  const absolutePath = path.join(REPO_ROOT, normalized);
  try {
    const resolved = realpathSync(absolutePath);
    if (!resolved.startsWith(REPO_ROOT)) {
      return NextResponse.json({ error: "path traversal blocked" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "file not found", path: normalized }, { status: 404 });
  }

  if (!existsSync(absolutePath)) {
    return NextResponse.json({ error: "file not found", path: normalized }, { status: 404 });
  }

  try {
    const content = readFileSync(absolutePath, "utf-8");
    return NextResponse.json({
      path: normalized,
      content,
      size: content.length,
    });
  } catch {
    return NextResponse.json({ error: "read failed" }, { status: 500 });
  }
}
