// lib/store.ts — Zustand store backed by a SQLite REST API.
//
// Persistence model: the browser holds an in-memory cache (this store) that is
// hydrated once from GET /api/state, then every mutation is applied optimistically
// AND written through to the server (PUT/DELETE). The server (SQLite) is the
// source of truth; a reload re-fetches it. Sync calls are fire-and-forget — a
// failed write is logged but never blocks the UI (local state already updated).
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  Article,
  BrandVoiceProfile,
  Campaign,
  Language,
  WordPressConnection,
} from '@/types';
import { buildDemoSeed } from '@/data/fallback';

const defaultWp: WordPressConnection = {
  siteUrl: '',
  username: '',
  appPassword: '',
  verified: false,
  sandbox: true, // sandbox ON by default — demo runs with zero config
};

// ── Fire-and-forget network helper ───────────────────────────────
function sync(url: string, method: 'PUT' | 'DELETE', body?: unknown): void {
  if (typeof window === 'undefined') return;
  fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
    .then((r) => {
      if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}`);
    })
    .catch((e) => console.error('[studio sync]', e));
}

interface StudioState {
  hydrated: boolean;
  language: Language;
  campaigns: Campaign[];
  articles: Article[];
  brandVoices: BrandVoiceProfile[];
  wp: WordPressConnection;

  hydrate: () => Promise<void>;
  setLanguage: (l: Language) => void;

  addCampaign: (c: Campaign) => void;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  removeCampaign: (id: string) => void;

  addArticle: (a: Article) => void;
  addArticles: (a: Article[]) => void;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  removeArticle: (id: string) => void;

  addBrandVoice: (v: BrandVoiceProfile) => void;
  updateBrandVoice: (id: string, patch: Partial<BrandVoiceProfile>) => void;
  removeBrandVoice: (id: string) => void;

  setWp: (patch: Partial<WordPressConnection>) => void;

  loadDemo: () => void;
  resetAll: () => void;
}

export const useStudio = create<StudioState>()((set, get) => ({
  hydrated: false,
  language: 'vi',
  campaigns: [],
  articles: [],
  brandVoices: [],
  wp: defaultWp,

  // Load the full snapshot from SQLite. Called once on the client at startup.
  hydrate: async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) throw new Error(`GET /api/state → HTTP ${res.status}`);
      const snap = await res.json();
      set({
        language: snap.language ?? 'vi',
        campaigns: snap.campaigns ?? [],
        articles: snap.articles ?? [],
        brandVoices: snap.brandVoices ?? [],
        wp: { ...defaultWp, ...(snap.wp ?? {}) },
        hydrated: true,
      });
    } catch (e) {
      console.error('[studio hydrate]', e);
      set({ hydrated: true }); // unblock the UI even if the API is down
    }
  },

  setLanguage: (language) => {
    set({ language });
    sync('/api/settings', 'PUT', { language });
  },

  // ── Campaigns ──────────────────────────────────────────────────
  addCampaign: (c) => {
    set((s) => ({ campaigns: [c, ...s.campaigns] }));
    sync('/api/campaigns', 'PUT', c);
  },
  updateCampaign: (id, patch) => {
    const updated = get().campaigns.find((c) => c.id === id);
    if (!updated) return;
    const next = { ...updated, ...patch };
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? next : c)) }));
    sync('/api/campaigns', 'PUT', next);
  },
  removeCampaign: (id) => {
    set((s) => ({
      campaigns: s.campaigns.filter((c) => c.id !== id),
      articles: s.articles.filter((a) => a.campaignId !== id),
    }));
    sync(`/api/campaigns?id=${encodeURIComponent(id)}`, 'DELETE'); // cascades articles
  },

  // ── Articles (articleIds is derived server-side) ───────────────
  addArticle: (a) => {
    set((s) => ({
      articles: [a, ...s.articles],
      campaigns: s.campaigns.map((c) =>
        c.id === a.campaignId && !c.articleIds.includes(a.id)
          ? { ...c, articleIds: [...c.articleIds, a.id] }
          : c,
      ),
    }));
    sync('/api/articles', 'PUT', a);
  },
  addArticles: (list) => {
    set((s) => {
      const byCampaign = new Map<string, string[]>();
      for (const a of list) {
        byCampaign.set(a.campaignId, [
          ...(byCampaign.get(a.campaignId) || []),
          a.id,
        ]);
      }
      return {
        articles: [...list, ...s.articles],
        campaigns: s.campaigns.map((c) => {
          const added = byCampaign.get(c.id);
          if (!added) return c;
          const merged = Array.from(new Set([...c.articleIds, ...added]));
          return { ...c, articleIds: merged };
        }),
      };
    });
    sync('/api/articles', 'PUT', list);
  },
  updateArticle: (id, patch) => {
    const current = get().articles.find((a) => a.id === id);
    if (!current) return;
    const next: Article = { ...current, ...patch, updatedAt: new Date().toISOString() };
    set((s) => ({ articles: s.articles.map((a) => (a.id === id ? next : a)) }));
    sync('/api/articles', 'PUT', next);
  },
  removeArticle: (id) => {
    set((s) => ({
      articles: s.articles.filter((a) => a.id !== id),
      campaigns: s.campaigns.map((c) => ({
        ...c,
        articleIds: c.articleIds.filter((aid) => aid !== id),
      })),
    }));
    sync(`/api/articles?id=${encodeURIComponent(id)}`, 'DELETE');
  },

  // ── Brand voices ───────────────────────────────────────────────
  addBrandVoice: (v) => {
    set((s) => ({ brandVoices: [v, ...s.brandVoices] }));
    sync('/api/brand-voices', 'PUT', v);
  },
  updateBrandVoice: (id, patch) => {
    const current = get().brandVoices.find((v) => v.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    set((s) => ({ brandVoices: s.brandVoices.map((v) => (v.id === id ? next : v)) }));
    sync('/api/brand-voices', 'PUT', next);
  },
  removeBrandVoice: (id) => {
    set((s) => ({ brandVoices: s.brandVoices.filter((v) => v.id !== id) }));
    sync(`/api/brand-voices?id=${encodeURIComponent(id)}`, 'DELETE');
  },

  // ── WordPress / settings ───────────────────────────────────────
  setWp: (patch) => {
    set((s) => ({ wp: { ...s.wp, ...patch } }));
    sync('/api/settings', 'PUT', { wp: patch });
  },

  // ── Demo / reset ───────────────────────────────────────────────
  loadDemo: () => {
    const seed = buildDemoSeed((get().language as Language) || 'vi');
    set((s) => ({
      campaigns: [...seed.campaigns, ...s.campaigns],
      articles: [...seed.articles, ...s.articles],
      brandVoices: [...seed.brandVoices, ...s.brandVoices],
    }));
    seed.brandVoices.forEach((v) => sync('/api/brand-voices', 'PUT', v));
    seed.campaigns.forEach((c) => sync('/api/campaigns', 'PUT', c));
    if (seed.articles.length) sync('/api/articles', 'PUT', seed.articles);
  },
  resetAll: () => {
    set({ campaigns: [], articles: [], brandVoices: [] });
    sync('/api/state', 'DELETE');
  },
}));

// Hydrate once on the client at module load. The UI is gated on `hydrated`.
if (typeof window !== 'undefined') {
  useStudio.getState().hydrate();
}

// ── Convenience selectors ────────────────────────────────────────
export const useHydrated = () => useStudio((s) => s.hydrated);
export const useLanguage = () => useStudio((s) => s.language);

export const useArticle = (id?: string) =>
  useStudio((s) => (id ? s.articles.find((a) => a.id === id) : undefined));

export const useCampaign = (id?: string) =>
  useStudio((s) => (id ? s.campaigns.find((c) => c.id === id) : undefined));

export const useCampaignArticles = (campaignId?: string) =>
  useStudio(
    useShallow((s) => s.articles.filter((a) => a.campaignId === campaignId)),
  );

export const useBrandVoice = (id?: string) =>
  useStudio((s) => (id ? s.brandVoices.find((v) => v.id === id) : undefined));
