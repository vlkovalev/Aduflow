-- Adds currency support so US-market builders and US properties are priced
-- in USD instead of always being formatted as CAD. Previously formatCurrency
-- was hardcoded to en-CA/CAD in two places (lib/proposalBuilder.ts and a
-- duplicate in app/configurator/page.tsx), so a Portland OR quote displayed
-- "$232,000" with no indication it was actually CAD.
--
-- Model: builders.currency is the builder's account-level default. leads.currency
-- records whichever currency was actually used for that quote (builder default,
-- unless the property's zoning jurisdiction resolves to the other country, in
-- which case the address wins for that one lead).
--
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / guarded DO block).
-- Run after builder-credentials.sql.

ALTER TABLE builders ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builders_currency_check'
  ) THEN
    ALTER TABLE builders ADD CONSTRAINT builders_currency_check CHECK (currency IN ('CAD', 'USD'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_currency_check'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_currency_check CHECK (currency IN ('CAD', 'USD'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
