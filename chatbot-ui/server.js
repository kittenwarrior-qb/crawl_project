// Proxy server cho chatbot YouPass.
// Trình duyệt KHÔNG gọi thẳng được chatbot-1984.youpass.vn (chặn CORS) và
// ta cũng không muốn lộ token ra frontend. Server này đứng giữa: nhận request
// từ giao diện -> gắn token (lấy từ config.json) -> stream SSE trả ngược về.

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const UPSTREAM = 'https://chatbot-1984.youpass.vn/chat/stream';

function loadConfig() {
  // Đọc lại mỗi request -> sửa token trong config.json là có hiệu lực ngay,
  // không cần restart server.
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
}

// ---- Phục vụ file tĩnh trong /public ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
function serveStatic(req, res) {
  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const full = path.join(__dirname, 'public', path.normalize(file));
  if (!full.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403).end(); return; }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---- API chat: nhận {message, conversation_id, lesson_context} từ UI ----
function handleChat(req, res) {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    let cfg, input;
    try {
      cfg = loadConfig();
      input = JSON.parse(body || '{}');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request: ' + e.message }));
      return;
    }

    // token/user_info ưu tiên lấy từ request của widget (ô ⚙ Cài đặt lưu localStorage),
    // nếu widget không gửi (form cũ) thì rơi về config.json.
    const token = input.token || cfg.token;
    const userInfo = input.user_info && input.user_info.fullname ? input.user_info : cfg.user_info;

    // Dựng payload đúng như curl gốc yêu cầu.
    const payload = JSON.stringify({
      email: '',
      message: input.message || '',
      conversation_id: input.conversation_id || crypto.randomUUID(),
      lesson_context: input.lesson_context || { url: '', content_text: '' },
      user_info: userInfo,
      auth_token: token,
    });

    const u = new URL(UPSTREAM);
    const upstream = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: '*/*',
          origin: 'https://e-learning.youpass.vn',
          referer: 'https://e-learning.youpass.vn/',
          'x-youpass-token': token,
          cookie: 'auth_token=' + token,
          'content-length': Buffer.byteLength(payload),
        },
      },
      (up) => {
        // Stream thẳng SSE từ upstream về cho trình duyệt.
        res.writeHead(up.statusCode, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        up.pipe(res);
      }
    );
    upstream.on('error', (e) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upstream error: ' + e.message }));
    });
    upstream.write(payload);
    upstream.end();
  });
}

http
  .createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/chat') return handleChat(req, res);
    return serveStatic(req, res);
  })
  .listen(PORT, () => {
    console.log(`\n  Chatbot UI chạy tại:  http://localhost:${PORT}\n`);
  });
