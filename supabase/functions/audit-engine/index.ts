import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface Fingerprint {
  id: string;
  label: string;
  category: string;
  capability_id: string | null;
  confidence: string;
  dom: string | null;
  js: string | null;
  meta: string | null;
}

interface Capability {
  id: string;
  label: string;
  category: string;
  description: string | null;
}

interface IndustryCapability {
  industry_id: string;
  capability_id: string;
  weight: number;
}

interface AdoptionStat {
  industry_id: string;
  capability_id: string;
  adoption_pct: number | null;
  sample_size: number | null;
  trend: string | null;
  source: string | null;
}

interface Recommendation {
  industry_id: string;
  capability_id: string;
  name: string;
  category: string;
  why_it_fits: string;
  best_for: string;
  priority: number;
}

interface DetectedTech {
  fingerprint_id: string;
  label: string;
  category: string;
  capability_id: string | null;
  confidence: string;
  signal: string;
}

interface CapabilityResult {
  capability_id: string;
  label: string;
  category: string;
  status: 'detected' | 'not_detected' | 'unable_to_verify';
  detected_technologies: DetectedTech[];
  weight: number;
}

interface AuditReport {
  url: string;
  industry: { id: string; label: string } | null;
  adoption_score: number;
  opportunity_score: number;
  capabilities: CapabilityResult[];
  detected_technologies: DetectedTech[];
  missing_capabilities: CapabilityResult[];
  ai_opportunities: CapabilityResult[];
  adoption_stats: { capability_id: string; label: string; adoption_pct: number | null; trend: string | null; sample_size: number | null }[];
  recommendations: { name: string; category: string; why_it_fits: string; best_for: string; priority: number; capability_id: string }[];
  pages_scanned: number;
  scan_errors: string[];
}

interface Teaser {
  url: string;
  adoption_score: number;
  industry_label: string | null;
  detected_count: number;
  missing_count: number;
  top_opportunity_label: string | null;
}

// ============ URL VALIDATION ============
function validateUrl(rawUrl: string): URL {
  let urlStr = rawUrl.trim();
  if (!urlStr.match(/^https?:\/\//i)) {
    urlStr = 'https://' + urlStr;
  }
  const url = new URL(urlStr);
  if (!url.hostname || !url.hostname.includes('.')) {
    throw new Error('Invalid URL: must have a valid domain');
  }
  const hostname = url.hostname.toLowerCase();
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'];
  if (blocked.includes(hostname)) {
    throw new Error('Invalid URL: private/local hosts not allowed');
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    if (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)) {
      throw new Error('Invalid URL: private IP addresses not allowed');
    }
  }
  return url;
}

