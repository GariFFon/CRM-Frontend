import type { Metadata } from 'next';
// @ts-ignore - Next.js handles this, but tsc sometimes complains
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: { default: 'Xeno CRM', template: '%s — Xeno CRM' },
  description: 'AI-powered customer engagement platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="flex h-screen overflow-hidden bg-surface-900">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-purple-600/8 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-pink-600/6 blur-3xl" />
        </div>

        <Sidebar />
        <main className="relative z-10 flex-1 overflow-y-auto">
          <div className="min-h-full p-6 lg:p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
