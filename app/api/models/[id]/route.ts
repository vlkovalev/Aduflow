import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.modelName !== undefined) {
      updates.model_name = String(body.modelName).trim();
      updates.model_code = body.modelName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    }
    if (body.squareFeet !== undefined) updates.square_feet = Number(body.squareFeet);
    if (body.basePrice !== undefined) updates.base_price = Number(body.basePrice);
    if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder);

    const { data, error } = await supabase
      .from("models")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ model: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;

  const { error } = await supabase.from("models").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
