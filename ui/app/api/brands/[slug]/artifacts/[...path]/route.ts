import { NextResponse } from "next/server";
import { getBrandArtifactFile } from "@/lib/artifacts";

export const dynamic = "force-dynamic";

/**
 * Serve per-brand artifact files from <repo>/brands/<slug>/<...path>.
 * Directory structure is preserved, so relative references inside served
 * HTML (assets/..., ../original/<page>/index.html) resolve through this
 * same route. Path traversal is rejected in getBrandArtifactFile.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const { slug, path: pathParts } = await params;
  const relativePath = pathParts.map((p) => decodeURIComponent(p)).join("/");
  const file = await getBrandArtifactFile(slug, relativePath);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }
  const contentType = getMimeType(relativePath);
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store, max-age=0",
  };
  // Mirrored third-party HTML/SVG must never run in the app's origin —
  // an opaque sandbox origin blocks credentialed calls to our API routes
  // (BYOK/settings) while still letting compare.html's own scripts run.
  if (contentType.startsWith("text/html") || contentType.startsWith("image/svg")) {
    headers["Content-Security-Policy"] = "sandbox allow-scripts";
  }
  return new NextResponse(new Uint8Array(file), { headers });
}

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    webp: "image/webp",
    avif: "image/avif",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    eot: "application/vnd.ms-fontobject",
    mp4: "video/mp4",
    webm: "video/webm",
    md: "text/plain; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml; charset=utf-8",
  };
  return mimeTypes[ext ?? ""] ?? "application/octet-stream";
}
