import { redirect } from "next/navigation";
import Link from "next/link";
import { listLeads, type LeadRecord } from "../../lib/leadStore";
import { formatCurrency } from "../../lib/proposalBuilder";
import { LeadStatusSelect } from "./LeadStatusSelect";
import { TopNav } from "../components/TopNav";
import { getSupabaseServiceClient } from "../../lib/supabase";
import { getAuthenticatedBuilderId } from "../../lib/auth";
import { listModels } from "../../lib/catalogStore";
import { CreateDemoLeadButton } from "./CreateDemoLeadButton";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

export default async function BuilderDashboard() {
  const builderId = await getAuthenticatedBuilderId();
  if (!builderId) {
    redirect("/builder/login");
  }

  const models = await listModels(builderId);
  if (models.length === 0) {
    redirect("/builder/setup?onboarding=true");
  }

  const leads = await listLeads(builderId);
  const stats = getDashboardStats(leads);
  const analytics = getAnalytics(leads);
  const drawQueue = getDrawQueue(leads);
  const wonLeads = leads.filter((l) => l.status === "won");
  
  const isDbActive = getSupabaseServiceClient() !== null;

  return (
    <main className="appShell">
      <TopNav />

      {!isDbActive && (
        <div style={{
          background: "var(--paper)",
          borderLeft: "4px solid var(--gold)",
          padding: "12px 16px",
          borderRadius: 6,
          margin: "12px 0 20px",
          fontSize: 13,
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          lineHeight: 1.4
        }}>
          <span>Note</span>
          <span>
            <strong>Sandbox Mode Active:</strong> Supabase database environment variables are not configured. Your custom models, builder credentials, and homeowner leads reside in temporary local serverless files and will reset when Vercel restarts.
          </span>
        </div>
      )}

      <section className="dashboardHeader">
        <div>
          <p className="eyebrow">Builder and lender command center</p>
          <h1>Manage feasibility, prefab quotes, permits, and draw evidence.</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link className="button secondary" href="/builder/setup">Complete builder setup</Link>
          <Link className="button secondary" href="/builder/billing">Billing</Link>
          <CreateDemoLeadButton />
          <Link className="button primary" href="/configurator">New lead quote</Link>
        </div>
      </section>

      {/* ── KPI stats ── */}
      <section className="dashboardStats">
        <Stat label="Total leads" value={String(leads.length)} />
        <Stat label="Pipeline value" value={formatCurrency(stats.totalValue)} />
        <Stat label="Contracted revenue" value={formatCurrency(stats.wonValue)} />
        <Stat label="Win rate" value={`${analytics.conversionRate}%`} />
      </section>

      {/* ── Analytics ── */}
      {leads.length > 0 && (
        <section className="analyticsGrid">
          <div className="dataPanel">
            <div className="panelTitle"><h2>Pipeline by status</h2><span>All leads</span></div>
            <div className="analyticsList">
              {Object.entries(analytics.byStatus).map(([status, count]) => (
                <div key={status} className="analyticsRow">
                  <span className={`statusDot status-${status}`} />
                  <span>{STATUS_LABELS[status] ?? status}</span>
                  <strong>{count}</strong>
                  <div className="analyticsBar">
                    <span style={{ width: `${Math.round((count / leads.length) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dataPanel">
            <div className="panelTitle"><h2>Top models</h2><span>By lead count</span></div>
            <div className="analyticsList">
              {analytics.topModels.map(({ name, count, value }) => (
                <div key={name} className="analyticsRow">
                  <span style={{ flex: 1 }}>{name}</span>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>{count} leads</span>
                  <strong>{formatCurrency(value)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="dataPanel">
            <div className="panelTitle"><h2>Avg deal size</h2><span>By status</span></div>
            <dl className="summaryList">
              <div><dt>All leads</dt><dd>{formatCurrency(analytics.avgDealSize)}</dd></div>
              <div><dt>Qualified only</dt><dd>{formatCurrency(analytics.avgQualifiedSize)}</dd></div>
              <div><dt>Won</dt><dd>{formatCurrency(analytics.avgWonSize)}</dd></div>
              <div><dt>Feasibility rate</dt><dd>{analytics.feasibilityRate}%</dd></div>
            </dl>
          </div>
        </section>
      )}

      {/* ── Lead pipeline ── */}
      <section className="dashboardGrid">
        <div className="dataPanel">
          <div className="panelTitle"><h2>Lead pipeline</h2><span>Saved proposals</span></div>
          <div className="leadList">
            {leads.length ? (
              leads.slice(0, 8).map((lead) => (
                <div className="leadRow" key={lead.id}>
                  <Link href={`/proposals/${lead.id}`} style={{ flex: 1, minWidth: 0 }}>
                    <strong>{lead.customerName}</strong>
                    <span>{lead.modelName} — {lead.propertyAddress}</span>
                  </Link>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ display: "block" }}>{formatCurrency(lead.estimatedPrice)}</strong>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{lead.feasibilityResult}</span>
                    </div>
                    <LeadStatusSelect leadId={lead.id} initialStatus={lead.status} />
                  </div>
                </div>
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
          <div className="panelTitle"><h2>Permit queue</h2><span>Next action</span></div>
          {leads.length ? (
            <div className="permitQueue">
              {leads.filter(l => l.status !== "lost").slice(0, 5).map((lead) => (
                <Link href={`/permit/${lead.id}`} key={lead.id}>
                  <strong>{lead.modelName}</strong>
                  <span>{lead.permitPath}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No active leads yet.</p>
          )}
        </div>
      </section>

      {/* ── Active projects ── */}
      {wonLeads.length > 0 && (
        <section className="dataPanel fullWidthPanel">
          <div className="panelTitle"><h2>Active projects</h2><span>Won leads in progress</span></div>
          <div className="leadList">
            {wonLeads.map((lead) => (
              <div className="leadRow" key={lead.id}>
                <div style={{ flex: 1 }}>
                  <strong>{lead.customerName}</strong>
                  <span>{lead.modelName} — {lead.propertyAddress}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <Link className="button secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: 13 }} href={`/projects/${lead.id}`}>
                    Track project
                  </Link>
                  <Link className="button secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: 13 }} href={`/proposals/${lead.id}/lender`}>
                    Lender package
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Draw verification ── */}
      <section className="dataPanel fullWidthPanel">
        <div className="panelTitle"><h2>Draw verification queue</h2><span>Lender evidence</span></div>
        <div className="leadList">
          {drawQueue.length ? (
            drawQueue.map((draw) => (
              <article key={`${draw.leadId}-${draw.stage}`}>
                <div>
                  <strong>{draw.stage}</strong>
                  <span>{draw.project}</span>
                </div>
                <div>
                  <strong>{draw.percent}%</strong>
                  <span>{draw.status}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="emptyState">
              <strong>No draw milestones yet</strong>
              <span>Won projects will populate this lender evidence queue.</span>
            </div>
          )}
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
  const wonLeads = leads.filter((l) => l.status === "won");
  return {
    totalValue: leads.reduce((t, l) => t + l.estimatedPrice, 0),
    wonCount: wonLeads.length,
    wonValue: wonLeads.reduce((t, l) => t + l.estimatedPrice, 0),
    feasibleCount: leads.filter((l) => l.feasibilityResult === "Likely feasible").length,
    highRiskCount: leads.filter((l) => l.reviewRisk === "High").length,
  };
}

function getAnalytics(leads: LeadRecord[]) {
  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    const s = l.status ?? "new";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const modelMap = leads.reduce<Record<string, { count: number; value: number }>>((acc, l) => {
    acc[l.modelName] = acc[l.modelName] ?? { count: 0, value: 0 };
    acc[l.modelName].count++;
    acc[l.modelName].value += l.estimatedPrice;
    return acc;
  }, {});

  const topModels = Object.entries(modelMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([name, { count, value }]) => ({ name, count, value }));

  const avg = (arr: LeadRecord[]) =>
    arr.length ? Math.round(arr.reduce((t, l) => t + l.estimatedPrice, 0) / arr.length) : 0;

  const wonLeads = leads.filter((l) => l.status === "won");
  const qualifiedLeads = leads.filter((l) => l.status === "qualified" || l.status === "won");

  return {
    byStatus,
    topModels,
    conversionRate: leads.length ? Math.round((wonLeads.length / leads.length) * 100) : 0,
    avgDealSize: avg(leads),
    avgQualifiedSize: avg(qualifiedLeads),
    avgWonSize: avg(wonLeads),
    feasibilityRate: leads.length
      ? Math.round((leads.filter((l) => l.feasibilityResult === "Likely feasible").length / leads.length) * 100)
      : 0,
  };
}

function getDrawQueue(leads: LeadRecord[]) {
  return leads
    .filter((l) => l.status === "won")
    .flatMap((lead) => {
      const milestones = Array.isArray(lead.configuration.drawMilestones)
        ? (lead.configuration.drawMilestones as Array<{ stage?: string; percent?: number }>)
        : [];
      return milestones.slice(0, 2).map((m) => ({
        leadId: lead.id,
        stage: m.stage ?? "Milestone",
        percent: Number(m.percent ?? 0),
        project: `${lead.modelName} — ${lead.customerName}`,
        status: "Evidence not started",
      }));
    })
    .slice(0, 6);
}
