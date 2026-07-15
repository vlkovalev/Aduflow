# Builder Presentation Readiness Checklist

Date: June 13, 2026

## Current Verdict

ADUflow is ready for guided 1:1 builder presentations and a controlled private beta. Broad self-serve publishing still requires the external verification checklist below.

## What Is Ready

| Area | Status | Evidence |
| --- | --- | --- |
| Address-first positioning | Ready | Homepage and configurator lead with feasibility before configuration. |
| Builder setup | Ready for demo | Setup checklist covers database, models, options, and credentials. |
| Catalog-driven pricing | Ready for demo | Builder models/options feed configurator. |
| Proposal package | Ready for demo | Proposal includes source, budget, design envelope, and next steps. |
| Lender package | Ready for demo | Includes credentials, itemized budget, draw schedule, and signatures. |
| Permit/project workflow | Ready for demo | Permit tracker, milestones, and draw logs persist through APIs/local fallback. |
| Supabase setup docs | Ready | `docs/supabase-setup.md` covers schema, seed, env vars, and verification. |
| Vercel env compatibility | Ready | App supports uppercase local env vars and lowercase Vercel env vars. |

## Must Check Before Each Demo

1. Vercel has redeployed from latest `main`.
2. Supabase env vars are present in the deployment.
3. `/builder/setup` does not show sandbox mode.
4. At least one builder profile is available at `/builder/login`.
5. Models, options, and credentials show complete in setup.
6. A test lead can be created from `/configurator`.
7. The test lead appears in Supabase `leads`.
8. Proposal and lender package open.
9. Lead can be marked `won`.
10. Project tracker opens and saves one permit, milestone, and draw update.

## External Items Still Not Fully Verifiable From Repo

| Item | Why |
| --- | --- |
| Production secret rotation | Confirm the deployed `APP_SECRET` is not the value previously exposed in git history. |
| Stripe end-to-end flow | Complete test-mode checkout, webhook delivery, entitlement update, cancellation, and portal verification. |
| Transactional email delivery | Verify account verification, password reset, builder notification, and homeowner confirmation reach real inboxes. |
| Live Supabase writes from Vercel | Requires deployed site test. |
| Mobile visual QA | Requires browser screenshot pass. |
| Real guide screenshots | Need stable deployed or local browser session. |
| Builder/lender market validation | Requires real conversations. |

## Demo Data To Use

| Field | Demo Value |
| --- | --- |
| Builder | Apex Modular Builders |
| Address | 42 Maple Street, Calgary, AB |
| Model | Garden Suite 624 |
| Finish | Comfort |
| Foundation | Helical piles |
| Utilities | Standard |
| Site | Urban |
| Homeowner | Demo Homeowner |
| Email | demo@example.com |
| Phone | (555) 555-0123 |

## Presentation Promise

> ADUflow helps ADU and prefab builders qualify homeowner leads by turning an address into a feasibility, pricing, proposal, lender, permit, and project-tracking package.

## Presentation Boundaries

- It is not permit approval.
- It is not bank approval.
- Broad public onboarding remains gated on production payment, email, and deletion-request verification.
- Fallback zoning is an estimate.
- ~~Production auth is still a required hardening step before broad onboarding.~~ Resolved: HMAC-signed sessions and email verification shipped (see `docs/critical-process-audit.md` §10, §23).

## Next Best Engineering Work

1. Complete the production Stripe and Resend end-to-end checks.
2. Browser/mobile screenshot and accessibility QA.
3. Confirm the published privacy/terms contacts are monitored and obtain legal review.
4. Screenshot-based builder guide.
5. Broker/lender review of lender package.
