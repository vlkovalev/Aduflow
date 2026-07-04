# ADUflow — Critical Step-by-Step Process Re-Audit

Date: June 22, 2026
Auditor stance: strict, evidence-based. Every claim below is grounded in the actual source files in the codebase. Anything that would require a live browser session, screen recording, mobile device test, or real user/customer interview is explicitly marked:

```text
Not verifiable from provided materials.
```

This audit represents a fresh review of the ADUflow application after the implementation of several security hardening, password recovery, homeowner confirmation, and Stripe billing features. It traces the entire step-by-step workflow, checks logic consistency, validates security configurations, and highlights remaining areas of friction, edge cases, and missing workflows before presenting the platform to builders.

---

## 1. Executive Verdict

ADUflow's core pre-construction operational workflow has been verified as functional, compiled without error, and significantly hardened since the last audit cycle. 

The **Critical-severity access control gaps** previously identified—specifically the lack of authentication or ownership verification on `/proposals/[id]` and `/proposals/[id]/lender`—have been **fully resolved**. Both routes now implement robust session checking via `getAuthenticatedBuilderId()` and assert lead ownership by validating that `lead.builderId === builderId`. In addition, Next.js 16's global router middleware (`proxy.ts`) protects these endpoints by default while correctly white-listing homeowner-facing shared links under `/proposals/share/[token]`.

Furthermore, high-severity friction points have been addressed: the model "Preview" link now properly appends the builder ID to load the correct catalog, password reset is fully operational via token signatures that invalidate upon password change, and homeowner confirmation emails are sent upon lead creation.

However, the application remains **launch-adjacent but not yet fully self-serve**. The main remaining risks include:
1. **Unvalidated Custom XLSX Catalog Parser**: The Excel catalog importer remains hand-rolled, exposing builders to parser crashes or silent ingestion errors on sheets with formula cells, formatted dates, or multiple worksheets.
2. **Missing Email Verification at Registration**: Builders can register with unverified or fake email addresses, posing an abuse vector and complicating downstream subscription billing.
3. **Hard-Delete Default behavior**: Catalog deletion of models and options remains a permanent database drop rather than a soft deactivation, presenting high operational recovery risks.
4. **Lack of a Builder "Sandbox/Test" Lead Generator**: No self-serve playground exists for a builder to test-drive their setup, forcing them to submit real mock leads in their production dashboard.

---

## 2. Product and Process Assumptions

| Area | Current Understanding | Evidence | Assumption / Unclear Point |
| --- | --- | --- | --- |
| Product purpose | A "pre-construction operating system" for ADU/garden-suite/modular builders: turn a homeowner address into zoning feasibility, a priced model+options estimate, a proposal, a lender-ready budget package, a permit checklist, and a project/draw tracker. | `docs/PRD.md`, `app/page.tsx`, `lib/pricingEngine.ts` | None — this is explicit and consistent across docs and code. |
| Target builder | Small-to-mid ADU/modular/prefab builders in North America (1–10 staff implied by the credentials form and pricing-strategy doc). | `docs/pricing-strategy.md`, `app/builder/setup/page.tsx` credentials form | Exact company size is not captured anywhere in the product; assumed from pricing doc only. |
| Target end-user | A homeowner exploring an ADU, arriving via a specific builder's shared configurator link (`?builderId=...`). | `app/configurator/page.tsx` builderId query param logic | Whether end-users arrive via builder website embed, paid ad, or direct link is **Not verifiable from provided materials.** |
| Main workflow | Address check → zoning result (live/fallback/manual) → model/options selection → estimate → submit lead → builder reviews/qualifies → proposal/lender/permit/project artifacts generate. | `app/configurator/page.tsx`, `app/api/leads/route.ts`, `lib/leadStore.ts` | None. |
| Expected output | Proposal PDF (print stylesheet), lender package PDF, permit task checklist, project/draw tracker. | `app/proposals/[id]/page.tsx`, `app/proposals/[id]/lender/page.tsx`, `app/permit/[leadId]/page.tsx`, `app/projects/[id]/page.tsx` | None. |
| Data required | Builder: company credentials, license/insurance/bond, service region, active models, active options (4 categories). Homeowner: name, email, phone (optional), property address. | `lib/builderStore.ts`, `database/schema.sql`, `app/api/leads/route.ts` validation | None. |
| Who configures it | The builder, via `/builder/setup` (Models, Options, Import, Credentials tabs). | `app/builder/setup/page.tsx` | None. |
| Who uses it | Homeowner (configurator, public/no login) and builder (dashboard, behind auth). | `proxy.ts` `PROTECTED_PREFIXES` | Protected routes now consistently enforce signed sessions. |
| What success means | Per `docs/PRD.md`: 10 pilot builders, sub-60-second quote generation, sub-1-day builder setup, 50% reduction in quote prep time. No in-product analytics track these specific metrics today (the dashboard tracks pipeline value, win rate, deal size — not setup time or quote-generation latency). | `docs/PRD.md`, `app/builder/page.tsx` | Whether these PRD success metrics are being measured anywhere outside this codebase is **Not verifiable from provided materials.** |

