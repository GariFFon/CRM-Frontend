'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api, type Segment } from '@/lib/api';
import {
  Sparkles, Megaphone, Loader2, Zap, Bot, Inbox, ChevronDown, Plus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Suspense } from 'react';

const CHANNELS = ['whatsapp', 'sms', 'email', 'rcs'] as const;
const CHANNEL_INFO = {
  whatsapp: { label: '💬 WhatsApp', desc: 'Highest open rates in India (87%)' },
  sms:      { label: '📱 SMS',      desc: 'Reliable delivery, great for re-engagement' },
  email:    { label: '✉️ Email',    desc: 'Best for detailed content & high-value customers' },
  rcs:      { label: '🌐 RCS',      desc: 'Modern messaging with rich media support' },
};

// ── Main campaign creation form ─────────────────────────────────────────────

function NewCampaignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [segments, setSegments]     = useState<Segment[]>([]);
  const [name, setName]             = useState('');
  const [segmentId, setSegmentId]   = useState(searchParams.get('segmentId') ?? '');
  const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);
  const [channel, setChannel]       = useState<typeof CHANNELS[number]>('whatsapp');
  const [template, setTemplate]     = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'simulate' | 'live'>('simulate');
  const [copyVariants, setCopyVariants] = useState<Array<{ variant: string; copy: string }>>([]);
  const [goalText, setGoalText]     = useState('');
  const [channelRec, setChannelRec] = useState<{ channel: string; reasoning: string } | null>(null);

  const [aiCopyLoading, setAiCopyLoading]       = useState(false);
  const [aiChannelLoading, setAiChannelLoading] = useState(false);
  const [saving, setSaving]                     = useState(false);

  useEffect(() => {
    api.segments.list().then((r) => setSegments(r.data));
  }, []);

  const handleAiCopy = async () => {
    if (!segmentId || !goalText.trim()) return alert('Select a segment and describe your campaign goal.');
    setAiCopyLoading(true);
    setCopyVariants([]);
    try {
      const res = await api.ai.generateCopy(goalText, segmentId, channel);
      setCopyVariants(res.data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAiCopyLoading(false);
    }
  };

  const handleAiChannel = async () => {
    if (!segmentId) return alert('Select a segment first.');
    setAiChannelLoading(true);
    try {
      const res = await api.ai.recommendChannel(segmentId);
      setChannelRec(res.data);
      setChannel(res.data.channel as typeof CHANNELS[number]);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAiChannelLoading(false);
    }
  };

  /** Creates the campaign and navigates to the detail page.
   *  AI pre-launch insights are shown on the detail page itself. */
  const handleCreate = async () => {
    if (!name.trim() || !segmentId || !template.trim()) {
      return alert('Fill in all required fields (name, segment, message).');
    }
    setSaving(true);
    try {
      const res = await api.campaigns.create({ name, segmentId, channel, messageTemplate: template, deliveryMode });
      // Optimistically add to cache so the list page feels instant
      queryClient.setQueryData<{ success: boolean; data: import('@/lib/api').Campaign[] }>(
        ['campaigns'],
        (old) => {
          if (!old) return old;
          return { ...old, data: [res.data, ...old.data] };
        }
      );
      router.push(`/campaigns/${res.data.id}`);
    } catch (err) {
      alert((err as Error).message);
      setSaving(false);
    }
  };

  const selectedSegment = segments.find((s) => s.id === segmentId);

  return (
    <div className="max-w-3xl space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-pink-400" /> New Campaign
        </h1>
        <p className="text-sm text-slate-400 mt-1">Create a campaign with AI-generated message copy.</p>
      </div>

      {/* Name */}
      <div className="glass p-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Campaign Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Re-engage Inactive Shoe Buyers" className="input" />
      </div>

      {/* Segment selection */}
      <div className={clsx("glass p-5", segmentDropdownOpen && "relative z-50")}>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Target Segment</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSegmentDropdownOpen(!segmentDropdownOpen)}
            className="input w-full text-left flex items-center justify-between"
          >
            <span className={segmentId ? 'text-white' : 'text-slate-500'}>
              {selectedSegment ? `${selectedSegment.name} (${selectedSegment.customerCount.toLocaleString()} customers)` : '— Select a segment —'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>

          {segmentDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSegmentDropdownOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 flex flex-col animate-fade-in">
                <div className="max-h-60 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => { setSegmentId(''); setSegmentDropdownOpen(false); }}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                      segmentId === '' ? "bg-brand-500/10 text-brand-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    — Select a segment —
                  </button>
                  {segments.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSegmentId(s.id); setSegmentDropdownOpen(false); }}
                      className={clsx(
                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                        segmentId === s.id ? "bg-brand-500/10 text-brand-400" : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {s.name} <span className="text-slate-500 text-xs">({s.customerCount.toLocaleString()})</span>
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-white/10 bg-surface-900/50">
                  <button
                    type="button"
                    onClick={() => router.push('/segments/new')}
                    className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Create New Segment
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        {selectedSegment && (
          <p className="mt-2 text-xs text-slate-400">
            ✦ {selectedSegment.customerCount.toLocaleString()} customers will receive this campaign
          </p>
        )}
      </div>

      {/* Channel */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Channel</label>
          <button onClick={handleAiChannel} disabled={aiChannelLoading} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            {aiChannelLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Recommend
          </button>
        </div>
        {channelRec && (
          <p className="mb-3 text-xs bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2 text-slate-300">
            ✦ Recommended: <span className="text-brand-400 font-semibold capitalize">{channelRec.channel}</span> — {channelRec.reasoning}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={clsx(
                'p-3 rounded-xl border text-left transition-all duration-150',
                channel === ch
                  ? 'border-brand-500/50 bg-brand-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              )}
            >
              <p className="text-sm font-medium text-white">{CHANNEL_INFO[ch].label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{CHANNEL_INFO[ch].desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Message Template</label>
          <span className="text-[10px] text-slate-500">Use {'{name}'} for personalization</span>
        </div>

        {/* AI Copy Generator */}
        <div className="mb-3 p-3 glass-sm space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-xs font-semibold text-brand-300">AI Copy Generator</span>
          </div>
          <input
            type="text"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder='e.g. "Bring back inactive customers with a 20% discount"'
            className="input text-xs"
          />
          <button onClick={handleAiCopy} disabled={aiCopyLoading} className="btn-primary text-xs w-full justify-center">
            {aiCopyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate 3 Copy Variants
          </button>
        </div>

        {/* Copy variants */}
        {copyVariants.length > 0 && (
          <div className="space-y-2 mb-3">
            {copyVariants.map((v) => (
              <button
                key={v.variant}
                onClick={() => setTemplate(v.copy)}
                className={clsx(
                  'w-full text-left p-3 rounded-xl border text-xs transition-all duration-150',
                  template === v.copy
                    ? 'border-brand-500/50 bg-brand-500/10 text-white'
                    : 'border-white/10 hover:border-white/20 text-slate-300 hover:bg-white/5'
                )}
              >
                <span className="font-bold text-brand-400 mr-2">Variant {v.variant}</span>
                {v.copy}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Type or paste your message here. Use {name} for customer name."
          rows={4}
          className="input font-mono text-xs resize-none"
        />
      </div>

      {/* ── Delivery Mode Toggle ─────────────────────────────────────────── */}
      <div className="glass p-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 block">
          Delivery Mode
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Simulate */}
          <button
            onClick={() => setDeliveryMode('simulate')}
            className={clsx(
              'relative p-4 rounded-2xl border-2 text-left transition-all duration-200',
              deliveryMode === 'simulate'
                ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-900/30'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            {deliveryMode === 'simulate' && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-400" />
            )}
            <div className="flex items-center gap-2 mb-2">
              <div className={clsx(
                'h-8 w-8 rounded-xl flex items-center justify-center',
                deliveryMode === 'simulate' ? 'bg-brand-500/20' : 'bg-white/5'
              )}>
                <Bot className={clsx('h-4 w-4', deliveryMode === 'simulate' ? 'text-brand-400' : 'text-slate-500')} />
              </div>
              <p className={clsx('text-sm font-semibold', deliveryMode === 'simulate' ? 'text-white' : 'text-slate-400')}>
                Auto Simulate
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Messages auto-simulate delivery, opens & clicks using real-world probability rates.
              Stats update automatically within seconds.
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['87% delivery', '62% open', '24% click'].map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">{t}</span>
              ))}
            </div>
          </button>

          {/* Live Provider */}
          <button
            onClick={() => setDeliveryMode('live')}
            className={clsx(
              'relative p-4 rounded-2xl border-2 text-left transition-all duration-200',
              deliveryMode === 'live'
                ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-900/30'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            {deliveryMode === 'live' && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
            )}
            <div className="flex items-center gap-2 mb-2">
              <div className={clsx(
                'h-8 w-8 rounded-xl flex items-center justify-center',
                deliveryMode === 'live' ? 'bg-pink-500/20' : 'bg-white/5'
              )}>
                <Inbox className={clsx('h-4 w-4', deliveryMode === 'live' ? 'text-pink-400' : 'text-slate-500')} />
              </div>
              <p className={clsx('text-sm font-semibold', deliveryMode === 'live' ? 'text-white' : 'text-slate-400')}>
                Live Provider
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Messages land in the Provider Inbox. You manually open & click them — just like a real user would.
              Stats update on your real actions.
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Real interactions', 'Manual control', 'Visual inbox'].map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">{t}</span>
              ))}
            </div>
          </button>
        </div>

        {deliveryMode === 'live' && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-pink-500/5 border border-pink-500/20">
            <Inbox className="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              After launching, go to <span className="text-pink-400 font-semibold">Provider Inbox</span> in the sidebar to see your messages and interact with them.
            </p>
          </div>
        )}
      </div>

      {/* Create — directly creates the campaign and navigates to the detail page
           where AI pre-launch insights are shown before you hit Launch */}
      <button
        onClick={handleCreate}
        disabled={saving}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
        {saving ? 'Creating…' : 'Create Campaign →'}
      </button>
      <p className="text-center text-xs text-slate-500 -mt-2">
        AI risk analysis will be shown on the next page before you launch.
      </p>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-400" /></div>}>
      <NewCampaignContent />
    </Suspense>
  );
}
