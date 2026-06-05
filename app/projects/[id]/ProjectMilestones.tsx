"use client";

import { useState } from "react";

type Milestone = {
  id: string;
  label: string;
  description: string;
  date: string;
  notes: string;
  status: "pending" | "in_progress" | "complete";
};

const DEFAULT_MILESTONES: Milestone[] = [
  { id: "m1", label: "Contract signed", description: "Signed construction contract and deposit paid", date: "", notes: "", status: "pending" },
  { id: "m2", label: "Permit submitted", description: "Permit application lodged with municipality", date: "", notes: "", status: "pending" },
  { id: "m3", label: "Permit approved", description: "Building permit issued", date: "", notes: "", status: "pending" },
  { id: "m4", label: "Factory production start", description: "Modular unit enters factory production", date: "", notes: "", status: "pending" },
  { id: "m5", label: "Foundation ready", description: "Foundation installed and inspected on site", date: "", notes: "", status: "pending" },
  { id: "m6", label: "Factory completion", description: "Unit complete and QA-signed at factory", date: "", notes: "", status: "pending" },
  { id: "m7", label: "Delivery and set", description: "Unit delivered, craned, and set on foundation", date: "", notes: "", status: "pending" },
  { id: "m8", label: "Weather-tight", description: "Unit sealed, services rough-in complete", date: "", notes: "", status: "pending" },
  { id: "m9", label: "Final inspection", description: "City inspection passed", date: "", notes: "", status: "pending" },
  { id: "m10", label: "Occupancy permit", description: "Occupancy certificate issued — project complete", date: "", notes: "", status: "pending" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--line)",
  in_progress: "var(--gold)",
  complete: "#3a8a5a",
};

export function ProjectMilestones({ leadId }: { leadId: string }) {
  const storageKey = `project-milestones-${leadId}`;
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    if (typeof window === "undefined") return DEFAULT_MILESTONES;
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_MILESTONES;
    } catch {
      return DEFAULT_MILESTONES;
    }
  });

  function update(id: string, field: keyof Milestone, value: string) {
    setMilestones((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, [field]: value } : m);
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }

  const complete = milestones.filter((m) => m.status === "complete").length;

  return (
    <div>
      <div className="milestoneProgress">
        <div className="milestoneProgressBar">
          <span style={{ width: `${Math.round((complete / milestones.length) * 100)}%` }} />
        </div>
        <span>{complete} of {milestones.length} milestones complete</span>
      </div>

      <div className="milestoneList">
        {milestones.map((m, i) => (
          <div key={m.id} className={`milestoneRow status-${m.status}`}>
            <div className="milestoneNum" style={{ background: STATUS_COLORS[m.status], color: m.status === "pending" ? "var(--muted)" : "white" }}>
              {m.status === "complete" ? "✓" : i + 1}
            </div>
            <div className="milestoneBody">
              <div className="milestoneTop">
                <strong>{m.label}</strong>
                <select
                  className={`statusSelect status-${m.status}`}
                  value={m.status}
                  onChange={(e) => update(m.id, "status", e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 8px" }}>{m.description}</p>
              <div className="milestoneFields">
                <input
                  className="setupInput"
                  type="date"
                  value={m.date}
                  onChange={(e) => update(m.id, "date", e.target.value)}
                  placeholder="Date"
                />
                <input
                  className="setupInput"
                  value={m.notes}
                  onChange={(e) => update(m.id, "notes", e.target.value)}
                  placeholder="Notes (ref number, inspector name, etc.)"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
