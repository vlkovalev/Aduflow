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
