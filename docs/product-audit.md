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
| Track project after win | Active project tracker, draw log, and permit tracker now persist through app APIs. | Browser and Supabase smoke testing are still needed before relying on this in a real builder demo. |

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
4. Smoke-test persisted project milestones, draw logs, and permit status after running the Supabase schema.
5. Add a builder setup checklist and sample CSV/import path for models and options.
6. Add screenshots and troubleshooting to the builder guide.
7. Add basic auth or at minimum a single-builder demo warning before showing the dashboard to more than one builder.
8. Add privacy and estimate disclaimer text near homeowner submission.

## Final Recommendation

Present ADUflow to builders now only as a guided pilot, not as a finished SaaS. The demo should say:

> "We are testing whether address-first feasibility plus lender-ready packages saves builders time on early ADU leads."

That is believable. It invites feedback instead of overpromising. If two or three builders confirm that the lender package and zoning-first intake reduce manual scoping time, the next engineering sprint should focus on data credibility, persistence, and builder isolation.

## 11. End-User Readiness Assessment

End-User Readiness Verdict:

ADUflow is not ready for broad public homeowner traffic yet. It is ready for supervised test users or homeowners invited by one pilot builder.

Reason:

The end-user value is clear: enter an address, understand feasibility, configure a realistic ADU concept, and request builder review. The weakness is not the idea. The weakness is trust at the exact moments where homeowners need confidence: zoning source, estimate precision, privacy, next steps, and error handling.

| Category | Assessment | Score |
| --- | --- | ---: |
| Clarity | The high-level flow is understandable, but "Build a concept" underplays the real value of address feasibility. Some construction terms need simpler explanations. | 6/10 |
| Ease of use | A motivated homeowner can complete the flow. It still feels like a builder tool exposed to homeowners, not a homeowner-first intake. | 6/10 |
| Flow simplicity | Address, model, options, estimate, contact is logical. The duplicate address field and manual parcel scenario fallback add friction. | 6/10 |
| Trust | Cost split and lender package create trust. Zoning confidence can look more authoritative than the data supports. | 5/10 |
| Error handling | Basic fallback exists when zoning fails. User-facing recovery guidance is too thin. | 4/10 |
| Mobile experience | Not verifiable from provided materials without a live responsive browser pass. The CSS appears responsive in places, but no screenshot QA is documented. | Not verified |
| Perceived polish | Good MVP polish, but encoding artifacts and missing help text reduce confidence. | 5/10 |
| Support/help | Guide exists for builders, but homeowner help, FAQ, privacy, and "what happens next" content are missing. | 4/10 |
| Output quality | Proposal and lender package are strong for an MVP. They need clearer disclaimers and source labeling. | 7/10 |

Main blockers:

| Blocker | Who It Affects | Why It Matters | Fix |
| --- | --- | --- | --- |
| Zoning source is not always obvious enough | Homeowners, builders | A homeowner may treat fallback data as permit-grade advice. That creates trust and liability risk. | Add a prominent source label beside every feasibility result: "Live zoning provider," "Municipal fallback estimate," or "Manual assumption." |
| No homeowner privacy/consent copy near submit | Homeowners | Users need to know who receives their address/contact info. | Add short consent text under the submit button and link to a privacy page. |
| Error states feel abrupt | Homeowners | "No zoning data found" can feel like a dead end. | Add a guided recovery state: confirm city, choose manual assumption, or request builder review anyway. |
| Duplicate address entry | Homeowners | Creates doubt about which address is being checked. | Use one address field across lookup and proposal submission. |
| Encoding artifacts in UI | Everyone | Broken characters make the product feel unfinished. | Replace pasted icon characters with plain ASCII labels or proper icon components. |

Minimum fixes before exposing to users:

1. Clean all visible encoding artifacts.
2. Rename primary homeowner CTA to "Check my address" or "Start feasibility check."
3. Add source/confidence labels directly beside the feasibility score.
4. Add privacy and estimate disclaimer text before form submission.
5. Add friendly error recovery for failed address lookup.
6. Remove duplicate address entry or make the second field read-only after lookup.
7. Test mobile at 390px, 768px, and desktop widths and fix any layout overflow.

Nice-to-have improvements:

1. Address autocomplete with city/province/state normalization.
2. Tooltips for helical piles, site condition, permit path, factory cost, site cost, and draw plan.
3. Homeowner FAQ page.
4. Email confirmation after submission.
5. "Save or email this estimate" option.
6. Progress indicator across the configurator.

Confidence level:

