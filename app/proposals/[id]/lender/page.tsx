import { notFound } from "next/navigation";
import { getLead } from "../../../../lib/leadStore";
import { formatCurrency, formatZoningSource } from "../../../../lib/proposalBuilder";
import { PrintButton } from "../../share/[token]/PrintButton";
import { getBuilderCredentials } from "../../../../lib/builderStore";

export default async function LenderPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) notFound();

  const credentials = await getBuilderCredentials();

  const today = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalDraw = lead.estimatedPrice;

  // Dynamic Itemized Cost Calculation
  const config = (lead.configuration ?? {}) as Record<string, string>;
  const permitFee = 7500;
  
  const siteAccess = config.site === "urban" ? 8500 : config.site === "tight" ? 18500 : config.site === "rural" ? 24500 : 8500;
  const foundation = config.foundation === "slab" ? 22000 : config.foundation === "helical" ? 28500 : config.foundation === "crawl" ? 42000 : 28500;
  const utilities = config.utilities === "basic" ? 14500 : config.utilities === "standard" ? 26500 : config.utilities === "complex" ? 48500 : 26500;
  const finishLevel = config.finish === "essential" ? 0 : config.finish === "comfort" ? 18500 : config.finish === "premium" ? 34500 : 18500;
  
  // Base shell is factory cost minus finishes price
  const factoryShell = Math.max(30000, lead.factoryCost - finishLevel);
  
  // Margin/assembly solves the sum to match the exact estimated price
  const assemblyMargin = Math.max(5000, totalDraw - (permitFee + siteAccess + foundation + utilities + factoryShell + finishLevel));
  const contingency = Math.round(totalDraw * 0.10); // 10% lender contingency

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
            <div className="lenderBrand">{credentials.companyName}</div>
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
              <tr><td>Zoning source</td><td>{formatZoningSource(lead.zoningSource)}</td></tr>
              <tr><td>Zone classification</td><td>{lead.zoningZone || "Not captured"}</td></tr>
              <tr><td>Permit path</td><td>{lead.permitPath}</td></tr>
              <tr><td>Estimated timeline</td><td>{lead.timelineWeeks} weeks from permit approval</td></tr>
            </tbody>
          </table>
        </section>

        {/* Builder Profile */}
        <section className="lenderSection">
          <h2>Contractor Profile & Credentials</h2>
          <table className="lenderTable">
            <tbody>
              <tr><td>General contractor</td><td><strong>{credentials.companyName}</strong></td></tr>
              <tr><td>License number</td><td>{credentials.licenseNumber}</td></tr>
              <tr><td>Liability insurance</td><td>{credentials.insuranceCarrier} (Limit: {formatCurrency(credentials.insuranceLimit)})</td></tr>
              <tr><td>Insurance expiry</td><td>{credentials.insuranceExpiration}</td></tr>
              <tr><td>Performance bond</td><td>{credentials.bondProvider} (Amount: {formatCurrency(credentials.bondAmount)})</td></tr>
              <tr><td>Warranty program</td><td>{credentials.warrantyInfo}</td></tr>
              <tr><td>Contact details</td><td>{credentials.phone} &nbsp;|&nbsp; {credentials.email}</td></tr>
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
            </tbody>
          </table>
          <p className="lenderNote">
            Feasibility is assessed based on parcel scenario, zoning classification, and building envelope. A formal survey and municipal review are required prior to permit submission. This assessment is indicative only and does not constitute a permit guarantee.
          </p>
        </section>

        {/* Itemized Budget */}
        <section className="lenderSection">
          <h2>Itemized construction budget</h2>
          <div className="lenderTableContainer">
            <table className="lenderTable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Cost (CAD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Permits & Engineering</td>
                  <td>Architectural drafting, site surveys, structural reviews, city permit fees</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(permitFee)}</td>
                </tr>
                <tr>
                  <td>Site Preparation</td>
                  <td>Access planning, soil excavation, minor site grading, and preparation</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(siteAccess)}</td>
                </tr>
                <tr>
                  <td>Concrete Foundation</td>
                  <td>Foundation setup: {config.foundation === "slab" ? "Concrete Slab" : config.foundation === "helical" ? "Helical Piles" : "Crawlspace"} option</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(foundation)}</td>
                </tr>
                <tr>
                  <td>Utility Connection</td>
                  <td>Service lines hookup (water, sewer, and electrical panels)</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(utilities)}</td>
                </tr>
                <tr>
                  <td>Factory Modular Shell</td>
                  <td>Prefab structural shell, insulation, exterior cladding, roofing, doors, and windows</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(factoryShell)}</td>
                </tr>
                <tr>
                  <td>Interior Finishes</td>
                  <td>Kitchen cabinetry, countertops, plumbing fixtures, bathroom, and flooring ({config.finish || "Essential"})</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(finishLevel)}</td>
                </tr>
                <tr>
                  <td>GC Assembly & Margin</td>
                  <td>Modular set assembly, framing tie-ins, site supervision, and contractor margin</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(assemblyMargin)}</td>
                </tr>
                <tr className="lenderTotal" style={{ fontWeight: 800 }}>
                  <td>Contract Sum (Net)</td>
                  <td>Fixed contract price for the full build package</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(totalDraw)}</td>
                </tr>
                <tr>
                  <td>Lender Contingency (10%)</td>
                  <td>Recommended reserve to cover client-driven change orders or site issues</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(contingency)}</td>
                </tr>
                <tr className="lenderTotal" style={{ borderTop: "2px double var(--forest)" }}>
                  <td><strong>Gross Proposed Budget</strong></td>
                  <td><strong>Total budget including reserve</strong></td>
                  <td style={{ textAlign: "right", fontWeight: 800 }}>{formatCurrency(totalDraw + contingency)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Draw schedule */}
        <section className="lenderSection">
          <h2>Proposed draw release schedule</h2>
          <div className="lenderTableContainer">
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
                  { stage: "Foundation ready", percent: 20, evidence: "Geotagged site photos, city foundation inspection record" },
                  { stage: "Factory completion", percent: 35, evidence: "Factory QA report, completed module photo verification" },
                  { stage: "Set and weather-tight", percent: 20, evidence: "Site photos showing set completion, roof & wrap certificate" },
                  { stage: "Final inspection and occupancy", percent: 15, evidence: "Municipal certificate of occupancy, final occupancy permit" },
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
          </div>
          <p className="lenderNote">
            Draw releases are subject to lender inspection and approval at each milestone. The builder or homeowner is responsible for providing evidence documentation. Releases must be authorized by the lender or an authorized inspector before disbursement.
          </p>
        </section>

        {/* Signatures block */}
        <section className="lenderSection" style={{ marginTop: 40, breakInside: "avoid" }}>
          <h2>Authorized Signatures</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            By signing below, the Borrower and General Contractor agree to the itemized budget and draw schedule presented in this pre-construction package.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 12 }}>
            <div style={{ borderTop: "1px solid var(--ink)", paddingTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700 }}>Borrower / Homeowner</p>
              <div style={{ height: 40 }}></div>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>Signature & Date</p>
            </div>
            <div style={{ borderTop: "1px solid var(--ink)", paddingTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700 }}>General Contractor</p>
              <div style={{ height: 40 }}></div>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>Signature & Date</p>
            </div>
            <div style={{ borderTop: "1px solid var(--ink)", paddingTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700 }}>Lender / Loan Officer</p>
              <div style={{ height: 40 }}></div>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>Signature & Date</p>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="lenderSection lenderDisclaimer" style={{ marginTop: 40 }}>
          <h2>Important notices</h2>
          <p>This document is a pre-construction feasibility and budget package prepared by ADUflow for lender reference purposes. It does not constitute a construction contract, permit approval, or guarantee of final costs. All estimates are based on standard modular construction assumptions and are subject to change following site assessment, engineering review, and municipal approval.</p>
          <p>The homeowner and builder are responsible for confirming all project details, permits, and financing arrangements with qualified professionals before proceeding with construction.</p>
          <p>Prepared by ADUflow &nbsp;|&nbsp; {today} &nbsp;|&nbsp; {lead.proposalNumber}</p>
        </section>

      </div>
    </main>
  );
}
