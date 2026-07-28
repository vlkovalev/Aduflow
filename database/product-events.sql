-- Anonymous product funnel events. Do not store names, emails, addresses, raw IPs, or user agents.
CREATE TABLE IF NOT EXISTS product_events (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_name TEXT NOT NULL,
  path TEXT NOT NULL,
  session_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_product_events_created_at ON product_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_events_event_name ON product_events(event_name);
CREATE INDEX IF NOT EXISTS idx_product_events_session_id ON product_events(session_id);
