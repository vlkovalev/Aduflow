# ADUflow Website and Builder Guide Audit

Date: June 11, 2026

## Executive Verdict

ADUflow is credible enough for a guided 1:1 builder demo, especially if you frame it as a pilot product for address-first ADU pre-construction. It is not yet ready for self-serve builder onboarding or a multi-builder public launch.

The core product idea is strong: feasibility before configuration, then proposal, lender package, permit checklist, and project tracking. That is a much sharper position than a generic form or configurator. The main risk is trust. Builders will quickly ask whether zoning is real, whether data persists, whether the lender package is accepted by banks, and whether their customers can use the flow without explanation.

## 1. First-Impression Audit

| Area | What Works | What Needs Work |
| --- | --- | --- |
| Homepage message | The positioning is clear: "feasible, financeable, buildable" is the right promise. | The primary CTA says "Build a concept" but the strategy says "Check the address first." Change the CTA to "Check an address" or "Start feasibility check." |
| Visual credibility | The UI feels more serious than a no-code form and matches construction finance better than a playful SaaS look. | Some TSX files show encoding artifacts in rendered labels/buttons if they leak into UI. Clean these before any demo. |
| Trust | The app acknowledges zoning, costs, permits, and lender draws, which builders care about. | It needs visible "source and confidence" language wherever zoning appears. Fallback zoning must never look like certified parcel analysis. |
| Product clarity | The homepage explains the workflow in the right order. | It needs a stronger first-screen answer to "who is this for?" Builders, prefab manufacturers, lenders, or homeowners all appear in the story. Lead with builders. |

## 2. Website Navigation Audit

| Flow | Current State | Recommendation |
| --- | --- | --- |
| Home to configurator | Easy to find. | Rename CTA around address feasibility, not concept design. |
| Home to builder dashboard | Easy to find. | Good for demos, but risky for public use because there is no auth or builder isolation. |
| Builder dashboard to setup | Clear button exists. | Add a "Setup checklist" state showing models, options, credentials, and Supabase status. |
| Proposal to lender/permit/project | Strong product story once a lead exists. | Add clearer next-action buttons after proposal creation: "Open proposal," "Print lender package," "Start permit checklist." |
| Missing nav | No pricing, security, data-source, pilot signup, or help page. | Before builder outreach, add a compact "Pilot" or "For Builders" page with what is real today and what is pilot-only. |

## 3. Builder Flow Audit

| Builder Job | Current Support | Gap |
| --- | --- | --- |
| Manage lead pipeline | Dashboard, statuses, pipeline value, model demand. | No builder-level permissions; all leads are global. Fine for one pilot, not multiple builders. |
| Configure models/pricing | Builder setup supports models and options. | No bulk import, CSV template, duplicate protection, or active/inactive toggle editing for all fields. |
| Store credentials | Builder credentials are captured and used in lender package. | Needs validation and "lender package preview" from setup. |
| Qualify property | Address lookup exists with provider/fallback path. | Without a live zoning provider, it is only a municipal-rule demo. The UI should label this more strongly. |
| Track project after win | Active project tracker and draw log exist. | Project milestones and draw logs use `sessionStorage`, so they are not durable or shared across devices. |

## 4. Data Entry and Configuration Audit

| Screen | Builder/User Reaction | Fix |
| --- | --- | --- |
| Address lookup | This is the right first step. Builders will like it if it returns credible rules. | Add autocomplete/geocoding later, and show "provider result / fallback estimate / manual assumption" more prominently. |
| Manual parcel scenario | Useful fallback. | Rename as "Manual assumption" so it does not pretend to be zoning. |
| Zoning overrides | Good for builder review. | Add a reason/note field so overridden zoning data is auditable. |
| Model and option fields | Simple enough for MVP. | Add examples, min/max validation, import/export, and "preview customer flow" after edits. |
| Proposal intake | Clean, but duplicates property address after lookup. | Keep one address source and lock it unless the user chooses "Edit address." |

## 5. End-User Flow Audit

| Step | What A Homeowner Understands | Risk |
| --- | --- | --- |
| Enter address | Clear and valuable. | If no zoning result appears, the fallback to manual scenarios may feel like the product failed. Add a softer explanation. |
| Choose model/options | Understandable for motivated homeowners. | Some terms like helical piles, site logistics, and permit path need short tooltips. |
| Estimate | Factory/site split is excellent. | The confidence score can look more precise than the data supports. Show source and confidence together. |
| Submit for review | Clear conversion point. | Add privacy text: who receives the info, when they respond, and whether this is a quote or estimate. |
| Proposal | Valuable artifact. | Needs clearer "not permit approval / not final price" language without burying it in legal copy. |

## 6. Website Guide Audit

