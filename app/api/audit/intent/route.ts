import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s()+\-.]{7,20}$/;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const auditId = String(body?.auditId || '');
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const phone = String(body?.phone || '').trim();
  const website = String(body?.website || '').trim();
  const requestedService = String(body?.requestedService || '').trim();
  const budget = String(body?.budget || '').trim();
  const timeline = String(body?.timeline || '').trim();

  if (!auditId) return NextResponse.json({ error: 'Missing audit id.' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'Please enter a phone number.' }, { status: 400 });
  if (!PHONE_RE.test(phone)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  if (!requestedService) return NextResponse.json({ error: 'Please select a service.' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: audit } = await admin
    .from('audits')
    .select('id, business_name, industry, location, normalized_url, adoption_score, opportunity_score, lead_id')
    .eq('id', auditId)
    .maybeSingle();

  if (!audit) return NextResponse.json({ error: 'Audit not found.' }, { status: 404 });

  // Upsert lead as high-intent
  if (audit.lead_id) {
    await admin.from('leads').update({
      email,
      phone,
      business_name: audit.business_name,
      website: website || audit.normalized_url,
      industry: audit.industry,
      location: audit.location,
      requested_service: requestedService,
      budget,
      timeline,
      intent: 'implementation_requested',
      adoption_score: audit.adoption_score,
      opportunity_score: audit.opportunity_score,
    }).eq('id', audit.lead_id);
  } else {
    const { data: newLead } = await admin.from('leads').insert({
      audit_id: auditId,
      email,
      phone,
      business_name: audit.business_name,
      website: website || audit.normalized_url,
      industry: audit.industry,
      location: audit.location,
      requested_service: requestedService,
      budget,
      timeline,
      intent: 'implementation_requested',
      adoption_score: audit.adoption_score,
      opportunity_score: audit.opportunity_score,
    }).select('id').single();
    if (newLead) await admin.from('audits').update({ lead_id: newLead.id }).eq('id', auditId);
  }

  await admin.from('analytics_events').insert({
    audit_id: auditId,
    event: 'implementation_request_submitted',
    metadata: { requested_service: requestedService },
  });

  return NextResponse.json({ ok: true });
}
