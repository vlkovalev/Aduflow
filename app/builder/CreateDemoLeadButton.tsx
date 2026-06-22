"use client";

import { useState } from "react";

export function CreateDemoLeadButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createDemoLead() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/leads/demo", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Unable to create sandbox lead.");
        return;
      }
      window.location.href = result.proposalUrl ?? "/builder";
    } catch {
      setError("Network error while creating sandbox lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span style={{ display: "inline-grid", gap: 4 }}>
      <button className="button secondary" type="button" onClick={createDemoLead} disabled={loading}>
        {loading ? "Creating test lead..." : "Create test lead"}
      </button>
      {error ? <small style={{ color: "#b42318", maxWidth: 190 }}>{error}</small> : null}
    </span>
  );
}
