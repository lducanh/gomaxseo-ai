'use client';
import * as React from 'react';
import { Fingerprint, Link2, FileText, Pencil, Trash2, Quote } from 'lucide-react';
import { useStudio, useHydrated, useLanguage } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { DemoBadge } from '@/components/DemoBadge';
import type { BrandVoiceProfile } from '@/types';

export default function BrandVoicePage() {
  const hydrated = useHydrated();
  const t = useT();
  const isEn = useLanguage() === 'en';
  const language = useLanguage();
  const voices = useStudio((s) => s.brandVoices);
  const addBrandVoice = useStudio((s) => s.addBrandVoice);
  const removeBrandVoice = useStudio((s) => s.removeBrandVoice);

  const [mode, setMode] = React.useState<'url' | 'text'>('url');
  const [url, setUrl] = React.useState('');
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<BrandVoiceProfile | null>(null);

  const analyze = async () => {
    if (mode === 'url' && !url.trim()) return;
    if (mode === 'text' && text.trim().length < 80) {
      toast.error(isEn ? 'Paste at least a paragraph.' : 'Hãy dán ít nhất một đoạn văn.');
      return;
    }
    setLoading(true);
    try {
      const { data, demo } = await api.analyzeVoice(
        mode === 'url' ? { url: url.trim(), language } : { text: text.trim(), language },
      );
      addBrandVoice(data);
      toast.success(
        demo
          ? isEn ? 'Demo voice profile created' : 'Đã tạo hồ sơ văn thương hiệu mẫu'
          : isEn ? 'Voice analyzed' : 'Đã phân tích văn thương hiệu',
      );
      setUrl('');
      setText('');
    } catch (e) {
      const code = (e as Error & { code?: string }).code;
      if (code === 'BLOCKED' || code === 'FETCH' || code === 'EMPTY' || code === 'INVALID_URL') {
        setMode('text');
        toast.error(isEn ? 'Could not read that URL — paste the text instead.' : 'Không đọc được URL — hãy dán văn bản trực tiếp.');
      } else {
        toast.error((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-9 w-56" />
        <Skeleton className="h-48" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t.nav.brandVoice}
        description={
          isEn
            ? 'Analyze a sample you own to capture its voice, then inject it into every generated article.'
            : 'Phân tích bài viết bạn sở hữu để bắt đúng văn thương hiệu, rồi áp vào mọi bài AI tạo ra.'
        }
      />

      <Card className="mb-8">
        <CardContent className="flex flex-col gap-4">
          <div className="inline-flex w-fit rounded-md border border-border bg-surface p-0.5">
            {(['url', 'text'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === m ? 'bg-accent/15 text-accent' : 'text-muted hover:text-fg'
                }`}
              >
                {m === 'url' ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {m === 'url' ? 'URL' : isEn ? 'Paste text' : 'Dán văn bản'}
              </button>
            ))}
          </div>

          {mode === 'url' ? (
            <div>
              <Label htmlFor="voiceUrl">{isEn ? 'Article URL (yours)' : 'URL bài viết (của bạn)'}</Label>
              <Input
                id="voiceUrl"
                placeholder="https://your-blog.com/bai-viet-mau"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="voiceText">{isEn ? 'Paste a representative sample' : 'Dán đoạn văn tiêu biểu'}</Label>
              <Textarea
                id="voiceText"
                rows={6}
                placeholder={isEn ? 'Paste 1–3 paragraphs of your own writing…' : 'Dán 1–3 đoạn văn của chính bạn…'}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-2xs text-faint">
              {isEn ? 'Only analyze content you own or have rights to.' : 'Chỉ phân tích nội dung bạn sở hữu hoặc có quyền.'}
            </p>
            <Button onClick={analyze} loading={loading}>
              <Fingerprint className="h-4 w-4" />
              {t.actions.analyze}
            </Button>
          </div>
        </CardContent>
      </Card>

      {voices.length === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title={isEn ? 'No voice profiles yet' : 'Chưa có hồ sơ văn thương hiệu'}
          description={
            isEn
              ? 'Analyze a URL or paste text above to create your first brand voice.'
              : 'Phân tích một URL hoặc dán văn bản ở trên để tạo hồ sơ văn thương hiệu đầu tiên.'
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {voices.map((v) => (
            <VoiceCard
              key={v.id}
              voice={v}
              isEn={isEn}
              onEdit={() => setEditing(v)}
              onDelete={() => {
                removeBrandVoice(v.id);
                toast.success(isEn ? 'Voice deleted' : 'Đã xóa văn thương hiệu');
              }}
            />
          ))}
        </div>
      )}

      {editing && (
        <VoiceEditModal voice={editing} isEn={isEn} onClose={() => setEditing(null)} />
      )}
    </PageContainer>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-hover/40 px-2.5 py-1.5">
      <div className="text-2xs uppercase tracking-wide text-faint">{label}</div>
      <div className="text-xs font-medium capitalize text-fg">{value}</div>
    </div>
  );
}

function VoiceCard({
  voice,
  isEn,
  onEdit,
  onDelete,
}: {
  voice: BrandVoiceProfile;
  isEn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate">{voice.name}</CardTitle>
            {voice.sourceUrl && (
              <CardDescription className="truncate">{voice.sourceUrl}</CardDescription>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {voice.isDemo && <DemoBadge label={isEn ? 'Demo' : 'Mẫu'} />}
            <button onClick={onEdit} aria-label="Edit" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-fg">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={onDelete} aria-label="Delete" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger/15 hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {voice.tone.map((tn, i) => (
            <Badge key={i} tone="accent">
              {tn}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Attr label={isEn ? 'Formality' : 'Trang trọng'} value={voice.formality} />
          <Attr label={isEn ? 'Person' : 'Ngôi'} value={voice.person} />
          <Attr label={isEn ? 'Vocabulary' : 'Từ vựng'} value={voice.vocabulary} />
        </div>
        {(voice.dos.length > 0 || voice.donts.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-2xs font-semibold uppercase tracking-wide text-success">
                {isEn ? 'Do' : 'Nên'}
              </div>
              <ul className="space-y-1 text-xs text-muted">
                {voice.dos.slice(0, 4).map((d, i) => (
                  <li key={i}>• {d}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-2xs font-semibold uppercase tracking-wide text-danger">
                {isEn ? "Don't" : 'Tránh'}
              </div>
              <ul className="space-y-1 text-xs text-muted">
                {voice.donts.slice(0, 4).map((d, i) => (
                  <li key={i}>• {d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {voice.sampleExcerpts?.[0] && (
          <blockquote className="flex gap-2 rounded-md border-l-2 border-accent/50 bg-surface-hover/30 p-3 text-xs italic text-muted">
            <Quote className="h-3.5 w-3.5 shrink-0 text-accent/60" />
            <span className="line-clamp-3">{voice.sampleExcerpts[0]}</span>
          </blockquote>
        )}
      </CardContent>
    </Card>
  );
}

function VoiceEditModal({
  voice,
  isEn,
  onClose,
}: {
  voice: BrandVoiceProfile;
  isEn: boolean;
  onClose: () => void;
}) {
  const updateBrandVoice = useStudio((s) => s.updateBrandVoice);
  const [name, setName] = React.useState(voice.name);
  const [tone, setTone] = React.useState(voice.tone.join(', '));
  const [formality, setFormality] = React.useState(voice.formality);
  const [person, setPerson] = React.useState(voice.person);
  const [vocabulary, setVocabulary] = React.useState(voice.vocabulary);
  const [dos, setDos] = React.useState(voice.dos.join('\n'));
  const [donts, setDonts] = React.useState(voice.donts.join('\n'));

  const save = () => {
    updateBrandVoice(voice.id, {
      name: name.trim() || voice.name,
      tone: tone.split(',').map((s) => s.trim()).filter(Boolean),
      formality,
      person,
      vocabulary,
      dos: dos.split('\n').map((s) => s.trim()).filter(Boolean),
      donts: donts.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    toast.success(isEn ? 'Voice updated' : 'Đã cập nhật văn thương hiệu');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEn ? 'Edit voice profile' : 'Chỉnh sửa văn thương hiệu'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {isEn ? 'Cancel' : 'Hủy'}
          </Button>
          <Button onClick={save}>{isEn ? 'Save' : 'Lưu'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <Label>{isEn ? 'Name' : 'Tên'}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>{isEn ? 'Tone (comma-separated)' : 'Tông giọng (phân tách bằng dấu phẩy)'}</Label>
          <Input value={tone} onChange={(e) => setTone(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>{isEn ? 'Formality' : 'Trang trọng'}</Label>
            <Select value={formality} onChange={(e) => setFormality(e.target.value as typeof formality)}>
              <option value="casual">casual</option>
              <option value="neutral">neutral</option>
              <option value="formal">formal</option>
            </Select>
          </div>
          <div>
            <Label>{isEn ? 'Person' : 'Ngôi'}</Label>
            <Select value={person} onChange={(e) => setPerson(e.target.value as typeof person)}>
              <option value="first">first</option>
              <option value="second">second</option>
              <option value="third">third</option>
            </Select>
          </div>
          <div>
            <Label>{isEn ? 'Vocabulary' : 'Từ vựng'}</Label>
            <Select value={vocabulary} onChange={(e) => setVocabulary(e.target.value as typeof vocabulary)}>
              <option value="simple">simple</option>
              <option value="mixed">mixed</option>
              <option value="technical">technical</option>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{isEn ? 'Do (one per line)' : 'Nên (mỗi dòng một mục)'}</Label>
            <Textarea rows={4} value={dos} onChange={(e) => setDos(e.target.value)} />
          </div>
          <div>
            <Label>{isEn ? "Don't (one per line)" : 'Tránh (mỗi dòng một mục)'}</Label>
            <Textarea rows={4} value={donts} onChange={(e) => setDonts(e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
