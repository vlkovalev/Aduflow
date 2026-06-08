import { NextResponse } from "next/server";
import { getBuilderCredentials, updateBuilderCredentials } from "../../../lib/builderStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const credentials = await getBuilderCredentials();
    return NextResponse.json({ credentials });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const credentials = await updateBuilderCredentials(body);
    return NextResponse.json({ credentials });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
