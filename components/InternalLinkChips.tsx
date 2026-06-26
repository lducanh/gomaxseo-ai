'use client';
import { Link2, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { useT } from '@/lib/i18n';
import { useLanguage } from '@/lib/store';
import type { InternalLinkSuggestion } from '@/types';

export function InternalLinkChips({
  suggestions,
  onAccept,
  onReject,
}: {
  suggestions: InternalLinkSuggestion[];
  onAccept: (s: InternalLinkSuggestion) => void;
  onReject: (s: InternalLinkSuggestion) => void;
}) {
  const t = useT();
  const isEn = useLanguage() === 'en';

  if (!suggestions.length) {
    return (
      <EmptyState
        icon={Link2}
        title={isEn ? 'No suggestions yet' : 'Chưa có gợi ý'}
        description={
          isEn
            ? 'Add more articles to this campaign to get cross-link ideas.'
            : 'Thêm bài khác vào campaign để nhận gợi ý liên kết chéo.'
        }
        className="py-8"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {suggestions.map((s) => (
        <div key={s.id} className="rounded-lg border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate">{s.anchorText}</span>
              </div>
              <p className="mt-0.5 truncate text-2xs text-faint">→ {s.targetTitle}</p>
            </div>
            {s.accepted && (
              <Badge tone="success" className="shrink-0 gap-1">
                <Check className="h-3 w-3" />
                {isEn ? 'Inserted' : 'Đã chèn'}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{s.reason}</p>
          {!s.accepted && (
            <div className="mt-2.5 flex gap-2">
              <Button size="sm" onClick={() => onAccept(s)}>
                {t.actions.accept}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onReject(s)}>
                {t.actions.reject}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
