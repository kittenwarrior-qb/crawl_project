const crypto = require('crypto');

// --- CẤU HÌNH TOKEN VÀ INFO (Thay bằng thông tin mới nhất của bạn) ---
const BASE_URL = "https://luyentu.com";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU0NjMzLCJlbWFpbCI6ImJ1aWRpbmhxdW9jMjAwNUBnbWFpbC5jb20iLCJpYXQiOjE3NzYwNjI5MTMsImV4cCI6MTc3NjA2MzgxM30.ZRFOooRMseCu9Rl0kSw9CK0ly7NUvf_9Ub2QAEQR2mk";

// Danh sách các Path ID bạn muốn xử lý
const TARGET_PATHS = [
    "4c21b5e7-61f4-4fa1-9dba-ad11b6fb4fb9",
];

// Cấu hình song song (Concurrency)
const MAX_CONCURRENT = 5; // Số lượng bộ từ vựng xử lý cùng lúc

function generateAppToken() {
    const ts = Date.now().toString();
    const hash = crypto.createHmac('sha256', "luyentu-anti-scrape-2026").update(ts).digest('hex').substring(0, 16);
    return `${ts}.${hash}`;
}

const commonHeaders = () => ({
    'accept': 'application/json, text/plain, */*',
    'authorization': AUTH_TOKEN,
    'content-type': 'application/json',
    'origin': 'https://luyentu.com',
    'referer': 'https://luyentu.com/home',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
    'x-app-token': generateAppToken()
});

async function processWordSet(pathId, set) {
    try {
        // 1. Lấy danh sách Vocabulary IDs trong bộ
        const vocabRes = await fetch(`${BASE_URL}/word-sets/${set.id}/vocabularies`, {
            headers: commonHeaders()
        });
        const vocabs = await vocabRes.json();
        const ids = (vocabs.data || vocabs).map(v => v.id);

        if (ids.length > 0) {
            // 2. Bắn Bulk Progress
            const bulkPromise = fetch(`${BASE_URL}/paths/${pathId}/progress/bulk`, {
                method: 'POST',
                headers: commonHeaders(),
                body: JSON.stringify({ "vocabularyIds": ids, "isLearned": true })
            });

            // 3. Bắn POST Study
            const studyPromise = fetch(`${BASE_URL}/word-sets/${set.id}/study`, {
                method: 'POST',
                headers: commonHeaders()
            });

            const [resBulk, resStudy] = await Promise.all([bulkPromise, studyPromise]);

            if (resBulk.ok && resStudy.ok) {
                console.log(`✅ Hoàn thành bộ: [${set.name || set.id}] - (${ids.length} từ)`);
            } else {
                console.log(`❌ Lỗi tại bộ: [${set.name || set.id}] - Bulk: ${resBulk.status}, Study: ${resStudy.status}`);
            }
        }
    } catch (e) {
        console.error(`⚠️ Lỗi xử lý bộ ${set.id}:`, e.message);
    }
}

async function runFastBulk() {
    console.log("🚀 Bắt đầu chiến dịch Bulk & Study siêu tốc...");

    for (const pathId of TARGET_PATHS) {
        console.log(`\n📍 Đang quét Path: ${pathId}`);
        try {
            const pathRes = await fetch(`${BASE_URL}/paths/${pathId}`, {
                headers: commonHeaders()
            });
            const pathData = await pathRes.json();
            const wordSets = pathData.data?.wordSets || pathData.wordSets || [];

            console.log(`📦 Tìm thấy ${wordSets.length} bộ từ vựng. Đang xử lý...`);

            // Chia nhỏ danh sách WordSets để bắn song song theo nhóm (Chunking)
            for (let i = 0; i < wordSets.length; i += MAX_CONCURRENT) {
                const chunk = wordSets.slice(i, i + MAX_CONCURRENT);
                await Promise.all(chunk.map(set => processWordSet(pathId, set)));
                // Nghỉ cực ngắn giữa các đợt bắn để tránh bị server drop
                await new Promise(r => setTimeout(r, 200));
            }
        } catch (err) {
            console.error(`❌ Lỗi tại Path ${pathId}:`, err.message);
        }
    }
    console.log("\n🏆 TẤT CẢ HOÀN TẤT!");
}

runFastBulk();