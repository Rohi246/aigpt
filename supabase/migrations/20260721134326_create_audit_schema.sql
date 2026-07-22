/*
# AI Adoption & Opportunity Audit — Core Schema

1. Overview
   This migration creates the complete schema for the AI Adoption & Opportunity Audit SaaS tool.
   It is a single-tenant (no-auth) public tool: anonymous visitors submit a URL, get a teaser,
   then enter email to unlock the full report. Admin endpoints are protected by a bearer token
   (not Supabase Auth), so all RLS policies use `TO anon, authenticated` with `USING (true)`.

2. New Tables
   - `industries` — industry categories (dental, legal, restaurant, etc.)
   - `capabilities` — business capabilities (website_chat, online_booking, crm, etc.)
   - `technology_fingerprints` — detection signatures for tools (dom/js/meta substrings)
   - `industry_capabilities` — which capabilities matter per industry + weight
   - `adoption_stats` — industry adoption percentages per capability
   - `recommendations` — industry-specific recommendation templates
   - `audits` — one row per website audit, stores full report JSON
   - `leads` — email capture + implementation-intent leads
   - `analytics_events` — product analytics events

3. Security
   - RLS enabled on ALL tables.
   - All policies use `TO anon, authenticated` with `USING (true)` because this is a public,
     no-sign-in tool. Data is intentionally shared/public.

4. Important Notes
   - The `audits.report` column stores the full JSON report.
   - `audits.status` tracks: pending, scanning, scoring, complete, error.
   - `leads.high_intent` flags leads that requested implementation help.
*/

-- ============ INDUSTRIES ============
CREATE TABLE IF NOT EXISTS industries (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_industries" ON industries;
CREATE POLICY "anon_read_industries" ON industries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_industries" ON industries;
CREATE POLICY "anon_write_industries" ON industries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_industries" ON industries;
CREATE POLICY "anon_update_industries" ON industries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_industries" ON industries;
CREATE POLICY "anon_delete_industries" ON industries FOR DELETE TO anon, authenticated USING (true);

-- ============ CAPABILITIES ============
CREATE TABLE IF NOT EXISTS capabilities (
  id text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_capabilities" ON capabilities;
CREATE POLICY "anon_read_capabilities" ON capabilities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_capabilities" ON capabilities;
CREATE POLICY "anon_write_capabilities" ON capabilities FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_capabilities" ON capabilities;
CREATE POLICY "anon_update_capabilities" ON capabilities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_capabilities" ON capabilities;
CREATE POLICY "anon_delete_capabilities" ON capabilities FOR DELETE TO anon, authenticated USING (true);

-- ============ TECHNOLOGY FINGERPRINTS ============
CREATE TABLE IF NOT EXISTS technology_fingerprints (
  id text PRIMARY KEY,
  label text NOT NULL,
  category text,
  capability_id text REFERENCES capabilities(id) ON DELETE SET NULL,
  confidence text DEFAULT 'high' CHECK (confidence IN ('high','medium','low')),
  dom text,
  js text,
  meta text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE technology_fingerprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_fingerprints" ON technology_fingerprints;
CREATE POLICY "anon_read_fingerprints" ON technology_fingerprints FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_fingerprints" ON technology_fingerprints;
CREATE POLICY "anon_write_fingerprints" ON technology_fingerprints FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fingerprints" ON technology_fingerprints;
CREATE POLICY "anon_update_fingerprints" ON technology_fingerprints FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fingerprints" ON technology_fingerprints;
CREATE POLICY "anon_delete_fingerprints" ON technology_fingerprints FOR DELETE TO anon, authenticated USING (true);

-- ============ INDUSTRY CAPABILITIES ============
CREATE TABLE IF NOT EXISTS industry_capabilities (
  industry_id text REFERENCES industries(id) ON DELETE CASCADE,
  capability_id text REFERENCES capabilities(id) ON DELETE CASCADE,
  weight numeric DEFAULT 1.0,
  PRIMARY KEY (industry_id, capability_id)
);
ALTER TABLE industry_capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_industry_caps" ON industry_capabilities;
CREATE POLICY "anon_read_industry_caps" ON industry_capabilities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_industry_caps" ON industry_capabilities;
CREATE POLICY "anon_write_industry_caps" ON industry_capabilities FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_industry_caps" ON industry_capabilities;
CREATE POLICY "anon_update_industry_caps" ON industry_capabilities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_industry_caps" ON industry_capabilities;
CREATE POLICY "anon_delete_industry_caps" ON industry_capabilities FOR DELETE TO anon, authenticated USING (true);

-- ============ ADOPTION STATS ============
CREATE TABLE IF NOT EXISTS adoption_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id text REFERENCES industries(id) ON DELETE CASCADE,
  capability_id text REFERENCES capabilities(id) ON DELETE CASCADE,
  adoption_pct numeric,
  sample_size integer,
  trend text CHECK (trend IN ('growing','stable','declining',null)),
  source text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (industry_id, capability_id)
);
ALTER TABLE adoption_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_adoption" ON adoption_stats;
CREATE POLICY "anon_read_adoption" ON adoption_stats FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_adoption" ON adoption_stats;
CREATE POLICY "anon_write_adoption" ON adoption_stats FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_adoption" ON adoption_stats;
CREATE POLICY "anon_update_adoption" ON adoption_stats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_adoption" ON adoption_stats;
CREATE POLICY "anon_delete_adoption" ON adoption_stats FOR DELETE TO anon, authenticated USING (true);

-- ============ RECOMMENDATIONS ============
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id text REFERENCES industries(id) ON DELETE CASCADE,
  capability_id text REFERENCES capabilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  why_it_fits text,
  best_for text,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_recs" ON recommendations;
CREATE POLICY "anon_read_recs" ON recommendations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_recs" ON recommendations;
CREATE POLICY "anon_write_recs" ON recommendations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_recs" ON recommendations;
CREATE POLICY "anon_update_recs" ON recommendations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_recs" ON recommendations;
CREATE POLICY "anon_delete_recs" ON recommendations FOR DELETE TO anon, authenticated USING (true);

-- ============ AUDITS ============
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scanning','scoring','complete','error')),
  report jsonb,
  teaser jsonb,
  error text,
  email_unlocked boolean DEFAULT false,
  lead_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_audits" ON audits;
CREATE POLICY "anon_read_audits" ON audits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audits" ON audits;
CREATE POLICY "anon_insert_audits" ON audits FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_audits" ON audits;
CREATE POLICY "anon_update_audits" ON audits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_audits" ON audits;
CREATE POLICY "anon_delete_audits" ON audits FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits (created_at DESC);

-- ============ LEADS ============
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) ON DELETE SET NULL,
  email text NOT NULL,
  phone text,
  contact_name text,
  company_name text,
  high_intent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_leads" ON leads;
CREATE POLICY "anon_read_leads" ON leads FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leads" ON leads;
CREATE POLICY "anon_update_leads" ON leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leads" ON leads;
CREATE POLICY "anon_delete_leads" ON leads FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- ============ ANALYTICS EVENTS ============
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_events" ON analytics_events;
CREATE POLICY "anon_read_events" ON analytics_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON analytics_events;
CREATE POLICY "anon_insert_events" ON analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON analytics_events;
CREATE POLICY "anon_update_events" ON analytics_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON analytics_events;
CREATE POLICY "anon_delete_events" ON analytics_events FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events (created_at DESC);
