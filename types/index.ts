// types/index.ts — GoMax SEO Studio data model (single source of truth)

export type Language = 'vi' | 'en';

export type ArticleStatus =
  | 'draft'
  | 'optimizing'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'failed';

export const ARTICLE_STATUSES: ArticleStatus[] = [
  'draft',
  'optimizing',
  'ready',
  'scheduled',
  'published',
  'failed',
];

// ── Brand Voice ────────────────────────────────────────────────
export interface BrandVoiceProfile {
  id: string;
  name: string;
  sourceUrl?: string;
  /** Voice profile produced by AI analysis */
  tone: string[]; // e.g. ['thân thiện','chuyên gia','dí dỏm nhẹ']
  formality: 'casual' | 'neutral' | 'formal';
  person: 'first' | 'second' | 'third';
  avgSentenceLength: 'short' | 'medium' | 'long';
  vocabulary: 'simple' | 'mixed' | 'technical';
  usesQuestions: boolean;
  usesExamples: boolean;
  signaturePhrases: string[];
  dos: string[];
  donts: string[];
  sampleExcerpts: string[]; // 1-2 paragraphs used for few-shot
  language: Language | string;
  createdAt: string;
  isDemo?: boolean;
}

// ── Brief ──────────────────────────────────────────────────────
export type SearchIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

export interface OutlineItem {
  level: 2 | 3;
  heading: string;
}

export interface ContentBrief {
  targetKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  suggestedTitle: string;
  suggestedMeta: string;
  outline: OutlineItem[];
  targetWordCount: number;
}

// ── Internal links ─────────────────────────────────────────────
export interface InternalLinkSuggestion {
  id: string;
  targetArticleId: string;
  targetTitle: string;
  targetSlug: string;
  anchorText: string;
  reason: string; // why this link makes sense
  accepted: boolean;
}

// ── SEO score (shape produced by lib/seo/score.ts) ─────────────
export type SeoFeedbackType = 'success' | 'warning' | 'danger';

export interface SeoFeedback {
  key: string;
  type: SeoFeedbackType;
  text: string;
}

export interface SeoScore {
  score: number; // 0-100
  totalWords: number;
  keywordCount: number;
  density: number; // percent, e.g. 1.42
  feedback: SeoFeedback[];
}

// ── Article ────────────────────────────────────────────────────
export interface Article {
  id: string;
  campaignId: string;
  status: ArticleStatus;
  brief?: ContentBrief;
  title: string;
  slug: string;
  metaDescription: string;
  contentHtml: string; // output from TipTap → pushed straight to WP
  targetKeyword: string;
  seoScore?: SeoScore;
  internalLinks: InternalLinkSuggestion[];
  wordpressPostId?: number;
  wordpressUrl?: string;
  scheduledFor?: string; // ISO 8601
  language: Language | string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Campaign ───────────────────────────────────────────────────
export interface Campaign {
  id: string;
  name: string;
  brandVoiceId?: string;
  language: Language | string;
  articleIds: string[];
  createdAt: string;
}

// ── WordPress ──────────────────────────────────────────────────
export interface WordPressConnection {
  siteUrl: string; // https://site.com
  username: string;
  appPassword: string; // stored server-side in SQLite (settings table)
  verified: boolean;
  sandbox: boolean; // default true
}

export interface WpCategory {
  id: number;
  name: string;
  count?: number;
}

export interface WpTag {
  id: number;
  name: string;
}

// ── API payload helpers ────────────────────────────────────────
export interface GenerateResult {
  title: string;
  metaDescription: string;
  slug: string;
  contentHtml: string;
}

export interface PublishResult {
  ok: boolean;
  id?: number;
  link?: string;
  sandbox?: boolean;
  error?: string;
}

/** Lightweight article descriptor sent to /api/internal-links */
export interface LinkCandidate {
  id: string;
  title: string;
  slug: string;
  keyword: string;
  summary: string;
}
