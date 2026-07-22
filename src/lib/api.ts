import { supabase } from '../lib/supabase/client';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-engine`;

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u.match(/^https?:\/\//i)) u = 'https://' + u;
  try {
    const parsed = new URL(u);
    return parsed.origin + parsed.pathname.replace(/\/$/, '') + parsed.search;
  } catch {
    return u.toLowerCase();
  }
}

export async function startAudit(url: string): Promise<{ auditId: string }> {
  const normalized = normalizeUrl(url);
  const { data, error } = await supabase
    .from('audits')
    .insert({ url, normalized_url: normalized, status: 'pending' })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create audit: ${error.message}`);

  const auditId = data.id;

  fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ url, auditId }),
  }).catch(() => {
    supabase.from('audits').update({ status: 'error', error: 'Failed to start scan' }).eq('id', auditId);
  });

  return { auditId };
}

export async function pollAuditStatus(auditId: string) {
  const { data, error } = await supabase
    .from('audits')
    .select('id, url, status, report, teaser, error, email_unlocked, lead_id')
    .eq('id', auditId)
    .maybeSingle();

  if (error) throw new Error(`Failed to poll audit: ${error.message}`);
  return data;
}

export async function unlockReport(auditId: string, email: string) {
  const { data: leadData, error: leadError } = await supabase
    .from('leads')
    .insert({ audit_id: auditId, email })
    .select('id')
    .single();

  if (leadError) throw new Error(`Failed to create lead: ${leadError.message}`);

  const { error: updateError } = await supabase
    .from('audits')
    .update({ email_unlocked: true, lead_id: leadData.id })
    .eq('id', auditId);

  if (updateError) throw new Error(`Failed to unlock report: ${updateError.message}`);

  return { leadId: leadData.id };
}

export async function submitIntent(
  auditId: string,
  leadId: string,
  data: { phone: string; contact_name: string; company_name: string }
) {
  const { error } = await supabase
    .from('leads')
    .update({
      phone: data.phone,
      contact_name: data.contact_name,
      company_name: data.company_name,
      high_intent: true,
    })
    .eq('id', leadId);

  if (error) throw new Error(`Failed to submit intent: ${error.message}`);
  return { success: true };
}

export async function trackEvent(auditId: string | null, eventType: string, eventData: Record<string, unknown> = {}) {
  await supabase.from('analytics_events').insert({
    audit_id: auditId,
    event_type: eventType,
    event_data: eventData,
  });
}
