"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PermitData = {
  status: "drafting" | "submitted" | "under_review" | "approved";
  appNumber: string;
  cityContact: string;
  submissionDate: string;
  approvalDate: string;
};

const DEFAULT_PERMIT: PermitData = {
  status: "drafting",
  appNumber: "",
  cityContact: "",
  submissionDate: "",
  approvalDate: "",
};

const STATUS_LABELS = {
  drafting: "Drafting Application",
  submitted: "Submitted to City",
  under_review: "Under City Review",
  approved: "Issued / Approved",
};

function mapDbToPermitData(dbPackage: any): PermitData {
  let status: PermitData["status"] = "drafting";
  const dbStatus = dbPackage?.packageStatus || dbPackage?.package_status;
  if (dbStatus === "submitted") status = "submitted";
  else if (dbStatus === "under_review") status = "under_review";
  else if (dbStatus === "approved" || dbStatus === "issued") status = "approved";
  
  return {
    status,
    appNumber: dbPackage?.applicationNumber || dbPackage?.application_number || "",
    cityContact: dbPackage?.cityContact || dbPackage?.city_contact || "",
    submissionDate: dbPackage?.submissionDate || dbPackage?.submission_date || "",
    approvalDate: dbPackage?.approvalDate || dbPackage?.approval_date || "",
  };
}

export function PermitTracker({ leadId, permitPath, reviewRisk, setbackTarget }: {
  leadId: string;
  permitPath: string;
  reviewRisk: string;
  setbackTarget: string;
}) {
  const [permit, setPermit] = useState<PermitData>(DEFAULT_PERMIT);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");

  useEffect(() => {
    let active = true;
    async function loadPermit() {
      try {
        const response = await fetch(`/api/permit-packages?leadId=${leadId}`);
        const result = await response.json();
        if (active && result.permitPackage) {
          setPermit(mapDbToPermitData(result.permitPackage));
          setSaveStatus("Saved");
        }
      } catch (err) {
        console.error("Failed to load permit package:", err);
      }
    }
    loadPermit();
    return () => {
      active = false;
    };
  }, [leadId]);

  async function persist(next: PermitData) {
    setSaveStatus("Saving...");
    try {
      const apiStatus = next.status === "drafting" ? "draft" : next.status;
      const response = await fetch(`/api/permit-packages?leadId=${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageStatus: apiStatus,
          applicationNumber: next.appNumber,
          cityContact: next.cityContact,
          submissionDate: next.submissionDate,
          approvalDate: next.approvalDate,
        }),
      });
      const result = await response.json();
      if (response.ok && result.permitPackage) {
        setPermit(mapDbToPermitData(result.permitPackage));
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Save failed");
      }
    } catch {
      setSaveStatus("Save failed");
    }
  }

  function updateField(field: keyof PermitData, value: string) {
    const next = { ...permit, [field]: value };
    setPermit(next);
    void persist(next);
  }

  return (
    <div className="dataPanel" style={{ marginTop: 24 }}>
      <div className="panelTitle">
        <h2>Permit & HOA Tracker</h2>
        <span>Manage municipal reviews — {saveStatus}</span>
      </div>

      {!isEditing ? (
        <div>
          <dl className="summaryList">
            <div>
              <dt>Permit Status</dt>
              <dd style={{ color: permit.status === "approved" ? "#3a8a5a" : "var(--gold)" }}>
                <strong>{STATUS_LABELS[permit.status]}</strong>
              </dd>
            </div>
            <div>
              <dt>Permit Path</dt>
              <dd>{permitPath}</dd>
            </div>
            <div>
              <dt>Review Risk</dt>
              <dd>{reviewRisk}</dd>
            </div>
            <div>
              <dt>Setback Target</dt>
              <dd>{setbackTarget}</dd>
            </div>
            {permit.appNumber && (
              <div>
                <dt>Application #</dt>
                <dd>{permit.appNumber}</dd>
              </div>
            )}
            {permit.cityContact && (
              <div>
                <dt>City Contact</dt>
                <dd>{permit.cityContact}</dd>
              </div>
            )}
            {permit.submissionDate && (
              <div>
                <dt>Date Submitted</dt>
                <dd>{permit.submissionDate}</dd>
              </div>
            )}
            {permit.approvalDate && (
              <div>
                <dt>Date Approved</dt>
                <dd>{permit.approvalDate}</dd>
              </div>
            )}
          </dl>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button
              className="button secondary"
              style={{ minHeight: 34, padding: "0 12px", fontSize: 13 }}
              onClick={() => setIsEditing(true)}
            >
              Update permit status
            </button>
            <Link className="button secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: 13 }} href={`/permit/${leadId}`}>
              Open City Checklist
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsEditing(false);
          }}
          className="proposalForm"
          style={{ display: "grid", gap: 12 }}
        >
          <label style={{ fontSize: 12, display: "grid", gap: 4 }}>
            Permit Status
            <select
              style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, background: "white" }}
              value={permit.status}
              onChange={(e) => updateField("status", e.target.value as PermitData["status"])}
            >
              <option value="drafting">Drafting Application</option>
              <option value="submitted">Submitted to City</option>
              <option value="under_review">Under City Review</option>
              <option value="approved">Issued / Approved</option>
            </select>
          </label>
          <label style={{ fontSize: 12, display: "grid", gap: 4 }}>
            Application Number
            <input
              className="setupInput"
              style={{ padding: "8px 12px" }}
              value={permit.appNumber}
              onChange={(e) => updateField("appNumber", e.target.value)}
              placeholder="e.g. BP-2026-09887"
            />
          </label>
          <label style={{ fontSize: 12, display: "grid", gap: 4 }}>
            City Planning Contact
            <input
              className="setupInput"
              style={{ padding: "8px 12px" }}
              value={permit.cityContact}
              onChange={(e) => updateField("cityContact", e.target.value)}
              placeholder="e.g. Jane Doe (Permit Department)"
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, display: "grid", gap: 4 }}>
              Submission Date
              <input
                className="setupInput"
                style={{ padding: "8px 12px" }}
                type="date"
                value={permit.submissionDate}
                onChange={(e) => updateField("submissionDate", e.target.value)}
              />
            </label>
            <label style={{ fontSize: 12, display: "grid", gap: 4 }}>
              Approval Date
              <input
                className="setupInput"
                style={{ padding: "8px 12px" }}
                type="date"
                value={permit.approvalDate}
                onChange={(e) => updateField("approvalDate", e.target.value)}
                disabled={permit.status !== "approved"}
              />
            </label>
          </div>
          <button
            className="button primary"
            type="submit"
            style={{ minHeight: 34, padding: "0 12px", fontSize: 13, marginTop: 8 }}
          >
            Save tracker info
          </button>
        </form>
      )}
    </div>
  );
}
