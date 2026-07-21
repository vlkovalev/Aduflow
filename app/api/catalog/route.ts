import { NextResponse } from "next/server";
import { getPricingCatalog } from "../../../lib/catalogStore";
import { isUuid } from "../../../lib/auth";
import { builderHasProductAccess } from "../../../lib/apiAuth";
import { getBuilderCredentials } from "../../../lib/builderStore";

export const runtime = "nodejs";

/**
 * Public, consumer-facing catalog read used by the configurator. It requires a
 * valid builder id rather than silently serving a shared "magic" tenant's
 * catalog (audit F-02). An unknown/invalid id simply yields an empty catalog,
 * and the configurator falls back to its bundled default.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const builderId = url.searchParams.get("builderId")?.trim() ?? "";

  if (!isUuid(builderId)) {
    return NextResponse.json(
      { error: "A valid builderId query parameter is required." },
      { status: 400 },
    );
  }
  if (!(await builderHasProductAccess(builderId))) {
    return NextResponse.json({ error: "This builder catalog is not currently available." }, { status: 402 });
  }

  const catalog = await getPricingCatalog(builderId);
  // Only the currency default is exposed here — this is a public,
  // unauthenticated endpoint, so no other credential fields are returned.
  const { currency } = await getBuilderCredentials(builderId);
  return NextResponse.json({ catalog, currency });
}