Medium. The code and docs show enough to assess the product flow and content, but the audit did not include a fresh live browser walkthrough, mobile screenshots, or real builder/homeowner usability sessions.

## 12. Priority Fix List

| Priority | Issue | Affected User | Why It Matters | Recommended Fix | Effort | Impact |
| --- | --- | --- | --- | --- | --- | --- |
| Critical | Visible encoding artifacts in UI labels/buttons | Builders, homeowners | Makes the product look broken before the value is understood. | Replace corrupted characters with ASCII labels or a real icon library. | Low | High |
| Critical | Supabase schema/seed not verified in the connected project | Builder, admin | Lead saving and builder setup may fail in real demo conditions. | Run `database/schema.sql`, run `database/seed.sql`, then complete one full lead save. | Medium | High |
| Critical | Zoning fallback can appear too authoritative | Homeowners, builders | Creates trust and liability risk. | Label source and confidence everywhere: live provider, fallback estimate, manual assumption. | Low | High |
| Critical | No auth or builder isolation | Builders | Cannot safely demo to multiple builders or store real leads. | Add authentication and builder-scoped records before multi-builder pilot. | High | High |
| High | Project milestones and draw logs use browser session storage | Builders, lenders | Project state disappears and cannot be shared across users/devices. | Persist milestones and draw release logs in Supabase/local JSON via API routes. | Medium | High |
| High | Builder onboarding lacks checklist | Builders | Builders may not know what data is required before the configurator works well. | Add setup checklist: credentials, models, options, first preview, first lead. | Medium | High |
| High | No data import flow | Builders | Manual model/option entry will slow onboarding and reduce pilot adoption. | Add CSV template and import for models/options. | Medium | High |
| High | Lender package not validated with real brokers/lenders | Builders, homeowners | "Lender-ready" is the product promise; it needs market validation. | Review package with 2 mortgage brokers and one construction lender; revise fields. | Medium | High |
| High | Homeowner privacy/consent missing near submit | Homeowners | Users submit address/contact data and need to know what happens next. | Add consent text and privacy page. | Low | Medium |
| Medium | Address lookup lacks autocomplete | Homeowners | Typos and incomplete locations will produce poor zoning results. | Add geocoding/autocomplete provider or address normalization. | Medium | Medium |
| Medium | Manual parcel scenario wording is unclear | Homeowners, builders | It can be confused with official zoning. | Rename to "Manual feasibility assumption." | Low | Medium |
| Medium | No preview from builder setup after changes | Builders | Builders need confidence their pricing edits affect the customer flow. | Add "Preview configurator" and "Preview lender package" actions. | Low | Medium |
| Medium | Guide lacks screenshots | Builders | Text-only guide is harder to trust and follow. | Add screenshots for homepage, configurator, setup, dashboard, lender package, project tracker. | Medium | Medium |
| Medium | Weak support/troubleshooting content | Builders | Common setup failures will cause friction. | Add troubleshooting section for missing Supabase tables, no zoning result, failed proposal save. | Low | Medium |
| Low | No public pilot/pricing page | Builders | Interested builders need a clear next step. | Add "Pilot for Builders" page. | Medium | Medium |
| Low | No homeowner FAQ | Homeowners | Reduces support questions and increases trust. | Add FAQ near configurator or proposal. | Low | Medium |

## 13. Flow Improvements

| Flow | Current Problem | Improved Flow | Required Changes |
| --- | --- | --- | --- |
| Builder onboarding flow | Builder setup exists, but it is a set of tabs, not a guided setup. | Builder lands on a checklist: company credentials, service region, models, options, preview, first lead. | Add onboarding checklist component, completion states, and setup progress banner. |
| First project creation flow | A lead becomes an active project only when marked won, but the transition is not explained. | When a lead is marked won, show "Create active project" with default milestones and draw log. | Add conversion confirmation screen and persist project records. |
| Data import flow | Builders must manually add models and options. | Builder downloads CSV template, uploads catalog, reviews validation results, imports. | Add CSV template, upload endpoint, validation table, import confirmation. |
| Data validation flow | Model and option forms have basic required fields but limited business validation. | Inline validation catches duplicate model codes, unrealistic square footage, missing option categories, negative prices. | Add validation rules server-side and client-side. |
| Preview flow | Builders can preview model links, but there is no full "customer flow preview" after setup. | After saving setup, builder clicks "Preview customer configurator" and sees their catalog and lender output. | Add preview CTA and sample lead/proposal generation mode. |
| Publish/share flow | Proposal share exists, but the homeowner post-submit path is minimal. | After submission, homeowner sees a success page with proposal link, email confirmation, and expected response time. | Add completion page or richer submitted state; add email template later. |
| Edit/update flow | Lead data can be saved, but proposal edits after creation are limited. | Builder can edit lead, pricing assumptions, zoning notes, and regenerate proposal/lender package. | Add lead edit page and audit note fields. |
| Error recovery flow | Failed zoning lookup only says no data found. | User gets three choices: edit address, continue with manual assumption, or request builder feasibility review. | Add recovery card with options and clear explanation. |
| Help/documentation flow | Builder guide is separate and text-heavy. | Help links appear inside setup, configurator, and dashboard at the moment of confusion. | Add contextual help links and a `/help` or `/guide` route. |
| End-user completion flow | Proposal request completion is functional but thin. | User gets reassurance: what was submitted, what happens next, when builder responds, and what is not guaranteed. | Add completion confirmation panel and FAQ snippets. |
| Feedback/report issue flow | No visible way to report bad zoning data or wrong price assumptions. | User can flag "This zoning/pricing looks wrong" and send notes to admin/builder. | Add feedback form tied to lead/proposal ID. |

