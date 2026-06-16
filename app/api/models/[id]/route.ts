import { NextResponse } from "next/server";
import { updateModel, deleteModel } from "../../../../lib/catalogStore";
import { requireBuilder } from "../../../../lib/apiAuth";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.modelName !== undefined) updates.modelName = String(body.modelName);
    if (body.squareFeet !== undefined) updates.squareFeet = Number(body.squareFeet);
    if (body.basePrice !== undefined) updates.basePrice = Number(body.basePrice);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder);

    // Ownership-scoped update — a builder can only modify their own models.
    const model = await updateModel(id, updates, auth.builderId);

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({ model });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update model" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const { id } = await params;
    const ok = await deleteModel(id, auth.builderId);
    if (!ok) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete model" },
      { status: 500 },
    );
  }
}
