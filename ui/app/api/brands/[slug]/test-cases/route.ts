import { NextResponse } from "next/server";
import {
  addTestCaseFeedback,
  generateTestCases,
  getTestCases,
  setTestCaseModelOverride,
} from "@/lib/test-cases";

export const dynamic = "force-dynamic";

const TEST_CASE_ROUTE_TIMEOUT_MS = 180000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const manifest = await withTimeout(
      getTestCases(slug),
      "Timed out while loading test cases"
    );
    return noStoreJson(manifest);
  } catch (error) {
    return errorJson(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    if (body?.action === "feedback") {
      const manifest = await withTimeout(
        addTestCaseFeedback(slug, {
          caseId: String(body.caseId ?? ""),
          target: normalizeTarget(body.target),
          sentiment: body.sentiment === "works" ? "works" : "needs_work",
          note: String(body.note ?? ""),
        }),
        "Timed out while saving test case feedback"
      );
      return noStoreJson(manifest);
    }

    if (body?.action === "model-settings") {
      const manifest = await withTimeout(
        setTestCaseModelOverride(slug, {
          useDefault: Boolean(body.useDefault),
          providerId: typeof body.providerId === "string" ? body.providerId : undefined,
          model: typeof body.model === "string" ? body.model : undefined,
        }),
        "Timed out while saving test case model settings"
      );
      return noStoreJson(manifest);
    }

    const manifest = await withTimeout(
      generateTestCases(slug, {
        caseId: typeof body?.caseId === "string" ? body.caseId : undefined,
        mode:
          body?.action === "regenerate-all"
            ? "all"
            : body?.action === "generate-one"
              ? "one"
              : "missing",
      }),
      "Timed out while generating test cases"
    );
    return noStoreJson(manifest);
  } catch (error) {
    return errorJson(error);
  }
}

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new TestCaseRouteTimeoutError(message)), TEST_CASE_ROUTE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

class TestCaseRouteTimeoutError extends Error {}

function normalizeTarget(value: unknown): "design_md" | "skill" | "both" {
  if (value === "design_md" || value === "skill" || value === "both") return value;
  return "both";
}

function noStoreJson(payload: unknown) {
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function errorJson(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Test case action failed" },
    {
      status: error instanceof TestCaseRouteTimeoutError ? 504 : 400,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
