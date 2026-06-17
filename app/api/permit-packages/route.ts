import { NextResponse } from "next/server";
import { createPermitPackage, getPermitPackageByLeadId, updatePermitPackage } from "../../../lib/permitStore";
import { getLead } from "../../../lib/leadStore";
import { requireBuilder } from "../../../lib/apiAuth";

export const runtime = "nodejs";

/** Confirm the lead exists and belongs to the authenticated builder (IDOR fix). */
async function authorizeLead(
  leadId: string,
): Promise<{ builderId: string | null; response: NextResponse | null }> {
  const auth = await requireBuilder();
  if (auth.response) return { builderId: null, response: auth.response };
  const lead = await getLead(leadId);
  if (!lead || lead.builderId !== auth.builderId) {
    return { builderId: null, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { builderId: auth.builderId, response: null };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const leadId = url.searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  const authz = await authorizeLead(leadId);
  if (authz.response) return authz.response;

  const permitPackage = await getPermitPackageByLeadId(leadId);

  return NextResponse.json({ permitPackage });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.leadId) {
      throw new Error("Missing leadId");
    }

    const authz = await authorizeLead(String(body.leadId));
    if (authz.response) return authz.response;

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

  const authz = await authorizeLead(leadId);
  if (authz.response) return authz.response;

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.packageStatus !== undefined) updates.packageStatus = cleanText(body.packageStatus, 50);
    if (body.jurisdictionName !== undefined) updates.jurisdictionName = cleanText(body.jurisdictionName, 200);
    if (body.permitPath !== undefined) updates.permitPath = cleanText(body.permitPath, 100);
    if (body.hoaRequired !== undefined) updates.hoaRequired = Boolean(body.hoaRequired);
    if (body.revisionRound !== undefined) {
      const round = Number(body.revisionRound);
      if (!Number.isFinite(round) || round < 0) {
        return NextResponse.json({ error: "revisionRound must be a non-negative number." }, { status: 400 });
      }
      updates.revisionRound = round;
    }
    if (body.applicationNumber !== undefined) updates.applicationNumber = cleanText(body.applicationNumber, 100);
    if (body.cityContact !== undefined) updates.cityContact = cleanText(body.cityContact, 200);
    if (body.submissionDate !== undefined) updates.submissionDate = cleanText(body.submissionDate, 50);
    if (body.approvalDate !== undefined) updates.approvalDate = cleanText(body.approvalDate, 50);

    const updated = await updatePermitPackage(leadId, updates);
    return NextResponse.json({ permitPackage: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update permit package" },
      { status: 400 },
    );
  }
}

/** Trim, length-cap, and strip control characters from free-text input. */
function cleanText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLen);
}

