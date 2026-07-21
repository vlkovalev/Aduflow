import type { LeadRecord } from "./leadStore";
import { formatCurrency as formatCurrencyWithCode } from "./currency";

// Re-exported so existing call sites (`import { formatCurrency } from
// "../../lib/proposalBuilder"`) keep working. The real implementation now
// lives in lib/currency.ts, which also exposes jurisdiction-based USD/CAD
// detection — this file used to have its own hardcoded en-CA/CAD copy.
export { formatCurrency } from "./currency";

export function buildProposalSections(lead: LeadRecord) {
  const currency = lead.currency ?? "CAD";
  const money = (value: number) => formatCurrencyWithCode(value, currency);
  return [
    {
      title: "Project Snapshot",
      items: [
        ["Proposal", lead.proposalNumber],
        ["Homeowner", lead.customerName],
        ["Property", lead.propertyAddress],
        ["Status", lead.proposalStatus],
      ],
    },
    {
      title: "Feasibility",
      items: [
        ["Result", lead.feasibilityResult],
        ["Confidence", `${lead.feasibilityConfidence}%`],
        ["Source", formatZoningSource(lead.zoningSource)],
        ["Zone", lead.zoningZone || "Not captured"],
        ["Zoning description", lead.zoningDescription || "Not captured"],
        ["Permit path", lead.permitPath],
      ],
    },
    {
      title: "Budget",
      items: [
        ["Estimated package", money(lead.estimatedPrice)],
        ["Budget range", `${money(lead.estimateLow)} - ${money(lead.estimateHigh)}`],
        ["Factory cost", money(lead.factoryCost)],
        ["Site cost", money(lead.siteCost)],
      ],
    },
    {
      title: "Design Envelope",
      items: [
        ["Model", lead.modelName],
        ["Square feet", `${lead.squareFeet} sq ft`],
        ["Max envelope", `${lead.maxSquareFeet} sq ft / ${lead.maxStories} story`],
        ["Setback target", lead.setbackTarget],
        ["Front setback", lead.setbackFront || "Confirm"],
        ["Side setback", lead.setbackSide || "Confirm"],
        ["Rear setback", lead.setbackRear || "Confirm"],
        ["Review risk", lead.reviewRisk],
        ["Timeline", `${lead.timelineWeeks} weeks`],
      ],
    },
  ];
}

export function buildNextSteps(lead: LeadRecord): string[] {
  const steps: string[] = [];

  // Always first
  steps.push("Builder confirms parcel and scope assumptions");

  // HOA branch
  if (lead.permitPath.toLowerCase().includes("design") || lead.parcelScenario.includes("hoa")) {
    steps.push("HOA architectural review package prepared");
  }

  // Risk-dependent
  if (lead.reviewRisk === "High") {
    steps.push("Site survey ordered before permit submittal");
  } else {
    steps.push("Permit and HOA checklist generated");
  }

  // Servicing flag
  if (lead.reviewRisk === "High" || lead.permitPath.toLowerCase().includes("enhanced")) {
    steps.push("Utility tie-in scope confirmed with local authority");
  }

  // Always last two
  steps.push("Lender draw package reviewed and approved");
  steps.push("Proposal moves to signed contract");

  return steps.slice(0, 4);
}

export function formatZoningSource(source: string) {
  if (source === "municipal_open_data") return "Live municipal open-data result";
  if (source === "zoneomics") return "Live zoning provider result";
  if (source === "municipal_fallback") return "Municipal fallback estimate";
  if (source === "manual") return "Manual assumption";
  return source || "Manual assumption";
}
