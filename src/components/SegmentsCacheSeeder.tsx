'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Segment } from '@/lib/api';

/**
 * Seeds the React Query cache with server-rendered segment data.
 */
export default function SegmentsCacheSeeder({ segments }: { segments: Segment[] }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(['segments'], { success: true, data: segments });
  }, [segments, queryClient]);

  return null;
}
