import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { seoTier } from '@/lib/seo/score';
import { cn } from '@/lib/utils';
import type { Language, SeoScore, SeoFeedbackType } from '@/types';

const FB: Record<SeoFeedbackType, { Icon: typeof CheckCircle2; cls: string }> = {
  success: { Icon: CheckCircle2, cls: 'text-success' },
  warning: { Icon: AlertTriangle, cls: 'text-warning' },
  danger: { Icon: XCircle, cls: 'text-danger' },
};
const ORDER: Record<SeoFeedbackType, number> = { danger: 0, warning: 1, success: 2 };

export function SeoScorePanel({ score, lang }: { score: SeoScore; lang: Language }) {
  const tier = seoTier(score.score, lang);
  const items = [...score.feedback].sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  const tierCls =
    tier.tone === 'good' ? 'text-success' : tier.tone === 'ok' ? 'text-warning' : 'text-danger';

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 border-b border-border p-5">
        <ScoreRing score={score.score} label={lang === 'en' ? '/ 100' : '/ 100'} />
        <div className="min-w-0">
          <div className={cn('font-display text-lg font-semibold', tierCls)}>
            {tier.label}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {lang === 'en' ? 'On-page optimization hints' : 'Gợi ý tối ưu on-page'}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-2xs text-faint">
            <span>
              <span className="tabular text-fg">{score.totalWords}</span>{' '}
              {lang === 'en' ? 'words' : 'từ'}
            </span>
            <span>
              <span className="tabular text-fg">{score.density}%</span>{' '}
              {lang === 'en' ? 'density' : 'mật độ'}
            </span>
            <span>
              <span className="tabular text-fg">{score.keywordCount}×</span>{' '}
              {lang === 'en' ? 'keyword' : 'từ khóa'}
            </span>
          </div>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {items.map((f) => {
          const { Icon, cls } = FB[f.type];
          return (
            <li key={f.key} className="flex items-start gap-2.5 px-5 py-2.5">
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', cls)} />
              <span className="text-sm text-muted">{f.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
