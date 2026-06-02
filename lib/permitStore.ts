import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateDocumentRequirements, generatePermitTasks, isHoaLikely, type DocumentRequirement, type PermitTask } from "./permitChecklist";
import { getLead, type LeadRecord } from "./leadStore";
import { getSupabaseServiceClient } from "./supabase";

export type PermitPackage = {
  id: string;
  leadId: string;
  jurisdictionName: string;
  packageStatus: string;
  permitPath: string;
  hoaRequired: boolean;
  revisionRound: number;
  createdAt: string;
  updatedAt: string;
  tasks: PermitTask[];
  documents: DocumentRequirement[];
};

const localStorePath = path.join(process.cwd(), ".data", "permit-packages.json");

export async function createPermitPackage(leadId: string, jurisdictionName = "Local municipality") {
  const existing = await getPermitPackageByLeadId(leadId);

  if (existing) {
    return existing;
  }

  const lead = await getLead(leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const now = new Date().toISOString();
  const permitPackage: PermitPackage = {
    id: randomUUID(),
    leadId,
    jurisdictionName,
    packageStatus: "draft",
    permitPath: lead.permitPath,
    hoaRequired: isHoaLikely(lead),
    revisionRound: 0,
    createdAt: now,
    updatedAt: now,
    tasks: generatePermitTasks(lead),
    documents: generateDocumentRequirements(lead),
  };

  const supabase = getSupabaseServiceClient();

  if (supabase) {
    await insertSupabasePackage(permitPackage);
    return permitPackage;
  }

  const packages = await readLocalPackages();
  packages.push(permitPackage);
  await writeLocalPackages(packages);

  return permitPackage;
}

export async function getPermitPackageByLeadId(leadId: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("permit_packages")
      .select("*")
      .eq("lead_id", leadId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapSupabasePackage(data as Record<string, unknown>, [], []);
  }

  const packages = await readLocalPackages();
  return packages.find((item) => item.leadId === leadId) ?? null;
}

async function insertSupabasePackage(permitPackage: PermitPackage) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("permit_packages").insert({
    id: permitPackage.id,
    lead_id: permitPackage.leadId,
    jurisdiction_name: permitPackage.jurisdictionName,
    package_status: permitPackage.packageStatus,
    permit_path: permitPackage.permitPath,
    hoa_required: permitPackage.hoaRequired,
    revision_round: permitPackage.revisionRound,
    created_at: permitPackage.createdAt,
    updated_at: permitPackage.updatedAt,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function mapSupabasePackage(
  data: Record<string, unknown>,
  tasks: PermitTask[],
  documents: DocumentRequirement[],
) {
  return {
    id: String(data.id ?? ""),
    leadId: String(data.lead_id ?? ""),
    jurisdictionName: String(data.jurisdiction_name ?? ""),
    packageStatus: String(data.package_status ?? "draft"),
    permitPath: String(data.permit_path ?? ""),
    hoaRequired: Boolean(data.hoa_required),
    revisionRound: Number(data.revision_round ?? 0),
    createdAt: String(data.created_at ?? ""),
    updatedAt: String(data.updated_at ?? ""),
    tasks,
    documents,
  } satisfies PermitPackage;
}

async function readLocalPackages() {
  try {
    const raw = await readFile(localStorePath, "utf8");
    return JSON.parse(raw) as PermitPackage[];
  } catch {
    return [];
  }
}

async function writeLocalPackages(packages: PermitPackage[]) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(packages, null, 2));
}
