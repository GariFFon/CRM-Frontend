'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Campaign } from '@/lib/api';
import Link from 'next/link';
import { Trash2, Megaphone, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';

export default function CampaignTableClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Optimistic delete ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.campaigns.delete(id),

    // 1. Immediately remove from the cached list
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches that would overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });

      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData<{ success: boolean; data: Campaign[] }>(['campaigns']);

      // Optimistically remove the campaign from cache
      queryClient.setQueryData<{ success: boolean; data: Campaign[] }>(['campaigns'], (old) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((c) => c.id !== id) };
      });

      return { previous };
    },

    // 2. If the server call fails, roll back to what we had
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['campaigns'], context.previous);
      }
      alert('Failed to delete campaign. Please try again.');
    },

    // 3. Always refetch in the background after success/error to stay in sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  // Seed the query cache with server-rendered data so the list never flashes
  // (useQuery will pick this up immediately without a network request)
  const campaigns: Campaign[] =
    (queryClient.getQueryData<{ success: boolean; data: Campaign[] }>(['campaigns'])?.data) ??
    initialCampaigns;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    deleteMutation.mutate(id);
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
            {campaigns.map((c) => {
              const isDeleting = deleteMutation.isPending && deleteMutation.variables === c.id;
              return (
                <tr
                  key={c.id}
                  className={`table-row-hover group cursor-pointer transition-opacity duration-200 ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
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
                      disabled={isDeleting}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete Campaign"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
