const https = require('https');

// --- CẤU HÌNH TOKEN & COOKIE (Lấy từ curl của bạn) ---
const CSRF_TOKEN = "ULQ1V8yYaP3BwAsGINlzzECgq4Y8cBaWa2qZdbXahI8";
const SESSION_COOKIE = "csrf_token=ULQ1V8yYaP3BwAsGINlzzECgq4Y8cBaWa2qZdbXahI8; goaw_session=eyJhbGciOiJSUzI1NiIsImtpZCI6InU5VmJ5USJ9.eyJpc3MiOiJodHRwczovL3Nlc3Npb24uZmlyZWJhc2UuZ29vZ2xlLmNvbS9nb2F3LTE3ZGY3IiwibmFtZSI6IlF14buRYyBCw7lpIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lCbnJfdU1RanNrVmI4VUw4eGtXdTluNEVuVXoxYVlHT3RrYWZCT2xLempuQzJlRTBSXHUwMDNkczk2LWMiLCJhdWQiOiJnb2F3LTE3ZGY3IiwiYXV0aF90aW1lIjoxNzc2OTM1MDM0LCJ1c2VyX2lkIjoiakdxTUMwQm5UcFJzMWFwcXZyMzc1a3NBZ2VtMiIsInN1YiI6ImpHcU1DMEJuVHBSczFhcHF2cjM3NWtzQWdlbTIiLCJpYXQiOjE3NzY5MzUwMzUsImV4cCI6MTc3NzM2NzAzNSwiZW1haWwiOiJidWlkaW5ocXVvYzIwMDVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDg4NTI0Njg3MDk5NDQ2NTYwNDAiXSwiZW1haWwiOlsiYnVpZGluaHF1b2MyMDA1QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.oOlx3_m9xfL-VaHk6lGzi82OOSuL4VL02oFTVBSbkCtzVkWPbbaSVUxIT7ZldA7JDUtMtN38wNYiMo9YNaDBMm8V9x49sEr0nw6xCnhoLGwpZnaWhPrRtCihfK9fqcahB1mkB17YBlPbaCA79xYfXchA72Kil-GSuqnFQdCcSFjI-mOKa4ZnqbG_DWyhSzgr0gha-PnpFLla1SkI_DSEIQA1IaMpSOckwGZeNcAsdvaDb9G8lTR0CHNu4_cgvtzHwgbnuqA9KD3aDxJQF9rx78EZzgwS0KRRfx2l4SI7mlnpIfqLdg-MJdt4ZA_mkaxeoI-JvIoYbUYUfXAoCdOZ0A";

const CONCURRENCY = 1500;   // Số request đồng thời (không nên để quá cao tránh bị khóa IP sớm)
const TOTAL_TASKS = 10000;  // Tổng số lượng request muốn test

const agent = new https.Agent({ keepAlive: true, maxSockets: 100 });

let stats = { total: 0, success: 0, rateLimited: 0, error: 0 };

async function callApi(type) {
    const url = type === 'CREATE' 
        ? "https://goaw.app/api/v1/my-locations/personal"
        : "https://goaw.app/api/v1/my-locations/personal/19/share";

    const body = type === 'CREATE' ? JSON.stringify({
        name: "Soul Ben Thanh Restaurant & Bar",
        province_id: 1,
        district_id: 1,
        category_id: 1,
        subcategory_id: 7,
        address: "7 Thủ Khoa Huân, Bến Thành, Hồ Chí Minh",
        min_price: 50,
        max_price: 100
    }) : "";

    try {
        const res = await fetch(url, {
            method: 'POST',
            agent: agent,
            headers: {
                'content-type': 'application/json',
                'cookie': SESSION_COOKIE,
                'x-csrf-token': CSRF_TOKEN,
                'user-agent': 'Mozilla/5.0 Stress-Test-Agent',
                'origin': 'https://goaw.app',
                'referer': 'https://goaw.app/new-location'
            },
            body: body
        });

        stats.total++;
        if (res.status === 200 || res.status === 201) stats.success++;
        else if (res.status === 429) stats.rateLimited++;
        else stats.error++;

        console.log(`[${type}] Status: ${res.status} | Total: ${stats.total}`);
    } catch (e) {
        stats.total++;
        stats.error++;
    }
}

async function startTest() {
    console.log("🚀 Bắt đầu test Rate Limit cho goaw.app...");
    
    const workers = [];
    async function worker() {
        while (stats.total < TOTAL_TASKS) {
            // Chạy xen kẽ 2 API
            await callApi('CREATE');
            if (stats.total < TOTAL_TASKS) await callApi('SHARE');
        }
    }

    for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
    await Promise.all(workers);

    console.log("\n--- KẾT QUẢ ---");
    console.log(`Thành công: ${stats.success}`);
    console.log(`Bị chặn (429): ${stats.rateLimited}`);
    console.log(`Lỗi khác: ${stats.error}`);
}

startTest();