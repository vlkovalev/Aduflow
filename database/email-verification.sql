-- ============================================================================
-- ADUflow — builder email verification
-- ----------------------------------------------------------------------------
-- Run this AFTER database/rls.sql. Additive only: existing builder rows are
-- marked verified so current pilot accounts are not locked out.
-- ============================================================================

ALTER TABLE builders ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

UPDATE builders
SET email_verified = TRUE,
    email_verified_at = COALESCE(email_verified_at, NOW())
WHERE email_verified IS DISTINCT FROM TRUE
  AND password_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS builders_email_verified_idx
  ON builders (email_verified);
