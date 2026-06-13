'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Filter,
  Megaphone,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/customers',   icon: Users,           label: 'Customers' },
  { href: '/segments',    icon: Filter,          label: 'Segments' },
  { href: '/campaigns',   icon: Megaphone,       label: 'Campaigns' },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="relative z-20 flex w-60 flex-col border-r border-white/5 bg-surface-800/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg shadow-brand-900/50">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Xeno CRM</p>
          <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">AI Campaign Co-Pilot</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-gradient-to-r from-brand-600/20 to-purple-600/10 text-white border border-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={clsx('h-4 w-4 shrink-0', active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300')} />
              {label}
              {active && <ChevronRight className="ml-auto h-3 w-3 text-brand-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="glass-sm px-3 py-2.5">
          <p className="text-xs font-semibold text-brand-400">✦ AI Powered</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Gemini 1.5 Flash</p>
        </div>
      </div>
    </aside>
  );
}
