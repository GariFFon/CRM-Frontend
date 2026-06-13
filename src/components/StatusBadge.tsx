import { clsx } from 'clsx';

type Props = { status: 'draft' | 'active' | 'completed'; className?: string };

const CONFIG = {
  draft:     { label: 'Draft',     dot: 'bg-slate-400' },
  active:    { label: 'Active',    dot: 'bg-brand-400 animate-pulse' },
  completed: { label: 'Completed', dot: 'bg-emerald-400' },
};

export default function StatusBadge({ status, className }: Props) {
  const { label, dot } = CONFIG[status];
  return (
    <span className={clsx('badge', `status-${status}`, className)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}
