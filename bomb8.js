const BASE_URL = "https://apinguphap.luyentu.com";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MmU2ODExZi1iN2UyLTQ0NWUtYTI3NS02NzAyMGJlNjJiNzciLCJlbWFpbCI6ImtpdHRlbndhcnJpb3IyMDA1QGdtYWlsLmNvbSIsIm5hbWUiOiJraXR0ZW4gd2FycmlvciIsInR5cGUiOiJ1c2VyIiwiaWF0IjoxNzc1ODA1NDAzLCJleHAiOjE3NzY0MTAyMDN9.ei8IXaYObRPI_-kxFNT7fx99n9BteP5hJNGepS53HcY";

// --- CẤU HÌNH "CHẬM MÀ CHẮC" ---
const CONCURRENCY_LIMIT = 300; // Mỗi lần chỉ bắn 10 cái thôi
const DELAY_BETWEEN_CHUNKS = 500; // Nghỉ 0.5 giây giữa mỗi đợt bắn
const TOTAL_ROUNDS = 100; 

async function fastHack() {
    console.log("🔍 Đang lấy dữ liệu danh mục...");
    
    try {
        const catalogRes = await fetch(`${BASE_URL}/dictation/catalog`, {
            headers: { "Authorization": AUTH_TOKEN }
        });
        const catalog = await catalogRes.json();
        
        const allTasks = [];
        catalog.categories.forEach(cat => {
            cat.sections.forEach(sec => {
                sec.lessons.forEach(lesson => {
                    // Task 1: Activity
                    allTasks.push(() => fetch(`${BASE_URL}/dictation/activity`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN },
                        body: JSON.stringify({ "seconds": 300 })
                    }));

                    // Task 2: Progress
                    for (let i = 0; i < lesson.transcriptLineCount; i++) {
                        allTasks.push(() => fetch(`${BASE_URL}/dictation/lesson-progress`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN },
                            body: JSON.stringify({
                                "lessonId": lesson.id,
                                "lineIndex": i,
                                "isCorrect": true
                            })
                        }));
                    }
                });
            });
        });

        console.log(`📦 Tổng cộng: ${allTasks.length} task/vòng. Chế độ: Thong thả.`);

        for (let round = 1; round <= TOTAL_ROUNDS; round++) {
            console.log(`\n--- 🐢 LẦN THỨ [${round}/${TOTAL_ROUNDS}] ---`);
            
            for (let i = 0; i < allTasks.length; i += CONCURRENCY_LIMIT) {
                const chunk = allTasks.slice(i, i + CONCURRENCY_LIMIT).map(task => task());
                
                try {
                    await Promise.all(chunk);
                    const progress = (((i + chunk.length) / allTasks.length) * 100).toFixed(2);
                    process.stdout.write(`\r🚶 Tiến độ: ${progress}% | Đã xử lý: ${i + chunk.length}/${allTasks.length}`);
                    
                    // Nghỉ một chút cho server hồi sức
                    await new Promise(r => setTimeout(r, DELAY_BETWEEN_CHUNKS));
                } catch (e) {
                    process.stdout.write(`\n⚠️ Server đuối rồi, nghỉ 5s...`);
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
            console.log(`\n✅ Xong lượt ${round}.`);
        }

        console.log("\n\n🏆 HOÀN THÀNH TẤT CẢ! Server vẫn sống khỏe.");

    } catch (err) {
        console.error("❌ Lỗi kết nối ban đầu:", err.message);
    }
}

fastHack();