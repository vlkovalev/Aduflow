import { NextResponse } from "next/server";
import { getAuthenticatedBuilderId } from "./auth";

/**
 * Require an authenticated builder session for an API route.
 *
 * Returns both `builderId` and `response` always populated so callers do not
 * rely on discriminated-union narrowing (which is unavailable because this
 * project compiles with `strict: false` / `strictNullChecks: false`).
 *
 * Usage:
 *   const auth = await requireBuilder();
 *   if (auth.response) return auth.response;
 *   const builderId = auth.builderId; // non-null past the guard above
 */
export async function requireBuilder(): Promise<{
  builderId: string | null;
  response: NextResponse | null;
}> {
  const builderId = await getAuthenticatedBuilderId();
  if (!builderId) {
    return {
      builderId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { builderId, response: null };
}
