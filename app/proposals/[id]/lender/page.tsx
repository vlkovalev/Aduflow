import { notFound } from "next/navigation";
import { getLead } from "../../../../lib/leadStore";
import { formatCurrency } from "../../../../lib/proposalBuilder";
import { PrintButton } from "../../share/[token]/PrintButton";

export default async function LenderPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) notFound();

  const today = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalDraw = lead.estimatedPrice;

  return (
    <main className="appShell lenderDoc">
      <div className="lenderHide">
        <nav className="nav compact printHide">
          <span className="brand">ADUflow</span>
          <div className="navLinks printHide">
            <PrintButton />
          </div>
        </nav>
        <p className="lenderBanner printHide">
          This is a lender-ready package. Use <strong>Download PDF</strong> to save and send to your mortgage broker or lender.
        </p>
      </div>

      <div className="lenderPage">

        {/* Header */}
        <header className="lenderHeader">
          <div>
            <div className="lenderBrand">ADUflow</div>
            <p className="lenderSubtitle">Pre-construction package for lender review</p>
          </div>
          <div className="lenderMeta">
            <p>{lead.proposalNumber}</p>
            <p>{today}</p>
          </div>
        </header>

        {/* Property */}
        <section className="lenderSection">
          <h2>Property and project overview</h2>
          <table className="lenderTable">
            <tbody>
              <tr><td>Homeowner</td><td>{lead.customerName}</td></tr>
              <tr><td>Property address</td><td>{lead.propertyAddress}</td></tr>
              <tr><td>Project type</td><td>Accessory dwelling unit — {lead.modelName}</td></tr>
              <tr><td>Building size</td><td>{lead.squareFeet} sq ft</td></tr>
              <tr><td>Zoning review risk</td><td>{lead.reviewRisk}</td></tr>
              <tr><td>Zoning source</td><td>{lead.zoningSource || "Manual scenario"}</td></tr>
              <tr><td>Zoning classification</td><td>{lead.zoningZone || "Not captured"}</td></tr>
              <tr><td>Permit path</td><td>{lead.permitPath}</td></tr>
              <tr><td>Estimated timeline</td><td>{lead.timelineWeeks} weeks from permit approval</td></tr>
            </tbody>
          </table>
        </section>

        {/* Feasibility */}
        <section className="lenderSection">
          <h2>Feasibility assessment</h2>
          <table className="lenderTable">
            <tbody>
              <tr><td>Result</td><td><strong>{lead.feasibilityResult}</strong></td></tr>
              <tr><td>Confidence score</td><td>{lead.feasibilityConfidence}%</td></tr>
              <tr><td>Maximum envelope</td><td>{lead.maxSquareFeet} sq ft / {lead.maxStories} {lead.maxStories === 1 ? "storey" : "storeys"}</td></tr>
              <tr><td>Setback target</td><td>{lead.setbackTarget}</td></tr>
              <tr><td>Detailed setbacks</td><td>Front: {lead.setbackFront || "Confirm"} / Side: {lead.setbackSide || "Confirm"} / Rear: {lead.setbackRear || "Confirm"}</td></tr>
              <tr><td>ADU permitted</td><td>{lead.aduPermitted === null ? "Confirm" : lead.aduPermitted ? "Yes" : "No"}</td></tr>
            </tbody>
          </table>
          <p className="lenderNote">
            Feasibility is assessed based on parcel scenario, zoning classification, and building envelope. A formal survey and municipal review are required prior to permit submission. This assessment is indicative only and does not constitute a permit guarantee.
          </p>
        </section>

        {/* Cost breakdown */}
        <section className="lenderSection">
          <h2>Project cost summary</h2>
          <table className="lenderTable">
            <tbody>
              <tr><td>Factory / modular package</td><td>{formatCurrency(lead.factoryCost)}</td></tr>
              <tr><td>Site work (foundation, utilities, install)</td><td>{formatCurrency(lead.siteCost)}</td></tr>
              <tr className="lenderTotal"><td><strong>Total estimated project cost</strong></td><td><strong>{formatCurrency(totalDraw)}</strong></td></tr>
              <tr><td>Budget range (low)</td><td>{formatCurrency(lead.estimateLow)}</td></tr>
              <tr><td>Budget range (high)</td><td>{formatCurrency(lead.estimateHigh)}</td></tr>
            </tbody>
          </table>
          <p className="lenderNote">
            All figures are in Canadian dollars and are pre-tax estimates based on standard modular construction assumptions. Final costs are subject to site assessment, permit fees, and contractor confirmation. A contingency reserve of 10–15% is recommended.
          </p>
        </section>

        {/* Draw schedule */}
        <section className="lenderSection">
          <h2>Proposed draw release schedule</h2>
          <table className="lenderTable lenderDrawTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Milestone</th>
                <th>Release %</th>
                <th>Release amount</th>
                <th>Evidence required</th>
              </tr>
            </thead>
            <tbody>
              {[
                { stage: "Deposit and permit package submitted", percent: 10, evidence: "Signed contract, permit application receipt" },
                { stage: "Foundation ready", percent: 20, evidence: "Geotagged site photos, inspector sign-off" },
                { stage: "Factory completion", percent: 35, evidence: "QA report, factory completion certificate" },
                { stage: "Set and weather-tight", percent: 20, evidence: "Site photos, delivery confirmation" },
                { stage: "Final inspection and occupancy", percent: 15, evidence: "City inspection certificate, occupancy permit" },
              ].map((row, i) => (
                <tr key={row.stage}>
                  <td>{i + 1}</td>
                  <td>{row.stage}</td>
                  <td>{row.percent}%</td>
                  <td>{formatCurrency(Math.round(totalDraw * row.percent / 100))}</td>
                  <td className="lenderEvidence">{row.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="lenderNote">
            Draw releases are subject to lender inspection and approval at each milestone. The builder or homeowner is responsible for providing evidence documentation. Releases must be authorized by the lender or an authorized inspector before disbursement.
          </p>
        </section>

        {/* BOM */}
        <section className="lenderSection">
          <h2>Scope of work summary</h2>
          <table className="lenderTable">
            <tbody>
              {[
                ["Structure and envelope", "Modular factory-built unit including framing, roofing, exterior cladding, windows, and doors"],
                ["Foundation", `${(lead.configuration as Record<string, string>).foundation ?? "Specified foundation type"} — prepared and installed on site`],
                ["Mechanical, electrical, plumbing", "Rough-in included in factory package; final tie-ins completed on site"],
                ["Interior finish", `${(lead.configuration as Record<string, string>).finish ?? "Specified finish level"} — kitchen, bath, flooring, and millwork`],
                ["Utility connections", `${(lead.configuration as Record<string, string>).utilities ?? "Standard"} — water, sewer, electrical connection to existing services`],
                ["Site work", "Delivery, crane or transport, set and levelling, landscaping reinstatement"],
                ["Permits and inspections", "Municipal building permit, inspections, and occupancy certificate"],
              ].map(([item, desc]) => (
                <tr key={item}><td><strong>{item}</strong></td><td>{desc}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Disclaimer */}
        <section className="lenderSection lenderDisclaimer">
          <h2>Important notices</h2>
          <p>This document is a pre-construction feasibility and budget package prepared by ADUflow for lender reference purposes. It does not constitute a construction contract, permit approval, or guarantee of final costs. All estimates are based on standard modular construction assumptions and are subject to change following site assessment, engineering review, and municipal approval.</p>
          <p>The homeowner and builder are responsible for confirming all project details, permits, and financing arrangements with qualified professionals before proceeding with construction.</p>
          <p>Prepared by ADUflow &nbsp;|&nbsp; {today} &nbsp;|&nbsp; {lead.proposalNumber}</p>
        </section>

      </div>
    </main>
  );
}