// ============ SCANNER ============
async function scanWebsite(url: URL): Promise<{ pages: Map<string, string>; errors: string[] }> {
  const pages = new Map<string, string>();
  const errors: string[] = [];
  const visited = new Set<string>();
  const maxPages = 3;
  const timeoutMs = 8000;
  const maxBytes = 2 * 1024 * 1024;

  const pagesToTry = [
    url.href,
    url.origin + '/about',
    url.origin + '/services',
    url.origin + '/contact',
  ];

  let scanned = 0;
  for (const pageUrl of pagesToTry) {
    if (scanned >= maxPages) break;
    if (visited.has(pageUrl)) continue;
    visited.add(pageUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(pageUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIAuditBot/1.0; +https://aiadoptionaudit.com)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) continue;

      // Use response.text() instead of manual streaming — simpler and Deno-safe
      let html = await response.text();
      if (html.length > maxBytes) {
        html = html.slice(0, maxBytes);
      }
      if (html.length > 0) {
        pages.set(pageUrl, html.toLowerCase());
        scanned++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (!msg.includes('abort')) {
        errors.push(`${pageUrl}: ${msg}`);
      }
    }
  }

  return { pages, errors };
}

// ============ DETECTOR ============
function detectTechnologies(pages: Map<string, string>, fingerprints: Fingerprint[]): DetectedTech[] {
  const detected: DetectedTech[] = [];
  const seen = new Set<string>();

  for (const [pageUrl, html] of pages) {
    for (const fp of fingerprints) {
      if (seen.has(fp.id)) continue;

      let found = false;
      let signal = '';

      if (fp.dom && html.includes(fp.dom.toLowerCase())) {
        found = true;
        signal = `DOM match: "${fp.dom}" on ${pageUrl}`;
      } else if (fp.js && html.includes(fp.js.toLowerCase())) {
        found = true;
        signal = `JS match: "${fp.js}" on ${pageUrl}`;
      } else if (fp.meta && html.includes(fp.meta.toLowerCase())) {
        found = true;
        signal = `Meta match: "${fp.meta}" on ${pageUrl}`;
      }

      if (found) {
        seen.add(fp.id);
        detected.push({
          fingerprint_id: fp.id,
          label: fp.label,
          category: fp.category,
          capability_id: fp.capability_id,
          confidence: fp.confidence,
          signal,
        });
      }
    }
  }

  return detected;
}

// ============ CAPABILITY MAPPING ============
function mapCapabilities(
  detected: DetectedTech[],
  capabilities: Capability[],
  industryCapabilities: IndustryCapability[],
  industryId: string | null
): CapabilityResult[] {
  const capMap = new Map<string, Capability>();
  for (const c of capabilities) capMap.set(c.id, c);

  const relevantCapIds = new Set<string>();
  if (industryId) {
    for (const ic of industryCapabilities) {
      if (ic.industry_id === industryId) relevantCapIds.add(ic.capability_id);
    }
  } else {
    for (const c of capabilities) relevantCapIds.add(c.id);
  }

  const weightMap = new Map<string, number>();
  for (const ic of industryCapabilities) {
    if (!industryId || ic.industry_id === industryId) {
      weightMap.set(ic.capability_id, ic.weight);
    }
  }

  const detectedByCap = new Map<string, DetectedTech[]>();
  for (const tech of detected) {
    if (tech.capability_id) {
      const arr = detectedByCap.get(tech.capability_id) || [];
      arr.push(tech);
      detectedByCap.set(tech.capability_id, arr);
    }
  }

  const results: CapabilityResult[] = [];
  for (const capId of relevantCapIds) {
    const cap = capMap.get(capId);
    if (!cap) continue;

    const techs = detectedByCap.get(capId) || [];
    const weight = weightMap.get(capId) ?? 1.0;

    let status: 'detected' | 'not_detected' | 'unable_to_verify';
    if (techs.length > 0) {
      const hasHigh = techs.some(t => t.confidence === 'high');
      status = hasHigh ? 'detected' : 'unable_to_verify';
    } else {
      status = 'not_detected';
    }

    results.push({
      capability_id: capId,
      label: cap.label,
      category: cap.category,
      status,
      detected_technologies: techs,
      weight,
    });
  }

  return results;
}

// ============ INDUSTRY CLASSIFICATION ============
function classifyIndustry(html: string): string | null {
  const keywords: Record<string, string[]> = {
    dental: ['dental', 'dentist', 'orthodont', 'teeth', 'oral surgery', 'hygienist'],
    legal: ['law firm', 'attorney', 'lawyer', 'legal', 'practice law', 'esq', 'paralegal'],
    restaurant: ['restaurant', 'menu', 'dining', 'reservation', 'cuisine', 'chef', 'food'],
    retail: ['shop', 'store', 'product', 'buy', 'cart', 'price', 'retail'],
    real_estate: ['real estate', 'property', 'realtor', 'listing', 'home for sale', 'mls'],
    fitness: ['gym', 'fitness', 'yoga', 'workout', 'training', 'pilates', 'wellness'],
    automotive: ['auto', 'car', 'vehicle', 'mechanic', 'repair', 'service center', 'oil change'],
    home_services: ['plumbing', 'electrician', 'hvac', 'contractor', 'cleaning', 'repair service'],
  };

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [industry, words] of Object.entries(keywords)) {
    let score = 0;
    for (const word of words) {
      if (html.includes(word)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = industry;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

// ============ SCORING ============
function calculateScores(capabilities: CapabilityResult[]): { adoption: number; opportunity: number } {
  const detected = capabilities.filter(c => c.status === 'detected');
  const totalWeight = capabilities.reduce((sum, c) => sum + c.weight, 0);
  const detectedWeight = detected.reduce((sum, c) => sum + c.weight, 0);

  const adoptionScore = totalWeight > 0 ? Math.round((detectedWeight / totalWeight) * 100) : 0;

  const aiCaps = capabilities.filter(c =>
    c.capability_id === 'ai_voice_receptionist' || c.capability_id === 'ai_chatbot'
  );
  const aiDetected = aiCaps.filter(c => c.status === 'detected');
  const aiTotalWeight = aiCaps.reduce((sum, c) => sum + c.weight, 0);
  const aiDetectedWeight = aiDetected.reduce((sum, c) => sum + c.weight, 0);

  const missingHighValue = capabilities.filter(c =>
    c.status === 'not_detected' && c.weight >= 1.5 && c.capability_id !== 'ai_voice_receptionist' && c.capability_id !== 'ai_chatbot'
  );

  let opportunityScore = 0;
  if (aiTotalWeight > 0) {
    opportunityScore += Math.round((1 - aiDetectedWeight / aiTotalWeight) * 60);
  }
  opportunityScore += Math.min(missingHighValue.length * 8, 40);

  return { adoption: adoptionScore, opportunity: Math.min(opportunityScore, 100) };
}

// ============ MAIN HANDLER ============
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  let auditId: string | null = null;

  try {
    const body = await req.json();
    const rawUrl: string = body.url;
    auditId = body.auditId ?? null;

    if (!rawUrl) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let validatedUrl: URL;
    try {
      validatedUrl = validateUrl(rawUrl);
    } catch (e) {
      if (auditId) {
        await supabase.from('audits').update({ status: 'error', error: e.message, updated_at: new Date().toISOString() }).eq('id', auditId);
      }
      return new Response(JSON.stringify({ error: e.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to scanning
    if (auditId) {
      await supabase.from('audits').update({ status: 'scanning', updated_at: new Date().toISOString() }).eq('id', auditId);
    }

    // Load config from DB
    const [fpsRes, capsRes, indCapsRes, adoptionRes, recsRes] = await Promise.all([
      supabase.from('technology_fingerprints').select('*'),
      supabase.from('capabilities').select('*'),
      supabase.from('industry_capabilities').select('*'),
      supabase.from('adoption_stats').select('*'),
      supabase.from('recommendations').select('*'),
    ]);

    const fingerprints = (fpsRes.data as Fingerprint[]) || [];
    const capabilities = (capsRes.data as Capability[]) || [];
    const industryCapabilities = (indCapsRes.data as IndustryCapability[]) || [];
    const adoptionStats = (adoptionRes.data as AdoptionStat[]) || [];
    const recommendations = (recsRes.data as Recommendation[]) || [];

    // Scan
    const { pages, errors } = await scanWebsite(validatedUrl);
    const allHtml = Array.from(pages.values()).join(' ');

    if (pages.size === 0) {
      const errMsg = 'Could not fetch any pages from the website';
      if (auditId) {
        await supabase.from('audits').update({ status: 'error', error: errMsg, updated_at: new Date().toISOString() }).eq('id', auditId);
      }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Detect
    const detected = detectTechnologies(pages, fingerprints);

    // Classify industry
    const industryId = classifyIndustry(allHtml);

    // Map capabilities
    const capabilityResults = mapCapabilities(detected, capabilities, industryCapabilities, industryId);

    // Score
    const { adoption, opportunity } = calculateScores(capabilityResults);

    // Missing capabilities
    const missing = capabilityResults.filter(c => c.status === 'not_detected');

    // AI opportunities
    const aiOpportunities = capabilityResults.filter(c =>
      (c.capability_id === 'ai_voice_receptionist' || c.capability_id === 'ai_chatbot') && c.status === 'not_detected'
    );

    // Adoption stats for this industry
    const industryAdoptionStats = industryId
      ? adoptionStats.filter(a => a.industry_id === industryId)
      : [];

    const adoptionData = industryAdoptionStats.map(a => {
      const cap = capabilities.find(c => c.id === a.capability_id);
      return {
        capability_id: a.capability_id,
        label: cap?.label || a.capability_id,
        adoption_pct: a.adoption_pct,
        trend: a.trend,
        sample_size: a.sample_size,
      };
    });

    // Recommendations
    const industryRecs = industryId
      ? recommendations.filter(r => r.industry_id === industryId).sort((a, b) => a.priority - b.priority)
      : [];

    const report: AuditReport = {
      url: validatedUrl.href,
      industry: industryId ? { id: industryId, label: industryId } : null,
      adoption_score: adoption,
      opportunity_score: opportunity,
      capabilities: capabilityResults,
      detected_technologies: detected,
      missing_capabilities: missing,
      ai_opportunities: aiOpportunities,
      adoption_stats: adoptionData,
      recommendations: industryRecs.map(r => ({
        name: r.name,
        category: r.category,
        why_it_fits: r.why_it_fits,
        best_for: r.best_for,
        priority: r.priority,
        capability_id: r.capability_id,
      })),
      pages_scanned: pages.size,
      scan_errors: errors,
    };

    // Build teaser
    const topOpportunity = aiOpportunities[0] || missing[0];
    const teaser: Teaser = {
      url: validatedUrl.href,
      adoption_score: adoption,
      industry_label: industryId ? industryId : null,
      detected_count: detected.length,
      missing_count: missing.length,
      top_opportunity_label: topOpportunity?.label || null,
    };

    // Update audit record
    if (auditId) {
      await supabase.from('audits').update({
        status: 'complete',
        report: report as unknown as Record<string, never>,
        teaser: teaser as unknown as Record<string, never>,
        updated_at: new Date().toISOString(),
      }).eq('id', auditId);
    }

    return new Response(JSON.stringify({ report, teaser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';

    // CRITICAL: update DB status to error so the frontend doesn't poll forever
    if (auditId) {
      try {
        await supabase.from('audits').update({
          status: 'error',
          error: msg,
          updated_at: new Date().toISOString(),
        }).eq('id', auditId);
      } catch { /* best effort */ }
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
