import { NextResponse } from "next/server";
import { listOptions, createOption } from "../../../lib/catalogStore";
import { requireBuilder } from "../../../lib/apiAuth";

export const runtime = "nodejs";

const VALID_CATEGORIES = ["finish", "foundation", "utilities", "site"] as const;

export async function GET() {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;
    const options = await listOptions(auth.builderId);
    return NextResponse.json({ options });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list options" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireBuilder();
    if (auth.response) return auth.response;

    const body = await request.json();

    const optionName = String(body.optionName ?? "").trim();
    const category = String(body.category ?? "").trim();
    const price = Number(body.price);

    if (!optionName || !category || body.price === undefined) {
      return NextResponse.json(
        { error: "optionName, category, and price are required" },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "price must be 0 or greater" }, { status: 400 });
    }

    const option = await createOption(
      { optionName, detail: String(body.detail ?? ""), price, category },
      auth.builderId,
    );

    return NextResponse.json({ option });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create option" },
      { status: 400 },
    );
  }
}
