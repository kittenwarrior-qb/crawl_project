const CryptoJS = require('crypto-js');

const keyCookie = 'Hanzii_Dict_Key_Scret_11_22_3344';
const ivKey = '10000000000000000000000000000011';

// Dữ liệu JSON bạn vừa giải mã được, nhưng đã sửa thông tin VIP
const fakeUser = {
    "id": 1780739,
    "token": "77604176298906393361302463310390",
    "username": "Quốc Bùi Hacker",
    "email": "buidinhquoc2005@gmail.com",
    "is_premium": "1",          // Đổi từ "0" thành "1"
    "premium_expired": "1999999999", // Hết hạn vào năm 2033
    "ai_expried": 1999999999,   // Mở khóa luôn AI
    "role": "admin",            // Thử vận may với quyền Admin
    "language": "vi",
    "country": "VN"
};

function encodeCookie(jsonObject) {
    const dataString = JSON.stringify(jsonObject);
    const key = CryptoJS.enc.Utf8.parse(keyCookie);
    const iv = CryptoJS.enc.Hex.parse(ivKey);
    
    const encrypted = CryptoJS.AES.encrypt(dataString, key, { 
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    return encrypted.toString();
}

console.log("CHÈN CHUỖI NÀY VÀO COOKIE 'info':");
console.log(encodeCookie(fakeUser));