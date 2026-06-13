import { api } from '@/lib/api';
import Link from 'next/link';
import { Users, Filter, Megaphone, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };
export const revalidate = 30;

export default async function DashboardPage() {
  const { data } = await api.dashboard.get();

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getGreeting()}, <span className="gradient-text">Campaign Co-Pilot</span> ✦
          </h1>
          <p className="text-sm text-slate-400 mt-1">Here's what's happening with your CRM today.</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary">
          <Zap className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={data.totalCustomers.toLocaleString()}
          icon={Users}
          iconColor="text-brand-400"
          trendLabel="in your database"
        />
        <StatCard
          title="Segments"
          value={data.totalSegments}
          icon={Filter}
          iconColor="text-purple-400"
          trendLabel="audience groups"
        />
        <StatCard
          title="Campaigns"
          value={data.totalCampaigns}
          icon={Megaphone}
          iconColor="text-pink-400"
          trendLabel="total created"
        />
        <StatCard
          title="Avg Delivery Rate"
          value={`${data.avgDeliveryRate ?? 0}%`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          trend={data.avgDeliveryRate > 70 ? 'up' : 'flat'}
          trendLabel="across all campaigns"
        />
      </div>

      {/* Recent Campaigns */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">Recent Campaigns</h2>
          <Link href="/campaigns" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {data.recentCampaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Launch your first campaign to start engaging customers."
            href="/campaigns/new"
            cta="Create Campaign"
          />
        ) : (
          <div className="space-y-2">
            {data.recentCampaigns.map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{c.name}</p>
                    <p className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ChannelBadge channel={c.channel} />
                  {c.stats && c.stats.total > 0 && (
                    <span className="text-xs text-slate-400">{c.stats.total.toLocaleString()} recipients</span>
                  )}
                  <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/segments/new', icon: Filter,    title: 'Build a Segment', desc: 'Use AI to define your audience', color: 'from-purple-600/20 to-purple-600/5' },
          { href: '/campaigns/new', icon: Megaphone, title: 'Create Campaign', desc: 'Write AI-powered messages', color: 'from-brand-600/20 to-brand-600/5' },
          { href: '/customers',     icon: Users,     title: 'Browse Customers', desc: 'View all 600 customer profiles', color: 'from-pink-600/20 to-pink-600/5' },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={href} href={href} className={`glass p-5 bg-gradient-to-br ${color} hover:scale-[1.02] transition-all duration-200 group`}>
            <Icon className="h-5 w-5 text-brand-400 mb-3" />
            <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function EmptyState({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-1 mb-4">{description}</p>
      <Link href={href} className="btn-primary text-xs">{cta}</Link>
    </div>
  );
}
