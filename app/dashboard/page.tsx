'use client';
import Link from 'next/link';
import {
  FileText,
  Send,
  CalendarClock,
  Sparkles,
  Plus,
  FolderPlus,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import { useStudio, useHydrated, useLanguage } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArticleCard } from '@/components/ArticleCard';
import { PipelineBoard } from '@/components/PipelineBoard';
import type { ArticleStatus } from '@/types';

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="tabular text-2xl font-semibold leading-none text-fg">{value}</div>
        <div className="mt-1 text-xs text-muted">{label}</div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const hydrated = useHydrated();
  const t = useT();
  const isEn = useLanguage() === 'en';
  const articles = useStudio((s) => s.articles);
  const campaigns = useStudio((s) => s.campaigns);
  const updateArticle = useStudio((s) => s.updateArticle);
  const loadDemo = useStudio((s) => s.loadDemo);

  if (!hydrated) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-9 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="mt-8 h-64" />
      </PageContainer>
    );
  }

  const now = new Date();
  const thisMonth = articles.filter((a) => {
    const d = new Date(a.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const published = articles.filter((a) => a.status === 'published').length;
  const scheduled = articles.filter((a) => a.status === 'scheduled').length;

  const isEmpty = articles.length === 0 && campaigns.length === 0;
  const recent = [...articles]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 6);

  return (
    <PageContainer>
      <PageHeader title={t.nav.dashboard} description={t.tagline}>
        <Link href="/campaigns/new?tab=bulk">
          <Button variant="outline">
            <FolderPlus className="h-4 w-4" />
            {t.actions.newCampaign}
          </Button>
        </Link>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t.actions.newArticle}
          </Button>
        </Link>
      </PageHeader>

      {isEmpty ? (
        <EmptyState
          icon={LayoutDashboard}
          title={isEn ? 'Nothing here yet' : 'Chưa có nội dung nào'}
          description={
            isEn
              ? 'Create your first SEO article, or load demo data to explore the full flow instantly.'
              : 'Tạo bài viết SEO đầu tiên, hoặc nạp dữ liệu mẫu để xem ngay toàn bộ luồng.'
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/campaigns/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  {t.actions.newArticle}
                </Button>
              </Link>
              <Button variant="secondary" onClick={loadDemo}>
                <Sparkles className="h-4 w-4" />
                {t.actions.loadDemo}
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={FileText} label={isEn ? 'Articles this month' : 'Bài tháng này'} value={thisMonth} tone="bg-accent/10 text-accent" />
            <StatCard icon={Send} label={t.status.published} value={published} tone="bg-success/10 text-success" />
            <StatCard icon={CalendarClock} label={t.status.scheduled} value={scheduled} tone="bg-info/10 text-info" />
            <StatCard icon={FileText} label={isEn ? 'Total articles' : 'Tổng số bài'} value={articles.length} tone="bg-surface-hover text-muted" />
          </div>

          {articles.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-fg">Pipeline</h2>
              <PipelineBoard
                articles={articles}
                onStatusChange={(id, status: ArticleStatus) => updateArticle(id, { status })}
              />
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-fg">
                {isEn ? 'Recent articles' : 'Bài viết gần đây'}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}
