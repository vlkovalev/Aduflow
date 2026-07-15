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
  assert.match(localStoreSource, /local fallback is disabled in production/);
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
