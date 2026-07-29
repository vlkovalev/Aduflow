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
          <h1>Free during the pilot. Predictable after that.</h1>
          <p>
            ADUflow is free for every builder in the current guided pilot — no credit card, no time limit. We are
            validating a small founding-builder tier in Canadian dollars before publishing general-availability
            checkout pricing. There are no charges for raw inbound form submissions, no annual lock-in, and no
            per-seat fees.
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

        <article className="workflowCard">
          <span>Founding builders</span>
          <h3>Early access</h3>
          <p>For the first few Alberta builders who help shape the workflow.</p>
          <p style={{ fontSize: 28, fontWeight: 900, margin: "12px 0" }}>CA$99/mo</p>
          <p>Includes 5 qualified proposals, builder-specific onboarding, and no overage charges during the founding period.</p>
          <p className="formFinePrint">Invitation only while pricing is validated. No credit card required to join the pilot.</p>
        </article>

        {PUBLIC_PLAN_ORDER.map((planId) => {
          const plan = BILLING_PLANS[planId];
          return (
            <article className="workflowCard" key={planId}>
              <span>Planned general availability</span>
              <h3>{plan.name}</h3>
              <p>{plan.tagline}</p>
              <p style={{ fontSize: 28, fontWeight: 900, margin: "12px 0" }}>Draft pricing</p>
              <p>
                Includes {plan.includedQualifiedProposals} qualified proposals/mo. Final CAD rates and overage pricing
                will be published after founding-builder interviews.
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
          <h2>Success-fee pricing comes later.</h2>
          <p>
            A success fee is not part of the pilot or founding tier. It will only be considered after closed-deal
            reporting and the lender/project evidence workflow are trusted in real builder use.
          </p>
        </div>
        <div className="actions">
          <Link className="button primary" href="/builder/login">
            Join the pilot
          </Link>
          <Link className="button secondary" href="/for-builders">
            See the builder pilot
          </Link>
        </div>
        <p className="formFinePrint">
          Paid plans renew monthly until canceled. Qualified-proposal overages apply as shown above. See the <Link href="/terms">billing terms</Link> and <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
    </main>
  );
}
