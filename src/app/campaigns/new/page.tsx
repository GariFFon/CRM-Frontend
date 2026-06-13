'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, type Segment } from '@/lib/api';
import { Sparkles, Megaphone, ChevronRight, Loader2, Zap } from 'lucide-react';
import { clsx } from 'clsx';

const CHANNELS = ['whatsapp', 'sms', 'email', 'rcs'] as const;
const CHANNEL_INFO = {
  whatsapp: { label: '💬 WhatsApp', desc: 'Highest open rates in India (87%)' },
  sms:      { label: '📱 SMS',      desc: 'Reliable delivery, great for re-engagement' },
  email:    { label: '✉️ Email',    desc: 'Best for detailed content & high-value customers' },
  rcs:      { label: '🌐 RCS',      desc: 'Modern messaging with rich media support' },
};

export default function NewCampaignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState(searchParams.get('segmentId') ?? '');
  const [channel, setChannel] = useState<typeof CHANNELS[number]>('whatsapp');
  const [template, setTemplate] = useState('');
  const [copyVariants, setCopyVariants] = useState<Array<{ variant: string; copy: string }>>([]);
  const [goalText, setGoalText] = useState('');
  const [channelRec, setChannelRec] = useState<{ channel: string; reasoning: string } | null>(null);

  const [aiCopyLoading, setAiCopyLoading] = useState(false);
  const [aiChannelLoading, setAiChannelLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleCreate = async () => {
    if (!name.trim() || !segmentId || !template.trim()) return alert('Fill in all required fields.');
    setSaving(true);
    try {
      const res = await api.campaigns.create({ name, segmentId, channel, messageTemplate: template });
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
      <div className="glass p-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Target Segment</label>
        <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className="input">
          <option value="">— Select a segment —</option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.customerCount.toLocaleString()} customers)</option>
          ))}
        </select>
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

      {/* Create */}
      <button onClick={handleCreate} disabled={saving} className="btn-primary w-full justify-center py-3">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        Create Campaign
      </button>
    </div>
  );
}