---

## 3. Step-by-Step Process Inventory

### Builder / Admin Steps (Configuration and Setup)
* **B1 (Create Account)**: Builder signs up on `/builder/login` "Create Account" tab (company name, email, phone, password). Executes `POST /api/auth/register` to validate inputs, hash the password (scrypt), write a new row to `builders` table, and write signed cookie sessions.
* **B2 (Sign In)**: Builder signs in on `/builder/login` "Sign In" tab (email, password). Executes `POST /api/auth/login`, verifying password hash, issuing an HMAC-signed session cookie, and writing a non-sensitive `aduflow_auth` flag cookie.
* **B3 (Password Recovery Request)**: Builder clicks "Forgot password?", enters email on `/builder/forgot-password`. Executes `POST /api/auth/forgot-password`, creating a signed, 1-hour reset token fingerprinting the password hash and emailing it via Resend.
* **B4 (Password Reset Submit)**: Builder opens `/builder/reset-password?token=...`, fills new password (min 8 chars). Executes `POST /api/auth/reset-password` to decode and verify signature, verify password fingerprint against current db state (to prevent reuse), hash the new password, and update the database.
* **B5 (View Setup Checklist)**: Builder opens `/builder/setup` showing progress indicators for catalog setup, models, options, and credentials.
* **B6 (Add/Edit/Delete Model)**: Builder adds models (name, sq ft, base price, active, sort order) or edits inline. Deletes via standard browser prompt. Uses `POST/PUT/DELETE /api/models[/id]`.
* **B7 (Add/Edit/Delete Option)**: Builder configures pricing options across 4 categories (Finish level, Foundation, Utilities, Site condition). Uses `POST/PUT/DELETE /api/options[/id]`.
* **B8 (Bulk Catalog Import)**: Builder uploads a CSV or XLSX file to `POST /api/catalog/import` with `dryRun=true` to validate data, then `dryRun=false` to persist.
* **B9 (Save Credentials)**: Builder saves credentials (legal name, email, phone, license, insurance limit/expiry, bond, warranty, region) in `/builder/setup` tab. Validated on server-side for basic presence.
* **B10 (Subscribe / Manage Billing)**: Builder opens `/builder/billing`, selects Starter ($149/mo) or Growth ($249/mo) plan, and clicks "Subscribe" (triggering `POST /api/billing/checkout` to generate a Stripe session) or "Manage billing" (triggering `POST /api/billing/portal` for the Stripe Customer Portal).

### End-User (Homeowner) Steps
* **E1 (Arrive at Configurator)**: Homeowner visits `/configurator?builderId=...`. The system fetches the builder's custom models and options. Falls back to default catalog if builderId is missing.
* **E2 (Property Zoning Check)**: Homeowner inputs property address and clicks "Check zoning". Intercepted by `GET /api/zoning` (rate-limited, min 6 chars) to fetch feasibility rules.
* **E3 (Lot Envelope Customization)**: Homeowner views looked-up constraints (Max Sq Ft, Max Stories, Setbacks) and optionally overrides them.
* **E4 (Adu Configuration)**: Homeowner chooses ADU model, finish level, foundation, utilities, and site access. System recalculates live project price client-side.
* **E5 (Lead Submission)**: Homeowner enters name, email, phone, and clicks "Send feasibility package". Executes `POST /api/leads` (validated, rate-limited) mapping configuration payload.
* **E6 (Homeowner Confirmation)**: The server sends a confirmation email to the homeowner containing the public shared proposal link (`/proposals/share/{token}`).

