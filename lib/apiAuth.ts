import { NextResponse } from "next/server";
import { getAuthenticatedBuilderId } from "./auth";

/**
 * Require an authenticated builder session for an API route.
 *
 * Usage:
 *   const auth = await requireBuilder();
 *   if (auth.response) return auth.response;
 *   const builderId = auth.builderId; // narrowed to `string` by the guard above
 */
export async function requireBuilder(): Promise<
  | { builderId: string; response: null }
  | { builderId: null; response: NextResponse }
> {
  const builderId = await getAuthenticatedBuilderId();
  if (!builderId) {
    return {
      builderId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { builderId, response: null };
}
