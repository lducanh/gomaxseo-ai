// lib/ai/provider.ts — provider-agnostic LLM adapter (server-side only).
//
// The API key NEVER reaches the client: every call happens inside an API
// route. If no key is configured, callLLM throws 'NO_API_KEY' so the caller
// falls back to high-quality sandbox content (see data/fallback.ts).
//
// Supports OpenAI, Anthropic and Google Gemini. Model IDs are env-overridable.
// Verify current model names in each provider's docs.
type Provider = 'openai' | 'anthropic' | 'gemini';

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

function resolveProvider(): Provider | null {
  const explicit = (process.env.AI_PROVIDER || '').toLowerCase();
  if (explicit === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (explicit === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (explicit === 'gemini' && geminiKey()) return 'gemini';
  // auto-detect when AI_PROVIDER is unset
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (geminiKey()) return 'gemini';
  return null;
}

export function aiConfigured(): boolean {
  return resolveProvider() !== null;
}

export function aiProviderName(): string {
  return resolveProvider() ?? 'sandbox';
}

export interface LlmOptions {
  system: string;
  user: string;
  json?: boolean; // ask the model for strict JSON
  maxTokens?: number;
  temperature?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callLLM(opts: LlmOptions): Promise<string> {
  const provider = resolveProvider();
  if (!provider) throw new Error('NO_API_KEY');
  const run =
    provider === 'anthropic' ? callAnthropic : provider === 'gemini' ? callGemini : callOpenAI;
  // Retry transient provider errors (rate limit / overload) before giving up
  // and letting the caller fall back to sandbox content.
  let lastErr: unknown;
  const MAX = 4;
  for (let attempt = 0; attempt < MAX; attempt++) {
    try {
      return await run(opts);
    } catch (e) {
      lastErr = e;
      const transient = /_(429|500|502|503|529)$/.test((e as Error).message || '');
      if (!transient || attempt === MAX - 1) throw e;
      await sleep(800 * Math.pow(2, attempt)); // 0.8s, 1.6s, 3.2s
    }
  }
  throw lastErr;
}

async function callOpenAI(opts: LlmOptions): Promise<string> {
  const key = process.env.OPENAI_API_KEY as string;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 3000,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`LLM_${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(opts: LlmOptions): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY as string;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const system = opts.json
    ? `${opts.system}\n\nIMPORTANT: respond with valid JSON only — no markdown fences, no commentary.`
    : opts.system;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 3000,
      temperature: opts.temperature ?? 0.7,
      system,
      messages: [{ role: 'user', content: opts.user }],
    }),
  });
  if (!res.ok) throw new Error(`LLM_${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.content)) return '';
  return data.content
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('');
}

async function callGemini(opts: LlmOptions): Promise<string> {
  const key = geminiKey() as string;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  // Gemini 2.5+ spends output tokens on internal "thinking" before the visible
  // answer, which can truncate long JSON. For flash models we disable thinking
  // (all budget goes to output); for pro we keep it but add headroom.
  const disableThinking = /flash|lite/i.test(model);
  const maxOutputTokens = Math.min((opts.maxTokens ?? 3000) + 4096, 24576);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: [{ text: opts.user }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens,
          ...(opts.json ? { responseMimeType: 'application/json' } : {}),
          ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`LLM_${res.status}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p: { text?: string }) => p.text ?? '').join('');
}

/** Best-effort JSON parse for models that wrap output in prose or fences. */
export function extractJson<T = unknown>(raw: string): T {
  if (!raw) throw new Error('EMPTY_LLM_OUTPUT');
  let s = raw.trim();
  // strip ```json ... ``` fences if present
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    // fall through to bracket extraction
  }
  const objStart = s.indexOf('{');
  const arrStart = s.indexOf('[');
  const start =
    objStart === -1
      ? arrStart
      : arrStart === -1
        ? objStart
        : Math.min(objStart, arrStart);
  if (start === -1) throw new Error('NO_JSON_FOUND');
  const closeCh = s[start] === '{' ? '}' : ']';
  const end = s.lastIndexOf(closeCh);
  if (end <= start) throw new Error('NO_JSON_FOUND');
  return JSON.parse(s.slice(start, end + 1)) as T;
}
