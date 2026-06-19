// ====== TEST RATE LIMIT - endpoint comments (app deploy của bạn) ======
const BASE_URL = "https://nhaitienganh.vercel.app/api/v1/student/comments";

const TARGET_TYPE = "BLOG";
const TARGET_ID = "d7157e76-c8d4-490c-8622-cb4a2061813c";

const TOTAL_MESSAGES = 100000000;   // tổng số request muốn bắn (chế độ spam)
const CONCURRENCY = 30;        // số luồng song song
const DELAY_MS = 0;           // giãn cách giữa các request trong 1 luồng

// ====== CHẾ ĐỘ TEST ======
// "spam"  : bắn TOTAL_MESSAGES request ngắn (test rate limit)
// "long"  : bắn vài request với content dài CONTENT_LENGTH ký tự
// "probe" : tăng dần độ dài để dò ngưỡng server chặn (400/413/500)
const MODE = "spam";
const CONTENT_LENGTH = 2000;  // dùng cho MODE = "long" (giới hạn mặc định 2k)
// Dò sát quanh mốc 2000 để tìm điểm cắt chính xác
const PROBE_SIZES = [1_999, 2_000, 2_001, 2_048, 2_500, 3_000, 5_000, 10_000];

const COOKIE = 'role=ADMIN; nta_csrf=BZYVZkrxQuxZ2qDhOiy4T4I8pAdpDJzSagt9sa9C468; role=STUDENT; nta_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJ1aWRpbmhxdW9jMjAwNUBnbWFpbC5jb20iLCJzdWIiOiIyOWYzMzk1Yi0xODdmLTRjMDktOTRhZS1hYTIzZDU3ZWM4NTMiLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTc4MTI1NTMxNCwiZXhwIjoxNzgxMjU2NzU0fQ.2HfDekYxQ1hTwzXItUgBOopwa0H7QG7LodwBqC7RJRM; nta_refresh=cb6f7bf633cde855c7c5d1e79fcf7d8e633180f4f2fa7385f2b896fc42ecec7d';
const CSRF_TOKEN = 'BZYVZkrxQuxZ2qDhOiy4T4I8pAdpDJzSagt9sa9C468';

const getHeaders = () => ({
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://nhaitienganh.vercel.app',
    'referer': 'https://nhaitienganh.vercel.app/blog/5-bi-quyet-hoc-tieng-anh-hieu-qua-moi-ngay-cho-hoc-sinh-thpt',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    'Cookie': COOKIE,
    'x-csrf-token': CSRF_TOKEN,
});

const stats = { ok: 0, rateLimited: 0, error: 0 };

// Gửi 1 comment với content tuỳ ý. Trả về status để probe dùng.
async function postComment(content, label) {
    const body = { targetType: TARGET_TYPE, targetId: TARGET_ID, content };
    const t0 = Date.now();
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });
    const ms = Date.now() - t0;
    let info = res.statusText;
    if (!res.ok) { try { info = JSON.stringify(await res.json()); } catch {} }
    console.log(`[${res.status}] ${label} (len=${content.length}, ${ms}ms) ${res.ok ? '' : '→ ' + info}`);
    return res.status;
}

// Dò ngưỡng độ dài content mà server chấp nhận
async function probeContentLength() {
    console.log("=== PROBE: dò giới hạn độ dài content ===\n");
    let lastOk = 0, firstReject = null;
    for (const size of PROBE_SIZES) {
        const content = 'A'.repeat(size);
        let status;
        try {
            status = await postComment(content, `probe ${size.toLocaleString()} ký tự`);
        } catch (e) {
            console.error(`[X] size ${size}: lỗi kết nối ${e.message} (có thể body quá lớn bị reset)`);
            firstReject = firstReject ?? size;
            break;
        }
        if (status >= 200 && status < 300) lastOk = size;
        else if (firstReject === null) firstReject = size;
        await new Promise(r => setTimeout(r, 300));
    }
    console.log("\n=== KẾT QUẢ PROBE ===");
    console.log(`Độ dài LỚN NHẤT được chấp nhận: ${lastOk.toLocaleString()} ký tự`);
    console.log(firstReject
        ? `Bắt đầu bị từ chối/lỗi từ: ${firstReject.toLocaleString()} ký tự`
        : `⚠️  KHÔNG có giới hạn trong dải test — server nhận content cực dài, THIẾU validate độ dài!`);
}

// content đủ CONTENT_LENGTH ký tự, có prefix định danh rồi nhồi 'A' cho đủ
function makeContent(id) {
    const prefix = `spam #${id} ${Date.now()} `;
    return (prefix + 'A'.repeat(CONTENT_LENGTH)).slice(0, CONTENT_LENGTH);
}

async function sendComment(id) {
    try {
        // body PHẲNG, đúng như curl chạy được — không bọc thêm { content: ... }
        const body = {
            targetType: TARGET_TYPE,
            targetId: TARGET_ID,
            content: makeContent(id)
        };

        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (res.status === 429) {
            stats.rateLimited++;
            const retry = res.headers.get('retry-after');
            console.log(`[429] Req ${id} bị Rate Limit${retry ? ` (retry-after: ${retry}s)` : ''}`);
        } else if (res.ok) {
            stats.ok++;
            console.log(`[✓] Req ${id}: ${res.status}`);
        } else {
            stats.error++;
            let msg;
            try { msg = JSON.stringify(await res.json()); } catch { msg = res.statusText; }
            console.error(`[!] Req ${id} status ${res.status}: ${msg}`);
        }
    } catch (e) {
        stats.error++;
        console.error(`[X] Req ${id} lỗi kết nối: ${e.message}`);
    }
}

async function runSpam() {
    console.log("=== TEST RATE LIMIT /comments ===");
    console.log(`Target: ${BASE_URL} | Total: ${TOTAL_MESSAGES} | Concurrency: ${CONCURRENCY}\n`);

    let next = 1;
    const workers = Array.from({ length: CONCURRENCY }, () => (async () => {
        while (next <= TOTAL_MESSAGES) {
            const id = next++;
            await sendComment(id);
            if (DELAY_MS) await new Promise(r => setTimeout(r, DELAY_MS));
        }
    })());
    await Promise.all(workers);

    console.log("\n=== KẾT QUẢ ===");
    console.log(`Thành công (2xx): ${stats.ok}`);
    console.log(`Bị Rate Limit (429): ${stats.rateLimited}`);
    console.log(`Lỗi khác: ${stats.error}`);
    console.log(stats.rateLimited > 0
        ? "✅ Có rate limit hoạt động."
        : "⚠️  KHÔNG thấy 429 — endpoint có thể CHƯA có rate limit.");
}

async function runLong() {
    console.log(`=== TEST CONTENT DÀI: ${CONTENT_LENGTH.toLocaleString()} ký tự ===\n`);
    for (let i = 1; i <= 3; i++) {
        try { await postComment('A'.repeat(CONTENT_LENGTH), `long #${i}`); }
        catch (e) { console.error(`[X] long #${i}: ${e.message}`); }
        await new Promise(r => setTimeout(r, 300));
    }
}

async function start() {
    if (MODE === "probe") return probeContentLength();
    if (MODE === "long") return runLong();
    return runSpam();
}

start();
