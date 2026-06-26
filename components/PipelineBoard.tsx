'use client';
import Link from 'next/link';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import type { Article, ArticleStatus } from '@/types';

const COLUMNS: ArticleStatus[] = [
  'draft',
  'optimizing',
  'ready',
  'scheduled',
  'published',
];

export function PipelineBoard({
  articles,
  onStatusChange,
}: {
  articles: Article[];
  onStatusChange: (id: string, status: ArticleStatus) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const items = articles.filter((a) => a.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id) onStatusChange(id, col);
            }}
            className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-surface/30"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <StatusBadge status={col} />
              <span className="tabular text-xs text-faint">{items.length}</span>
            </div>
            <div className="flex min-h-[100px] flex-1 flex-col gap-2 p-2">
              {items.map((a) => (
                <PipelineCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineCard({ article }: { article: Article }) {
  const score = article.seoScore?.score ?? 0;
  const scoreCls =
    score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger';
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', article.id)}
      className="group cursor-grab rounded-md border border-border bg-surface p-2.5 transition-colors hover:border-border-strong active:cursor-grabbing"
    >
      <Link href={`/editor/${article.id}`} draggable={false} className="block">
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-medium text-fg transition-colors group-hover:text-accent">
              {article.title}
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="truncate text-2xs text-faint">{article.targetKeyword}</span>
              {article.seoScore && (
                <span className={cn('tabular shrink-0 text-2xs font-semibold', scoreCls)}>
                  {score}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
