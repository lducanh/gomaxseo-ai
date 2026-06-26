import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Step list with spinner on the active step, check on completed. */
export function GenerationProgress({
  labels,
  current,
}: {
  labels: string[];
  current: number; // index of the active step; >= labels.length means done
}) {
  return (
    <div className="flex flex-col gap-3">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            ) : active ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-faint" />
            )}
            <span
              className={cn(
                'text-sm',
                active ? 'font-medium text-fg' : done ? 'text-muted' : 'text-faint',
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
