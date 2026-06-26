import { NextResponse } from 'next/server';
import { callLLM, extractJson, aiProviderName } from '@/lib/ai/provider';
import { briefPrompt } from '@/lib/ai/prompts';
import { fallbackBrief } from '@/data/fallback';
import type { ContentBrief, Language } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let keyword = '';
  let language: Language = 'vi';
  try {
    const body = await req.json();
    keyword = String(body?.keyword ?? '').trim();
    language = body?.language === 'en' ? 'en' : 'vi';
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }
    const { system, user } = briefPrompt(keyword, language);
    const raw = await callLLM({ system, user, json: true, maxTokens: 1500 });
    const brief = extractJson<ContentBrief>(raw);
    if (!brief?.suggestedTitle || !Array.isArray(brief.outline)) {
      throw new Error('BAD_SHAPE');
    }
    brief.targetKeyword = brief.targetKeyword || keyword;
    return NextResponse.json(brief, {
      headers: { 'x-gomax-source': aiProviderName() },
    });
  } catch {
    const brief = fallbackBrief(keyword || (language === 'en' ? 'seo content' : 'nội dung seo'), language);
    return NextResponse.json(brief, { headers: { 'x-gomax-source': 'sandbox' } });
  }
}
