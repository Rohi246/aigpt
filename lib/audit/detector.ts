import type { AuditConfig, DetectedTechnology, Fingerprint, ScanData, Signal } from './types';

function fingerprintMatches(
  fp: Fingerprint,
  data: ScanData
): { matched: boolean; evidence: string } {
  const haystacks: string[] = [];
  if (fp.dom) haystacks.push(data.html.toLowerCase());
  if (fp.js) {
    haystacks.push(data.scripts.join('\n').toLowerCase());
    haystacks.push(data.html.toLowerCase());
  }
  if (fp.meta) {
    haystacks.push(
      Object.entries(data.metas)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
        .toLowerCase()
    );
  }
  const needle = (fp.dom || fp.js || fp.meta || '').toLowerCase();
  if (!needle) return { matched: false, evidence: '' };
  for (const h of haystacks) {
    if (h.includes(needle)) {
      const idx = h.indexOf(needle);
      const start = Math.max(0, idx - 40);
      const snippet = h.slice(start, idx + needle.length + 40).replace(/\s+/g, ' ').trim();
      return { matched: true, evidence: snippet ? `Found "${needle}" in page source.` : `Found "${needle}".` };
    }
  }
  return { matched: false, evidence: '' };
}

export function detectTechnologies(
  config: AuditConfig,
  data: ScanData
): { technologies: DetectedTechnology[]; signals: Signal[] } {
  const technologies: DetectedTechnology[] = [];
  const signals: Signal[] = [];

  for (const fp of config.fingerprints) {
    const { matched, evidence } = fingerprintMatches(fp, data);
    if (matched) {
      technologies.push({
        id: fp.id,
        label: fp.label,
        category: fp.category,
        capability_id: fp.capability_id,
        confidence: fp.confidence,
        evidence,
      });
    }
  }

  // Signals from structured data + links
  if (data.jsonLd.length > 0) {
    const types = new Set<string>();
    for (const j of data.jsonLd) {
      const t = j['@type'] || (Array.isArray(j) && j[0]?.['@type']);
      if (t) {
        if (Array.isArray(t)) t.forEach((x) => types.add(String(x)));
        else types.add(String(t));
      }
    }
    if (types.size > 0) {
      signals.push({
        type: 'structured_data',
        value: Array.from(types).join(', '),
        evidence: 'JSON-LD structured data found on the website.',
      });
    }
    // Try to extract business name / address from JSON-LD
    for (const j of data.jsonLd) {
      const obj = Array.isArray(j) ? j[0] : j;
      if (obj?.name && obj['@type'] && /business|organization|dentist|medical|restaurant|store/i.test(String(obj['@type']))) {
        signals.push({
          type: 'business_name',
          value: String(obj.name),
          evidence: 'Business name found in structured data.',
        });
      }
      if (obj?.address) {
        const a = obj.address;
        const addr = typeof a === 'string' ? a : [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(', ');
        if (addr) {
          signals.push({ type: 'location', value: addr, evidence: 'Address found in structured data.' });
        }
      }
    }
  }

  if (data.phoneNumbers.length > 0) {
    signals.push({
      type: 'phone',
      value: data.phoneNumbers[0],
      evidence: `Phone number detected: ${data.phoneNumbers[0]}`,
    });
  }
  if (data.bookingLinks.length > 0) {
    signals.push({
      type: 'booking_link',
      value: data.bookingLinks[0],
      evidence: `Booking link found: ${data.bookingLinks[0]}`,
    });
  }
  if (data.whatsappLinks.length > 0) {
    signals.push({
      type: 'whatsapp',
      value: data.whatsappLinks[0],
      evidence: `WhatsApp link found: ${data.whatsappLinks[0]}`,
    });
  }
  if (data.chatWidgets.length > 0) {
    signals.push({
      type: 'chat_widget',
      value: data.chatWidgets.join(', '),
      evidence: `Chat widget(s) detected: ${data.chatWidgets.join(', ')}`,
    });
  }
  if (data.reviewWidgets.length > 0) {
    signals.push({
      type: 'review_widget',
      value: data.reviewWidgets.join(', '),
      evidence: `Review widget(s) detected: ${data.reviewWidgets.join(', ')}`,
    });
  }
  if (data.forms > 0) {
    signals.push({
      type: 'contact_form',
      value: String(data.forms),
      evidence: `${data.forms} form(s) detected on the website.`,
    });
  }

  return { technologies, signals };
}
