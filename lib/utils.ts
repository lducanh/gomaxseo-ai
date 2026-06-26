// lib/utils.ts — shared helpers
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className combiner */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Compact, collision-resistant id (no external dep) */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return prefix ? `${prefix}_${time}${rand}` : `${time}${rand}`;
}

/** URL-safe slug, diacritics-aware (handles Vietnamese đ/Đ + tone marks) */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining tone marks
    .replace(/đ/g, 'd') // đ
    .replace(/Đ/g, 'd') // Đ
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Strip HTML tags → plain text (single-spaced) */
export function stripHtml(html: string): string {
  return html
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** ~200 wpm reading estimate, min 1 */
export function readingTimeMinutes(html: string): number {
  return Math.max(1, Math.round(wordCount(html) / 200));
}

/** Short, human date. */
export function formatDate(iso?: string, locale = 'vi-VN'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso?: string, locale = 'vi-VN'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Relative "x phút trước" — coarse, good enough for activity lists */
export function timeAgo(iso?: string, lang: 'vi' | 'en' = 'vi'): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const secs = Math.round((Date.now() - then) / 1000);
  const t = (vi: string, en: string) => (lang === 'en' ? en : vi);
  if (secs < 60) return t('vừa xong', 'just now');
  const mins = Math.round(secs / 60);
  if (mins < 60) return t(`${mins} phút trước`, `${mins}m ago`);
  const hours = Math.round(mins / 60);
  if (hours < 24) return t(`${hours} giờ trước`, `${hours}h ago`);
  const days = Math.round(hours / 24);
  return t(`${days} ngày trước`, `${days}d ago`);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/** First ~N chars of an article body as a plain-text summary */
export function summarize(html: string, max = 220): string {
  return truncate(stripHtml(html), max);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
