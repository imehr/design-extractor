import { NextResponse } from "next/server";
import { getBrandDetail, getBrandFile } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; page: string }> }
) {
  const { slug, page } = await params;
  if (!/^[a-z0-9-]+$/.test(page)) {
    return new NextResponse("Invalid preview page", { status: 400 });
  }

  const brand = await getBrandDetail(slug);
  if (!brand) {
    return new NextResponse("Brand not found", { status: 404 });
  }

  const htmlPath = `dom-extraction/${page}-snapshot.html`;
  const htmlFile = await getBrandFile(slug, htmlPath);
  if (htmlFile) {
    const sourceUrl = await getSnapshotSourceUrl(slug, page);
    const baseHref = sourceUrl ?? getBrandSourceUrl(brand) ?? "about:blank";
    const localOrigin = publicOrigin(request);
    const html = await rewriteSnapshotHtml(htmlFile.toString("utf-8"), slug, baseHref, localOrigin);
    return new NextResponse(html, {
      headers: previewHeaders("text/html; charset=utf-8"),
    });
  }

  const screenshotPaths = [
    `dom-extraction/${page}-screenshot.png`,
    `screenshots/harness/repl-${page}.png`,
    `screenshots/reference/${page}.png`,
  ];
  for (const screenshotPath of screenshotPaths) {
    const screenshot = await getBrandFile(slug, screenshotPath);
    if (!screenshot) continue;
    return new NextResponse(
      renderScreenshotPreview(slug, page, screenshotPath),
      { headers: previewHeaders("text/html; charset=utf-8") }
    );
  }

  return new NextResponse("Preview not found", { status: 404 });
}

async function getSnapshotSourceUrl(slug: string, page: string): Promise<string | null> {
  const jsonFile = await getBrandFile(slug, `dom-extraction/${page}.json`);
  if (!jsonFile) return null;
  try {
    const payload = JSON.parse(jsonFile.toString("utf-8")) as { url?: unknown };
    return typeof payload.url === "string" ? payload.url : null;
  } catch {
    return null;
  }
}

function getBrandSourceUrl(brand: Awaited<ReturnType<typeof getBrandDetail>>): string | null {
  const sourceUrl = brand?.summary?.source_url;
  return typeof sourceUrl === "string" ? sourceUrl : null;
}

async function rewriteSnapshotHtml(html: string, slug: string, baseHref: string, localOrigin: string): Promise<string> {
  const safeBase = escapeHtmlAttribute(baseHref);
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  const withInlinedStyles = await inlineRemoteStylesheets(withoutScripts, slug, baseHref, localOrigin);
  const withLocalAssets = rewriteLocalAssetUrls(withInlinedStyles, slug, baseHref, localOrigin);
  const previewHead = [
    `<base href="${safeBase}" target="_blank">`,
    `<style>html,body{min-height:100%;background:#fff;} img,video,canvas,svg{max-width:100%;}</style>`,
  ].join("");

  if (/<head[^>]*>/i.test(withLocalAssets)) {
    return withLocalAssets.replace(/<head([^>]*)>/i, `<head$1>${previewHead}`);
  }

  return `<!doctype html><html><head>${previewHead}</head><body>${withLocalAssets}</body></html>`;
}

function rewriteLocalAssetUrls(html: string, slug: string, baseHref: string, localOrigin: string): string {
  const prefix = `${localOrigin}/brands/${slug}/`;
  let rewritten = html.replace(/(["'(])\/fonts\//g, `$1${prefix}fonts/`);
  try {
    const origin = new URL(baseHref).origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    rewritten = rewritten.replace(new RegExp(`${origin}/fonts/`, "g"), `${prefix}fonts/`);
  } catch {
    // Leave absolute URLs untouched if the source URL is not parseable.
  }
  return rewritten.replace(
    /https:\/\/(?:dc|px)\.ads\.linkedin\.com\/collect\?[^"'()\s<>]+/g,
    "data:image/gif;base64,R0lGODlhAQABAAAAACw="
  );
}

async function inlineRemoteStylesheets(html: string, slug: string, baseHref: string, localOrigin: string): Promise<string> {
  const stylesheetLinks = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /\brel=["']?stylesheet["']?/i.test(tag));
  if (stylesheetLinks.length === 0) return html;

  let rewritten = html;
  for (const tag of stylesheetLinks) {
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const cssUrl = resolveSameOriginUrl(href, baseHref);
    if (!cssUrl || !cssUrl.pathname.endsWith(".css")) continue;

    try {
      const response = await fetch(cssUrl.toString());
      if (!response.ok) continue;
      const css = rewriteLocalAssetUrls(await response.text(), slug, cssUrl.toString(), localOrigin).replace(/<\/style/gi, "<\\/style");
      rewritten = rewritten.replace(tag, `<style data-source="${escapeHtmlAttribute(cssUrl.toString())}">${css}</style>`);
    } catch {
      // Keep the original stylesheet link if the remote CSS cannot be fetched.
    }
  }
  return rewritten;
}

function resolveSameOriginUrl(href: string, baseHref: string): URL | null {
  try {
    const resolved = new URL(href, baseHref);
    const source = new URL(baseHref);
    return resolved.origin === source.origin ? resolved : null;
  } catch {
    return null;
  }
}

function publicOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host.includes("localhost:") ? "http" : "https");
  return `${protocol}://${host}`;
}

function renderScreenshotPreview(slug: string, page: string, screenshotPath: string): string {
  const src = `/api/brands/${encodeURIComponent(slug)}/file/${screenshotPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtmlText(page)} preview</title>
    <style>
      html, body { margin: 0; min-height: 100%; background: #fff; }
      img { display: block; width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <img src="${src}" alt="${escapeHtmlAttribute(page)} preview">
  </body>
</html>`;
}

function previewHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Security-Policy": [
      "default-src 'self' https: http: data: blob:",
      "script-src 'none'",
      "style-src 'self' https: http: 'unsafe-inline'",
      "img-src 'self' https: http: data: blob:",
      "font-src 'self' https: http: data:",
      "connect-src 'none'",
      "object-src 'none'",
      "frame-ancestors 'self'",
    ].join("; "),
  };
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
