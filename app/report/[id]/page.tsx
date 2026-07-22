'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/audit/logo';
import { ScoreRing } from '@/components/audit/score-ring';
import { StatusBadge } from '@/components/audit/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Layers,
  Phone,
  Mail,
  Globe,
  Building2,
  MapPin,
  ArrowLeft,
  Wrench,
} from 'lucide-react';

interface Report {
  business: {
    business_name: string;
    industry: string;
    business_type: string;
    location: string;
    services: string[];
  };
  technologies: any[];
  capabilities: any[];
  signals: any[];
  opportunities: any[];
  recommendations: any[];
  adoption: any[];
  adoption_score: number;
  opportunity_score: number;
  score_breakdown: any[];
  executive_summary: string;
}

export default function ReportPage() {
  const params = useParams();
  const auditId = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentOpen, setIntentOpen] = useState<string | null>(null);
  const [intentData, setIntentData] = useState({ name: '', email: '', phone: '', website: '', requestedService: '', budget: '', timeline: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auditId) return;
    fetch(`/api/audit/status?id=${auditId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.report) {
          setReport(data.report);
        } else {
          setError(data.error || 'Report not unlocked yet.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load report.');
        setLoading(false);
      });
  }, [auditId]);

  const submitIntent = async () => {
    if (!intentData.name || !intentData.email || !intentData.phone || !intentData.requestedService) {
      toast.error('Please fill in your name, email, phone, and the service you want help with.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/audit/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, ...intentData, requestedService: intentData.requestedService || intentOpen }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not submit request.');
        setSubmitting(false);
        return;
      }
      toast.success('Request submitted. We will be in touch.');
      setIntentOpen(null);
    } catch {
      toast.error('Network error.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <AlertCircle className="h-10 w-10 text-warning" />
        <h2 className="font-display text-xl font-semibold text-primary">{error || 'Report unavailable'}</h2>
        <p className="text-sm text-muted-foreground">This report may not be unlocked yet, or the link is invalid.</p>
        <Button asChild variant="outline">
          <a href="/">Back to home</a>
        </Button>
      </div>
    );
  }

  const detected = report.capabilities.filter((c) => c.status === 'detected');
  const notDetected = report.capabilities.filter((c) => c.status !== 'detected');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <a href="/"><ArrowLeft className="mr-1.5 h-4 w-4" /> New audit</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Overview */}
        <section className="animate-fade-in-up">
          <div className="flex flex-col gap-1.5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Adoption &amp; Opportunity Audit</div>
            <h1 className="font-display text-3xl font-bold text-primary">{report.business.business_name || 'Your Business'}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {report.business.industry && <span className="capitalize">{report.business.industry.replace(/_/g, ' ')}</span>}
              {report.business.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {report.business.location}</span>}
              {report.business.business_type && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {report.business.business_type.replace(/_/g, ' ')}</span>}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-premium">
              <ScoreRing score={report.adoption_score} label="AI Adoption Score" sublabel="Detected digital & AI capabilities" variant="adoption" size={150} />
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-premium">
              <ScoreRing score={report.opportunity_score} label="AI Opportunity Score" sublabel="Industry-relative gaps" variant="opportunity" size={150} />
            </div>
          </div>

          {/* Score breakdown */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-premium">
            <h3 className="font-display text-base font-semibold text-primary">Score breakdown</h3>
            <div className="mt-4 space-y-3">
              {report.score_breakdown.map((b) => (
                <div key={b.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{b.label}</span>
                    <span className="text-muted-foreground tabular-nums">{b.points}/{b.max}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${(b.points / b.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-5">
            <p className="text-sm leading-relaxed text-foreground">{report.executive_summary}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              This score reflects detectable digital and AI-enabled capabilities on your website. It does not measure internal AI usage that cannot be observed publicly.
            </p>
          </div>
        </section>

        {/* What we detected */}
        <section className="mt-12 animate-fade-in-up">
          <h2 className="font-display text-2xl font-bold text-primary">What we detected</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Technologies and capabilities found on your website, with evidence.
          </p>
          {detected.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              We could not detect any of the tracked digital or AI capabilities on your website. This does not mean you do not use them internally — only that they were not publicly observable.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {detected.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-premium">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{c.label}</h3>
                      <p className="text-xs text-muted-foreground">{c.category}</p>
                    </div>
                    <StatusBadge status="detected" confidence={c.confidence} />
                  </div>
                  {c.technologies && c.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.technologies.map((t: any) => (
                        <span key={t.id} className="rounded-md bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.evidence}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Not detected */}
        {notDetected.length > 0 && (
          <section className="mt-10 animate-fade-in-up">
            <h3 className="font-display text-lg font-semibold text-primary">Not detected on your website</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {notDetected.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background-subtle px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{c.label}</span>
                  <StatusBadge status={c.status} confidence={c.confidence} compact />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technologies list */}
        {report.technologies.length > 0 && (
          <section className="mt-10 animate-fade-in-up">
            <h3 className="font-display text-lg font-semibold text-primary">All detected technologies</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.technologies.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm shadow-premium">
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  <span className="font-medium text-foreground">{t.label}</span>
                  {t.category && <span className="text-xs text-muted-foreground">· {t.category}</span>}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Opportunities */}
        <section className="mt-12 animate-fade-in-up">
          <h2 className="font-display text-2xl font-bold text-primary">AI &amp; automation opportunities</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            High-impact capabilities missing from your website, ranked by industry relevance.
          </p>
          <div className="mt-5 space-y-4">
            {report.opportunities.map((o, i) => (
              <div key={o.capability_id} className="rounded-xl border border-border bg-card p-5 shadow-premium">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{i + 1}</span>
                      <h3 className="font-display text-lg font-semibold text-primary">{o.label}</h3>
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{o.why_it_matters}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Industry relevance: <span className="font-medium text-foreground capitalize">{o.industry_relevance}</span>
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Potential impact: <span className="font-medium text-foreground capitalize">{o.potential_impact}</span>
                      </span>
                      <StatusBadge status={o.status} compact />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setIntentData({ ...intentData, requestedService: o.label });
                      setIntentOpen(o.label);
                      fetch('/api/audit/analytics', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ event: 'recommendation_clicked', auditId, metadata: { name: o.label } }),
                      }).catch(() => null);
                    }}
                  >
                    <Wrench className="mr-1.5 h-3.5 w-3.5" /> Get help implementing
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Industry adoption */}
        {report.adoption.length > 0 && (
          <section className="mt-12 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold text-primary">Industry adoption</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Among analyzed websites in your industry. Clearly labeled — never fabricated.
            </p>
            <div className="mt-5 space-y-3">
              {report.adoption.map((a) => (
                <div key={a.capability_id} className="rounded-xl border border-border bg-card p-5 shadow-premium">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{a.label}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.adoption_pct != null
                          ? `${a.adoption_pct}% of ${a.sample_size ? a.sample_size.toLocaleString() : ''} analyzed ${report.business.industry.replace(/_/g, ' ')} websites`
                          : 'Industry adoption data unavailable'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.trend && a.trend !== 'unknown' && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
                          <TrendingUp className="h-3.5 w-3.5" /> {a.trend}
                        </span>
                      )}
                      <StatusBadge status={a.your_status} compact />
                    </div>
                  </div>
                  {a.adoption_pct != null && (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${a.adoption_pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top 2 recommendations */}
        <section className="mt-12 animate-fade-in-up">
          <h2 className="font-display text-2xl font-bold text-primary">Top 2 recommendations</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Exactly two tools or services recommended for your business.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {report.recommendations.map((r, i) => (
              <div key={i} className="flex flex-col rounded-2xl border border-accent/25 bg-card p-6 shadow-premium-lg">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
                  <h3 className="font-display text-lg font-semibold text-primary">{r.name}</h3>
                </div>
                {r.category && <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">{r.category}</p>}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.why_it_fits}</p>
                {r.best_for && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Best for:</span> {r.best_for}
                  </p>
                )}
                <Button
                  className="mt-4"
                  onClick={() => {
                    setIntentData({ ...intentData, requestedService: r.name });
                    setIntentOpen(r.name);
                    fetch('/api/audit/analytics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ event: 'recommendation_clicked', auditId, metadata: { name: r.name } }),
                    }).catch(() => null);
                  }}
                >
                  <Wrench className="mr-1.5 h-4 w-4" /> Get help implementing
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Trust note */}
        <section className="mt-12 rounded-2xl border border-border bg-background-subtle p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            <div>
              <h3 className="font-semibold text-primary">About this audit</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                This report is based on publicly observable signals from your website. We detect what is visible —
                scripts, tags, links, structured data, and forms. We never claim to know whether your business uses AI
                internally. Capabilities are marked &quot;detected&quot;, &quot;not detected&quot;, or &quot;unable to verify&quot; based on evidence.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Intent modal */}
      {intentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-premium-lg animate-fade-in-up">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-primary">Get help implementing</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Request help with <span className="font-medium text-foreground">{intentOpen}</span>. We&apos;ll follow up to discuss your needs.
                </p>
              </div>
              <button
                onClick={() => setIntentOpen(null)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="i-name">Name *</Label>
                  <Input id="i-name" value={intentData.name} onChange={(e) => setIntentData({ ...intentData, name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="i-phone">Phone *</Label>
                  <Input id="i-phone" type="tel" value={intentData.phone} onChange={(e) => setIntentData({ ...intentData, phone: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label htmlFor="i-email">Email *</Label>
                <Input id="i-email" type="email" value={intentData.email} onChange={(e) => setIntentData({ ...intentData, email: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="i-website">Business website</Label>
                <Input id="i-website" value={intentData.website} onChange={(e) => setIntentData({ ...intentData, website: e.target.value })} className="mt-1.5" placeholder={report.business.business_name ? 'https://' : ''} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="i-budget">Budget (optional)</Label>
                  <Input id="i-budget" value={intentData.budget} onChange={(e) => setIntentData({ ...intentData, budget: e.target.value })} className="mt-1.5" placeholder="e.g. $500-$2k/mo" />
                </div>
                <div>
                  <Label htmlFor="i-timeline">Timeline (optional)</Label>
                  <Input id="i-timeline" value={intentData.timeline} onChange={(e) => setIntentData({ ...intentData, timeline: e.target.value })} className="mt-1.5" placeholder="e.g. this month" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIntentOpen(null)}>Cancel</Button>
              <Button onClick={submitIntent} disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit request <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
