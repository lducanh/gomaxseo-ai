'use client';
import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useLanguage } from '@/lib/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const lang = useLanguage();

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar (fixed) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface/40 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 animate-fade-in bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 animate-fade-in border-r border-border bg-surface">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
