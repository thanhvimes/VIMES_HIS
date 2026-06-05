/**
 * Seed KSK Documents from HIS Real Data
 * Usage: node seed_ksk_from_his.cjs
 * 
 * Queries 20 real patients from HIS (hms_patient + hms_doc + hms_exam)
 * and creates health_check_masters + health_check_details records.
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/v1';

function apiPost(path, body = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const url = new URL(`${API_BASE}${path}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseData) });
                } catch {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏥 SEED DỮ LIỆU KSK TỪ HIS THẬT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        console.log('\n📡 Gọi API: POST /health-check-sync/documents/seed-from-his ...');
        const result = await apiPost('/health-check-sync/documents/seed-from-his');
        
        if (result.status === 200 && result.data.success) {
            console.log(`\n✅ THÀNH CÔNG!`);
            console.log(`   📋 Số hồ sơ KSK đã tạo: ${result.data.count}`);
            console.log(`   📝 ${result.data.message}`);
        } else {
            console.log(`\n❌ LỖI: ${result.data.error || JSON.stringify(result.data)}`);
        }
    } catch (error) {
        console.error('\n❌ Không thể kết nối tới API:', error.message);
        console.log('   💡 Hãy chắc chắn backend đang chạy: npm run dev (trong thư mục backend)');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
