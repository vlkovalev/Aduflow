import Link from "next/link";
import { TopNav } from "../components/TopNav";
import { BILLING_PLANS, PUBLIC_PLAN_ORDER } from "../../lib/billingPlans";

export default function PricingPage() {
  return (
    <main>
      <TopNav />

      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">Pricing</p>
          <h2>Free during the pilot. Predictable after that.</h2>
          <p>
            ADUflow is free for every builder in the current guided pilot — no credit card, no time limit. When you
            move to general availability, pricing is a low flat base fee plus a metered charge only on proposals you
            actually mark &ldquo;Qualified,&rdquo; never on raw inbound form submissions. Month-to-month, no annual
            lock-in, no per-seat fees.
          </p>
        </div>
      </section>

      <section className="workflow">
        <article className="workflowCard">
          <span>Pilot</span>
          <h3>{BILLING_PLANS.pilot.name}</h3>
          <p>{BILLING_PLANS.pilot.tagline}</p>
          <p style={{ fontSize: 28, fontWeight: 900, margin: "12px 0" }}>$0</p>
          <p>Unlimited qualified proposals while you&rsquo;re part of the pilot.</p>
        </article>

        {PUBLIC_PLAN_ORDER.map((planId) => {
          const plan = BILLING_PLANS[planId];
          return (
            <article className="workflowCard" key={planId}>
              <span>{plan.name === "Growth" ? "Most builders" : "Starter"}</span>
              <h3>{plan.name}</h3>
              <p>{plan.tagline}</p>
              <p style={{ fontSize: 28, fontWeight: 900, margin: "12px 0" }}>${plan.basePricePerMonth}/mo</p>
              <p>
                Includes {plan.includedQualifiedProposals} qualified proposals/mo, then ${plan.overagePricePerProposal}{" "}
                each.
              </p>
            </article>
          );
        })}
      </section>

      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">Why a qualified proposal, not a lead</p>
          <h2>You only pay for proposals you decided are worth pursuing.</h2>
          <p>
            Traditional lead marketplaces bill contractors for raw, often shared or low-quality
            contacts. ADUflow meters usage on the opposite signal: a lead only counts toward your plan the moment you, the builder, mark it
            &ldquo;Qualified&rdquo; in your dashboard. Every proposal is exclusive to you — never resold to
            competitors.
          </p>
        </div>
        <div className="chipRow">
          <span className="chip">No shared or resold leads</span>
          <span className="chip">No per-seat fees</span>
          <span className="chip">No annual lock-in</span>
          <span className="chip">Published pricing, no sales call required</span>
        </div>
      </section>

      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">What&rsquo;s next</p>
          <h2>A pay-only-when-you-sell option is coming.</h2>
          <p>
            Once builder-isolated accounts, persisted project data, and a validated lender package are fully in
            place, we plan to add an optional success-fee tier: zero base cost, a small percentage of closed
            contract value. That directly mirrors ADUflow&rsquo;s mission &mdash; helping you sell more buildings,
            not just collect more inquiries.
          </p>
        </div>
        <div className="actions">
          <Link className="button primary" href="/builder/login">
            Join the pilot
          </Link>
          <Link className="button secondary" href="/configurator">
            See the configurator
          </Link>
        </div>
        <p className="formFinePrint">
          Paid plans renew monthly until canceled. Qualified-proposal overages apply as shown above. See the <Link href="/terms">billing terms</Link> and <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
    </main>
  );
}
