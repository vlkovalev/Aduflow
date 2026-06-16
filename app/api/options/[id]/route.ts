import { NextResponse } from "next/server";
import { updateOption, deleteOption } from "../../../../lib/catalogStore";
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
    if (body.optionName !== undefined) updates.optionName = String(body.optionName);
    if (body.detail !== undefined) updates.detail = String(body.detail);
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder);

    // Ownership-scoped update — a builder can only modify their own options.
    const option = await updateOption(id, updates, auth.builderId);

    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    return NextResponse.json({ option });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update option" },
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
    const ok = await deleteOption(id, auth.builderId);
    if (!ok) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete option" },
      { status: 500 },
    );
  }
}
