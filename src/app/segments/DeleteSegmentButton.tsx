'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Segment } from '@/lib/api';
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteSegmentButton({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.segments.delete(id),

    // 1. Immediately remove from cached list
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['segments'] });

      const previous = queryClient.getQueryData<{ success: boolean; data: Segment[] }>(['segments']);

      queryClient.setQueryData<{ success: boolean; data: Segment[] }>(['segments'], (old) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((s) => s.id !== id) };
      });

      return { previous };
    },

    // 2. Roll back on error
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['segments'], context.previous);
      }
      alert('Failed to delete segment. Please try again.');
    },

    // 3. Reconcile with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this segment?')) return;
    deleteMutation.mutate();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
      title="Delete Segment"
    >
      {deleteMutation.isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
