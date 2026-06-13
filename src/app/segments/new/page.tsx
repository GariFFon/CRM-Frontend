'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type SegmentRules } from '@/lib/api';
import { Sparkles, Plus, Trash2, Users, ChevronRight, Loader2, Filter } from 'lucide-react';
import { clsx } from 'clsx';

const FIELDS = ['last_order_at', 'total_spend', 'order_count', 'avg_order_value', 'favourite_category', 'city'];
const OPS    = ['lt', 'lte', 'gt', 'gte', 'eq', 'neq', 'in'];
const FIELD_LABELS: Record<string, string> = {
  last_order_at: 'Last Order (days ago)', total_spend: 'Total Spend (₹)',
  order_count: 'Order Count', avg_order_value: 'Avg Order Value (₹)',
  favourite_category: 'Favourite Category', city: 'City',
};
const OP_LABELS: Record<string, string> = {
  lt: 'Less Than', lte: 'Less Than or Equal',
  gt: 'Greater Than', gte: 'Greater Than or Equal',
  eq: 'Equals', neq: 'Not Equals',
  in: 'In List'
};

const emptyCondition = () => ({ field: 'total_spend', op: 'gt', value: '' });

export default function NewSegmentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState([emptyCondition()]);
  const [preview, setPreview] = useState<{ count: number; samples: Array<{ id: string; name: string; email: string; city: string }> } | null>(null);
  const [nlQuery, setNlQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

  const rules: SegmentRules = { operator, conditions: conditions.map((c) => ({ ...c, value: isNaN(Number(c.value)) ? c.value : Number(c.value) })) };

  const handleAiGenerate = async () => {
    if (!nlQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.ai.generateSegment(nlQuery);
      const r = res.data.rules as SegmentRules;
      setOperator(r.operator);
      setConditions(r.conditions.map((c) => ({ field: c.field, op: c.op, value: String(c.value) })));
      setAiExplanation(res.data.explanation);
      if (!name) setName(nlQuery.slice(0, 50));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await api.segments.preview(rules);
      setPreview(res.data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Give the segment a name');
    setSaving(true);
    try {
      await api.segments.create({ name, description: description || undefined, rules });
      router.push('/segments');
    } catch (err) {
      alert((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Filter className="h-6 w-6 text-purple-400" /> New Segment
        </h1>
        <p className="text-sm text-slate-400 mt-1">Define your audience using AI or manual rules.</p>
      </div>

      {/* AI Builder */}
      <div className="glass p-5 border-brand-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <p className="text-sm font-semibold text-brand-300">AI Segment Builder</p>
          <span className="badge bg-brand-500/15 text-brand-400 border-brand-500/20 text-[10px]">Gemini Powered</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            placeholder='e.g. "customers inactive for 90 days who spent less than ₹5000 on shoes"'
            className="input flex-1 text-xs"
          />
          <button onClick={handleAiGenerate} disabled={aiLoading} className="btn-primary whitespace-nowrap">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </button>
        </div>
        {aiExplanation && (
          <p className="mt-2.5 text-xs text-slate-400 bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2">
            ✦ {aiExplanation}
          </p>
        )}
      </div>

      {/* Manual Rule Builder */}
      <div className="glass p-5">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm font-semibold text-white">Rules</p>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {(['AND', 'OR'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setOperator(op)}
                className={clsx('px-3 py-1 text-xs font-semibold transition-colors', operator === op ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white')}
              >
                {op}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">match {operator === 'AND' ? 'all' : 'any'} conditions</p>
        </div>

        <div className="space-y-2">
          {conditions.map((cond, i) => (
            <div key={i} className="flex items-center gap-2 glass-sm p-2.5 animate-fade-in">
              {i > 0 && (
                <span className="text-[10px] font-bold text-slate-500 bg-surface-600 px-1.5 py-0.5 rounded shrink-0">{operator}</span>
              )}
              <select value={cond.field} onChange={(e) => { const nc = [...conditions]; nc[i].field = e.target.value; setConditions(nc); }} className="input py-1.5 text-xs flex-[2]">
                {FIELDS.map((f) => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
              </select>
              <select value={cond.op} onChange={(e) => { const nc = [...conditions]; nc[i].op = e.target.value; setConditions(nc); }} className="input py-1.5 text-xs flex-1">
                {OPS.map((o) => <option key={o} value={o}>{OP_LABELS[o]}</option>)}
              </select>
              <input
                type="text"
                value={cond.value}
                onChange={(e) => { const nc = [...conditions]; nc[i].value = e.target.value; setConditions(nc); }}
                placeholder="value"
                className="input py-1.5 text-xs flex-1"
              />
              <button onClick={() => setConditions(conditions.filter((_, j) => j !== i))} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => setConditions([...conditions, emptyCondition()])} className="mt-3 text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add condition
        </button>
      </div>

      {/* Name & Description */}
      <div className="glass p-5 space-y-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Segment name *" className="input" />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="input" />
      </div>

      {/* Preview Result */}
      {preview && (
        <div className="glass p-5 border-emerald-500/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-semibold text-white"><span className="text-emerald-400 text-lg">{preview.count.toLocaleString()}</span> customers match</p>
          </div>
          {preview.samples.length > 0 && (
            <div className="space-y-1">
              {preview.samples.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs text-slate-400 py-1 border-b border-white/5 last:border-0">
                  <span>{s.name}</span>
                  <span className="text-slate-500">{s.city} · {s.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handlePreview} disabled={previewLoading} className="btn-ghost">
          {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Preview Audience
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary ml-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
          Save Segment
        </button>
      </div>
    </div>
  );
}
