'use client';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudio, useLanguage } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { Badge } from './ui/Badge';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const setLanguage = useStudio((s) => s.setLanguage);
  const sandbox = useStudio((s) => s.wp.sandbox);
  const verified = useStudio((s) => s.wp.verified);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenu}
        aria-label="Mở menu"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-fg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <Link href="/settings" aria-label="WordPress">
        {sandbox ? (
          <Badge tone="warning" dot>
            {t.common.sandbox}
          </Badge>
        ) : verified ? (
          <Badge tone="success" dot>
            {t.common.connected}
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            {t.common.notConnected}
          </Badge>
        )}
      </Link>

      <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
        {(['vi', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            aria-pressed={lang === l}
            className={cn(
              'cursor-pointer rounded px-2 py-1 text-xs font-semibold uppercase transition-colors',
              lang === l ? 'bg-accent/15 text-accent' : 'text-faint hover:text-fg',
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </header>
  );
}
