/*
# AI Business Adoption & Opportunity Audit — Core Schema

1. Purpose
   Persist audits, email leads, implementation-intent leads, analytics events,
   and extensible configuration data (industries, capabilities, adoption stats,
   recommendations) for the AI Adoption & Opportunity Audit product.

2. New Tables
   - `audits`: one row per website audit. Holds detected technologies,
     capabilities, scores, business classification, and the full report JSON.
     No auth required (public tool), so no user_id.
   - `leads`: email-capture + implementation-intent leads tied to an audit.
     Phone collected only when intent = 'implementation_requested'.
   - `analytics_events`: basic product analytics (audit_started, audit_completed,
     email_submitted, full_report_viewed, recommendation_clicked,
     implementation_request_submitted).
   - `industries`: extensible industry registry (dental, hvac, real_estate, ...).
   - `capabilities`: extensible capability registry (15 initial categories).
   - `technology_fingerprints`: Wappalyzer-style detection fingerprints
     mapped to capabilities. Drives deterministic detection.
   - `industry_capabilities`: per-industry weighting/relevance of each
     capability (drives opportunity scoring + recommendations).
   - `adoption_stats`: estimated detectable adoption % per industry+capability.
     Clearly labeled "among analyzed websites". Nullable when no data exists.
   - `recommendations`: configurable tool/service recommendations per industry.

3. Security
   - RLS enabled on every table.
   - Public tables (audits, leads, analytics_events, and config tables) use
     `TO anon, authenticated` because this is a no-auth public tool.
   - Admin-only writes (config tables) are still readable by anon for report
     rendering; writes are anon-allowed to keep the tool functional without
     auth. A future admin auth layer can tighten writes.

4. Important Notes
   - All JSON columns use `jsonb` for indexing flexibility.
   - `audits.report` stores the full structured report for instant rendering.
   - `audits.status` tracks the async job lifecycle.
   - Adoption stats are nullable by design: never fabricate numbers.
*/

-- ===== audits =====
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  normalized_url text NOT NULL,
  business_name text,
  industry text,
  business_type text,
  location text,
  services jsonb DEFAULT '[]'::jsonb,
  technologies jsonb DEFAULT '[]'::jsonb,
  capabilities jsonb DEFAULT '[]'::jsonb,
  signals jsonb DEFAULT '[]'::jsonb,
  opportunities jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  adoption_score int NOT NULL DEFAULT 0,
  opportunity_score int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error text,
  report jsonb DEFAULT '{}'::jsonb,
  email_unlocked boolean NOT NULL DEFAULT false,
  lead_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audits" ON audits;
CREATE POLICY "anon_select_audits" ON audits FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audits" ON audits;
CREATE POLICY "anon_insert_audits" ON audits FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audits" ON audits;
CREATE POLICY "anon_update_audits" ON audits FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audits_normalized_url ON audits (normalized_url);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits (status);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits (created_at DESC);

-- ===== leads =====
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE,
  email text NOT NULL,
  business_name text,
  website text,
  industry text,
  location text,
  phone text,
  requested_service text,
  budget text,
  timeline text,
  intent text NOT NULL DEFAULT 'report_only',
  adoption_score int,
  opportunity_score int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leads" ON leads;
CREATE POLICY "anon_select_leads" ON leads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leads" ON leads;
CREATE POLICY "anon_update_leads" ON leads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_audit_id ON leads (audit_id);
CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads (intent);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- ===== analytics_events =====
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE,
  event text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON analytics_events;
CREATE POLICY "anon_select_events" ON analytics_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON analytics_events;
CREATE POLICY "anon_insert_events" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_events_event ON analytics_events (event);
CREATE INDEX IF NOT EXISTS idx_events_audit_id ON analytics_events (audit_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events (created_at DESC);

-- ===== industries =====
CREATE TABLE IF NOT EXISTS industries (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_industries" ON industries;
CREATE POLICY "anon_select_industries" ON industries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_industries" ON industries;
CREATE POLICY "anon_insert_industries" ON industries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_industries" ON industries;
CREATE POLICY "anon_update_industries" ON industries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== capabilities =====
CREATE TABLE IF NOT EXISTS capabilities (
  id text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_capabilities" ON capabilities;
CREATE POLICY "anon_select_capabilities" ON capabilities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_capabilities" ON capabilities;
CREATE POLICY "anon_insert_capabilities" ON capabilities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_capabilities" ON capabilities;
CREATE POLICY "anon_update_capabilities" ON capabilities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== technology_fingerprints =====
CREATE TABLE IF NOT EXISTS technology_fingerprints (
  id text PRIMARY KEY,
  label text NOT NULL,
  category text,
  capability_id text REFERENCES capabilities(id),
  confidence text NOT NULL DEFAULT 'high',
  dom text,
  js text,
  meta text,
  headers text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE technology_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_fingerprints" ON technology_fingerprints;
CREATE POLICY "anon_select_fingerprints" ON technology_fingerprints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fingerprints" ON technology_fingerprints;
CREATE POLICY "anon_insert_fingerprints" ON technology_fingerprints FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fingerprints" ON technology_fingerprints;
CREATE POLICY "anon_update_fingerprints" ON technology_fingerprints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== industry_capabilities =====
CREATE TABLE IF NOT EXISTS industry_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id text REFERENCES industries(id) ON DELETE CASCADE,
  capability_id text REFERENCES capabilities(id) ON DELETE CASCADE,
  weight int NOT NULL DEFAULT 10,
  relevance text NOT NULL DEFAULT 'medium',
  impact text NOT NULL DEFAULT 'medium',
  why_it_matters text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (industry_id, capability_id)
);

ALTER TABLE industry_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_industry_caps" ON industry_capabilities;
CREATE POLICY "anon_select_industry_caps" ON industry_capabilities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_industry_caps" ON industry_capabilities;
CREATE POLICY "anon_insert_industry_caps" ON industry_capabilities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_industry_caps" ON industry_capabilities;
CREATE POLICY "anon_update_industry_caps" ON industry_capabilities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== adoption_stats =====
CREATE TABLE IF NOT EXISTS adoption_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id text REFERENCES industries(id) ON DELETE CASCADE,
  capability_id text REFERENCES capabilities(id) ON DELETE CASCADE,
  adoption_pct numeric,
  sample_size int,
  trend text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (industry_id, capability_id)
);

ALTER TABLE adoption_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_adoption" ON adoption_stats;
CREATE POLICY "anon_select_adoption" ON adoption_stats FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_adoption" ON adoption_stats;
CREATE POLICY "anon_insert_adoption" ON adoption_stats FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_adoption" ON adoption_stats;
CREATE POLICY "anon_update_adoption" ON adoption_stats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== recommendations =====
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id text REFERENCES industries(id) ON DELETE CASCADE,
  capability_id text REFERENCES capabilities(id),
  name text NOT NULL,
  category text,
  why_it_fits text,
  best_for text,
  priority int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_recs" ON recommendations;
CREATE POLICY "anon_select_recs" ON recommendations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_recs" ON recommendations;
CREATE POLICY "anon_insert_recs" ON recommendations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_recs" ON recommendations;
CREATE POLICY "anon_update_recs" ON recommendations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
