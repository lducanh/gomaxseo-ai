// app/api/campaigns/route.ts — upsert (PUT) + delete (DELETE ?id=).
import { NextRequest, NextResponse } from 'next/server';
import { upsertCampaign, deleteCampaign } from '@/lib/server/repo';
import type { Campaign } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const c = (await req.json()) as Campaign;
    if (!c?.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    upsertCampaign(c);
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
    deleteCampaign(id); // cascades to child articles
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
