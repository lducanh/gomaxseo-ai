import { NextResponse } from 'next/server';
import { wpPublish, type WpPublishInput } from '@/lib/wordpress/client';
import { delay } from '@/lib/utils';
import type { PublishResult, WordPressConnection } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const conn = body?.connection as WordPressConnection | undefined;
    const post = body?.post as WpPublishInput | undefined;
    const sandbox = body?.sandbox ?? conn?.sandbox ?? true;

    if (!post?.title || !post?.contentHtml) {
      return NextResponse.json(
        { ok: false, error: 'Thiếu tiêu đề hoặc nội dung bài viết.' } as PublishResult,
        { status: 200 },
      );
    }

    const hasCreds = !!(conn?.siteUrl && conn?.username && conn?.appPassword);

    // Sandbox (default) or missing creds → simulate a successful publish.
    if (sandbox || !hasCreds) {
      await delay(800);
      const ts = Date.now();
      const base = (conn?.siteUrl || 'https://demo.wordpress.test').replace(/\/+$/, '');
      const isScheduled = post.status === 'future';
      const result: PublishResult = {
        ok: true,
        id: ts % 100000,
        link: `${base}/?p=demo-${ts}`,
        sandbox: true,
      };
      return NextResponse.json(result, {
        status: 200,
        headers: { 'x-gomax-source': 'sandbox', 'x-gomax-scheduled': String(isScheduled) },
      });
    }

    const result = await wpPublish(conn!, post);
    return NextResponse.json(result, {
      status: 200,
      headers: { 'x-gomax-source': 'live' },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message || 'Lỗi không xác định' } as PublishResult,
      { status: 200 },
    );
  }
}