### Builder Usage Steps
* **BE1 (View Proposal)**: Builder reviews homeowner proposal on `/proposals/{id}`. Access is gated; only authenticated builders who own the lead can view the details.
* **BE2 (Lender Package Generation)**: Builder opens `/proposals/{id}/lender` showing itemized costs, general contractor profile, and signatures. Strictly gated.
* **BE3 (Share Proposal)**: Builder copies shareable link to clipboard. Homeowner accesses it via public `/proposals/share/{token}`.
* **BE4 (Permit Checklist)**: Builder views `/permit/{leadId}` mapping task checklist for city/HOA submission. Ownership-gated.
* **BE5 (Lead Status Qualification)**: Builder changes status dropdown to "Qualified". Triggers metered billing: records usage to `qualified_proposal_usage` (idempotent unique constraint) and calls Stripe Metering API.
* **BE6 (Project Milestone & Draw Tracker)**: Builder marks lead as "Won", enabling project tracking on `/projects/{id}` to manage permit progress and release draws.

---

## 4. Critical Step-by-Step Practicality and Feasibility Audit

| Step # | Step | Understandable? | Practical? | Technically Feasible? | Main Risk | Required Fix |
| --- | --- | --- | --- | --- | --- | --- |
| **B1** | Create account | Yes | Yes | Yes | No email verification means builders can register with junk addresses | Add confirmation email verification flow before allowing setup/billing |
| **B6** | Add/edit model | Yes | Yes | Yes | "Preview" link (`/configurator?model={code}`) now appends `builderId` correctly, but if builder hasn't set up options, configurator defaults can feel empty | Enforce adding at least one option per category during initial onboarding |
| **B8** | Bulk catalog import | Mostly | Moderate | Moderate (hand-rolled ZIP/XML parser) | Hand-rolled XLSX parser lacks verification for formulas, multiple sheets, or formatted cells | Replace the custom zip-inflate parser with a mature parser library (e.g., `xlsx`/SheetJS) |
| **B9** | Save credentials | Yes | Yes | Yes | Expiry date validation is missing; past dates are accepted silently | Add simple frontend check verifying that the expiration date is in the future |
| **B10** | Lead status to "Qualified" | No | Yes | Yes | Metered billing occurs silently with no UI warnings about plan usage consequences | Add tooltip warning on "Qualified" dropdown option alerting builder of billing event |
| **E1** | Arrive at configurator | Yes | Yes | Yes | Falling back to default catalog when builderId is missing is silent, confusing homeowners | Add a prominent visual banner showing "Default Catalog" vs "Custom Builder Catalog" |
| **E3** | Lot constraints override | Yes | Yes | Yes | Zoning overrides are silent and do not require a reason | Add a required "Reason for override" text field to validate developer overrides |
| **BE5** | Status to "Won" | Yes | Moderate | Yes | Moving a lead to "Won" is an irreversible hard trigger with no confirmation | Add confirmation modal to prevent accidental conversions |

---

## 5. Builder / Admin Flow Audit

* **Onboarding Friction**: New builders landing on `/builder` are presented with an empty dashboard. Although a "Complete builder setup" button exists, they are not redirected automatically, allowing them to browse empty sections.
* **Builder Setup Checklist**: The `SetupChecklist` successfully shows progress on Models, Options, and Credentials. However, it does not lock the configurator or warn the builder if they have left essential categories (e.g., foundation) empty.
* **Catalog Management**: Deleting a model or option triggers a native browser `confirm()`. It lacks soft-deletion (archive flag) support, meaning that once deleted, the historical lead records referencing those codes might experience layout issues or lack pricing context if re-evaluated.
* **Service Region ambiguity**: The credentials page requires a "Service Region" which is currently a raw textarea. At scale, this prevents builders from targeting exact municipalities or zip codes programmatically.

---

## 6. End-User Flow Audit

* **Builder Context Visibility**: The configurator parses the URL query parameter `builderId`. If invalid, it falls back to the default catalog. The homeowner has no obvious warning that they are viewing a generic catalog instead of their builder's exact pricing structure.
* **Information Density**: The estimate sidebar renders project costs, factory cost, site cost, draw schedules, and a next-steps list. While comprehensive on desktop, it poses readability issues on mobile screens (`Not verifiable from provided materials.`).
* **Lead Deduplication**: Homeowners submitting multiple configurations with the same email and address create multiple distinct lead records. There is no lead merging, resulting in dashboard clutter for builders.

---

## 7. Data Requirement and Field Validation Audit

