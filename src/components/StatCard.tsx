import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  loading?: boolean;
};

export default function StatCard({
  title, value, subtitle, icon: Icon, iconColor = 'text-brand-400',
  trend, trendLabel, loading,
}: Props) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-16 rounded mt-1" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  return (
    <div className="stat-card group animate-fade-in">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <div className={clsx('p-2 rounded-lg bg-white/5', iconColor.replace('text-', 'text-'))}>
          <Icon className={clsx('h-4 w-4', iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {(subtitle || trendLabel) && (
        <div className="flex items-center gap-1.5">
          {trend && (
            <>
              {trend === 'up'   && <TrendingUp className="h-3 w-3 text-emerald-400" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
              {trend === 'flat' && <Minus className="h-3 w-3 text-slate-500" />}
            </>
          )}
          <p className="text-xs text-slate-500">{trendLabel ?? subtitle}</p>
        </div>
      )}
    </div>
  );
}
