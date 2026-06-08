import { useState } from "react";
import { formatCurrency } from "../../lib/proposalBuilder";

export type Partner = {
  name: string;
  regions: string[];
  maxSize: number;
  minPrice: number;
  logo: string;
  badge: string;
  tagline: string;
  type: "modular" | "panelized" | "foldable";
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
    type: "modular",
  },
  {
    name: "Cover",
    regions: ["ca", "california", "west coast"],
    maxSize: 1000,
    minPrice: 210000,
    logo: "📐",
    badge: "Premium Panelized",
    tagline: "Computer-designed custom layouts optimized for tight urban sites.",
    type: "panelized",
  },
  {
    name: "Villa Homes",
    regions: ["ca", "california", "tx", "texas"],
    maxSize: 1200,
    minPrice: 175000,
    logo: "🏡",
    badge: "Turnkey Modular Network",
    tagline: "Wide catalog of single-story and double-story modular ADUs.",
    type: "modular",
  },
  {
    name: "Boxabl",
    regions: ["ca", "wa", "or", "on", "bc", "ab", "california", "ontario", "british columbia"], // Nationwide
    maxSize: 400,
    minPrice: 59500,
    logo: "📦",
    badge: "Foldable Pods",
    tagline: "Ultra-affordable folding modular studio homes delivered flat.",
    type: "foldable",
  },
  {
    name: "ORCA LGS",
    regions: ["bc", "british columbia", "ab", "alberta", "canada"],
    maxSize: 968,
    minPrice: 119000,
    logo: "🛡️",
    badge: "Light Gauge Steel Panels",
    tagline: "Strong, fire-resistant Canadian prefabricated panel systems.",
    type: "panelized",
  },
  {
    name: "Lane One Homes",
    regions: ["bc", "british columbia", "canada"],
    maxSize: 861,
    minPrice: 139000,
    logo: "🧱",
    badge: "Laneway Home Builder",
    tagline: "Modern steel-framed garden suites compliant with new BC Bill 44 laws.",
    type: "modular",
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
  const [filterType, setFilterType] = useState<string>("all");
  const normAddress = address.toLowerCase();

  // 1. Filter by region and selected prefab type
  const matchedRegion = PARTNERS.filter((p) => {
    const matchesRegion = !normAddress || p.regions.some((reg) => normAddress.includes(reg));
    if (!matchesRegion) return false;

    if (filterType !== "all" && p.type !== filterType) return false;
    return true;
  });

  return (
    <div className="costSplit" style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Matched Factory Partners</h2>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0 0" }}>
            Based on location, zoning envelope, and budget.
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <select
            style={{
              padding: "6px 10px",
              border: "1px solid var(--line)",
              borderRadius: 4,
              background: "white",
              fontSize: 11,
              fontWeight: 800,
              color: "var(--ink)",
              cursor: "pointer",
            }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by prefab style"
          >
            <option value="all">All Prefab Styles</option>
            <option value="modular">Modular / Turnkey</option>
            <option value="panelized">Panelized Kits</option>
            <option value="foldable">Foldable Pods</option>
          </select>
        </div>
      </div>

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
