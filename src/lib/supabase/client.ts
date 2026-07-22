import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuditRow {
  id: string;
  url: string;
  status: 'pending' | 'scanning' | 'scoring' | 'complete' | 'error';
  report: AuditReport | null;
  teaser: Teaser | null;
  error: string | null;
  email_unlocked: boolean;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditReport {
  url: string;
  industry: { id: string; label: string } | null;
  adoption_score: number;
  opportunity_score: number;
  capabilities: CapabilityResult[];
  detected_technologies: DetectedTech[];
  missing_capabilities: CapabilityResult[];
  ai_opportunities: CapabilityResult[];
  adoption_stats: AdoptionStatResult[];
  recommendations: RecommendationResult[];
  pages_scanned: number;
  scan_errors: string[];
}

export interface Teaser {
  url: string;
  adoption_score: number;
  industry_label: string | null;
  detected_count: number;
  missing_count: number;
  top_opportunity_label: string | null;
}

export interface CapabilityResult {
  capability_id: string;
  label: string;
  category: string;
  status: 'detected' | 'not_detected' | 'unable_to_verify';
  detected_technologies: DetectedTech[];
  weight: number;
}

export interface DetectedTech {
  fingerprint_id: string;
  label: string;
  category: string;
  capability_id: string | null;
  confidence: string;
  signal: string;
}

export interface AdoptionStatResult {
  capability_id: string;
  label: string;
  adoption_pct: number | null;
  trend: string | null;
  sample_size: number | null;
}

export interface RecommendationResult {
  name: string;
  category: string;
  why_it_fits: string;
  best_for: string;
  priority: number;
  capability_id: string;
}

export interface LeadRow {
  id: string;
  audit_id: string | null;
  email: string;
  phone: string | null;
  contact_name: string | null;
  company_name: string | null;
  high_intent: boolean;
  created_at: string;
}
