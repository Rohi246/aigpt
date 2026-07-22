'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MotionDiv, AnimatePresence } from '@/components/audit/motion';
import { Logo } from '@/components/audit/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Zap,
  BarChart3,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lock,
  Globe,
  Building2,
  TrendingUp,
  Target,
  Layers,
} from 'lucide-react';

type Stage = 'landing' | 'scanning' | 'teaser' | 'unlocked';

interface Teaser {
  auditId: string;
  status: string;
  businessName: string | null;
  industry: string | null;
  adoptionScore: number;
  opportunityScore: number;
  emailUnlocked: boolean;
  teaserCapabilities: { id: string; label: string; status: string }[];
  opportunityCount: number;
  report?: any;
}

const SCAN_STEPS = [
  { label: 'Analyzing your website...', icon: Globe },
  { label: 'Identifying your business type...', icon: Building2 },
  { label: 'Detecting digital tools...', icon: Layers },
  { label: 'Checking customer acquisition systems...', icon: Target },
  { label: 'Analyzing AI opportunities...', icon: Sparkles },
  { label: 'Preparing your report...', icon: BarChart3 },
];

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('landing');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [email, setEmail] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const startAudit = async () => {
    if (!url.trim()) {
      toast.error('Please enter your business website.');
      return;
    }
    setSubmitting(true);
    setStage('scanning');
    setScanStep(0);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not start the audit.');
        setStage('landing');
        setSubmitting(false);
        return;
      }
      setAuditId(data.auditId);
      if (data.status === 'completed') {
        await pollStatus(data.auditId);
      } else {
        // poll until completed
        pollLoop(data.auditId);
      }
    } catch (e) {
      toast.error('Network error. Please try again.');
      setStage('landing');
      setSubmitting(false);
    }
  };

  const pollLoop = async (id: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const done = await pollStatus(id);
      if (done || attempts > 40) clearInterval(interval);
    }, 2500);
  };

  const pollStatus = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/audit/status?id=${id}`);
      const data = await res.json();
      if (data.status === 'completed') {
        setTeaser(data);
        setStage('teaser');
        setSubmitting(false);
        return true;
      } else if (data.status === 'failed') {
        toast.error(data.error || 'The audit failed. Try a different URL.');
        setStage('landing');
        setSubmitting(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // advance scan step animation while submitting
  useEffect(() => {
    if (stage !== 'scanning') return;
    const t = setInterval(() => {
      setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(t);
  }, [stage]);

  const unlock = async () => {
    if (!email.trim() || !auditId) return;
    setUnlocking(true);
    try {
      const res = await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not unlock report.');
        setUnlocking(false);
        return;
      }
      // track event
      fetch('/api/audit/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'full_report_viewed', auditId }),
      }).catch(() => null);

      router.push(`/report/${auditId}`);
    } catch {
      toast.error('Network error.');
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AnimatePresence mode="wait">
        {stage === 'landing' && (
          <MotionDiv key="landing">
            <Landing url={url} setUrl={setUrl} onSubmit={startAudit} submitting={submitting} />
          </MotionDiv>
        )}
        {stage === 'scanning' && (
          <MotionDiv key="scanning">
            <Scanning step={scanStep} url={url} />
          </MotionDiv>
        )}
        {stage === 'teaser' && teaser && (
          <MotionDiv key="teaser">
            <TeaserView
              teaser={teaser}
              email={email}
              setEmail={setEmail}
              onUnlock={unlock}
              unlocking={unlocking}
            />
          </MotionDiv>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#sample" className="transition-colors hover:text-foreground">Sample report</a>
          <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
        </nav>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin">Admin</a>
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background-subtle">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Logo compact />
          <p className="text-xs text-muted-foreground">
            Free analysis · No credit card required · Powered by real website scanning
          </p>
        </div>
      </div>
    </footer>
  );
}

function Landing({
  url,
  setUrl,
  onSubmit,
  submitting,
}: {
  url: string;
  setUrl: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-premium">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-scan-pulse" />
              Real website analysis · Not a generic AI wrapper
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-primary text-balance sm:text-5xl md:text-6xl">
              How AI-ready is your business?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-balance">
              Enter your website and get a personalized AI Adoption &amp; Opportunity Audit.
              Discover the AI and automation systems your business already uses, what you&apos;re
              missing, and which solutions could help you compete in the next generation of local business.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
              className="mx-auto mt-8 max-w-xl"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="yourbusiness.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 pl-10 text-base shadow-premium"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-7 text-base font-semibold"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze My Business
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Free analysis · No credit card required
              </p>
            </form>
          </div>

          {/* Visual preview of report */}
          <div className="mx-auto mt-16 max-w-4xl">
            <ReportPreview />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60 bg-background-subtle py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-primary">A real audit, not a guess</h2>
            <p className="mt-3 text-muted-foreground">
              We scan your website with a technology detection engine, map what we find to business
              capabilities, and compare against your industry. Every finding includes evidence.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: 'Real website scan',
                body: 'We fetch your homepage and key pages, inspect HTML, scripts, metadata, structured data, links, and forms.',
              },
              {
                icon: Layers,
                title: 'Technology detection',
                body: 'A fingerprint engine identifies the tools you already use — from booking to chat to analytics to CRM.',
              },
              {
                icon: BarChart3,
                title: 'Industry benchmarking',
                body: 'Detected capabilities are scored and compared against your industry to surface the gaps that matter.',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-premium">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/5">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section id="sample" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-primary">What your audit includes</h2>
            <p className="mt-3 text-muted-foreground">
              A professional intelligence report — built from evidence found on your website.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BarChart3, title: 'AI Adoption Score', body: 'A transparent 0–100 score based on detectable digital and AI capabilities.' },
              { icon: TrendingUp, title: 'AI Opportunity Score', body: 'An industry-specific score measuring how many high-value capabilities are missing.' },
              { icon: Layers, title: 'Detected technologies', body: 'Every tool we detect, with evidence and confidence.' },
              { icon: Target, title: 'AI & automation opportunities', body: '3–5 high-impact opportunities, ranked by industry relevance.' },
              { icon: ShieldCheck, title: 'Industry adoption data', body: 'Where data exists, see how your business compares to peers.' },
              { icon: Sparkles, title: 'Top 2 recommendations', body: 'Exactly two tools or services recommended for your business.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5 shadow-premium">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <f.icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 bg-background-subtle py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-3xl font-bold text-primary text-center">FAQ</h2>
          <div className="mt-10 space-y-4">
            {[
              {
                q: 'Can the audit tell if we use AI internally?',
                a: 'No. We only detect what is publicly observable on your website. We never claim a business does or does not use AI internally. We say "detected", "not detected", or "unable to verify".',
              },
              {
                q: 'Is the analysis real?',
                a: 'Yes. We fetch your website, inspect its source, and run a technology fingerprint engine. Every finding is backed by evidence from your pages. We do not fabricate results.',
              },
              {
                q: 'What does it cost?',
                a: 'The audit is free. You get a teaser instantly and the full report after entering your email. No credit card required.',
              },
              {
                q: 'Do you share my data?',
                a: 'No. Your audit is stored so you can access your report. If you request help implementing a recommendation, we use your contact details to follow up.',
              },
            ].map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-card p-5 shadow-premium">
                <h3 className="font-semibold text-primary">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ReportPreview() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-premium-lg sm:p-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Sample Audit Report</div>
          <div className="font-display text-lg font-semibold text-primary">Riverside Dental Group</div>
        </div>
        <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
          Completed
        </div>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="flex items-center gap-5 rounded-xl bg-background-subtle p-5">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg width="80" height="80" className="-rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1a223822" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1a2238" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * 0.34} />
            </svg>
            <span className="absolute font-display text-xl font-bold text-primary">34</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">AI Adoption Score</div>
            <div className="text-xs text-muted-foreground">Detected capabilities</div>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-xl bg-background-subtle p-5">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg width="80" height="80" className="-rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#0e749033" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#0e7490" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * 0.18} />
            </svg>
            <span className="absolute font-display text-xl font-bold text-accent">82</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">AI Opportunity Score</div>
            <div className="text-xs text-muted-foreground">Industry-relative gaps</div>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {[
          { label: 'Online Booking', status: 'detected' },
          { label: 'Google Analytics', status: 'detected' },
          { label: 'AI Voice Receptionist', status: 'not_detected' },
          { label: 'AI Lead Capture', status: 'not_detected' },
        ].map((c) => (
          <div key={c.label} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5">
            <span className="text-sm font-medium text-foreground">{c.label}</span>
            {c.status === 'detected' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Detected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                <XCircle className="h-3.5 w-3.5" /> Not detected
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Scanning({ step, url }: { step: number; url: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16">
      <div className="relative mb-10 flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin-slow" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Search className="h-7 w-7 text-accent" />
        </div>
      </div>
      <h2 className="font-display text-2xl font-bold text-primary text-center">
        Analyzing {url}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        Scanning your website in real time. This usually takes under a minute.
      </p>
      <div className="mt-10 w-full max-w-md space-y-3">
        {SCAN_STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
                active
                  ? 'border-accent/40 bg-accent/5 shadow-premium'
                  : done
                  ? 'border-border bg-card opacity-70'
                  : 'border-border bg-card opacity-40'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  done
                    ? 'bg-success/15 text-success'
                    : active
                    ? 'bg-accent/15 text-accent'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-sm ${
                  active ? 'font-semibold text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function TeaserView({
  teaser,
  email,
  setEmail,
  onUnlock,
  unlocking,
}: {
  teaser: Teaser;
  email: string;
  setEmail: (v: string) => void;
  onUnlock: () => void;
  unlocking: boolean;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-success shadow-premium">
          <CheckCircle2 className="h-3.5 w-3.5" /> Audit complete
        </div>
        <h2 className="font-display text-3xl font-bold text-primary">
          Your AI Opportunity Score
        </h2>
        <p className="mt-2 text-muted-foreground">
          {teaser.businessName ? `For ${teaser.businessName}` : 'Your business'} ·{' '}
          {teaser.industry ? teaser.industry.replace(/_/g, ' ') : 'Analysis complete'}
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-premium">
          <ScoreRingMini score={teaser.adoptionScore} variant="adoption" />
          <div className="mt-3 text-sm font-semibold text-foreground">AI Adoption Score</div>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-premium">
          <ScoreRingMini score={teaser.opportunityScore} variant="opportunity" />
          <div className="mt-3 text-sm font-semibold text-foreground">AI Opportunity Score</div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-premium">
        <h3 className="font-display text-lg font-semibold text-primary">
          Your business has {teaser.opportunityCount} potential AI {teaser.opportunityCount === 1 ? 'opportunity' : 'opportunities'}
        </h3>
        <div className="mt-5 space-y-2.5">
          {teaser.teaserCapabilities.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">{c.label}</span>
              {c.status === 'detected' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Detected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Not detected
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Locked full report */}
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-premium-lg">
        <div className="absolute inset-0 z-10 backdrop-blur-md" />
        <div className="relative p-8">
          <div className="flex items-center gap-3 text-primary">
            <Lock className="h-5 w-5" />
            <h3 className="font-display text-xl font-bold">Your full audit is ready</h3>
          </div>
          <div className="mt-4 space-y-3 blur-sm">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-card via-card to-transparent p-8 pt-20">
          <div className="rounded-xl border border-accent/30 bg-card p-6 text-center shadow-premium">
            <h4 className="font-display text-lg font-semibold text-primary">
              Unlock My Full Audit
            </h4>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your email to unlock your complete personalized report.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUnlock();
              }}
              className="mx-auto mt-4 flex max-w-sm flex-col gap-3"
            >
              <Input
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
              <Button type="submit" size="lg" className="h-11 font-semibold" disabled={unlocking}>
                {unlocking ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    Unlock My Full Audit
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              We&apos;ll email you a link to your report. No spam.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function ScoreRingMini({ score, variant }: { score: number; variant: 'adoption' | 'opportunity' }) {
  const color = variant === 'opportunity' ? '#0e7490' : '#1a2238';
  const track = variant === 'opportunity' ? '#0e749033' : '#1a223822';
  const size = 120;
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, score / 100)));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={7} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}
