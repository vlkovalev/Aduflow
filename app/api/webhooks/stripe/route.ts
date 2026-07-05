import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient, getStripeWebhookSecret } from "../../../../lib/stripe";
import { updateBuilderSubscriptionByStripeCustomerId } from "../../../../lib/builderStore";
import {
  getPlanIdForStripePriceId,
  getStripePriceIdsForPlan,
  isPlanId,
} from "../../../../lib/billingPlans";

export const runtime = "nodejs";

/**
 * Stripe calls this directly — there is no builder session to check. Trust is
 * established entirely by verifying the request signature against
 * STRIPE_WEBHOOK_SECRET, not by auth/rate-limiting like the rest of the app's
 * public routes.
 */
export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.customer === "string" && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(session.customer, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        if (typeof subscription.customer === "string") {
          await syncSubscription(subscription.customer, subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(stripeCustomerId: string, subscription: Stripe.Subscription) {
  // Prefer explicit checkout metadata. Otherwise inspect every item because
  // a mixed fixed-and-metered subscription has no dependable item ordering.
  const metadataPlanId = subscription.metadata?.planId;
  const configuredPlanId = isPlanId(metadataPlanId) ? metadataPlanId : null;
  const configuredBasePriceId = configuredPlanId
    ? getStripePriceIdsForPlan(configuredPlanId).basePriceId
    : null;
  const matchedBaseItem = configuredBasePriceId
    ? subscription.items.data.find((item) => item.price.id === configuredBasePriceId)
    : subscription.items.data.find((item) => getPlanIdForStripePriceId(item.price.id));
  const basePriceId = matchedBaseItem?.price.id ?? configuredBasePriceId ?? null;
  const planId = configuredPlanId ?? getPlanIdForStripePriceId(basePriceId);
  const periodEnd = matchedBaseItem?.current_period_end
    ?? subscription.items.data[0]?.current_period_end;

  await updateBuilderSubscriptionByStripeCustomerId(stripeCustomerId, {
    subscriptionStatus: subscription.status,
    subscriptionPlan: basePriceId,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    planId: planId ?? undefined,
  });
}
