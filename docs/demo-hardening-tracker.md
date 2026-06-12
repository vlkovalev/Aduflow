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
| Encoding artifacts cleaned from visible UI | Engineering | Complete | `rg -n '⚠|⚙|👁|✏|💾|✔|⌛|📤|✉|â|ð|ï|Œ|œ|š|Ÿ|€' app lib docs database` returns no matches after cleanup. | No corrupted characters render in browser; search for common mojibake fragments and confirm no visible UI labels are affected. | Run browser QA after build to visually confirm. |
| Supabase schema and seed verification instructions | Docs / Engineering | Complete | `docs/supabase-setup.md` documents env vars, schema, seed, and full verification path. `database/schema.sql` includes project and draw persistence tables. | A documented checklist shows: run schema, run seed, verify `/api/catalog`, create one lead, open proposal, open lender package. Connected Supabase project has tables created. | Run a live smoke test in the Supabase project. |
| Zoning source labels | Engineering / Product | Complete | `app/configurator/page.tsx` shows first-pass source label. `lib/proposalBuilder.ts` maps source codes to plain labels. `app/proposals/[id]/lender/page.tsx` displays zoning source and zone classification. | Homeowner sees "Live provider result", "Municipal fallback estimate", or "Manual assumption" beside every feasibility score, proposal, and lender package. | Browser QA to confirm labels render in all proposal paths. |
| Homeowner disclaimer and privacy consent | Product / Engineering | Complete | `app/configurator/page.tsx` shows submit-area fine print explaining estimate limitation, permit limitation, and data recipient. | Submit area explains who receives contact/address data, that the estimate is not a final quote, and that zoning is not permit approval. | Add full privacy page before public traffic. |
| Builder setup checklist | Engineering / Product | Partial | `app/builder/setup/page.tsx` now shows database, models, options, and credentials completion cards. Preview/first-test-lead states are not yet tracked. | Builder setup page shows completion states for credentials, service region, models, options, preview customer flow, and first test lead. | Add preview and first test lead completion states later. |
| Project milestones and draw logs persist beyond browser session | Engineering | Partial | `lib/projectStore.ts`, `/api/projects/[id]/milestones`, and `/api/projects/[id]/draws` persist milestones/draws through Supabase/local JSON. `PermitTracker` still uses `sessionStorage`. | Milestone, draw, and permit status changes survive refresh, another browser, and another device through Supabase/local JSON. | Migrate permit tracker state to the same project store pattern. |
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

- Complete: visible encoding cleanup from repo scan, Supabase setup instructions, zoning source labels, homeowner disclaimer.
- Partial: builder setup checklist, project/draw persistence, guide feature explanation.
- Pending: auth/builder isolation, permit tracker persistence, guide screenshots/troubleshooting.
- Not verifiable: live Supabase tables, successful end-to-end cloud lead save, mobile browser QA, actual guide screenshots.
