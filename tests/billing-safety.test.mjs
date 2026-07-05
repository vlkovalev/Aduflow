import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Stripe setup keeps secrets out of command-line arguments", () => {
  const source = read("scripts/setup-stripe.js");

  assert.doesNotMatch(source, /process\.argv\[2\]/);
  assert.match(source, /process\.env\.STRIPE_SECRET_KEY/);
  assert.match(source, /process\.argv\.includes\("--live"\)/);
  assert.doesNotMatch(source, /APP_SECRET/);
});

test("Stripe setup reuses existing billing resources", () => {
  const source = read("scripts/setup-stripe.js");

  assert.match(source, /findOrCreateMeter/);
  assert.match(source, /findOrCreateProduct/);
  assert.match(source, /findOrCreateBasePrice/);
  assert.match(source, /findOrCreateMeteredPrice/);
});

test("billing routes validate plans and do not depend on subscription item order", () => {
  const checkout = read("app/api/billing/checkout/route.ts");
  const webhook = read("app/api/webhooks/stripe/route.ts");

  assert.match(checkout, /isPubliclyPurchasable/);
  assert.match(webhook, /subscription\.items\.data\.find/);
  assert.doesNotMatch(webhook, /items\.data\[0\]\?\.price\.id/);
  assert.match(webhook, /customer\.subscription\.created/);
});

test("generated script output remains ignored", () => {
  assert.match(read(".gitignore"), /^scripts\/dist\/$/m);
});
