import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-demo';

function authorized(req: Request): boolean {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return Boolean(token) && token === ADMIN_TOKEN;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const admin = supabaseAdmin();

  const [audits, leads, events] = await Promise.all([
    admin.from('audits').select('id, status, industry, adoption_score, opportunity_score, created_at, business_name, normalized_url'),
    admin.from('leads').select('id, audit_id, email, business_name, website, industry, location, phone, requested_service, intent, adoption_score, opportunity_score, created_at'),
    admin.from('analytics_events').select('event, created_at, audit_id'),
  ]);

  const auditRows: any[] = audits.data || [];
  const leadRows: any[] = leads.data || [];
  const eventRows: any[] = events.data || [];

  const totalAudits = auditRows.length;
  const completedAudits = auditRows.filter((a: any) => a.status === 'completed').length;
  const emailLeads = leadRows.length;
  const implementationRequests = leadRows.filter((l: any) => l.intent === 'implementation_requested').length;
  const emailConversionRate = totalAudits > 0 ? Math.round((emailLeads / totalAudits) * 100) : 0;

  const industryCounts = new Map<string, number>();
  for (const a of auditRows) {
    const k = a.industry || 'unknown';
    industryCounts.set(k, (industryCounts.get(k) || 0) + 1);
  }
  const topIndustries = Array.from(industryCounts.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const { data: fullAudits } = await admin.from('audits').select('id, technologies, opportunities, recommendations');
  const topOpportunities = new Map<string, number>();
  const topRecommended = new Map<string, number>();
  const topTechnologies = new Map<string, number>();
  for (const a of (fullAudits || []) as any[]) {
    for (const o of (a.opportunities || [])) {
      const k = o.label || o.capability_id;
      topOpportunities.set(k, (topOpportunities.get(k) || 0) + 1);
    }
    for (const r of (a.recommendations || [])) {
      topRecommended.set(r.name, (topRecommended.get(r.name) || 0) + 1);
    }
    for (const t of (a.technologies || [])) {
      topTechnologies.set(t.label, (topTechnologies.get(t.label) || 0) + 1);
    }
  }
  const sortCount = (m: Map<string, number>) =>
    Array.from(m.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);

  const eventCounts = new Map<string, number>();
  for (const e of eventRows) {
    eventCounts.set(e.event, (eventCounts.get(e.event) || 0) + 1);
  }

  return NextResponse.json({
    metrics: {
      totalAudits,
      completedAudits,
      emailLeads,
      emailConversionRate,
      implementationRequests,
      events: Object.fromEntries(eventCounts),
    },
    topIndustries,
    topOpportunities: sortCount(topOpportunities),
    topRecommended: sortCount(topRecommended),
    topTechnologies: sortCount(topTechnologies),
    leads: leadRows.map((l: any) => ({
      id: l.id,
      auditId: l.audit_id,
      business: l.business_name,
      website: l.website,
      industry: l.industry,
      email: l.email,
      phone: l.phone,
      requestedService: l.requested_service,
      intent: l.intent,
      adoptionScore: l.adoption_score,
      opportunityScore: l.opportunity_score,
      createdAt: l.created_at,
    })),
  });
}
