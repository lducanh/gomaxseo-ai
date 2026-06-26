import { Sparkles } from 'lucide-react';
import { Badge } from './ui/Badge';

/** Shown wherever sandbox/fallback content is displayed (transparency). */
export function DemoBadge({ label = 'Dữ liệu mẫu' }: { label?: string }) {
  return (
    <Badge tone="warning" className="gap-1">
      <Sparkles className="h-3 w-3" />
      {label}
    </Badge>
  );
}
