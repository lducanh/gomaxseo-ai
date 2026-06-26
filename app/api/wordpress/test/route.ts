import { NextResponse } from 'next/server';
import { wpTestConnection } from '@/lib/wordpress/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const siteUrl = String(body?.siteUrl ?? '').trim();
    const username = String(body?.username ?? '').trim();
    const appPassword = String(body?.appPassword ?? '').trim();
    if (!siteUrl || !username || !appPassword) {
      return NextResponse.json(
        { ok: false, error: 'Thiếu Site URL, Username hoặc Application Password.' },
        { status: 200 },
      );
    }
    const result = await wpTestConnection({ siteUrl, username, appPassword });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message || 'Lỗi không xác định' },
      { status: 200 },
    );
  }
}
