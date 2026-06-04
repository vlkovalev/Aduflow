import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";

export type LeadRecord = {
  id: string;
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
  feasibilityResult: string;
  feasibilityConfidence: number;
  permitPath: string;
  estimatedPrice: number;
  estimateLow: number;
  estimateHigh: number;
  factoryCost: number;
  siteCost: number;
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

const localStorePath = path.join(process.cwd(), ".data", "leads.json");

export async function createLead(input: CreateLeadInput) {
  const createdAt = new Date().toISOString();
  const record: LeadRecord = {
    ...input,
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
    const { data, error } = await supabase
      .from("leads")
      .insert({
        id: record.id,
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
        feasibility_result: record.feasibilityResult,
        feasibility_confidence: record.feasibilityConfidence,
        permit_path: record.permitPath,
        configuration_json: record.configuration,
        estimated_price: record.estimatedPrice,
        estimate_low: record.estimateLow,
        estimate_high: record.estimateHigh,
        factory_cost: record.factoryCost,
        site_cost: record.siteCost,
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
      throw new Error(error.message);
    }

    return {
      ...record,
      id: data.id,
    };
  }

  const records = await readLocalLeads();
  records.push(record);
  await writeLocalLeads(records);

  return record;
}

export async function getLead(id: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
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
      feasibilityResult: data.feasibility_result ?? "",
      feasibilityConfidence: Number(data.feasibility_confidence ?? 0),
      permitPath: data.permit_path ?? "",
      estimatedPrice: Number(data.estimated_price ?? 0),
      estimateLow: Number(data.estimate_low ?? 0),
      estimateHigh: Number(data.estimate_high ?? 0),
      factoryCost: Number(data.factory_cost ?? 0),
      siteCost: Number(data.site_cost ?? 0),
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

  const records = await readLocalLeads();
  return records.find((record) => record.id === id) ?? null;
}

export async function getLeadByToken(token: string) {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("share_token", token)
      .single();

    if (error || !data) {
      return null;
    }

    return mapLeadRow(data);
  }

  const records = await readLocalLeads();
  return records.find((record) => record.shareToken === token) ?? null;
}

export async function listLeads() {
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((item) => mapLeadRow(item));
  }

  const records = await readLocalLeads();
  return records.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function mapLeadRow(data: Record<string, unknown>) {
  return {
    id: String(data.id ?? ""),
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
    feasibilityResult: String(data.feasibility_result ?? ""),
    feasibilityConfidence: Number(data.feasibility_confidence ?? 0),
    permitPath: String(data.permit_path ?? ""),
    estimatedPrice: Number(data.estimated_price ?? 0),
    estimateLow: Number(data.estimate_low ?? 0),
    estimateHigh: Number(data.estimate_high ?? 0),
    factoryCost: Number(data.factory_cost ?? 0),
    siteCost: Number(data.site_cost ?? 0),
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
  try {
    const raw = await readFile(localStorePath, "utf8");
    return JSON.parse(raw) as LeadRecord[];
  } catch {
    return [];
  }
}

async function writeLocalLeads(records: LeadRecord[]) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(records, null, 2));
}
