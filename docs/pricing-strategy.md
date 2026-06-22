# ADUflow Pricing Strategy

Date: June 21, 2026

## Executive Recommendation

ADUflow should not launch on either a pure flat-monthly-per-builder model or a pure per-lead-metered model. Both are the wrong fit on their own, for reasons specific to this market that the research below makes clear. The right structure is a phased hybrid: free during the current pilot, then a low flat base fee plus metered pricing on *qualified proposals* (not raw form-fills) once ADUflow leaves pilot, with an optional success-fee tier introduced later once trust infrastructure (auth, persistence, lender validation) is in place. This avoids the two biggest reputational failure modes seen in adjacent markets — the per-lead marketplace backlash (Angi/HomeAdvisor/Thumbtack) and the per-seat/opaque-quote backlash (BuilderTrend/JobNimbus/ServiceTitan) — while staying aligned with ADUflow's own stated mission of helping builders sell more buildings, not just generate inquiries.

## What Comparable Markets Actually Charge

| Category | Examples | Dominant Model | Typical Cost |
| --- | --- | --- | --- |
| Construction PM/CRM SaaS | BuilderTrend, CoConstruct, JobNimbus, Houzz Pro, ServiceTitan, Jobber | Tiered flat monthly, often + per-seat add-ons | $99–$1,099/mo base, $20–$30/user/mo extra |
| Vertical permit/construction SaaS | PermitFlow | Custom-quoted flat monthly/annual subscription, sales-assisted | Not published; pay regardless of project volume |
| Pay-per-lead marketplaces | Angi, HomeAdvisor, Thumbtack | Metered per-lead, often + annual base fee | $15–$85/lead, $250–$300/yr base, leads sold to 3–8 pros at once |
| General SaaS (cross-industry) | — | Increasingly hybrid: base + usage | 42% of buyers now prefer some usage-based component (IDC); hybrid models are growing fastest |

