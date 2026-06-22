-- ============================================================================
-- ADUflow — Stripe billing columns
-- ----------------------------------------------------------------------------
-- Run this AFTER database/schema.sql and database/rls.sql. Additive only: it
-- only adds nullable/defaulted columns, so existing builder rows are
-- preserved and remain able to log in and use the app.
--
-- subscription_status defaults to 'trialing' so existing/new builders are not
-- locked out the moment this migration runs — gating on this column (if and
-- when you wire it into a route) only takes effect once a builder's status
-- moves to something other than 'trialing' / 'active' (e.g. 'past_due',
-- 'canceled', 'unpaid').
-- ============================================================================

ALTER TABLE builders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE builders ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS builders_stripe_customer_id_unique
  ON builders (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
