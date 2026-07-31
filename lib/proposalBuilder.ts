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

export function buildSelectedOptions(lead: LeadRecord): Array<[string, string]> {
  const config = (lead.configuration ?? {}) as Record<string, unknown>;
  const options: Array<[string, string]> = [
    ["Model", lead.modelName],
    ["Finish", humanizeOption(config.finish)],
    ["Foundation", humanizeOption(config.foundation)],
    ["Utilities", humanizeOption(config.utilities)],
    ["Site", humanizeOption(config.site)],
  ];

  return options.filter(([, value]) => value !== "Not captured");
}

/**
 * Plain-language "what this estimate assumes" list for the homeowner report
 * (docs/builder-activation-plan.md #3). Mixes lead-specific facts (zoning
 * source, manual overrides, review risk) with the fixed pricing assumption
 * so the package doesn't read as boilerplate.
 */
export function buildAssumptions(lead: LeadRecord): string[] {
  const items: string[] = [];
  const config = (lead.configuration ?? {}) as Record<string, unknown>;

  items.push(
    lead.zoningLookupStatus === "found"
      ? `Zoning details are based on ${formatZoningSource(lead.zoningSource).toLowerCase()} for this address, not an in-person site visit.`
      : "Zoning details were entered manually and have not been checked against a live municipal or provider data source.",
  );

  if (config.zoningOverridden) {
    const reason = typeof config.zoningOverrideReason === "string" ? config.zoningOverrideReason.trim() : "";
    items.push(`Lot constraints shown here were manually adjusted by the builder${reason ? `: ${reason}` : "."}`);
  }

  items.push(
    lead.reviewRisk === "High"
      ? "This property is flagged high review risk — expect additional municipal review time before permit approval."
      : "Municipal review risk is currently assessed as low-to-moderate based on the information available.",
  );

  items.push(
    "Pricing assumes the selected model, finish, foundation, utilities, and site options are unchanged after a site visit.",
  );

  return items;
}

/**
 * Fixed exclusion list — what a preliminary ADU package never covers,
 * regardless of the specific lead. Kept separate from buildAssumptions so
 * each list stays short and scannable in the homeowner report.
 */
export function buildExclusions(): string[] {
  return [
    "Permit, development, and utility connection fees charged directly by the municipality or utility",
    "Engineering, geotechnical, and survey costs beyond a standard allowance",
    "Site conditions discovered after construction begins (e.g. unsuitable soil, rock, or hidden utilities)",
    "Financing costs, property taxes, and homeowner-side legal fees",
    "Final scope, specifications, and price, which are set only by a signed contract with the builder",
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

function humanizeOption(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "Not captured";
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
