import type { AuditConfig, CapabilityResult, Recommendation } from './types';

export function buildRecommendations(
  config: AuditConfig,
  capabilities: CapabilityResult[],
  industry: string
): Recommendation[] {
  const detected = new Set(capabilities.filter((c) => c.status === 'detected').map((c) => c.id));
  const recs = config.recommendations
    .filter((r) => r.industry_id === industry)
    .map((r) => ({ r, missing: r.capability_id ? !detected.has(r.capability_id) : true }))
    .sort((a, b) => {
      // Prefer missing-capability recs, then by priority
      if (a.missing !== b.missing) return a.missing ? -1 : 1;
      return a.r.priority - b.r.priority;
    })
    .slice(0, 2)
    .map(({ r }) => ({
      name: r.name,
      category: r.category || null,
      capability_id: r.capability_id,
      why_it_fits: r.why_it_fits || '',
      best_for: r.best_for || '',
    }));

  // Fallback: if no industry recs, use top 2 missing capabilities
  if (recs.length === 0) {
    const missing = capabilities
      .filter((c) => c.status !== 'detected')
      .slice(0, 2)
      .map((c) => ({
        name: c.label,
        category: c.category,
        capability_id: c.id,
        why_it_fits: `${c.label} was not detected on your website and is relevant to your industry.`,
        best_for: 'Businesses looking to modernize their operations.',
      }));
    return missing;
  }
  return recs;
}
