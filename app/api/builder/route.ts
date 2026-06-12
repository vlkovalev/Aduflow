import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBuilderCredentials, updateBuilderCredentials } from "../../../lib/builderStore";
import { getSupabaseServiceClient } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const builderId = cookieStore.get("builder_id")?.value;
    if (!builderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const credentials = await getBuilderCredentials(builderId);
    const isDbActive = getSupabaseServiceClient() !== null;
    return NextResponse.json({ credentials, isDbActive });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const builderId = cookieStore.get("builder_id")?.value;
    if (!builderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const credentials = await updateBuilderCredentials(body, builderId);
    return NextResponse.json({ credentials });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


