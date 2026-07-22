# Builder Presentation Readiness Audit

Date: July 21, 2026

## Verdict

ADUflow is ready for guided builder presentations and a controlled builder pilot. It should be presented as a pre-construction qualification workflow, not as an automated zoning approval, final estimator, lender approval, or permit service.

The product is technically strong enough for a builder walkthrough. The remaining risks are operational and validation-related: monitored inbound support/privacy mailboxes, legal review, lender feedback on the lender-oriented package, and proof from real builder pilots that the workflow saves qualification time.

## Builder-facing readiness

| Area | Status | Evidence |
| --- | --- | --- |
| Builder landing experience | Ready after deployment | `/for-builders` gives outreach recipients a focused value proposition, pilot scope, boundaries, and registration CTA. |
| Public homepage | Ready after deployment | Internal competitor language and obsolete auth warnings were removed. Claims now use preliminary/builder-reviewed language. |
| Builder authentication | Ready | Email verification, password reset, signed sessions, server-side authorization, and cross-tenant denial were production tested. |
| Catalog and pricing | Ready for pilot | Models, options, currency, imports, and builder-specific configurator catalogs are implemented. |
| Lead qualification | Ready for pilot | Builder-specific homeowner intake creates a private lead and proposal; duplicate submission protection is implemented. |
| Proposal and lender package | Ready with qualification | Outputs persist and render, but lender acceptance has not been validated with a broker or lender. Call it lender-oriented, not lender-approved. |
| Permit and project workflow | Ready for pilot | Permit tasks, milestones, and draw records persist through Supabase-backed APIs. |
| Tenant isolation | Ready | Builder-scoped routes and data access were tested with a second tenant; cross-tenant lead access returned 404. |
| Transactional email | Ready | Verification, password reset, builder lead notification, and homeowner confirmation were tested in production. |
| Billing | Configured; avoid demo purchase | Live Stripe prices and webhook configuration were verified. A real charge was intentionally not executed. |
| Mobile/accessibility | Ready with normal regression checks | Prior production QA covered mobile and key accessibility issues; rerun after material UI changes. |
| Outreach sequence | Ready after personalization | Ten emails were shortened, claims were qualified, company hooks were refreshed, and CTAs now use `/for-builders`. |

## Material issues corrected in this audit

1. Outreach emails sent prospects to `/configurator`, which intentionally disables lead submission without a builder reference.
2. The homepage said production authentication was still future work even though verified, builder-isolated authentication is live.
3. Homepage copy exposed internal competitor/product-strategy language (`PZZL`) instead of speaking to a builder problem.
4. Pricing copy said builder isolation and project persistence were not yet implemented.
5. Metadata used `instant` and `permit-ready` language that exceeded the actual preliminary-screening boundary.
6. Outreach repeated a long feature inventory instead of leading with the builder's cost: wasted qualification and estimating time.
7. One outreach contact (Urban Outbuildings) needs current contact verification before sending; the previous SeaBox address should not be assumed to be the right recipient.

## Required setup before every presentation

1. Confirm the newest `main` deployment is live and `/for-builders` loads.
2. Use a prepared, verified demo builder account—never a guessed seed ID.
3. Confirm the demo builder has one or two realistic models, all four option groups, currency, service region, and completed credentials.
4. Copy the builder-specific configurator URL from the authenticated workflow.
5. Run one test property in the builder's actual market and confirm the zoning-source label.
6. Prepare one clean lead that opens the proposal, lender-oriented package, permit checklist, project milestones, and draw log.
7. Use synthetic contact details unless the builder has authorized a real customer test.
8. State the boundaries before showing outputs: first-pass zoning, preliminary pricing, no permit or financing approval.

## Presentation flow

1. `/for-builders`: establish the qualification-time problem and pilot promise.
2. `/builder/login`: sign in to the prepared builder account.
3. `/builder/setup`: show models, options, credentials, currency, and import path.
4. Builder-specific configurator: enter a relevant address and explain the source quality.
5. Select a model/options and explain factory vs. site allowances.
6. Submit a synthetic lead and open the proposal.
7. Show the lender-oriented package, then the permit/milestone/draw workflow.
8. Close on one test: compare a real inquiry processed through ADUflow with the builder's current intake method.

## Pilot success evidence to collect

- Minutes from inquiry to a reviewable preliminary package.
- Estimator time spent before and after ADUflow.
- Percentage of submitted homeowners the builder marks qualified.
- Builder corrections to zoning assumptions and preliminary budgets.
- Whether the builder shares the proposal with the homeowner.
- Whether a lender or broker finds the lender-oriented package useful.
- Willingness to continue and willingness to pay after the pilot.

## Remaining blockers before broad paid promotion

| Blocker | Required outcome |
| --- | --- |
| Inbound support/privacy email | `support@aduflow.ca` and `privacy@aduflow.ca` must receive mail through configured MX/mailboxes and be monitored. |
| Legal review | Privacy, terms, consent, billing, and cross-border outreach language should be reviewed by qualified counsel. |
| Outreach compliance | Confirm sender identity, mailing address, opt-out handling, and jurisdiction-specific CASL/CAN-SPAM requirements before sending. |
| Real buyer validation | Complete at least three builder interviews and one instrumented pilot before treating current positioning or pricing as validated. |
| Lender validation | Have at least one broker/lender review the package before describing it as lender-ready. |
| Live billing proof | Run a controlled real checkout/refund only when the owner authorizes a live charge. |

## Recommended launch language

> ADUflow helps ADU and prefab builders qualify homeowner inquiries before manual estimating. It turns a property address, selected model, and site assumptions into a preliminary feasibility screen, budget range, proposal, and builder-only lead record. Builders review every output before making customer, permit, pricing, or financing commitments.
