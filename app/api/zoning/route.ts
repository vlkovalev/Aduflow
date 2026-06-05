import { NextResponse } from "next/server";
import { lookupZoning } from "../../../lib/zoningLookup";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address || address.trim().length < 6) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const result = await lookupZoning(address.trim());

  if (!result) {
    return NextResponse.json({ result: null, configured: Boolean(process.env.ZONEOMICS_API_KEY) });
  }

  return NextResponse.json({ result });
}
