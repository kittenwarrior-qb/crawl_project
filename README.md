# crawl_project

Bộ script crawl + giao diện chatbot gọi AI của YouPass (IELTS 1984).

## Chatbot UI (`chatbot-ui/`)

Giao diện chat web gọi API `chat/stream` của YouPass qua một proxy Node (tránh CORS, giấu token).

### Chạy
```bash
cd chatbot-ui
cp config.example.json config.json   # rồi dán token thật vào config.json
node server.js
```
Mở http://localhost:3000

### Lấy token
Vào e-learning.youpass.vn → F12 → tab Network → chat 1 câu → tìm request `chat/stream`
→ copy header `x-youpass-token` → dán vào `config.json`. Token hết hạn sau ~3 ngày.

> ⚠️ `config.json` và `youpass.txt` chứa token cá nhân — đã được `.gitignore`, không đẩy lên repo.
