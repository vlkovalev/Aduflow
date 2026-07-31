-- Adds builder-controlled lead guardrails (docs/builder-activation-plan.md #4):
-- a minimum project budget and a list of excluded service-area municipalities
-- the builder can set, plus the resulting per-lead review flag. This lets a
-- builder say "I need to control minimum budget, service radius, exclusions,
-- and manual-review triggers before this goes to homeowners" without any lead
-- being blocked from the homeowner's side — it only flags the lead for the
-- builder's own review queue.
--
-- v1 scope note: minProjectBudget and excludedMunicipalities are the two
-- guardrails shipped now. Service *radius* (geo-distance) and margin/
-- contingency rules are deferred — radius needs persisted lat/long on the
-- lead (not currently stored) and margin/contingency changes core pricing
-- math in lib/pricingEngine.ts, which needs its own design pass rather than
-- being bundled into this migration. Site-condition allowances are already
-- possible today via the existing "site" catalog option group.
--
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS).
-- Run after builder-credentials.sql.

ALTER TABLE builders ADD COLUMN IF NOT EXISTS min_project_budget NUMERIC;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS excluded_municipalities TEXT;

-- needs_review is informational only — it is set by the server when a lead is
-- created and never written by LeadStatusSelect / the builder's status
-- dropdown. It must stay independent of `status`/`proposal_status`, which
-- drive metered qualified-proposal billing (see app/api/leads/[id]/route.ts) —
-- a guardrail flag must never itself trigger or block a billing event.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS review_reasons TEXT;

NOTIFY pgrst, 'reload schema';
