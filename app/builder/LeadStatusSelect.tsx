"use client";

import { useState } from "react";

const STATUSES = [
  { value: "new", label: "New", help: "New intake, no billing event." },
  { value: "contacted", label: "Contacted", help: "Homeowner has been contacted." },
  { value: "qualified", label: "Qualified", help: "Counts toward monthly qualified proposal usage." },
  { value: "won", label: "Won", help: "Activates project and draw tracking." },
  { value: "lost", label: "Lost", help: "Lead is closed without project tracking." },
];

export function LeadStatusSelect({
  leadId,
  initialStatus,
}: {
  leadId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus ?? "new");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedStatus = STATUSES.find((item) => item.value === status);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const previous = status;
    setError("");
    if (next === "qualified" && status !== "qualified") {
      if (!confirm("Marking a proposal as 'Qualified' counts toward your monthly billing usage. Proceed?")) {
        return;
      }
    }
    if (next === "won" && status !== "won") {
      if (!confirm("Marking a proposal as 'Won' will activate active project and draw tracking for this lead. Proceed?")) {
        return;
      }
    }
    setSaving(true);
    setStatus(next);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(previous);
        setError(result.error ?? "Status update failed. Please try again.");
      }
    } catch {
      setStatus(previous);
      setError("Network error while updating status. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <span style={{ display: "inline-grid", gap: 4 }}>
      <select
        className={`statusSelect status-${status}`}
        value={status}
        onChange={handleChange}
        disabled={saving}
        aria-label="Lead status"
        title={selectedStatus?.help}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {selectedStatus?.value === "qualified" || selectedStatus?.value === "won" ? (
        <small style={{ maxWidth: 190, color: "var(--muted)", lineHeight: 1.25 }}>
          {selectedStatus.help}
        </small>
      ) : null}
      {error ? (
        <small style={{ maxWidth: 220, color: "#b42318", lineHeight: 1.25 }}>
          {error}
        </small>
      ) : null}
    </span>
  );
}
