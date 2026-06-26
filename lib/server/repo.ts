// lib/server/repo.ts — data-access layer over SQLite (server-side ONLY).
//
// Design: each entity is stored as a row with a few indexed/queryable columns
// PLUS a `data` column holding the full JSON object (robust to the rich,
// deeply-nested shapes in types/index.ts). `campaign.articleIds` is a DERIVED
// field — recomputed from the articles table on read — so article writes never
// have to mutate campaigns, keeping the two in sync by construction.
import { db } from './db';
import type {
  Article,
  BrandVoiceProfile,
  Campaign,
  Language,
  WordPressConnection,
} from '@/types';

export interface StudioSnapshot {
  language: Language;
  wp: WordPressConnection;
  campaigns: Campaign[];
  articles: Article[];
  brandVoices: BrandVoiceProfile[];
}

// ── Settings (single row) ────────────────────────────────────────
export function getSettings(): { language: Language; wp: WordPressConnection } {
  const row = db
    .prepare(`SELECT language, wp FROM settings WHERE id = 1`)
    .get() as { language: string; wp: string };
  return {
    language: (row.language as Language) || 'vi',
    wp: JSON.parse(row.wp) as WordPressConnection,
  };
}

export function updateSettings(patch: {
  language?: Language;
  wp?: Partial<WordPressConnection>;
}): { language: Language; wp: WordPressConnection } {
  const current = getSettings();
  const language = patch.language ?? current.language;
  const wp = patch.wp ? { ...current.wp, ...patch.wp } : current.wp;
  db.prepare(`UPDATE settings SET language = ?, wp = ? WHERE id = 1`).run(
    language,
    JSON.stringify(wp),
  );
  return { language, wp };
}

// ── Campaigns ────────────────────────────────────────────────────
export function upsertCampaign(c: Campaign): void {
  db.prepare(
    `INSERT INTO campaigns (id, name, brand_voice_id, language, created_at, data)
     VALUES (@id, @name, @brandVoiceId, @language, @createdAt, @data)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       brand_voice_id = excluded.brand_voice_id,
       language = excluded.language,
       data = excluded.data`,
  ).run({
    id: c.id,
    name: c.name,
    brandVoiceId: c.brandVoiceId ?? null,
    language: String(c.language),
    createdAt: c.createdAt,
    data: JSON.stringify(c),
  });
}

export function deleteCampaign(id: string): void {
  // ON DELETE CASCADE removes child articles automatically.
  db.prepare(`DELETE FROM campaigns WHERE id = ?`).run(id);
}

// ── Articles ─────────────────────────────────────────────────────
const upsertArticleStmt = () =>
  db.prepare(
    `INSERT INTO articles (id, campaign_id, status, title, created_at, updated_at, data)
     VALUES (@id, @campaignId, @status, @title, @createdAt, @updatedAt, @data)
     ON CONFLICT(id) DO UPDATE SET
       campaign_id = excluded.campaign_id,
       status = excluded.status,
       title = excluded.title,
       updated_at = excluded.updated_at,
       data = excluded.data`,
  );

function bindArticle(a: Article) {
  return {
    id: a.id,
    campaignId: a.campaignId,
    status: a.status,
    title: a.title ?? '',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    data: JSON.stringify(a),
  };
}

export function upsertArticle(a: Article): void {
  upsertArticleStmt().run(bindArticle(a));
}

export function upsertArticles(list: Article[]): void {
  const stmt = upsertArticleStmt();
  const tx = db.transaction((rows: Article[]) => {
    for (const a of rows) stmt.run(bindArticle(a));
  });
  tx(list);
}

export function deleteArticle(id: string): void {
  db.prepare(`DELETE FROM articles WHERE id = ?`).run(id);
}

// ── Brand voices ─────────────────────────────────────────────────
export function upsertBrandVoice(v: BrandVoiceProfile): void {
  db.prepare(
    `INSERT INTO brand_voices (id, name, created_at, data)
     VALUES (@id, @name, @createdAt, @data)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data`,
  ).run({
    id: v.id,
    name: v.name,
    createdAt: v.createdAt,
    data: JSON.stringify(v),
  });
}

export function deleteBrandVoice(id: string): void {
  db.prepare(`DELETE FROM brand_voices WHERE id = ?`).run(id);
}

// ── Reset (keeps settings) ───────────────────────────────────────
export function clearContent(): void {
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM articles`).run();
    db.prepare(`DELETE FROM campaigns`).run();
    db.prepare(`DELETE FROM brand_voices`).run();
  });
  tx();
}

// ── Bootstrap snapshot ───────────────────────────────────────────
export function getSnapshot(): StudioSnapshot {
  const { language, wp } = getSettings();

  const campaignRows = db
    .prepare(`SELECT data FROM campaigns ORDER BY created_at DESC, rowid DESC`)
    .all() as { data: string }[];
  const articleRows = db
    .prepare(`SELECT data FROM articles ORDER BY created_at DESC, rowid DESC`)
    .all() as { data: string }[];
  const voiceRows = db
    .prepare(`SELECT data FROM brand_voices ORDER BY created_at DESC, rowid DESC`)
    .all() as { data: string }[];

  const articles = articleRows.map((r) => JSON.parse(r.data) as Article);

  // Derive articleIds per campaign from the articles table (source of truth).
  const idsByCampaign = new Map<string, string[]>();
  for (const a of articles) {
    const arr = idsByCampaign.get(a.campaignId) ?? [];
    arr.push(a.id);
    idsByCampaign.set(a.campaignId, arr);
  }

  const campaigns = campaignRows.map((r) => {
    const c = JSON.parse(r.data) as Campaign;
    return { ...c, articleIds: idsByCampaign.get(c.id) ?? [] };
  });

  const brandVoices = voiceRows.map(
    (r) => JSON.parse(r.data) as BrandVoiceProfile,
  );

  return { language, wp, campaigns, articles, brandVoices };
}
