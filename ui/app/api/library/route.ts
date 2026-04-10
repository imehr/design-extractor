import { NextResponse } from "next/server";
import { getLibraryIndex } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET() {
  const index = await getLibraryIndex();
  return NextResponse.json(index);
}