## 14. Suggested Website and Guide Rewrite

### Better Homepage Structure

1. Hero: builder-focused headline, address-first CTA, short proof of workflow.
2. Problem band: why ADU leads stall before design.
3. Product workflow: address check, catalog pricing, proposal, lender package, permit/project tracking.
4. Builder value: fewer dead-end leads, faster qualification, stronger financing package.
5. Output examples: proposal, lender package, permit checklist, project tracker screenshots.
6. Pilot CTA: "Book a builder pilot" and "Try address check."
7. Trust/disclaimer: zoning data sources, pilot status, not permit approval.

### Better CTA Wording

| Current | Better |
| --- | --- |
| Build a concept | Check an address |
| View builder dashboard | View builder OS |
| Request builder review | Send feasibility package |
| New lead quote | Start address check |
| Setup Builder OS | Complete builder setup |

### Better Product Explanation

ADUflow should not be described as only a configurator. The stronger explanation:

> ADUflow is a pre-construction operating system for ADU and prefab builders. It turns a homeowner address into a first-pass zoning screen, model-fit estimate, proposal, lender package, permit checklist, and active project tracker.

### Missing Website Sections

| Section | Why It Is Needed |
| --- | --- |
| For Builders | Clarifies the primary buyer and why they should care. |
| How It Works | Converts the complex product into a memorable workflow. |
| Sample Outputs | Shows proposal, lender package, and permit checklist before signup. |
| Data Sources | Explains live provider vs fallback vs manual assumptions. |
| Pilot Program | Gives builders a clear next step. |
| FAQ | Handles zoning, cost, lender, permit, privacy, and accuracy questions. |
| Privacy/Security | Required before collecting real homeowner addresses and contact info. |

### Better Builder Onboarding Copy

> Complete your builder setup before sharing ADUflow with homeowners. Your models, option prices, service regions, and credentials drive every estimate, proposal, lender package, and permit checklist. Start with one or two best-selling ADU models; you can refine pricing after the first pilot leads.

### Guide Introduction Sample

> This guide shows how to use ADUflow for a builder pilot. The goal is not to replace your estimator, permit coordinator, or lender. The goal is to qualify homeowner leads faster by creating a consistent feasibility and financing package from the first address check.

### "How It Works" Sample Copy

1. Check the property address.
   ADUflow looks for zoning and municipal rule data. If live parcel data is not available, the result is labeled as a fallback estimate or manual assumption.

2. Match the property to a builder model.
   The homeowner chooses from your active ADU models and options. The estimate separates factory cost from site cost.

3. Generate the proposal package.
   ADUflow saves the lead and creates a proposal with feasibility, budget range, timeline, and next steps.

4. Create lender and permit outputs.
   The same lead creates a lender package, draw schedule, permit checklist, and project tracker.

5. Move qualified leads into active projects.
   When a lead becomes a contract, ADUflow tracks permit status, construction milestones, inspections, and draw releases.

### Example Screenshots Needed

| Screenshot | Purpose |
| --- | --- |
| Homepage hero | Show the product promise and CTA. |
| Address lookup result | Prove the zoning-first wedge. |
| Configurator estimate panel | Show cost split and feasibility. |
| Proposal page | Show homeowner output quality. |
| Builder dashboard | Show pipeline and analytics. |
| Builder setup models/options | Show builders they control pricing. |
| Builder credentials | Show lender package metadata source. |
| Lender package print view | Show bankable output. |
| Permit checklist | Show post-proposal workflow. |
| Project tracker/draw log | Show lifecycle beyond quote. |

