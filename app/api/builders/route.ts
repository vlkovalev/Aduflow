import { NextResponse } from "next/server";
import { listBuilders, createBuilder } from "../../../lib/builderStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const builders = await listBuilders();
    return NextResponse.json({ builders });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list builders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.companyName) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }

    const builder = await createBuilder(
      String(body.companyName),
      body.email ? String(body.email) : undefined,
      body.phone ? String(body.phone) : undefined
    );

    return NextResponse.json({ builder });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create builder" },
      { status: 500 },
    );
  }
}
