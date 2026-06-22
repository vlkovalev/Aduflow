import Stripe from "stripe";
import { readEnv } from "./env";

let stripeClient: Stripe | null = null;

/** Returns null when STRIPE_SECRET_KEY is unset — billing routes treat this as "not configured". */
export function getStripeClient(): Stripe | null {
  const secretKey = readEnv("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function getStripePriceId(): string | null {
  return readEnv("STRIPE_PRICE_ID") || null;
}

export function getStripeWebhookSecret(): string | null {
  return readEnv("STRIPE_WEBHOOK_SECRET") || null;
}

/**
 * Report one qualified-proposal usage unit to Stripe's Billing Meters API so
 * a builder's metered overage price (lib/billingPlans.ts) bills correctly.
 * Best-effort and non-blocking: the internal usage count in
 * lib/usageStore.ts is always the source of truth for what's shown in the
 * builder's billing page, regardless of whether this call succeeds. Requires
 * a Meter configured in the Stripe dashboard whose event name matches
 * STRIPE_METER_EVENT_NAME (defaults to "qualified_proposal").
 */
export async function reportQualifiedProposalUsage(stripeCustomerId: string): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) return;

  const eventName = readEnv("STRIPE_METER_EVENT_NAME") || "qualified_proposal";
  try {
    await stripe.billing.meterEvents.create({
      event_name: eventName,
      payload: { stripe_customer_id: stripeCustomerId, value: "1" },
    });
  } catch (e) {
    console.warn("Stripe meter event report failed (non-fatal — internal usage count is unaffected):", e);
  }
}
