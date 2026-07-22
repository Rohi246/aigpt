import { resolveAndValidateHost } from './url';

const TIMEOUT_MS = 12000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB per page
const MAX_PAGES = 5;

interface FetchResult {
  url: string;
  status: number;
  html: string;
  finalUrl: string;
  contentType: string;
}

async function fetchWithTimeout(
  url: string
): Promise<FetchResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AIAdoptionAudit/1.0; +https://aiadoptionaudit.app/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('xml')) {
      return null;
    }
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    const bytes = Buffer.concat(chunks);
    const html = bytes.toString('utf8');
    return {
      url,
      status: res.status,
      html,
      finalUrl: res.url || url,
      contentType,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function findLinks(html: string, base: string): string[] {
  const links = new Set<string>();
  const re = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  let baseObj: URL;
  try {
    baseObj = new URL(base);
  } catch {
    return [];
  }
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;
    try {
      const resolved = new URL(href, baseObj).toString();
      if (resolved.startsWith('http')) links.add(resolved);
    } catch {
      // ignore
    }
  }
  return Array.from(links);
}

function findPageLinks(html: string, base: string): string[] {
  const all = findLinks(html, base);
  const sameHost = all.filter((u) => {
    try {
      return new URL(u).hostname === new URL(base).hostname;
    } catch {
      return false;
    }
  });
  const wanted: string[] = [];
  const lower = sameHost.map((u) => u.toLowerCase());
  const pick = (kw: string[]) => {
    for (const k of kw) {
      const found = lower.find((u) => u.includes(k));
      if (found) {
        const original = sameHost[lower.indexOf(found)];
        if (original && !wanted.includes(original)) wanted.push(original);
      }
    }
  };
  pick(['about', 'about-us']);
  pick(['services', 'service', 'treatments', 'menu']);
  pick(['contact', 'contact-us', 'get-in-touch']);
  pick(['book', 'booking', 'appointment', 'schedule', 'reserve', 'reservation']);
  pick(['team', 'staff', 'doctors', 'dentists']);
  return wanted.slice(0, MAX_PAGES);
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, ' ').slice(0, 300) : '';
}

function extractMetas(html: string): Record<string, string> {
  const metas: Record<string, string> = {};
  const re = /<meta\s+([^>]+)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const nameMatch =
      attrs.match(/name=["']([^"']+)["']/i) ||
      attrs.match(/property=["']([^"']+)["']/i);
    const contentMatch = attrs.match(/content=["']([^"']*)["']/i);
    if (nameMatch && contentMatch) {
      metas[nameMatch[1].toLowerCase()] = contentMatch[1];
    }
  }
  return metas;
}

function extractJsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(parsed);
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return out;
}

function extractScripts(html: string): string[] {
  const out: string[] = [];
  const re = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1]);
  }
  // inline scripts content (for fingerprinting vendor globals)
  const inlineRe = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let im: RegExpExecArray | null;
  let inlineConcat = '';
  let count = 0;
  while ((im = inlineRe.exec(html)) !== null && count < 50) {
    inlineConcat += '\n' + im[1];
    count++;
  }
  out.push(inlineConcat);
  return out;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPhoneNumbers(text: string): string[] {
  const re = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(re) || [];
  return Array.from(new Set(matches.map((m) => m.trim()))).slice(0, 10);
}

function extractBookingLinks(html: string, links: string[]): string[] {
  const out: string[] = [];
  const kw = ['calendly', 'acuity', 'cal.com', 'setmore', 'mindbody', 'vagaro', 'fresha', 'booksy', 'bookafirm', 'opentable', 'resy', 'book', 'appointment', 'schedule', 'reserve'];
  const lower = links.map((l) => l.toLowerCase());
  for (const l of lower) {
    if (kw.some((k) => l.includes(k))) out.push(l);
  }
  return Array.from(new Set(out)).slice(0, 10);
}

function extractWhatsapp(html: string, links: string[]): string[] {
  const out: string[] = [];
  for (const l of links) {
    if (l.toLowerCase().includes('wa.me') || l.toLowerCase().includes('whatsapp')) {
      out.push(l);
    }
  }
  // also check inline
  if (/whatsapp/i.test(html) && /wa\.me|whatsapp/.test(html.toLowerCase())) {
    const re = /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/gi;
    const m = html.match(re);
    if (m) out.push(...m);
  }
  return Array.from(new Set(out)).slice(0, 10);
}

