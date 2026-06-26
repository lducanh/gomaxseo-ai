# GoMax SEO Studio

> Từ một từ khóa đến một bài chuẩn SEO đã đăng lên WordPress — trong 3 thao tác.

AI content studio: nhập từ khóa → AI sinh **brief → bài viết chuẩn SEO** → chấm điểm SEO realtime → đăng / lên lịch WordPress. Kèm 2 tính năng khác biệt: **Brand Voice Blueprint** và **Internal Link Suggestion** (xây cluster nội bộ).

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**, deploy 1‑click trên Vercel.

---

## ⭐ Điểm cốt lõi: Sandbox‑first

**Mở lên là chạy full flow — không cần API key, không cần WordPress.**

- Không có key AI → trả về **nội dung mẫu chất lượng cao** bám đúng từ khóa (gắn nhãn *Dữ liệu mẫu*).
- WordPress để **Sandbox mode** (mặc định BẬT) → publish được mô phỏng, trả URL bài giả sau ~800ms.
- Có key AI / có WordPress thật → tự động nâng cấp sang tích hợp thật. Key **chỉ nằm server‑side**, không lộ ra client.

---

## Tính năng

| Nhóm | Chi tiết |
|---|---|
| Core flow | Keyword → Brief (xem trước/skip) → Draft → Editor → Publish |
| SEO score realtime | Chấm điểm 0–100 kiểu Yoast/RankMath, cập nhật khi gõ |
| Brand Voice Blueprint | Phân tích URL/đoạn văn → hồ sơ giọng văn → inject vào prompt sinh bài |
| Internal Link Suggestion | AI gợi ý liên kết chéo giữa các bài trong campaign, accept/reject |
| Bulk + Pipeline | Tạo hàng loạt theo danh sách từ khóa; kanban kéo‑thả theo trạng thái |
| WordPress | REST API + Application Password (Basic Auth), upload featured image, lên lịch |
| Editor | TipTap WYSIWYG, xuất HTML chuẩn đẩy thẳng WP |
| Song ngữ | Toàn bộ UI + nội dung sinh ra hỗ trợ **Tiếng Việt / English** |
| Lưu trữ | **Backend SQLite thật** (better-sqlite3) qua REST API — dữ liệu lưu server-side, không còn dùng localStorage |

---

## Bắt đầu

```bash
npm install
cp .env.example .env.local   # (tùy chọn) — bỏ trống vẫn chạy ở sandbox
npm run dev                  # http://localhost:3000
```

Lần đầu trống dữ liệu? Vào **Settings → Nạp dữ liệu mẫu** (hoặc nút trên Dashboard) để xem ngay một campaign mẫu có internal link + điểm SEO.

### Bật AI thật (tùy chọn)
Đặt **một** trong các key sau vào `.env.local` rồi khởi động lại — app tự phát hiện provider:
- `GEMINI_API_KEY` (Google Gemini — lấy key tại https://aistudio.google.com/apikey), model mặc định `gemini-2.5-flash`, đổi qua `GEMINI_MODEL`.
- `OPENAI_API_KEY` (model qua `OPENAI_MODEL`).
- `ANTHROPIC_API_KEY` (model qua `ANTHROPIC_MODEL`).

Có nhiều key cùng lúc? Đặt `AI_PROVIDER=gemini|openai|anthropic` để chọn. Xác minh tên model hiện hành trong tài liệu provider.

### Kết nối WordPress thật (tùy chọn)
WP Admin → **Users → Profile → Application Passwords** → tạo key (WordPress 5.6+, HTTPS). Nhập Site URL + Username + Application Password trong **Settings**, tắt Sandbox, bấm *Test connection*.

---

## Deploy

Chạy tốt trên mọi host Node.js có **ổ đĩa bền** (VPS, Render, Railway, Fly.io, hoặc máy local) — file `.data/studio.db` được giữ nguyên giữa các lần khởi động. Đặt env vars (nếu bật AI thật) rồi `npm run build && npm run start`.

> ⚠️ **Vercel / serverless:** filesystem là ephemeral/read‑only nên SQLite ghi ra file **không bền** ở môi trường này. Để deploy serverless, đổi sang **Turso/libsql** (vẫn là SQLite nhưng qua mạng) — chỉ cần thay driver trong `lib/server/db.ts`, toàn bộ `repo`/API/store giữ nguyên. Có thể set `SQLITE_PATH` để đổi vị trí file DB.

---

## Kiến trúc

```
app/
  api/
    brief | generate | internal-links | voice/analyze   # AI (fallback-safe)
    wordpress/{test,taxonomies,publish}                 # WordPress REST
    state | campaigns | articles | brand-voices | settings  # CRUD → SQLite
  dashboard | campaigns | campaigns/new | campaigns/[id]
  editor/[articleId] | brand-voice | settings
lib/
  server/{db,repo}      # better-sqlite3: kết nối + schema + data-access layer
  ai/{provider,prompts} # adapter OpenAI/Anthropic/Gemini + prompt templates
  seo/score             # thuật toán chấm điểm on-page
  wordpress/client      # helper REST WP (Basic Auth, media, posts)
  store                 # Zustand (cache) — hydrate + write-through tới REST API
  extract | api | i18n | utils
components/              # AppShell, Editor (TipTap), SeoScorePanel,
                        # InternalLinkChips, PipelineBoard, ui/*
data/fallback           # nội dung sandbox keyword-adaptive
.data/studio.db         # file SQLite (tự tạo lúc chạy, đã gitignore)
types/                  # data model
```

**Lưu trữ:** dữ liệu (campaigns, articles, brand voices, cấu hình WP) được lưu trong **SQLite** ở server qua các REST API CRUD. Store Zustand chỉ là cache phía client: hydrate 1 lần từ `GET /api/state` rồi ghi xuyên suốt (write-through) mỗi thao tác. `campaign.articleIds` là field *dẫn xuất* (server tự tính từ bảng `articles`) nên không bao giờ lệch dữ liệu.

**Nguyên tắc:** mọi lời gọi AI/WordPress đi qua API route server‑side (bảo mật key + tránh CORS). Mọi lỗi AI → rơi về fallback, **không vỡ UI**.

---

## ⚠️ Lưu ý về điểm SEO

Các tiêu chí chấm điểm là **heuristics on‑page** (độ dài title/meta, mật độ từ khóa, cấu trúc H2…), **không phải** yếu tố xếp hạng chính thức của Google. SEO hiện đại ưu tiên **nội dung hữu ích, vì người dùng**. Điểm số ở đây là *gợi ý tối ưu*, không phải cam kết thứ hạng.

---

## Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS 3 · Zustand 5 · TipTap 3 · **better-sqlite3 (SQLite)** · cheerio · lucide-react.
