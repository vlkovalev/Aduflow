import { NextResponse } from "next/server";
import { listModels, createModel } from "../../../lib/catalogStore";
import { requireBuilder } from "../../../lib/apiAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;
    const models = await listModels(auth.builderId);
    return NextResponse.json({ models });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list models" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const body = await request.json();

    const modelName = String(body.modelName ?? "").trim();
    const squareFeet = Number(body.squareFeet);
    const basePrice = Number(body.basePrice);

    if (!modelName) {
      return NextResponse.json({ error: "modelName is required" }, { status: 400 });
    }
    if (!Number.isFinite(squareFeet) || squareFeet <= 0) {
      return NextResponse.json({ error: "squareFeet must be greater than 0" }, { status: 400 });
    }
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return NextResponse.json({ error: "basePrice must be greater than 0" }, { status: 400 });
    }

    const model = await createModel({ modelName, squareFeet, basePrice }, auth.builderId);
    return NextResponse.json({ model });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create model" },
      { status: 400 },
    );
  }
}
