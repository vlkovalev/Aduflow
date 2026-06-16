import { NextResponse } from "next/server";
import {
  getProjectMilestones,
  saveProjectMilestones,
} from "../../../../../lib/projectStore";
import { type ProjectMilestoneRecord } from "../../../../../lib/projectDefaults";
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
  const milestones = await getProjectMilestones(id);
  return NextResponse.json({ milestones });
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
    const milestones = validateMilestones(body.milestones);
    const saved = await saveProjectMilestones(id, milestones);
    return NextResponse.json({ milestones: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid milestone payload" },
      { status: 400 },
    );
  }
}

function validateMilestones(value: unknown): ProjectMilestoneRecord[] {
  if (!Array.isArray(value)) {
    throw new Error("milestones must be an array");
  }

  return value.map((item, index) => {
    const record = item as Partial<ProjectMilestoneRecord>;
    const status =
      record.status === "in_progress" || record.status === "complete"
        ? record.status
        : "pending";

    return {
      id: String(record.id ?? ""),
      label: String(record.label ?? ""),
      description: String(record.description ?? ""),
      date: String(record.date ?? ""),
      notes: String(record.notes ?? ""),
      status,
      sortOrder: Number(record.sortOrder ?? index + 1),
    };
  });
}
