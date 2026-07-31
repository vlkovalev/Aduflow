import { NextResponse } from "next/server";
import { getBuilderPublicProfile } from "../../../../lib/builderStore";
import { clientIp, rateLimit } from "../../../../lib/rateLimit";

export const runtime = "nodejs";

/**
 * Public, unauthenticated lookup of a builder's display name only (no
 * email/phone/credentials). Backs the branded /for-builder/[builderId]
 * link and the "Configuring for {companyName}" header in the configurator.
 * Rate-limited because builderId is a guessable-length UUID param and this
 * endpoint would otherwise let someone enumerate which builder ids are live.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const limit = await rateLimit(`builder-public:${ip}`, 30, 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const builderId = url.searchParams.get("builderId")?.trim();
  if (!builderId) {
    return NextResponse.json({ error: "builderId is required" }, { status: 400 });
  }

  const profile = await getBuilderPublicProfile(builderId);
  if (!profile) {
    return NextResponse.json({ error: "Builder not found" }, { status: 404 });
  }

  return NextResponse.json({ companyName: profile.companyName });
}