Sources consulted: [Buildertrend Pricing 2026](https://projul.com/blog/buildertrend-pricing-analysis-2026/), [CoConstruct Pricing 2026](https://projul.com/blog/coconstruct-pricing-analysis-2026/), [JobNimbus Pricing 2026](https://projul.com/blog/jobnimbus-pricing-analysis-2026/), [Houzz Pro Pricing](https://www.houzz.com/houzz-pro/pricing), [PermitFlow Pricing](https://www.trustradius.com/products/permitflow/pricing), [HomeAdvisor vs Angi vs Thumbtack lead fees](https://allbetterapp.com/allbetter-vs-homeadvisor-vs-thumbtack-vs-angi/), [FTC order against HomeAdvisor](https://www.ftc.gov/news-events/news/press-releases/2023/01/ftc-order-requires-homeadvisor-pay-72-million-stop-deceptively-marketing-its-leads-home-improvement), [Stripe: usage-based pricing for SaaS](https://stripe.com/resources/more/usage-based-pricing-for-saas-how-to-make-the-most-of-this-pricing-model).

## What Builders Actually Like and Hate

The pay-per-lead model has the worst reputation of anything researched. Contractors on Angi report effective acquisition costs above $1,400 per booked job because the same lead is resold to several competitors at once, and Trustpilot shows Angi at roughly 2.1/5 stars with recurring complaints about fake leads, wrong numbers, non-consensual submissions, and contracts that auto-renew annually with 30–35% early-cancellation penalties. The FTC fined HomeAdvisor $7.2 million in 2023 for deceptively marketing leads. This is the single clearest signal in the research: builders do not hate paying for results, they hate paying for *leads they did not control the quality of*, sold to several rivals simultaneously, with no recourse.

Flat-fee construction SaaS avoids the shared-lead problem but introduces a different complaint: cost that doesn't track usage. JobNimbus and similar tools layer a base CRM fee with per-seat charges that "creep" upward as a team adds a fifth or sixth user, forcing a tier jump for features the builder may not need. BuilderTrend made this worse in 2026 by removing published pricing entirely in favor of custom volume-based quotes, which builders experience as opacity — you can't compare it to anything before talking to sales. ServiceTitan has the same complaint. PermitFlow's flat subscription draws a more specific objection for low-volume, seasonal businesses: you pay the same amount in a slow month with one permit application as in a busy month with ten, because the fee isn't tied to what the software actually did for you that month.

Cutting across all of this, general SaaS buyer research (IDC) shows pricing preference has already shifted: 42% of buyers now prefer a usage-based or hybrid model over a pure flat subscription (38%), specifically because usage-based pricing gives the buyer control over spend and correlates cost with value received — which also measurably improves retention, since customers don't feel they're "renting" a tool they aren't using.

## Why This Matters Specifically for ADUflow

ADUflow's buyer is not a high-volume trade like HVAC or roofing, where a contractor might field 50+ leads a month and a per-lead fee makes sense as a marginal cost against many small jobs. ADU and modular builders close a handful of deals a month, each worth $150K–$450K+, and per the product audit, the company is currently at pilot stage with 10 target builders, unproven persistence, no auth/tenant isolation yet, and an unvalidated lender package. Two consequences follow directly from that:

A pure per-lead fee would invite immediate comparison to Angi/HomeAdvisor in the builder's mind, which is the worst possible association for a trust-building product — even though ADUflow's leads are not shared with competitors the way Angi's are, the framing risk is real and the audit already flags trust as the company's central weakness, not the product idea.

A flat monthly fee at category norms ($300–$1,000+/mo) is a hard ask before the lender package, zoning data source, and project persistence are validated, and it punishes builders in slow months exactly the way the PermitFlow seasonal-cost complaint describes — which matters more here than for a general contractor, because ADU sales cycles are lumpier.

## Recommended Structure

**Phase 0 — current pilot (10 builders).** Keep it free in exchange for structured feedback and case-study rights. The product audit is explicit that ADUflow is not yet a finished SaaS; charging now would reinforce that exact perception and burn pilot goodwill before the trust gaps (persistence, auth, lender validation) are closed. This also matches the audit's own recommended next step — validate "would this save enough qualification time to justify paying for it?" before pricing it.

**Phase 1 — general availability.** A low flat base fee plus metered pricing on qualified proposals, not raw inbound leads. Concretely: a base fee in the $149–$249/month range (below BuilderTrend/Houzz Pro's $300–$1,000+ range, since ADUflow does not yet match their PM/scheduling depth) that includes a set number of qualified proposals per month, with a per-proposal overage fee (roughly $25–$40) beyond that. "Qualified proposal" should mean a proposal the builder actually opened/acted on, not a raw form submission — this is the deliberate fix for the Angi billing-for-garbage-leads problem, since it ties the metered component to something the builder can audit and that correlates with delivered value, not volume. No annual lock-in at this stage; month-to-month, with published pricing on the website (the audit already flags the missing pricing page as a gap). This directly mirrors the hybrid base-plus-usage shift the general SaaS research shows buyers increasingly prefer, while sidestepping both reputational traps identified above.

**Phase 2 — once trust infrastructure exists.** Introduce an optional success-fee tier as an alternative to the subscription: zero or near-zero base cost, with a small percentage (roughly 0.25–0.5%, capped) of closed contract value. This should wait until auth, persisted projects, and a validated lender package exist, because it requires the builder to self-report or integrate closed-deal data, and the audit flags exactly that kind of trust dependency as premature today. When it's ready, it becomes a genuine differentiator — none of BuilderTrend, JobNimbus, Houzz Pro, or PermitFlow offer "pay only when you sell a building," and it speaks directly to ADUflow's own mission statement in the PRD.

## What to Explicitly Avoid

Do not bill per raw lead or per form submission — this is the Angi/HomeAdvisor pattern that has produced an FTC settlement and a collapsed reputation among tradespeople, and the failure mode (billing for low-quality or duplicate contacts) is exactly what a small builder will fear most given how visible those complaints are in the category. Do not price per seat in a way that penalizes a builder for adding a second estimator or a permit coordinator — most ADU/modular builder teams are small (1–10 people), and per-seat creep is one of the most consistently cited complaints against JobNimbus-style pricing. Do not hide pricing behind a mandatory sales call at this stage — BuilderTrend's 2026 move to custom volume-quotes and ServiceTitan's sales-gated pricing are both cited as trust-eroding; ADUflow's audit already calls out the missing pricing page as a credibility gap, and an early-stage, trust-building product benefits more from transparency than a mature incumbent does.

## Open Questions to Validate With Pilot Builders

Before finalizing exact price points, the 10 pilot builders are the cheapest source of truth available: ask whether they would rather pay a predictable monthly fee even in slow months, or a usage-tied fee that drops to near-zero when deal flow is quiet; ask what they currently spend per closed ADU deal on marketing/lead-gen today (this anchors the metered-tier price); and ask whether a success-fee-on-close model would feel like genuine alignment or like ADUflow "wanting a cut," since that reaction will differ by builder size and is worth knowing before building Phase 2 billing infrastructure.
