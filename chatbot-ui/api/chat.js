// Vercel Serverless Function: proxy chatbot YouPass.
// Nhận {message, conversation_id, token, user_info} từ widget -> forward sang
// chatbot-1984.youpass.vn/chat/stream -> stream SSE trả ngược về trình duyệt.
// Token lấy theo thứ tự: body.token (người dùng dán trong ⚙ Cài đặt) -> env YOUPASS_TOKEN.

const https = require('https');
const crypto = require('crypto');

const UPSTREAM = 'https://chatbot-1984.youpass.vn/chat/stream';

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    let input;
    try {
      input = JSON.parse(body || '{}');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request: ' + e.message }));
      return;
    }

    const token = input.token || process.env.YOUPASS_TOKEN;
    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Thiếu access token. Mở ⚙ Cài đặt trong widget để dán token.' }));
      return;
    }

    const userInfo = input.user_info && input.user_info.fullname
      ? input.user_info
      : {
          id: process.env.YOUPASS_USER_ID || '',
          email: process.env.YOUPASS_EMAIL || '',
          fullname: process.env.YOUPASS_FULLNAME || '',
          role: {
            id: '49b19b3a-3ccf-49c9-a10b-c767fb0df381',
            name: 'End User',
            icon: 'supervised_user_circle',
            description: '',
            public_id: 'END_USER',
          },
        };

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
};
