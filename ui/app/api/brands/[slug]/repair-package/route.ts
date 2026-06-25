import { NextResponse } from "next/server";
import {
  normalizeRepairPackageMode,
  repairBrandPackage,
} from "@/lib/package-repair";

export const dynamic = "force-dynamic";

const REPAIR_PACKAGE_ROUTE_TIMEOUT_MS = 390000;
const REPAIR_PACKAGE_MODES = ["docs", "tokens", "assets", "identity", "all"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const mode = normalizeRepairPackageMode(body?.mode);
  void REPAIR_PACKAGE_MODES;

  try {
    const result = await withTimeout(
      repairBrandPackage(slug, mode),
      `Timed out while repairing ${mode} package evidence`
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Package repair failed" },
      {
        status: error instanceof RepairPackageRouteTimeoutError ? 504 : 400,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }
}

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new RepairPackageRouteTimeoutError(message)),
          REPAIR_PACKAGE_ROUTE_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

class RepairPackageRouteTimeoutError extends Error {}
