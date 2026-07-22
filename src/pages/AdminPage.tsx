import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, Mail, Phone, Building2, Flame, ArrowLeft,
  Loader2, BarChart3, Globe, Clock,
} from 'lucide-react';
import { LogoFull } from '../components/audit/Logo';
import { supabase } from '../lib/supabase/client';
import type { AuditRow, LeadRow } from '../lib/supabase/client';

export default function AdminPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [auditsRes, leadsRes] = await Promise.all([
          supabase.from('audits').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100),
        ]);

        if (auditsRes.data) setAudits(auditsRes.data as AuditRow[]);
        if (leadsRes.data) setLeads(leadsRes.data as LeadRow[]);
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const totalAudits = audits.length;
  const completedAudits = audits.filter(a => a.status === 'complete').length;
  const totalLeads = leads.length;
  const highIntentLeads = leads.filter(l => l.high_intent).length;
  const avgAdoptionScore = completedAudits > 0
    ? Math.round(audits.filter(a => a.status === 'complete' && a.report).reduce((sum, a) => {
        const r = a.report as unknown as { adoption_score: number };
        return sum + (r?.adoption_score || 0);
      }, 0) / completedAudits)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <LogoFull />
          <Link to="/" className="btn-secondary text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Admin Dashboard</h1>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BarChart3, label: 'Total Audits', value: totalAudits, color: 'primary' },
            { icon: TrendingUp, label: 'Avg Adoption Score', value: avgAdoptionScore, color: 'accent' },
            { icon: Users, label: 'Total Leads', value: totalLeads, color: 'success' },
            { icon: Flame, label: 'High-Intent Leads', value: highIntentLeads, color: 'warning' },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${m.color}-50`}>
                    <Icon className={`w-5 h-5 text-${m.color}-600`} />
                  </div>
                  <span className="text-sm text-neutral-500">{m.label}</span>
                </div>
                <div className="text-2xl font-bold text-neutral-900">{m.value}</div>
              </div>
            );
          })}
        </div>

        {/* Leads Table */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Leads</h2>
          {leads.length === 0 ? (
            <p className="text-neutral-400 text-sm">No leads yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Company</th>
                    <th className="pb-2 pr-4 font-medium">Phone</th>
                    <th className="pb-2 pr-4 font-medium">Intent</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          {lead.email}
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-neutral-700">{lead.contact_name || '—'}</td>
                      <td className="py-2 pr-4 text-neutral-700">{lead.company_name || '—'}</td>
                      <td className="py-2 pr-4 text-neutral-700">
                        {lead.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                            {lead.phone}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        {lead.high_intent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-50 text-warning-700 text-xs font-medium">
                            <Flame className="w-3 h-3" />
                            High
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">Standard</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-neutral-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Audits */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Audits</h2>
          {audits.length === 0 ? (
            <p className="text-neutral-400 text-sm">No audits yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="pb-2 pr-4 font-medium">URL</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Score</th>
                    <th className="pb-2 pr-4 font-medium">Unlocked</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => {
                    const report = audit.report as unknown as { adoption_score: number } | null;
                    return (
                      <tr key={audit.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-neutral-700 truncate max-w-xs">{audit.url}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            audit.status === 'complete' ? 'bg-success-50 text-success-700' :
                            audit.status === 'error' ? 'bg-error-50 text-error-700' :
                            'bg-primary-50 text-primary-700'
                          }`}>
                            {audit.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-neutral-700">
                          {report?.adoption_score !== undefined ? report.adoption_score : '—'}
                        </td>
                        <td className="py-2 pr-4">
                          {audit.email_unlocked ? (
                            <span className="text-xs text-success-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-xs text-neutral-400">No</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-neutral-500 text-xs">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
