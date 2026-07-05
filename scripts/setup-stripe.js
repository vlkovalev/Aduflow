const fs = require("node:fs");
const path = require("node:path");
const Stripe = require("stripe");

const ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_STARTER_BASE",
  "STRIPE_PRICE_STARTER_METERED",
  "STRIPE_PRICE_GROWTH_BASE",
  "STRIPE_PRICE_GROWTH_METERED",
];

const PLANS = [
  { id: "starter", name: "ADUflow Starter", baseAmount: 14900, included: 5, overageAmount: 3500 },
  { id: "growth", name: "ADUflow Growth", baseAmount: 24900, included: 10, overageAmount: 3000 },
];

async function main() {
  const envLocalPath = path.join(__dirname, "..", ".env.local");
  const envContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, "utf8") : "";
  const secretKey = process.env.STRIPE_SECRET_KEY || readEnvValue(envContent, "STRIPE_SECRET_KEY");
  const allowLive = process.argv.includes("--live");

  if (!secretKey) {
    console.error("Set STRIPE_SECRET_KEY in .env.local or the current process environment, then run this script again.");
    process.exit(1);
  }
  if (secretKey.startsWith("sk_live_") && !allowLive) {
    console.error("Refusing to create live Stripe resources without the explicit --live flag.");
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);
  const meter = await findOrCreateMeter(stripe);
  const generated = { STRIPE_SECRET_KEY: secretKey };

  for (const plan of PLANS) {
    const product = await findOrCreateProduct(stripe, plan);
    const basePrice = await findOrCreateBasePrice(stripe, product.id, plan);
    const meteredPrice = await findOrCreateMeteredPrice(stripe, product.id, meter.id, plan);
    const prefix = `STRIPE_PRICE_${plan.id.toUpperCase()}`;
    generated[`${prefix}_BASE`] = basePrice.id;
    generated[`${prefix}_METERED`] = meteredPrice.id;
  }

  writeEnvValues(envLocalPath, envContent, generated);
  console.log(`Stripe resources are ready. Updated ${envLocalPath}.`);
  console.log("Next: configure /api/webhooks/stripe for checkout.session.completed and subscription events.");
  console.log("Add STRIPE_WEBHOOK_SECRET to local and Vercel environments after creating the endpoint.");
}

async function findOrCreateMeter(stripe) {
  const meters = await stripe.billing.meters.list({ limit: 100 });
  const existing = meters.data.find((meter) => meter.event_name === "qualified_proposal");
  if (existing) {
    console.log(`Using existing qualified-proposal meter: ${existing.id}`);
    return existing;
  }
  const meter = await stripe.billing.meters.create({
    display_name: "Qualified Proposals",
    event_name: "qualified_proposal",
    customer_mapping: { event_payload_key: "stripe_customer_id", type: "by_id" },
    default_aggregation: { formula: "sum" },
  });
  console.log(`Created qualified-proposal meter: ${meter.id}`);
  return meter;
}

async function findOrCreateProduct(stripe, plan) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find(
    (product) => product.metadata?.aduflow_plan === plan.id || product.name === plan.name,
  );
  if (existing) {
    console.log(`Using existing ${plan.name} product: ${existing.id}`);
    return existing;
  }
  return stripe.products.create({
    name: plan.name,
    description: `${plan.name} plan - flat base plus metered qualified proposal usage`,
    metadata: { aduflow_plan: plan.id },
  });
}

async function findOrCreateBasePrice(stripe, productId, plan) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = prices.data.find(
    (price) =>
      price.metadata?.aduflow_component === "base" ||
      (price.recurring?.usage_type !== "metered" && price.unit_amount === plan.baseAmount),
  );
  if (existing) return existing;
  return stripe.prices.create({
    product: productId,
    currency: "usd",
    recurring: { interval: "month" },
    unit_amount: plan.baseAmount,
    metadata: { aduflow_plan: plan.id, aduflow_component: "base" },
  });
}

async function findOrCreateMeteredPrice(stripe, productId, meterId, plan) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = prices.data.find(
    (price) =>
      price.metadata?.aduflow_component === "metered" ||
      (price.recurring?.usage_type === "metered" &&
        price.recurring?.meter === meterId &&
        price.billing_scheme === "tiered"),
  );
  if (existing) return existing;
  return stripe.prices.create({
    product: productId,
    currency: "usd",
    recurring: { interval: "month", usage_type: "metered", meter: meterId },
    billing_scheme: "tiered",
    tiers_mode: "graduated",
    tiers: [
      { up_to: plan.included, unit_amount: 0 },
      { up_to: "inf", unit_amount: plan.overageAmount },
    ],
    metadata: { aduflow_plan: plan.id, aduflow_component: "metered" },
  });
}

function readEnvValue(content, key) {
  const line = content.split(/\r?\n/).find((entry) => entry.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf("=") + 1).trim() : "";
}

function writeEnvValues(filePath, currentContent, values) {
  const filtered = currentContent
    .split(/\r?\n/)
    .filter((line) => !ENV_KEYS.some((key) => line.trim().startsWith(`${key}=`)));
  const stripeLines = ["", "# Stripe billing", ...ENV_KEYS.map((key) => `${key}=${values[key] || ""}`)];
  fs.writeFileSync(filePath, [...filtered, ...stripeLines, ""].join("\n").trim() + "\n", {
    encoding: "utf8",
    mode: 0o600,
  });
}

main().catch((error) => {
  console.error("Stripe setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
