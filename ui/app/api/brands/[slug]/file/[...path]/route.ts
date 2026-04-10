import { NextResponse } from "next/server";
import { getBrandFile } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const { slug, path: pathParts } = await params;
  const relativePath = pathParts.join("/");
  const file = await getBrandFile(slug, relativePath);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }
  const contentType = getMimeType(relativePath);
  return new NextResponse(new Uint8Array(file), {
    headers: { "Content-Type": contentType },
  });
}

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    webp: "image/webp",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
    md: "text/markdown; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml; charset=utf-8",
  };
  return mimeTypes[ext ?? ""] ?? "application/octet-stream";
}
