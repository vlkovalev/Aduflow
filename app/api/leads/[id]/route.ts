import { NextResponse } from "next/server";
import { getSupabaseServiceClient, markSupabaseUnhealthy } from "../../../../lib/supabase";
import { getLead } from "../../../../lib/leadStore";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getLocalStorePath } from "../../../../lib/localStoreHelper";
import { requireBuilder } from "../../../../lib/apiAuth";
import { recordQualifiedProposalUsage } from "../../../../lib/usageStore";
import { getBuilderBillingInfo, getBuilderById } from "../../../../lib/builderStore";
import { reportQualifiedProposalUsage } from "../../../../lib/stripe";
import { sendEmail } from "../../../../lib/email";
import type { LeadRecord } from "../../../../lib/leadStore";

export const runtime = "nodejs";

const VALID_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
type LeadStatus = (typeof VALID_STATUSES)[number];

const localStorePath = getLocalStorePath("leads.json");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBuilder();
  if (auth.response) return auth.response;

  const { id } = await params;
  const lead = await getLead(id);

  // Do not disclose existence of leads owned by another builder (IDOR fix).
  if (!lead || lead.builderId !== auth.builderId) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBuilder();
  if (auth.response) return auth.response;

  const { id } = await params;

  // Verify ownership before any mutation.
  const existingLead = await getLead(id);
  if (!existingLead || existingLead.builderId !== auth.builderId) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

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

    // Billing usage unit (docs/pricing-strategy.md): a lead counts toward a
    // builder's metered plan the moment they mark it "qualified" — not when
    // it was first created. Fires after the status write succeeds, below.
    const becameQualified = body.status === "qualified";

    const supabase = getSupabaseServiceClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("leads")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.warn("Supabase update lead error, disabling Supabase:", error);
          markSupabaseUnhealthy();
        } else if (data) {
          if (becameQualified) {
            await recordUsageAndReportToStripe(auth.builderId, id);
          }
          if (body.status !== undefined) {
            await notifyBuilderOfStatusChange(auth.builderId, existingLead, body.status as LeadStatus);
          }
          return NextResponse.json({ id: data.id, status: data.status, proposalStatus: data.proposal_status });
        }
      } catch (e) {
        console.warn("Supabase update lead exception, disabling Supabase:", e);
        markSupabaseUnhealthy();
      }
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

    if (becameQualified) {
      await recordUsageAndReportToStripe(auth.builderId, id);
    }
    if (body.status !== undefined) {
      await notifyBuilderOfStatusChange(auth.builderId, existingLead, body.status as LeadStatus);
    }

    return NextResponse.json({ id, status: records[index].status });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/**
 * Record qualified-proposal usage (idempotent per lead) and, only if this is
 * the first time this lead was qualified, best-effort report it to Stripe so
 * metered overage billing on the builder's plan stays in sync. Never throws —
 * a metering hiccup must not block the builder's lead-status update.
 */
async function recordUsageAndReportToStripe(builderId: string, leadId: string): Promise<void> {
  try {
    const isNewUsage = await recordQualifiedProposalUsage(builderId, leadId);
    if (!isNewUsage) return;
    const billing = await getBuilderBillingInfo(builderId);
    if (billing.stripeCustomerId) {
      await reportQualifiedProposalUsage(billing.stripeCustomerId);
    }
  } catch (e) {
    console.warn("recordUsageAndReportToStripe failed (non-fatal):", e);
  }
}

/** Best-effort — a failed/unconfigured email send must never block a status update. */
async function notifyBuilderOfStatusChange(builderId: string, lead: LeadRecord, newStatus: LeadStatus): Promise<void> {
  try {
    const builder = await getBuilderById(builderId);
    if (!builder?.email) return;
    await sendEmail({
      to: builder.email,
      subject: `Lead status updated: ${lead.customerName} → ${newStatus}`,
      html: `<p>${lead.customerName} (${lead.modelName} — ${lead.propertyAddress}) is now marked <strong>${newStatus}</strong>.</p>`,
    });
  } catch (e) {
    console.warn("notifyBuilderOfStatusChange failed (non-fatal):", e);
  }
}
