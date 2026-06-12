import { NextResponse } from "next/server";
import { createPermitPackage, getPermitPackageByLeadId, updatePermitPackage } from "../../../lib/permitStore";

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

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const leadId = url.searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    const updates = {
      packageStatus: body.packageStatus,
      jurisdictionName: body.jurisdictionName,
      permitPath: body.permitPath,
      hoaRequired: body.hoaRequired,
      revisionRound: body.revisionRound,
      applicationNumber: body.applicationNumber,
      cityContact: body.cityContact,
      submissionDate: body.submissionDate,
      approvalDate: body.approvalDate,
    };

    // Remove undefined values
    Object.keys(updates).forEach(
      (key) => {
        if (updates[key as keyof typeof updates] === undefined) {
          delete updates[key as keyof typeof updates];
        }
      }
    );

    const updated = await updatePermitPackage(leadId, updates);
    return NextResponse.json({ permitPackage: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update permit package" },
      { status: 400 },
    );
  }
}

