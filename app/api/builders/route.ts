import { NextResponse } from "next/server";
import { getBuilderById } from "../../../lib/builderStore";
import { requireBuilder } from "../../../lib/apiAuth";

export const runtime = "nodejs";

/**
 * Previously this route listed every builder in the system (a tenant-data leak,
 * audit F-09) and allowed anonymous account creation with no password
 * (audit F-01). It now returns only the authenticated builder's own profile.
 * Account creation lives at POST /api/auth/register.
 */
export async function GET() {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const builder = await getBuilderById(auth.builderId);
    // Keep the historical `builders` array shape for backward compatibility,
    // but scoped strictly to the caller.
    return NextResponse.json({ builders: builder ? [builder] : [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load builder" },
      { status: 500 },
    );
  }
}

export function POST() {
  return NextResponse.json(
    { error: "Account creation has moved to POST /api/auth/register." },
    { status: 410 },
  );
}
