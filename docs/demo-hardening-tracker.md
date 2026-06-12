# ADUflow Demo Hardening Follow-Up Tracker

Date: June 11, 2026

Purpose: track the readiness actions needed before ADUflow is presented to builders or exposed to homeowners. This is a lightweight follow-up artifact for the ADUflow follow-up agent. It should be updated after each hardening pass with status, evidence, and verification notes.

Status key:

- Complete: implemented and verified from repo evidence or a successful manual check.
- Partial: some implementation exists, but the user-facing result is incomplete or not verified.
- Pending: not implemented or still materially blocks readiness.
- Not verifiable: cannot be confirmed from repository files alone.

## Current Readiness Snapshot

| Item | Owner | Status | Repo Evidence | Verification Criteria | Next Action |
| --- | --- | --- | --- | --- | --- |
| Encoding artifacts cleaned from visible UI | Engineering | Pending | `app/configurator/page.tsx` contains corrupted visible labels such as the address lookup comment, `Edit Lot Constraints`, and `Apply Overrides`. `app/builder/page.tsx`, `app/builder/setup/page.tsx`, and `app/configurator/ManufacturerMatch.tsx` also use emoji-style status icons. | No corrupted characters render in browser; search for common mojibake fragments and confirm no visible UI labels are affected. | Replace corrupted pasted icons/text with ASCII text or real icon components. |
| Supabase schema and seed verification instructions | Docs / Engineering | Partial | `database/schema.sql` and `database/seed.sql` exist. `docs/product-audit.md` and `docs/builder-guide.html` mention running schema/seed. | A documented checklist shows: run schema, run seed, verify `/api/catalog`, create one lead, open proposal, open lender package. Connected Supabase project has tables created. | Add a concise setup checklist to the guide or README, then run a live smoke test in the Supabase project. |
| Zoning source labels | Engineering / Product | Partial | `lib/zoningLookup.ts` labels providers as `zoneomics`, `regrid`, `lightbox`, `municipal_fallback`, or `manual`. `app/configurator/page.tsx` displays `zoningResult.source`, but not a plain-language trust label. Docs mention provider/fallback/manual distinctions. | Homeowner sees "Live provider result", "Municipal fallback estimate", or "Manual assumption" beside every feasibility score, proposal, and lender package. | Convert raw source codes into user-safe labels and add short disclaimer copy in configurator/proposal/lender views. |
| Homeowner disclaimer and privacy consent | Product / Engineering | Pending | `docs/product-audit.md` calls this out as missing. `app/configurator/page.tsx` submit form does not show consent, data recipient, estimate limitation, or permit disclaimer near submission. | Submit area explains who receives contact/address data, that the estimate is not a final quote, and that zoning is not permit approval. | Add short consent/disclaimer copy under the submit button and create/link a lightweight privacy page if public testing starts. |
| Builder setup checklist | Engineering / Product | Pending | `app/builder/setup/page.tsx` exists, and docs describe setup conceptually. No repo evidence of a guided completion checklist with credentials/models/options/preview/first lead states. | Builder setup page shows completion states for credentials, service region, models, options, preview customer flow, and first test lead. | Add setup checklist component and keep docs aligned with it. |
| Project milestones and draw logs persist beyond browser session | Engineering | Pending | `app/projects/[id]/ProjectMilestones.tsx`, `app/projects/[id]/DrawReleaseLog.tsx`, and `app/projects/[id]/PermitTracker.tsx` use `sessionStorage`. `database/schema.sql` has `draw_milestones`, `permit_packages`, `permit_tasks`, and `document_requirements`, but project UI is not wired to persistent APIs. | Milestone, draw, and permit status changes survive refresh, another browser, and another device through Supabase/local JSON. | Add API/store layer for project state and migrate UI from `sessionStorage`. |
| Auth and builder isolation | Engineering / Product | Pending | `database/schema.sql` includes `builder_id`, but there is no confirmed auth flow or tenant-scoped dashboard. `lib/supabase.ts` only configures Supabase clients. | Builder dashboard only shows that builder's leads/models/options after login. Public users cannot access other builder data. | Add auth before multi-builder demos; for one-builder demos, show an explicit single-builder pilot warning. |
| Guide screenshots and troubleshooting | Docs / QA | Partial | `docs/builder-guide.html` explains flow and labels, but no screenshot assets or detailed troubleshooting matrix were found. `docs/product-audit.md` recommends adding screenshots and troubleshooting. | Guide includes screenshots for home, configurator, builder setup, dashboard, proposal, lender package, permit checklist, and project tracker; troubleshooting covers missing Supabase tables, failed lead save, no zoning result, and missing credentials. | Capture screenshots after the app is stable; add a troubleshooting section to `docs/builder-guide.html` or a companion guide. |

## Recommended Execution Order

| Order | Action | Why First | Completion Test |
| ---: | --- | --- | --- |
| 1 | Clean encoding artifacts | Fast trust win before any demo. | No corrupted visible UI text remains. |
| 2 | Add homeowner disclaimer and plain zoning labels | Prevents overclaiming and reduces trust/liability risk. | Configurator, proposal, and lender package use plain source labels and disclaimer copy. |
| 3 | Verify Supabase schema/seed and demo data | A failed save breaks the builder demo. | Full path works: catalog load, lead save, proposal, lender, permit, project. |
| 4 | Add builder setup checklist | Makes builder onboarding understandable. | Setup page shows completion state and preview next step. |
| 5 | Persist project/draw/permit state | Needed for serious project lifecycle credibility. | Project changes survive refresh and reload from store. |
| 6 | Add guide screenshots/troubleshooting | Helps builders self-serve after a guided demo. | Guide includes visual walkthrough and recovery instructions. |
| 7 | Add auth and builder isolation | Required before multiple builders or real leads. | Builder data is scoped by authenticated builder. |

## Follow-Up Agent Reporting Format

Use this format when reporting progress:

```text
ADUflow readiness status:
- Complete:
- Partial:
- Pending:
- Not verifiable:

Files changed:
- path

Next recommended action:
```

## Latest Inspection Notes

Inspection date: June 11, 2026

- Complete: none of the critical demo-hardening items are fully complete and verified from repo evidence.
- Partial: Supabase setup instructions, zoning source labeling infrastructure, guide feature explanation.
- Pending: visible encoding cleanup, homeowner disclaimer/privacy text, builder setup checklist, persistent project/draw state, auth/builder isolation.
- Not verifiable: live Supabase tables, successful end-to-end cloud lead save, mobile browser QA, actual guide screenshots.
