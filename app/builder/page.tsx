import Link from "next/link";
import { listLeads, type LeadRecord } from "../../lib/leadStore";
import { formatCurrency } from "../../lib/proposalBuilder";

const modules = [
  "Model library",
  "Pricing rules",
  "Option catalog",
  "Permit checklist",
  "BOM templates",
  "Lead pipeline",
  "HOA package",
  "Draw verification",
];

const drawQueue = [
  {
    stage: "Foundation ready",
    evidence: "12 geotagged photos",
    lender: "Pending release",
  },
  {
    stage: "Factory completion",
    evidence: "QA report uploaded",
    lender: "Ready to notify",
  },
  {
    stage: "Final inspection",
    evidence: "City signoff needed",
    lender: "Blocked",
  },
];

export default async function BuilderDashboard() {
  const leads = await listLeads();
  const stats = getDashboardStats(leads);

  return (
    <main className="appShell">
      <nav className="nav compact" aria-label="Main navigation">
        <Link className="brand" href="/">
          ADUflow
        </Link>
        <div className="navLinks">
          <Link href="/configurator">Configurator</Link>
          <Link href="/builder">Builder OS</Link>
        </div>
      </nav>

      <section className="dashboardHeader">
        <div>
          <p className="eyebrow">Builder and lender command center</p>
          <h1>Manage feasibility, prefab quotes, permits, and draw evidence.</h1>
        </div>
        <Link className="button primary" href="/configurator">
          Create quote
        </Link>
      </section>

      <section className="dashboardStats">
        <Stat label="Saved leads" value={String(leads.length)} />
        <Stat label="Proposal value" value={formatCurrency(stats.totalValue)} />
        <Stat label="Likely feasible" value={String(stats.feasibleCount)} />
        <Stat label="High risk" value={String(stats.highRiskCount)} />
      </section>

      <section className="dashboardGrid">
        <div className="dataPanel">
          <div className="panelTitle">
            <h2>Lead pipeline</h2>
            <span>Saved proposals</span>
          </div>
          <div className="leadList">
            {leads.length ? (
              leads.slice(0, 6).map((lead) => (
                <Link className="leadRow" href={`/proposals/${lead.id}`} key={lead.id}>
                  <div>
                    <strong>{lead.customerName}</strong>
                    <span>
                      {lead.modelName} - {lead.propertyAddress}
                    </span>
                  </div>
                  <div>
                    <strong>{formatCurrency(lead.estimatedPrice)}</strong>
                    <span>{lead.feasibilityResult}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="emptyState">
                <strong>No saved leads yet</strong>
                <span>Create a quote from the configurator to populate this pipeline.</span>
              </div>
            )}
          </div>
        </div>

        <div className="dataPanel">
          <div className="panelTitle">
            <h2>Permit queue</h2>
            <span>Next action</span>
          </div>
          {leads.length ? (
            <div className="permitQueue">
              {leads.slice(0, 4).map((lead) => (
                <Link href={`/permit/${lead.id}`} key={lead.id}>
                  <strong>{lead.modelName}</strong>
                  <span>{lead.permitPath}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="moduleGrid">
              {modules.map((module) => (
                <span key={module}>{module}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dataPanel fullWidthPanel">
        <div className="panelTitle">
          <h2>Digital draw verification</h2>
          <span>Lender evidence queue</span>
        </div>
        <div className="leadList">
          {drawQueue.map((draw) => (
            <article key={draw.stage}>
              <div>
                <strong>{draw.stage}</strong>
                <span>{draw.evidence}</span>
              </div>
              <div>
                <strong>{draw.lender}</strong>
                <span>Milestone package</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getDashboardStats(leads: LeadRecord[]) {
  return {
    totalValue: leads.reduce((total, lead) => total + lead.estimatedPrice, 0),
    feasibleCount: leads.filter((lead) => lead.feasibilityResult === "Likely feasible").length,
    highRiskCount: leads.filter((lead) => lead.reviewRisk === "High").length,
  };
}
