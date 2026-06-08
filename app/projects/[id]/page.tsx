import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "../../../lib/leadStore";
import { formatCurrency } from "../../../lib/proposalBuilder";
import { ProjectMilestones } from "./ProjectMilestones";
import { PermitTracker } from "./PermitTracker";
import { DrawReleaseLog } from "./DrawReleaseLog";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) notFound();

  return (
    <main className="appShell">
      <nav className="nav compact printHide" aria-label="Main navigation">
        <Link className="brand" href="/">ADUflow</Link>
        <div className="navLinks">
          <Link href="/builder" className="navLink active">Builder OS</Link>
          <Link href={`/proposals/${lead.id}`} className="navLink">Proposal</Link>
          <Link href={`/proposals/${lead.id}/lender`} className="navLink">Lender package</Link>
        </div>
      </nav>

      <section className="proposalHero">
        <p className="eyebrow">Active project</p>
        <h1>{lead.modelName}</h1>
        <p>{lead.customerName} — {lead.propertyAddress}</p>
      </section>

      <section className="proposalDetailGrid" style={{ marginBottom: 24 }}>
        <div className="proposalMain">

          <div className="dataPanel">
            <div className="panelTitle">
              <h2>Project milestones</h2>
              <span>Track progress and dates</span>
            </div>
            <ProjectMilestones leadId={lead.id} />
          </div>

          <PermitTracker
            leadId={lead.id}
            permitPath={lead.permitPath}
            reviewRisk={lead.reviewRisk}
            setbackTarget={lead.setbackTarget}
          />

          <DrawReleaseLog
            leadId={lead.id}
            totalPrice={lead.estimatedPrice}
          />
        </div>

        <aside className="estimatePanel">
          <div className="estimateHeader">
            <span>Project value</span>
            <strong>{formatCurrency(lead.estimatedPrice)}</strong>
          </div>
          <div className="costSplit">
            <h2>Cost split</h2>
            <div><span>Factory</span><strong>{formatCurrency(lead.factoryCost)}</strong></div>
            <div><span>Site</span><strong>{formatCurrency(lead.siteCost)}</strong></div>
          </div>
          <div className="drawPlan" style={{ marginTop: 24 }}>
            <h2>Draw schedule</h2>
            {[
              { stage: "Deposit and permit", percent: 10 },
              { stage: "Foundation ready", percent: 20 },
              { stage: "Factory completion", percent: 35 },
              { stage: "Set and weather-tight", percent: 20 },
              { stage: "Final inspection", percent: 15 },
            ].map((m) => (
              <div key={m.stage}>
                <span>{m.percent}%</span>
                <p style={{ margin: 0 }}>{m.stage} — {formatCurrency(Math.round(lead.estimatedPrice * m.percent / 100))}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Link className="button primary fullButton" href={`/proposals/${lead.id}/lender`}>
              Open lender package
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