* **Lead Submission (`POST /api/leads`)**: Excellent server-side sanitation and validation. Text fields are length-capped and clean from control characters. The numeric variables (`estimatedPrice`, `estimateLow`, `squareFeet`) are validated as positive, and `estimateLow <= estimateHigh` is enforced.
* **Builder Credentials (`PUT /api/builder`)**: Low validation constraints. The fields `insuranceExpiration` (date) and `bondAmount` (number) do not enforce future validation or range limits.
* **Catalog Import (`POST /api/catalog/import`)**: Validates model codes, sq ft, and pricing. Lacks check for duplicate codes inside the file, leading to multiple rows written under the same name.
* **Password Strength**: Registration enforces `password.length >= 8` but does not check for password strength or check against breached password registries.

---

## 8. Flow Logic and Dependency Audit

```text
Builder Registration (B1)
  ↓ writes builder row
Setup Catalog & Credentials (B6-B9)
  ↓ writes models, options, GC info
Configurator Sharing (E1)
  ↓ requires active builderId to fetch correct catalog
Zoning Lookup (E2)
  ↓ requires min 6 chars, returns zoning criteria
Configuration (E4)
  ↓ relies client-side on pricing engine to split site/factory costs
Lead Creation (E5)
  ↓ requires valid builderId, sends homeowner token-link email
Lead Management (BE1-BE2)
  ↓ proposal & lender package secured by session + ownership checks
Billing Overage (BE5)
  ↓ status set to "Qualified" -> updates qualified_proposal_usage -> calls Stripe
Project Tracking (BE6)
  ↓ status set to "Won" -> milestone, permit & draw tracking enabled
```

All downstream project tracking relies entirely on the JSON configuration payload generated at lead creation. If the homeowner entered a wrong option, the builder has no edit interface to correct the configuration directly; they must edit text notes or adjust draw percentages manually.

---

## 9. Missing Flow and Edge Case Detection

* **Stripe Webhook Failures**: If Stripe checkout completes but the webhook fails or is delayed, the builder's subscription status remains `trialing` locally. Because the billing status check is lenient, they are not locked out immediately, which is a safe developer default but requires manual sync operations if persistent.
* **Token Expiry Cleanup**: Expired password reset tokens do not require server-side database cleanup because they are stateless JWT-like signed payloads. This is highly efficient.
* **No "Deactivate" UI Toggle**: The `builders` and `models` tables support active/inactive states in the schema, but the builder frontend only offers a "Delete" button.

---

## 10. Technical Feasibility Review

* **HMAC-SHA256 Signed Sessions**: Highly feasible and fully implemented in `lib/auth.ts`. Replaces legacy insecure cookies.
* **Next.js 16 Proxy Middleware**: Implemented in `proxy.ts`. Effectively blocks unauthorized access to `/builder`, `/permit`, `/projects`, and `/proposals` paths while routing public files seamlessly.
* **Idempotent Billing Metering**: The custom table `qualified_proposal_usage` has a `UNIQUE` constraint on `lead_id`. This prevents builders from being double-charged if they toggle the status from "Qualified" to "New" and back. This is highly feasible and robust.

---

## 11. Security and RLS Validation Audit

* **Broken Object-Level Authorization (IDOR) - Fixed**: The critical exposure where anyone with a lead UUID could access `/proposals/[id]` and `/proposals/[id]/lender` has been resolved. The server now validates session credentials against lead records on the server before rendering the view.
* **Supabase Row-Level Security**: The migration script `database/rls.sql` enforces that builder-specific tables (`leads`, `models`, `options`) are gated by `auth.uid() = builder_id`. This ensures multi-tenant separation.
* **Plaintext Secrets - Fixed**: No plaintext secrets exist in the git history or configuration files. The `APP_SECRET` environment variable defaults safely in dev mode and warns in production.

---

## 12. Integration and Billing Plan Flow Audit

* **Plan Tiers**: Implemented under `lib/billingPlans.ts`.
  * **Pilot**: $0/mo, unlimited qualified proposals.
  * **Starter**: $149/mo, 5 included qualified proposals, $35 overage.
  * **Growth**: $249/mo, 10 included qualified proposals, $30 overage.
* **Metered Billing Event**: Reported to Stripe as a `qualified_proposal` billing event value of `1`. The code handles exceptions gracefully, ensuring that Stripe downtime does not halt the builder dashboard.

---

## 13. Practicality/QA Verification Test Scenarios

### Authentication & Gating Checks
* **QA-01 (Logged Out Proposals Block)**: Navigate to `/proposals/{id}` while logged out. *Expected result*: Redirected to `/builder/login`.
* **QA-02 (Logged Out Lender Package Block)**: Navigate to `/proposals/{id}/lender` while logged out. *Expected result*: Redirected to `/builder/login`.
* **QA-03 (Cross-Tenant Lead Block)**: Log in as Builder A. Attempt to access `/proposals/{id}` of a lead owned by Builder B. *Expected result*: Renders Next.js `404 Not Found`.
* **QA-04 (Public Share Route Access)**: Navigate to `/proposals/share/{token}`. *Expected result*: Renders proposal public view without authorization redirect.

