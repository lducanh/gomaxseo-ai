// lib/extract.ts — pull the main readable text out of a public URL.
// Server-side only (used by /api/voice/analyze).
import * as cheerio from 'cheerio';

export class ExtractError extends Error {
  constructor(
    message: string,
    public code: 'FETCH' | 'EMPTY' | 'BLOCKED' | 'INVALID_URL',
  ) {
    super(message);
    this.name = 'ExtractError';
  }
}

export async function extractArticleText(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ExtractError('URL không hợp lệ', 'INVALID_URL');
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new ExtractError('Chỉ hỗ trợ http/https', 'INVALID_URL');
  }

  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      headers: {
        // Some sites 403 unknown agents; present a friendly, honest UA.
        'User-Agent':
          'Mozilla/5.0 (compatible; GoMaxSEOStudio/1.0; +brand-voice-analyzer)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
      redirect: 'follow',
    });
  } catch {
    throw new ExtractError('Không kết nối được tới URL', 'FETCH');
  }

  if (res.status === 403 || res.status === 429) {
    throw new ExtractError('Trang chặn truy cập tự động', 'BLOCKED');
  }
  if (!res.ok) {
    throw new ExtractError(`Tải trang thất bại (HTTP ${res.status})`, 'FETCH');
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  $('script,style,nav,header,footer,aside,noscript,form,iframe,svg').remove();

  // Prefer semantic containers, fall back to body.
  const candidates = ['article', 'main', '[role="main"]', '.post-content', '.entry-content', 'body'];
  let text = '';
  for (const sel of candidates) {
    const t = $(sel).first().text().replace(/\s+/g, ' ').trim();
    if (t.length > text.length) text = t;
    if (text.length > 800) break;
  }

  if (!text || text.length < 80) {
    throw new ExtractError('Không trích được đủ nội dung', 'EMPTY');
  }
  return text.slice(0, 5000);
}
