"use client";

import { useState, useEffect } from "react";
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
  leadId,
}: {
  address: string;
  maxSqFt: number;
  modelSqFt: number;
  budget: number;
  leadId?: string;
}) {
  const [filterType, setFilterType] = useState<string>("all");
  const [submittingRfq, setSubmittingRfq] = useState<string | null>(null);
  const [rfqSentList, setRfqSentList] = useState<Record<string, boolean>>({});
  const [activeRfqModal, setActiveRfqModal] = useState<Partner | null>(null);
  const [builderCredentials, setBuilderCredentials] = useState<any>(null);

  const normAddress = address.toLowerCase();

  // Load builder GC profile details
  useEffect(() => {
    fetch("/api/builder")
      .then((res) => res.json())
      .then((data) => {
        if (data?.credentials) {
          setBuilderCredentials(data.credentials);
        }
      })
      .catch(() => {});
  }, []);

  // 1. Filter by region and selected prefab type
  const matchedRegion = PARTNERS.filter((p) => {
    const matchesRegion = !normAddress || p.regions.some((reg) => normAddress.includes(reg));
    if (!matchesRegion) return false;

    if (filterType !== "all" && p.type !== filterType) return false;
    return true;
  });

  async function submitRfq(partnerName: string) {
    setSubmittingRfq(partnerName);
    // Simulate API request to factory partner desk
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const rfqKey = leadId ? `rfq-${leadId}-${partnerName}` : `rfq-current-${partnerName}`;
    try {
      sessionStorage.setItem(rfqKey, "requested");
    } catch {}
    
    setRfqSentList((prev) => ({ ...prev, [partnerName]: true }));
    setSubmittingRfq(null);
    setActiveRfqModal(null);
  }

  return (
    <div className="manufacturerMatchContainer" style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
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
            const budgetTight = budget > 0 && budget < p.minPrice;
            const isEligible = !sizeExceeded && !budgetTight;

            const rfqKey = leadId ? `rfq-${leadId}-${p.name}` : `rfq-current-${p.name}`;
            const hasRequested = rfqSentList[p.name] || (typeof window !== "undefined" && sessionStorage.getItem(rfqKey) === "requested");

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

                {isEligible && (
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    {hasRequested ? (
                      <span style={{ fontSize: 11, color: "var(--forest)", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                        ✓ RFQ Requested
                      </span>
                    ) : (
                      <button
                        className="button primary"
                        style={{
                          minHeight: 28,
                          padding: "0 10px",
                          fontSize: 11,
                          fontWeight: 800,
                          background: "none",
                          color: "var(--forest)",
                          border: "1px solid var(--forest)",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                        onClick={() => setActiveRfqModal(p)}
                        type="button"
                      >
                        Request RFQ
                      </button>
                    )}
                  </div>
                )}

                {!isEligible && (
                  <div style={{ marginTop: 6, color: "var(--clay)", fontSize: 11, fontWeight: 700 }}>
                    {sizeExceeded && `Model size (${modelSqFt} sq ft) exceeds factory limit of ${p.maxSize} sq ft.`}
                    {budgetTight && `Budget is below manufacturing entry point (${formatCurrency(p.minPrice)}).`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RFQ Submission Modal */}
      {activeRfqModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            className="dataPanel"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "white",
              padding: 24,
              borderRadius: 8,
              boxShadow: "0 20px 80px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Request Factory RFQ</h3>
              <button
                onClick={() => setActiveRfqModal(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
                type="button"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Review the project details to submit a Request for Quote directly to the <strong>{activeRfqModal.name}</strong> partner desk.
            </p>

            <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6, padding: 12, fontSize: 12, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px 12px", borderBottom: "1px dashed var(--line)", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "var(--muted)" }}>Factory:</span>
                <strong>{activeRfqModal.name} ({activeRfqModal.badge})</strong>
                <span style={{ color: "var(--muted)" }}>Model size:</span>
                <strong>{modelSqFt} sq ft</strong>
                <span style={{ color: "var(--muted)" }}>Est. Shell Cost:</span>
                <strong>{formatCurrency(activeRfqModal.minPrice)}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px 12px", borderBottom: "1px dashed var(--line)", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "var(--muted)" }}>Property Lot:</span>
                <strong>{address || "Not specified"}</strong>
                <span style={{ color: "var(--muted)" }}>Zoning Envelope:</span>
                <strong>{maxSqFt ? `${maxSqFt} sq ft max` : "Calculated from constraints"}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px 12px" }}>
                <span style={{ color: "var(--muted)" }}>Builder GC:</span>
                <strong>{builderCredentials?.companyName || "Apex Modular Builders"}</strong>
                <span style={{ color: "var(--muted)" }}>GC License:</span>
                <strong>{builderCredentials?.licenseNumber || "BC-GC-998822"}</strong>
                <span style={{ color: "var(--muted)" }}>Contact:</span>
                <strong>{builderCredentials?.email || "info@apexmodular.com"}</strong>
              </div>
            </div>

            {submittingRfq === activeRfqModal.name ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div className="spinner" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Sending RFQ request to {activeRfqModal.name}...</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="button secondary"
                  style={{ minHeight: 34, padding: "0 14px", fontSize: 13 }}
                  onClick={() => setActiveRfqModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  style={{ minHeight: 34, padding: "0 14px", fontSize: 13 }}
                  onClick={() => submitRfq(activeRfqModal.name)}
                  type="button"
                >
                  Send RFQ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
