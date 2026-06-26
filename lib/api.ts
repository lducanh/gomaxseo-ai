// lib/api.ts — typed client wrappers around the server API routes.
import type {
  BrandVoiceProfile,
  ContentBrief,
  GenerateResult,
  InternalLinkSuggestion,
  Language,
  LinkCandidate,
  PublishResult,
  WordPressConnection,
  WpCategory,
  WpTag,
} from '@/types';
import type { WpPublishInput } from '@/lib/wordpress/client';

export type AiSource = 'openai' | 'anthropic' | 'gemini' | 'live' | 'sandbox';

export interface ApiResult<T> {
  data: T;
  source: AiSource;
  demo: boolean;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const source = (res.headers.get('x-gomax-source') as AiSource) || 'sandbox';
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const err = (data as { error?: string; code?: string }) || {};
    const e = new Error(err.error || `Request failed (${res.status})`);
    (e as Error & { code?: string }).code = err.code;
    throw e;
  }
  return { data: data as T, source, demo: source === 'sandbox' };
}

export const api = {
  brief(keyword: string, language: Language, voiceId?: string) {
    return postJson<ContentBrief>('/api/brief', { keyword, language, voiceId });
  },
  generate(brief: ContentBrief, language: Language, voiceProfile?: BrandVoiceProfile) {
    return postJson<GenerateResult>('/api/generate', { brief, language, voiceProfile });
  },
  analyzeVoice(input: { url?: string; text?: string; language: Language }) {
    return postJson<BrandVoiceProfile>('/api/voice/analyze', input);
  },
  internalLinks(
    current: { title: string; keyword: string; summary: string },
    articles: LinkCandidate[],
    language: Language,
  ) {
    return postJson<InternalLinkSuggestion[]>('/api/internal-links', {
      current,
      articles,
      language,
    });
  },
  wpTest(conn: Pick<WordPressConnection, 'siteUrl' | 'username' | 'appPassword'>) {
    return postJson<{ ok: boolean; user?: { id: number; name: string }; error?: string }>(
      '/api/wordpress/test',
      conn,
    );
  },
  wpTaxonomies(connection: WordPressConnection) {
    return postJson<{ categories: WpCategory[]; tags: WpTag[]; sandbox?: boolean }>(
      '/api/wordpress/taxonomies',
      { connection },
    );
  },
  wpPublish(connection: WordPressConnection, post: WpPublishInput, sandbox: boolean) {
    return postJson<PublishResult>('/api/wordpress/publish', { connection, post, sandbox });
  },
};
