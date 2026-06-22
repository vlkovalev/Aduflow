import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import { getLocalStorePath } from "./localStoreHelper";
import { hashPassword, verifyPassword } from "./auth";

export type BuilderCredentials = {
  companyName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  insuranceCarrier: string;
  insuranceLimit: number;
  insuranceExpiration: string;
  bondProvider: string;
  bondAmount: number;
  warrantyInfo: string;
  serviceRegion: string;
};

export type BuilderProfile = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
};

export type BuilderBillingInfo = {
  stripeCustomerId: string | null;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  currentPeriodEnd: string | null;
  /** Pricing-tier id from lib/billingPlans.ts — "pilot" until a builder subscribes. */
  planId: string;
};

const BLANK_BILLING: BuilderBillingInfo = {
  stripeCustomerId: null,
  subscriptionStatus: "trialing",
  subscriptionPlan: null,
  currentPeriodEnd: null,
  planId: "pilot",
};

/**
 * Blank credential template. New builders start with EMPTY regulated fields
 * (license, insurance, bond, warranty) so they can never unknowingly persist
 * another company's data (audit findings BUG-02 / BUG-03 — cross-tenant bleed).
 */
const BLANK_CREDENTIALS: BuilderCredentials = {
  companyName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  insuranceCarrier: "",
  insuranceLimit: 0,
  insuranceExpiration: "",
  bondProvider: "",
  bondAmount: 0,
  warrantyInfo: "",
  serviceRegion: "",
};

function credentialsFilePath(builderId: string) {
  return getLocalStorePath(`builder-${builderId}.json`);
}

// ── Local password registry (sandbox / no-Supabase mode) ────────────────────

type LocalBuilderAccount = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  passwordHash: string;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string;
  subscriptionPlan?: string | null;
  currentPeriodEnd?: string | null;
  planId?: string | null;
};

const accountsPath = getLocalStorePath("builder-accounts.json");

async function readLocalAccounts(): Promise<LocalBuilderAccount[]> {
  try {
    const raw = await readFile(accountsPath, "utf8");
    return JSON.parse(raw) as LocalBuilderAccount[];
  } catch {
    return [];
  }
}

async function writeLocalAccounts(accounts: LocalBuilderAccount[]) {
  await mkdir(path.dirname(accountsPath), { recursive: true });
  await writeFile(accountsPath, JSON.stringify(accounts, null, 2));
}

// ── Credential read/write (per-tenant, no shared defaults) ──────────────────

export async function getBuilderCredentials(builderId: string): Promise<BuilderCredentials> {
  let localData: Partial<BuilderCredentials> | null = null;
  try {
    const raw = await readFile(credentialsFilePath(builderId), "utf8");
    localData = JSON.parse(raw) as Partial<BuilderCredentials>;
  } catch {
    // No per-builder credentials file yet — start from blank, not a seed record.
  }

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("company_name, email, phone")
        .eq("id", builderId)
        .maybeSingle();

      if (!error && data) {
        return {
          ...BLANK_CREDENTIALS,
          ...localData,
          companyName: localData?.companyName || data.company_name || "",
          email: localData?.email || data.email || "",
          phone: localData?.phone || data.phone || "",
        };
      }
    } catch {
      // Fall through to local data.
    }
  }

  return { ...BLANK_CREDENTIALS, ...localData };
}

export async function updateBuilderCredentials(
  input: Partial<BuilderCredentials>,
  builderId: string,
): Promise<BuilderCredentials> {
  const current = await getBuilderCredentials(builderId);
  const updated: BuilderCredentials = { ...current, ...input };

  const storePath = credentialsFilePath(builderId);
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(updated, null, 2));

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("builders")
        .select("id")
        .eq("id", builderId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("builders")
          .update({
            company_name: updated.companyName,
            email: updated.email,
            phone: updated.phone,
          })
          .eq("id", builderId);
      }
    } catch {
      // Ignore sync failures; local store remains the source of truth.
    }
  }

  return updated;
}

// ── Existence / lookup ──────────────────────────────────────────────────────

export async function builderExists(builderId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("id")
        .eq("id", builderId)
        .maybeSingle();
      if (!error) return Boolean(data);
    } catch {
      // Fall through to local.
    }
  }
  const accounts = await readLocalAccounts();
  return accounts.some((a) => a.id === builderId);
}

