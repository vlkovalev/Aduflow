import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getLocalStorePath } from "./localStoreHelper";
import { getSupabaseServiceClient, markSupabaseUnhealthy } from "./supabase";
import {
  DEFAULT_DRAW_MILESTONES,
  DEFAULT_PROJECT_MILESTONES,
  type DrawMilestoneRecord,
  type ProjectMilestoneRecord,
} from "./projectDefaults";

type LocalProjectState = {
  milestones: ProjectMilestoneRecord[];
  draws: DrawMilestoneRecord[];
};

type LocalProjectStore = Record<string, LocalProjectState>;

const projectStorePath = getLocalStorePath("projects.json");

export async function getProjectMilestones(leadId: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("lead_id", leadId)
        .order("sort_order", { ascending: true });

      if (!error && data?.length) {
        return data.map(mapProjectMilestoneRow);
      }
      if (error) {
        markSupabaseUnhealthy();
      }
    } catch {
      markSupabaseUnhealthy();
    }
  }

  const local = await readLocalProjectStore();
  return local[leadId]?.milestones ?? DEFAULT_PROJECT_MILESTONES;
}

export async function saveProjectMilestones(leadId: string, milestones: ProjectMilestoneRecord[]) {
  const normalized = milestones.map((milestone, index) => ({
    ...milestone,
    id: milestone.id || randomUUID(),
    sortOrder: index + 1,
  }));

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      await supabase.from("project_milestones").delete().eq("lead_id", leadId);
      const { error } = await supabase.from("project_milestones").insert(
        normalized.map((milestone) => ({
          id: milestone.id,
          lead_id: leadId,
          sort_order: milestone.sortOrder,
          label: milestone.label,
          description: milestone.description,
          target_date: milestone.date || null,
          notes: milestone.notes,
          status: milestone.status,
        })),
      );

      if (!error) return normalized;
      markSupabaseUnhealthy();
    } catch {
      markSupabaseUnhealthy();
    }
  }

  const local = await readLocalProjectStore();
  local[leadId] = { ...(local[leadId] ?? { draws: DEFAULT_DRAW_MILESTONES }), milestones: normalized };
  await writeLocalProjectStore(local);
  return normalized;
}

export async function getDrawMilestones(leadId: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("draw_milestones")
        .select("*")
        .eq("lead_id", leadId)
        .order("sort_order", { ascending: true });

      if (!error && data?.length) {
        return data.map(mapDrawMilestoneRow);
      }
      if (error) {
        markSupabaseUnhealthy();
      }
    } catch {
      markSupabaseUnhealthy();
    }
  }

  const local = await readLocalProjectStore();
  return local[leadId]?.draws ?? DEFAULT_DRAW_MILESTONES;
}

export async function saveDrawMilestones(leadId: string, draws: DrawMilestoneRecord[]) {
  const normalized = draws.map((draw, index) => ({
    ...draw,
    id: draw.id || randomUUID(),
    sortOrder: index + 1,
  }));

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      await supabase.from("draw_milestones").delete().eq("lead_id", leadId);
      const { error } = await supabase.from("draw_milestones").insert(
        normalized.map((draw) => ({
          id: draw.id,
          lead_id: leadId,
          sort_order: draw.sortOrder,
          stage_name: draw.stage,
          percent: draw.percent,
          evidence_status: draw.status,
          lender_status: draw.status === "released" ? "released" : "notified",
          evidence_notes: draw.evidenceNotes,
          released_at: draw.releasedAt || null,
        })),
      );

      if (!error) return normalized;
      markSupabaseUnhealthy();
    } catch {
      markSupabaseUnhealthy();
    }
  }

  const local = await readLocalProjectStore();
  local[leadId] = { ...(local[leadId] ?? { milestones: DEFAULT_PROJECT_MILESTONES }), draws: normalized };
  await writeLocalProjectStore(local);
  return normalized;
}

function mapProjectMilestoneRow(data: Record<string, unknown>): ProjectMilestoneRecord {
  return {
    id: String(data.id ?? ""),
    label: String(data.label ?? ""),
    description: String(data.description ?? ""),
    date: String(data.target_date ?? ""),
    notes: String(data.notes ?? ""),
    status: normalizeProjectStatus(String(data.status ?? "pending")),
    sortOrder: Number(data.sort_order ?? 0),
  };
}

function mapDrawMilestoneRow(data: Record<string, unknown>): DrawMilestoneRecord {
  return {
    id: String(data.id ?? ""),
    stage: String(data.stage_name ?? "Milestone"),
    percent: Number(data.percent ?? 0),
    status: normalizeDrawStatus(String(data.evidence_status ?? "not_started")),
    evidenceNotes: String(data.evidence_notes ?? ""),
    releasedAt: String(data.released_at ?? ""),
    sortOrder: Number(data.sort_order ?? 0),
  };
}

function normalizeProjectStatus(value: string): ProjectMilestoneRecord["status"] {
  return value === "in_progress" || value === "complete" ? value : "pending";
}

function normalizeDrawStatus(value: string): DrawMilestoneRecord["status"] {
  return value === "pending_verification" || value === "released" ? value : "not_started";
}

async function readLocalProjectStore(): Promise<LocalProjectStore> {
  try {
    const raw = await readFile(projectStorePath, "utf8");
    return JSON.parse(raw) as LocalProjectStore;
  } catch {
    return {};
  }
}

async function writeLocalProjectStore(store: LocalProjectStore) {
  await mkdir(path.dirname(projectStorePath), { recursive: true });
  await writeFile(projectStorePath, JSON.stringify(store, null, 2));
}
