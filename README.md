# crawl_project

Bộ script crawl + giao diện chatbot gọi AI của YouPass (IELTS 1984).

## Chatbot UI (`chatbot-ui/`) — widget "Anh Giáo Đậu"

Widget chat nổi (giống Claude mobile khi mở fullscreen), gọi API `chat/stream` của YouPass
qua một proxy (tránh CORS, không lộ token ra ngoài cần thiết).

### Chạy local
```bash
cd chatbot-ui
cp config.example.json config.json   # rồi dán token thật vào config.json (tuỳ chọn, có thể nhập trong UI)
node server.js
```
Mở http://localhost:3000

### Deploy lên Vercel
```bash
cd chatbot-ui
vercel        # lần đầu sẽ hỏi link project, chọn "y" để tạo mới
vercel --prod
```
Hoặc import repo trên vercel.com/new, chọn **Root Directory = `chatbot-ui`**.

`chatbot-ui/api/chat.js` là Serverless Function thay cho `server.js` khi chạy trên Vercel
(`server.js` chỉ dùng để chạy local).

### Nhập access token
Mở web đã deploy → bấm nút **⚙** trong widget → dán:
- **Access token** (`x-youpass-token`) — lấy theo hướng dẫn dưới
- Họ tên / email / user ID (tuỳ chọn, giúp bot chào đúng tên)

Bấm **Lưu** — token được lưu trong `localStorage` của trình duyệt, không gửi đi đâu khác
ngoài chính server proxy của bạn.

**Tự lấy token (không cần nhập tay):** set biến môi trường trên Vercel
(Project → Settings → Environment Variables):
- `YOUPASS_TOKEN` — bắt buộc nếu muốn auto, dán `x-youpass-token`
- `YOUPASS_USER_ID`, `YOUPASS_EMAIL`, `YOUPASS_FULLNAME` — tuỳ chọn

Khi đã set `YOUPASS_TOKEN`, widget hoạt động ngay không cần ai mở ⚙ nhập gì cả.

### Lấy token thủ công
Vào e-learning.youpass.vn → F12 → tab Network → chat 1 câu → tìm request `chat/stream`
→ copy header `x-youpass-token`. Token hết hạn sau ~3 ngày, hết hạn thì lấy lại và dán lại
vào ⚙ Cài đặt (hoặc cập nhật env var trên Vercel rồi redeploy).

> ⚠️ `config.json` và `youpass.txt` chứa token cá nhân — đã được `.gitignore`, không đẩy lên repo.
> Token nhập trong UI chỉ lưu ở `localStorage` máy của người dùng, không commit vào repo.
