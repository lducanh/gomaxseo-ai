'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { uid } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}
interface ToastState {
  items: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = uid('toast');
    set((s) => ({ items: [...s.items, { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

/** Call from anywhere: toast.success('Đã lưu') */
export const toast = {
  success: (message: string) => useToastStore.getState().push({ type: 'success', message }),
  error: (message: string) => useToastStore.getState().push({ type: 'error', message }),
  warning: (message: string) => useToastStore.getState().push({ type: 'warning', message }),
  info: (message: string) => useToastStore.getState().push({ type: 'info', message }),
};

const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const TONE = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

export function Toaster() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {items.map((i) => {
        const Icon = ICONS[i.type];
        return (
          <div
            key={i.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-pop animate-slide-up"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONE[i.type])} />
            <p className="flex-1 text-sm text-fg">{i.message}</p>
            <button
              onClick={() => dismiss(i.id)}
              aria-label="Đóng"
              className="cursor-pointer text-faint transition-colors hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
