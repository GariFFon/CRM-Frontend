'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Campaign } from '@/lib/api';
import Link from 'next/link';
import { Trash2, Megaphone, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';

export default function CampaignTableClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent row click from firing
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await api.campaigns.delete(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      router.refresh();
    } catch (err) {
      alert('Failed to delete campaign');
      setDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="glass p-16 text-center">
        <Megaphone className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-300 font-medium">No campaigns yet</p>
        <p className="text-slate-500 text-sm mt-1 mb-6">Create your first campaign with AI-powered messaging.</p>
        <Link href="/campaigns/new" className="btn-primary">Create Campaign</Link>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {['Campaign', 'Channel', 'Status', 'Recipients', 'Sent', 'Delivered', 'Opened', 'Created', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {campaigns.map((c) => (
              <tr 
                key={c.id} 
                className="table-row-hover group cursor-pointer"
                onClick={() => router.push(`/campaigns/${c.id}`)}
              >
                <td className="px-5 py-4 font-medium text-white group-hover:text-brand-300 transition-colors">
                  {c.name}
                </td>
                <td className="px-5 py-4"><ChannelBadge channel={c.channel} /></td>
                <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-4 font-mono text-sm text-slate-300">{c.stats?.total?.toLocaleString() ?? '—'}</td>
                <td className="px-5 py-4 font-mono text-sm text-slate-300">{c.stats?.sent?.toLocaleString() ?? '—'}</td>
                <td className="px-5 py-4">
                  {c.stats && c.stats.total > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden w-16">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${c.stats.rates?.delivery ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{c.stats.rates?.delivery ?? 0}%</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">{c.stats?.opened?.toLocaleString() ?? '—'}</td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={(e) => handleDelete(e, c.id)}
                    disabled={deleting[c.id]}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Campaign"
                  >
                    {deleting[c.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
