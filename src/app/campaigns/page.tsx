import { api } from '@/lib/api';
import Link from 'next/link';
import { Megaphone, Plus } from 'lucide-react';
import CampaignTableClient from '@/components/CampaignTableClient';
import CampaignsCacheSeeder from '@/components/CampaignsCacheSeeder';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Campaigns' };
export const revalidate = 0;

export default async function CampaignsPage() {
  const { data: campaigns } = await api.campaigns.list();

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Seed the React Query cache with SSR data so mutations are instant */}
      <CampaignsCacheSeeder campaigns={campaigns} />

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

      <CampaignTableClient initialCampaigns={campaigns} />
    </div>
  );
}
