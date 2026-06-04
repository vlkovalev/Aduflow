import { notFound } from "next/navigation";
import { buildProposalSections, formatCurrency } from "../../../../lib/proposalBuilder";
import { getLeadByToken } from "../../../../lib/leadStore";
import { PrintButton } from "./PrintButton";

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
        </div>

        <aside className="estimatePanel">
          <div className="estimateHeader">
            <span>Estimated package</span>
            <strong>{formatCurrency(lead.estimatedPrice)}</strong>
          </div>
          <div className="costSplit">
            <h2>Cost split</h2>
            <div>
              <span>Factory</span>
              <strong>{formatCurrency(lead.factoryCost)}</strong>
            </div>
            <div>
              <span>Site</span>
              <strong>{formatCurrency(lead.siteCost)}</strong>
            </div>
          </div>
          <div className="checklist">
            <h2>Next steps</h2>
            <div><span /><p>Builder confirms parcel and scope assumptions</p></div>
            <div><span /><p>Permit and HOA checklist generated</p></div>
            <div><span /><p>Proposal moves to owner review</p></div>
          </div>
          <PrintButton />
        </aside>
      </section>
    </main>
  );
}
