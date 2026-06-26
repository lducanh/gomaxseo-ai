'use client';
import Link from 'next/link';
import { FolderKanban, Plus, FileText, Fingerprint, ChevronRight } from 'lucide-react';
import { useStudio, useHydrated, useLanguage } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

export default function CampaignsPage() {
  const hydrated = useHydrated();
  const t = useT();
  const isEn = useLanguage() === 'en';
  const campaigns = useStudio((s) => s.campaigns);
  const articles = useStudio((s) => s.articles);
  const brandVoices = useStudio((s) => s.brandVoices);

  if (!hydrated) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-9 w-48" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t.nav.campaigns}
        description={isEn ? 'Group articles into topic clusters with cross-linking.' : 'Nhóm bài viết thành cụm chủ đề có liên kết chéo.'}
      >
        <Link href="/campaigns/new?tab=bulk">
          <Button>
            <Plus className="h-4 w-4" />
            {t.actions.newCampaign}
          </Button>
        </Link>
      </PageHeader>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={isEn ? 'No campaigns yet' : 'Chưa có chiến dịch'}
          description={isEn ? 'Create a campaign to generate articles in bulk.' : 'Tạo chiến dịch để sản xuất bài viết hàng loạt.'}
          action={
            <Link href="/campaigns/new?tab=bulk">
              <Button>
                <Plus className="h-4 w-4" />
                {t.actions.newCampaign}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((c) => {
            const count = articles.filter((a) => a.campaignId === c.id).length;
            const published = articles.filter((a) => a.campaignId === c.id && a.status === 'published').length;
            const voice = brandVoices.find((v) => v.id === c.brandVoiceId);
            return (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="block">
                <Card className="group p-5 transition-colors hover:border-border-strong hover:bg-surface-hover/40">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-semibold text-fg transition-colors group-hover:text-accent">
                      {c.name}
                    </h3>
                    <ChevronRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-faint" />
                      <span className="tabular">{count}</span> {isEn ? 'articles' : 'bài'}
                    </span>
                    {published > 0 && (
                      <span className="text-success">
                        <span className="tabular">{published}</span> {t.status.published.toLowerCase()}
                      </span>
                    )}
                    {voice && (
                      <span className="flex items-center gap-1.5">
                        <Fingerprint className="h-3.5 w-3.5 text-faint" />
                        {voice.name}
                      </span>
                    )}
                    <span className="ml-auto text-faint">{formatDate(c.createdAt, isEn ? 'en-US' : 'vi-VN')}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