function extractChatWidgets(html: string, scripts: string[]): string[] {
  const vendors = ['intercom', 'tidio', 'drift', 'crisp', 'zendesk', 'chatbase', 'tawk', 'livechat', 'hubspot', 'freshchat', 'olark', 'chatra', 'qualified'];
  const found: string[] = [];
  const haystack = (html + ' ' + scripts.join(' ')).toLowerCase();
  for (const v of vendors) {
    if (haystack.includes(v)) found.push(v);
  }
  return Array.from(new Set(found)).slice(0, 10);
}

function extractReviewWidgets(html: string, scripts: string[]): string[] {
  const vendors = ['podium', 'birdeye', 'nicejob', 'gatherup', 'grade.us', 'reputation.com', 'reviews.io', 'trustpilot', 'yotpo'];
  const found: string[] = [];
  const haystack = (html + ' ' + scripts.join(' ')).toLowerCase();
  for (const v of vendors) {
    if (haystack.includes(v)) found.push(v);
  }
  return Array.from(new Set(found)).slice(0, 10);
}

export interface ScannedPage {
  url: string;
  title: string;
  description: string;
  text: string;
  html: string;
  status: number;
}

export interface ScanData {
  url: string;
  normalizedUrl: string;
  pages: ScannedPage[];
  html: string;
  scripts: string[];
  metas: Record<string, string>;
  jsonLd: any[];
  links: string[];
  forms: number;
  buttons: number;
  visibleText: string;
  title: string;
  description: string;
  phoneNumbers: string[];
  bookingLinks: string[];
  whatsappLinks: string[];
  chatWidgets: string[];
  reviewWidgets: string[];
}

export async function scanWebsite(rawUrl: string): Promise<ScanData | null> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = parsed.hostname;
  const hostCheck = await resolveAndValidateHost(host);
  if (!hostCheck.ok) return null;

  const home = await fetchWithTimeout(rawUrl);
  if (!home || home.html.length < 200) return null;

  const pages: ScannedPage[] = [
    {
      url: home.finalUrl,
      title: extractTitle(home.html),
      description: extractMetas(home.html)['description'] || '',
      text: stripTags(home.html).slice(0, 20000),
      html: home.html,
      status: home.status,
    },
  ];

  const subLinks = findPageLinks(home.html, home.finalUrl);
  const fetchedUrls = new Set([home.finalUrl]);
  for (const link of subLinks) {
    if (pages.length >= MAX_PAGES) break;
    const abs = link;
    if (fetchedUrls.has(abs)) continue;
    fetchedUrls.add(abs);
    const page = await fetchWithTimeout(abs);
    if (page && page.html.length > 200) {
      pages.push({
        url: page.finalUrl,
        title: extractTitle(page.html),
        description: extractMetas(page.html)['description'] || '',
        text: stripTags(page.html).slice(0, 15000),
        html: page.html,
        status: page.status,
      });
    }
  }

  const allHtml = pages.map((p) => p.html).join('\n');
  const allText = pages.map((p) => p.text).join('\n');
  const allLinks = Array.from(new Set(pages.flatMap((p) => findLinks(p.html, p.url))));
  const scripts = extractScripts(allHtml);
  const metas = extractMetas(allHtml);
  const jsonLd = extractJsonLd(allHtml);
  const forms = (allHtml.match(/<form[\s>]/gi) || []).length;
  const buttons = (allHtml.match(/<button[\s>]/gi) || []).length;

  return {
    url: rawUrl,
    normalizedUrl: home.finalUrl,
    pages,
    html: allHtml,
    scripts,
    metas,
    jsonLd,
    links: allLinks,
    forms,
    buttons,
    visibleText: allText.slice(0, 30000),
    title: pages[0].title,
    description: pages[0].description,
    phoneNumbers: extractPhoneNumbers(allText),
    bookingLinks: extractBookingLinks(allHtml, allLinks),
    whatsappLinks: extractWhatsapp(allHtml, allLinks),
    chatWidgets: extractChatWidgets(allHtml, scripts),
    reviewWidgets: extractReviewWidgets(allHtml, scripts),
  };
}
