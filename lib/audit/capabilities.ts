import type { AuditConfig, CapabilityResult, CapabilityStatus, DetectedTechnology, ScanData, Signal } from './types';

export function mapCapabilities(
  config: AuditConfig,
  technologies: DetectedTechnology[],
  data: ScanData,
  signals: Signal[]
): CapabilityResult[] {
  const byCap = new Map<string, DetectedTechnology[]>();
  for (const t of technologies) {
    if (!t.capability_id) continue;
    const arr = byCap.get(t.capability_id) || [];
    arr.push(t);
    byCap.set(t.capability_id, arr);
  }

  const results: CapabilityResult[] = [];
  for (const cap of config.capabilities) {
    const techs = byCap.get(cap.id) || [];
    const hasSignal = signals.some((s) => s.type === cap.id);
    let status: CapabilityStatus;
    let evidence: string;
    let confidence: 'high' | 'medium' | 'low';

    if (techs.length > 0) {
      status = 'detected';
      confidence = techs[0].confidence;
      evidence = techs
        .map((t) => `${t.label}: ${t.evidence}`)
        .join(' ');
    } else if (hasSignal) {
      status = 'detected';
      confidence = 'medium';
      evidence = signals.find((s) => s.type === cap.id)?.evidence || 'Detected via website signals.';
    } else {
      // Heuristic fallbacks for capabilities detectable via links/text
      const heur = heuristicCheck(cap.id, data);
      if (heur.detected) {
        status = 'detected';
        confidence = heur.confidence;
        evidence = heur.evidence;
      } else {
        status = 'not_detected';
        confidence = 'medium';
        evidence = 'We could not detect evidence of this capability on the analyzed website.';
      }
    }

    results.push({
      id: cap.id,
      label: cap.label,
      category: cap.category,
      status,
      confidence,
      technologies: techs,
      evidence,
    });
  }
  return results;
}

function heuristicCheck(
  capId: string,
  data: ScanData
): { detected: boolean; confidence: 'high' | 'medium' | 'low'; evidence: string } {
  const html = data.html.toLowerCase();
  const text = data.visibleText.toLowerCase();
  const links = data.links.join(' ').toLowerCase();

  switch (capId) {
    case 'online_booking':
      if (data.bookingLinks.length > 0) {
        return { detected: true, confidence: 'high', evidence: `Booking link detected: ${data.bookingLinks[0]}` };
      }
      if (/book (now|online|appointment|your)|schedule (now|appointment|online)|reserve (now|a table)/i.test(text)) {
        return { detected: true, confidence: 'medium', evidence: 'Booking-related call-to-action found in visible text.' };
      }
      return { detected: false, confidence: 'medium', evidence: '' };
    case 'website_chat':
      if (data.chatWidgets.length > 0) {
        return { detected: true, confidence: 'high', evidence: `Chat widget detected: ${data.chatWidgets.join(', ')}` };
      }
      return { detected: false, confidence: 'medium', evidence: '' };
    case 'sms_whatsapp_followup':
      if (data.whatsappLinks.length > 0) {
        return { detected: true, confidence: 'high', evidence: `WhatsApp link detected: ${data.whatsappLinks[0]}` };
      }
      return { detected: false, confidence: 'medium', evidence: '' };
    case 'analytics':
      if (/google-analytics|gtag|googletagmanager|fbq|hotjar|clarity|mixpanel|matomo|plausible/i.test(html)) {
        return { detected: true, confidence: 'high', evidence: 'Analytics tracking script detected in page source.' };
      }
      return { detected: false, confidence: 'medium', evidence: '' };
    case 'review_management':
      if (data.reviewWidgets.length > 0) {
        return { detected: true, confidence: 'high', evidence: `Review widget detected: ${data.reviewWidgets.join(', ')}` };
      }
      return { detected: false, confidence: 'medium', evidence: '' };
    case 'lead_qualification':
      if (data.forms > 0) {
        return { detected: true, confidence: 'low', evidence: `${data.forms} form(s) detected; form may qualify leads.` };
      }
      return { detected: false, confidence: 'medium', evidence: '' };
    case 'crm_marketing_automation':
      if (/hubspot|salesforce|gohighlevel|zoho|pipedrive|activecampaign|mailchimp|klaviyo|marketo|infusionsoft|keap/i.test(html)) {
        return { detected: true, confidence: 'high', evidence: 'CRM or marketing automation script detected in page source.' };
      }
      return { detected: false, confidence: 'medium', evidence: '' };
    case 'ai_voice_receptionist':
      // hard to detect from website alone
      return { detected: false, confidence: 'low', evidence: '' };
    case 'missed_call_recovery':
      // not directly observable from website
      return { detected: false, confidence: 'low', evidence: '' };
    case 'ai_lead_capture':
      return { detected: false, confidence: 'low', evidence: '' };
    case 'ai_customer_support':
      return { detected: false, confidence: 'low', evidence: '' };
    case 'ai_content_marketing':
      return { detected: false, confidence: 'low', evidence: '' };
    case 'ai_search_faq':
      if (/algolia|elastic|swiftype|site search|faq search/i.test(html)) {
        return { detected: true, confidence: 'medium', evidence: 'Search functionality detected on the website.' };
      }
      return { detected: false, confidence: 'low', evidence: '' };
    case 'personalization':
      if (/optimizely|dynamic yield|mutiny|bloomreach/i.test(html)) {
        return { detected: true, confidence: 'high', evidence: 'Personalization platform detected in page source.' };
      }
      return { detected: false, confidence: 'low', evidence: '' };
    case 'automated_review_requests':
      // not directly observable
      return { detected: false, confidence: 'low', evidence: '' };
    default:
      return { detected: false, confidence: 'low', evidence: '' };
  }
}