### FAQ Entries To Add

| Question | Suggested Answer |
| --- | --- |
| Is this a permit approval? | No. ADUflow provides a first-pass feasibility screen. A formal survey, municipal review, and permit approval are still required. |
| Where does zoning data come from? | ADUflow can use live zoning providers when configured. If no provider result is available, the app labels results as municipal fallback estimates or manual assumptions. |
| Is the price final? | No. The estimate is a pre-construction range based on builder model pricing, options, and site assumptions. Final pricing requires builder review. |
| Who receives my information? | Your submission is sent to the participating builder or ADUflow pilot administrator for feasibility review. |
| Can my builder change models and prices? | Yes. Builders manage active models, option prices, service regions, and credentials in Builder Setup. |
| Can this be used for financing? | The lender package is designed to support financing conversations, but lender acceptance depends on each broker, bank, and loan program. |
| What if my address is not found? | You can correct the address, continue with a manual assumption, or request a builder review. |
| Does ADUflow support all US and Canada zoning? | Not by itself. Full coverage requires provider integrations and local rule validation. Fallback data is for demos and first-pass screening only. |

### Troubleshooting Sections To Add

| Problem | Guide Fix |
| --- | --- |
| No zoning result | Explain supported markets, fallback behavior, address formatting, and manual assumption path. |
| Proposal does not save | Check Supabase env vars, schema, seed data, and local fallback. |
| Builder catalog does not show | Confirm models/options are active and catalog API returns records. |
| Lender package shows default credentials | Complete Builder Setup credentials and refresh package. |
| Project milestones disappear | Explain current prototype storage and planned database persistence. |
| Prices look wrong | Check model base price, option prices, site condition, utilities, and foundation assumptions. |

## 15. Final Executive Summary

Overall Verdict:

ADUflow has a strong product foundation and a sharp market wedge, but it must be presented honestly as a guided builder pilot. It is not ready for broad public homeowner traffic or multi-builder self-serve onboarding.

Main Strength:

The product is not just another ADU configurator. Its strongest idea is connecting address feasibility, builder catalog pricing, lender packaging, permit tasks, and project milestones into one pre-construction workflow.

Main Weakness:

Trust infrastructure is behind the product promise. Zoning source labeling, real data persistence, auth, builder isolation, mobile QA, privacy copy, and error recovery need to catch up before serious adoption.

| Score Area | Score | Strict Assessment |
| --- | ---: | --- |
| Builder Experience Score | 7/10 | Good foundation for guided demos; not self-serve yet. |
| End-User Experience Score | 5/10 | Understandable, but trust and help gaps block public launch. |
| Website Clarity Score | 6/10 | Strong message, but CTA and audience hierarchy need tightening. |
| Guide Quality Score | 6/10 | Useful deck-style guide, missing screenshots, setup details, and troubleshooting. |
| Competitive Readiness Score | 6/10 | Differentiated vertical workflow, but less mature than form/portal tools in onboarding, auth, polish, and integrations. |

Is Aduflow ready to present to builders?

Yes, but only as a guided pilot demo with clear limitations. Do not present it as a finished SaaS platform yet.

Minimum changes required before presenting:

1. Clean UI encoding artifacts.
2. Verify Supabase schema/seed and full lead persistence.
3. Add explicit zoning source labels and fallback disclaimers.
4. Add builder setup checklist.
5. Add privacy/estimate disclaimer near homeowner submission.
6. Prepare one complete demo path: address lookup, model choice, lead save, proposal, lender package, permit checklist, project tracker.
7. Add guide screenshots or at least a short visual walkthrough.

Best next step:

Do a "demo hardening sprint" before any builder meeting. Focus on credibility, not new features: clean UI text, verify persistence, label data sources, improve recovery states, and prepare a polished sample builder dataset. After that, show ADUflow to 3 builders and ask one question: "Would this save enough qualification time to justify paying for it?"

## Quality Checklist

| Requirement | Included |
| --- | --- |
| Website first-impression analysis | Yes |
| Navigation analysis | Yes |
| Builder flow analysis | Yes |
| End-user flow analysis | Yes |
| Data-entry usability analysis | Yes |
| Website guide analysis | Yes |
| Competitive comparison | Yes |
| Honest advantages and disadvantages | Yes |
| Readiness verdict for builders | Yes |
| Readiness verdict for end users | Yes |
| Prioritized fix list | Yes |
| Specific flow improvements | Yes |
| Suggested website/guide copy improvements | Yes |
| Final scores and executive summary | Yes |
