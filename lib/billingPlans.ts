import { readEnv } from "./env";

/**
 * Billing plan catalog — implements docs/pricing-strategy.md.
 *
 * Phase 0 (pilot): every builder defaults to "pilot" — free, unlimited,
 * no Stripe price attached. Nothing changes for existing pilot builders.
 *
 * Phase 1 (general availability): "starter" and "growth" are a low flat
 * base fee plus metered overage on QUALIFIED proposals — a lead the builder
 * has actually reviewed and marked "qualified" (see lib/usageStore.ts) —
 * never on raw inbound form-fills. This is the deliberate fix for the
 * Angi/HomeAdvisor "billed for garbage leads" failure mode documented in
 * the pricing strategy.
 *
 * Phase 2 (success fee) is not yet implemented here — it requires the
 * trust infrastructure (validated lender package, closed-deal reporting)
 * the pricing doc calls out as a precondition.
 */

export type PlanId = "pilot" | "starter" | "growth";

export type BillingPlan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly flat base price in USD. Null means not a paid/purchasable plan. */
  basePricePerMonth: number | null;
  /** Qualified proposals included per month before overage applies. Null = unlimited. */
  includedQualifiedProposals: number | null;
  /** USD charged per qualified proposal beyond the included amount. */
  overagePricePerProposal: number | null;
  /** Whether builders can self-serve checkout into this plan today. */
  isPubliclyPurchasable: boolean;
};

export const BILLING_PLANS: Record<PlanId, BillingPlan> = {
  pilot: {
    id: "pilot",
    name: "Pilot",
    tagline: "Free for builders in the guided ADUflow pilot.",
    basePricePerMonth: 0,
    includedQualifiedProposals: null,
    overagePricePerProposal: null,
    isPubliclyPurchasable: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "For one or two active ADU models and steady, low-volume leads.",
    basePricePerMonth: 149,
    includedQualifiedProposals: 5,
    overagePricePerProposal: 35,
    isPubliclyPurchasable: true,
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "For builders running multiple models, regions, or storefronts.",
    basePricePerMonth: 249,
    includedQualifiedProposals: 10,
    overagePricePerProposal: 30,
    isPubliclyPurchasable: true,
  },
};

export const PUBLIC_PLAN_ORDER: PlanId[] = ["starter", "growth"];

export function isPlanId(value: unknown): value is PlanId {
  return value === "pilot" || value === "starter" || value === "growth";
}

export function getPlan(planId: string | null | undefined): BillingPlan {
  if (isPlanId(planId)) return BILLING_PLANS[planId];
  return BILLING_PLANS.pilot;
}

/**
 * Stripe Price ids for a purchasable plan's recurring base charge and its
 * metered overage charge. Both env vars are optional — checkout returns a
 * clear "not configured" error (matching lib/stripe.ts's existing pattern)
 * until they're set in the Stripe dashboard and deployment environment.
 */
export function getStripePriceIdsForPlan(planId: PlanId): {
  basePriceId: string | null;
  meteredPriceId: string | null;
} {
  if (planId === "starter") {
    return {
      basePriceId: readEnv("STRIPE_PRICE_STARTER_BASE") || null,
      meteredPriceId: readEnv("STRIPE_PRICE_STARTER_METERED") || null,
    };
  }
  if (planId === "growth") {
    return {
      basePriceId: readEnv("STRIPE_PRICE_GROWTH_BASE") || null,
      meteredPriceId: readEnv("STRIPE_PRICE_GROWTH_METERED") || null,
    };
  }
  return { basePriceId: null, meteredPriceId: null };
}

/** Reverse-lookup a plan id from a Stripe base Price id seen on a subscription. */
export function getPlanIdForStripePriceId(stripePriceId: string | null | undefined): PlanId | null {
  if (!stripePriceId) return null;
  for (const planId of PUBLIC_PLAN_ORDER) {
    const { basePriceId } = getStripePriceIdsForPlan(planId);
    if (basePriceId && basePriceId === stripePriceId) return planId;
  }
  return null;
}
