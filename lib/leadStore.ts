import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient, markSupabaseUnhealthy } from "./supabase";
import { assertLocalFallbackAllowed, getLocalStorePath } from "./localStoreHelper";
import type { CurrencyCode } from "./currency";

export type LeadRecord = {
  id: string;
  builderId: string;
  createdAt: string;
  updatedAt: string;
  proposalNumber: string;
  proposalStatus: string;
  shareToken: string;
  customerName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  parcelScenario: string;
  zoningSource: string;
  zoningZone: string;
  zoningDescription: string;
  zoningRaw: Record<string, unknown> | null;
  zoningLookupStatus: string;
  zoningCheckedAt: string;
  aduPermitted: boolean | null;
  setbackFront: string;
  setbackSide: string;
  setbackRear: string;
  feasibilityResult: string;
  feasibilityConfidence: number;
  permitPath: string;
  estimatedPrice: number;
  estimateLow: number;
  estimateHigh: number;
  factoryCost: number;
  siteCost: number;
  /** Currency this quote was actually priced in — builder default unless the property's jurisdiction overrode it. */
  currency: CurrencyCode;
  modelCode: string;
  modelName: string;
  squareFeet: number;
  timelineWeeks: number;
  maxSquareFeet: number;
  maxStories: number;
  setbackTarget: string;
  reviewRisk: string;
  configuration: Record<string, unknown>;
  status: string;
};

export type CreateLeadInput = Omit<
  LeadRecord,
  "id" | "createdAt" | "updatedAt" | "proposalNumber" | "proposalStatus" | "shareToken" | "status"
>;

const localStorePath = getLocalStorePath("leads.json");
const defaultBuilderId = "00000000-0000-0000-0000-000000000001";

export async function createLead(input: CreateLeadInput) {
  const createdAt = new Date().toISOString();
  const record: LeadRecord = {
    ...input,
    builderId: input.builderId || defaultBuilderId,
    id: randomUUID(),
    createdAt,
    updatedAt: createdAt,
    proposalNumber: `ADF-${createdAt.slice(0, 10).replaceAll("-", "")}-${Math.floor(
      Math.random() * 9000 + 1000,
    )}`,
    proposalStatus: "draft",
    shareToken: randomUUID(),
    status: "new",
  };

  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          id: record.id,
          builder_id: record.builderId,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
          proposal_number: record.proposalNumber,
          proposal_status: record.proposalStatus,
          share_token: record.shareToken,
          customer_name: record.customerName,
          email: record.email,
          phone: record.phone,
          property_address: record.propertyAddress,
          parcel_scenario: record.parcelScenario,
          zoning_source: record.zoningSource,
          zoning_zone: record.zoningZone,
          zoning_description: record.zoningDescription,
          zoning_raw: record.zoningRaw,
          zoning_lookup_status: record.zoningLookupStatus,
          zoning_checked_at: record.zoningCheckedAt || null,
          adu_permitted: record.aduPermitted,
          setback_front: record.setbackFront,
          setback_side: record.setbackSide,
          setback_rear: record.setbackRear,
          feasibility_result: record.feasibilityResult,
          feasibility_confidence: record.feasibilityConfidence,
          permit_path: record.permitPath,
          configuration_json: record.configuration,
          estimated_price: record.estimatedPrice,
          estimate_low: record.estimateLow,
          estimate_high: record.estimateHigh,
          factory_cost: record.factoryCost,
          site_cost: record.siteCost,
          currency: record.currency,
          model_code: record.modelCode,
          model_name: record.modelName,
          square_feet: record.squareFeet,
          timeline_weeks: record.timelineWeeks,
          max_square_feet: record.maxSquareFeet,
          max_stories: record.maxStories,
          setback_target: record.setbackTarget,
          review_risk: record.reviewRisk,
          status: record.status,
        })
        .select()
        .single();

      if (error) {
        console.warn("Supabase createLead error, disabling Supabase:", error);
        markSupabaseUnhealthy();
      } else if (data) {
        return {
          ...record,
          id: data.id,
        };
      }
    } catch (e) {
      console.warn("Supabase createLead exception, disabling Supabase:", e);
      markSupabaseUnhealthy();
    }
  }

  const records = await readLocalLeads();
  records.push(record);
  await writeLocalLeads(records);

  return record;
}

