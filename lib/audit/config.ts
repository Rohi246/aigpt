import { supabaseAdmin } from '@/lib/supabase/server';
import type { AuditConfig } from './types';

let cached: AuditConfig | null = null;
let cacheAt = 0;
const TTL = 5 * 60 * 1000;

export async function loadConfig(): Promise<AuditConfig> {
  const now = Date.now();
  if (cached && now - cacheAt < TTL) return cached;

  const admin = supabaseAdmin();
  const [
    fingerprints,
    capabilities,
    industryCapabilities,
    adoptionStats,
    recommendations,
    industries,
  ] = await Promise.all([
    admin.from('technology_fingerprints').select('*'),
    admin.from('capabilities').select('*'),
    admin.from('industry_capabilities').select('*'),
    admin.from('adoption_stats').select('*'),
    admin.from('recommendations').select('*'),
    admin.from('industries').select('id, label'),
  ]);

  cached = {
    fingerprints: fingerprints.data ?? [],
    capabilities: capabilities.data ?? [],
    industryCapabilities: industryCapabilities.data ?? [],
    adoptionStats: adoptionStats.data ?? [],
    recommendations: recommendations.data ?? [],
    industries: industries.data ?? [],
  };
  cacheAt = now;
  return cached;
}
