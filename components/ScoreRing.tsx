import { clamp } from '@/lib/utils';

/** Circular SEO score gauge. Color follows the score tier. */
export function ScoreRing({
  score,
  size = 96,
  stroke = 8,
  label,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const pct = clamp(score, 0, 100);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const hue =
    score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`hsl(${hue})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-semibold leading-none text-fg">
          {Math.round(pct)}
        </span>
        {label && <span className="mt-1 text-2xs text-faint">{label}</span>}
      </div>
    </div>
  );
}
