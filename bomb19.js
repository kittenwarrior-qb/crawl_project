const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ====== TEST RATE LIMIT UPLOAD AVATAR (app deploy của bạn) ======
const TARGET_URL = "https://nhaitienganh.vercel.app/api/v1/student/profile/avatar";

const COOKIE = 'role=ADMIN; nta_csrf=BZYVZkrxQuxZ2qDhOiy4T4I8pAdpDJzSagt9sa9C468; role=STUDENT; nta_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJ1aWRpbmhxdW9jMjAwNUBnbWFpbC5jb20iLCJzdWIiOiIyOWYzMzk1Yi0xODdmLTRjMDktOTRhZS1hYTIzZDU3ZWM4NTMiLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTc4MTI1NTMxNCwiZXhwIjoxNzgxMjU2NzU0fQ.2HfDekYxQ1hTwzXItUgBOopwa0H7QG7LodwBqC7RJRM; nta_refresh=cb6f7bf633cde855c7c5d1e79fcf7d8e633180f4f2fa7385f2b896fc42ecec7d';
const CSRF_TOKEN = 'BZYVZkrxQuxZ2qDhOiy4T4I8pAdpDJzSagt9sa9C468';

const TOTAL = 500;          // tổng số request muốn bắn
const CONCURRENCY = 20;     // số luồng song song
const DELAY_MS = 20;        // giãn cách giữa các request trong 1 luồng

// Chỉ spam DUY NHẤT 1 ảnh này
const IMAGE_FILE = "Tớ là hacker nek_1mb.png";
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp' };

const imgPath = path.join(__dirname, IMAGE_FILE);
if (!fs.existsSync(imgPath)) {
    console.error("❌ Không tìm thấy file:", imgPath);
    process.exit(1);
}
const image = {
    name: IMAGE_FILE,
    buf: fs.readFileSync(imgPath),
    mime: MIME[path.extname(IMAGE_FILE).toLowerCase()] || 'application/octet-stream',
};
image.size = image.buf.length;

console.log(`📂 Ảnh dùng để spam: ${image.name} (${(image.size / 1024 / 1024).toFixed(2)} MB)`);

const getHeaders = (form) => ({
    ...form.getHeaders(),
    'accept': '*/*',
    'origin': 'https://nhaitienganh.vercel.app',
    'referer': 'https://nhaitienganh.vercel.app/profile',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    'Cookie': COOKIE,
    'x-csrf-token': CSRF_TOKEN,
});

const stats = { ok: 0, rateLimited: 0, tooLarge: 0, error: 0 };

async function uploadOnce(id) {
    const img = image; // luôn dùng đúng 1 ảnh
    try {
        const form = new FormData();
        form.append('file', img.buf, { filename: img.name, contentType: img.mime });

        const res = await axios.post(TARGET_URL, form, {
            headers: getHeaders(form),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 30000,
            validateStatus: () => true, // không throw, tự xử lý theo status
        });

        if (res.status === 429) {
            stats.rateLimited++;
            const retry = res.headers['retry-after'];
            console.log(`[429] Req ${id} Rate Limit${retry ? ` (retry-after: ${retry}s)` : ''}`);
        } else if (res.status === 413) {
            stats.tooLarge++;
            console.log(`[413] Req ${id} Payload Too Large (${img.name})`);
        } else if (res.status >= 200 && res.status < 300) {
            stats.ok++;
            console.log(`[✓] Req ${id}: ${res.status} (${img.name}, ${(img.size/1024).toFixed(0)}KB)`);
        } else {
            stats.error++;
            console.log(`[!] Req ${id}: ${res.status} → ${JSON.stringify(res.data).slice(0, 200)}`);
        }
    } catch (e) {
        stats.error++;
        console.error(`[X] Req ${id} lỗi: ${e.code || e.message}`);
    }
}

async function start() {
    console.log(`\n🚀 TEST RATE LIMIT UPLOAD: ${TARGET_URL}`);
    console.log(`Total: ${TOTAL} | Concurrency: ${CONCURRENCY}\n`);

    let next = 1;
    const workers = Array.from({ length: CONCURRENCY }, () => (async () => {
        while (next <= TOTAL) {
            const id = next++;
            await uploadOnce(id);
            if (DELAY_MS) await new Promise(r => setTimeout(r, DELAY_MS));
        }
    })());
    await Promise.all(workers);

    console.log("\n=== KẾT QUẢ ===");
    console.log(`Thành công (2xx): ${stats.ok}`);
    console.log(`Rate Limit (429): ${stats.rateLimited}`);
    console.log(`Quá lớn (413):    ${stats.tooLarge}`);
    console.log(`Lỗi khác:         ${stats.error}`);
    console.log(stats.rateLimited > 0
        ? "✅ Endpoint upload CÓ rate limit."
        : "⚠️  KHÔNG thấy 429 — upload avatar CHƯA có rate limit (spam upload thoải mái).");
}

start();
