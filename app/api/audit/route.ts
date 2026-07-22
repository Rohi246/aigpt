import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { normalizeUrl, resolveAndValidateHost } from '@/lib/audit/url';
import { runAudit } from '@/lib/audit/engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const inputUrl = String(body?.url || '').trim();
  const norm = normalizeUrl(inputUrl);
  if (!norm.ok || !norm.url) {
    return NextResponse.json({ error: norm.error || 'Invalid URL.' }, { status: 400 });
  }

  const hostCheck = await resolveAndValidateHost(norm.host!);
  if (!hostCheck.ok) {
    return NextResponse.json({ error: hostCheck.error }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Dedupe: return recent pending/completed audit for same normalized URL within 1h
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: existing } = await admin
    .from('audits')
    .select('id, status, normalized_url, created_at')
    .eq('normalized_url', norm.url)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await admin.from('analytics_events').insert({
      audit_id: existing.id,
      event: 'audit_started',
      metadata: { url: norm.url, cached: true },
    });
    return NextResponse.json({ auditId: existing.id, status: existing.status, cached: true });
  }

  const { data: inserted, error: insErr } = await admin
    .from('audits')
    .insert({
      url: inputUrl,
      normalized_url: norm.url,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    return NextResponse.json({ error: 'Could not start audit.' }, { status: 500 });
  }

  const auditId = inserted.id;
  await admin.from('analytics_events').insert({
    audit_id: auditId,
    event: 'audit_started',
    metadata: { url: norm.url },
  });

  try {
    const { scan, report, error } = await runAudit(norm.url);
    if (error || !scan || !report) {
      await admin.from('audits').update({ status: 'failed', error: error || 'Scan failed.' }).eq('id', auditId);
      return NextResponse.json({ auditId, status: 'failed', error: error || 'Scan failed.' });
    }

    await admin.from('audits').update({
      status: 'completed',
      business_name: report.business.business_name,
      industry: report.business.industry,
      business_type: report.business.business_type,
      location: report.business.location,
      services: report.business.services,
      technologies: report.technologies,
      capabilities: report.capabilities,
      signals: report.signals,
      opportunities: report.opportunities,
      recommendations: report.recommendations,
      adoption_score: report.adoption_score,
      opportunity_score: report.opportunity_score,
      report: report,
    }).eq('id', auditId);

    await admin.from('analytics_events').insert({
      audit_id: auditId,
      event: 'audit_completed',
      metadata: { adoption_score: report.adoption_score, opportunity_score: report.opportunity_score },
    });

    return NextResponse.json({ auditId, status: 'completed' });
  } catch (e: any) {
    await admin.from('audits').update({ status: 'failed', error: e.message }).eq('id', auditId);
    return NextResponse.json({ auditId, status: 'failed', error: e.message }, { status: 500 });
  }
}
