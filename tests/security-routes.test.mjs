import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
const registerSource = await readFile(
  new URL("../app/api/auth/register/route.ts", import.meta.url),
  "utf8",
);
const resendSource = await readFile(
  new URL("../app/api/auth/resend-verification/route.ts", import.meta.url),
  "utf8",
);
const authSource = await readFile(new URL("../lib/auth.ts", import.meta.url), "utf8");
const apiAuthSource = await readFile(new URL("../lib/apiAuth.ts", import.meta.url), "utf8");
const localStoreSource = await readFile(new URL("../lib/localStoreHelper.ts", import.meta.url), "utf8");
const leadRouteSource = await readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8");
const catalogRouteSource = await readFile(new URL("../app/api/catalog/route.ts", import.meta.url), "utf8");

test("email verification remains accessible before a session exists", () => {
  const publicPathsMatch = proxySource.match(/const PUBLIC_PATHS = \[([\s\S]*?)\];/);

  assert.ok(publicPathsMatch, "proxy.ts must define PUBLIC_PATHS");
  assert.match(publicPathsMatch[1], /["']\/builder\/verify-email["']/);
});

test("production auth routes do not expose verification links without email delivery", () => {
  assert.match(registerSource, /NODE_ENV\s*!==\s*["']production["']/);
  assert.match(registerSource, /NODE_ENV\s*===\s*["']production["'][\s\S]*!isEmailConfigured\(\)/);
  assert.match(resendSource, /NODE_ENV\s*!==\s*["']production["']/);
  assert.match(resendSource, /NODE_ENV\s*===\s*["']production["'][\s\S]*!isEmailConfigured\(\)/);
});

test("production authentication fails closed without a strong signing secret", () => {
  assert.match(authSource, /NODE_ENV\s*===\s*["']production["'][\s\S]*throw new Error/);
  assert.doesNotMatch(authSource, /NODE_ENV\s*===\s*["']production["'][\s\S]*console\.warn/);
});

test("product routes enforce pilot or active paid entitlement", () => {
  assert.match(apiAuthSource, /billing\.planId\s*===\s*["']pilot["']/);
  assert.match(apiAuthSource, /export const requireBuilder\s*=\s*requireBuilderAccess/);
  assert.match(leadRouteSource, /builderHasProductAccess\(builderId\)/);
  assert.match(catalogRouteSource, /builderHasProductAccess\(builderId\)/);
});

test("production cannot use ephemeral local business storage", () => {
  assert.match(localStoreSource, /VERCEL_ENV\s*===\s*["']production["']/);
  assert.match(localStoreSource, /NETLIFY\s*===\s*["']true["']/);
  assert.match(localStoreSource, /local fallback is disabled in production/);
});

test("builder credentials are durable in Supabase schema and store code", async () => {
  const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  const migration = await readFile(new URL("../database/builder-credentials.sql", import.meta.url), "utf8");
  const builderStore = await readFile(new URL("../lib/builderStore.ts", import.meta.url), "utf8");

  for (const column of [
    "license_number",
    "insurance_carrier",
    "insurance_limit",
    "insurance_expiration",
    "bond_provider",
    "bond_amount",
    "warranty_info",
    "service_region",
    "currency",
  ]) {
    assert.match(schema, new RegExp(column));
    assert.match(migration, new RegExp(column));
    assert.match(builderStore, new RegExp(column));
  }
});

test("customer configurator prevents duplicate lead submit and routes builder quote links", async () => {
  const configurator = await readFile(new URL("../app/configurator/page.tsx", import.meta.url), "utf8");
  const builderDashboard = await readFile(new URL("../app/builder/page.tsx", import.meta.url), "utf8");

  assert.match(configurator, /if\s*\(isSubmitting\)\s*return/);
  assert.match(configurator, /disabled=\{isSubmitting\s*\|\|\s*!builderId\s*\|\|\s*leadSubmitted\}/);
  assert.match(builderDashboard, /href=\{`\/configurator\?builderId=\$\{builderId\}`\}/);
});

test("builder outreach landing page records privacy-light site visits", async () => {
  const forBuilders = await readFile(new URL("../app/for-builders/page.tsx", import.meta.url), "utf8");
  const tracker = await readFile(new URL("../app/for-builders/VisitTracker.tsx", import.meta.url), "utf8");
  const visitRoute = await readFile(new URL("../app/api/site-visits/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");

  assert.match(forBuilders, /<VisitTracker pageTitle=["']ADUflow for Builders["'] \/>/);
  assert.match(tracker, /navigator\.sendBeacon/);
  assert.match(visitRoute, /hashVisitor\(ip/);
  assert.match(visitRoute, /rateLimit\(`visit:\$\{ip\}`/);
  assert.match(schema, /CREATE TABLE site_visits/);
  assert.doesNotMatch(schema, /\bip_address\b/);
});

test("empty durable project stores return safe defaults instead of production local fallback", async () => {
  const projectStore = await readFile(new URL("../lib/projectStore.ts", import.meta.url), "utf8");
  const permitStore = await readFile(new URL("../lib/permitStore.ts", import.meta.url), "utf8");
  assert.match(projectStore, /!error[\s\S]*DEFAULT_PROJECT_MILESTONES/);
  assert.match(projectStore, /!error[\s\S]*DEFAULT_DRAW_MILESTONES/);
  assert.match(projectStore, /isUuid\(milestone\.id\)\s*\?\s*milestone\.id\s*:\s*randomUUID\(\)/);
  assert.match(projectStore, /isUuid\(draw\.id\)\s*\?\s*draw\.id\s*:\s*randomUUID\(\)/);
  assert.match(permitStore, /else\s*\{\s*return null;\s*\}/);
});

test("public data collection links to privacy and terms", async () => {
  const configurator = await readFile(new URL("../app/configurator/page.tsx", import.meta.url), "utf8");
  await readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
  await readFile(new URL("../app/terms/page.tsx", import.meta.url), "utf8");
  assert.match(configurator, /href=["']\/privacy["']/);
  assert.match(configurator, /href=["']\/terms["']/);
});

test("public shared proposals retain estimate and approval disclaimers", async () => {
  const sharedProposal = await readFile(
    new URL("../app/proposals/share/[token]/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(sharedProposal, /not a final quote/);
  assert.match(sharedProposal, /permit approval/);
});
