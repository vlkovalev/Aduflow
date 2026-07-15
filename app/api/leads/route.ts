import { NextResponse } from "next/server";
import { createLead, listLeads, type CreateLeadInput, type LeadRecord } from "../../../lib/leadStore";
import { requireBuilder } from "../../../lib/apiAuth";
import { builderHasProductAccess } from "../../../lib/apiAuth";
import { builderExists, getBuilderById } from "../../../lib/builderStore";
import { isUuid } from "../../../lib/auth";
import { clientIp, rateLimit } from "../../../lib/rateLimit";
import { sendEmail } from "../../../lib/email";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireBuilder();
  if (auth.response) return auth.response;
  const leads = await listLeads(auth.builderId);

  return NextResponse.json({
    leads: leads.map((lead) => ({
      id: lead.id,
      proposalNumber: lead.proposalNumber,
      customerName: lead.customerName,
      propertyAddress: lead.propertyAddress,
      modelName: lead.modelName,
      estimatedPrice: lead.estimatedPrice,
      proposalStatus: lead.proposalStatus,
      reviewRisk: lead.reviewRisk,
      feasibilityResult: lead.feasibilityResult,
      proposalUrl: `/proposals/${lead.id}`,
    })),
  });
}


export async function POST(request: Request) {
  // Public, unauthenticated endpoint — throttle spam/abuse (audit finding).
  const ip = clientIp(request);
  const limit = await rateLimit(`lead:${ip}`, 10, 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: Partial<CreateLeadInput> & { builderId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // The configurator is consumer-facing (no login), but a lead must be routed
  // to a real builder. Validate the target builder id rather than silently
  // defaulting to a magic UUID (audit F-02, BUG-15).
  const builderId = typeof body.builderId === "string" ? body.builderId.trim() : "";
  if (!isUuid(builderId)) {
    return NextResponse.json(
      { error: "A valid builderId is required to submit a lead." },
      { status: 400 },
    );
  }
  if (!(await builderExists(builderId))) {
    return NextResponse.json({ error: "Unknown builder." }, { status: 404 });
  }
  if (!(await builderHasProductAccess(builderId))) {
    return NextResponse.json({ error: "This builder is not currently accepting submissions." }, { status: 402 });
  }

  let validated: CreateLeadInput;
  try {
    validated = validateLead(body, builderId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create lead" },
      { status: 400 },
    );
  }

  try {
    const lead = await createLead(validated);
    const origin = new URL(request.url).origin;
    await notifyBuilderOfNewLead(lead, origin);
    await sendLeadConfirmationToHomeowner(lead, origin);
    return NextResponse.json({ id: lead.id, proposalUrl: `/proposals/${lead.id}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create lead" },
      { status: 500 },
    );
  }
}

/**
 * Best-effort — homeowners aren't logged in, so this confirmation email is
 * their only durable record of the share link if they close the tab. Uses
 * the public /proposals/share/{token} link, never the builder-internal
 * /proposals/{id} link (which now requires a builder session to view).
 */
async function sendLeadConfirmationToHomeowner(lead: LeadRecord, origin: string): Promise<void> {
  try {
    await sendEmail({
      to: lead.email,
      subject: `Your ADUflow feasibility package — ${lead.modelName}`,
      html: `
        <p>Thanks for checking ${escapeHtml(lead.propertyAddress)} on ADUflow. Your feasibility package for the
        <strong>${escapeHtml(lead.modelName)}</strong> is ready.</p>
        <p><a href="${origin}/proposals/share/${lead.shareToken}">View your proposal</a></p>
        <p>This is a pre-construction estimate for builder review — not a final quote, financing approval, or permit
        approval. The builder you submitted to will follow up with next steps.</p>
      `,
    });
  } catch (e) {
    console.warn("sendLeadConfirmationToHomeowner failed (non-fatal):", e);
  }
}

/** Best-effort — a failed/unconfigured email send must never fail lead creation. */
async function notifyBuilderOfNewLead(lead: LeadRecord, origin: string): Promise<void> {
  try {
    const builder = await getBuilderById(lead.builderId);
    if (!builder?.email) return;
    await sendEmail({
      to: builder.email,
      subject: `New lead: ${lead.customerName} — ${lead.modelName}`,
      html: `
        <p>A new homeowner lead came in through your ADUflow configurator.</p>
        <ul>
          <li><strong>Customer:</strong> ${escapeHtml(lead.customerName)}</li>
          <li><strong>Property:</strong> ${escapeHtml(lead.propertyAddress)}</li>
          <li><strong>Model:</strong> ${escapeHtml(lead.modelName)}</li>
          <li><strong>Estimated price:</strong> $${lead.estimatedPrice.toLocaleString()}</li>
        </ul>
        <p><a href="${origin}/proposals/${lead.id}">View the full proposal</a></p>
      `,
    });
  } catch {
    // Already best-effort inside sendEmail(); this guards any unexpected throw.
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim, length-cap, and strip control characters from free-text input. */
function cleanText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLen);
}

function nonNegativeNumber(value: unknown, label: string, errors: string[]): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    errors.push(`${label} must be a number.`);
    return 0;
  }
  if (n < 0) {
    errors.push(`${label} cannot be negative.`);
    return 0;
  }
  return n;
}

function validateLead(body: Partial<CreateLeadInput>, builderId: string): CreateLeadInput {
  const errors: string[] = [];

  const customerName = cleanText(body.customerName, 200);
  if (!customerName) errors.push("Customer name is required.");

  const email = cleanText(body.email, 254);
  if (!email) {
    errors.push("Email is required.");
  } else if (!EMAIL_RE.test(email)) {
    errors.push("Email is not a valid address.");
  }

  const phone = cleanText(body.phone, 40);
  if (phone && !/^[0-9 ()+\-.x]{0,40}$/i.test(phone)) {
    errors.push("Phone number contains invalid characters.");
  }

  const propertyAddress = cleanText(body.propertyAddress, 300);
  if (!propertyAddress) errors.push("Property address is required.");

  const parcelScenario = cleanText(body.parcelScenario, 100);
  if (!parcelScenario) errors.push("Parcel scenario is required.");

  const feasibilityResult = cleanText(body.feasibilityResult, 100);
  if (!feasibilityResult) errors.push("Feasibility result is required.");

  const permitPath = cleanText(body.permitPath, 100);
  if (!permitPath) errors.push("Permit path is required.");

  const modelCode = cleanText(body.modelCode, 100);
  if (!modelCode) errors.push("Model code is required.");

  const modelName = cleanText(body.modelName, 200);
  if (!modelName) errors.push("Model name is required.");

  const setbackTarget = cleanText(body.setbackTarget, 100);
  const reviewRisk = cleanText(body.reviewRisk, 100);

  const estimatedPrice = nonNegativeNumber(body.estimatedPrice, "Estimated price", errors);
  const estimateLow = nonNegativeNumber(body.estimateLow, "Estimate low", errors);
  const estimateHigh = nonNegativeNumber(body.estimateHigh, "Estimate high", errors);
  const factoryCost = nonNegativeNumber(body.factoryCost, "Factory cost", errors);
  const siteCost = nonNegativeNumber(body.siteCost, "Site cost", errors);
  const squareFeet = nonNegativeNumber(body.squareFeet, "Square feet", errors);
  const timelineWeeks = nonNegativeNumber(body.timelineWeeks, "Timeline weeks", errors);
  const maxSquareFeet = nonNegativeNumber(body.maxSquareFeet, "Max square feet", errors);
  const maxStories = nonNegativeNumber(body.maxStories, "Max stories", errors);

  if (estimateLow && estimateHigh && estimateLow > estimateHigh) {
    errors.push("Estimate low cannot exceed estimate high.");
  }

  if (body.configuration === undefined || body.configuration === null || typeof body.configuration !== "object") {
    errors.push("Configuration is required.");
  } else {
    const config = body.configuration as Record<string, unknown>;
    if (config.zoningOverridden === true && !String(config.zoningOverrideReason ?? "").trim()) {
      errors.push("A reason is required when overriding the zoning lot constraints.");
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return {
    builderId,
    customerName,
    email,
    phone,
    propertyAddress,
    parcelScenario,
    zoningSource: cleanText(body.zoningSource, 100),
    zoningZone: cleanText(body.zoningZone, 100),
    zoningDescription: cleanText(body.zoningDescription, 500),
    zoningRaw: (body.zoningRaw ?? null) as Record<string, unknown> | null,
    zoningLookupStatus: cleanText(body.zoningLookupStatus ?? "manual", 50),
    zoningCheckedAt: cleanText(body.zoningCheckedAt, 50),
    aduPermitted: typeof body.aduPermitted === "boolean" ? body.aduPermitted : null,
    setbackFront: cleanText(body.setbackFront, 50),
    setbackSide: cleanText(body.setbackSide, 50),
    setbackRear: cleanText(body.setbackRear, 50),
    feasibilityResult,
    feasibilityConfidence: Number(body.feasibilityConfidence ?? 0) || 0,
    permitPath,
    estimatedPrice,
    estimateLow,
    estimateHigh,
    factoryCost,
    siteCost,
    modelCode,
    modelName,
    squareFeet,
    timelineWeeks,
    maxSquareFeet,
    maxStories,
    setbackTarget,
    reviewRisk,
    configuration: body.configuration as Record<string, unknown>,
  } satisfies CreateLeadInput;
}
