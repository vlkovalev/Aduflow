"use client";

import { useEffect, useState } from "react";
import { DEFAULT_DRAW_MILESTONES, type DrawMilestoneRecord } from "../../../lib/projectDefaults";
import { formatCurrency } from "../../../lib/proposalBuilder";

export function DrawReleaseLog({
  leadId,
  totalPrice,
  currency = "CAD",
}: {
  leadId: string;
  totalPrice: number;
  currency?: "CAD" | "USD";
}) {
  const [draws, setDraws] = useState<DrawMilestoneRecord[]>(DEFAULT_DRAW_MILESTONES);
  const [activeDrawIndex, setActiveDrawIndex] = useState<number | null>(null);
  const [evidenceInput, setEvidenceInput] = useState("");
  const [saveStatus, setSaveStatus] = useState("Saved");

  useEffect(() => {
    let active = true;

    async function loadDraws() {
      try {
        const response = await fetch(`/api/projects/${leadId}/draws`);
        const result = await response.json();
        if (active && Array.isArray(result.draws)) {
          setDraws(result.draws);
          setSaveStatus("Saved");
        }
      } catch {
        if (active) {
          setSaveStatus("Using defaults");
        }
      }
    }

    loadDraws();
    return () => {
      active = false;
    };
  }, [leadId]);

  async function saveDraws(newDraws: DrawMilestoneRecord[]) {
    setDraws(newDraws);
    setSaveStatus("Saving...");
    try {
      const response = await fetch(`/api/projects/${leadId}/draws`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draws: newDraws }),
      });
      const result = await response.json();
      if (response.ok && Array.isArray(result.draws)) {
        setDraws(result.draws);
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Save failed");
      }
    } catch {
      setSaveStatus("Save failed");
    }
  }

  function handleRequestDraw(index: number) {
    setActiveDrawIndex(index);
    setEvidenceInput("");
  }

  function submitEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (activeDrawIndex === null) return;

    const next = [...draws];
    next[activeDrawIndex] = {
      ...next[activeDrawIndex],
      status: "pending_verification",
      evidenceNotes: evidenceInput.trim() || "Uploaded simulated proof of work: geotagged photos and documentation.",
    };

    void saveDraws(next);
    setActiveDrawIndex(null);
  }

  function handleApproveDraw(index: number) {
    const next = [...draws];
    next[index] = {
      ...next[index],
      status: "released",
      releasedAt: new Date().toLocaleDateString("en-CA"),
    };
    void saveDraws(next);
  }

  function handleResetDraw(index: number) {
    const next = [...draws];
    next[index] = {
      ...next[index],
      status: "not_started",
      evidenceNotes: "",
      releasedAt: "",
    };
    void saveDraws(next);
  }

  return (
    <div className="dataPanel" style={{ marginTop: 24 }}>
      <div className="panelTitle">
        <h2>Draw release log</h2>
        <span>Request and authorize loan payouts - {saveStatus}</span>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {draws.map((d, i) => {
          const drawAmount = Math.round((totalPrice * d.percent) / 100);

          return (
            <div
              key={d.stage}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 16,
                background: d.status === "released" ? "rgba(58, 138, 90, 0.03)" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                    {d.stage} ({d.percent}%)
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
                    Payout value: <strong>{formatCurrency(drawAmount, currency)}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    className="statusDot"
                    style={{
                      background:
                        d.status === "released"
                          ? "#3a8a5a"
                          : d.status === "pending_verification"
                          ? "var(--gold)"
                          : "var(--line)",
                      width: 10,
                      height: 10,
                      borderRadius: 99,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>
                    {d.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {d.status === "released" && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(58, 138, 90, 0.08)", borderRadius: 6, fontSize: 12 }}>
                  <p style={{ margin: 0, color: "#2d6643" }}>
                    <strong>Released on {d.releasedAt}</strong>
                  </p>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                    Release notes: {d.evidenceNotes}
                  </p>
                  <button
                    className="button danger"
                    style={{ minHeight: 24, padding: "0 8px", fontSize: 11, marginTop: 8 }}
                    onClick={() => handleResetDraw(i)}
                  >
                    Reset milestone
                  </button>
                </div>
              )}

              {d.status === "pending_verification" && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(213, 169, 78, 0.08)", borderRadius: 6, fontSize: 12 }}>
                  <p style={{ margin: 0, color: "#8a6d2f" }}>
                    <strong>Pending lender / client approval</strong>
                  </p>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                    Evidence log: {d.evidenceNotes}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      className="button primary"
                      style={{ minHeight: 26, padding: "0 10px", fontSize: 11 }}
                      onClick={() => handleApproveDraw(i)}
                    >
                      Authorize release
                    </button>
                    <button
                      className="button secondary"
                      style={{ minHeight: 26, padding: "0 10px", fontSize: 11 }}
                      onClick={() => handleResetDraw(i)}
                    >
                      Reject evidence
                    </button>
                  </div>
                </div>
              )}

              {d.status === "not_started" && (
                <div style={{ marginTop: 12 }}>
                  {activeDrawIndex !== i ? (
                    <button
                      className="button secondary"
                      style={{ minHeight: 30, padding: "0 12px", fontSize: 12 }}
                      onClick={() => handleRequestDraw(i)}
                    >
                      Submit evidence / request draw
                    </button>
                  ) : (
                    <form onSubmit={submitEvidence} style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      <input
                        className="setupInput"
                        value={evidenceInput}
                        onChange={(e) => setEvidenceInput(e.target.value)}
                        placeholder="Enter evidence notes, such as photo IDs, inspection code, or certificate link"
                        required
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="button primary" style={{ minHeight: 30, padding: "0 12px", fontSize: 12 }} type="submit">
                          Submit verification request
                        </button>
                        <button
                          className="button secondary"
                          style={{ minHeight: 30, padding: "0 12px", fontSize: 12 }}
                          type="button"
                          onClick={() => setActiveDrawIndex(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
