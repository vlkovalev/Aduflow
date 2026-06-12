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
 base_price NUMERIC,
 region TEXT,
 is_active BOOLEAN DEFAULT TRUE,
 sort_order NUMERIC
);

CREATE TABLE options (
 id UUID PRIMARY KEY,
 model_id UUID,
 builder_id UUID,
 option_name TEXT,
 option_value TEXT,
 option_detail TEXT,
 option_category TEXT,
 option_price NUMERIC,
 is_active BOOLEAN DEFAULT TRUE,
 sort_order NUMERIC
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
 zoning_source TEXT,
 zoning_zone TEXT,
 zoning_description TEXT,
 zoning_raw JSONB,
 zoning_lookup_status TEXT,
 zoning_checked_at TIMESTAMPTZ,
 adu_permitted BOOLEAN,
 setback_front TEXT,
 setback_side TEXT,
 setback_rear TEXT,
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
 lender_status TEXT DEFAULT 'not_notified',
 evidence_notes TEXT,
 released_at TEXT
);

CREATE TABLE project_milestones (
 id UUID PRIMARY KEY,
 lead_id UUID,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW(),
 sort_order NUMERIC,
 label TEXT NOT NULL,
 description TEXT,
 target_date TEXT,
 notes TEXT,
 status TEXT DEFAULT 'pending'
);

CREATE TABLE permit_packages (
 id UUID PRIMARY KEY,
 lead_id UUID,
 jurisdiction_name TEXT,
 package_status TEXT DEFAULT 'draft',
 permit_path TEXT,
 hoa_required BOOLEAN DEFAULT FALSE,
 revision_round NUMERIC DEFAULT 0,
 application_number TEXT,
 city_contact TEXT,
 submission_date TEXT,
 approval_date TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permit_tasks (
 id UUID PRIMARY KEY,
 permit_package_id UUID,
 category TEXT,
 task_name TEXT,
 owner_role TEXT,
 status TEXT DEFAULT 'not_started',
 due_stage TEXT,
 notes TEXT,
 sort_order NUMERIC
);

CREATE TABLE document_requirements (
 id UUID PRIMARY KEY,
 permit_package_id UUID,
 document_name TEXT,
 document_type TEXT,
 required_for TEXT,
 status TEXT DEFAULT 'missing',
 owner_role TEXT
);
