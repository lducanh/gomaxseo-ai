'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Fingerprint,
  Settings,
  Plus,
  Zap,
  FlaskConical,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useStudio } from '@/lib/store';
import { Button } from './ui/Button';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const pathname = usePathname();
  const sandbox = useStudio((s) => s.wp.sandbox);
  const verified = useStudio((s) => s.wp.verified);

  const items = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/campaigns', label: t.nav.campaigns, icon: FolderKanban },
    { href: '/brand-voice', label: t.nav.brandVoice, icon: Fingerprint },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col p-3">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-5 flex items-center gap-2.5 px-2 py-1"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-contrast shadow-subtle">
          <Zap className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight text-fg">
            GoMax
          </span>
          <span className="mt-0.5 text-2xs font-medium uppercase tracking-[0.14em] text-faint">
            SEO Studio
          </span>
        </span>
      </Link>

      <Link href="/campaigns/new" onClick={onNavigate} className="mb-5 block">
        <Button className="w-full">
          <Plus className="h-4 w-4" />
          {t.actions.newArticle}
        </Button>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            pathname.startsWith(it.href + '/') ||
            (it.href === '/dashboard' && pathname === '/');
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent/10 font-medium text-accent'
                  : 'text-muted hover:bg-surface-hover hover:text-fg',
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px]',
                  active ? 'text-accent' : 'text-faint group-hover:text-muted',
                )}
              />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <Link href="/settings" onClick={onNavigate} className="mt-auto block">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:border-border-strong">
          {sandbox ? (
            <FlaskConical className="h-4 w-4 shrink-0 text-warning" />
          ) : (
            <Plug className={cn('h-4 w-4 shrink-0', verified ? 'text-success' : 'text-faint')} />
          )}
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-fg">
              {sandbox ? t.common.sandbox : verified ? t.common.connected : t.common.notConnected}
            </span>
            <span className="text-2xs text-faint">WordPress</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
