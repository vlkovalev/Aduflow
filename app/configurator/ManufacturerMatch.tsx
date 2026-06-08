import { formatCurrency } from "../../lib/proposalBuilder";

export type Partner = {
  name: string;
  regions: string[];
  maxSize: number;
  minPrice: number;
  logo: string;
  badge: string;
  tagline: string;
};

const PARTNERS: Partner[] = [
  {
    name: "Abodu",
    regions: ["ca", "california", "wa", "washington", "or", "oregon"],
    maxSize: 800,
    minPrice: 149000,
    logo: "🌿",
    badge: "Detached ADU Specialist",
    tagline: "Turnkey backyard homes with high-end architectural finishes.",
  },
  {
    name: "Cover",
    regions: ["ca", "california", "west coast"],
    maxSize: 1000,
    minPrice: 210000,
    logo: "📐",
    badge: "Premium Panelized",
    tagline: "Computer-designed custom layouts optimized for tight urban sites.",
  },
  {
    name: "Villa Homes",
    regions: ["ca", "california", "tx", "texas"],
    maxSize: 1200,
    minPrice: 175000,
    logo: "🏡",
    badge: "Turnkey Modular Network",
    tagline: "Wide catalog of single-story and double-story modular ADUs.",
  },
  {
    name: "Boxabl",
    regions: ["ca", "wa", "or", "on", "bc", "ab", "california", "ontario", "british columbia"], // Nationwide
    maxSize: 400,
    minPrice: 59500,
    logo: "📦",
    badge: "Foldable Pods",
    tagline: "Ultra-affordable folding modular studio homes delivered flat.",
  },
  {
    name: "ORCA LGS",
    regions: ["bc", "british columbia", "ab", "alberta", "canada"],
    maxSize: 968,
    minPrice: 119000,
    logo: "🛡️",
    badge: "Light Gauge Steel Panels",
    tagline: "Strong, fire-resistant Canadian prefabricated panel systems.",
  },
  {
    name: "Lane One Homes",
    regions: ["bc", "british columbia", "canada"],
    maxSize: 861,
    minPrice: 139000,
    logo: "🧱",
    badge: "Laneway Home Builder",
    tagline: "Modern steel-framed garden suites compliant with new BC Bill 44 laws.",
  },
];

export function ManufacturerMatch({
  address,
  maxSqFt,
  modelSqFt,
  budget,
}: {
  address: string;
  maxSqFt: number;
  modelSqFt: number;
  budget: number;
}) {
  const normAddress = address.toLowerCase();

  // 1. Filter by region
  const matchedRegion = PARTNERS.filter((p) => {
    if (!normAddress) return true; // Show all if no address is entered yet
    return p.regions.some((reg) => normAddress.includes(reg));
  });

  return (
    <div className="costSplit" style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>Matched Factory Partners</h2>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        Based on property location, local zoning envelope, and estimated project budget.
      </p>

      {matchedRegion.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
          Enter a location to view regional prefab manufacturing partners.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {matchedRegion.map((p) => {
            const sizeExceeded = modelSqFt > p.maxSize;
            const envelopeExceeded = maxSqFt > 0 && p.maxSize < maxSqFt && modelSqFt > p.maxSize;
            const budgetTight = budget > 0 && budget < p.minPrice;

            const isEligible = !sizeExceeded && !budgetTight;

            return (
              <div
                key={p.name}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  padding: 12,
                  background: isEligible ? "var(--panel)" : "rgba(0,0,0,0.02)",
                  opacity: isEligible ? 1 : 0.65,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                  <span style={{ fontSize: 18 }}>{p.logo}</span>
                  <strong style={{ fontSize: 14, flex: 1, marginLeft: 4 }}>{p.name}</strong>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: isEligible ? "var(--sage)" : "var(--line)",
                      color: isEligible ? "var(--forest)" : "var(--muted)",
                    }}
                  >
                    {isEligible ? "Eligible Partner" : "Not Matched"}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0" }}>{p.badge}</p>
                <p style={{ fontSize: 12, color: "var(--ink)", margin: "4px 0 8px" }}>{p.tagline}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, borderTop: "1px dashed var(--line)", paddingTop: 6 }}>
                  <span>Max Size: {p.maxSize} sq ft</span>
                  <span>Est. From: {formatCurrency(p.minPrice)}</span>
                </div>

                {!isEligible && (
                  <div style={{ marginTop: 6, color: "var(--clay)", fontSize: 11, fontWeight: 700 }}>
                    {sizeExceeded && `⚠️ Model size (${modelSqFt} sq ft) exceeds factory limit of ${p.maxSize} sq ft.`}
                    {budgetTight && `⚠️ Budget is below manufacturing entry point (${formatCurrency(p.minPrice)}).`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
