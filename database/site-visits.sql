-- First-party page visit tracking for outreach landing pages.
-- Stores no raw IP address; app/api/site-visits hashes IP + user-agent with APP_SECRET.

CREATE TABLE IF NOT EXISTS site_visits (
 id UUID PRIMARY KEY,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 path TEXT NOT NULL,
 page_title TEXT,
 referrer TEXT,
 session_id TEXT,
 visitor_hash TEXT,
 user_agent TEXT,
 utm_source TEXT,
 utm_medium TEXT,
 utm_campaign TEXT,
 utm_term TEXT,
 utm_content TEXT
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON site_visits(path);
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_hash ON site_visits(visitor_hash);

NOTIFY pgrst, 'reload schema';
