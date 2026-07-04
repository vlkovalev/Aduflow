import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseServiceClient, markSupabaseUnhealthy } from "./supabase";
import { getLocalStorePath } from "./localStoreHelper";

/**
 * Usage metering for the "qualified proposal" billing unit — see
 * docs/pricing-strategy.md and database/billing-usage.sql.
 *
 * Deliberately NOT metered on raw lead creation. A lead only counts once a
 * builder has reviewed it and marked it "qualified" — the fix for the
 * traditional lead marketplace pattern of billing contractors for low-quality or
 * duplicate contacts they never controlled.
 */

export type UsageEvent = {
  id: string;
  builderId: string;
  leadId: string;
  periodKey: string;
  createdAt: string;
};

const localStorePath = getLocalStorePath("usage-events.json");

export function currentPeriodKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Record that a lead was marked "qualified". Idempotent per lead id: a given
 * lead can only ever be counted once, even if its status is toggled back and
 * forth between "qualified" and something else.
 *
 * Returns true only if this call newly recorded the usage (so the caller
 * knows whether to also report it to Stripe); returns false if it was
 * already recorded previously.
 */
export async function recordQualifiedProposalUsage(builderId: string, leadId: string): Promise<boolean> {
  const periodKey = currentPeriodKey();
  const supabase = getSupabaseServiceClient();

  if (supabase) {
    try {
      const { error } = await supabase
        .from("qualified_proposal_usage")
        .insert({ id: randomUUID(), builder_id: builderId, lead_id: leadId, period_key: periodKey });

      if (!error) return true;
      // Postgres unique_violation — this lead was already recorded, not a real error.
      if (error.code === "23505") return false;

      console.warn("Supabase recordQualifiedProposalUsage error, disabling Supabase:", error);
      markSupabaseUnhealthy();
    } catch (e) {
      console.warn("Supabase recordQualifiedProposalUsage exception, disabling Supabase:", e);
      markSupabaseUnhealthy();
    }
  }

  const events = await readLocalEvents();
  if (events.some((e) => e.leadId === leadId)) return false;
  events.push({ id: randomUUID(), builderId, leadId, periodKey, createdAt: new Date().toISOString() });
  await writeLocalEvents(events);
  return true;
}

/** Count of qualified proposals recorded for a builder in a billing period (default: current month). */
export async function getQualifiedProposalUsage(
  builderId: string,
  periodKey: string = currentPeriodKey(),
): Promise<number> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { count, error } = await supabase
        .from("qualified_proposal_usage")
        .select("id", { count: "exact", head: true })
        .eq("builder_id", builderId)
        .eq("period_key", periodKey);
      if (!error && typeof count === "number") return count;
    } catch {
      // Fall through to local fallback.
    }
  }

  const events = await readLocalEvents();
  return events.filter((e) => e.builderId === builderId && e.periodKey === periodKey).length;
}

async function readLocalEvents(): Promise<UsageEvent[]> {
  try {
    const raw = await readFile(localStorePath, "utf8");
    return JSON.parse(raw) as UsageEvent[];
  } catch {
    return [];
  }
}

async function writeLocalEvents(events: UsageEvent[]): Promise<void> {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, JSON.stringify(events, null, 2));
}
