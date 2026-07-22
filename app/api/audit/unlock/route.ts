import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendReportEmail } from '@/lib/audit/email';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const auditId = String(body?.auditId || '');
  const email = String(body?.email || '').trim().toLowerCase();

  if (!auditId) return NextResponse.json({ error: 'Missing audit id.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: audit, error } = await admin
    .from('audits')
    .select('id, business_name, industry, location, normalized_url, adoption_score, opportunity_score, email_unlocked, report')
    .eq('id', auditId)
    .maybeSingle();

  if (error || !audit) return NextResponse.json({ error: 'Audit not found.' }, { status: 404 });

  const { data: existingLead } = await admin
    .from('leads')
    .select('id')
    .eq('audit_id', auditId)
    .maybeSingle();

  let leadId = existingLead?.id;
  if (existingLead) {
    await admin.from('leads').update({ email, intent: 'report_only' }).eq('id', existingLead.id);
  } else {
    const { data: newLead } = await admin
      .from('leads')
      .insert({
        audit_id: auditId,
        email,
        business_name: audit.business_name,
        website: audit.normalized_url,
        industry: audit.industry,
        location: audit.location,
        adoption_score: audit.adoption_score,
        opportunity_score: audit.opportunity_score,
        intent: 'report_only',
      })
      .select('id')
      .single();
    leadId = newLead?.id;
  }

  await admin.from('audits').update({ email_unlocked: true, lead_id: leadId }).eq('id', auditId);

  await admin.from('analytics_events').insert({
    audit_id: auditId,
    event: 'email_submitted',
    metadata: { email },
  });

  const origin = new URL(req.url).origin;
  const reportUrl = `${origin}/report/${auditId}`;
  await sendReportEmail(email, auditId, audit.business_name || 'your business', reportUrl).catch(() => null);

  return NextResponse.json({ ok: true, unlocked: true });
}
