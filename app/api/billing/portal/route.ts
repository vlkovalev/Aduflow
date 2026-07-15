import { NextResponse } from "next/server";
import { requireBuilderSession } from "../../../../lib/apiAuth";
import { getBuilderBillingInfo } from "../../../../lib/builderStore";
import { getStripeClient } from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireBuilderSession();
  if (auth.response) return auth.response;

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const billing = await getBuilderBillingInfo(auth.builderId);
  if (!billing.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet — start checkout first." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${origin}/builder/billing`,
  });

  return NextResponse.json({ url: session.url });
}
