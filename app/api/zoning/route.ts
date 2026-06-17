import { NextResponse } from "next/server";
import { lookupZoning } from "../../../lib/zoningLookup";
import { clientIp, rateLimit } from "../../../lib/rateLimit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Public, unauthenticated endpoint that proxies a paid third-party API —
  // throttle to prevent cost-amplification abuse (audit finding).
  const ip = clientIp(request);
  const limit = rateLimit(`zoning:${ip}`, 20, 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address || address.trim().length === 0) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  if (address.trim().length < 6) {
    return NextResponse.json(
      { error: "address is too short — enter a full street address including city and province/state" },
      { status: 400 },
    );
  }

  const result = await lookupZoning(address.trim());

  if (!result) {
    return NextResponse.json({ result: null, configured: Boolean(process.env.ZONEOMICS_API_KEY) });
  }

  return NextResponse.json({ result });
}
