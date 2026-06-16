import { NextResponse } from "next/server";
import {
  getDrawMilestones,
  saveDrawMilestones,
} from "../../../../../lib/projectStore";
import { type DrawMilestoneRecord } from "../../../../../lib/projectDefaults";
import { getLead } from "../../../../../lib/leadStore";
import { requireBuilder } from "../../../../../lib/apiAuth";

export const runtime = "nodejs";

/** Confirm the project (lead) belongs to the authenticated builder (IDOR fix). */
async function authorizeProject(id: string): Promise<{ response: NextResponse | null }> {
  const auth = await requireBuilder();
  if (auth.response) return { response: auth.response };
  const lead = await getLead(id);
  if (!lead || lead.builderId !== auth.builderId) {
    return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { response: null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authz = await authorizeProject(id);
  if (authz.response) return authz.response;
  const draws = await getDrawMilestones(id);
  return NextResponse.json({ draws });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authz = await authorizeProject(id);
  if (authz.response) return authz.response;

  try {
    const body = await request.json();
    const draws = validateDraws(body.draws);
    const saved = await saveDrawMilestones(id, draws);
    return NextResponse.json({ draws: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid draw payload" },
      { status: 400 },
    );
  }
}

function validateDraws(value: unknown): DrawMilestoneRecord[] {
  if (!Array.isArray(value)) {
    throw new Error("draws must be an array");
  }

  return value.map((item, index) => {
    const record = item as Partial<DrawMilestoneRecord>;
    const status =
      record.status === "pending_verification" || record.status === "released"
        ? record.status
        : "not_started";

    return {
      id: String(record.id ?? ""),
      stage: String(record.stage ?? "Milestone"),
      percent: Number(record.percent ?? 0),
      status,
      evidenceNotes: String(record.evidenceNotes ?? ""),
      releasedAt: String(record.releasedAt ?? ""),
      sortOrder: Number(record.sortOrder ?? index + 1),
    };
  });
}
