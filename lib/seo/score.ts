// lib/seo/score.ts — on-page SEO heuristics (Yoast/RankMath-style)
//
// IMPORTANT: these are on-page *heuristics*, NOT official Google ranking
// factors. Title/meta length affect SERP display (truncation), not ranking.
// Modern SEO rewards helpful, people-first content. Present the score as
// "optimization hints", never as a ranking promise. (See guide §10.)
import type { SeoScore, SeoFeedback, SeoFeedbackType, Language } from '@/types';
import { stripHtml } from '@/lib/utils';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Documented point allocation (max 100):
 *   keyword in title 20 (+5 if first) · title length 10 · density 25 ·
 *   H2 structure 10 + keyword-in-H2 10 · keyword in meta 15
 * Extra advisory checks (meta length, img alt, internal links) add feedback
 * but do not change the score.
 */
export function analyzeSeo(
  htmlContent: string,
  primaryKeyword: string,
  title: string,
  metaDescription: string,
  lang: Language = 'vi',
): SeoScore {
  const t = (vi: string, en: string) => (lang === 'en' ? en : vi);
  let score = 0;
  const feedback: SeoFeedback[] = [];
  const push = (key: string, type: SeoFeedbackType, text: string) =>
    feedback.push({ key, type, text });

  const keyword = (primaryKeyword || '').toLowerCase().trim();
  const titleLower = (title || '').toLowerCase();
  const metaLower = (metaDescription || '').toLowerCase();

  const textContent = stripHtml(htmlContent || '');
  const totalWords = textContent
    ? textContent.split(/\s+/).filter(Boolean).length
    : 0;

  if (!keyword) {
    push(
      'keyword-missing',
      'warning',
      t('Chưa có từ khóa chính để chấm điểm.', 'No primary keyword set yet.'),
    );
    return { score: 0, totalWords, keywordCount: 0, density: 0, feedback };
  }

  // Rule 1 — keyword in title (20, +5 bonus if leading)
  if (titleLower.includes(keyword)) {
    score += 20;
    if (titleLower.trimStart().indexOf(keyword) === 0) {
      score += 5;
      push('title-keyword', 'success', t('Tuyệt vời: Từ khóa nằm ngay đầu tiêu đề.', 'Excellent: keyword sits at the very start of the title.'));
    } else {
      push('title-keyword', 'success', t('Tốt: Tiêu đề có chứa từ khóa chính.', 'Good: the title contains the primary keyword.'));
    }
  } else {
    push('title-keyword', 'danger', t('Lỗi nặng: Tiêu đề chưa chứa từ khóa chính.', 'Critical: the title is missing the primary keyword.'));
  }

  // Rule 2 — title length 40–65 (SERP display)
  const titleLen = (title || '').length;
  if (titleLen >= 40 && titleLen <= 65) {
    score += 10;
    push('title-length', 'success', t(`Độ dài tiêu đề hoàn hảo (${titleLen} ký tự).`, `Title length is ideal (${titleLen} chars).`));
  } else {
    push('title-length', 'warning', t(`Tiêu đề ${titleLen} ký tự — nên nằm trong 40–65 để không bị cắt trên SERP.`, `Title is ${titleLen} chars — aim for 40–65 to avoid SERP truncation.`));
  }

  // Rule 3 — keyword density 0.8–2.5%
  const keywordCount = (
    textContent.toLowerCase().match(new RegExp(escapeRegExp(keyword), 'g')) || []
  ).length;
  const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
  if (density >= 0.8 && density <= 2.5) {
    score += 25;
    push('density', 'success', t(`Mật độ từ khóa đạt chuẩn: ${density.toFixed(2)}% (${keywordCount} lần).`, `Keyword density on target: ${density.toFixed(2)}% (${keywordCount}×).`));
  } else if (density < 0.8) {
    score += 10;
    push('density', 'warning', t(`Mật độ từ khóa hơi thấp: ${density.toFixed(2)}%. Chèn thêm tự nhiên.`, `Keyword density a bit low: ${density.toFixed(2)}%. Weave in a few more naturally.`));
  } else {
    score += 5;
    push('density', 'danger', t(`Cảnh báo nhồi từ khóa: ${density.toFixed(2)}% — quá dày.`, `Keyword-stuffing risk: ${density.toFixed(2)}% — too dense.`));
  }

  // Rule 4 — H2 structure (10) + keyword in an H2 (10)
  const hasH2 = /<h2[^>]*>/i.test(htmlContent || '');
  if (hasH2) {
    score += 10;
    const h2s = (htmlContent || '').match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
    const kwInH2 = h2s.some((h) => h.toLowerCase().includes(keyword));
    if (kwInH2) {
      score += 10;
      push('h2', 'success', t('Tốt: Có thẻ H2 chứa từ khóa chính.', 'Good: an H2 heading contains the primary keyword.'));
    } else {
      push('h2', 'warning', t('Nên bổ sung từ khóa vào ít nhất một thẻ H2.', 'Add the keyword to at least one H2 heading.'));
    }
  } else {
    push('h2', 'danger', t('Thiếu thẻ H2 — cấu trúc nội dung chưa chuẩn.', 'No H2 headings — content structure is incomplete.'));
  }

  // Rule 5 — keyword in meta description (15)
  if (metaLower.includes(keyword)) {
    score += 15;
    push('meta-keyword', 'success', t('Đoạn mô tả (meta) chứa từ khóa chính.', 'Meta description contains the primary keyword.'));
  } else {
    push('meta-keyword', 'danger', t('Thiếu từ khóa chính trong đoạn mô tả meta.', 'Meta description is missing the primary keyword.'));
  }

  // ── Advisory checks (no score impact) ──────────────────────────
  const metaLen = (metaDescription || '').length;
  if (metaLen === 0) {
    push('meta-length', 'warning', t('Chưa có đoạn mô tả meta.', 'No meta description yet.'));
  } else if (metaLen >= 120 && metaLen <= 160) {
    push('meta-length', 'success', t(`Độ dài meta tốt (${metaLen} ký tự).`, `Meta length is good (${metaLen} chars).`));
  } else {
    push('meta-length', 'warning', t(`Meta ${metaLen} ký tự — lý tưởng 120–160.`, `Meta is ${metaLen} chars — ideal is 120–160.`));
  }

  const imgs = (htmlContent || '').match(/<img[^>]*>/gi) || [];
  if (imgs.length > 0) {
    const withAlt = imgs.filter((i) => /alt\s*=\s*["'][^"']+["']/i.test(i)).length;
    if (withAlt === imgs.length) {
      push('img-alt', 'success', t(`Tất cả ${imgs.length} ảnh đều có alt.`, `All ${imgs.length} images have alt text.`));
    } else {
      push('img-alt', 'warning', t(`${imgs.length - withAlt}/${imgs.length} ảnh thiếu alt.`, `${imgs.length - withAlt}/${imgs.length} images are missing alt text.`));
    }
  }

  const internalLinks = (
    (htmlContent || '').match(/<a\s[^>]*href=["']\/[^"']*["']/gi) || []
  ).length;
  if (internalLinks > 0) {
    push('internal-links', 'success', t(`Có ${internalLinks} liên kết nội bộ.`, `${internalLinks} internal link(s) present.`));
  } else {
    push('internal-links', 'warning', t('Chưa có liên kết nội bộ — cân nhắc thêm để xây cluster.', 'No internal links yet — add a few to build the cluster.'));
  }

  const finalScore = Math.min(100, Math.max(0, score));
  return {
    score: finalScore,
    totalWords,
    keywordCount,
    density: Number(density.toFixed(2)),
    feedback,
  };
}

/** Tier label + semantic color key for the score ring */
export function seoTier(
  score: number,
  lang: Language = 'vi',
): { label: string; tone: 'good' | 'ok' | 'bad' } {
  const t = (vi: string, en: string) => (lang === 'en' ? en : vi);
  if (score >= 80) return { label: t('Tốt', 'Good'), tone: 'good' };
  if (score >= 50) return { label: t('Khá', 'Fair'), tone: 'ok' };
  return { label: t('Cần cải thiện', 'Needs work'), tone: 'bad' };
}
