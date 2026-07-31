import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildAssumptions,
  buildExclusions,
  buildNextSteps,
  buildProposalSections,
  formatCurrency,
} from "../../../lib/proposalBuilder";
import { getLead } from "../../../lib/leadStore";
import { PrintButton } from "../share/[token]/PrintButton";
import { CopyLinkButton } from "./CopyLinkButton";
import { ManufacturerMatch } from "../../configurator/ManufacturerMatch";
import { TopNav } from "../../components/TopNav";
import { FloorPlanPreview } from "../../configurator/FloorPlanPreview";
import { readEnv } from "../../../lib/env";
import { getAuthenticatedBuilderId } from "../../../lib/auth";

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) {
    notFound();
  }

  // audit critical-process-audit.md §4/§14 — this page exposes the homeowner's
  // contact info and full proposal; it must be gated the same way /permit and
  // /projects already are.
  const builderId = await getAuthenticatedBuilderId();
  if (!builderId) {
    redirect("/builder/login");
  }

  if (lead.builderId !== builderId) {
    notFound();
  }

  const sections = buildProposalSections(lead);
  const nextSteps = buildNextSteps(lead);
  const assumptions = buildAssumptions(lead);
  const exclusions = buildExclusions();
  const shareUrl = `${readEnv("NEXT_PUBLIC_SITE_URL") ?? ""}/proposals/share/${lead.shareToken}`;

  return (
    <main className="appShell">
      <TopNav />

      <section className="proposalHero">
        <p className="eyebrow">Proposal package</p>
        <h1>{lead.modelName}</h1>
        <p>
          {lead.proposalNumber} prepared for {lead.customerName} at {lead.propertyAddress}.
        </p>
      </section>

      {lead.needsReview && (
        <div
          style={{
            background: "#fdf1e8",
            borderLeft: "4px solid #b75f38",
            padding: "12px 16px",
            borderRadius: 6,
            margin: "12px 0 20px",
            fontSize: 13,
            color: "#6b3d22",
            lineHeight: 1.5,
          }}
        >
          <strong>Needs review — flagged by your guardrail settings.</strong>
          <p style={{ margin: "4px 0 0" }}>{lead.reviewReasons}</p>
        </div>
      )}

      <section className="proposalDetailGrid">
        <div className="proposalMain">
          {sections.map((section) => (
            <article className="dataPanel" key={section.title}>
              <div className="panelTitle">
                <h2>{section.title}</h2>
                <span>Review packet</span>
              </div>
              <dl className="summaryList">
                {section.items.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}

          <article className="dataPanel">
            <div className="panelTitle">
              <h2>Assumptions &amp; Exclusions</h2>
              <span>Review packet</span>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>This estimate assumes</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13, color: "var(--muted)" }}>
                  {assumptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Not included in this estimate</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13, color: "var(--muted)" }}>
                  {exclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="formFinePrint" style={{ marginTop: 12 }}>
              This is exactly what the homeowner sees on the shared version of this proposal.
            </p>
          </article>
        </div>

        <aside className="estimatePanel">
          <FloorPlanPreview modelCode={lead.modelCode} />

          <div className="estimateHeader">
            <span>Estimated package</span>
            <strong>{formatCurrency(lead.estimatedPrice, lead.currency)}</strong>
          </div>
          <div className="costSplit">
            <h2>Cost split</h2>
            <div>
              <span>Factory</span>
              <strong>{formatCurrency(lead.factoryCost, lead.currency)}</strong>
            </div>
            <div>
              <span>Site</span>
              <strong>{formatCurrency(lead.siteCost, lead.currency)}</strong>
            </div>
          </div>
          <div className="checklist">
            <h2>Next steps</h2>
            {nextSteps.map((step) => (
              <div key={step}><span /><p>{step}</p></div>
            ))}
          </div>
          <div className="proposalActions printHide">
            <CopyLinkButton shareUrl={shareUrl} />
            <PrintButton />
            <Link className="button primary fullButton" href={`/permit/${lead.id}`}>
              Generate permit checklist
            </Link>
          </div>

          <div className="printHide">
            <ManufacturerMatch
              address={lead.propertyAddress}
              maxSqFt={lead.maxSquareFeet || 0}
              modelSqFt={lead.squareFeet}
              budget={lead.estimatedPrice}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}