export async function getBuilderById(builderId: string): Promise<BuilderProfile | null> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("id, company_name, email, phone")
        .eq("id", builderId)
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          companyName: data.company_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        };
      }
    } catch {
      // Fall through.
    }
  }
  const accounts = await readLocalAccounts();
  const found = accounts.find((a) => a.id === builderId);
  return found
    ? { id: found.id, companyName: found.companyName, email: found.email, phone: found.phone }
    : null;
}

export async function listBuilders(): Promise<BuilderProfile[]> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("builders").select("id, company_name, email, phone");
      if (!error && data) {
        return data.map((b) => ({
          id: b.id,
          companyName: b.company_name ?? "",
          email: b.email ?? "",
          phone: b.phone ?? "",
        }));
      }
    } catch {
      // Fall through.
    }
  }
  const accounts = await readLocalAccounts();
  return accounts.map((a) => ({ id: a.id, companyName: a.companyName, email: a.email, phone: a.phone }));
}

// ── Registration & login ────────────────────────────────────────────────────

export class AuthError extends Error {}

export async function registerBuilder(params: {
  companyName: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<BuilderProfile> {
  const email = params.email.trim().toLowerCase();
  const passwordHash = hashPassword(params.password);
  const id = randomUUID();

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("builders")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existing) {
        throw new AuthError("An account with that email already exists.");
      }
      const { error } = await supabase.from("builders").insert({
        id,
        company_name: params.companyName,
        email,
        phone: params.phone || null,
        password_hash: passwordHash,
      });
      if (error) {
        // If the password_hash column is missing, surface a clear message.
        throw new AuthError(
          "Unable to create account in database. Ensure the builders.password_hash column exists (see database/rls.sql).",
        );
      }
      return { id, companyName: params.companyName, email, phone: params.phone || "" };
    } catch (e) {
      if (e instanceof AuthError) throw e;
      // Fall through to local storage on transient DB errors.
    }
  }

  const accounts = await readLocalAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    throw new AuthError("An account with that email already exists.");
  }
  accounts.push({ id, companyName: params.companyName, email, phone: params.phone || "", passwordHash });
  await writeLocalAccounts(accounts);

  // Seed an empty per-tenant credentials file pre-filled only with public profile.
  const storePath = credentialsFilePath(id);
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(
    storePath,
    JSON.stringify(
      { ...BLANK_CREDENTIALS, companyName: params.companyName, email, phone: params.phone || "" },
      null,
      2,
    ),
  );

  return { id, companyName: params.companyName, email, phone: params.phone || "" };
}

export async function verifyBuilderLogin(emailRaw: string, password: string): Promise<BuilderProfile | null> {
  const email = emailRaw.trim().toLowerCase();

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("id, company_name, email, phone, password_hash")
        .eq("email", email)
        .maybeSingle();
      if (!error && data) {
        if (verifyPassword(password, data.password_hash)) {
          return {
            id: data.id,
            companyName: data.company_name ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
          };
        }
        return null;
      }
    } catch {
      // Fall through to local accounts.
    }
  }

  const accounts = await readLocalAccounts();
  const account = accounts.find((a) => a.email.toLowerCase() === email);
  if (account && verifyPassword(password, account.passwordHash)) {
    return { id: account.id, companyName: account.companyName, email: account.email, phone: account.phone };
  }
  return null;
}

// ── Password reset ───────────────────────────────────────────────────────────

/** Looked up by email for the forgot-password flow. Returns the password hash for token fingerprinting. */
export async function getBuilderAuthByEmail(
  emailRaw: string,
): Promise<{ id: string; email: string; passwordHash: string } | null> {
  const email = emailRaw.trim().toLowerCase();

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("id, email, password_hash")
        .eq("email", email)
        .maybeSingle();
      if (!error && data && data.password_hash) {
        return { id: data.id, email: data.email ?? email, passwordHash: data.password_hash };
      }
      if (!error) return null;
    } catch {
      // Fall through to local accounts.
    }
  }

  const accounts = await readLocalAccounts();
  const account = accounts.find((a) => a.email.toLowerCase() === email);
  return account ? { id: account.id, email: account.email, passwordHash: account.passwordHash } : null;
}

