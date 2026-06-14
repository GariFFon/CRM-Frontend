'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { api, type Campaign, type CampaignStats, type Message } from '@/lib/api';
import {
  ArrowLeft, Zap, Sparkles, Loader2, RefreshCw,
  CheckCircle, XCircle, Clock, Eye, MousePointer,
  Send, Package, Users, TrendingUp, Activity,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import ChannelBadge from '@/components/ChannelBadge';
import StatusBadge from '@/components/StatusBadge';
import { clsx } from 'clsx';

// ─── Animated Ring ────────────────────────────────────────────────────────────
function Ring({ value, label, color, sublabel }: {
  value: number; label: string; color: string; sublabel?: string;
}) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(value, 100) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1a1a2e" strokeWidth="9" />
        <circle
          cx="48" cy="48" r={r} fill="none" strokeWidth="9"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          className="transition-all duration-1000 ease-out"
        />
        <text x="48" y="52" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">
          {value}%
        </text>
      </svg>
      <p className="text-xs font-semibold text-white">{label}</p>
      {sublabel && <p className="text-[10px] text-slate-500">{sublabel}</p>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: typeof Send; color: string; sub?: string;
}) {
  return (
    <div className="glass p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <Icon className={clsx('h-4 w-4', color)} />
      </div>
      <p className={clsx('text-2xl font-bold', color)}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
    </div>
  );
}

// ─── Message status icon ──────────────────────────────────────────────────────
function MsgIcon({ status }: { status: string }) {
  const map: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
    delivered: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    sent:      { icon: Send,        color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
    failed:    { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-400/10'     },
    opened:    { icon: Eye,         color: 'text-purple-400',  bg: 'bg-purple-400/10'  },
    clicked:   { icon: MousePointer,color: 'text-pink-400',    bg: 'bg-pink-400/10'    },
    queued:    { icon: Clock,       color: 'text-slate-500',   bg: 'bg-slate-500/10'   },
  };
  const cfg = map[status] ?? map.queued;
  const Icon = cfg.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', cfg.bg, cfg.color)}>
      <Icon className="h-3 w-3" />
      <span className="capitalize">{status}</span>
    </span>
  );
}

// ─── Funnel bar ───────────────────────────────────────────────────────────────
function FunnelBar({ label, count, total, color, icon: Icon }: {
  label: string; count: number; total: number; color: string; icon: typeof Send;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 flex items-center gap-1.5">
        <Icon className={clsx('h-3.5 w-3.5 shrink-0', color)} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: colorHex(color) }}
        />
      </div>
      <div className="w-20 text-right shrink-0">
        <span className={clsx('text-sm font-bold', color)}>{count.toLocaleString()}</span>
        <span className="text-xs text-slate-600 ml-1">({pct}%)</span>
      </div>
    </div>
  );
}

