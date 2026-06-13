import { api } from '@/lib/api';
import Link from 'next/link';
import { Filter, Plus, Trash2, Eye, Users } from 'lucide-react';
import DeleteSegmentButton from './DeleteSegmentButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Segments' };
export const revalidate = 0;

export default async function SegmentsPage() {
  const { data: segments } = await api.segments.list();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Filter className="h-6 w-6 text-purple-400" /> Segments
          </h1>
          <p className="text-sm text-slate-400 mt-1">{segments.length} audience group{segments.length !== 1 ? 's' : ''} defined</p>
        </div>
        <Link href="/segments/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Segment
        </Link>
      </div>

      {segments.length === 0 ? (
        <div className="glass p-16 text-center">
          <Filter className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No segments yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">Create your first audience segment using AI or manual rules.</p>
          <Link href="/segments/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Build First Segment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {segments.map((seg) => {
            const rules = seg.rules as { operator: string; conditions: Array<{ field: string; op: string; value: unknown }> };
            return (
              <div key={seg.id} className="glass p-5 hover:border-white/10 transition-all duration-200 animate-fade-in">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{seg.name}</h3>
                    {seg.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{seg.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Link href={`/campaigns/new?segmentId=${seg.id}`} className="btn-ghost px-2.5 py-1.5 text-xs">
                      <Plus className="h-3 w-3" /> Campaign
                    </Link>
                    <DeleteSegmentButton id={seg.id} />
                  </div>
                </div>

                {/* Rule pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {rules.conditions?.slice(0, 3).map((cond, i) => (
                    <span key={i} className="glass-sm px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      {cond.field} {cond.op} {String(cond.value)}
                    </span>
                  ))}
                  {rules.conditions?.length > 3 && (
                    <span className="glass-sm px-2 py-0.5 text-[10px] text-slate-500">+{rules.conditions.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-400">
                    <Users className="h-4 w-4" />
                    {seg.customerCount.toLocaleString()} customers
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(seg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
