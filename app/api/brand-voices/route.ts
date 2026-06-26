// app/api/brand-voices/route.ts — upsert (PUT) + delete (DELETE ?id=).
import { NextRequest, NextResponse } from 'next/server';
import { upsertBrandVoice, deleteBrandVoice } from '@/lib/server/repo';
import type { BrandVoiceProfile } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const v = (await req.json()) as BrandVoiceProfile;
    if (!v?.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    upsertBrandVoice(v);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    deleteBrandVoice(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
