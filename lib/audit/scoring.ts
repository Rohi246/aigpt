import type { AuditConfig, CapabilityResult, Opportunity } from './types';

// Deterministic scoring. Never LLM-generated.
// Adoption score: weighted points for detected capabilities.
// Opportunity score: weighted points for MISSING high-value capabilities relative to industry.

interface ScoreCategory {
  category: string;
  label: string;
  capabilityIds: string[];
  max: number;
}

const ADOPTION_CATEGORIES: ScoreCategory[] = [
  { category: 'lead_capture', label: 'Lead Capture', capabilityIds: ['ai_lead_capture', 'website_chat', 'lead_qualification'], max: 20 },
  { category: 'communication', label: 'Customer Communication', capabilityIds: ['ai_voice_receptionist', 'missed_call_recovery', 'sms_whatsapp_followup'], max: 20 },
  { category: 'booking', label: 'Booking', capabilityIds: ['online_booking'], max: 15 },
  { category: 'reputation', label: 'Review / Referral Automation', capabilityIds: ['review_management', 'automated_review_requests'], max: 15 },
  { category: 'followup', label: 'Follow-up', capabilityIds: ['crm_marketing_automation', 'ai_customer_support'], max: 15 },
  { category: 'ai_infra', label: 'AI / Automation Infrastructure', capabilityIds: ['ai_content_marketing', 'ai_search_faq', 'personalization', 'analytics'], max: 15 },
];

export interface ScoreResult {
  adoption_score: number;
  opportunity_score: number;
  breakdown: { category: string; label: string; points: number; max: number }[];
}

export function computeScores(
  config: AuditConfig,
  capabilities: CapabilityResult[],
  industry: string
): ScoreResult {
  const detected = new Set(capabilities.filter((c) => c.status === 'detected').map((c) => c.id));
  const breakdown: { category: string; label: string; points: number; max: number }[] = [];

  // Adoption score
  let adoptionRaw = 0;
  let adoptionMax = 0;
  for (const cat of ADOPTION_CATEGORIES) {
    let detectedCount = 0;
    const denom = Math.max(1, cat.capabilityIds.length);
    for (const capId of cat.capabilityIds) {
      if (detected.has(capId)) detectedCount++;
    }
    const ratio = detectedCount / denom;
    adoptionRaw += ratio * cat.max;
    adoptionMax += cat.max;
    breakdown.push({
      category: cat.category,
      label: cat.label,
      points: Math.round(ratio * cat.max),
      max: cat.max,
    });
  }
  const adoption_score = adoptionMax > 0 ? Math.round((adoptionRaw / adoptionMax) * 100) : 0;

  // Opportunity score: based on missing capabilities weighted by industry relevance
  const industryCaps = config.industryCapabilities.filter((ic) => ic.industry_id === industry);
  const weightMap = new Map<string, { weight: number; relevance: string; impact: string; why: string | null }>();
  for (const ic of industryCaps) {
    weightMap.set(ic.capability_id, {
      weight: ic.weight,
      relevance: ic.relevance,
      impact: ic.impact,
      why: ic.why_it_matters ?? null,
    });
  }
  const defaultWeight = { weight: 10, relevance: 'medium', impact: 'medium', why: null };

  let oppRaw = 0;
  let oppMax = 0;
  for (const cap of capabilities) {
    const w = weightMap.get(cap.id) || defaultWeight;
    oppMax += w.weight;
    if (cap.status !== 'detected') {
      // missing capability contributes to opportunity
      oppRaw += w.weight;
    }
  }
  const opportunity_score = oppMax > 0 ? Math.round((oppRaw / oppMax) * 100) : 0;

  return { adoption_score, opportunity_score, breakdown };
}

export function buildOpportunities(
  config: AuditConfig,
  capabilities: CapabilityResult[],
  industry: string
): Opportunity[] {
  const industryCaps = config.industryCapabilities.filter((ic) => ic.industry_id === industry);
  const weightMap = new Map<string, { weight: number; relevance: string; impact: string; why: string | null }>();
  for (const ic of industryCaps) {
    weightMap.set(ic.capability_id, {
      weight: ic.weight,
      relevance: ic.relevance,
      impact: ic.impact,
      why: ic.why_it_matters ?? null,
    });
  }
  const defaultWeight = { weight: 10, relevance: 'medium', impact: 'medium', why: null };

  const opps: Opportunity[] = capabilities
    .filter((c) => c.status !== 'detected')
    .map((c) => {
      const w = weightMap.get(c.id) || defaultWeight;
      return {
        capability_id: c.id,
        label: c.label,
        category: c.category,
        status: c.status,
        why_it_matters: w.why || `Adopting ${c.label} could improve operations for ${industry.replace(/_/g, ' ')} businesses.`,
        industry_relevance: w.relevance as 'low' | 'medium' | 'high',
        potential_impact: w.impact as 'low' | 'medium' | 'high',
        weight: w.weight,
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return opps;
}
