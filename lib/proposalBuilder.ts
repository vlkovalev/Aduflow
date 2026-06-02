import type { LeadRecord } from "./leadStore";

export function buildProposalSections(lead: LeadRecord) {
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
        ["Permit path", lead.permitPath],
      ],
    },
    {
      title: "Budget",
      items: [
        ["Estimated package", formatCurrency(lead.estimatedPrice)],
        ["Budget range", `${formatCurrency(lead.estimateLow)} - ${formatCurrency(lead.estimateHigh)}`],
        ["Factory cost", formatCurrency(lead.factoryCost)],
        ["Site cost", formatCurrency(lead.siteCost)],
      ],
    },
    {
      title: "Design Envelope",
      items: [
        ["Model", lead.modelName],
        ["Square feet", `${lead.squareFeet} sq ft`],
        ["Max envelope", `${lead.maxSquareFeet} sq ft / ${lead.maxStories} story`],
        ["Setback target", lead.setbackTarget],
        ["Review risk", lead.reviewRisk],
        ["Timeline", `${lead.timelineWeeks} weeks`],
      ],
    },
  ];
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}
