import { loadConfig } from './config';
import { scanWebsite, type ScanData } from './scanner';
import { detectTechnologies } from './detector';
import { mapCapabilities } from './capabilities';
import { classifyBusiness } from './llm';
import { computeScores, buildOpportunities } from './scoring';
import { buildRecommendations } from './recommendations';
import type { AuditReport, BusinessClassification } from './types';

export interface AuditResult {
  scan: ScanData | null;
  report: AuditReport | null;
  error?: string;
}

export async function runAudit(url: string): Promise<AuditResult> {
  const config = await loadConfig();
  const scan = await scanWebsite(url);
  if (!scan) {
    return { scan: null, report: null, error: 'We could not access that website. Please check the URL and try again.' };
  }

  const { technologies, signals } = detectTechnologies(config, scan);
  const capabilities = mapCapabilities(config, technologies, scan, signals);

  const classification: BusinessClassification = await classifyBusiness({
    title: scan.title,
    description: scan.description,
    text: scan.visibleText,
    url: scan.normalizedUrl,
    jsonLd: scan.jsonLd,
    signals: signals.map((s) => ({ type: s.type, value: s.value })),
  });

  const { adoption_score, opportunity_score, breakdown } = computeScores(config, capabilities, classification.industry);
  const opportunities = buildOpportunities(config, capabilities, classification.industry);
  const recommendations = buildRecommendations(config, capabilities, classification.industry);

  // Adoption data per capability for this industry
  const adoption = config.adoptionStats
    .filter((a) => a.industry_id === classification.industry)
    .map((a) => {
      const cap = capabilities.find((c) => c.id === a.capability_id);
      return {
        capability_id: a.capability_id,
        label: cap?.label || a.capability_id,
        adoption_pct: a.adoption_pct,
        sample_size: a.sample_size,
        trend: a.trend,
        source: a.source || null,
        your_status: cap?.status || 'unable_to_verify',
      };
    });

  const executive_summary = buildExecutiveSummary(
    classification,
    adoption_score,
    opportunity_score,
    capabilities
  );

  const report: AuditReport = {
    business: classification,
    technologies,
    capabilities,
    signals,
    opportunities,
    recommendations,
    adoption,
    adoption_score,
    opportunity_score,
    score_breakdown: breakdown,
    executive_summary,
  };

  return { scan, report };
}

function buildExecutiveSummary(
  business: BusinessClassification,
  adoption: number,
  opportunity: number,
  capabilities: { id: string; label: string; status: string }[]
): string {
  const detectedCount = capabilities.filter((c) => c.status === 'detected').length;
  const industryLabel = business.industry.replace(/_/g, ' ');
  let foundation = 'limited digital foundation';
  if (adoption >= 60) foundation = 'strong digital foundation';
  else if (adoption >= 35) foundation = 'solid digital foundation';
  else if (adoption >= 15) foundation = 'developing digital foundation';

  let oppPhrase = 'several high-impact opportunities';
  if (opportunity >= 75) oppPhrase = 'significant high-impact opportunities';
  else if (opportunity >= 50) oppPhrase = 'several high-impact opportunities';
  else if (opportunity >= 25) oppPhrase = 'a few targeted opportunities';
  else oppPhrase = 'limited remaining opportunities';

  return `Your ${industryLabel} business shows a ${foundation} with ${detectedCount} detectable digital capability${detectedCount === 1 ? '' : 'ies'} on your website. Your AI Adoption Score is ${adoption}/100 and your AI Opportunity Score is ${opportunity}/100, indicating ${oppPhrase} for AI and automation. This report is based on publicly observable signals from your website and does not measure internal AI usage we cannot verify.`;
}
