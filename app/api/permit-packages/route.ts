import { NextResponse } from "next/server";
import { createPermitPackage, getPermitPackageByLeadId } from "../../../lib/permitStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const leadId = url.searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  const permitPackage = await getPermitPackageByLeadId(leadId);

  return NextResponse.json({ permitPackage });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.leadId) {
      throw new Error("Missing leadId");
    }

    const permitPackage = await createPermitPackage(String(body.leadId), body.jurisdictionName);

    return NextResponse.json({
      id: permitPackage.id,
      permitUrl: `/permit/${permitPackage.leadId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create permit package" },
      { status: 400 },
    );
  }
}
