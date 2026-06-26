# GoMax SEO Studio — Design Doc

*(1–2 trang: vấn đề → insight → giải pháp → quyết định thiết kế → đánh đổi)*

## 1. Vấn đề
Quy trình sản xuất nội dung SEO hiện **bị phân mảnh**: nghiên cứu từ khóa một nơi (Ahrefs/Semrush), viết một nơi (Docs/Jasper), tối ưu on-page một nơi (Surfer/Frase), rồi **copy‑paste thủ công** lên WordPress. Với agency/marketer chạy nhiều bài/tháng, ma sát nằm ở chuyển ngữ cảnh và thao tác lặp — không phải ở việc "viết được một bài".

## 2. Insight
- Giá trị lớn nhất không phải "AI viết bài" (ai cũng làm được) mà là **gộp cả pipeline** brief → draft → tối ưu → đăng, và làm được ở **quy mô (bulk)**.
- Hai nỗi đau thật mà công cụ chung chung bỏ quên: (1) bài AI **"nặc mùi AI"**, lệch giọng thương hiệu; (2) **internal linking** để xây cluster là việc thủ công, tốn thời gian, dễ bỏ sót.
- Người chấm/người thử **không có sẵn WordPress hay API key** → nếu demo đòi cấu hình, trải nghiệm đầu tiên đã hỏng.

## 3. Giải pháp
Một SaaS một luồng lõi cực mượt: **gõ 1 từ khóa → ~30s có bài chuẩn SEO + điểm SEO realtime → 1 click đăng/lên lịch WordPress** (3 thao tác). Cộng hai tính năng khác biệt bám đúng insight:
- **Brand Voice Blueprint** — phân tích bài mẫu (URL/dán text) thành hồ sơ giọng văn, rồi **inject few‑shot** vào prompt sinh bài → hết "mùi AI".
- **Internal Link Suggestion** — AI gợi ý liên kết **chéo** giữa các bài trong campaign, accept/reject ngay trong editor.

## 4. Quyết định thiết kế (và vì sao)

| Quyết định | Lý do |
|---|---|
| **Sandbox‑first (2 lớp)** — mặc định không cần key/WP | "Dùng được ngay" là tiêu chí. Không key → fallback **keyword‑adaptive** chất lượng cao (bài mẫu đạt **95/100** điểm SEO); publish mô phỏng trả URL giả. Có key/WP thật → tự nâng cấp. |
| **Mọi lời gọi AI/WP qua API route server‑side** | Bảo mật key (không lộ client) + tránh CORS khi gọi WP REST từ trình duyệt. Mọi lỗi AI → rơi fallback, **không vỡ UI**. |
| **localStorage thay vì DB** (Zustand persist) | Zero‑backend → deploy tức thì, miễn phí. Đủ cho phạm vi demo. |
| **Dark SaaS, một accent gold tiết chế** | Chống "mùi web AI": **không** gradient tím‑xanh generic; neutral grays nhiều bậc + 1 accent ấm khác biệt; font hiển thị (Plus Jakarta) + UI (Geist) + **mono cho mọi số liệu** (điểm/mật độ/đếm). Tham chiếu Linear/Vercel/Stripe. |
| **Điểm SEO = "gợi ý tối ưu", không hứa ranking** | Trung thực: đây là heuristics on‑page (Yoast‑style), không phải yếu tố xếp hạng Google. Tránh tuyên bố sai về SEO hiện đại. |
| **PipelineBoard kéo‑thả** | Trả lời trực tiếp tiêu chí "tối ưu quy trình/năng suất" — thấy & điều khiển trạng thái cả batch. |

## 5. Đánh đổi
- **localStorage**: mất dữ liệu khi xóa cache, không đa thiết bị → hướng nâng cấp: Supabase/Postgres.
- **Sandbox‑first**: đổi "thật 100%" lấy "luôn demo được" — đúng ưu tiên đề bài.
- **Internal link bằng LLM** (không embeddings): đủ tốt ở quy mô demo; quy mô lớn → dùng embeddings + cosine để lọc top‑k trước khi gọi LLM.
- **AI có thể sai sự thật**: luôn có bước người dùng review trong Editor; không auto‑publish khi chưa xác nhận.
- **Chống over‑engineering**: không dựng auth/queue/multi‑site cho demo — dồn sức cho **một luồng lõi thật mượt**.

## 6. Ánh xạ tiêu chí chấm điểm

| Tiêu chí | Thể hiện ở |
|---|---|
| Tư duy sản phẩm | Mục 1–3 (insight pipeline phân mảnh, 2 wow features) |
| UX đơn giản/trực quan | Core flow 3 thao tác; empty/loading/error/success state khắp nơi |
| KHÔNG giống web AI | Design system §4 + Brand Voice (output đúng giọng) |
| Thiết kế SaaS hiện đại | Dark theme, accent tiết chế, mono số liệu, micro‑interaction 150–200ms |
| Hiệu quả/năng suất | Bulk flow + PipelineBoard + Internal Link cross‑cluster |
| Triển khai thực tế | WordPress REST thật (Application Password, media, schedule) + sandbox + responsive + Vercel |

## 7. Kiến trúc (tóm tắt)
`app/api/*` (server‑side, fallback‑safe) · `lib/ai` (adapter OpenAI/Anthropic + prompts) · `lib/seo/score` · `lib/wordpress/client` · `lib/store` (Zustand+persist) · `data/fallback` (sandbox keyword‑adaptive) · `components/*` (AppShell, TipTap Editor, SeoScorePanel, InternalLinkChips, PipelineBoard).
