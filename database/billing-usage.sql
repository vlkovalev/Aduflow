-- ============================================================================
-- ADUflow — Plan selection + qualified-proposal usage metering
-- ----------------------------------------------------------------------------
-- Run this AFTER database/billing.sql. Additive only: nullable/defaulted
-- columns and a new table, so existing builder rows are untouched.
--
-- plan_id defaults to 'pilot' so every existing and new builder stays on the
-- free pilot plan (see lib/billingPlans.ts) until they explicitly subscribe
-- to "starter" or "growth" via Stripe Checkout.
--
-- qualified_proposal_usage records ONE row per lead, the first time a
-- builder marks that lead "qualified" (see app/api/leads/[id]/route.ts and
-- docs/pricing-strategy.md). The UNIQUE constraint on lead_id makes this
-- idempotent: toggling a lead's status back and forth never double-bills a
-- builder for the same proposal, and it is the deliberate metering unit
-- instead of raw inbound form submissions.
-- ============================================================================

ALTER TABLE builders ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'pilot';

CREATE TABLE IF NOT EXISTS qualified_proposal_usage (
  id UUID PRIMARY KEY,
  builder_id UUID NOT NULL,
  lead_id UUID NOT NULL UNIQUE,
  period_key TEXT NOT NULL, -- billing month this usage counts toward, e.g. '2026-06'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qualified_proposal_usage_builder_period_idx
  ON qualified_proposal_usage (builder_id, period_key);
