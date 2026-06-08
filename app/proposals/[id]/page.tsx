import Link from "next/link";
import { notFound } from "next/navigation";
import { buildNextSteps, buildProposalSections, formatCurrency } from "../../../lib/proposalBuilder";
import { getLead } from "../../../lib/leadStore";
import { PrintButton } from "../share/[token]/PrintButton";
import { CopyLinkButton } from "./CopyLinkButton";
import { ManufacturerMatch } from "../../configurator/ManufacturerMatch";

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

  const sections = buildProposalSections(lead);
  const nextSteps = buildNextSteps(lead);
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/proposals/share/${lead.shareToken}`;

  return (
    <main className="appShell">
      <nav className="nav compact printHide" aria-label="Main navigation">
        <Link className="brand" href="/">
          ADUflow
        </Link>
        <div className="navLinks">
          <Link href="/configurator">Configurator</Link>
          <Link href="/builder">Builder OS</Link>
        </div>
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