export async function getLead(id: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();

      if (error) {
        console.warn("Supabase getLead error, disabling Supabase:", error);
        markSupabaseUnhealthy();
      } else if (data) {
        return {
          id: data.id,
          builderId: String(data.builder_id ?? defaultBuilderId),
          createdAt: data.created_at ?? "",
          updatedAt: data.updated_at ?? "",
          proposalNumber: data.proposal_number ?? "",
          proposalStatus: data.proposal_status ?? "",
          shareToken: data.share_token ?? "",
          customerName: data.customer_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          propertyAddress: data.property_address ?? "",
          parcelScenario: data.parcel_scenario ?? "",
          zoningSource: data.zoning_source ?? "",
          zoningZone: data.zoning_zone ?? "",
          zoningDescription: data.zoning_description ?? "",
          zoningRaw: data.zoning_raw ?? null,
          zoningLookupStatus: data.zoning_lookup_status ?? "",
          zoningCheckedAt: data.zoning_checked_at ?? "",
          aduPermitted: data.adu_permitted ?? null,
          setbackFront: data.setback_front ?? "",
          setbackSide: data.setback_side ?? "",
          setbackRear: data.setback_rear ?? "",
          feasibilityResult: data.feasibility_result ?? "",
          feasibilityConfidence: Number(data.feasibility_confidence ?? 0),
          permitPath: data.permit_path ?? "",
          estimatedPrice: Number(data.estimated_price ?? 0),
          estimateLow: Number(data.estimate_low ?? 0),
          estimateHigh: Number(data.estimate_high ?? 0),
          factoryCost: Number(data.factory_cost ?? 0),
          siteCost: Number(data.site_cost ?? 0),
          currency: data.currency === "USD" ? "USD" : "CAD",
          modelCode: data.model_code ?? "",
          modelName: data.model_name ?? "",
          squareFeet: Number(data.square_feet ?? 0),
          timelineWeeks: Number(data.timeline_weeks ?? 0),
          maxSquareFeet: Number(data.max_square_feet ?? 0),
          maxStories: Number(data.max_stories ?? 0),
          setbackTarget: data.setback_target ?? "",
          reviewRisk: data.review_risk ?? "",
          configuration: data.configuration_json ?? {},
          status: data.status ?? "new",
        } satisfies LeadRecord;
      }
    } catch (e) {
      console.warn("Supabase getLead exception, disabling Supabase:", e);
      markSupabaseUnhealthy();
    }
  }

  const records = await readLocalLeads();
  return records.find((record) => record.id === id) ?? null;
}

export async function getLeadByToken(token: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("share_token", token)
        .single();

      if (error) {
        console.warn("Supabase getLeadByToken error, disabling Supabase:", error);
        markSupabaseUnhealthy();
      } else if (data) {
        return mapLeadRow(data);
      }
    } catch (e) {
      console.warn("Supabase getLeadByToken exception, disabling Supabase:", e);
      markSupabaseUnhealthy();
    }
  }

  const records = await readLocalLeads();
  return records.find((record) => record.shareToken === token) ?? null;
}

