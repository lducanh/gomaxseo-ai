import { NextResponse } from 'next/server';
import { callLLM, extractJson, aiProviderName } from '@/lib/ai/provider';
import { voicePrompt } from '@/lib/ai/prompts';
import { fallbackVoiceProfile } from '@/data/fallback';
import { extractArticleText, ExtractError } from '@/lib/extract';
import { uid } from '@/lib/utils';
import type { BrandVoiceProfile, Language } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let language: Language = 'vi';
  let url: string | undefined;
  try {
    const body = await req.json();
    language = body?.language === 'en' ? 'en' : 'vi';
    url = body?.url ? String(body.url).trim() : undefined;
    const pasted = body?.text ? String(body.text).trim() : '';

    // 1) Acquire a representative text sample (pasted text wins).
    let sample = pasted;
    if (!sample && url) {
      try {
        sample = await extractArticleText(url);
      } catch (e) {
        const code = e instanceof ExtractError ? e.code : 'FETCH';
        // Site unreadable → ask the client to paste text instead.
        return NextResponse.json(
          {
            error:
              language === 'en'
                ? 'Could not read that URL. Paste the article text instead.'
                : 'Không đọc được URL này. Hãy dán trực tiếp nội dung bài viết.',
            code,
          },
          { status: 422 },
        );
      }
    }
    if (!sample) {
      return NextResponse.json({ error: 'url or text is required' }, { status: 400 });
    }

    // 2) Analyze with the LLM, overlaying onto a complete base profile.
    const { system, user } = voicePrompt(sample);
    const raw = await callLLM({ system, user, json: true, maxTokens: 1200 });
    const parsed = extractJson<Partial<BrandVoiceProfile>>(raw);
    const base = fallbackVoiceProfile(url, language);
    const profile: BrandVoiceProfile = {
      ...base,
      ...parsed,
      id: uid('voice'),
      name: language === 'en' ? 'Analyzed brand voice' : 'Văn thương hiệu đã phân tích',
      sourceUrl: url,
      language,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };
    return NextResponse.json(profile, {
      headers: { 'x-gomax-source': aiProviderName() },
    });
  } catch {
    // No API key / AI error → return the demo voice profile (sandbox).
    const profile = fallbackVoiceProfile(url, language);
    return NextResponse.json(profile, { headers: { 'x-gomax-source': 'sandbox' } });
  }
}
