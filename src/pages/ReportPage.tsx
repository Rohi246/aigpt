import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Share2, Zap, TrendingUp, CheckCircle2, XCircle,
  AlertCircle, Phone, User, Building2, Send, Loader2, Sparkles, Globe,
  BarChart3, Lightbulb, Target,
} from 'lucide-react';
import { LogoFull } from '../components/audit/Logo';
import ScoreRing from '../components/audit/ScoreRing';
import StatusBadge from '../components/audit/StatusBadge';
import { pollAuditStatus, submitIntent, trackEvent } from '../lib/api';
import type { AuditRow, AuditReport } from '../lib/supabase/client';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<AuditRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showIntent, setShowIntent] = useState(false);
  const [intentData, setIntentData] = useState({ phone: '', contact_name: '', company_name: '' });
  const [intentSubmitted, setIntentSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchAudit = async () => {
      try {
        const data = await pollAuditStatus(id) as AuditRow | null;
        if (!data) {
          setError('Audit not found');
          setLoading(false);
          return;
        }
        setAudit(data);
        if (data.status === 'complete') {
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
          trackEvent(id, 'report_viewed', {});
        } else if (data.status === 'error') {
          setError(data.error || 'Audit failed');
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setLoading(false);
      }
    };

    fetchAudit();
    pollRef.current = setInterval(fetchAudit, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  const handleIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !audit?.lead_id) return;
    setSubmitting(true);
    try {
      await submitIntent(id, audit.lead_id, intentData);
      trackEvent(id, 'intent_submitted', {});
      setIntentSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-neutral-500">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !audit || !audit.report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Report Unavailable</h2>
          <p className="text-neutral-600 mb-6">{error || 'Could not load the audit report.'}</p>
          <Link to="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const report = audit.report as unknown as AuditReport;
  const industryLabel = report.industry ? report.industry.label.replace(/_/g, ' ') : null;

  const detected = report.capabilities.filter(c => c.status === 'detected');
  const missing = report.capabilities.filter(c => c.status === 'not_detected');
  const unableToVerify = report.capabilities.filter(c => c.status === 'unable_to_verify');

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <LogoFull />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); trackEvent(id!, 'report_shared', {}); }}
              className="btn-secondary text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <Link to="/" className="btn-secondary text-sm">
              <ArrowLeft className="w-4 h-4" />
              New Audit
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
            <Globe className="w-4 h-4" />
            {report.url}
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">AI Adoption & Opportunity Audit</h1>
          {industryLabel && (
            <p className="text-neutral-600 mt-1 capitalize">
              Industry: <span className="font-medium">{industryLabel}</span>
            </p>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="card p-6 flex flex-col items-center">
            <ScoreRing score={report.adoption_score} label="AI Adoption Score" color="#2563eb" />
            <p className="text-xs text-neutral-500 mt-3 text-center">
              Based on detected technologies weighted by industry relevance
            </p>
          </div>
          <div className="card p-6 flex flex-col items-center">
            <ScoreRing score={report.opportunity_score} label="AI Opportunity Score" color="#06b6d4" />
            <p className="text-xs text-neutral-500 mt-3 text-center">
              Higher = more untapped AI potential for your industry
            </p>
          </div>
          <div className="card p-6 flex flex-col justify-center">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50">
                  <CheckCircle2 className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-neutral-900">{detected.length}</div>
                  <div className="text-xs text-neutral-500">Detected</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100">
                  <XCircle className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-neutral-900">{missing.length}</div>
                  <div className="text-xs text-neutral-500">Not Detected</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50">
                  <AlertCircle className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-neutral-900">{unableToVerify.length}</div>
                  <div className="text-xs text-neutral-500">Unable to Verify</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Opportunities */}
        {report.ai_opportunities.length > 0 && (
          <div className="card p-6 mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">AI Opportunities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.ai_opportunities.map((opp) => (
                <div key={opp.capability_id} className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-neutral-900">{opp.label}</span>
                  </div>
                  <p className="text-sm text-neutral-600">{opp.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities */}
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-neutral-700" />
            <h2 className="text-lg font-semibold text-neutral-900">Business Capabilities</h2>
          </div>
          <div className="space-y-2">
            {report.capabilities.map((cap) => (
              <div key={cap.capability_id} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-900 text-sm">{cap.label}</span>
                  <span className="text-xs text-neutral-500">{cap.category}</span>
                  {cap.detected_technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cap.detected_technologies.map((t) => (
                        <span key={t.fingerprint_id} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <StatusBadge status={cap.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Industry Adoption Data */}
        {report.adoption_stats.length > 0 && (
          <div className="card p-6 mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-neutral-700" />
              <h2 className="text-lg font-semibold text-neutral-900">Industry Adoption Data</h2>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Adoption rates among analyzed websites in your industry
            </p>
            <div className="space-y-3">
              {report.adoption_stats.map((stat) => (
                <div key={stat.capability_id} className="flex items-center gap-4">
                  <div className="w-40 text-sm text-neutral-700">{stat.label}</div>
                  <div className="flex-1">
                    {stat.adoption_pct !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${stat.adoption_pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-neutral-700 w-12 text-right">{stat.adoption_pct}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">Industry adoption data unavailable</span>
                    )}
                  </div>
                  {stat.trend && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      stat.trend === 'growing' ? 'bg-success-50 text-success-700' :
                      stat.trend === 'declining' ? 'bg-error-50 text-error-700' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div className="card p-6 mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Top Recommendations</h2>
            </div>
            <div className="space-y-4">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="border border-neutral-200 rounded-lg p-4 hover:border-primary-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex-shrink-0">
                      {rec.priority}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">{rec.name}</h3>
                      <p className="text-sm text-neutral-600 mb-2">{rec.why_it_fits}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Target className="w-3.5 h-3.5" />
                        {rec.best_for}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intent Form */}
        {!intentSubmitted ? (
          <div className="card p-6 mb-6 animate-slide-up bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Want help implementing these recommendations?</h2>
            </div>
            {!showIntent ? (
              <div>
                <p className="text-neutral-600 mb-4 text-sm">
                  Get a free consultation call with our AI implementation team. We'll help you prioritize and deploy the right AI tools for your business.
                </p>
                <button onClick={() => setShowIntent(true)} className="btn-primary">
                  Request Implementation Help
                </button>
              </div>
            ) : (
              <form onSubmit={handleIntent} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-neutral-700 mb-1 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="tel"
                        value={intentData.phone}
                        onChange={(e) => setIntentData({ ...intentData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="input pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-700 mb-1 block">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={intentData.contact_name}
                        onChange={(e) => setIntentData({ ...intentData, contact_name: e.target.value })}
                        placeholder="John Smith"
                        className="input pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-neutral-700 mb-1 block">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={intentData.company_name}
                      onChange={(e) => setIntentData({ ...intentData, company_name: e.target.value })}
                      placeholder="Your Business Inc."
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Request
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="card p-6 mb-6 bg-success-50 border-success-200 animate-scale-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success-600" />
              <div>
                <h3 className="font-semibold text-neutral-900">Request received!</h3>
                <p className="text-sm text-neutral-600">Our team will contact you within 24 hours to schedule your free consultation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Scan Info */}
        <div className="text-center text-xs text-neutral-400 mt-8">
          <p>Scanned {report.pages_scanned} pages • {report.detected_technologies.length} technologies detected</p>
          <p className="mt-1">Capabilities marked "Not Detected" mean no evidence was found on your website — it does not mean the tool is absent.</p>
        </div>
      </div>
    </div>
  );
}
