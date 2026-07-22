import { URL } from 'url';
import dns from 'dns/promises';
import net from 'net';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'ip6-localhost',
  'ip6-loopback',
  'broadcasthost',
]);

function isPrivateIp(ip: string): boolean {
  // IPv4
  if (net.isIPv4(ip)) {
    if (ip === '0.0.0.0') return true;
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true; // link-local
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true; // CGNAT
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 240.0.0.0/4 reserved
    if (parts[0] >= 240) return true;
    return false;
  }
  // IPv6
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  if (lower.startsWith('fe80')) return true; // link-local
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.slice(7);
    if (net.isIPv4(v4)) return isPrivateIp(v4);
  }
  return false;
}

export interface NormalizedUrl {
  ok: boolean;
  error?: string;
  url?: string;
  host?: string;
}

export function normalizeUrl(input: string): NormalizedUrl {
  if (!input || typeof input !== 'string') {
    return { ok: false, error: 'Please enter a website URL.' };
  }
  let raw = input.trim();
  if (!raw) return { ok: false, error: 'Please enter a website URL.' };
  if (!/^https?:\/\//i.test(raw)) {
    raw = 'https://' + raw;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: 'That does not look like a valid URL.' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only http and https URLs are allowed.' };
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || !host.includes('.')) {
    return { ok: false, error: 'Please enter a full domain name.' };
  }
  if (BLOCKED_HOSTS.has(host)) {
    return { ok: false, error: 'That host is not allowed.' };
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      return { ok: false, error: 'Private IP addresses are not allowed.' };
    }
  }
  // Strip common tracking params
  ['gclid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(
    (k) => parsed.searchParams.delete(k)
  );
  parsed.hash = '';
  return { ok: true, url: parsed.toString(), host };
}

export async function resolveAndValidateHost(host: string): Promise<NormalizedUrl> {
  try {
    const records = await dns.lookup(host, { all: true });
    if (records.length === 0) {
      return { ok: false, error: 'Could not resolve that domain.' };
    }
    for (const r of records) {
      if (isPrivateIp(r.address)) {
        return { ok: false, error: 'That domain resolves to a private address.' };
      }
    }
    return { ok: true, host };
  } catch {
    return { ok: false, error: 'Could not resolve that domain.' };
  }
}
