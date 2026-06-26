import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-spring',
        checked ? 'border-accent bg-accent' : 'border-border bg-surface-hover',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full shadow transition-transform duration-200 ease-spring',
          checked ? 'translate-x-[22px] bg-accent-contrast' : 'translate-x-[3px] bg-fg',
        )}
      />
    </button>
  );
}
