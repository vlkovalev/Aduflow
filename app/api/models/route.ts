import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ models: [] });
  }

  const { data, error } = await supabase
    .from("models")
    .select("id, model_name, model_code, square_feet, base_price, is_active, sort_order")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ models: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.modelName || !body.squareFeet || !body.basePrice) {
      return NextResponse.json({ error: "modelName, squareFeet, and basePrice are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("models")
      .insert({
        id: randomUUID(),
        model_name: String(body.modelName).trim(),
        model_code: slugify(String(body.modelName)),
        square_feet: Number(body.squareFeet),
        base_price: Number(body.basePrice),
        is_active: true,
        sort_order: Number(body.sortOrder ?? 99),
      })
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

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
