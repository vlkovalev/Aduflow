# ADUflow QA Findings — 2026-07-21

Live, hands-on testing of the builder and customer journeys on production (aduflow.ca), following the registration/verification outage fix. All tests performed against real production data via a seeded test builder account (QA Test Builder 8) and a real submitted lead.

## Summary

Registration, login, password reset, catalog setup (manual entry), and the full customer quote-to-proposal flow all work end to end. Two real bugs were found and one UX gap. Nothing found is a launch-blocker, but the credentials bug should be fixed before relying on the lender-package feature.

## What was tested and passed

**Builder auth**
- Registration → email verification → sign in — works, verification email correctly links to aduflow.ca (post-fix).
- Forgot password → reset email → set new password → sign in with new password — works cleanly.

**Builder catalog setup (`/builder/setup`)**
- Manual "Add model" — saves instantly, reflected in onboarding checklist and dashboard.
- Manual "Add option" across all 4 categories (Finish level, Foundation, Utilities, Site condition) — saves instantly, checklist updates to "4 of 4 option groups have active pricing."
- Dashboard unlocks once at least one model exists (gate only checks models, not options/credentials).

**Builder dashboard (`/builder`)**
- "Create test lead" generates a full sandbox proposal using the real catalog data (correct price, correct model name).
- Lead pipeline, Top models, Avg deal size, Feasibility rate widgets all update correctly from real lead data.
- "Generate permit checklist" produces a correct Property Intake / Zoning Review / Required Documents checklist.
- Billing page renders correctly (Pilot/Trial plan, usage counter, upgrade options). Not tested further — checkout is a real payment action.

**Customer journey (`/configurator?builderId=...`)**
- Builder-scoped catalog loads correctly ("Builder catalog" badge, correct model/pricing).
- Live zoning lookup against a real address (Surrey, BC) returned a real municipal zoning result (CD zone, 92% confidence, correct setback/envelope data, link to the actual Surrey bylaw PDF).
- Model and option selection, live cost summary, lender draw plan (10/20/35/20/15%, sums to 100%), and BOM category count all update correctly and consistently with the zoning result.
- Lead intake form submits successfully ("Intake saved") and generates a correct, real proposal package (correct homeowner name, address, price, zoning confidence) at `/proposals/<id>`.

## Bugs found

### 1. Builder credentials do not persist in production (Medium-High)
The Credentials tab (license #, insurance carrier/limit/expiration, bonding, warranty info, service regions) shows "Credentials saved successfully," but every field reverts to empty on the next page load.

**Root cause:** `updateBuilderCredentials`/`getBuilderCredentials` in `lib/builderStore.ts` only write `company_name`/`email`/`phone` to Supabase. All other credential fields are written to a local JSON file via `getLocalStorePath()`, which resolves to an ephemeral path (`os.tmpdir()` or `process.cwd()/.data`) — not durable across serverless function invocations on Netlify. There is no Supabase column or migration for these fields at all.

**Impact:** The onboarding checklist can never show "Credentials: Complete" in production, and the "Drive lender package metadata" feature (labeled directly on that tab) is non-functional, since the data it depends on is never actually retained.

**Note:** the safety guard `assertLocalFallbackAllowed()` that's supposed to hard-fail this kind of silent data loss in production only checks Vercel-specific env vars — stale from before the Vercel → Netlify migration — so it never triggers on Netlify.

**Fix:** add the missing columns to the `builders` table (or a new `builder_credentials` table) and update `builderStore.ts` to read/write them via Supabase, same as `company_name`/`email`/`phone` already do.

### 2. Zoning result labels are nearly invisible (Low, accessibility)
On the zoning check result card (dark green background), the field labels — "Max ADU Size," "Max Stories," "Side Setback," "Rear Setback," "Review Risk," "Zoning Source" — render in a color with almost no contrast against the background. The values themselves (e.g. "968 sq ft") are legible; only the labels above them are effectively unreadable. Confirmed via accessibility tree that the text is present, just a CSS contrast bug.

Also noticed: the "Source: [blank]. This is a first-pass feasibility screen..." line has an empty value where an official source name should appear.

### 3. "New lead quote" button on builder dashboard is non-functional (Medium, UX)
The button links to the bare `/configurator` (no `builderId`), which shows the "General Catalog View" banner with lead submission disabled. A signed-in builder clicking this to create a quote for a lead lands on a page that explicitly can't submit leads. Should link to `/configurator?builderId=<their own id>`.

### 4. No duplicate-submit protection on lead intake form (Low)
The "Send feasibility package" button doesn't disable itself after submit; a second click (or slow double-click) creates a second identical lead/proposal. Not tested for other forms but worth a general check.

## Not yet tested
- CSV/XLSX catalog import (Import tab) — deferred for time; the manual-entry path was prioritized since it's the higher-risk regression area.
- "Copy share link" / "Download PDF" on the proposal page.
- Draw verification queue / lender evidence upload flow.
- Billing checkout (intentionally not exercised — real payment action).
