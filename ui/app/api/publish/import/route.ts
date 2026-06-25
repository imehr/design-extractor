import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { slug, name } = body as { slug: string; name?: string };

  if (!slug) {
    return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
  }

  const brandDir = path.join(os.homedir(), ".claude", "design-library", "brands", slug);

  let cmd = `npx @imehr/agentic-designer theme import ${brandDir}`;
  if (name) {
    cmd += ` --name ${name}`;
  }

  return new Promise<Response>((resolve) => {
    exec(cmd, { timeout: 120_000 }, async (error, stdout, stderr) => {
      if (error) {
        resolve(
          NextResponse.json({
            success: false,
            error: stderr || error.message,
          })
        );
        return;
      }

      // Update the index file
      const indexPath = path.join(
        os.homedir(),
        ".claude",
        "design-library",
        "design-systems-index.json"
      );

      try {
        let index: Record<string, any> = {};
        try {
          const raw = await fs.readFile(indexPath, "utf-8");
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const entry of parsed) {
              if (entry?.slug || entry?.id) {
                index[entry.slug || entry.id] = entry;
              }
            }
          } else if (typeof parsed === "object" && parsed !== null) {
            index = parsed;
          }
        } catch {
          // index doesn't exist yet, start fresh
        }

        index[slug] = { slug, name: name || slug, imported_at: new Date().toISOString() };

        await fs.mkdir(path.dirname(indexPath), { recursive: true });
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");

        resolve(
          NextResponse.json({
            success: true,
            output: stdout || "Import completed",
          })
        );
      } catch (writeError: any) {
        resolve(
          NextResponse.json({
            success: true,
            output: stdout || "Import completed",
            warning: "Import succeeded but failed to update index: " + writeError.message,
          })
        );
      }
    });
  });
}
