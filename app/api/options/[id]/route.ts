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
    if (body.optionName !== undefined) {
      updates.option_name = String(body.optionName).trim();
      updates.option_value = body.optionValue ?? slugify(String(body.optionName));
    }
    if (body.detail !== undefined) updates.option_detail = String(body.detail).trim();
    if (body.price !== undefined) updates.option_price = Number(body.price);
    if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder);

    const { data, error } = await supabase
      .from("options")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ option: data });
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

  const { error } = await supabase.from("options").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