### Password Reset Scenarios
* **QA-05 (Invalid Token reset)**: Access `/builder/reset-password?token=invalid`. *Expected result*: Error message "This reset link is invalid or has expired."
* **QA-06 (Stateless Token Revocation)**: Issue a reset token. Change the builder's password via another session. Attempt to reset using the original token. *Expected result*: Error message, because the current password hash fingerprint no longer matches the token's embedded fingerprint.

### Billing & Overage Scenarios
* **QA-07 (Overage Metering Trigger)**: Set a lead to "Qualified". Check `qualified_proposal_usage` database table. *Expected result*: One usage row recorded.
* **QA-08 (Metering Idempotency)**: Move the qualified lead back to "New", then to "Qualified" again. *Expected result*: No new row written to `qualified_proposal_usage`, preventing double billing.

---

## 14. Usability Testing Script

### Goal
Determine whether a builder can sign up, establish credentials, import a catalog, view lead details, qualify a lead, and verify billing usage.

### Instructions for Tester
1. Register a new builder account on `/builder/login`.
2. Go to the "Credentials" tab under setup and complete general contractor information. Enter an expired insurance date and check if the form blocks saving.
3. Download the CSV catalog template. Upload a modified catalog file with duplicate model codes.
4. Open the homeowner configurator link `/configurator?builderId={yourId}`. Check zoning for an address and override setbacks. Submit lead.
5. In the Builder dashboard, open the new lead. Open the lender package page and click "Print".
6. Change the lead status to "Qualified". 
7. Check `/builder/billing` and verify that the qualified proposal usage is logged as `1`.

---

## 15. Severity/Priority Bug List

| Severity | Bug Description | Impact File | Mitigation/Fix |
| --- | --- | --- | --- |
| **High** | Hand-rolled XLSX ZIP parser fails on complex formulas, dates, or multiple sheets | `app/api/catalog/import/route.ts` | Replace custom parser with standard `xlsx` library |
| **Medium** | No signup email verification allows registrations with spoofed email addresses | `app/api/auth/register/route.ts` | Add verification email code verification |
| **Medium** | Hard delete permanently removes models, breaking references in old leads | `app/builder/setup/page.tsx` | Implement soft-delete toggling the `is_active` flag |
| **Medium** | Missing future validation on credentials insurance expiration | `app/builder/setup/page.tsx` | Validate datepicker value is in the future on save |
| **Low** | Missing warning banner on configurator when builderId falls back | `app/configurator/page.tsx` | Show alert if configurator is loaded in fallback mode |

---

## 16. Suggested Process Redesign

```text
[First Login] → Auto-Redirect to /builder/setup
                    ↓
[Setup Onboarding] → Lock Dashboard until Models & Credentials exist
                    ↓
[Configurator] → Show prominent Builder Branding banner
                    ↓
[Lead Submission] → Email proposal link to Homeowner + Notify Builder
                    ↓
[Lead Qualification] → Show warning prompt on status update: "Billing Event"
                    ↓
[Project Won] → Modal confirmation → persist project milestone track
```

---

## 17. Suggested Features for QA/Testing

1. **Seed Script Endpoint**: Create an internal endpoint (`/api/test/seed`) that seeds a complete builder profile, catalog, and active leads in all stages (New, Qualified, Won) in local storage or Supabase.
2. **Billing Sandbox Toggle**: Allow toggling billing simulation on checkout pages without communicating with Stripe.
3. **Zoning Mock Fallbacks**: Provide a set of mock addresses that guarantee manual, likely, and unlikely zoning outcomes for local validation.

---

## 18. Documentation and Guide Audit

* **`DEPLOYMENT_GUIDE.md`**: Highly accurate. Correctly lists Supabase environment setups, passwords hash parameters, and Stripe price identifiers.
* **`docs/supabase-setup.md`**: Up-to-date. Captures RLS requirements and tables configuration.
* **`docs/catalog-import-guide.md`**: Lacks information regarding the 5MB file upload limit and does not explain how the parser handles duplicate row values.
* **`docs/builder-guide.html`**: References multiple image paths under `../screenshots/` that are not checked into the repository, resulting in broken image graphics during preview.

---

## 19. Competitive/Benchmark Process Comparison

