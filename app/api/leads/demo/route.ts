import { NextResponse } from "next/server";
import { requireBuilder } from "../../../../lib/apiAuth";
import { createLead } from "../../../../lib/leadStore";
import { calculateProjectPrice, parcelScenarios } from "../../../../lib/pricingEngine";
import { getPricingCatalog } from "../../../../lib/catalogStore";
import { getBuilderCredentials } from "../../../../lib/builderStore";
import { detectCurrencyFromJurisdiction } from "../../../../lib/currency";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireBuilder();
  if (auth.response) return auth.response;

  const catalog = await getPricingCatalog(auth.builderId);
  const model = catalog.models[0];
  if (!model) {
    return NextResponse.json({ error: "Add at least one active model before creating a sandbox lead." }, { status: 400 });
  }

  const selected = {
    parcelType: parcelScenarios[0].value,
    modelCode: model.code,
    finish: catalog.optionGroups.finish?.[0]?.value ?? "essential",
    foundation: catalog.optionGroups.foundation?.[0]?.value ?? "slab",
    utilities: catalog.optionGroups.utilities?.[0]?.value ?? "standard",
    site: catalog.optionGroups.site?.[0]?.value ?? "urban",
    zoningMaxSqFt: Math.max(model.squareFeet + 120, 720),
    zoningMaxStories: 2,
    zoningSetbackSide: "4 ft",
    zoningSetbackRear: "4 ft",
    zoningReviewRisk: "Low" as const,
  };
  const estimate = calculateProjectPrice(selected, catalog);

  // Sandbox lead is always "100 Demo Lane, Vancouver, BC" — detect from that
  // jurisdiction, falling back to the builder's own default currency.
  const { currency: builderCurrency } = await getBuilderCredentials(auth.builderId);
  const currency = detectCurrencyFromJurisdiction("Vancouver, BC") ?? builderCurrency;

  const lead = await createLead({
    builderId: auth.builderId,
    currency,
    customerName: "Sandbox Homeowner",
    email: "sandbox-homeowner@example.com",
    phone: "(555) 010-0199",
    propertyAddress: "100 Demo Lane, Vancouver, BC",
    parcelScenario: selected.parcelType,
    zoningSource: "sandbox",
    zoningZone: "DEMO-RS",
    zoningDescription: "Sandbox zoning profile for builder testing",
    zoningRaw: { source: "sandbox", note: "Generated from Builder OS test lead action." },
    zoningLookupStatus: "found",
    zoningCheckedAt: new Date().toISOString(),
    aduPermitted: estimate.feasibility.fitsSize,
    setbackFront: "",
    setbackSide: selected.zoningSetbackSide,
    setbackRear: selected.zoningSetbackRear,
    feasibilityResult: estimate.feasibility.result,
    feasibilityConfidence: estimate.feasibility.confidence,
    permitPath: estimate.permitPath,
    estimatedPrice: estimate.total,
    estimateLow: estimate.low,
    estimateHigh: estimate.high,
    factoryCost: estimate.factoryCost,
    siteCost: estimate.siteCost,
    modelCode: estimate.model.code,
    modelName: `[Sandbox] ${estimate.model.name}`,
    squareFeet: estimate.model.squareFeet,
    timelineWeeks: estimate.timelineWeeks,
    maxSquareFeet: estimate.feasibility.maxSquareFeet,
    maxStories: estimate.feasibility.maxStories,
    setbackTarget: estimate.feasibility.setback,
    reviewRisk: estimate.feasibility.reviewRisk,
    configuration: {
      ...selected,
      modelName: estimate.model.name,
      drawMilestones: estimate.drawMilestones,
      sandbox: true,
    },
  });

  return NextResponse.json({
    lead,
    proposalUrl: `/proposals/${lead.id}`,
  });
}
