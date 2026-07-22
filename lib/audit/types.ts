export type Confidence = 'high' | 'medium' | 'low';
export type CapabilityStatus = 'detected' | 'not_detected' | 'unable_to_verify';
export type Trend = 'growing' | 'stable' | 'declining' | 'unknown';
export type Intent =
  | 'report_only'
  | 'interested'
  | 'implementation_requested'
  | 'matched'
  | 'converted';

export interface Fingerprint {
  id: string;
  label: string;
  category: string | null;
  capability_id: string | null;
  confidence: Confidence;
  dom?: string | null;
  js?: string | null;
  meta?: string | null;
  headers?: string | null;
}

export interface CapabilityDef {
  id: string;
  label: string;
  category: string;
  description?: string | null;
}

export interface IndustryCapability {
  industry_id: string;
  capability_id: string;
  weight: number;
  relevance: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  why_it_matters?: string | null;
}

export interface AdoptionStat {
  industry_id: string;
  capability_id: string;
  adoption_pct: number | null;
  sample_size: number | null;
  trend: Trend | null;
  source?: string | null;
}

export interface RecommendationDef {
  id: string;
  industry_id: string;
  capability_id: string | null;
  name: string;
  category?: string | null;
  why_it_fits?: string | null;
  best_for?: string | null;
  priority: number;
}

export interface DetectedTechnology {
  id: string;
  label: string;
  category: string | null;
  capability_id: string | null;
  confidence: Confidence;
  evidence: string;
}

export interface CapabilityResult {
  id: string;
  label: string;
  category: string;
  status: CapabilityStatus;
  confidence: Confidence;
  technologies: DetectedTechnology[];
  evidence: string;
}

export interface Signal {
  type: string;
  value: string;
  evidence: string;
}

export interface Opportunity {
  capability_id: string;
  label: string;
  category: string;
  status: CapabilityStatus;
  why_it_matters: string;
  industry_relevance: 'low' | 'medium' | 'high';
  potential_impact: 'low' | 'medium' | 'high';
  weight: number;
}

export interface Recommendation {
  name: string;
  category: string | null;
  capability_id: string | null;
  why_it_fits: string;
  best_for: string;
}

export interface BusinessClassification {
  business_name: string;
  industry: string;
  business_type: string;
  location: string;
  services: string[];
  target_customer?: string;
}

export interface ScanData {
  url: string;
  normalizedUrl: string;
  pages: ScannedPage[];
  html: string;
  scripts: string[];
  metas: Record<string, string>;
  jsonLd: any[];
  links: string[];
  forms: number;
  buttons: number;
  visibleText: string;
  title: string;
  description: string;
  phoneNumbers: string[];
  bookingLinks: string[];
  whatsappLinks: string[];
  chatWidgets: string[];
  reviewWidgets: string[];
}

export interface ScannedPage {
  url: string;
  title: string;
  description: string;
  text: string;
  html: string;
  status: number;
}

export interface AuditReport {
  business: BusinessClassification;
  technologies: DetectedTechnology[];
  capabilities: CapabilityResult[];
  signals: Signal[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
  adoption: {
    capability_id: string;
    label: string;
    adoption_pct: number | null;
    sample_size: number | null;
    trend: Trend | null;
    source: string | null;
    your_status: CapabilityStatus;
  }[];
  adoption_score: number;
  opportunity_score: number;
  score_breakdown: { category: string; label: string; points: number; max: number }[];
  executive_summary: string;
}

export interface AuditConfig {
  fingerprints: Fingerprint[];
  capabilities: CapabilityDef[];
  industryCapabilities: IndustryCapability[];
  adoptionStats: AdoptionStat[];
  recommendations: RecommendationDef[];
  industries: { id: string; label: string }[];
}
