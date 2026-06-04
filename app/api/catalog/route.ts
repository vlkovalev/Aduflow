import { NextResponse } from "next/server";
import { getPricingCatalog } from "../../../lib/catalogStore";

export const runtime = "nodejs";

export async function GET() {
  const catalog = await getPricingCatalog();

  return NextResponse.json({ catalog });
}
