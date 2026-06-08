import { NextResponse } from "next/server";
import { updateOption, deleteOption } from "../../../../lib/catalogStore";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: any = {};
    if (body.optionName !== undefined) updates.optionName = String(body.optionName);
    if (body.detail !== undefined) updates.detail = String(body.detail);
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder);

    const option = await updateOption(id, updates);

    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    return NextResponse.json({ option });
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update option" },
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
    await deleteOption(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