| Guide Area | Current Strength | Missing |
| --- | --- | --- |
| Builder story | The guide explains the pilot flow well. | Add screenshots of actual pages. Builders trust what they can see. |
| Setup instructions | Covers models, options, credentials conceptually. | Add step-by-step Supabase setup: run `database/schema.sql`, run `database/seed.sql`, verify `/api/leads`. |
| Zoning explanation | Mentions live API vs fallback. | Add exact fallback coverage list and a warning that it is not parcel geometry. |
| Lender package | Explains included sections. | Add sample PDF/print screenshot and define what a broker can actually use today. |
| Troubleshooting | Not enough. | Add "No zoning result," "Supabase table missing," "proposal not saved," and "credentials missing" fixes. |

## 7. Product Positioning and Messaging Audit

Best positioning:

> ADUflow helps ADU and prefab builders qualify homeowner leads by turning an address into a feasibility, pricing, permit, and lender package.

Avoid positioning as:

- A full permitting automation platform today.
- A certified zoning decision engine without live provider data.
- A bank-approved draw release system before lender integrations exist.
- A generic ADU configurator.

Suggested hierarchy:

1. Address-first feasibility for builders.
2. Builder-managed models and pricing.
3. Proposal and lender package generation.
4. Permit checklist and project lifecycle tracking.
5. Future: provider-grade zoning data, lender integrations, manufacturer marketplace.

## 8. Competitive Comparison

| Competitor Category | Examples | Their Advantage | ADUflow Advantage |
| --- | --- | --- | --- |
| Form builders | Typeform, Fillout, Jotform | Polished forms, templates, integrations, conditional logic. | ADU-specific pricing, zoning, lender, permit, and project outputs. |
| No-code portals | Softr, Glide, Stacker, Airtable Interfaces | Faster admin setup, auth, data tables, portals. | More domain-specific construction workflow and homeowner-facing estimate logic. |
| Internal tools | Retool | Strong operations dashboards and integrations. | Better fit for homeowner-facing sales and pre-construction packaging. |
| Zoning/permitting tools | Zoneomics, Symbium, Regrid, PermitFlow | Deeper zoning/permitting data or permit operations. | Can combine feasibility, builder sales, pricing, lender docs, and project lifecycle in one vertical flow. |
| Custom agency websites | Webflow, Framer, bespoke configurators | Better marketing polish and brand storytelling. | More operational value after the lead submits. |

Reference examples reviewed: [PermitFlow](https://www.permitflow.com/), [Symbium](https://symbium.com/), [Softr](https://www.softr.io/), [Typeform](https://www.typeform.com/), [Fillout](https://www.fillout.com/).

## 9. Advantages and Disadvantages

| Advantages | Disadvantages |
| --- | --- |
| Strong wedge: zoning before design. | Zoning credibility depends on live provider data or carefully labeled fallback data. |
| Builder catalog now connects to configurator. | No auth or builder data isolation. |
| Lender package is differentiated and demo-worthy. | Lender package acceptance is not validated with real brokers/lenders yet. |
| Project tracker extends beyond quote. | Project/draw state is not persisted in database yet. |
| Local fallback mode helps demos. | Supabase setup can silently fail if schema/seed are not installed. |
| Factory/site cost split is genuinely useful. | Cost logic still needs builder-specific regional calibration and margin controls. |

## 10. Readiness Assessment for Builders

| Readiness Area | Score | Notes |
| --- | ---: | --- |
| Product concept | 9/10 | Strong and differentiated. |
| Guided builder demo | 7/10 | Ready if demo data is prepared and limitations are stated honestly. |
| Self-serve builder onboarding | 4/10 | Needs auth, setup checklist, imports, help content, and durable project state. |
| Homeowner-facing public launch | 5/10 | Flow is usable, but trust/privacy/source labels need tightening. |
| Lender/broker validation | 5/10 | Package is a good start but needs real-world feedback. |
| Multi-builder pilot | 4/10 | Auth and tenant isolation are mandatory first. |

## Priority Fixes Before Presenting To Builders

1. Clean visible encoding artifacts in UI labels and comments.
2. Run and verify Supabase schema/seed in the connected project, then test a full lead save.
3. Add stronger zoning source labels: live provider, fallback estimate, or manual assumption.
4. Persist project milestones and draw logs in the database/local JSON structure instead of `sessionStorage`.
5. Add a builder setup checklist and sample CSV/import path for models and options.
6. Add screenshots and troubleshooting to the builder guide.
7. Add basic auth or at minimum a single-builder demo warning before showing the dashboard to more than one builder.
8. Add privacy and estimate disclaimer text near homeowner submission.

## Final Recommendation

Present ADUflow to builders now only as a guided pilot, not as a finished SaaS. The demo should say:

> "We are testing whether address-first feasibility plus lender-ready packages saves builders time on early ADU leads."

That is believable. It invites feedback instead of overpromising. If two or three builders confirm that the lender package and zoning-first intake reduce manual scoping time, the next engineering sprint should focus on data credibility, persistence, and builder isolation.
