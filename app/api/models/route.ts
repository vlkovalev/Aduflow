import { NextResponse } from "next/server";
import { listModels, createModel } from "../../../lib/catalogStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const models = await listModels();
    return NextResponse.json({ models });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.modelName || !body.squareFeet || !body.basePrice) {
      return NextResponse.json({ error: "modelName, squareFeet, and basePrice are required" }, { status: 400 });
    }

    const model = await createModel({
      modelName: String(body.modelName),
      squareFeet: Number(body.squareFeet),
      basePrice: Number(body.basePrice),
    });

    return NextResponse.json({ model });
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create model" },
      { status: 400 }
    );
  }
}
