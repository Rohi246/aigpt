'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/audit/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart3,
  Users,
  Mail,
  TrendingUp,
  Wrench,
  ArrowLeft,
  Lock,
  Search,
} from 'lucide-react';

interface AdminData {
  metrics: {
    totalAudits: number;
    completedAudits: number;
    emailLeads: number;
    emailConversionRate: number;
    implementationRequests: number;
    events: Record<string, number>;
  };
  topIndustries: { industry: string; count: number }[];
  topOpportunities: { name: string; count: number }[];
  topRecommended: { name: string; count: number }[];
  topTechnologies: { name: string; count: number }[];
  leads: {
    id: string;
    business: string | null;
    website: string | null;
    industry: string | null;
    email: string;
    phone: string | null;
    requestedService: string | null;
    intent: string;
    adoptionScore: number | null;
    opportunityScore: number | null;
    createdAt: string;
  }[];
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterIntent, setFilterIntent] = useState('');

  const load = async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Unauthorized');
        setData(null);
      } else {
        setData(json);
        setAuthed(true);
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) load(token);
  }, []);

  const filteredLeads = (data?.leads || []).filter((l) => {
    if (filterIndustry && l.industry !== filterIndustry) return false;
    if (filterIntent && l.intent !== filterIntent) return false;
    return true;
  });

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-premium-lg">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Lock className="h-5 w-5" />
              <h1 className="font-display text-lg font-bold">Admin access</h1>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter the admin token to view the dashboard.
            </p>
            <Input
              type="password"
              placeholder="Admin token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(token)}
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <Button className="mt-4 w-full" onClick={() => load(token)} disabled={loading || !token}>
              {loading ? 'Loading...' : 'Sign in'}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="/"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <a href="/"><ArrowLeft className="mr-1.5 h-4 w-4" /> Home</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-primary">Admin dashboard</h1>

        {/* Metrics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={BarChart3} label="Total audits" value={m.totalAudits} />
          <MetricCard icon={Mail} label="Email leads" value={m.emailLeads} />
          <MetricCard icon={TrendingUp} label="Conversion rate" value={`${m.emailConversionRate}%`} />
          <MetricCard icon={Wrench} label="Implementation requests" value={m.implementationRequests} />
        </div>

        {/* Event counts */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(m.events || {}).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-card p-3 text-center shadow-premium">
              <div className="font-display text-xl font-bold text-primary tabular-nums">{v}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>

        {/* Top lists */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <TopList title="Top industries" items={data.topIndustries.map((i) => ({ name: i.industry.replace(/_/g, ' '), count: i.count }))} />
          <TopList title="Top opportunities" items={data.topOpportunities} />
          <TopList title="Top recommended services" items={data.topRecommended} />
          <TopList title="Top detected technologies" items={data.topTechnologies} />
        </div>

        {/* Lead table */}
        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-bold text-primary">Leads</h2>
            <div className="flex gap-2">
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All industries</option>
                {data.topIndustries.map((i) => (
                  <option key={i.industry} value={i.industry}>{i.industry.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <select
                value={filterIntent}
                onChange={(e) => setFilterIntent(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All intents</option>
                <option value="report_only">Report only</option>
                <option value="interested">Interested</option>
                <option value="implementation_requested">Implementation requested</option>
                <option value="matched">Matched</option>
                <option value="converted">Converted</option>
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-premium">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-subtle text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Industry</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Intent</th>
                  <th className="px-4 py-3 font-medium text-right">Scores</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No leads yet.</td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-background-subtle">
                      <td className="px-4 py-3 font-medium text-foreground">{l.business || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.website ? new URL(l.website).hostname.replace(/^www\./, '') : '—'}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{l.industry?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.phone || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.requestedService || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          l.intent === 'implementation_requested' ? 'bg-success/10 text-success' :
                          l.intent === 'interested' ? 'bg-warning/10 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {l.intent.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {l.adoptionScore ?? '—'}/{l.opportunityScore ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-premium">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-primary tabular-nums">{value}</div>
    </div>
  );
}

function TopList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = items.length > 0 ? items[0].count : 1;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-premium">
      <h3 className="font-display text-sm font-semibold text-primary">{title}</h3>
      <div className="mt-3 space-y-2.5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          items.map((it) => (
            <div key={it.name} className="flex items-center gap-3">
              <span className="w-32 truncate text-sm text-foreground">{it.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(it.count / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{it.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
