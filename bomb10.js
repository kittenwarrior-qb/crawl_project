const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

// 1. Thiết lập CookieJar để tự động lưu và gửi Cookie (sessionid, csrftoken)
const jar = new CookieJar();
const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://study4.com/'
    }
}));

async function crawlStudy4() {
    try {
        const targetPage = 'https://study4.com/courses/26/ielts-fundamentals/';
        const apiTranslate = 'https://study4.com/ai_services/translate/';

        console.log('[*] Đang lấy Token từ trang web...');
        
        // Bước 1: GET trang để Server trả về Cookie 'csrftoken'
        const response = await client.get(targetPage);
        const html = response.data;

        // Bước 2: Dùng Regex bóc tách token từ biến window.csrf_token trong HTML
        const tokenMatch = html.match(/csrf_token\s*=\s*"(.*?)"/);
        const csrfToken = tokenMatch ? tokenMatch[1] : null;

        if (!csrfToken) {
            console.error('[-] Không tìm thấy Token! Có thể trang web đã đổi cấu trúc.');
            return;
        }

        console.log('[+] Token lấy được:', csrfToken);

        // Bước 3: Gọi API POST với Header bảo mật
        console.log('[*] Đang gửi yêu cầu dịch thuật...');
        const apiResponse = await client.post(apiTranslate, 
            {
                term: "fundamental", // Dữ liệu mẫu dựa trên code của bạn
                text: "IELTS Fundamentals course"
            }, 
            {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest', // Quan trọng để giả dạng AJAX
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('[+] Kết quả trả về:');
        console.log(apiResponse.data);

    } catch (error) {
        console.error('[-] Lỗi:', error.response ? error.response.status : error.message);
    }
}

crawlStudy4();