function colorHex(cls: string) {
  const map: Record<string, string> = {
    'text-blue-400': '#60a5fa',
    'text-emerald-400': '#34d399',
    'text-red-400': '#f87171',
    'text-purple-400': '#c084fc',
    'text-pink-400': '#f472b6',
    'text-amber-400': '#fbbf24',
    'text-slate-400': '#94a3b8',
  };
  return map[cls] ?? '#94a3b8';
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats]       = useState<CampaignStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [insights, setInsights] = useState('');
  const [launching, setLaunching]             = useState(false);
  const [retrying, setRetrying]               = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [polling, setPolling]                 = useState(false);
  const [statusFilter, setStatusFilter]       = useState<string>('all');
  const [lastRefresh, setLastRefresh]         = useState<Date>(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setPolling(true);
    try {
      const [c, s, m] = await Promise.all([
        api.campaigns.get(id),
        api.campaigns.stats(id).catch(() => null),
        api.campaigns.messages(id).catch(() => ({ data: [] })),
      ]);
      setCampaign(c.data);
      if (s) setStats(s.data);
      const msgData = Array.isArray(m) ? m : (m as any).data ?? [];
      setMessages(msgData);
      setLastRefresh(new Date());
    } catch {/* ignore */}
    finally { setPolling(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Auto-poll every 3s while campaign is active
  useEffect(() => {
    if (campaign?.status !== 'active') return;
    const t = setInterval(() => load(true), 3000);
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

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await api.campaigns.retry(id);
      await load();
      alert(`✅ Re-queued ${res.data.retried} stuck messages!`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRetrying(false);
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
  const total    = stats?.total ?? 0;

  // Status counts for the message log filter tabs
  const statusCounts = messages.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});

  const filteredMessages = statusFilter === 'all'
    ? messages
    : messages.filter(m => m.status === statusFilter);

  const filterTabs = [
    { key: 'all',       label: 'All',       color: 'text-slate-300' },
    { key: 'queued',    label: 'Queued',    color: 'text-slate-400' },
    { key: 'sent',      label: 'Sent',      color: 'text-blue-400'  },
    { key: 'delivered', label: 'Delivered', color: 'text-emerald-400' },
    { key: 'opened',    label: 'Opened',    color: 'text-purple-400' },
    { key: 'clicked',   label: 'Clicked',   color: 'text-pink-400'  },
    { key: 'failed',    label: 'Failed',    color: 'text-red-400'   },
  ];

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Header ── */}
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
                  Launched {new Date(campaign.launchedAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              )}
              {campaign.status === 'active' && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'active' && (
            <span className="text-[10px] text-slate-600">
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button onClick={() => load()} disabled={polling} className="btn-ghost text-xs">
            <RefreshCw className={clsx('h-3.5 w-3.5', polling && 'animate-spin')} /> Refresh
          </button>
          {campaign.status === 'draft' && (
            <button onClick={handleLaunch} disabled={launching} className="btn-primary">
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Launch Campaign
            </button>
          )}
          {campaign.status === 'active' && (stats?.queued ?? 0) > 0 && (
            <button onClick={handleRetry} disabled={retrying} className="btn-ghost text-xs text-amber-400 border border-amber-400/30 hover:bg-amber-400/10">
              {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Retry {stats?.queued} stuck
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && total > 0 ? (
        <>
          {/* Top stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label="Total"     value={stats.total}     icon={Users}        color="text-white"        sub="recipients" />
            <StatCard label="Queued"    value={stats.queued}    icon={Clock}        color="text-slate-400"    sub="waiting" />
            <StatCard label="Sent"      value={stats.sent}      icon={Send}         color="text-blue-400"     sub="dispatched" />
            <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle}  color="text-emerald-400"  sub="in inbox" />
            <StatCard label="Opened"    value={stats.opened}    icon={Eye}          color="text-purple-400"   sub="read" />
            <StatCard label="Clicked"   value={stats.clicked}   icon={MousePointer} color="text-pink-400"     sub="tapped CTA" />
            <StatCard label="Failed"    value={stats.failed}    icon={XCircle}      color="text-red-400"      sub="not delivered" />
          </div>

          {/* Two column: Funnel bars + Rate rings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Funnel bars — the "where did users go" view */}
            <div className="glass p-6 space-y-4">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-4 w-4 text-brand-400" />
                <h2 className="text-sm font-semibold text-white">Message Journey</h2>
                <span className="text-[10px] text-slate-500 ml-auto">out of {total.toLocaleString()} recipients</span>
              </div>
              <FunnelBar label="Sent"      count={stats.sent}      total={total} color="text-blue-400"    icon={Send}         />
              <FunnelBar label="Delivered" count={stats.delivered} total={total} color="text-emerald-400" icon={CheckCircle}  />
              <FunnelBar label="Opened"    count={stats.opened}    total={total} color="text-purple-400"  icon={Eye}          />
              <FunnelBar label="Clicked"   count={stats.clicked}   total={total} color="text-pink-400"    icon={MousePointer} />
              <FunnelBar label="Failed"    count={stats.failed}    total={total} color="text-red-400"     icon={XCircle}      />

              {/* "Ordered via campaign" box */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                  <ShoppingCart className="h-4 w-4 text-pink-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-pink-300">
                      {stats.clicked} user{stats.clicked !== 1 ? 's' : ''} tapped the CTA link
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Every "Clicked" = customer engaged with your campaign offer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate rings */}
            <div className="glass p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-brand-400" />
                <h2 className="text-sm font-semibold text-white">Delivery Funnel</h2>
              </div>
              <div className="flex items-center justify-around">
                <Ring
                  value={delivery}
                  label="Delivery Rate"
                  color="#10b981"
                  sublabel={`${stats.delivered} of ${stats.sent} sent`}
                />
                <div className="text-2xl text-slate-700">→</div>
                <Ring
                  value={open}
                  label="Open Rate"
                  color="#a855f7"
                  sublabel={`${stats.opened} opened`}
                />
                <div className="text-2xl text-slate-700">→</div>
                <Ring
                  value={click}
                  label="Click Rate"
                  color="#ec4899"
                  sublabel={`${stats.clicked} clicked`}
                />
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-4">
                {[
                  { label: 'Delivery', value: `${delivery}%`, color: 'text-emerald-400', sub: 'of sent msgs' },
                  { label: 'Open',     value: `${open}%`,     color: 'text-purple-400',  sub: 'of delivered' },
                  { label: 'Click',    value: `${click}%`,    color: 'text-pink-400',    sub: 'of opened' },
                ].map(({ label, value, color, sub }) => (
                  <div key={label}>
                    <p className={clsx('text-lg font-bold', color)}>{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                    <p className="text-[10px] text-slate-700">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass p-8 text-center">
          <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">
            {campaign.status === 'draft'
              ? 'Launch this campaign to start sending messages and tracking stats.'
              : 'No stats yet — messages are being processed.'}
          </p>
        </div>
      )}

      {/* ── AI Insights ── */}
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
            <p className="text-xs text-slate-500">Click "Generate Insights" to get an AI analysis of campaign performance.</p>
          )}
        </div>
      )}

      {/* ── Message Log with filter tabs ── */}
      {messages.length > 0 && (
        <div className="glass overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Message Log <span className="text-slate-500 font-normal text-xs">({messages.length})</span>
            </h2>
            {campaign.status === 'active' && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-refreshing every 3s
              </span>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto">
            {filterTabs.map(({ key, label, color }) => {
              const count = key === 'all' ? messages.length : (statusCounts[key] ?? 0);
              if (key !== 'all' && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={clsx(
                    'shrink-0 px-3 py-1 rounded-lg text-[11px] font-medium transition-all',
                    statusFilter === key
                      ? 'bg-white/10 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <span className={statusFilter === key ? color : ''}>{label}</span>
                  <span className="ml-1.5 text-[10px] text-slate-600">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-800 z-10">
                <tr className="border-b border-white/5">
                  {['Status', 'Recipient', 'Message Preview', 'Sent At', 'Opened At', 'Clicked At'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMessages.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <MsgIcon status={m.status} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono whitespace-nowrap">{m.recipientContact}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-[260px] truncate">{m.messageBody}</td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {m.sentAt ? new Date(m.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {m.openedAt
                        ? <span className="text-purple-400">{new Date(m.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        : <span className="text-slate-700">—</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {m.clickedAt
                        ? <span className="text-pink-400 flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" />
                            {new Date(m.clickedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        : <span className="text-slate-700">—</span>
                      }
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
