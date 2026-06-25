import { NextResponse } from "next/server";
import { buildDesignBundle } from "@/lib/design-bundle";

export const dynamic = "force-dynamic";

// Generating + zipping the export can take a few seconds for asset-heavy brands.
export const maxDuration = 120;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const bundle = await buildDesignBundle(slug);
    return new NextResponse(new Uint8Array(bundle.bytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bundle.filename}"`,
        "Content-Length": String(bundle.bytes.length),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Design bundle export failed" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
