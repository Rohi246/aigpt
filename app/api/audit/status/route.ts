import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const auditId = url.searchParams.get('id');
  if (!auditId) return NextResponse.json({ error: 'Missing audit id.' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('audits')
    .select('id, status, error, business_name, industry, adoption_score, opportunity_score, report, email_unlocked, lead_id, normalized_url')
    .eq('id', auditId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Audit not found.' }, { status: 404 });
  }

  const report = data.report as any;
  const teaser = {
    auditId: data.id,
    status: data.status,
    error: data.error,
    businessName: data.business_name,
    industry: data.industry,
    adoptionScore: data.adoption_score,
    opportunityScore: data.opportunity_score,
    emailUnlocked: data.email_unlocked,
    normalizedUrl: data.normalized_url,
    teaserCapabilities: report
      ? (report.capabilities || [])
          .slice(0, 6)
          .map((c: any) => ({ id: c.id, label: c.label, status: c.status }))
      : [],
    opportunityCount: report ? (report.opportunities || []).length : 0,
  };

  if (data.email_unlocked && report) {
    return NextResponse.json({ ...teaser, report });
  }

  return NextResponse.json(teaser);
}
