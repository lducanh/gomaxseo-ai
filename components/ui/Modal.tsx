'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof sizes;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            'relative z-10 mt-[5vh] w-full animate-scale-in rounded-xl border border-border bg-surface shadow-pop',
            sizes[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div className="min-w-0">
              {title && (
                <h2 className="font-display text-lg font-semibold tracking-tight text-fg">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-border p-5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
