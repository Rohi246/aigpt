import type { BusinessClassification } from './types';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmProvider {
  name: string;
  completeJson(messages: LlmMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<any>;
}

/**
 * OpenAI-compatible provider. Works with OpenAI, OpenRouter, Groq, Together, etc.
 * Configured via OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL env vars.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  name = 'openai-compatible';
  apiKey: string;
  baseUrl: string;
  model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async completeJson(messages: LlmMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 800,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('LLM returned empty content');
    return JSON.parse(content);
  }
}

let provider: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (!provider) {
    provider = new OpenAiCompatibleProvider();
  }
  return provider;
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function classifyBusiness(input: {
  title: string;
  description: string;
  text: string;
  url: string;
  jsonLd: any[];
  signals: { type: string; value: string }[];
}): Promise<BusinessClassification> {
  const fallback: BusinessClassification = {
    business_name: deriveBusinessName(input.title, input.url),
    industry: 'professional_services',
    business_type: 'local_service',
    location: '',
    services: [],
    target_customer: 'local customers',
  };

  if (!isLlmConfigured()) {
    return heuristicClassify(input, fallback);
  }

  const provider = getLlmProvider();
  const industries = [
    'real_estate','dental','medical','med_spa','hvac','plumbing','roofing',
    'legal','accounting','insurance','automotive','restaurants','fitness',
    'beauty','home_services','ecommerce','professional_services',
  ];

  const textSnippet = input.text.slice(0, 4000);
  const jsonLdSnippet = JSON.stringify(input.jsonLd.slice(0, 3)).slice(0, 1500);
  const signalsSnippet = JSON.stringify(input.signals.slice(0, 10)).slice(0, 800);

  const system = `You are a business classification engine. You classify a business based on its website content. Return STRICT JSON only. Never invent technologies or capabilities. Only use the provided industry list. If unsure, use "professional_services".`;

  const user = `Classify this business. Return JSON with keys: business_name, industry (one of: ${industries.join(', ')}), business_type (e.g. local_service, ecommerce, saas, marketplace, agency), location (city/state if detectable else ""), services (array of up to 6 short service names), target_customer.

Website URL: ${input.url}
Title: ${input.title}
Meta description: ${input.description}
Page text (excerpt): ${textSnippet}
Structured data: ${jsonLdSnippet}
Signals: ${signalsSnippet}

Return ONLY valid JSON.`;

  try {
    const result = await provider.completeJson(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.2, maxTokens: 600 }
    );
    return {
      business_name: String(result.business_name || fallback.business_name).slice(0, 200),
      industry: industries.includes(String(result.industry)) ? String(result.industry) : fallback.industry,
      business_type: String(result.business_type || fallback.business_type).slice(0, 80),
      location: String(result.location || '').slice(0, 200),
      services: Array.isArray(result.services) ? result.services.map((s: any) => String(s)).slice(0, 6) : [],
      target_customer: String(result.target_customer || fallback.target_customer).slice(0, 120),
    };
  } catch {
    return heuristicClassify(input, fallback);
  }
}

function deriveBusinessName(title: string, url: string): string {
  if (title) {
    const parts = title.split(/[-|–·]/).map((p) => p.trim());
    return (parts[0] || title).slice(0, 120);
  }
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').split('.')[0].replace(/^./, (c) => c.toUpperCase());
  } catch {
    return 'Your Business';
  }
}

function heuristicClassify(
  input: { title: string; description: string; text: string; url: string },
  fallback: BusinessClassification
): BusinessClassification {
  const t = (input.title + ' ' + input.description + ' ' + input.text.slice(0, 2000)).toLowerCase();
  const map: Record<string, string[]> = {
    dental: ['dental', 'dentist', 'orthodont', 'teeth', 'implant', 'cosmetic dent'],
    medical: ['medical', 'clinic', 'doctor', 'physician', 'urgent care', 'pediatric', 'chiropract', 'physical therapy'],
    med_spa: ['med spa', 'medspa', 'aesthetic', 'botox', 'filler', 'wellness clinic'],
    hvac: ['hvac', 'heating', 'air conditioning', 'cooling', 'furnace'],
    plumbing: ['plumb', 'drain', 'leak', 'water heater'],
    roofing: ['roof', 'roofing', 'shingle'],
    real_estate: ['real estate', 'realtor', 'realty', 'property', 'listings', 'broker'],
    legal: ['law', 'attorney', 'legal', 'lawyer', 'law firm'],
    accounting: ['accounting', 'cpa', 'tax', 'bookkeeping', 'audit'],
    insurance: ['insurance', 'coverage', 'policy', 'claims'],
    automotive: ['auto', 'car', 'vehicle', 'repair', 'detailing', 'tire', 'oil change'],
    restaurants: ['restaurant', 'menu', 'dining', 'cafe', 'bar', 'kitchen', 'cuisine'],
    fitness: ['gym', 'fitness', 'studio', 'personal train', 'yoga', 'pilates'],
    beauty: ['salon', 'hair', 'barber', 'nail', 'spa', 'beauty'],
    home_services: ['contractor', 'handyman', 'remodel', 'renovation', 'cleaning service'],
    ecommerce: ['shop', 'store', 'cart', 'product', 'buy now', 'add to cart'],
  };
  let best = 'professional_services';
  let bestScore = 0;
  for (const [ind, kws] of Object.entries(map)) {
    let score = 0;
    for (const kw of kws) if (t.includes(kw)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = ind;
    }
  }
  return { ...fallback, industry: best };
}
