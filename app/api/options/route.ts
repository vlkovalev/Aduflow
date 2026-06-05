import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "../../../lib/supabase";

export const runtime = "nodejs";

const VALID_CATEGORIES = ["finish", "foundation", "utilities", "site"] as const;

export async function GET() {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ options: [] });
  }

  const { data, error } = await supabase
    .from("options")
    .select("id, option_name, option_value, option_detail, option_category, option_price, is_active, sort_order")
    .order("option_category")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ options: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.optionName || !body.category || body.price === undefined) {
      return NextResponse.json(
        { error: "optionName, category, and price are required" },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }

    const name = String(body.optionName).trim();
    const { data, error } = await supabase
      .from("options")
      .insert({
        id: randomUUID(),
        option_name: name,
        option_value: body.optionValue ?? slugify(name),
        option_detail: String(body.detail ?? "").trim(),
        option_category: body.category,
        option_price: Number(body.price),
        is_active: true,
        sort_order: Number(body.sortOrder ?? 99),
      })
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

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
