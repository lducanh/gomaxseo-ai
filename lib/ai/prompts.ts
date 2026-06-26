// lib/ai/prompts.ts — all prompt templates. Every prompt is language-aware
// and asks for STRICT JSON where a structured result is expected.
import type {
  BrandVoiceProfile,
  ContentBrief,
  Language,
  LinkCandidate,
} from '@/types';

function langLabel(l: Language): string {
  return l === 'en' ? 'English' : 'Vietnamese (Tiếng Việt)';
}

export interface Prompt {
  system: string;
  user: string;
}

// 11.1 — Brand voice analysis
export function voicePrompt(text: string): Prompt {
  return {
    system:
      'You are an expert writing-style analyst. Analyze the sample and return JSON that EXACTLY matches the schema. Output JSON only — nothing else.',
    user: `Sample text:
"""${text}"""

Detect the writing language and report it in "language".
Return JSON with this exact shape:
{
  "tone": string[],
  "formality": "casual" | "neutral" | "formal",
  "person": "first" | "second" | "third",
  "avgSentenceLength": "short" | "medium" | "long",
  "vocabulary": "simple" | "mixed" | "technical",
  "usesQuestions": boolean,
  "usesExamples": boolean,
  "signaturePhrases": string[],
  "dos": string[],
  "donts": string[],
  "sampleExcerpts": string[],
  "language": string
}
"sampleExcerpts" should contain 1–2 short, representative sentences copied verbatim from the text.`,
  };
}

// 11.2 — Content brief
export function briefPrompt(keyword: string, lang: Language): Prompt {
  return {
    system: `You are an SEO content strategist. Output language MUST be ${langLabel(
      lang,
    )}. Return a single JSON object (ContentBrief) — no commentary.`,
    user: `Keyword: "${keyword}".
Determine the search intent, propose a title (≤ 60 chars, keyword near the start), a meta description (120–160 chars containing the keyword), a logical H2/H3 outline that matches the intent, and a reasonable target word count.
Return JSON with this exact shape:
{
  "targetKeyword": string,
  "secondaryKeywords": string[],
  "searchIntent": "informational" | "commercial" | "transactional" | "navigational",
  "suggestedTitle": string,
  "suggestedMeta": string,
  "outline": [{ "level": 2 | 3, "heading": string }],
  "targetWordCount": number
}`,
  };
}

// 11.3 — Article generation (with brand-voice injection)
export function generatePrompt(
  brief: ContentBrief,
  lang: Language,
  voice?: BrandVoiceProfile,
): Prompt {
  const voiceBlock = voice
    ? `Follow this BRAND VOICE closely:
- Tone: ${voice.tone.join(', ')}
- Formality: ${voice.formality}; Person: ${voice.person}; Sentence length: ${voice.avgSentenceLength}
- Do: ${voice.dos.join('; ')}
- Don't: ${voice.donts.join('; ')}
${
  voice.sampleExcerpts?.[0]
    ? `- Reference sample (mimic its rhythm and phrasing, do NOT copy it):
"""${voice.sampleExcerpts[0]}"""`
    : ''
}`
    : 'Write in a clear, helpful, people-first voice.';

  return {
    system: `You are an expert SEO writer. Write in ${langLabel(lang)}.
${voiceBlock}
Rules: produce genuinely useful content that follows the outline; use HTML headings (<h2>, <h3>), short readable paragraphs and lists where helpful; weave the target keyword in naturally (including the title, at least one <h2>, and the meta) — never stuff it; no clichés or robotic phrasing.`,
    user: `Brief (JSON):
${JSON.stringify(brief)}

Write the complete article as an HTML BODY fragment (no <html>/<head>/<body> wrappers; start directly with content).
Return JSON with this exact shape:
{
  "title": string,
  "metaDescription": string,
  "slug": string,
  "contentHtml": string
}`,
  };
}

// 11.4 — Internal link suggestions
export function internalLinksPrompt(
  current: { title: string; keyword: string; summary: string },
  others: LinkCandidate[],
  lang: Language,
): Prompt {
  return {
    system: `You are an internal-linking expert. Output language for anchor/reason: ${langLabel(
      lang,
    )}. Return a JSON array only — no commentary.`,
    user: `Current article: ${JSON.stringify(current)}.
Other articles in the campaign: ${JSON.stringify(
      others.map((o) => ({
        targetArticleId: o.id,
        slug: o.slug,
        title: o.title,
        keyword: o.keyword,
        summary: o.summary,
      })),
    )}.
Suggest 2–5 natural, contextually relevant internal links from the current article to the others.
Return a JSON array with this exact shape:
[{ "targetArticleId": string, "targetSlug": string, "targetTitle": string, "anchorText": string, "reason": string }]`,
  };
}
