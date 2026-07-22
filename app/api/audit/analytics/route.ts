import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // non-fatal
  }
  const event = String(body?.event || '').trim();
  const auditId = body?.auditId ? String(body.auditId) : null;
  const metadata = body?.metadata || {};

  if (!event) return NextResponse.json({ ok: true });

  const admin = supabaseAdmin();
  try {
    await admin.from('analytics_events').insert({
      audit_id: auditId,
      event,
      metadata,
    });
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true });
}
