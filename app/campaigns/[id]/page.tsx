'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Link2, Send, ExternalLink, FileText } from 'lucide-react';
import {
  useStudio,
  useHydrated,
  useLanguage,
  useCampaignArticles,
} from '@/lib/store';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { summarize } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { PipelineBoard } from '@/components/PipelineBoard';
import type { ArticleStatus, InternalLinkSuggestion, LinkCandidate } from '@/types';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const hydrated = useHydrated();
  const t = useT();
  const isEn = useLanguage() === 'en';
  const language = useLanguage();
  const campaign = useStudio((s) => s.campaigns.find((c) => c.id === params.id));
  const articles = useCampaignArticles(params.id);
  const brandVoices = useStudio((s) => s.brandVoices);
  const updateArticle = useStudio((s) => s.updateArticle);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [linking, setLinking] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  if (!hydrated) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-9 w-64" />
        <Skeleton className="h-72" />
      </PageContainer>
    );
  }

  if (!campaign) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileText}
          title={isEn ? 'Campaign not found' : 'Không tìm thấy chiến dịch'}
          action={
            <Link href="/campaigns">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                {t.nav.campaigns}
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const voice = brandVoices.find((v) => v.id === campaign.brandVoiceId);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const suggestCrossLinks = async () => {
    if (articles.length < 2) {
      toast.info(isEn ? 'Need at least 2 articles.' : 'Cần ít nhất 2 bài viết.');
      return;
    }
    setLinking(true);
    try {
      for (const a of articles) {
        const others: LinkCandidate[] = articles
          .filter((o) => o.id !== a.id)
          .map((o) => ({
            id: o.id,
            title: o.title,
            slug: o.slug,
            keyword: o.targetKeyword,
            summary: summarize(o.contentHtml, 160),
          }));
        const { data } = await api.internalLinks(
          { title: a.title, keyword: a.targetKeyword, summary: summarize(a.contentHtml, 160) },
          others,
          language,
        );
        const existingTargets = new Set(a.internalLinks.map((l) => l.targetArticleId));
        const merged: InternalLinkSuggestion[] = [
          ...a.internalLinks,
          ...data.filter((s) => !existingTargets.has(s.targetArticleId)),
        ];
        updateArticle(a.id, { internalLinks: merged });
      }
      toast.success(isEn ? 'Cross-link suggestions ready — review them in the editor.' : 'Đã gợi ý liên kết chéo — mở editor để duyệt.');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLinking(false);
    }
  };

  const publishSelected = async () => {
    const targets = articles.filter((a) => selected.has(a.id));
    if (targets.length === 0) return;
    const wp = useStudio.getState().wp;
    setPublishing(true);
    let ok = 0;
    for (const a of targets) {
      try {
        const { data } = await api.wpPublish(
          wp,
          {
            title: a.title,
            contentHtml: a.contentHtml,
            excerpt: a.metaDescription,
            slug: a.slug,
            status: 'publish',
          },
          wp.sandbox,
        );
        if (data.ok) {
          ok++;
          updateArticle(a.id, {
            status: 'published',
            wordpressUrl: data.link,
            wordpressPostId: data.id,
          });
        }
      } catch {
        /* skip */
      }
    }
    setPublishing(false);
    setSelected(new Set());
    toast.success(
      (isEn ? 'Published ' : 'Đã đăng ') + ok + (isEn ? ' article(s)' : ' bài') + (wp.sandbox ? ' (sandbox)' : ''),
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={campaign.name}
        breadcrumb={
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.nav.campaigns}
          </Link>
        }
        description={`${articles.length} ${isEn ? 'articles' : 'bài'}${voice ? ' · ' + voice.name : ''}`}
      >
        <Button variant="outline" onClick={suggestCrossLinks} loading={linking}>
          <Link2 className="h-4 w-4" />
          {isEn ? 'Suggest cross-links' : 'Gợi ý liên kết chéo'}
        </Button>
      </PageHeader>

      {articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={isEn ? 'No articles in this campaign' : 'Chưa có bài viết'}
          description={isEn ? 'Generate articles to populate this campaign.' : 'Tạo bài viết để lấp đầy chiến dịch này.'}
          action={
            <Link href="/campaigns/new?tab=bulk">
              <Button>{t.actions.generateAll}</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-fg">Pipeline</h2>
            <PipelineBoard
              articles={articles}
              onStatusChange={(id, status: ArticleStatus) => updateArticle(id, { status })}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-fg">
                {isEn ? 'Articles' : 'Danh sách bài'}
              </h2>
              {selected.size > 0 && (
                <Button onClick={publishSelected} loading={publishing}>
                  <Send className="h-4 w-4" />
                  {isEn ? `Publish ${selected.size}` : `Đăng ${selected.size} bài`}
                </Button>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              {articles.map((a, i) => {
                const score = a.seoScore?.score ?? 0;
                const scoreCls =
                  score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger';
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 bg-surface px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-[hsl(var(--accent))]"
                    />
                    <Link href={`/editor/${a.id}`} className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-fg hover:text-accent">
                        {a.title}
                      </div>
                      <div className="truncate text-2xs text-faint">{a.targetKeyword}</div>
                    </Link>
                    {a.seoScore && (
                      <span className={`tabular shrink-0 text-sm font-semibold ${scoreCls}`}>
                        {score}
                      </span>
                    )}
                    <div className="hidden shrink-0 sm:block">
                      <StatusBadge status={a.status} />
                    </div>
                    {a.wordpressUrl && (
                      <a
                        href={a.wordpressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-faint hover:text-accent"
                        aria-label="Open published"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
