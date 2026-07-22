import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan, Search, Sparkles, TrendingUp, ShieldCheck, Zap, ArrowRight,
  CheckCircle2, AlertCircle, Lock, Loader2, Globe, BarChart3,
} from 'lucide-react';
import { LogoFull } from '../components/audit/Logo';
import { startAudit, pollAuditStatus, trackEvent, unlockReport } from '../lib/api';
import type { AuditRow, Teaser } from '../lib/supabase/client';
import { supabase } from '../lib/supabase/client';

type Phase = 'idle' | 'scanning' | 'teaser' | 'email_gate' | 'error';

const scanSteps = [
  { label: 'Fetching website pages', icon: Globe },
  { label: 'Detecting technologies', icon: Search },
  { label: 'Mapping business capabilities', icon: BarChart3 },
  { label: 'Classifying industry', icon: Sparkles },
  { label: 'Calculating AI adoption score', icon: TrendingUp },
];

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path fill="none" d="M1 1h22v22H1z" />
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setPhase('scanning');
    setScanStepIdx(0);
    setError('');

    const stepInterval = setInterval(() => {
      setScanStepIdx(prev => Math.min(prev + 1, scanSteps.length - 1));
    }, 800);

    try {
      const { auditId: id } = await startAudit(url.trim());
      setAuditId(id);
      trackEvent(id, 'audit_started', { url: url.trim() });

      // Safety timeout: if scan doesn't complete in 45s, show error
      timeoutRef.current = setTimeout(() => {
        clearInterval(stepInterval);
        if (pollRef.current) clearInterval(pollRef.current);
        setError('Scan timed out. The website may be blocking automated requests. Please try again.');
        setPhase('error');
      }, 45000);

      pollRef.current = setInterval(async () => {
        try {
          const data = await pollAuditStatus(id) as AuditRow | null;
          if (!data) return;

          if (data.status === 'complete' && data.teaser) {
            clearInterval(stepInterval);
            if (pollRef.current) clearInterval(pollRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setTeaser(data.teaser as Teaser);
            setPhase('teaser');
          } else if (data.status === 'error') {
            clearInterval(stepInterval);
            if (pollRef.current) clearInterval(pollRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setError(data.error || 'Scan failed');
            setPhase('error');
          }
        } catch {
          /* keep polling */
        }
      }, 2000);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      setPhase('error');
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !auditId) return;

    try {
      await unlockReport(auditId, email.trim());
      trackEvent(auditId, 'email_unlocked', { email: email.trim() });
      navigate(`/report/${auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock report');
    }
  };

  const handleGoogleAuth = async () => {
    if (!auditId) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?auditId=${auditId}`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google auth failed');
    }
  };

  const resetToIdle = () => {
    setPhase('idle');
    setUrl('');
    setTeaser(null);
    setAuditId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <LogoFull />
          <a href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Admin
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        {phase === 'idle' && (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Free AI Readiness Audit for Local Businesses
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 animate-slide-up">
              See how AI-ready your business is
            </h1>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto animate-slide-up">
              Enter your website URL and get a professional AI Adoption & Opportunity Audit.
              Discover the AI tools you're missing — in under 60 seconds.
            </p>
          </>
        )}

        {/* URL Input Form */}
        {(phase === 'idle' || phase === 'error') && (
          <form onSubmit={handleScan} className="max-w-xl mx-auto animate-scale-in">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yourbusiness.com"
                  className="input pl-11 text-left"
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary whitespace-nowrap">
                <Scan className="w-5 h-5" />
                Run Free Audit
              </button>
            </div>
            {phase === 'error' && (
              <div className="mt-4 flex items-center gap-2 text-error-600 text-sm justify-center">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <p className="mt-4 text-xs text-neutral-400">
              We scan your website's public pages. No login required. No data stored beyond your report.
            </p>
          </form>
        )}

        {/* Scanning State */}
        {phase === 'scanning' && (
          <div className="max-w-md mx-auto animate-scale-in">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary-100" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
                <Scan className="absolute inset-0 m-auto w-8 h-8 text-primary-600" />
              </div>
              <div className="w-full space-y-3">
                {scanSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const done = idx < scanStepIdx;
                  const active = idx === scanStepIdx;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 transition-all duration-300 ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-25'
                        }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${done ? 'bg-success-100 text-success-600' : active ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-400'
                        }`}>
                        {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-sm ${active ? 'font-medium text-neutral-900' : 'text-neutral-500'}`}>
                        {step.label}
                      </span>
                      {active && <Loader2 className="w-4 h-4 text-primary-500 animate-spin ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Teaser */}
        {phase === 'teaser' && teaser && (
          <div className="max-w-lg mx-auto animate-scale-in">
            <div className="card p-8">
              <div className="flex items-center gap-2 text-success-600 mb-4 justify-center">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Audit Complete</span>
              </div>

              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg width="128" height="128" className="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#e4e4e7" strokeWidth="10" />
                    <circle
                      cx="64" cy="64" r="56" fill="none" stroke="#2563eb" strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={2 * Math.PI * 56 - (teaser.adoption_score / 100) * 2 * Math.PI * 56}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-neutral-900">{teaser.adoption_score}</span>
                    <span className="text-xs text-neutral-500">AI Adoption Score</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-neutral-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-neutral-900">{teaser.detected_count}</div>
                  <div className="text-xs text-neutral-500">Technologies Detected</div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-neutral-900">{teaser.missing_count}</div>
                  <div className="text-xs text-neutral-500">Missing Capabilities</div>
                </div>
              </div>

              {teaser.top_opportunity_label && (
                <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-primary-700 text-sm font-medium mb-1">
                    <Zap className="w-4 h-4" />
                    Top AI Opportunity
                  </div>
                  <div className="text-neutral-700 text-sm">{teaser.top_opportunity_label}</div>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-6">
                <div className="flex items-center gap-2 text-neutral-700 mb-4">
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Enter your email or sign in to unlock the full report</span>
                </div>

                <button
                  onClick={handleGoogleAuth}
                  className="w-full bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors mb-4"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-neutral-500">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleUnlock} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="input"
                    required
                  />
                  <button type="submit" className="btn-primary w-full">
                    Unlock Full Report
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                <p className="mt-3 text-xs text-neutral-400">
                  We'll send you the report link. No spam, ever.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      {phase === 'idle' && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              { icon: Scan, title: 'Real Website Scanning', desc: 'We fetch and analyze your actual website pages — no fabricated results.' },
              { icon: ShieldCheck, title: 'Technology Detection', desc: 'Our engine detects 50+ tools: chat, booking, CRM, analytics, payments, and more.' },
              { icon: TrendingUp, title: 'AI Opportunity Score', desc: 'Get an industry-specific AI opportunity score and top 2 recommendations.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card p-6 text-left hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50 text-primary-600 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-neutral-600">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {phase === 'error' && (
        <div className="max-w-md mx-auto px-4 pb-20 text-center">
          <button onClick={resetToIdle} className="btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <LogoFull />
          <p className="text-xs text-neutral-400">© 2025 AI Adoption Audit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
