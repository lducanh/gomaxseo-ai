import { NextResponse } from 'next/server';
import { wpGetTaxonomies } from '@/lib/wordpress/client';
import type { WordPressConnection } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEMO_CATEGORIES = [
  { id: 1, name: 'Uncategorized' },
  { id: 5, name: 'Blog' },
  { id: 8, name: 'Hướng dẫn' },
  { id: 12, name: 'Tin tức' },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const conn = body?.connection as WordPressConnection | undefined;
    const usable =
      conn && conn.siteUrl && conn.username && conn.appPassword && !conn.sandbox;

    if (!usable) {
      // Sandbox / not connected → demo taxonomy so the publish dialog works.
      return NextResponse.json(
        { categories: DEMO_CATEGORIES, tags: [], sandbox: true },
        { headers: { 'x-gomax-source': 'sandbox' } },
      );
    }
    const result = await wpGetTaxonomies(conn);
    return NextResponse.json(result, { headers: { 'x-gomax-source': 'live' } });
  } catch {
    return NextResponse.json(
      { categories: DEMO_CATEGORIES, tags: [], sandbox: true },
      { headers: { 'x-gomax-source': 'sandbox' } },
    );
  }
}
