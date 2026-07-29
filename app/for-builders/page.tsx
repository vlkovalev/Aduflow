import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "../components/TopNav";
import { VisitTracker } from "./VisitTracker";

export const metadata: Metadata = {
  title: "ADUflow for Builders | Qualify ADU Leads Before Manual Estimating",
  description:
    "A guided builder pilot for turning a property address into a first-pass feasibility screen, preliminary budget, proposal, and project workflow.",
  alternates: { canonical: "/for-builders" },
};

const outcomes = [
  {
    title: "Protect estimating time",
    copy: "Collect the property, model, budget, and site assumptions before your estimator starts a custom quote.",
  },
  {
    title: "Present one consistent budget",
    copy: "Separate factory and site allowances, then carry the same scope into the proposal and lender-oriented package.",
  },
  {
    title: "Keep the lead after the quote",
    copy: "Move qualified homeowners into permit tasks, project milestones, and draw tracking without rebuilding the file.",
  },
];

const pilotIncludes = [
  "Verified, builder-isolated account",
  "Your models, options, pricing, currency, and service region",
  "Builder-specific homeowner configurator link",
  "Proposal and lender-oriented package",
  "Permit checklist, project milestones, and draw log",
  "Free guided onboarding during the pilot",
  "Done-for-you first catalog import from your existing price sheet",
  "Two-week parallel run alongside your current intake process",
];

const conciergeSteps = [
  {
    title: "Send your first catalog",
    copy: "Share your top 2–3 models and major options by spreadsheet or email. We help turn them into the first usable catalog.",
  },
  {
    title: "Run one real lead",
    copy: "Use one homeowner address to compare ADUflow's first-pass package with the way your team qualifies the lead today.",
  },
  {
    title: "Review and adjust",
    copy: "We review the assumptions, pricing, and output with you before asking for any paid commitment.",
  },
];

export default function ForBuildersPage() {
  return (
    <main>
      <VisitTracker pageTitle="ADUflow for Builders" />
      <TopNav />
      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">For ADU, garden-suite, and prefab builders</p>
          <h1>Find the leads worth estimating.</h1>
          <p>
            ADUflow gives each builder a branded, address-first intake workflow.
            Homeowners receive a preliminary feasibility and budget package;
            your team receives the property, selected model, assumptions, and
            contact details in one builder-only pipeline.
          </p>
          <div className="actions">
            <Link className="button primary" href="/builder/login">Join the free pilot</Link>
            <Link className="button secondary" href="/configurator">Preview the read-only configurator</Link>
          </div>
        </div>
      </section>
      <section className="workflow" aria-label="Builder outcomes">
        {outcomes.map((outcome, index) => (
          <article className="workflowCard" key={outcome.title}>
            <span>0{index + 1}</span>
            <h2>{outcome.title}</h2>
            <p>{outcome.copy}</p>
          </article>
        ))}
      </section>
      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">Exclusive by design</p>
          <h2>Your qualified proposals stay yours.</h2>
          <p>
            Every proposal is exclusive to your builder account — never shared or resold to competitors. Traditional
            marketplaces can push contractors above $1,400 in acquisition cost for a booked job when the same lead is
            resold across the market. ADUflow is designed around builder-controlled, qualified opportunities instead.
          </p>
        </div>
      </section>
      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">What the pilot includes</p>
          <h2>A working qualification flow configured around your catalog.</h2>
          <p>
            Start with one or two best-selling models. We use your feedback to
            test whether the workflow reduces dead-end consultations and quote
            preparation time.
          </p>
        </div>
        <div className="chipRow">
          {pilotIncludes.map((item) => <span className="chip" key={item}>{item}</span>)}
        </div>
      </section>
      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">Pilot concierge</p>
          <h2>We help you reach the first useful result.</h2>
          <p>
            You do not need to prepare a perfect catalog or learn a new system alone. The guided pilot starts with
            one real builder workflow, one real address, and a review of what should change before wider homeowner use.
          </p>
        </div>
        <div className="workflow">
          {conciergeSteps.map((step, index) => (
            <article className="workflowCard" key={step.title}>
              <span>0{index + 1}</span>
              <h2>{step.title}</h2>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">Clear boundaries</p>
          <h2>Pre-construction screening, with builder review.</h2>
          <p>
            ADUflow does not issue permits, approve financing, or replace local
            planning, engineering, or estimating judgment. Zoning and pricing
            outputs are preliminary and should be reviewed before a customer
            commitment.
          </p>
          <div className="actions">
            <Link className="button primary" href="/builder/login">Create a pilot account</Link>
            <Link className="button secondary" href="/pricing">Review pricing</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
