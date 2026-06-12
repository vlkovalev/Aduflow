import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listOptions, createOption } from "../../../lib/catalogStore";

export const runtime = "nodejs";

const VALID_CATEGORIES = ["finish", "foundation", "utilities", "site"] as const;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const builderId = cookieStore.get("builder_id")?.value || "00000000-0000-0000-0000-000000000001";
    const options = await listOptions(builderId);
    return NextResponse.json({ options });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.optionName || !body.category || body.price === undefined) {
      return NextResponse.json(
        { error: "optionName, category, and price are required" },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const builderId = cookieStore.get("builder_id")?.value || "00000000-0000-0000-0000-000000000001";

    const option = await createOption({
      optionName: String(body.optionName),
      detail: String(body.detail ?? ""),
      price: Number(body.price),
      category: String(body.category),
    }, builderId);

    return NextResponse.json({ option });
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create option" },
      { status: 400 }
    );
  }
}

