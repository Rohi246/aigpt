export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<{ ok: boolean; error?: string }>;
}

/**
 * Logs emails to console when no provider is configured.
 * Swap in Resend/SendGrid/Postmark by implementing EmailProvider.
 */
export class ConsoleEmailProvider implements EmailProvider {
  name = 'console';
  async send(message: EmailMessage): Promise<{ ok: boolean; error?: string }> {
    console.log('[email]', message.to, message.subject);
    return { ok: true };
  }
}

export class ResendEmailProvider implements EmailProvider {
  name = 'resend';
  apiKey: string;
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
  }
  async send(message: EmailMessage): Promise<{ ok: boolean; error?: string }> {
    if (!this.apiKey) return { ok: false, error: 'RESEND_API_KEY not set' };
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'AI Adoption Audit <audit@aiadoptionaudit.app>',
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        return { ok: false, error: `Resend error ${res.status}: ${t.slice(0, 120)}` };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!provider) {
    if (process.env.RESEND_API_KEY) provider = new ResendEmailProvider();
    else provider = new ConsoleEmailProvider();
  }
  return provider;
}

export async function sendReportEmail(to: string, auditId: string, businessName: string, reportUrl: string) {
  const p = getEmailProvider();
  const html = `
<div style="font-family:Inter,system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;background:#faf9f6;padding:32px;border-radius:12px;">
  <h1 style="color:#1a2238;font-size:22px;margin:0 0 8px;">Your AI Adoption Audit is ready</h1>
  <p style="color:#4a4a4a;font-size:15px;line-height:1.6;">Here is the personalized AI Adoption &amp; Opportunity Audit for <strong>${escapeHtml(businessName)}</strong>.</p>
  <p style="margin:24px 0;">
    <a href="${reportUrl}" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View My Full Audit</a>
  </p>
  <p style="color:#6b6b6b;font-size:13px;line-height:1.6;">This link opens your complete report. No password needed.</p>
  <hr style="border:none;border-top:1px solid #e5e2db;margin:24px 0;" />
  <p style="color:#9a9a9a;font-size:12px;">AI Adoption Audit — See how AI-ready your business is.</p>
</div>`;
  return p.send({
    to,
    subject: `Your AI Adoption Audit for ${businessName} is ready`,
    html,
    text: `Your AI Adoption Audit for ${businessName} is ready. View it here: ${reportUrl}`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
