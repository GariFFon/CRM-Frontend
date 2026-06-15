'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Campaign } from '@/lib/api';

/**
 * Seeds the React Query cache with server-rendered campaign data.
 * This runs once on mount (client-side hydration) so mutations can
 * optimistically update the cache without waiting for a client fetch.
 */
export default function CampaignsCacheSeeder({ campaigns }: { campaigns: Campaign[] }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(['campaigns'], { success: true, data: campaigns });
  }, [campaigns, queryClient]);

  return null;
}
