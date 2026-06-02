CREATE TABLE builders (
 id UUID PRIMARY KEY,
 company_name TEXT NOT NULL,
 email TEXT,
 phone TEXT
);

CREATE TABLE models (
 id UUID PRIMARY KEY,
 builder_id UUID,
 model_name TEXT,
 model_code TEXT,
 square_feet NUMERIC,
 base_price NUMERIC
);

CREATE TABLE options (
 id UUID PRIMARY KEY,
 model_id UUID,
 option_name TEXT,
 option_category TEXT,
 option_price NUMERIC
);

CREATE TABLE leads (
 id UUID PRIMARY KEY,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW(),
 builder_id UUID,
 proposal_number TEXT,
 proposal_status TEXT DEFAULT 'draft',
 share_token TEXT,
 customer_name TEXT,
 email TEXT,
 phone TEXT,
 property_address TEXT,
 parcel_scenario TEXT,
 feasibility_result TEXT,
 feasibility_confidence NUMERIC,
 permit_path TEXT,
 configuration_json JSONB,
 estimated_price NUMERIC,
 estimate_low NUMERIC,
 estimate_high NUMERIC,
 factory_cost NUMERIC,
 site_cost NUMERIC,
 model_code TEXT,
 model_name TEXT,
 square_feet NUMERIC,
 timeline_weeks NUMERIC,
 max_square_feet NUMERIC,
 max_stories NUMERIC,
 setback_target TEXT,
 review_risk TEXT,
 status TEXT DEFAULT 'new'
);

CREATE TABLE draw_milestones (
 id UUID PRIMARY KEY,
 lead_id UUID,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 sort_order NUMERIC,
 stage_name TEXT NOT NULL,
 percent NUMERIC NOT NULL,
 evidence_status TEXT DEFAULT 'not_started',
 lender_status TEXT DEFAULT 'not_notified'
);
