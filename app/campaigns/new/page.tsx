'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Wand2,
  Eye,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderPlus,
} from 'lucide-react';
import { useStudio, useHydrated, useLanguage } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { analyzeSeo } from '@/lib/seo/score';
import { uid } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { GenerationProgress } from '@/components/GenerationProgress';
import { DemoBadge } from '@/components/DemoBadge';
import type { Article, ContentBrief, Language } from '@/types';

export default function NewPage() {
  const hydrated = useHydrated();
  const t = useT();
  const isEn = useLanguage() === 'en';
  const language = useLanguage();
  const brandVoices = useStudio((s) => s.brandVoices);
  const router = useRouter();

  const [tab, setTab] = React.useState<'single' | 'bulk'>('single');

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('tab');
    if (p === 'bulk') setTab('bulk');
  }, []);

  const progressLabels = isEn
    ? ['Researching & building brief', 'Writing the draft', 'Scoring SEO']
    : ['Phân tích & tạo brief', 'Viết bản nháp', 'Chấm điểm SEO'];

  // ── helpers ──────────────────────────────────────────────────
  const ensureCampaign = (name: string, brandVoiceId?: string): string => {
    const store = useStudio.getState();
    const existing = store.campaigns.find((c) => c.name === name);
    if (existing) return existing.id;
    const id = uid('camp');
    store.addCampaign({
      id,
      name,
      brandVoiceId,
      language,
      articleIds: [],
      createdAt: new Date().toISOString(),
    });
    return id;
  };

  const makeArticle = (
    campaignId: string,
    brief: ContentBrief,
    gen: { title: string; metaDescription: string; slug: string; contentHtml: string },
    demo: boolean,
  ): Article => {
    const now = new Date().toISOString();
    return {
      id: uid('art'),
      campaignId,
      status: 'ready',
      brief,
      title: gen.title,
      slug: gen.slug,
      metaDescription: gen.metaDescription,
      contentHtml: gen.contentHtml,
      targetKeyword: brief.targetKeyword,
      seoScore: analyzeSeo(gen.contentHtml, brief.targetKeyword, gen.title, gen.metaDescription, language),
      internalLinks: [],
      language,
      isDemo: demo,
      createdAt: now,
      updatedAt: now,
    };
  };

  if (!hydrated) {
    return (
      <PageContainer>
        <PageHeader title={t.actions.newArticle} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={tab === 'single' ? t.actions.newArticle : t.actions.newCampaign}
        description={
          isEn
            ? 'From a keyword to a publish-ready, SEO-scored draft.'
            : 'Từ một từ khóa đến bản nháp chuẩn SEO, sẵn sàng đăng.'
        }
      >
        <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
          {(['single', 'bulk'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setTab(m)}
              className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === m ? 'bg-accent/15 text-accent' : 'text-muted hover:text-fg'
              }`}
            >
              {m === 'single' ? (isEn ? 'Single' : 'Một bài') : (isEn ? 'Bulk' : 'Hàng loạt')}
            </button>
          ))}
        </div>
      </PageHeader>

      {tab === 'single' ? (
        <SingleFlow
          isEn={isEn}
          language={language}
          brandVoices={brandVoices}
          progressLabels={progressLabels}
          ensureCampaign={ensureCampaign}
          makeArticle={makeArticle}
          onDone={(id) => router.push(`/editor/${id}`)}
        />
      ) : (
        <BulkFlow
          isEn={isEn}
          language={language}
          brandVoices={brandVoices}
          ensureCampaign={ensureCampaign}
          makeArticle={makeArticle}
          onDone={(cid) => router.push(`/campaigns/${cid}`)}
        />
      )}
    </PageContainer>
  );
}

// ── Single article flow ────────────────────────────────────────
function SingleFlow({
  isEn,
  language,
  brandVoices,
  progressLabels,
  ensureCampaign,
  makeArticle,
  onDone,
}: {
  isEn: boolean;
  language: Language;
  brandVoices: { id: string; name: string }[];
  progressLabels: string[];
  ensureCampaign: (name: string, voiceId?: string) => string;
  makeArticle: (
    campaignId: string,
    brief: ContentBrief,
    gen: { title: string; metaDescription: string; slug: string; contentHtml: string },
    demo: boolean,
  ) => Article;
  onDone: (id: string) => void;
}) {
  const t = useT();
  const addArticle = useStudio((s) => s.addArticle);
  const [keyword, setKeyword] = React.useState('');
  const [voiceId, setVoiceId] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [brief, setBrief] = React.useState<ContentBrief | null>(null);
  const [briefDemo, setBriefDemo] = React.useState(false);

  const standaloneName = isEn ? 'Standalone articles' : 'Bài viết lẻ';
  const voiceProfile = () => useStudio.getState().brandVoices.find((v) => v.id === voiceId);

  const finishWithBrief = async (b: ContentBrief, demo: boolean) => {
    setStep(1);
    const { data: gen, demo: genDemo } = await api.generate(b, language, voiceProfile());
    setStep(2);
    const campaignId = ensureCampaign(standaloneName, voiceId || undefined);
    const article = makeArticle(campaignId, b, gen, demo || genDemo);
    addArticle(article);
    onDone(article.id);
  };

  const runAll = async () => {
    if (!keyword.trim()) return;
    setRunning(true);
    setStep(0);
    try {
      const { data: b, demo } = await api.brief(keyword.trim(), language, voiceId || undefined);
      await finishWithBrief(b, demo);
    } catch (e) {
      toast.error((e as Error).message);
      setRunning(false);
    }
  };

  const runBriefOnly = async () => {
    if (!keyword.trim()) return;
    setRunning(true);
    setStep(0);
    try {
      const { data: b, demo } = await api.brief(keyword.trim(), language, voiceId || undefined);
      setBrief(b);
      setBriefDemo(demo);
      setRunning(false);
    } catch (e) {
      toast.error((e as Error).message);
      setRunning(false);
    }
  };

  const continueFromBrief = async () => {
    if (!brief) return;
    setRunning(true);
    setStep(1);
    try {
      await finishWithBrief(brief, briefDemo);
    } catch (e) {
      toast.error((e as Error).message);
      setRunning(false);
    }
  };

  // running overlay
  if (running) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-8">
          <div className="mb-6 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-semibold text-fg">
              {isEn ? 'Generating…' : 'Đang tạo bài…'}
            </h2>
          </div>
          <GenerationProgress labels={progressLabels} current={step} />
        </CardContent>
      </Card>
    );
  }

  // brief preview
  if (brief) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-fg">
                {isEn ? 'Content brief' : 'Brief nội dung'}
              </h2>
              {briefDemo && <DemoBadge label={t.common.demoData} />}
            </div>
            <Badge tone="info">{brief.searchIntent}</Badge>
          </div>

          <div>
            <Label>{t.common.title}</Label>
            <Input value={brief.suggestedTitle} onChange={(e) => setBrief({ ...brief, suggestedTitle: e.target.value })} />
          </div>
          <div>
            <Label>{t.common.meta}</Label>
            <Textarea rows={2} value={brief.suggestedMeta} onChange={(e) => setBrief({ ...brief, suggestedMeta: e.target.value })} />
          </div>

          <div>
            <Label>{isEn ? 'Outline' : 'Dàn ý'}</Label>
            <div className="rounded-md border border-border bg-surface-hover/30 p-3">
              <ul className="flex flex-col gap-1.5 text-sm">
                {brief.outline.map((o, i) => (
                  <li key={i} className={o.level === 3 ? 'pl-5 text-muted' : 'font-medium text-fg'}>
                    {o.level === 2 ? 'H2' : 'H3'} · {o.heading}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setBrief(null)}>
              <ArrowLeft className="h-4 w-4" />
              {t.actions.back}
            </Button>
            <Button onClick={continueFromBrief}>
              {isEn ? 'Generate from this brief' : 'Tạo bài từ brief này'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // input
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col gap-5">
        <div>
          <Label htmlFor="kw" required>
            {t.common.keyword}
          </Label>
          <Input
            id="kw"
            autoFocus
            placeholder={isEn ? 'e.g. specialty coffee' : 'vd: cà phê specialty'}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAll()}
            className="h-12 text-base"
          />
        </div>

        <div>
          <Label htmlFor="voice">
            {t.nav.brandVoice}{' '}
            <span className="font-normal text-faint">({t.common.optional})</span>
          </Label>
          <Select id="voice" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
            <option value="">{isEn ? 'Default voice' : 'Văn thương hiệu mặc định'}</option>
            {brandVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={runBriefOnly} disabled={!keyword.trim()}>
            <Eye className="h-4 w-4" />
            {isEn ? 'Preview brief first' : 'Xem brief trước'}
          </Button>
          <Button onClick={runAll} disabled={!keyword.trim()} size="lg">
            <Sparkles className="h-4 w-4" />
            {t.actions.generate}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Bulk campaign flow ─────────────────────────────────────────
type BulkItem = { keyword: string; status: 'pending' | 'running' | 'done' | 'failed' };

function BulkFlow({
  isEn,
  language,
  brandVoices,
  ensureCampaign,
  makeArticle,
  onDone,
}: {
  isEn: boolean;
  language: Language;
  brandVoices: { id: string; name: string }[];
  ensureCampaign: (name: string, voiceId?: string) => string;
  makeArticle: (
    campaignId: string,
    brief: ContentBrief,
    gen: { title: string; metaDescription: string; slug: string; contentHtml: string },
    demo: boolean,
  ) => Article;
  onDone: (cid: string) => void;
}) {
  const t = useT();
  const addArticle = useStudio((s) => s.addArticle);
  const [name, setName] = React.useState('');
  const [voiceId, setVoiceId] = React.useState('');
  const [raw, setRaw] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [items, setItems] = React.useState<BulkItem[]>([]);

  const keywords = raw.split('\n').map((s) => s.trim()).filter(Boolean);

  const run = async () => {
    const list = keywords;
    if (list.length === 0) return;
    const campaignName = name.trim() || (isEn ? 'Untitled campaign' : 'Chiến dịch chưa đặt tên');
    setRunning(true);
    setItems(list.map((k) => ({ keyword: k, status: 'pending' })));
    const campaignId = ensureCampaign(campaignName, voiceId || undefined);
    const voiceProfile = useStudio.getState().brandVoices.find((v) => v.id === voiceId);

    for (let i = 0; i < list.length; i++) {
      setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'running' } : it)));
      try {
        const { data: brief, demo } = await api.brief(list[i], language, voiceId || undefined);
        const { data: gen, demo: genDemo } = await api.generate(brief, language, voiceProfile);
        addArticle(makeArticle(campaignId, brief, gen, demo || genDemo));
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'done' } : it)));
      } catch {
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'failed' } : it)));
      }
    }
    toast.success(isEn ? 'Campaign generated' : 'Đã tạo xong chiến dịch');
    setTimeout(() => onDone(campaignId), 600);
  };

  if (running) {
    const done = items.filter((i) => i.status === 'done' || i.status === 'failed').length;
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-fg">
              {isEn ? 'Generating campaign…' : 'Đang tạo chiến dịch…'}
            </h2>
            <span className="tabular text-sm text-muted">
              {done}/{items.length}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                {it.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : it.status === 'failed' ? (
                  <XCircle className="h-4 w-4 shrink-0 text-danger" />
                ) : it.status === 'running' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border border-border" />
                )}
                <span className={it.status === 'pending' ? 'text-sm text-faint' : 'text-sm text-fg'}>
                  {it.keyword}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col gap-5">
        <div>
          <Label htmlFor="cname" required>
            {isEn ? 'Campaign name' : 'Tên chiến dịch'}
          </Label>
          <Input
            id="cname"
            placeholder={isEn ? 'e.g. Specialty coffee cluster' : 'vd: Cụm cà phê đặc sản'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="voice2">
            {t.nav.brandVoice} <span className="font-normal text-faint">({t.common.optional})</span>
          </Label>
          <Select id="voice2" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
            <option value="">{isEn ? 'Default voice' : 'Văn thương hiệu mặc định'}</option>
            {brandVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0" htmlFor="kws" required>
              {isEn ? 'Keywords (one per line)' : 'Từ khóa (mỗi dòng một từ)'}
            </Label>
            <span className="tabular text-2xs text-faint">
              {keywords.length} {isEn ? 'keywords' : 'từ khóa'}
            </span>
          </div>
          <Textarea
            id="kws"
            rows={7}
            placeholder={isEn ? 'specialty coffee\npour over guide\ncoffee grinder' : 'cà phê specialty\ncách pha pour over\nchọn máy xay cà phê'}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={run} disabled={keywords.length === 0 || !name.trim()} size="lg">
            <FolderPlus className="h-4 w-4" />
            {t.actions.generateAll}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
