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
 builder_id UUID,
 customer_name TEXT,
 email TEXT,
 phone TEXT,
 configuration_json JSONB,
 estimated_price NUMERIC,
 status TEXT DEFAULT 'new'
);
