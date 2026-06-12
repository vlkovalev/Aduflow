"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PROJECT_MILESTONES,
  type ProjectMilestoneRecord,
} from "../../../lib/projectDefaults";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--line)",
  in_progress: "var(--gold)",
  complete: "#3a8a5a",
};

export function ProjectMilestones({ leadId }: { leadId: string }) {
  const [milestones, setMilestones] = useState<ProjectMilestoneRecord[]>(DEFAULT_PROJECT_MILESTONES);
  const [saveStatus, setSaveStatus] = useState("Saved");

  useEffect(() => {
    let active = true;

    async function loadMilestones() {
      try {
        const response = await fetch(`/api/projects/${leadId}/milestones`);
        const result = await response.json();
        if (active && Array.isArray(result.milestones)) {
          setMilestones(result.milestones);
          setSaveStatus("Saved");
        }
      } catch {
        if (active) {
          setSaveStatus("Using defaults");
        }
      }
    }

    loadMilestones();
    return () => {
      active = false;
    };
  }, [leadId]);

  async function persist(next: ProjectMilestoneRecord[]) {
    setSaveStatus("Saving...");
    try {
      const response = await fetch(`/api/projects/${leadId}/milestones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestones: next }),
      });
      const result = await response.json();
      if (response.ok && Array.isArray(result.milestones)) {
        setMilestones(result.milestones);
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Save failed");
      }
    } catch {
      setSaveStatus("Save failed");
    }
  }

  function update(id: string, field: keyof ProjectMilestoneRecord, value: string) {
    setMilestones((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, [field]: value } : m));
      void persist(next);
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
        <span>
          {complete} of {milestones.length} milestones complete - {saveStatus}
        </span>
      </div>

      <div className="milestoneList">
        {milestones.map((m, i) => (
          <div key={m.id} className={`milestoneRow status-${m.status}`}>
            <div
              className="milestoneNum"
              style={{
                background: STATUS_COLORS[m.status],
                color: m.status === "pending" ? "var(--muted)" : "white",
              }}
            >
              {m.status === "complete" ? "Done" : i + 1}
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
