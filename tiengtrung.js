const crypto = require('crypto');

// --- Cấu hình ---
const BASE_URL = "https://tiengtrung.luyentu.com";
const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMwMDgsImVtYWlsIjoia2l0dGVud2FycmlvcjIwMDVAZ21haWwuY29tIiwiaWF0IjoxNzc2MDYzNTEyLCJleHAiOjE3NzYwNjQ0MTJ9.8Lf9c47k_08RJH1ObvkP504C6Le4aXeNsO_dk6vtLy0";

// --- Cấu hình Luồng (Threads) ---
const SO_LUONG_LUONG = 1000;   // Số luồng chạy song song (Thread)
const REQUEST_MOI_LUONG = 50; // Mỗi luồng bắn 50 lần rồi nghỉ
const DELAY_GIUA_REQUEST = 0; // Độ trễ cực nhỏ giữa mỗi lần bắn trong luồng (ms)
const LOOP_DELAY = 1000;      // Nghỉ 1s sau khi tất cả các luồng hoàn thành một vòng lớn

function generateAppToken() {
    const ts = Date.now().toString();
    const hash = crypto.createHmac('sha256', "luyentu-anti-scrape-2026").update(ts).digest('hex').substring(0, 16);
    return `${ts}.${hash}`;
}

const commonHeaders = {
    'accept': 'application/json, text/plain, */*',
    'authorization': AUTH_TOKEN,
    'content-type': 'application/json',
    'origin': 'https://tiengtrung.luyentu.com',
    'referer': 'https://tiengtrung.luyentu.com/home',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
};

// Hàm mô phỏng 1 luồng bắn phá
async function startWorker(workerId, loop) {
    let success = 0;
    for (let i = 0; i < REQUEST_MOI_LUONG; i++) {
        try {
            const res = await fetch(`${BASE_URL}/activity/log`, {
                method: 'POST',
                headers: { ...commonHeaders, 'x-app-token': generateAppToken() },
                body: JSON.stringify({ "incrementCount": true })
            });

            if (res.ok) {
                success++;
                const data = await res.json();
                const latest = data.data.activities.slice(-1)[0];
                // console.log(`[Vòng ${loop}][Luồng ${workerId}] ✅ ${success}/${REQUEST_MOI_LUONG} | Điểm: ${latest.count} | Lv: ${latest.level}`);
            } else {
                console.log(`[Luồng ${workerId}] ❌ Lỗi: ${res.status}`);
            }
        } catch (e) {
            console.log(`[Luồng ${workerId}] ❌ Lỗi kết nối`);
        }
        
        if (DELAY_GIUA_REQUEST > 0) await new Promise(r => setTimeout(r, DELAY_GIUA_REQUEST));
    }
    return success;
}

async function boostActivity() {
    let loopCount = 1;
    let tongDiemTichLuy = 0; // Biến lưu trữ tổng điểm qua các vòng
    const GIOI_HAN_DIEM = 100000;

    while (true) {
        console.log(`\n============================================`);
        console.log(`🚀 TỔNG LỰC TẤN CÔNG - VÒNG ${loopCount}`);
        console.log(`🔥 Đang chạy ${SO_LUONG_LUONG} luồng, mỗi luồng ${REQUEST_MOI_LUONG} phát...`);
        console.log(`📈 Tổng tích lũy hiện tại: ${tongDiemTichLuy}/${GIOI_HAN_DIEM}`);
        console.log(`============================================\n`);

        try {
            // Khởi tạo danh sách các luồng chạy song song
            const workers = [];
            for (let id = 1; id <= SO_LUONG_LUONG; id++) {
                workers.push(startWorker(id, loopCount));
            }

            // Chờ tất cả các luồng hoàn thành
            const results = await Promise.all(workers);
            const successInLoop = results.reduce((a, b) => a + b, 0);
            
            // Cộng dồn điểm vào tổng tích lũy
            tongDiemTichLuy += successInLoop;

            console.log(`\n--------------------------------------------`);
            console.log(`✨ Kết thúc vòng ${loopCount}: +${successInLoop} điểm.`);
            console.log(`📊 Tổng điểm sau lượt này: ${tongDiemTichLuy}`);
            console.log(`--------------------------------------------`);

            // KIỂM TRA ĐIỀU KIỆN DỪNG
            if (tongDiemTichLuy >= GIOI_HAN_DIEM) {
                console.log(`\n🎯 ĐÃ ĐẠT MỤC TIÊU ${GIOI_HAN_DIEM} ĐIỂM! Đang dừng script...`);
                break; // Thoát khỏi vòng lặp while hoàn toàn
            }

            console.log(`💤 Nghỉ ${LOOP_DELAY / 1000}s trước khi reset...`);
            loopCount++;
            await new Promise(r => setTimeout(r, LOOP_DELAY));

        } catch (err) {
            console.error(`\n❌ Lỗi tổng quát: ${err.message}. Thử lại sau 5s...`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    
    console.log("🏁 Script đã dừng an toàn.");
}

boostActivity();