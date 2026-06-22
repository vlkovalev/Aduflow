import { redirect } from "next/navigation";
import { getAuthenticatedBuilderId } from "../../../lib/auth";
import { getBuilderBillingInfo } from "../../../lib/builderStore";
import { getQualifiedProposalUsage, currentPeriodKey } from "../../../lib/usageStore";
import { BILLING_PLANS, PUBLIC_PLAN_ORDER, getPlan } from "../../../lib/billingPlans";
import { TopNav } from "../../components/TopNav";
import { BillingActions } from "./BillingActions";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
  incomplete_expired: "Incomplete (expired)",
};

export default async function BuilderBillingPage() {
  const builderId = await getAuthenticatedBuilderId();
  if (!builderId) {
    redirect("/builder/login");
  }

  const billing = await getBuilderBillingInfo(builderId);
  const hasActiveSubscription = billing.subscriptionStatus === "active";
  const statusLabel = STATUS_LABELS[billing.subscriptionStatus] ?? billing.subscriptionStatus;
  const plan = getPlan(billing.planId);
  const periodKey = currentPeriodKey();
  const usedThisPeriod = await getQualifiedProposalUsage(builderId, periodKey);
  const overageCount =
    plan.includedQualifiedProposals !== null ? Math.max(0, usedThisPeriod - plan.includedQualifiedProposals) : 0;
  const estimatedOverageCost =
    overageCount > 0 && plan.overagePricePerProposal !== null ? overageCount * plan.overagePricePerProposal : 0;

  return (
    <main className="appShell">
      <TopNav />

      <section className="dashboardHeader">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Billing</h1>
        </div>
      </section>

      <section className="dataPanel">
        <div className="panelTitle">
          <h2>Subscription</h2>
          <span>{statusLabel}</span>
        </div>
        <dl className="summaryList">
          <div>
            <dt>Plan</dt>
            <dd>{plan.name}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusLabel}</dd>
          </div>
          {billing.currentPeriodEnd ? (
            <div>
              <dt>Renews</dt>
              <dd>{new Date(billing.currentPeriodEnd).toLocaleDateString()}</dd>
            </div>
          ) : null}
        </dl>
        <div style={{ marginTop: 16 }}>
          <BillingActions hasActiveSubscription={Boolean(billing.stripeCustomerId) && hasActiveSubscription} />
        </div>
      </section>

      <section className="dataPanel" style={{ marginTop: 20 }}>
        <div className="panelTitle">
          <h2>Qualified proposal usage</h2>
          <span>{periodKey}</span>
        </div>
        <p style={{ color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
          Counted only when you mark a lead &ldquo;Qualified&rdquo; — never on raw inbound submissions. See{" "}
          <a href="/pricing">pricing</a> for how this ties to your plan.
        </p>
        <dl className="summaryList">
          <div>
            <dt>Qualified this period</dt>
            <dd>
              {usedThisPeriod}
              {plan.includedQualifiedProposals !== null ? ` / ${plan.includedQualifiedProposals} included` : ""}
            </dd>
          </div>
          {overageCount > 0 ? (
            <div>
              <dt>Overage</dt>
              <dd>
                {overageCount} × ${plan.overagePricePerProposal} = ${estimatedOverageCost.toLocaleString()}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {plan.id === "pilot" ? (
        <section className="dataPanel" style={{ marginTop: 20 }}>
          <div className="panelTitle">
            <h2>Move to a paid plan</h2>
          </div>
          <p style={{ color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
            You&rsquo;re on the free pilot plan. When you&rsquo;re ready, choose a plan below — no annual lock-in.
          </p>
          <div className="summaryList">
            {PUBLIC_PLAN_ORDER.map((planId) => {
              const candidate = BILLING_PLANS[planId];
              return (
                <div key={planId}>
                  <dt>
                    {candidate.name} — ${candidate.basePricePerMonth}/mo, {candidate.includedQualifiedProposals}{" "}
                    included
                  </dt>
                  <dd>
                    <BillingActions hasActiveSubscription={false} planId={planId} label={`Choose ${candidate.name}`} />
                  </dd>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
