// app/api/state/route.ts — bootstrap snapshot (GET) + reset content (DELETE).
import { NextResponse } from 'next/server';
import { getSnapshot, clearContent } from '@/lib/server/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(getSnapshot());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearContent();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
