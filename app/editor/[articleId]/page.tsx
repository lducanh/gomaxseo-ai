'use client';
import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  CalendarClock,
  Link2,
  ListTree,
  Check,
  Loader2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { useStudio, useHydrated, useLanguage } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { analyzeSeo } from '@/lib/seo/score';
import { summarize, stripHtml } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Editor } from '@/components/Editor';
import { SeoScorePanel } from '@/components/SeoScorePanel';
import { InternalLinkChips } from '@/components/InternalLinkChips';
import { StatusBadge } from '@/components/StatusBadge';
import { DemoBadge } from '@/components/DemoBadge';
import type {
  Article,
  ArticleStatus,
  InternalLinkSuggestion,
  LinkCandidate,
  WpCategory,
} from '@/types';

export default function EditorPage({ params }: { params: { articleId: string } }) {
  const hydrated = useHydrated();
  const t = useT();
  const isEn = useLanguage() === 'en';
  const article = useStudio((s) => s.articles.find((a) => a.id === params.articleId));

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <Skeleton className="mb-5 h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)_320px]">
          <Skeleton className="hidden h-64 lg:block" />
          <Skeleton className="h-[560px]" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title={isEn ? 'Article not found' : 'Không tìm thấy bài viết'}
          action={
            <Link href="/dashboard">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                {t.nav.dashboard}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <EditorInner key={article.id} article={article} />;
}

function EditorInner({ article }: { article: Article }) {
  const t = useT();
  const isEn = useLanguage() === 'en';
  const language = useLanguage();
  const updateArticle = useStudio((s) => s.updateArticle);
  // live view of mutable fields (updated on publish)
  const live = useStudio((s) => s.articles.find((a) => a.id === article.id));

  const [title, setTitle] = React.useState(article.title);
  const [meta, setMeta] = React.useState(article.metaDescription);
  const [keyword, setKeyword] = React.useState(article.targetKeyword);
  const [slug, setSlug] = React.useState(article.slug);
  const [html, setHtml] = React.useState(article.contentHtml);
  const [suggestions, setSuggestions] = React.useState<InternalLinkSuggestion[]>(
    article.internalLinks,
  );
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [linking, setLinking] = React.useState(false);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [publishMode, setPublishMode] = React.useState<'publish' | 'future'>('publish');
  const editorRef = React.useRef<TiptapEditor | null>(null);
  const handleEditor = React.useCallback((e: TiptapEditor | null) => {
    editorRef.current = e;
  }, []);

  const score = React.useMemo(
    () => analyzeSeo(html, keyword, title, meta, language),
    [html, keyword, title, meta, language],
  );

  const outline = React.useMemo(() => {
    const re = /<(h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
    const items: { level: number; text: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      items.push({ level: m[1].toLowerCase() === 'h2' ? 2 : 3, text: stripHtml(m[2]) });
    }
    return items;
  }, [html]);

  // debounced autosave to the store
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState('saving');
    const id = setTimeout(() => {
      updateArticle(article.id, {
        title,
        metaDescription: meta,
        targetKeyword: keyword,
        slug,
        contentHtml: html,
        seoScore: score,
        internalLinks: suggestions,
      });
      setSaveState('saved');
    }, 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, meta, keyword, slug, html, suggestions]);

  const scrollToHeading = (idx: number) => {
    const dom = editorRef.current?.view.dom as HTMLElement | undefined;
    if (!dom) return;
    const heads = dom.querySelectorAll('h2, h3');
    heads[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const suggestLinks = async () => {
    const others: LinkCandidate[] = useStudio
      .getState()
      .articles.filter((a) => a.campaignId === article.campaignId && a.id !== article.id)
      .map((o) => ({
        id: o.id,
        title: o.title,
        slug: o.slug,
        keyword: o.targetKeyword,
        summary: summarize(o.contentHtml, 160),
      }));
    if (others.length === 0) {
      toast.info(isEn ? 'Add more articles to this campaign first.' : 'Hãy thêm bài khác vào campaign trước.');
      return;
    }
    setLinking(true);
    try {
      const { data } = await api.internalLinks(
        { title, keyword, summary: summarize(html, 160) },
        others,
        language,
      );
      const existing = new Set(suggestions.map((s) => s.targetArticleId));
      const fresh = data.filter((s) => !existing.has(s.targetArticleId));
      if (fresh.length === 0) {
        toast.info(isEn ? 'No new suggestions.' : 'Không có gợi ý mới.');
      } else {
        setSuggestions((prev) => [...prev, ...fresh]);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLinking(false);
    }
  };

  const acceptLink = (s: InternalLinkSuggestion) => {
    editorRef.current
      ?.chain()
      .focus()
      .insertContent(` <a href="/${s.targetSlug}">${s.anchorText}</a>`)
      .run();
    setSuggestions((prev) => prev.map((x) => (x.id === s.id ? { ...x, accepted: true } : x)));
    toast.success(isEn ? 'Link inserted' : 'Đã chèn liên kết');
  };
  const rejectLink = (s: InternalLinkSuggestion) =>
    setSuggestions((prev) => prev.filter((x) => x.id !== s.id));

  const onPublished = (result: {
    status: ArticleStatus;
    link?: string;
    id?: number;
    date?: string;
  }) => {
    updateArticle(article.id, {
      status: result.status,
      wordpressUrl: result.link,
      wordpressPostId: result.id,
      scheduledFor: result.date,
    });
  };

  const metaLen = meta.length;
  const metaTone = metaLen >= 120 && metaLen <= 160 ? 'text-success' : 'text-faint';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* top row */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href={`/campaigns/${article.campaignId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.actions.back}
        </Link>
        <div className="flex items-center gap-2 text-xs text-faint">
          {saveState === 'saving' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isEn ? 'Saving…' : 'Đang lưu…'}
            </>
          ) : saveState === 'saved' ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              {t.actions.saved}
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_minmax(0,1fr)_320px]">
        {/* outline */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">
              <ListTree className="h-3.5 w-3.5" />
              {isEn ? 'Outline' : 'Dàn ý'}
            </div>
            {outline.length === 0 ? (
              <p className="text-2xs text-faint">—</p>
            ) : (
              <ul className="flex flex-col gap-0.5 border-l border-border">
                {outline.map((o, i) => (
                  <li key={i}>
                    <button
                      onClick={() => scrollToHeading(i)}
                      className={`-ml-px block w-full truncate border-l-2 border-transparent py-1 text-left text-xs transition-colors hover:border-accent hover:text-fg ${
                        o.level === 3 ? 'pl-5 text-faint' : 'pl-3 text-muted'
                      }`}
                    >
                      {o.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* editor middle */}
        <div className="flex min-w-0 flex-col gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.common.title}
            className="w-full bg-transparent font-display text-2xl font-bold tracking-tight text-fg placeholder:text-faint focus:outline-none"
          />
          <div>
            <Textarea
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              rows={2}
              placeholder={t.common.meta}
              className="text-sm"
            />
            <div className={`mt-1 text-right text-2xs ${metaTone}`}>
              <span className="tabular">{metaLen}</span> / 120–160
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">{t.common.keyword}</Label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t.common.slug}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
          <Editor
            content={article.contentHtml}
            onChange={setHtml}
            onEditor={handleEditor}
            placeholder={isEn ? 'Start writing…' : 'Bắt đầu viết…'}
          />
        </div>

        {/* right column */}
        <aside className="flex flex-col gap-4">
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                {live && <StatusBadge status={live.status} />}
                {live?.isDemo && <DemoBadge label={t.common.demoData} />}
              </div>
              {live?.wordpressUrl && (
                <a
                  href={live.wordpressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isEn ? 'View post' : 'Xem bài đăng'}
                </a>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setPublishMode('publish');
                    setPublishOpen(true);
                  }}
                >
                  <Send className="h-4 w-4" />
                  {t.actions.publish}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPublishMode('future');
                    setPublishOpen(true);
                  }}
                  aria-label={t.actions.schedule}
                  title={t.actions.schedule}
                >
                  <CalendarClock className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <SeoScorePanel score={score} lang={language} />
            </Card>

            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                  <Link2 className="h-4 w-4 text-accent" />
                  {isEn ? 'Internal links' : 'Liên kết nội bộ'}
                </h3>
                <Button size="sm" variant="ghost" onClick={suggestLinks} loading={linking}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {isEn ? 'Suggest' : 'Gợi ý'}
                </Button>
              </div>
              <InternalLinkChips
                suggestions={suggestions}
                onAccept={acceptLink}
                onReject={rejectLink}
              />
            </Card>
          </div>
        </aside>
      </div>

      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        initialStatus={publishMode}
        post={{ title, contentHtml: html, metaDescription: meta, slug }}
        onPublished={onPublished}
        isEn={isEn}
      />
    </div>
  );
}

function PublishModal({
  open,
  onClose,
  initialStatus,
  post,
  onPublished,
  isEn,
}: {
  open: boolean;
  onClose: () => void;
  initialStatus: 'publish' | 'future';
  post: { title: string; contentHtml: string; metaDescription: string; slug: string };
  onPublished: (r: { status: ArticleStatus; link?: string; id?: number; date?: string }) => void;
  isEn: boolean;
}) {
  const wp = useStudio((s) => s.wp);
  const [status, setStatus] = React.useState<'publish' | 'future' | 'draft'>(initialStatus);
  const [date, setDate] = React.useState('');
  const [cats, setCats] = React.useState<WpCategory[]>([]);
  const [catId, setCatId] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStatus(initialStatus);
    api
      .wpTaxonomies(wp)
      .then(({ data }) => setCats(data.categories || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStatus]);

  const submit = async () => {
    if (status === 'future' && !date) {
      toast.error(isEn ? 'Pick a date & time.' : 'Hãy chọn ngày giờ.');
      return;
    }
    setBusy(true);
    try {
      const iso = status === 'future' && date ? new Date(date).toISOString() : undefined;
      const { data } = await api.wpPublish(
        wp,
        {
          title: post.title,
          contentHtml: post.contentHtml,
          excerpt: post.metaDescription,
          slug: post.slug,
          status,
          date: iso,
          categoryIds: catId ? [Number(catId)] : undefined,
        },
        wp.sandbox,
      );
      if (data.ok) {
        const mapped: ArticleStatus =
          status === 'publish' ? 'published' : status === 'future' ? 'scheduled' : 'draft';
        onPublished({ status: mapped, link: data.link, id: data.id, date: iso });
        toast.success(
          (status === 'future'
            ? isEn ? 'Scheduled' : 'Đã lên lịch'
            : status === 'draft'
              ? isEn ? 'Saved as draft' : 'Đã lưu nháp'
              : isEn ? 'Published' : 'Đã đăng') + (data.sandbox ? ' (sandbox)' : ''),
        );
        onClose();
      } else {
        toast.error(data.error || (isEn ? 'Publish failed' : 'Đăng thất bại'));
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEn ? 'Publish to WordPress' : 'Đăng lên WordPress'}
      description={
        wp.sandbox
          ? isEn
            ? 'Sandbox is on — this will be simulated.'
            : 'Sandbox đang bật — thao tác sẽ được mô phỏng.'
          : wp.siteUrl
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {isEn ? 'Cancel' : 'Hủy'}
          </Button>
          <Button onClick={submit} loading={busy}>
            <Send className="h-4 w-4" />
            {status === 'future' ? (isEn ? 'Schedule' : 'Lên lịch') : isEn ? 'Publish' : 'Đăng'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <Label>{isEn ? 'Status' : 'Trạng thái'}</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="publish">{isEn ? 'Publish now' : 'Đăng ngay'}</option>
            <option value="future">{isEn ? 'Schedule' : 'Lên lịch'}</option>
            <option value="draft">{isEn ? 'Save as draft' : 'Lưu nháp'}</option>
          </Select>
        </div>
        {status === 'future' && (
          <div>
            <Label>{isEn ? 'Date & time' : 'Ngày & giờ'}</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        <div>
          <Label>
            {isEn ? 'Category' : 'Danh mục'}{' '}
            <span className="font-normal text-faint">({isEn ? 'optional' : 'tùy chọn'})</span>
          </Label>
          <Select value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">{isEn ? '— None —' : '— Không —'}</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
}
