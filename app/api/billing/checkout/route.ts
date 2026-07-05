import { NextResponse } from "next/server";
import { requireBuilder } from "../../../../lib/apiAuth";
import { getBuilderBillingInfo, getBuilderById, setBuilderStripeCustomerId } from "../../../../lib/builderStore";
import { getStripeClient, getStripePriceId } from "../../../../lib/stripe";
import { getPlan, getStripePriceIdsForPlan, isPlanId, type PlanId } from "../../../../lib/billingPlans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireBuilder();
  if (auth.response) return auth.response;

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  // Plan tiers from lib/billingPlans.ts (docs/pricing-strategy.md). Falls
  // back to the legacy single STRIPE_PRICE_ID flow when no planId is sent,
  // so any pre-existing checkout integration keeps working unchanged.
  let requestedPlan: PlanId | null = null;
  try {
    const body = await request.json();
    if (body?.planId !== undefined) {
      if (!isPlanId(body.planId) || !getPlan(body.planId).isPubliclyPurchasable) {
        return NextResponse.json({ error: "That billing plan is not available for checkout." }, { status: 400 });
      }
      requestedPlan = body.planId;
    }
  } catch {
    // No JSON body — legacy single-plan checkout.
  }

  let lineItems: { price: string; quantity?: number }[];
  if (requestedPlan) {
    const { basePriceId, meteredPriceId } = getStripePriceIdsForPlan(requestedPlan);
    if (!basePriceId) {
      return NextResponse.json(
        { error: `The "${requestedPlan}" plan is not yet configured with a Stripe price.` },
        { status: 503 },
      );
    }
    lineItems = [{ price: basePriceId, quantity: 1 }];
    // Metered prices report usage separately (lib/stripe.ts reportQualifiedProposalUsage)
    // and must not be given a quantity on the Checkout line item.
    if (meteredPriceId) lineItems.push({ price: meteredPriceId });
  } else {
    const legacyPriceId = getStripePriceId();
    if (!legacyPriceId) {
      return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
    }
    lineItems = [{ price: legacyPriceId, quantity: 1 }];
  }

  const builder = await getBuilderById(auth.builderId);
  if (!builder) {
    return NextResponse.json({ error: "Builder not found." }, { status: 404 });
  }

  const billing = await getBuilderBillingInfo(auth.builderId);
  let customerId = billing.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: builder.email || undefined,
      name: builder.companyName || undefined,
      metadata: { builderId: auth.builderId },
    });
    customerId = customer.id;
    await setBuilderStripeCustomerId(auth.builderId, customerId);
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: auth.builderId,
    line_items: lineItems,
    // Propagates to the created Subscription's metadata so the webhook can
    // resolve which plan tier this is without guessing from price ids alone.
    subscription_data: requestedPlan ? { metadata: { planId: requestedPlan } } : undefined,
    success_url: `${origin}/builder/billing?checkout=success`,
    cancel_url: `${origin}/builder/billing?checkout=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
