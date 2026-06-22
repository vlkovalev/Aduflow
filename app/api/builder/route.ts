import { NextResponse } from "next/server";
import { getBuilderCredentials, updateBuilderCredentials } from "../../../lib/builderStore";
import { getSupabaseServiceClient } from "../../../lib/supabase";
import { requireBuilder } from "../../../lib/apiAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const credentials = await getBuilderCredentials(auth.builderId);
    const isDbActive = getSupabaseServiceClient() !== null;
    // audit critical-process-audit.md §4/§14 — surfaced so the setup page can
    // build a correctly-scoped "Preview" link instead of falling back to the
    // default catalog.
    return NextResponse.json({ credentials, isDbActive, builderId: auth.builderId });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const body = await request.json();
    const insuranceExpiration = typeof body.insuranceExpiration === "string" ? body.insuranceExpiration : "";
    if (!isFutureDate(insuranceExpiration)) {
      return NextResponse.json(
        { error: "Insurance expiration date must be a valid future date." },
        { status: 400 },
      );
    }

    const credentials = await updateBuilderCredentials(body, auth.builderId);
    return NextResponse.json({ credentials });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function isFutureDate(value: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}
