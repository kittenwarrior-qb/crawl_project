const crypto = require('crypto');
const BASE_URL = "https://luyentu.com";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU5NDE5LCJlbWFpbCI6ImtpdHRlbndhcnJpb3IyMDA1QGdtYWlsLmNvbSIsImlhdCI6MTc3NTgxMTYzMiwiZXhwIjoxNzc1ODEyNTMyfQ.nwTdkljFg5qzd2JDOLjYjzDavQ2j_-wM4-_uNlWhYNU";
const NEW_SET_ID = "de139392-1aab-4111-a4dd-3fe65669d97d"; 

function generateAppToken() {
    return `${Date.now()}.${crypto.createHmac('sha256', "luyentu-anti-scrape-2026").update(Date.now().toString()).digest('hex').substring(0, 16)}`;
}

async function start() {
    console.log("🎯 Khởi động lại chiến dịch...");

    try {
        // 1. Lấy ID - Thêm timeout 10s để không bị treo
        const res = await fetch(`${BASE_URL}/word-sets/${NEW_SET_ID}/vocabularies`, {
            headers: { 'Authorization': AUTH_TOKEN, 'X-App-Token': generateAppToken() },
            signal: AbortSignal.timeout(10000) 
        });

        if (!res.ok) throw new Error(`Server trả về lỗi: ${res.status}`);
        
        const vocabList = await res.json();
        const items = vocabList.data || vocabList;
        const realIds = Array.isArray(items) ? items.map(v => v.id) : [];

        if (realIds.length === 0) {
            console.log("❌ Không tìm thấy ID nào trong bộ này.");
            return;
        }

        console.log(`✅ Đã tìm thấy ${realIds.length} ID mới. Đang nạp Progress...`);

        // 2. Nạp Progress (Gốc rễ của điểm số)
        const progressRes = await fetch(`${BASE_URL}/vocabularies/progress/bulk`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_TOKEN,
                'X-App-Token': generateAppToken()
            },
            body: JSON.stringify({ "vocabularyIds": realIds, "isLearned": true })
        });

        const progressData = await progressRes.json();
        console.log(`📊 Server báo: ${progressData.message || "Đã xử lý xong"}`);

        // 3. Bơm Log (Kích hoạt Leaderboard)
        console.log("🔥 Đang kích hoạt điểm số...");
        for (let i = 0; i < realIds.length; i++) {
            const logRes = await fetch(`${BASE_URL}/activity/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTH_TOKEN,
                    'X-App-Token': generateAppToken()
                },
                body: JSON.stringify({
                    "incrementCount": true,
                    "vocabularyId": realIds[i],
                    "type": "LEARNED_WORD",
                    "nonce": Math.random().toString(36)
                })
            });

            if (logRes.status === 201) {
                process.stdout.write(`\rTiến độ: ${i + 1}/${realIds.length}`);
            }
            // Delay 250ms để không bị "treo" request
            await new Promise(r => setTimeout(r, 250));
        }

        console.log("\n\n🏆 Nhiệm vụ hoàn tất! F5 ngay đi bạn.");

    } catch (err) {
        console.error("\n❌ LỖI RỒI:", err.message);
        console.log("Gợi ý: Kiểm tra lại mạng hoặc Token có thể đã hết hạn (401).");
    }
}

start();