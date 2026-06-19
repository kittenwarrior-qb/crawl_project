const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const fs = require('fs');

const TARGET_CONFIG = {
    url: "https://docln.net/action/upload/book",
    token: "lqcSbggCihqjlAi3jofjpvPJqwqw9pXGjfc9QnJX",
    bookId: "38609",
    cookie: "dom3ic8zudi28v8lr6fgphwffqoz0j6c=8c5beb86-4706-419b-922d-385cdea487a3%3A1%3A1; ln_session=eyJpdiI6IjV2cStzMzY5Ylg3WjFLeExHRDMvUlE9PSIsInZhbHVlIjoid0ZxNmJLVWRKbENHekc2UlhCRWVsVGFpUVJ1UzNMT09IejBablFTMzBrV2FpUFNqN0VKa09sZVZHT0dDVHFoZk5WcDVvY3J4clo4ZmJGaXd5cWx4ZFVXcHZHUVZ4bmFXekNwZGwxdm90NDI3T0RoOW5SY3lGOGdOUlU4VkgwbFYiLCJtYWMiOiIzNmVlNzIwZWIxZmRlNjJmZDk1MzgwNmZlZjI2Nzk3YmRlOGI2MzhkYmM5OWVkOTg2ZDJjZDg3NDlkMjZiYTY0IiwidGFnIjoiIn0%3D;", 
    threadCount: 8, 
    localImagePath: "Tớ là hacker nek.png", 
    delayBetweenRequests: 500 
};

if (isMainThread) {
    if (!fs.existsSync(TARGET_CONFIG.localImagePath)) {
        console.error(`❌ Không tìm thấy file: ${TARGET_CONFIG.localImagePath}`);
        process.exit(1);
    }

    let stats = { count: 0, errors: 0 };
    let startTime = Date.now();
    let logs = new Array(TARGET_CONFIG.threadCount).fill("Starting...");

    for (let i = 0; i < TARGET_CONFIG.threadCount; i++) {
        const worker = new Worker(__filename, { workerData: i });
        worker.on('message', (msg) => {
            if (msg.type === 'success') stats.count++;
            if (msg.type === 'error') stats.errors++;
            logs[i] = msg.status;
        });
    }

    setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\x1Bc'); 
        console.log(`================================================================`);
        console.log(`🚀 DOCLN RATE LIMIT TESTER - MULTIPART MODE`);
        console.log(`================================================================`);
        console.log(`⏱️  Uptime: ${elapsed.toFixed(0)}s | ✅ Success: ${stats.count} | ❌ Fail: ${stats.errors}`);
        console.log(`----------------------------------------------------------------`);
        logs.forEach((l, idx) => console.log(` [Thread ${idx}] ${l}`));
        console.log(`================================================================`);
    }, 500);

} else {
    const testRateLimit = async () => {
        const imageBuffer = fs.readFileSync(TARGET_CONFIG.localImagePath);
        const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

        const headers = {
            "accept": "*/*",
            "content-type": `multipart/form-data; boundary=${boundary}`,
            "cookie": TARGET_CONFIG.cookie,
            "origin": "https://docln.net",
            "referer": "https://docln.net/action/series/25938/manage",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
            "x-requested-with": "XMLHttpRequest"
        };

        const bodyPayload = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="cover"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
            imageBuffer,
            Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="_token"\r\n\r\n${TARGET_CONFIG.token}\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="book_id"\r\n\r\n${TARGET_CONFIG.bookId}\r\n--${boundary}--\r\n`)
        ]);

        while (true) {
            try {
                const response = await fetch(TARGET_CONFIG.url, {
                    method: "POST",
                    headers: headers,
                    body: bodyPayload
                });

                const result = await response.json();

                if (result.status === "success") {
                    // Lấy 20 ký tự cuối của URL để log cho gọn
                    const shortUrl = result.url.split('/').pop();
                    parentPort.postMessage({ 
                        type: 'success', 
                        status: `✅ Success: ...${shortUrl}` 
                    });
                } else {
                    parentPort.postMessage({ 
                        type: 'error', 
                        status: `❌ Server Refused: ${JSON.stringify(result)}` 
                    });
                }
            } catch (e) {
                parentPort.postMessage({ type: 'error', status: `💀 Network Error/Rate Limit` });
            }
            
            await new Promise(r => setTimeout(r, TARGET_CONFIG.delayBetweenRequests));
        }
    };
    testRateLimit();
}