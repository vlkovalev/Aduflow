# ADUflow Builder Activation Plan

Date: July 29, 2026

## Why This Exists

The pilot's constraint is not more features — it is whether a builder gets real value in their first 30 minutes and comes back for a second lead. Everything below is ordered by how directly it shortens the path from signup to "this saved me time on a real inquiry." Payments, a marketplace, automated permit filing, and a success-fee system are explicitly out of scope until builders are using the qualification workflow repeatedly — adding them now increases complexity before that is proven.

## Priority Order

**1. Done-for-you first catalog setup.** Manual catalog entry is the biggest activation hurdle. This does not require new engineering: `docs/catalog-import-guide.md` already has a working CSV/Excel importer wired into the configurator, proposal, and lender package. The gap is that a builder currently has to fill in the template themselves. Making it "done-for-you" means someone on the ADUflow side takes the builder's spreadsheet, PDF, or website listing and runs the import for them during onboarding — an ops change, not a dev task. PDF plan sets still are not imported automatically, so a PDF-only builder needs a person to convert it into the CSV/XLSX format first.

**2. One-real-lead concierge onboarding.** Pilot pitch: "Send us one real lead. We'll help configure the catalog, run the address, review the output with you, and revise the workflow once." This removes the fear of signing up and being left alone with a blank setup screen, and it directly produces the first proof point (see #9).

**3. Branded homeowner report and intake link.** Two related pieces:
   - A reusable, builder-branded intake link (e.g. `aduflow.ca/for-builder/modworks`) with their logo, models, service region, contact details, and disclaimers — makes ADUflow feel like the builder's own sales tool, not another dashboard to explain.
   - A shareable homeowner report (clean PDF/email) after each completed flow: feasibility summary, budget range, assumptions and exclusions, recommended next step, and a builder contact button. The builder should feel more professional after one lead, not after reading a feature list.

**4. Builder-controlled assumptions and guardrails.** Let builders set minimum project budget, service radius, excluded municipalities, site-condition allowances, margin/contingency rules, and "needs manual review" triggers. This builds more trust than pretending the zoning engine is perfect, and it reduces the number of bad-fit leads that reach the builder.

**5. Time-saved dashboard.** Track leads screened, estimated hours avoided, qualified proposals, average response time, model demand, and leads rejected before manual estimating. The sales message becomes "ADUflow saved you 6 estimating hours this month," not "ADUflow has 14 features."

## Supporting Ideas (lower lift, still worth doing early)

- **Quantify "no shared leads" against a number.** `docs/pricing-strategy.md` already cites contractors paying $1,400+ per booked job when the same lead is resold to competitors on traditional lead marketplaces. Put that figure next to "every proposal is exclusive to you" on the landing page — a stat lands harder than a claim.
- **SMS alert on new qualified leads.** Builders are on a job site, not logged into a dashboard tab. A text the moment a lead is marked "Qualified" will get opened faster than anything in-app.
- **Parallel-run guarantee for the first two weeks.** Let a builder keep their existing intake process running alongside ADUflow with no cutover. Removes the biggest hesitation for a busy owner — "what if I switch and it breaks something."
- **Make Alberta localization visible.** CAD by default for Alberta builders, Alberta municipal terminology, and explicit labeling of Edmonton backyard housing and Calgary secondary/backyard-suite assumptions. Local trust matters more than another generic automation feature.
- **Simple ROI comparison during onboarding.** Ask average early-stage lead volume, minutes spent per initial qualification, average estimator/owner hourly cost, and percentage of leads rejected after review; show an estimated monthly value, clearly labeled as a planning estimate — not a guarantee.
- **One real proof point beats every feature on this list.** Once a pilot builder has a qualified lead through the tool, that becomes the first line of the next outreach email, not a feature summary. This is the highest-leverage output of priority #2.

## Explicitly Not Building Yet

Payments, a lead marketplace, automated permit filing, and a success-fee system. Each depends on trust or usage data ADUflow does not yet have (see `docs/pricing-strategy.md`, Phase 2), and building them now would divert effort from proving the qualification workflow gets used repeatedly.
