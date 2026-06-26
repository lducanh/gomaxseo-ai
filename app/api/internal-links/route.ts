import { NextResponse } from 'next/server';
import { callLLM, extractJson, aiProviderName } from '@/lib/ai/provider';
import { internalLinksPrompt } from '@/lib/ai/prompts';
import { fallbackInternalLinks } from '@/data/fallback';
import { uid } from '@/lib/utils';
import type { InternalLinkSuggestion, Language, LinkCandidate } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RawSuggestion {
  targetArticleId?: string;
  targetSlug?: string;
  targetTitle?: string;
  anchorText?: string;
  reason?: string;
}

export async function POST(req: Request) {
  let language: Language = 'vi';
  let others: LinkCandidate[] = [];
  try {
    const body = await req.json();
    language = body?.language === 'en' ? 'en' : 'vi';
    others = Array.isArray(body?.articles) ? (body.articles as LinkCandidate[]) : [];
    const current = body?.current as { title: string; keyword: string; summary: string };

    if (!current?.title || others.length === 0) {
      return NextResponse.json([], { headers: { 'x-gomax-source': 'sandbox' } });
    }

    const { system, user } = internalLinksPrompt(current, others, language);
    const raw = await callLLM({ system, user, json: true, maxTokens: 1200 });
    const parsed = extractJson<RawSuggestion[]>(raw);
    const byId = new Map(others.map((o) => [o.id, o]));

    const suggestions: InternalLinkSuggestion[] = (Array.isArray(parsed) ? parsed : [])
      .map((s) => {
        const target = s.targetArticleId ? byId.get(s.targetArticleId) : undefined;
        const matched =
          target ||
          others.find((o) => o.slug === s.targetSlug) ||
          others.find((o) => o.title === s.targetTitle);
        if (!matched) return null;
        return {
          id: uid('lnk'),
          targetArticleId: matched.id,
          targetTitle: matched.title,
          targetSlug: matched.slug,
          anchorText: (s.anchorText || matched.keyword || matched.title).trim(),
          reason: (s.reason || '').trim(),
          accepted: false,
        } as InternalLinkSuggestion;
      })
      .filter((x): x is InternalLinkSuggestion => x !== null);

    if (suggestions.length === 0) throw new Error('NO_SUGGESTIONS');
    return NextResponse.json(suggestions, {
      headers: { 'x-gomax-source': aiProviderName() },
    });
  } catch {
    const suggestions = fallbackInternalLinks(others, language);
    return NextResponse.json(suggestions, { headers: { 'x-gomax-source': 'sandbox' } });
  }
}
