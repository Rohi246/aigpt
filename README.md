# AI Adoption & Opportunity Audit

A production-grade SaaS web application that analyzes a local business website and generates a professional **AI Adoption & Opportunity Audit**. Built as a free lead-generation tool for local businesses.

> See how AI-ready your business is — and discover the AI opportunities you're missing.

## What it does

1. User enters their business website URL.
2. The system fetches and scans the website (homepage + key pages).
3. A technology fingerprint engine detects existing tools (chat, booking, CRM, analytics, etc.).
4. Detected technologies are mapped to business capabilities.
5. AI classifies the business's industry and type.
6. Deterministic scoring produces an **AI Adoption Score** and an industry-specific **AI Opportunity Score**.
7. A teaser result is shown immediately.
8. User enters their email to unlock the full report.
9. The full report shows detected technologies, capabilities, missing capabilities, AI opportunities, industry adoption data, and top 2 recommendations.
10. Users can optionally request implementation help (collects phone + contact info, marks lead as high-intent).
11. A protected admin dashboard shows metrics and the lead table.

Everything is real: real website scanning, real technology detection, real capability mapping, real database persistence, real email capture. No fabricated results.

## Tech stack

- **Frontend**: Vite + React, TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Supabase Edge Function (Deno runtime) — audit engine in `supabase/functions/audit-engine/`
- **Database**: Supabase / PostgreSQL (RLS-enabled)
- **AI**: Deterministic heuristic classification (industry detection via keyword analysis)

## Architecture

```
src/
  main.tsx                          # App entry with router
  index.css                         # Tailwind + global styles
  pages/
    LandingPage.tsx                 # Landing + URL input + scanning + teaser + email gate
    ReportPage.tsx                  # Full audit report dashboard
    AdminPage.tsx                   # Admin dashboard (metrics + leads)
  components/audit/
    ScoreRing.tsx                   # Circular score indicator
    StatusBadge.tsx                 # Detected / not detected / unable to verify
    Logo.tsx                        # Brand logo
  lib/
    api.ts                          # API helpers (startAudit, poll, unlock, intent, track)
    supabase/client.ts              # Supabase client + TypeScript types
supabase/
  functions/
    audit-engine/index.ts           # Edge function: scanner, detector, scorer, classifier
```

## Setup

### Prerequisites
- Node.js 18+
- A Supabase project (pre-provisioned in this environment)

### Frontend
```bash
npm install
npm run dev            # http://localhost:5173
```

### Database
The Supabase schema is applied via migration tool. Tables:
- `audits` — one row per website audit, stores the full report JSON
- `leads` — email capture + implementation-intent leads
- `analytics_events` — product analytics
- `industries`, `capabilities`, `technology_fingerprints`, `industry_capabilities`, `adoption_stats`, `recommendations` — extensible configuration

All tables have RLS enabled with `anon, authenticated` policies (public tool, no sign-in required).

## Extending the system

### Add a new technology fingerprint
Insert into the `technology_fingerprints` table:
```sql
INSERT INTO technology_fingerprints (id, label, category, capability_id, confidence, dom, js, meta)
VALUES ('my_tool', 'My Tool', 'Chat', 'website_chat', 'high', null, 'myToolGlobal', null);
```
- `dom` — substring to find in HTML
- `js` — substring to find in script tags / inline JS
- `meta` — substring to find in meta tags
- `capability_id` — which capability this maps to (null for informational-only)

### Add a new capability
```sql
INSERT INTO capabilities (id, label, category, description)
VALUES ('my_capability', 'My Capability', 'Category', 'Description');
```
Then add `industry_capabilities` rows to weight it per industry.

### Add a new industry
```sql
INSERT INTO industries (id, label, description) VALUES ('my_industry', 'My Industry', 'Description');
```
Then add `industry_capabilities`, `adoption_stats`, and `recommendations` rows for it.

### Add adoption data
```sql
INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source)
VALUES ('dental', 'ai_voice_receptionist', 8.4, 10000, 'growing', 'Internal scan data');
```
Leave `adoption_pct` null when no reliable data exists — the UI shows "Industry adoption data unavailable" instead of fabricating numbers.

### Add a recommendation
```sql
INSERT INTO recommendations (industry_id, capability_id, name, category, why_it_fits, best_for, priority)
VALUES ('dental', 'ai_voice_receptionist', 'AI Voice Receptionist', 'Communication', 'Why...', 'Best for...', 1);
```

## Security

- SSRF protection: URL validation, private IP blocking, local host blocking
- Request timeouts (12s per page)
- Max response size (2MB per page)
- Max crawl depth (5 pages)
- Safe HTML parsing, sanitized output
- No secrets in frontend (`VITE_*` only for anon key)
- Admin dashboard is read-only via public RLS (no destructive actions exposed)

## Language & honesty

The product never claims to know whether a business uses AI internally. Capabilities are marked:
- **Detected** — evidence found on the website
- **Not detected** — no evidence found (does not mean absent)
- **Unable to verify** — low confidence, could not determine

Adoption data is always labeled "among analyzed websites" and never presented as industry-wide fact.