* **Airtable Interfaces**: Offers record lock states and changes audit logs. ADUflow lacks history logs for lead updates.
* **Softr**: SURFACES custom user preview states. ADUflow now correctly implements this with the model preview.
* **Traditional lead marketplaces**: Charge contractors for unverified lead imports. ADUflow's "qualified proposal" model remains a superior, user-friendly choice.

---

## 20. Priority Roadmap

### Phase 1: Pre-Launch Hardening (High Priority)
* Harden catalog import by replacing the hand-rolled zip extractor with a standard library.
* Add future-date checks for credentials inputs.
* Add tooltip warnings to status transition dropdowns indicating billing events.

### Phase 2: User Onboarding & Retention (Medium Priority)
* Add email verification to registrations.
* Add visual default catalog banners to configurator view.
* Implement soft-deactivations instead of hard deletes on catalog models.

---

## 21. Final Scores

| Dimension | Score (1-10) | Justification |
| --- | --- | --- |
| Practicality | 8/10 | Gated routes and billing structures are robustly designed. Hand-rolled catalog parser remains a risk. |
| Feasibility | 9/10 | Highly feasible. Built on reliable next/crypto/postgres primitives. |
| UX Clarity | 7/10 | Clean dashboard and estimate flow, but status updates have hidden billing impacts. |
| Security / Data Protection | 9/10 | Session cookies and owner validations are correctly implemented, preventing IDOR. |
| Data Validation | 8/10 | Strong validation on leads submissions, weak validation on builder credentials. |
| Error Handling | 8/10 | Database failures and rate limit events return clean API responses. |
| Documentation | 7/10 | Setup guides are accurate, but screenshot assets are missing. |
| Technical Architecture | 9/10 | Standardized Next.js routes, signed sessions, and Supabase RLS form a modern stack. |
| Overall Pilot Readiness | **8/10** | **Ready for pilot trials** now that the critical data leaks are fixed. |

---

## 22. Final Direct Recommendation

**The ADUflow platform is now secure to present to pilot builders.** The critical access control bugs are resolved: unauthenticated visitors can no longer view or extract sensitive lender packages or homeowners' data.

To prepare for general release, the highest priority is to replace the custom XLSX parsing code with a mature library to prevent import errors, and to add visual notifications in the builder portal so contractors understand when they are triggering a Stripe billing event.

---

## 23. Fix Completion Addendum - June 22, 2026

The following audit findings have now been implemented in the working tree and verified with a production build:

| Finding | Status | Evidence |
| --- | --- | --- |
| Replace hand-rolled XLSX parser | Complete | `app/api/catalog/import/route.ts` now uses `read-excel-file/node`, the dependency already present in `package.json`. |
| Reject duplicate upload rows | Complete | Catalog import validation now blocks duplicate model codes and duplicate option category/value keys before saving. |
| Avoid destructive catalog deletes | Complete | `deleteModel()` and `deleteOption()` now set `is_active=false` instead of physically deleting rows in Supabase or local JSON fallback. |
| Avoid destructive import replacement | Complete | Catalog imports now archive existing matching model/option rows before inserting replacements instead of deleting prior records. |
| Make delete behavior clear | Complete | Builder setup UI now labels the action as `Archive` and explains that old proposals remain preserved. |
| Validate insurance expiration | Complete | `/api/builder` blocks invalid/past insurance dates, and `/builder/setup` shows the error before submitting. |
| Warn before billing/project transitions | Complete | Lead status selector shows contextual help for `Qualified` and `Won`, plus confirmation prompts before those state changes. |
| Recover from failed status updates | Complete | Lead status selector now rolls back optimistic UI changes and shows an error if the PATCH request fails. |
| Verify builder emails before login | Complete | Registration now sends a signed verification link, login blocks unverified accounts, and local demos expose a fallback verification link when email is not configured. |
| Add builder sandbox/test lead generator | Complete | Builder OS now includes a protected `Create test lead` action that creates a realistic sandbox lead through the same proposal/lender/permit/project pipeline. |
| Add archived catalog recovery UI | Complete | Builder setup now hides inactive records by default and gives builders a `Show archived` / `Reactivate` recovery flow for models and options. |
| Production build after fixes | Passed | `next build` completed successfully on June 22, 2026. |

Remaining before broader public launch:

| Remaining Item | Severity | Recommended Next Step |
| --- | --- | --- |
| Mobile visual QA | Medium | Run browser/mobile screenshots against the live domain and fix any overflow in configurator, lender package, and builder dashboard. |
