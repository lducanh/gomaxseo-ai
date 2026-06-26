// app/api/articles/route.ts — upsert one or many (PUT) + delete (DELETE ?id=).
import { NextRequest, NextResponse } from 'next/server';
import { upsertArticle, upsertArticles, deleteArticle } from '@/lib/server/repo';
import type { Article } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Article | Article[];
    if (Array.isArray(body)) {
      if (body.some((a) => !a?.id)) {
        return NextResponse.json({ error: 'each article needs an id' }, { status: 400 });
      }
      upsertArticles(body);
    } else {
      if (!body?.id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
      }
      upsertArticle(body);
    }
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
    deleteArticle(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
