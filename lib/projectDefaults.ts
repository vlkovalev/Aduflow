export type ProjectMilestoneRecord = {
  id: string;
  label: string;
  description: string;
  date: string;
  notes: string;
  status: "pending" | "in_progress" | "complete";
  sortOrder: number;
};

export type DrawMilestoneRecord = {
  id: string;
  stage: string;
  percent: number;
  status: "not_started" | "pending_verification" | "released";
  evidenceNotes: string;
  releasedAt: string;
  sortOrder: number;
};

export const DEFAULT_PROJECT_MILESTONES: ProjectMilestoneRecord[] = [
  { id: "m1", label: "Contract signed", description: "Signed construction contract and deposit paid", date: "", notes: "", status: "pending", sortOrder: 1 },
  { id: "m2", label: "Permit submitted", description: "Permit application lodged with municipality", date: "", notes: "", status: "pending", sortOrder: 2 },
  { id: "m3", label: "Permit approved", description: "Building permit issued", date: "", notes: "", status: "pending", sortOrder: 3 },
  { id: "m4", label: "Factory production start", description: "Modular unit enters factory production", date: "", notes: "", status: "pending", sortOrder: 4 },
  { id: "m5", label: "Foundation ready", description: "Foundation installed and inspected on site", date: "", notes: "", status: "pending", sortOrder: 5 },
  { id: "m6", label: "Factory completion", description: "Unit complete and QA-signed at factory", date: "", notes: "", status: "pending", sortOrder: 6 },
  { id: "m7", label: "Delivery and set", description: "Unit delivered, craned, and set on foundation", date: "", notes: "", status: "pending", sortOrder: 7 },
  { id: "m8", label: "Weather-tight", description: "Unit sealed and services rough-in complete", date: "", notes: "", status: "pending", sortOrder: 8 },
  { id: "m9", label: "Final inspection", description: "City inspection passed", date: "", notes: "", status: "pending", sortOrder: 9 },
  { id: "m10", label: "Occupancy permit", description: "Occupancy certificate issued; project complete", date: "", notes: "", status: "pending", sortOrder: 10 },
];

export const DEFAULT_DRAW_MILESTONES: DrawMilestoneRecord[] = [
  { id: "d1", stage: "Deposit and permit package", percent: 10, status: "not_started", evidenceNotes: "", releasedAt: "", sortOrder: 1 },
  { id: "d2", stage: "Foundation ready", percent: 20, status: "not_started", evidenceNotes: "", releasedAt: "", sortOrder: 2 },
  { id: "d3", stage: "Factory completion", percent: 35, status: "not_started", evidenceNotes: "", releasedAt: "", sortOrder: 3 },
  { id: "d4", stage: "Set and weather-tight", percent: 20, status: "not_started", evidenceNotes: "", releasedAt: "", sortOrder: 4 },
  { id: "d5", stage: "Final inspection", percent: 15, status: "not_started", evidenceNotes: "", releasedAt: "", sortOrder: 5 },
];
