import { api } from '@/lib/api';
import Link from 'next/link';
import { Megaphone, Plus, ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Campaigns' };
export const revalidate = 0;

export default async function CampaignsPage() {
  const { data: campaigns } = await api.campaigns.list();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-pink-400" /> Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} created</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass p-16 text-center">
          <Megaphone className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No campaigns yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">Create your first campaign with AI-powered messaging.</p>
          <Link href="/campaigns/new" className="btn-primary">Create Campaign</Link>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Campaign', 'Channel', 'Status', 'Recipients', 'Sent', 'Delivered', 'Opened', 'Created'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map((c) => (
                  <Link key={c.id} href={`/campaigns/${c.id}`} legacyBehavior>
                    <tr className="table-row-hover group">
                      <td className="px-5 py-4">
                        <p className="font-medium text-white group-hover:text-brand-300 transition-colors">{c.name}</p>
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
                    </tr>
                  </Link>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