export async function listLeads(builderId = "00000000-0000-0000-0000-000000000001") {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("builder_id", builderId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase listLeads error, disabling Supabase:", error);
        markSupabaseUnhealthy();
      } else if (data) {
        return data.map((item) => mapLeadRow(item));
      }
    } catch (e) {
      console.warn("Supabase listLeads exception, disabling Supabase:", e);
      markSupabaseUnhealthy();
    }
  }

  const records = await readLocalLeads();
  return records
    .filter((r) => (r.builderId || defaultBuilderId) === builderId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function mapLeadRow(data: Record<string, unknown>) {
  return {
    id: String(data.id ?? ""),
    builderId: String(data.builder_id ?? defaultBuilderId),
    createdAt: String(data.created_at ?? ""),
    updatedAt: String(data.updated_at ?? ""),
    proposalNumber: String(data.proposal_number ?? ""),
    proposalStatus: String(data.proposal_status ?? ""),
    shareToken: String(data.share_token ?? ""),
    customerName: String(data.customer_name ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    propertyAddress: String(data.property_address ?? ""),
    parcelScenario: String(data.parcel_scenario ?? ""),
    zoningSource: String(data.zoning_source ?? ""),
    zoningZone: String(data.zoning_zone ?? ""),
    zoningDescription: String(data.zoning_description ?? ""),
    zoningRaw: (data.zoning_raw ?? null) as Record<string, unknown> | null,
    zoningLookupStatus: String(data.zoning_lookup_status ?? ""),
    zoningCheckedAt: String(data.zoning_checked_at ?? ""),
    aduPermitted: typeof data.adu_permitted === "boolean" ? data.adu_permitted : null,
    setbackFront: String(data.setback_front ?? ""),
    setbackSide: String(data.setback_side ?? ""),
    setbackRear: String(data.setback_rear ?? ""),
    feasibilityResult: String(data.feasibility_result ?? ""),
    feasibilityConfidence: Number(data.feasibility_confidence ?? 0),
    permitPath: String(data.permit_path ?? ""),
    estimatedPrice: Number(data.estimated_price ?? 0),
    estimateLow: Number(data.estimate_low ?? 0),
    estimateHigh: Number(data.estimate_high ?? 0),
    factoryCost: Number(data.factory_cost ?? 0),
    siteCost: Number(data.site_cost ?? 0),
    currency: data.currency === "USD" ? "USD" : "CAD",
    modelCode: String(data.model_code ?? ""),
    modelName: String(data.model_name ?? ""),
    squareFeet: Number(data.square_feet ?? 0),
    timelineWeeks: Number(data.timeline_weeks ?? 0),
    maxSquareFeet: Number(data.max_square_feet ?? 0),
    maxStories: Number(data.max_stories ?? 0),
    setbackTarget: String(data.setback_target ?? ""),
    reviewRisk: String(data.review_risk ?? ""),
    configuration: (data.configuration_json ?? {}) as Record<string, unknown>,
    status: String(data.status ?? "new"),
  } satisfies LeadRecord;
}

async function readLocalLeads() {
  assertLocalFallbackAllowed();
  try {
    const raw = await readFile(localStorePath, "utf8");
    return (JSON.parse(raw) as Partial<LeadRecord>[]).map(normalizeLocalLead);
  } catch {
    return [];
  }
}

async function writeLocalLeads(records: LeadRecord[]) {
  assertLocalFallbackAllowed();
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(records, null, 2));
}

function normalizeLocalLead(record: Partial<LeadRecord>) {
  return {
    ...record,
    builderId: record.builderId || defaultBuilderId,
    currency: record.currency === "USD" ? "USD" : "CAD",
    zoningSource: record.zoningSource ?? "",
    zoningZone: record.zoningZone ?? "",
    zoningDescription: record.zoningDescription ?? "",
    zoningRaw: record.zoningRaw ?? null,
    zoningLookupStatus: record.zoningLookupStatus ?? "manual",
    zoningCheckedAt: record.zoningCheckedAt ?? "",
    aduPermitted: record.aduPermitted ?? null,
    setbackFront: record.setbackFront ?? "",
    setbackSide: record.setbackSide ?? "",
    setbackRear: record.setbackRear ?? "",
    status: record.status || "new",
  } as LeadRecord;
}
