import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../lib/supabase";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const VALID_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
type LeadStatus = (typeof VALID_STATUSES)[number];

const localStorePath = path.join(process.cwd(), ".data", "leads.json");

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status as LeadStatus)) {
        return NextResponse.json(
          { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    if (body.proposalStatus !== undefined) {
      updates.proposal_status = String(body.proposalStatus);
    }

    if (body.notes !== undefined) {
      updates.notes = String(body.notes);
    }

    const supabase = getSupabaseServiceClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("leads")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ id: data.id, status: data.status, proposalStatus: data.proposal_status });
    }

    // Local fallback
    const raw = await readFile(localStorePath, "utf8").catch(() => "[]");
    const records = JSON.parse(raw) as Array<Record<string, unknown>>;
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (body.status !== undefined) records[index].status = body.status;
    if (body.proposalStatus !== undefined) records[index].proposalStatus = body.proposalStatus;
    if (body.notes !== undefined) records[index].notes = body.notes;
    records[index].updatedAt = new Date().toISOString();

    await mkdir(path.dirname(localStorePath), { recursive: true });
    await writeFile(localStorePath, JSON.stringify(records, null, 2));

    return NextResponse.json({ id, status: records[index].status });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
