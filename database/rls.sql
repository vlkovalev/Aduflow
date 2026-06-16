-- ============================================================================
-- ADUflow — security migration: password auth column + Row Level Security
-- ----------------------------------------------------------------------------
-- Run this AFTER database/schema.sql. It is backward compatible: it only ADDS
-- a nullable column and enables RLS policies. No columns are dropped or
-- renamed, so existing rows are preserved.
--
-- IMPORTANT — service-role connections bypass RLS. The application currently
-- connects with the Supabase service-role key, which is exempt from every
-- policy below. These policies are the defense-in-depth layer that protects
-- the data if/when the app moves to the anon key + Supabase Auth, or if the
-- tables are ever queried with a user-scoped JWT. Application-level tenant
-- scoping (builder_id ownership checks in the API routes) remains the primary
-- guard while the service-role key is in use.
-- ============================================================================

-- 1. Password hash for builder login -----------------------------------------
--    Stores a scrypt-derived hash (see lib/auth.ts). Nullable so existing
--    builder rows remain valid; rows without a hash simply cannot log in until
--    a password is set.
ALTER TABLE builders ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Email should be unique per builder for login lookups. Use a partial unique
-- index so legacy NULL emails do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS builders_email_unique
  ON builders (lower(email))
  WHERE email IS NOT NULL;

-- Helpful lookup indexes for tenant-scoped queries.
CREATE INDEX IF NOT EXISTS models_builder_id_idx ON models (builder_id);
CREATE INDEX IF NOT EXISTS options_builder_id_idx ON options (builder_id);
CREATE INDEX IF NOT EXISTS leads_builder_id_idx ON leads (builder_id);
CREATE INDEX IF NOT EXISTS leads_share_token_idx ON leads (share_token);

-- ============================================================================
-- 2. Enable Row Level Security
-- ============================================================================
ALTER TABLE builders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE models               ENABLE ROW LEVEL SECURITY;
ALTER TABLE options              ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_milestones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_packages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Policies
-- ----------------------------------------------------------------------------
-- These policies assume a future Supabase Auth integration where the
-- authenticated builder's id is available via auth.uid(). The service-role key
-- used by the server bypasses all of these, so server-side reads/writes are
-- unaffected. Re-running this script is safe (policies are dropped first).
-- ============================================================================

-- Builders: a builder can read/update only their own row.
DROP POLICY IF EXISTS builders_self_select ON builders;
CREATE POLICY builders_self_select ON builders
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS builders_self_update ON builders;
CREATE POLICY builders_self_update ON builders
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Models: scoped to the owning builder.
DROP POLICY IF EXISTS models_owner_all ON models;
CREATE POLICY models_owner_all ON models
  FOR ALL USING (builder_id = auth.uid()) WITH CHECK (builder_id = auth.uid());

-- Options: scoped to the owning builder.
DROP POLICY IF EXISTS options_owner_all ON options;
CREATE POLICY options_owner_all ON options
  FOR ALL USING (builder_id = auth.uid()) WITH CHECK (builder_id = auth.uid());

-- Leads: the owning builder has full access.
DROP POLICY IF EXISTS leads_owner_all ON leads;
CREATE POLICY leads_owner_all ON leads
  FOR ALL USING (builder_id = auth.uid()) WITH CHECK (builder_id = auth.uid());

-- Child tables (draws / milestones / permit data) inherit ownership through
-- the parent lead's builder_id.
DROP POLICY IF EXISTS draw_milestones_owner_all ON draw_milestones;
CREATE POLICY draw_milestones_owner_all ON draw_milestones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = draw_milestones.lead_id AND l.builder_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = draw_milestones.lead_id AND l.builder_id = auth.uid())
  );

DROP POLICY IF EXISTS project_milestones_owner_all ON project_milestones;
CREATE POLICY project_milestones_owner_all ON project_milestones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = project_milestones.lead_id AND l.builder_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = project_milestones.lead_id AND l.builder_id = auth.uid())
  );

DROP POLICY IF EXISTS permit_packages_owner_all ON permit_packages;
CREATE POLICY permit_packages_owner_all ON permit_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = permit_packages.lead_id AND l.builder_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = permit_packages.lead_id AND l.builder_id = auth.uid())
  );

DROP POLICY IF EXISTS permit_tasks_owner_all ON permit_tasks;
CREATE POLICY permit_tasks_owner_all ON permit_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM permit_packages p
      JOIN leads l ON l.id = p.lead_id
      WHERE p.id = permit_tasks.permit_package_id AND l.builder_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM permit_packages p
      JOIN leads l ON l.id = p.lead_id
      WHERE p.id = permit_tasks.permit_package_id AND l.builder_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS document_requirements_owner_all ON document_requirements;
CREATE POLICY document_requirements_owner_all ON document_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM permit_packages p
      JOIN leads l ON l.id = p.lead_id
      WHERE p.id = document_requirements.permit_package_id AND l.builder_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM permit_packages p
      JOIN leads l ON l.id = p.lead_id
      WHERE p.id = document_requirements.permit_package_id AND l.builder_id = auth.uid()
    )
  );

-- ============================================================================
-- NOTE on public proposal sharing:
-- Shared proposals (/proposals/share/[token]) are read server-side using the
-- service-role key, which bypasses RLS, so no anonymous SELECT policy on leads
-- is required. Do NOT add a blanket public SELECT policy on leads — that would
-- expose every lead. If you later move sharing to the anon key, add a narrow
-- policy that matches only the requested share_token.
-- ============================================================================