export async function getBuilderPasswordHashById(builderId: string): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("password_hash")
        .eq("id", builderId)
        .maybeSingle();
      if (!error && data) return data.password_hash ?? null;
      if (!error) return null;
    } catch {
      // Fall through to local accounts.
    }
  }

  const accounts = await readLocalAccounts();
  const account = accounts.find((a) => a.id === builderId);
  return account?.passwordHash ?? null;
}

export async function updateBuilderPassword(builderId: string, newPasswordHash: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("builders")
        .update({ password_hash: newPasswordHash })
        .eq("id", builderId);
      if (!error) return;
    } catch {
      // Fall through to local accounts.
    }
  }

  const accounts = await readLocalAccounts();
  const index = accounts.findIndex((a) => a.id === builderId);
  if (index !== -1) {
    accounts[index].passwordHash = newPasswordHash;
    await writeLocalAccounts(accounts);
  }
}

// ── Billing (Stripe) ─────────────────────────────────────────────────────────

export async function getBuilderBillingInfo(builderId: string): Promise<BuilderBillingInfo> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("stripe_customer_id, subscription_status, subscription_plan, current_period_end, plan_id")
        .eq("id", builderId)
        .maybeSingle();
      if (!error && data) {
        return {
          stripeCustomerId: data.stripe_customer_id ?? null,
          subscriptionStatus: data.subscription_status ?? "trialing",
          subscriptionPlan: data.subscription_plan ?? null,
          currentPeriodEnd: data.current_period_end ?? null,
          planId: data.plan_id ?? "pilot",
        };
      }
    } catch {
      // Fall through to local accounts.
    }
  }

  const accounts = await readLocalAccounts();
  const account = accounts.find((a) => a.id === builderId);
  if (!account) return BLANK_BILLING;
  return {
    stripeCustomerId: account.stripeCustomerId ?? null,
    subscriptionStatus: account.subscriptionStatus ?? "trialing",
    subscriptionPlan: account.subscriptionPlan ?? null,
    currentPeriodEnd: account.currentPeriodEnd ?? null,
    planId: account.planId ?? "pilot",
  };
}

/** Persist the Stripe customer id the first time a builder starts checkout. */
export async function setBuilderStripeCustomerId(builderId: string, stripeCustomerId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("builders")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", builderId);
      if (!error) return;
    } catch {
      // Fall through to local accounts.
    }
  }

  const accounts = await readLocalAccounts();
  const index = accounts.findIndex((a) => a.id === builderId);
  if (index !== -1) {
    accounts[index].stripeCustomerId = stripeCustomerId;
    await writeLocalAccounts(accounts);
  }
}

/**
 * Update subscription state from a Stripe webhook event. Looked up by Stripe
 * customer id (the webhook payload has no ADUflow builder id).
 */
export async function updateBuilderSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
  updates: {
    subscriptionStatus: string;
    subscriptionPlan?: string | null;
    currentPeriodEnd?: string | null;
    /** lib/billingPlans.ts plan id, when resolvable from the Stripe event. */
    planId?: string | null;
  },
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const updatePayload: Record<string, unknown> = {
        subscription_status: updates.subscriptionStatus,
        subscription_plan: updates.subscriptionPlan ?? null,
        current_period_end: updates.currentPeriodEnd ?? null,
      };
      if (updates.planId) updatePayload.plan_id = updates.planId;

      const { error } = await supabase
        .from("builders")
        .update(updatePayload)
        .eq("stripe_customer_id", stripeCustomerId);
      if (!error) return;
    } catch {
      // Fall through to local accounts.
    }
  }

  const accounts = await readLocalAccounts();
  const index = accounts.findIndex((a) => a.stripeCustomerId === stripeCustomerId);
  if (index !== -1) {
    accounts[index].subscriptionStatus = updates.subscriptionStatus;
    accounts[index].subscriptionPlan = updates.subscriptionPlan ?? null;
    accounts[index].currentPeriodEnd = updates.currentPeriodEnd ?? null;
    if (updates.planId) accounts[index].planId = updates.planId;
    await writeLocalAccounts(accounts);
  }
}
