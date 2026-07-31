import { notFound } from "next/navigation";
import {
  buildAssumptions,
  buildExclusions,
  buildNextSteps,
  buildProposalSections,
  formatCurrency,
} from "../../../../lib/proposalBuilder";
import { getLeadByToken } from "../../../../lib/leadStore";
import { getBuilderById } from "../../../../lib/builderStore";
import { PrintButton } from "./PrintButton";
import { ManufacturerMatch } from "../../../configurator/ManufacturerMatch";
import { FloorPlanPreview } from "../../../configurator/FloorPlanPreview";

export default async function SharedProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lead = await getLeadByToken(token);

  if (!lead) {
    notFound();
  }

  const sections = buildProposalSections(lead);
  const nextSteps = buildNextSteps(lead);
  const assumptions = buildAssumptions(lead);
  const exclusions = buildExclusions();
  // Access to this page is gated by the unguessable per-lead shareToken, not
  // by builder auth — so unlike the anonymous /for-builder link, it's safe
  // and expected to show the builder's own contact info here: the homeowner
  // is meant to reach out to exactly this builder next.
  const builder = await getBuilderById(lead.builderId);

  return (
    <main className="appShell">
      <nav className="nav compact printHide" aria-label="Main navigation">
        <span className="brand">ADUflow</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Shared proposal</span>
      </nav>

      <section className="proposalHero">
        <p className="eyebrow">Proposal package</p>
        <h1>{lead.modelName}</h1>
        <p>
          {lead.proposalNumber} prepared for {lead.customerName} at {lead.propertyAddress}.
        </p>
      </section>

      {builder?.companyName ? (
        <section className="band" style={{ paddingTop: 0 }}>
          <div
            className="dataPanel"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
          >
            <div>
              <p className="eyebrow">Prepared by</p>
              <h2 style={{ margin: 0 }}>{builder.companyName}</h2>
              {/* Plain text so email/phone are visible on a printed copy, not just inside a button's href. */}
              {builder.email || builder.phone ? (
                <p className="formFinePrint" style={{ margin: "4px 0 0" }}>
                  {[builder.email, builder.phone].filter(Boolean).join(" · ")}
                </p>
              ) : (
                <p className="formFinePrint" style={{ margin: "4px 0 0" }}>
                  Contact details for {builder.companyName} were not available on this proposal.
                </p>
              )}
            </div>
            <div className="printHide" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {builder.email ? (
                <a
                  className="button primary"
                  href={`mailto:${builder.email}?subject=${encodeURIComponent(
                    `${lead.proposalNumber} - ${lead.propertyAddress}`,
                  )}`}
                >
                  Email {builder.companyName}
                </a>
              ) : null}
              {builder.phone ? (
                <a className="button secondary" href={`tel:${builder.phone}`}>
                  Call {builder.phone}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

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
          </article>
        </div>

        <aside className="estimatePanel">
          <FloorPlanPreview modelCode={lead.modelCode} />

          <div className="estimateHeader">
            <span>Estimated package</span>
            <strong>{formatCurrency(lead.estimatedPrice, lead.currency)}</strong>
          </div>
          <p className="formFinePrint">
            This preliminary package is for planning and builder review. It is not a final quote,
            financing approval, engineering opinion, or permit approval. Verify zoning, site
            conditions, specifications, and pricing before signing a construction contract.
          </p>
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
          <PrintButton />

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
