'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { api, type Campaign, type CampaignStats, type Message } from '@/lib/api';
import { ArrowLeft, Zap, Sparkles, Loader2, RefreshCw, CheckCircle, XCircle, Clock, Eye, MousePointer } from 'lucide-react';
import Link from 'next/link';
import ChannelBadge from '@/components/ChannelBadge';
import StatusBadge from '@/components/StatusBadge';
import { clsx } from 'clsx';

// ─── Stat ring component ──────────────────────────────────────────────────────
function Ring({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1a1a24" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r} fill="none" strokeWidth="8"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          className="transition-all duration-700"
        />
        <text x="40" y="44" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{value}%</text>
      </svg>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

// ─── Message status icon ──────────────────────────────────────────────────────
function MsgIcon({ status }: { status: string }) {
  const map: Record<string, { icon: typeof CheckCircle; color: string }> = {
    delivered: { icon: CheckCircle, color: 'text-emerald-400' },
    sent:      { icon: Clock,        color: 'text-blue-400'    },
    failed:    { icon: XCircle,      color: 'text-red-400'     },
    opened:    { icon: Eye,          color: 'text-purple-400'  },
    clicked:   { icon: MousePointer, color: 'text-pink-400'    },
    queued:    { icon: Clock,        color: 'text-slate-500'   },
  };
  const cfg = map[status] ?? map.queued;
  const Icon = cfg.icon;
  return <Icon className={clsx('h-3.5 w-3.5', cfg.color)} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats]       = useState<CampaignStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [insights, setInsights] = useState('');
  const [launching, setLaunching]       = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [polling, setPolling]   = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setPolling(true);
    try {
      const [c, s, m] = await Promise.all([
        api.campaigns.get(id),
        api.campaigns.stats(id).catch(() => null),
        api.campaigns.messages(id).catch(() => []),
      ]);
      setCampaign(c.data);
      if (s) setStats(s.data);
      if (Array.isArray(m)) setMessages(m as Message[]);
      else if ((m as any).data) setMessages((m as any).data);
    } catch {/* ignore */}
    finally { setPolling(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Auto-poll while active
  useEffect(() => {
    if (campaign?.status !== 'active') return;
    const t = setInterval(() => load(true), 4000);
    return () => clearInterval(t);
  }, [campaign?.status, load]);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await api.campaigns.launch(id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLaunching(false);
    }
  };

  const handleInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await api.ai.generateInsights(id);
      setInsights(res.data.insights);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setInsightsLoading(false);
    }
  };

  if (!campaign) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
    </div>
  );

  const delivery = stats?.rates?.delivery ?? 0;
  const open     = stats?.rates?.open ?? 0;
  const click    = stats?.rates?.click ?? 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/campaigns" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={campaign.status} />
              <ChannelBadge channel={campaign.channel} />
              {campaign.launchedAt && (
                <span className="text-xs text-slate-500">
                  Launched {new Date(campaign.launchedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} disabled={polling} className="btn-ghost text-xs">
            <RefreshCw className={clsx('h-3.5 w-3.5', polling && 'animate-spin')} /> Refresh
          </button>
          {campaign.status === 'draft' && (
            <button onClick={handleLaunch} disabled={launching} className="btn-primary">
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Launch Campaign
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 ? (
        <>
          {/* Number stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-white' },
              { label: 'Queued', value: stats.queued, color: 'text-slate-400' },
              { label: 'Sent', value: stats.sent, color: 'text-blue-400' },
              { label: 'Delivered', value: stats.delivered, color: 'text-emerald-400' },
              { label: 'Opened', value: stats.opened, color: 'text-purple-400' },
              { label: 'Clicked', value: stats.clicked, color: 'text-pink-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass p-4 text-center">
                <p className={clsx('text-2xl font-bold', color)}>{value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Rate rings */}
          <div className="glass p-6">
            <h2 className="text-sm font-semibold text-white mb-6">Delivery Funnel</h2>
            <div className="flex items-center justify-around">
              <Ring value={delivery} label="Delivery Rate" color="#10b981" />
              <div className="text-2xl text-slate-700">→</div>
              <Ring value={open}     label="Open Rate"     color="#a855f7" />
              <div className="text-2xl text-slate-700">→</div>
              <Ring value={click}    label="Click Rate"    color="#ec4899" />
            </div>
          </div>
        </>
      ) : (
        <div className="glass p-6 text-center text-slate-400 text-sm">
          {campaign.status === 'draft'
            ? 'Launch this campaign to start sending messages and tracking stats.'
            : 'No stats yet — check back soon.'}
        </div>
      )}

      {/* AI Insights */}
      {campaign.status !== 'draft' && (
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <p className="text-sm font-semibold text-brand-300">AI Performance Insights</p>
            </div>
            <button onClick={handleInsights} disabled={insightsLoading} className="btn-ghost text-xs">
              {insightsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Generate Insights
            </button>
          </div>
          {insights ? (
            <p className="text-sm text-slate-300 leading-relaxed">{insights}</p>
          ) : (
            <p className="text-xs text-slate-500">Click "Generate Insights" to get an AI analysis of this campaign's performance.</p>
          )}
        </div>
      )}

      {/* Message log */}
      {messages.length > 0 && (
        <div className="glass overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Message Log <span className="text-slate-500 font-normal text-xs">({messages.length})</span></h2>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-800">
                <tr className="border-b border-white/5">
                  {['Status', 'Recipient', 'Message Preview', 'Sent At'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {messages.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <MsgIcon status={m.status} />
                        <span className="capitalize text-slate-300">{m.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono">{m.recipientContact}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">{m.messageBody}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {m.sentAt ? new Date(m.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
