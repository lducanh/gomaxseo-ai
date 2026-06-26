'use client';
import { Badge } from './ui/Badge';
import { useT, STATUS_TONE } from '@/lib/i18n';
import type { ArticleStatus } from '@/types';

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const t = useT();
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {t.status[status]}
    </Badge>
  );
}
