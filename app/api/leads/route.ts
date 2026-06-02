import { NextResponse } from "next/server";
import { createLead, listLeads, type CreateLeadInput } from "../../../lib/leadStore";

export const runtime = "nodejs";

export async function GET() {
  const leads = await listLeads();

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
  try {
    const body = await request.json();
    const lead = await createLead(validateLead(body));

    return NextResponse.json({
      id: lead.id,
      proposalUrl: `/proposals/${lead.id}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create lead",
      },
      { status: 400 },
    );
  }
}

function validateLead(body: Partial<CreateLeadInput>) {
  const required = [
    "customerName",
    "email",
    "propertyAddress",
    "parcelScenario",
    "feasibilityResult",
    "permitPath",
    "estimatedPrice",
    "estimateLow",
    "estimateHigh",
    "factoryCost",
    "siteCost",
    "modelCode",
    "modelName",
    "squareFeet",
    "timelineWeeks",
    "maxSquareFeet",
    "maxStories",
    "setbackTarget",
    "reviewRisk",
    "configuration",
  ] as const;

  for (const field of required) {
    if (body[field] === undefined || body[field] === "") {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    customerName: String(body.customerName),
    email: String(body.email),
    phone: String(body.phone ?? ""),
    propertyAddress: String(body.propertyAddress),
    parcelScenario: String(body.parcelScenario),
    feasibilityResult: String(body.feasibilityResult),
    feasibilityConfidence: Number(body.feasibilityConfidence ?? 0),
    permitPath: String(body.permitPath),
    estimatedPrice: Number(body.estimatedPrice),
    estimateLow: Number(body.estimateLow),
    estimateHigh: Number(body.estimateHigh),
    factoryCost: Number(body.factoryCost),
    siteCost: Number(body.siteCost),
    modelCode: String(body.modelCode),
    modelName: String(body.modelName),
    squareFeet: Number(body.squareFeet),
    timelineWeeks: Number(body.timelineWeeks),
    maxSquareFeet: Number(body.maxSquareFeet),
    maxStories: Number(body.maxStories),
    setbackTarget: String(body.setbackTarget),
    reviewRisk: String(body.reviewRisk),
    configuration: body.configuration as Record<string, unknown>,
  } satisfies CreateLeadInput;
}
