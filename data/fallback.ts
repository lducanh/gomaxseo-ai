// data/fallback.ts — high-quality, keyword-adaptive sandbox content.
//
// This is what reviewers see first when no API key is configured, so it must
// read like a real SEO article — not a canned blob. Everything below is woven
// around the user's keyword and is engineered to score well on lib/seo/score.
import type {
  Article,
  ArticleStatus,
  BrandVoiceProfile,
  Campaign,
  ContentBrief,
  GenerateResult,
  InternalLinkSuggestion,
  Language,
  OutlineItem,
} from '@/types';
import { slugify, uid } from '@/lib/utils';
import { analyzeSeo } from '@/lib/seo/score';

function capitalize(s: string): string {
  const t = (s || '').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ── Title / meta / outline ──────────────────────────────────────
export function makeTitle(keyword: string, lang: Language): string {
  const cap = capitalize(keyword);
  const suffixes =
    lang === 'en'
      ? [
          ': The Complete 2026 Guide',
          ': A Practical Guide for Beginners',
          ': Everything You Need to Know in 2026',
          ': Strategy, Tips & Best Practices',
          ' — 2026 Playbook',
        ]
      : [
          ': Hướng dẫn toàn diện từ A đến Z (2026)',
          ': Cẩm nang chi tiết cho người mới bắt đầu',
          ': Chiến lược, mẹo hay và lưu ý quan trọng',
          ': Tất tần tật những điều cần biết',
          ' — Bí quyết 2026',
        ];
  const opts = suffixes.map((s) => cap + s);
  const within = opts.find((o) => o.length >= 40 && o.length <= 65);
  if (within) return within;
  // none fit perfectly → pick the closest to the 52-char sweet spot
  return opts.reduce(
    (best, o) =>
      Math.abs(o.length - 52) < Math.abs(best.length - 52) ? o : best,
    opts[0],
  );
}

export function makeMeta(keyword: string, lang: Language): string {
  const kw = keyword.trim();
  let meta =
    lang === 'en'
      ? `Master ${kw} with this in-depth guide: core concepts, real benefits, a step-by-step process and the common mistakes to avoid. Start improving ${kw} today.`
      : `Khám phá ${kw} qua hướng dẫn chi tiết: khái niệm cốt lõi, lợi ích thực tế, quy trình triển khai từng bước và các sai lầm cần tránh. Bắt đầu tối ưu ${kw} ngay hôm nay.`;
  if (meta.length > 160) meta = meta.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  if (meta.length < 120) {
    meta += lang === 'en' ? ' Practical, no fluff.' : ' Thực chiến, không lý thuyết suông.';
  }
  return meta;
}

export function makeOutline(keyword: string, lang: Language): OutlineItem[] {
  const cap = capitalize(keyword);
  const kw = keyword.trim();
  if (lang === 'en') {
    return [
      { level: 2, heading: `What is ${kw} and why it matters` },
      { level: 2, heading: 'The real benefits of doing it right' },
      { level: 2, heading: `How to implement ${kw} in 4 steps` },
      { level: 3, heading: 'Step 1 — Research and set goals' },
      { level: 3, heading: 'Step 2 — Build the foundation' },
      { level: 3, heading: 'Step 3 — Execute and optimize' },
      { level: 3, heading: 'Step 4 — Measure and iterate' },
      { level: 2, heading: `Common mistakes with ${kw}` },
      { level: 2, heading: 'Tools and resources that help' },
      { level: 2, heading: 'Conclusion' },
    ];
  }
  return [
    { level: 2, heading: `${cap} là gì và vì sao nên quan tâm?` },
    { level: 2, heading: 'Lợi ích thực tế khi làm đúng' },
    { level: 2, heading: `Cách triển khai ${kw} hiệu quả theo 4 bước` },
    { level: 3, heading: 'Bước 1 — Nghiên cứu và đặt mục tiêu' },
    { level: 3, heading: 'Bước 2 — Xây dựng nền tảng' },
    { level: 3, heading: 'Bước 3 — Thực thi và tối ưu' },
    { level: 3, heading: 'Bước 4 — Đo lường và lặp lại' },
    { level: 2, heading: `Những sai lầm thường gặp với ${kw}` },
    { level: 2, heading: 'Công cụ và nguồn lực hỗ trợ' },
    { level: 2, heading: 'Kết luận' },
  ];
}

// ── Article body ────────────────────────────────────────────────
function bodyVi(keyword: string): string {
  const kw = keyword.trim();
  const cap = capitalize(kw);
  return `
<p>Nếu bạn đang nghiêm túc tìm hiểu về <strong>${kw}</strong>, bài viết này được biên soạn để trở thành điểm khởi đầu đầy đủ nhất: từ khái niệm nền tảng, lợi ích thực tế cho đến quy trình triển khai từng bước. Thay vì những lời khuyên chung chung, chúng tôi tập trung vào cách áp dụng <strong>${kw}</strong> để tạo ra kết quả đo lường được.</p>
<h2>${cap} là gì và vì sao nên quan tâm?</h2>
<p>Hiểu đúng bản chất của ${kw} là bước đầu tiên giúp bạn tránh chạy theo xu hướng mà bỏ qua giá trị cốt lõi. Về cơ bản, đây là một cách tiếp cận có hệ thống nhằm giải quyết một nhu cầu cụ thể của người dùng, thay vì một thủ thuật nhất thời chỉ hiệu quả trong ngắn hạn.</p>
<p>Nhiều người mới bắt đầu thường nhầm lẫn giữa công cụ và chiến lược. Công cụ chỉ là phương tiện; điều thật sự tạo ra khác biệt là tư duy đặt người dùng làm trung tâm và sự nhất quán trong cách bạn triển khai ${kw} theo thời gian.</p>
<h2>Lợi ích thực tế khi làm đúng</h2>
<p>Khi được thực hiện bài bản, bạn sẽ thấy ba nhóm lợi ích rõ rệt: tiết kiệm thời gian nhờ quy trình chuẩn hóa, nâng cao chất lượng nhờ giảm sai sót thủ công, và quan trọng nhất là khả năng nhân rộng mà vẫn giữ được sự đồng nhất về chất lượng.</p>
<ul>
<li><strong>Tốc độ:</strong> rút ngắn thời gian từ ý tưởng đến thành phẩm.</li>
<li><strong>Tính nhất quán:</strong> mọi đầu ra đều bám theo một tiêu chuẩn chung.</li>
<li><strong>Khả năng mở rộng:</strong> dễ dàng làm hàng loạt mà không vỡ chất lượng.</li>
</ul>
<h2>Cách triển khai ${kw} hiệu quả theo 4 bước</h2>
<p>Một quy trình tốt không cần phức tạp. Dưới đây là khung bốn bước bạn có thể áp dụng ngay cho ${kw}, đồng thời tùy biến linh hoạt theo bối cảnh riêng của mình.</p>
<h3>Bước 1 — Nghiên cứu và đặt mục tiêu</h3>
<p>Trước khi bắt tay, hãy xác định rõ bạn muốn đạt được điều gì và sẽ đo lường bằng chỉ số nào. Mục tiêu mơ hồ là nguyên nhân phổ biến nhất khiến mọi nỗ lực trở nên lãng phí.</p>
<h3>Bước 2 — Xây dựng nền tảng</h3>
<p>Chuẩn bị tài nguyên, mẫu và quy chuẩn trước khi sản xuất hàng loạt. Đây là lúc bạn thiết lập "khuôn" để mọi sản phẩm sau đều đạt mức chất lượng tối thiểu mà bạn mong muốn.</p>
<h3>Bước 3 — Thực thi và tối ưu</h3>
<p>Hãy bắt đầu ở quy mô nhỏ, đo lường, rồi mở rộng những gì thực sự hiệu quả. Cách làm lặp đi lặp lại này giúp bạn cải thiện liên tục thay vì đặt cược tất cả vào một lần duy nhất.</p>
<h3>Bước 4 — Đo lường và lặp lại</h3>
<p>Không có gì hoàn hảo ngay từ đầu. Hãy theo dõi dữ liệu, ghi nhận điều chưa ổn và điều chỉnh — đó chính là bản chất của một quy trình bền vững và có thể nhân rộng.</p>
<h2>Những sai lầm thường gặp với ${kw}</h2>
<p>Sai lầm phổ biến nhất là ưu tiên số lượng hơn chất lượng, dẫn đến nội dung hời hợt và không tạo được niềm tin nơi người đọc. Một lỗi khác là sao chép máy móc cách làm của người khác mà không hiểu bối cảnh của chính mình.</p>
<p>Cuối cùng, đừng quên rằng ${kw} là một hành trình dài hạn. Kỳ vọng kết quả tức thì thường dẫn đến nản lòng và bỏ cuộc đúng vào lúc mọi thứ sắp có đà phát triển.</p>
<h2>Công cụ và nguồn lực hỗ trợ</h2>
<p>Bạn không cần một bộ công cụ đắt tiền để bắt đầu. Hãy ưu tiên những giải pháp giúp chuẩn hóa quy trình và giảm thao tác thủ công lặp lại, sau đó nâng cấp dần khi quy mô tăng lên.</p>
<h2>Kết luận</h2>
<p>Tóm lại, làm chủ ${kw} không nằm ở thủ thuật mà ở tư duy hệ thống và sự kiên trì. Hãy bắt đầu từ một mục tiêu rõ ràng, xây dựng quy trình có thể lặp lại, và cải thiện dựa trên dữ liệu thực tế. Phần thưởng là một nền tảng vững chắc, có khả năng mở rộng theo thời gian.</p>
`.trim();
}

function bodyEn(keyword: string): string {
  const kw = keyword.trim();
  const cap = capitalize(kw);
  return `
<p>If you are serious about learning <strong>${kw}</strong>, this guide is built to be the most complete starting point you will need: from foundational concepts and real-world benefits to a step-by-step implementation process. Instead of generic advice, we focus on applying <strong>${kw}</strong> in ways that produce measurable results.</p>
<h2>What is ${kw} and why it matters</h2>
<p>Understanding what ${kw} really is forms the first step toward avoiding shiny-object syndrome and staying focused on core value. At its heart, this is a systematic approach to solving a specific user need rather than a short-lived trick.</p>
<p>Beginners often confuse tools with strategy. Tools are only a means; the real difference comes from a user-centered mindset and consistency in how you apply ${kw} over time.</p>
<h2>The real benefits of doing it right</h2>
<p>Done well, you will see three clear categories of benefit: time saved through a standardized process, higher quality from fewer manual errors, and — most importantly — the ability to scale while staying consistent.</p>
<ul>
<li><strong>Speed:</strong> shorten the path from idea to finished output.</li>
<li><strong>Consistency:</strong> every output follows the same shared standard.</li>
<li><strong>Scalability:</strong> produce in bulk without sacrificing quality.</li>
</ul>
<h2>How to implement ${kw} in 4 steps</h2>
<p>A good process does not need to be complex. Below is a four-step framework you can apply to ${kw} right away and adapt to your own context.</p>
<h3>Step 1 — Research and set goals</h3>
<p>Before you begin, define exactly what you want to achieve and which metric will measure it. Vague goals are the single most common reason effort gets wasted.</p>
<h3>Step 2 — Build the foundation</h3>
<p>Prepare your resources, templates and standards before producing at scale. This is when you set the "mold" so every later output meets the minimum quality you expect.</p>
<h3>Step 3 — Execute and optimize</h3>
<p>Start small, measure, then scale what actually works. This iterative approach lets you improve continuously instead of betting everything on a single attempt.</p>
<h3>Step 4 — Measure and iterate</h3>
<p>Nothing is perfect from day one. Track the data, note what is not working and adjust — that is the essence of a sustainable, repeatable process.</p>
<h2>Common mistakes with ${kw}</h2>
<p>The most common mistake is prioritizing quantity over quality, which leads to shallow content that fails to build trust. Another is mechanically copying someone else's playbook without understanding your own context.</p>
<p>Finally, remember that ${kw} is a long-term journey. Expecting instant results often leads to giving up right when momentum is about to build.</p>
<h2>Tools and resources that help</h2>
<p>You do not need an expensive toolset to begin. Prioritize solutions that standardize your process and cut repetitive manual work, then upgrade gradually as you scale.</p>
<h2>Conclusion</h2>
<p>In short, mastering ${kw} is less about tricks and more about systems thinking and persistence. Start from a clear goal, build a repeatable process, and improve based on real data. The reward is a solid foundation that scales over time.</p>
`.trim();
}

// ── Public fallback generators ──────────────────────────────────
export function fallbackBrief(keyword: string, lang: Language): ContentBrief {
  const kw = keyword.trim();
  const secondary =
    lang === 'en'
      ? [`what is ${kw}`, `${kw} guide`, `${kw} tips`, `${kw} for beginners`]
      : [`${kw} là gì`, `cách ${kw}`, `${kw} hiệu quả`, `lợi ích ${kw}`];
  return {
    targetKeyword: kw,
    secondaryKeywords: secondary,
    searchIntent: 'informational',
    suggestedTitle: makeTitle(kw, lang),
    suggestedMeta: makeMeta(kw, lang),
    outline: makeOutline(kw, lang),
    targetWordCount: 1200,
  };
}

export function fallbackGenerate(keyword: string, lang: Language): GenerateResult {
  const kw = keyword.trim();
  return {
    title: makeTitle(kw, lang),
    metaDescription: makeMeta(kw, lang),
    slug: slugify(kw),
    contentHtml: lang === 'en' ? bodyEn(kw) : bodyVi(kw),
  };
}

export function fallbackVoiceProfile(
  sourceUrl: string | undefined,
  lang: Language,
): BrandVoiceProfile {
  const en = lang === 'en';
  return {
    id: uid('voice'),
    name: en ? 'Sample brand voice (demo)' : 'Văn thương hiệu mẫu (demo)',
    sourceUrl,
    tone: en
      ? ['friendly', 'expert', 'clear']
      : ['thân thiện', 'chuyên gia', 'rõ ràng'],
    formality: 'neutral',
    person: 'second',
    avgSentenceLength: 'medium',
    vocabulary: 'mixed',
    usesQuestions: true,
    usesExamples: true,
    signaturePhrases: en
      ? ['put simply', 'the key is', "let's start with"]
      : ['nói một cách dễ hiểu', 'điều quan trọng là', 'hãy bắt đầu từ'],
    dos: en
      ? ['Use concrete examples', 'Explain jargon', 'Keep sentences short and readable']
      : ['Dùng ví dụ cụ thể', 'Giải thích thuật ngữ', 'Câu ngắn, dễ đọc'],
    donts: en
      ? ['Avoid empty buzzwords', 'No keyword stuffing', 'No hard-to-follow jargon']
      : ['Tránh sáo rỗng', 'Không nhồi từ khóa', 'Không dùng biệt ngữ khó hiểu'],
    sampleExcerpts: [
      en
        ? 'Put simply, the goal is not to sound clever — it is to be useful. We start with the reader’s real question, answer it directly, then back it up with a concrete example they can act on today.'
        : 'Nói một cách dễ hiểu, mục tiêu không phải là tỏ ra uyên bác mà là thật sự hữu ích. Chúng tôi bắt đầu từ câu hỏi thực tế của người đọc, trả lời thẳng vào trọng tâm, rồi minh họa bằng một ví dụ cụ thể có thể áp dụng ngay.',
    ],
    language: lang,
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
}

export function fallbackInternalLinks(
  others: { id: string; title: string; slug: string; keyword: string }[],
  lang: Language,
): InternalLinkSuggestion[] {
  return others.slice(0, 4).map((o) => ({
    id: uid('lnk'),
    targetArticleId: o.id,
    targetTitle: o.title,
    targetSlug: o.slug,
    anchorText: o.keyword || o.title,
    reason:
      lang === 'en'
        ? `Closely related to this topic — linking to "${o.title}" strengthens the cluster and helps readers go deeper.`
        : `Liên quan chặt chẽ tới chủ đề hiện tại — liên kết tới "${o.title}" giúp củng cố cụm nội dung và dẫn dắt người đọc đi sâu hơn.`,
    accepted: false,
  }));
}

function withRelatedLinks(
  html: string,
  related: { slug: string; title: string }[],
  lang: Language,
): string {
  if (!related.length) return html;
  const items = related
    .map((r) => `<li><a href="/${r.slug}">${r.title}</a></li>`)
    .join('');
  const heading = lang === 'en' ? 'Related articles' : 'Bài viết liên quan';
  return `${html}\n<h2>${heading}</h2>\n<ul>${items}</ul>`;
}

// ── First-run demo seed (a full, cross-linked campaign) ─────────
export function buildDemoSeed(lang: Language): {
  campaigns: Campaign[];
  articles: Article[];
  brandVoices: BrandVoiceProfile[];
} {
  const now = new Date().toISOString();
  const voice = fallbackVoiceProfile(undefined, lang);
  voice.name = lang === 'en' ? 'Roastery house voice (demo)' : 'Văn thương hiệu Roastery (demo)';

  const campaignId = uid('camp');
  const keywords =
    lang === 'en'
      ? ['specialty coffee', 'pour over coffee guide', 'choosing a coffee grinder']
      : ['cà phê specialty', 'cách pha cà phê pour over', 'chọn máy xay cà phê'];

  const base = keywords.map((kw) => {
    const gen = fallbackGenerate(kw, lang);
    return { id: uid('art'), kw, ...gen };
  });

  const statuses: ArticleStatus[] = ['published', 'ready', 'draft'];
  const articles: Article[] = base.map((a, i) => {
    const related = base
      .filter((_, j) => j !== i)
      .map((r) => ({ id: r.id, slug: r.slug, title: r.title, keyword: r.kw }));
    const html = withRelatedLinks(a.contentHtml, related, lang);
    const links = fallbackInternalLinks(related, lang).map((l) => ({
      ...l,
      accepted: true,
    }));
    const status = statuses[i] ?? 'draft';
    return {
      id: a.id,
      campaignId,
      status,
      brief: fallbackBrief(a.kw, lang),
      title: a.title,
      slug: a.slug,
      metaDescription: a.metaDescription,
      contentHtml: html,
      targetKeyword: a.kw,
      seoScore: analyzeSeo(html, a.kw, a.title, a.metaDescription, lang),
      internalLinks: links,
      wordpressPostId: status === 'published' ? 100 + i : undefined,
      wordpressUrl:
        status === 'published'
          ? `https://demo.wordpress.test/?p=demo-${100 + i}`
          : undefined,
      language: lang,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    };
  });

  const campaign: Campaign = {
    id: campaignId,
    name: lang === 'en' ? 'Content cluster: Specialty coffee' : 'Cụm nội dung: Cà phê đặc sản',
    brandVoiceId: voice.id,
    language: lang,
    articleIds: articles.map((a) => a.id),
    createdAt: now,
  };

  return { campaigns: [campaign], articles, brandVoices: [voice] };
}
