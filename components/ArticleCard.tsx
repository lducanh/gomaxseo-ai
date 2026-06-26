'use client';
import Link from 'next/link';
import { cn, timeAgo } from '@/lib/utils';
import { useLanguage } from '@/lib/store';
import { Card } from './ui/Card';
import { StatusBadge } from './StatusBadge';
import { DemoBadge } from './DemoBadge';
import { useT } from '@/lib/i18n';
import type { Article } from '@/types';

export function ArticleCard({ article }: { article: Article }) {
  const lang = useLanguage();
  const t = useT();
  const score = article.seoScore?.score ?? 0;
  const scoreCls =
    score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger';

  return (
    <Link href={`/editor/${article.id}`} className="block">
      <Card className="group p-4 transition-colors hover:border-border-strong hover:bg-surface-hover/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-fg transition-colors group-hover:text-accent">
              {article.title}
            </h3>
            <p className="mt-1 truncate text-xs text-faint">{article.targetKeyword}</p>
          </div>
          {article.seoScore && (
            <span className={cn('tabular shrink-0 text-sm font-semibold', scoreCls)}>
              {score}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={article.status} />
          {article.isDemo && <DemoBadge label={t.common.demoData} />}
          <span className="ml-auto text-2xs text-faint">{timeAgo(article.updatedAt, lang)}</span>
        </div>
      </Card>
    </Link>
  );
}
