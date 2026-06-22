import Link from "next/link";

const workflow = [
  {
    step: "01",
    title: "Zoning feasibility",
    copy: "Screen lot type, setbacks, review risk, and likely ADU envelope before design starts.",
  },
  {
    step: "02",
    title: "Prefab scope",
    copy: "Separate factory cost from site cost so builders, buyers, and lenders see the real budget.",
  },
  {
    step: "03",
    title: "Bankable build",
    copy: "Package permit tasks, BOMs, draw milestones, and progress verification for financing.",
  },
];

const roadmap = [
  {
    title: "GIS and parcel rules",
    copy: "Address-based zoning, envelope, setback, height, parking, and servicing checks.",
  },
  {
    title: "Prefab marketplace",
    copy: "Factory modules, panelized systems, transport assumptions, and site install packages.",
  },
  {
    title: "Permit assistant",
    copy: "Municipal submittal checklists, HOA review packs, and revision tracking.",
  },
  {
    title: "Draw verification",
    copy: "Photo-based milestone evidence for lenders, builders, and homeowners.",
  },
];

const segments = [
  "Garden suites",
  "Detached ADUs",
  "Garage conversions",
  "Modular garages",
  "Backyard offices",
  "Small cabins",
];

const builderProof = [
  {
    title: "Qualify faster",
    copy: "Turn an address into a first-pass feasibility package before your estimator spends hours on a cold lead.",
  },
  {
    title: "Quote consistently",
    copy: "Use your active models, option pricing, credentials, and service region to keep every proposal aligned with your business.",
  },
  {
    title: "Support financing",
    copy: "Generate a lender-oriented package with scope, budget split, draw schedule, evidence needs, and builder credentials.",
  },
];

const pilotLimits = [
  "Zoning results are first-pass screens, not permit approvals.",
  "Fallback data must be reviewed by the builder before customer commitments.",
  "Pilot login is builder-scoped for demos; production auth is the next hardening step.",
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="Main navigation">
          <Link className="brand" href="/">
            ADUflow
          </Link>
          <div className="navLinks">
            <Link href="/configurator">Configurator</Link>
            <Link href="/builder">Builder OS</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
        </nav>

        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">North American ADU pre-construction OS</p>
            <h1>Make backyard housing feasible, financeable, and buildable.</h1>
            <p className="lede">
              ADUflow starts where North American projects get stuck: zoning,
              permit risk, factory vs site cost, and lender confidence. Then it
              turns the project into a quote-ready package.
            </p>
            <div className="actions">
              <Link className="button primary" href="/configurator">
                Check an address
              </Link>
              <Link className="button secondary" href="/builder">
                View builder dashboard
              </Link>
            </div>
          </div>

          <div className="projectPanel" aria-label="ADUflow project summary">
            <div className="panelHeader">
              <span>Feasibility package</span>
              <strong>Garden Suite 624</strong>
            </div>
            <div className="metricGrid">
              <div>
                <span>Zoning fit</span>
                <strong>86%</strong>
              </div>
              <div>
                <span>Permit path</span>
                <strong>Standard</strong>
              </div>
              <div>
                <span>Factory cost</span>
                <strong>$173k</strong>
              </div>
              <div>
                <span>Draw plan</span>
                <strong>5 stages</strong>
              </div>
            </div>
            <div className="timeline">
              <div>
                <span />
                <p>Parcel envelope checked</p>
              </div>
              <div>
                <span />
                <p>Factory and site scope priced</p>
              </div>
              <div>
                <span />
                <p>Lender draw package drafted</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">Strategic wedge</p>
          <h2>North America needs feasibility before configuration.</h2>
          <p>
            PZZL begins with product configuration. ADUflow should begin with
            local rules, parcel constraints, HOA friction, lender evidence, and
            the prefab supply chain.
          </p>
        </div>
        <div className="chipRow">
          {segments.map((segment) => (
            <span className="chip" key={segment}>
              {segment}
            </span>
          ))}
        </div>
      </section>

      <section className="workflow">
        {workflow.map((item) => (
          <article className="workflowCard" key={item.step}>
            <span>{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">For ADU and prefab builders</p>
          <h2>A guided pilot for reducing dead-end ADU leads.</h2>
          <p>
            ADUflow is ready for builder conversations as a pilot workflow:
            address-first feasibility, catalog-based pricing, proposal, lender
            package, permit tracker, and draw log.
          </p>
        </div>
      </section>

      <section className="workflow">
        {builderProof.map((item) => (
          <article className="workflowCard" key={item.title}>
            <span>✓</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="roadmap">
        {roadmap.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="band">
        <div className="sectionHeader">
          <p className="eyebrow">Pilot boundaries</p>
          <h2>What to say clearly in every builder demo.</h2>
        </div>
        <div className="chipRow">
          {pilotLimits.map((limit) => (
            <span className="chip" key={limit}>
              {limit}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
