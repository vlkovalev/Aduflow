export type GuardrailLeadInput = {
  estimatedPrice: number;
  estimateLow: number;
  propertyAddress: string;
  zoningZone: string;
  zoningDescription: string;
  reviewRisk: string;
};

export type BuilderGuardrails = {
  minProjectBudget: number;
  excludedMunicipalities: string;
};

export type GuardrailResult = {
  needsReview: boolean;
  reviewReasons: string[];
};

/**
 * Server-side, builder-configured checks that flag a lead for the builder's
 * own review queue instead of blocking homeowner submission
 * (docs/builder-activation-plan.md #4). Evaluated in app/api/leads/route.ts
 * against the values the server just validated, not anything the client
 * separately claims — a builder's minimum-budget or excluded-area rule can't
 * be bypassed by tampering with the configurator request.
 *
 * `needsReview` is purely informational: it never sets or gates lead
 * `status`/`proposalStatus`, which is what drives metered qualified-proposal
 * billing (see app/api/leads/[id]/route.ts). A guardrail flag must never
 * itself trigger or block a billing event.
 */
export function evaluateGuardrails(lead: GuardrailLeadInput, guardrails: BuilderGuardrails): GuardrailResult {
  const reasons: string[] = [];

  if (guardrails.minProjectBudget > 0) {
    // Prefer the low end of the range when available — the more conservative
    // number for a "is this even worth the builder's time" check.
    const projectValue = lead.estimateLow > 0 ? lead.estimateLow : lead.estimatedPrice;
    if (projectValue > 0 && projectValue < guardrails.minProjectBudget) {
      reasons.push(
        `Estimated budget (${Math.round(projectValue).toLocaleString()}) is below the builder's minimum project budget (${Math.round(
          guardrails.minProjectBudget,
        ).toLocaleString()}).`,
      );
    }
  }

  const excludedList = parseMunicipalityList(guardrails.excludedMunicipalities);
  if (excludedList.length > 0) {
    const haystack = `${lead.propertyAddress} ${lead.zoningZone} ${lead.zoningDescription}`.toLowerCase();
    const match = excludedList.find((town) => town && haystack.includes(town));
    if (match) {
      reasons.push(`Property address matches an excluded service area ("${match}").`);
    }
  }

  if (lead.reviewRisk === "High") {
    reasons.push("Zoning review risk is High — expect additional municipal review before permit approval.");
  }

  return { needsReview: reasons.length > 0, reviewReasons: reasons };
}

/** Splits a builder's free-text excluded-municipalities field into trimmed, lowercase terms. */
export function parseMunicipalityList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
