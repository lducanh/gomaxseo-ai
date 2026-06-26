import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/Toast';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
  display: 'swap',
});
const display = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GoMax SEO Studio — AI viết & đăng bài chuẩn SEO',
    template: '%s · GoMax SEO Studio',
  },
  description:
    'Từ một từ khóa đến một bài chuẩn SEO đã đăng lên WordPress — trong 3 thao tác. Brand Voice + gợi ý internal link + chấm điểm SEO realtime.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable}`}
    >
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
