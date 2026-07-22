-- Adds durable storage for builder credential fields (license, insurance,
-- bonding, warranty program, service regions). These previously lived only in
-- an ephemeral local JSON file (lib/builderStore.ts), which does not survive
-- across serverless function invocations on Netlify — data was silently lost
-- after every save. See docs/qa-findings-2026-07-21.md, bug #1.
--
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / IF EXISTS).
-- Run after rls.sql and email-verification.sql.

ALTER TABLE builders ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS insurance_carrier TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS insurance_limit NUMERIC;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS insurance_expiration DATE;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS bond_provider TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS bond_amount NUMERIC;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS warranty_info TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS service_region TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD';

-- Force PostgREST to pick up the new columns immediately instead of waiting
-- for its schema cache to refresh on its own (same step used for the earlier
-- email-verification migration).
NOTIFY pgrst, 'reload schema';
