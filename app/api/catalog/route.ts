import { NextResponse } from "next/server";
import { getPricingCatalog } from "../../../lib/catalogStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const builderId = url.searchParams.get("builderId") || "00000000-0000-0000-0000-000000000001";
  const catalog = await getPricingCatalog(builderId);

  return NextResponse.json({ catalog });
}

