import { NextResponse } from "next/server";
import { getAuthenticatedBuilderId } from "./auth";
import { getBuilderBillingInfo } from "./builderStore";

/**
 * Require an authenticated builder session for an API route.
 *
 * Usage:
 *   const auth = await requireBuilder();
 *   if (auth.response) return auth.response;
 *   const builderId = auth.builderId; // narrowed to `string` by the guard above
 */
export async function requireBuilderSession(): Promise<
  | { builderId: string; response: null }
  | { builderId: null; response: NextResponse }
> {
  const builderId = await getAuthenticatedBuilderId();
  if (!builderId) {
    return {
      builderId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { builderId, response: null };
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active"]);

export async function builderHasProductAccess(builderId: string): Promise<boolean> {
  const billing = await getBuilderBillingInfo(builderId);
  return billing.planId === "pilot" || ACTIVE_SUBSCRIPTION_STATUSES.has(billing.subscriptionStatus);
}

/**
 * Require an authenticated builder whose subscription is in good standing.
 * Not currently wired into any route — adopt per-route once you've decided
 * which features should be paywalled and what happens to existing builders
 * (all default to "trialing", so nothing is locked out until that changes).
 *
 * Usage:
 *   const auth = await requireActiveSubscription();
 *   if (auth.response) return auth.response;
 *   const builderId = auth.builderId;
 */
export async function requireActiveSubscription(): Promise<
  | { builderId: string; response: null }
  | { builderId: null; response: NextResponse }
> {
  const auth = await requireBuilderSession();
  if (auth.response) return auth;

  const billing = await getBuilderBillingInfo(auth.builderId);
  if (!(await builderHasProductAccess(auth.builderId))) {
    return {
      builderId: null,
      response: NextResponse.json(
        { error: "An active subscription is required.", subscriptionStatus: billing.subscriptionStatus },
        { status: 402 },
      ),
    };
  }
  return { builderId: auth.builderId, response: null };
}

/** Pilot accounts remain entitled; paid plans must be trialing or active. */
export const requireBuilderAccess = requireActiveSubscription;

/** Default product-route gate: authenticated and commercially entitled. */
export const requireBuilder = requireBuilderAccess;
