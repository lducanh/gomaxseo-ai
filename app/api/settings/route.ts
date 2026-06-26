// app/api/settings/route.ts — read (GET) + merge update (PUT) language + WP.
import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/server/repo';
import type { Language, WordPressConnection } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(getSettings());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      language?: Language;
      wp?: Partial<WordPressConnection>;
    };
    const next = updateSettings(body);
    return NextResponse.json(next);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
