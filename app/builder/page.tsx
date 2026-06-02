import Link from "next/link";

const leads = [
  {
    name: "Sarah M.",
    project: "Garden Suite 624",
    budget: "$214k",
    status: "Proposal ready",
  },
  {
    name: "Daniel R.",
    project: "Garage Conversion 420",
    budget: "$118k",
    status: "Needs site review",
  },
  {
    name: "Priya K.",
    project: "Backyard Studio 312",
    budget: "$86k",
    status: "New lead",
  },
];

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

export default function BuilderDashboard() {
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
        <Stat label="Feasible leads" value="14" />
        <Stat label="Avg screen time" value="8 min" />
        <Stat label="Draws pending" value="$418k" />
        <Stat label="Permit risk" value="Low" />
      </section>

      <section className="dashboardGrid">
        <div className="dataPanel">
          <div className="panelTitle">
            <h2>Lead pipeline</h2>
            <span>This week</span>
          </div>
          <div className="leadList">
            {leads.map((lead) => (
              <article key={lead.name}>
                <div>
                  <strong>{lead.name}</strong>
                  <span>{lead.project}</span>
                </div>
                <div>
                  <strong>{lead.budget}</strong>
                  <span>{lead.status}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="dataPanel">
          <div className="panelTitle">
            <h2>Builder setup</h2>
            <span>Core modules</span>
          </div>
          <div className="moduleGrid">
            {modules.map((module) => (
              <span key={module}>{module}</span>
            ))}
          </div>
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
