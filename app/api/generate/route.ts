import { NextResponse } from 'next/server';
import { callLLM, extractJson, aiProviderName } from '@/lib/ai/provider';
import { generatePrompt } from '@/lib/ai/prompts';
import { fallbackGenerate } from '@/data/fallback';
import { slugify } from '@/lib/utils';
import type { BrandVoiceProfile, ContentBrief, GenerateResult, Language } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let keyword = '';
  let language: Language = 'vi';
  try {
    const body = await req.json();
    const brief = body?.brief as ContentBrief | undefined;
    const voice = body?.voiceProfile as BrandVoiceProfile | undefined;
    language = body?.language === 'en' ? 'en' : 'vi';
    keyword = String(brief?.targetKeyword ?? body?.keyword ?? '').trim();
    if (!brief?.targetKeyword) {
      return NextResponse.json({ error: 'brief is required' }, { status: 400 });
    }
    const { system, user } = generatePrompt(brief, language, voice);
    const raw = await callLLM({ system, user, json: true, maxTokens: 8000 });
    const result = extractJson<GenerateResult>(raw);
    if (!result?.contentHtml || !result?.title) throw new Error('BAD_SHAPE');
    result.slug = result.slug || slugify(result.title);
    result.metaDescription = result.metaDescription || '';
    return NextResponse.json(result, {
      headers: { 'x-gomax-source': aiProviderName() },
    });
  } catch {
    const result = fallbackGenerate(keyword || (language === 'en' ? 'seo content' : 'nội dung seo'), language);
    return NextResponse.json(result, { headers: { 'x-gomax-source': 'sandbox' } });
  }
}
