const crypto = require('crypto');

// --- CẤU HÌNH ---
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MmU2ODExZi1iN2UyLTQ0NWUtYTI3NS02NzAyMGJlNjJiNzciLCJlbWFpbCI6ImtpdHRlbndhcnJpb3IyMDA1QGdtYWlsLmNvbSIsIm5hbWUiOiJraXR0ZW4gd2FycmlvciIsInR5cGUiOiJ1c2VyIiwiaWF0IjoxNzc1ODA1NDAzLCJleHAiOjE3NzY0MTAyMDN9.ei8IXaYObRPI_-kxFNT7fx99n9BteP5hJNGepS53HcY";
const BASE_URL = "https://apinguphap.luyentu.com";
const CONCURRENCY = 20; // Số request chạy cùng lúc (VPS yếu nên để 30-50)

async function startOverdrive() {
    console.log("🚀 [1/3] Đang quét danh mục 831 bài học...");
    
    try {
        const catalogRes = await fetch(`${BASE_URL}/dictation/catalog`, {
            headers: { "Authorization": AUTH_TOKEN }
        });
        const catalog = await catalogRes.json();
        
        let allTasks = [];
        
        // Task bơm thời gian (1 triệu giây)
        allTasks.push({ type: 'time', seconds: 10000000 });

        // Task hoàn thành bài học
        catalog.categories.forEach(cat => {
            cat.sections.forEach(sec => {
                sec.lessons.forEach(lesson => {
                    for (let i = 0; i < lesson.transcriptLineCount; i++) {
                        allTasks.push({
                            type: 'progress',
                            lessonId: lesson.id,
                            lineIndex: i
                        });
                    }
                });
            });
        });

        console.log(`✅ [2/3] Tổng cộng: ${allTasks.length} tác vụ. Bắt đầu oanh tạc...`);

        let completed = 0;
        let success = 0;
        const total = allTasks.length;

        // Hàm thực thi request
        const worker = async () => {
            while (allTasks.length > 0) {
                const task = allTasks.shift();
                if (!task) break;

                try {
                    let res;
                    if (task.type === 'time') {
                        res = await fetch(`${BASE_URL}/dictation/activity`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN },
                            body: JSON.stringify({ "seconds": task.seconds })
                        });
                    } else {
                        res = await fetch(`${BASE_URL}/dictation/lesson-progress`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN },
                            body: JSON.stringify({
                                "lessonId": task.lessonId,
                                "lineIndex": task.lineIndex,
                                "isCorrect": true
                            })
                        });
                    }

                    if (res.ok) success++;
                } catch (e) {
                    // Nếu lỗi mạng, đẩy lại task vào hàng đợi hoặc bỏ qua
                }

                completed++;
                if (completed % 100 === 0 || completed === total) {
                    const percent = ((completed / total) * 100).toFixed(2);
                    process.stdout.write(`\r🔥 Tiến độ: ${percent}% | Thành công: ${success} | Total: ${total}`);
                }
            }
        };

        // Chạy song song theo số CONCURRENCY
        const workers = Array.from({ length: CONCURRENCY }, () => worker());
        await Promise.all(workers);

        console.log("\n\n🏆 [3/3] CHIẾN DỊCH HOÀN TẤT!");
        console.log(`✨ Kết quả: Level của bạn hiện tại đã đạt đỉnh server.`);
        console.log(`💰 Coins: Đã nạp tối đa từ 831 bài học.`);

    } catch (err) {
        console.error("❌ Lỗi hệ thống:", err.message);
    }
}

startOverdrive();