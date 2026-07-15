import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  generateDocumentRequirements,
  generatePermitTasks,
  isHoaLikely,
  type DocumentRequirement,
  type PermitTask,
} from "./permitChecklist";
import { getLead } from "./leadStore";
import { getSupabaseServiceClient, markSupabaseUnhealthy } from "./supabase";
import { assertLocalFallbackAllowed, getLocalStorePath } from "./localStoreHelper";

export type PermitPackage = {
  id: string;
  leadId: string;
  jurisdictionName: string;
  packageStatus: string;
  permitPath: string;
  hoaRequired: boolean;
  revisionRound: number;
  applicationNumber: string;
  cityContact: string;
  submissionDate: string;
  approvalDate: string;
  createdAt: string;
  updatedAt: string;
  tasks: PermitTask[];
  documents: DocumentRequirement[];
};

const localStorePath = getLocalStorePath("permit-packages.json");

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
    applicationNumber: "",
    cityContact: "",
    submissionDate: "",
    approvalDate: "",
    createdAt: now,
    updatedAt: now,
    tasks: generatePermitTasks(lead),
    documents: generateDocumentRequirements(lead),
  };

  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      await insertSupabasePackage(permitPackage);
      return permitPackage;
    } catch (e) {
      console.warn("Supabase insert package error, falling back to local:", e);
      markSupabaseUnhealthy();
    }
  }

  const packages = await readLocalPackages();
  packages.push(permitPackage);
  await writeLocalPackages(packages);

  return permitPackage;
}

export async function getPermitPackageByLeadId(leadId: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("permit_packages")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();

      if (error) {
        console.warn("Supabase getPermitPackageByLeadId error, disabling Supabase:", error);
        markSupabaseUnhealthy();
      } else if (data) {
        const packageId = String(data.id);

        const [{ data: taskRows }, { data: docRows }] = await Promise.all([
          supabase
            .from("permit_tasks")
            .select("*")
            .eq("permit_package_id", packageId)
            .order("sort_order"),
          supabase
            .from("document_requirements")
            .select("*")
            .eq("permit_package_id", packageId),
        ]);

        const tasks: PermitTask[] = (taskRows ?? []).map((row) => ({
          category: String(row.category ?? ""),
          taskName: String(row.task_name ?? ""),
          ownerRole: String(row.owner_role ?? "builder") as PermitTask["ownerRole"],
          status: String(row.status ?? "not_started") as PermitTask["status"],
          dueStage: String(row.due_stage ?? ""),
          notes: String(row.notes ?? ""),
          sortOrder: Number(row.sort_order ?? 0),
        }));

        const documents: DocumentRequirement[] = (docRows ?? []).map((row) => ({
          documentName: String(row.document_name ?? ""),
          documentType: String(row.document_type ?? ""),
          requiredFor: String(row.required_for ?? "city") as DocumentRequirement["requiredFor"],
          status: String(row.status ?? "missing") as DocumentRequirement["status"],
          ownerRole: String(row.owner_role ?? "builder") as DocumentRequirement["ownerRole"],
        }));

        return mapSupabasePackage(data as Record<string, unknown>, tasks, documents);
      }
    } catch (e) {
      console.warn("Supabase getPermitPackageByLeadId exception, disabling Supabase:", e);
      markSupabaseUnhealthy();
    }
  }

  const packages = await readLocalPackages();
  return packages.find((item) => item.leadId === leadId) ?? null;
}

async function insertSupabasePackage(permitPackage: PermitPackage) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error: packageError } = await supabase.from("permit_packages").insert({
    id: permitPackage.id,
    lead_id: permitPackage.leadId,
    jurisdiction_name: permitPackage.jurisdictionName,
    package_status: permitPackage.packageStatus,
    permit_path: permitPackage.permitPath,
    hoa_required: permitPackage.hoaRequired,
    revision_round: permitPackage.revisionRound,
    application_number: permitPackage.applicationNumber,
    city_contact: permitPackage.cityContact,
    submission_date: permitPackage.submissionDate,
    approval_date: permitPackage.approvalDate,
    created_at: permitPackage.createdAt,
    updated_at: permitPackage.updatedAt,
  });

  if (packageError) {
    throw new Error(packageError.message);
  }

  if (permitPackage.tasks.length > 0) {
    const { error: tasksError } = await supabase.from("permit_tasks").insert(
      permitPackage.tasks.map((task) => ({
        id: randomUUID(),
        permit_package_id: permitPackage.id,
        category: task.category,
        task_name: task.taskName,
        owner_role: task.ownerRole,
        status: task.status,
        due_stage: task.dueStage,
        notes: task.notes,
        sort_order: task.sortOrder,
      })),
    );

    if (tasksError) {
      throw new Error(tasksError.message);
    }
  }

  if (permitPackage.documents.length > 0) {
    const { error: docsError } = await supabase.from("document_requirements").insert(
      permitPackage.documents.map((doc) => ({
        id: randomUUID(),
        permit_package_id: permitPackage.id,
        document_name: doc.documentName,
        document_type: doc.documentType,
        required_for: doc.requiredFor,
        status: doc.status,
        owner_role: doc.ownerRole,
      })),
    );

    if (docsError) {
      throw new Error(docsError.message);
    }
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
    applicationNumber: String(data.application_number ?? ""),
    cityContact: String(data.city_contact ?? ""),
    submissionDate: String(data.submission_date ?? ""),
    approvalDate: String(data.approval_date ?? ""),
    createdAt: String(data.created_at ?? ""),
    updatedAt: String(data.updated_at ?? ""),
    tasks,
    documents,
  } satisfies PermitPackage;
}

export async function updatePermitPackage(
  leadId: string,
  updates: Partial<Omit<PermitPackage, "id" | "leadId" | "tasks" | "documents">>
) {
  const existing = await getPermitPackageByLeadId(leadId) || await createPermitPackage(leadId);

  const updated: PermitPackage = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("permit_packages")
        .update({
          package_status: updated.packageStatus,
          jurisdiction_name: updated.jurisdictionName,
          permit_path: updated.permitPath,
          hoa_required: updated.hoaRequired,
          revision_round: updated.revisionRound,
          application_number: updated.applicationNumber,
          city_contact: updated.cityContact,
          submission_date: updated.submissionDate,
          approval_date: updated.approvalDate,
          updated_at: updated.updatedAt,
        })
        .eq("lead_id", leadId);

      if (!error) {
        return updated;
      }
      console.warn("Supabase update package error, falling back to local:", error);
      markSupabaseUnhealthy();
    } catch (e) {
      console.warn("Supabase update package exception, falling back to local:", e);
      markSupabaseUnhealthy();
    }
  }

  const packages = await readLocalPackages();
  const index = packages.findIndex((item) => item.leadId === leadId);
  if (index !== -1) {
    packages[index] = updated;
  } else {
    packages.push(updated);
  }
  await writeLocalPackages(packages);
  return updated;
}

async function readLocalPackages() {
  assertLocalFallbackAllowed();
  try {
    const raw = await readFile(localStorePath, "utf8");
    return JSON.parse(raw) as PermitPackage[];
  } catch {
    return [];
  }
}

async function writeLocalPackages(packages: PermitPackage[]) {
  assertLocalFallbackAllowed();
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(packages, null, 2));
}
