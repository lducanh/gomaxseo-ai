// lib/wordpress/client.ts — WordPress REST helpers (server-side only).
//
// Auth: Application Passwords (WP 5.6+) over HTTP Basic Auth — base64 of
// "username:app_password" in the Authorization header. We always call WP
// from the server (never the browser) to avoid CORS + leaking credentials.
//
// NOTE: endpoints/fields below should be verified against the WordPress REST
// API Handbook (developer.wordpress.org/rest-api/) for the target site.
import type {
  WordPressConnection,
  WpCategory,
  WpTag,
  PublishResult,
} from '@/types';

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, '');
}

function authHeader(username: string, appPassword: string): string {
  // App passwords are displayed as "xxxx xxxx xxxx…"; spaces are cosmetic.
  const creds = `${username}:${appPassword.replace(/\s+/g, '')}`;
  return `Basic ${Buffer.from(creds).toString('base64')}`;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export interface WpTestResult {
  ok: boolean;
  user?: { id: number; name: string };
  error?: string;
}

/** Verify credentials by reading the authenticated user. */
export async function wpTestConnection(
  conn: Pick<WordPressConnection, 'siteUrl' | 'username' | 'appPassword'>,
): Promise<WpTestResult> {
  const base = normalizeSiteUrl(conn.siteUrl);
  if (!/^https?:\/\//.test(base)) {
    return { ok: false, error: 'Site URL phải bắt đầu bằng http(s)://' };
  }
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: authHeader(conn.username, conn.appPassword) },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, error: await readError(res) };
    const user = await res.json();
    return { ok: true, user: { id: user.id, name: user.name } };
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Network error' };
  }
}

export async function wpGetTaxonomies(
  conn: Pick<WordPressConnection, 'siteUrl' | 'username' | 'appPassword'>,
): Promise<{ categories: WpCategory[]; tags: WpTag[]; error?: string }> {
  const base = normalizeSiteUrl(conn.siteUrl);
  const auth = authHeader(conn.username, conn.appPassword);
  try {
    const [catRes, tagRes] = await Promise.all([
      fetch(`${base}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,count`, {
        headers: { Authorization: auth },
        cache: 'no-store',
      }),
      fetch(`${base}/wp-json/wp/v2/tags?per_page=100&_fields=id,name`, {
        headers: { Authorization: auth },
        cache: 'no-store',
      }),
    ]);
    const categories = catRes.ok ? await catRes.json() : [];
    const tags = tagRes.ok ? await tagRes.json() : [];
    return { categories, tags };
  } catch (e) {
    return { categories: [], tags: [], error: (e as Error).message };
  }
}

export interface WpPublishInput {
  title: string;
  contentHtml: string;
  excerpt?: string;
  slug?: string;
  status?: 'publish' | 'draft' | 'future';
  date?: string; // ISO 8601 (required when status === 'future')
  categoryIds?: number[];
  tagIds?: number[];
  featuredImageUrl?: string;
}

/**
 * Full publish flow: (optional) upload featured image → create post.
 * Image failure never blocks publishing — we just skip featured_media.
 */
export async function wpPublish(
  conn: Pick<WordPressConnection, 'siteUrl' | 'username' | 'appPassword'>,
  input: WpPublishInput,
): Promise<PublishResult> {
  const base = normalizeSiteUrl(conn.siteUrl);
  const auth = authHeader(conn.username, conn.appPassword);

  let featuredMediaId: number | null = null;
  if (input.featuredImageUrl) {
    try {
      const imgRes = await fetch(input.featuredImageUrl, { cache: 'no-store' });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.includes('png') ? 'png' : 'jpg';
        const mediaRes = await fetch(`${base}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            Authorization: auth,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename=seo-featured-image.${ext}`,
          },
          body: buf,
        });
        if (mediaRes.ok) {
          const media = await mediaRes.json();
          featuredMediaId = media.id ?? null;
        }
      }
    } catch {
      // swallow — publish proceeds without a featured image
    }
  }

  const payload: Record<string, unknown> = {
    title: input.title,
    content: input.contentHtml,
    status: input.status || 'publish',
  };
  if (input.excerpt) payload.excerpt = input.excerpt;
  if (input.slug) payload.slug = input.slug;
  if (input.date) payload.date = input.date;
  if (input.categoryIds?.length) payload.categories = input.categoryIds;
  if (input.tagIds?.length) payload.tags = input.tagIds;
  if (featuredMediaId) payload.featured_media = featuredMediaId;

  try {
    const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: await readError(res) };
    const post = await res.json();
    return { ok: true, id: post.id, link: post.link };
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Network error' };
  }
}
