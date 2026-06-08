import { NextResponse } from "next/server";
import { updateModel, deleteModel } from "../../../../lib/catalogStore";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: any = {};
    if (body.modelName !== undefined) updates.modelName = String(body.modelName);
    if (body.squareFeet !== undefined) updates.squareFeet = Number(body.squareFeet);
    if (body.basePrice !== undefined) updates.basePrice = Number(body.basePrice);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder);

    const model = await updateModel(id, updates);

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({ model });
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update model" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteModel(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
