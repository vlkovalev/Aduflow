import type { LeadRecord } from "./leadStore";

export type PermitTask = {
  category: string;
  taskName: string;
  ownerRole: "homeowner" | "builder" | "designer" | "engineer" | "municipality" | "hoa";
  status: "not_started" | "in_progress" | "complete";
  dueStage: string;
  notes: string;
  sortOrder: number;
};

export type DocumentRequirement = {
  documentName: string;
  documentType: string;
  requiredFor: "city" | "hoa" | "lender" | "builder";
  status: "missing" | "draft" | "uploaded" | "approved";
  ownerRole: "homeowner" | "builder" | "designer" | "engineer";
};

export function generatePermitTasks(lead: LeadRecord): PermitTask[] {
  const hoaRequired = isHoaLikely(lead);

  return [
    task("Property Intake", "Confirm survey, parcel title, and civic address", "homeowner", "intake", lead.setbackTarget, 1),
    task("Zoning Review", "Validate setbacks, height, lot coverage, and ADU size", "designer", "feasibility", lead.permitPath, 2),
    task("Drawing Package", "Prepare site plan, floor plan, elevations, and sections", "designer", "design", lead.modelName, 3),
    task("Engineering", "Confirm structure, foundation, snow/wind loads, and energy requirements", "engineer", "design", `${lead.squareFeet} sq ft`, 4),
    task("Utilities & Site", "Review water, sewer, electrical, drainage, and access path", "builder", "site review", lead.reviewRisk, 5),
    task("Municipal Submittal", "Assemble application forms, fees, owner authorization, and builder info", "builder", "permit", lead.permitPath, 6),
    ...(hoaRequired
      ? [task("HOA Package", "Prepare exterior finishes, elevations, colors, and site context", "hoa", "design review", "HOA or design review likely", 7)]
      : []),
    task("Revision Tracker", "Track city or HOA comments, owners, and resubmission dates", "builder", "review", "No comments yet", 8),
  ];
}

export function generateDocumentRequirements(lead: LeadRecord): DocumentRequirement[] {
  const docs: DocumentRequirement[] = [
    doc("Current survey or site plan base", "survey", "city", "homeowner"),
    doc("Architectural site plan", "drawing", "city", "designer"),
    doc("Floor plan", "drawing", "city", "designer"),
    doc("Elevations", "drawing", "city", "designer"),
    doc("Foundation plan", "engineering", "city", "engineer"),
    doc("Utility tie-in plan", "site", "city", "builder"),
    doc("Preliminary budget and draw schedule", "finance", "lender", "builder"),
  ];

  if (isHoaLikely(lead)) {
    docs.push(
      doc("Exterior finish board", "hoa", "hoa", "designer"),
      doc("Neighbor-facing elevations", "hoa", "hoa", "designer"),
      doc("Site context photos", "hoa", "hoa", "homeowner"),
    );
  }

  return docs;
}

export function isHoaLikely(lead: LeadRecord) {
  return lead.parcelScenario.includes("hoa") || lead.permitPath.toLowerCase().includes("design");
}

function task(
  category: PermitTask["category"],
  taskName: string,
  ownerRole: PermitTask["ownerRole"],
  dueStage: string,
  notes: string,
  sortOrder: number,
) {
  return {
    category,
    taskName,
    ownerRole,
    status: "not_started",
    dueStage,
    notes,
    sortOrder,
  } satisfies PermitTask;
}

function doc(
  documentName: string,
  documentType: string,
  requiredFor: DocumentRequirement["requiredFor"],
  ownerRole: DocumentRequirement["ownerRole"],
) {
  return {
    documentName,
    documentType,
    requiredFor,
    status: "missing",
    ownerRole,
  } satisfies DocumentRequirement;
}
