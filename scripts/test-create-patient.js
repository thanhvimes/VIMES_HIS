/**
 * test-create-patient.js
 * Script test tạo bệnh nhân mới qua API theo luồng DangKyKham.md
 * Run: node scripts/test-create-patient.js
 */

const http = require('http');

// ─── Config ─────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:3000/api/v1';
let authToken = '';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const url = new URL(BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port || 3000,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function log(step, label, result) {
    const ok = result.status >= 200 && result.status < 300;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`BƯỚC ${step}: ${label}`);
    console.log(`  Status: ${result.status} ${ok ? '✅' : '❌'}`);
    if (ok) {
        console.log(`  Result: ${JSON.stringify(result.data, null, 2).substring(0, 400)}`);
    } else {
        console.log(`  ERROR: ${JSON.stringify(result.data)}`);
    }
    return ok;
}

// ─── Test Data ────────────────────────────────────────────────────────────────
const NEW_PATIENT_DATA = {
    // Thông tin hành chính
    name: 'Nguyễn Thị Test',
    dob: '1990-05-15',
    gender: 'Nữ',
    identityCard: '036090012345',
    address: '123 Đường Test, Phường Test',
    phone: '0901234567',
    ethnicity: '1',
    occupation: '1',
    provinceId: '37',
    wardId: '',

    // Thông tin thân nhân (BẮT BUỘC)
    relativeInfo: 'Nguyễn Văn Anh',
    relativePhone: '0987654321',

    // Lượt khám
    patientType: 'Dịch vụ',
    regDepartment: 'KKB',
    regRoom: '1',
    regExamType: 'E01',
    regReason: 'Khám tổng quát - TEST',
    regPriority: false,
    route: 'Đúng tuyến',

    // Bảo hiểm (để trống vì đối tượng Dịch vụ)
    insuranceNumber: '',

    // Chuyển tuyến
    isTransfer: false,
    transferHospital: '',
    transferDiagnosis: ''
};

// ─── Main Test Flow ───────────────────────────────────────────────────────────
async function runTest() {
    console.log('🏥 ========================================');
    console.log('   TEST: Tạo Bệnh Nhân Mới (DangKyKham.md)');
    console.log('🏥 ========================================');

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 0: Đăng nhập lấy token
    // ────────────────────────────────────────────────────────────────
    console.log('\n📡 Kết nối server...');
    const loginRes = await request('POST', '/auth/login', {
        username: 'admin',
        password: 'Admin@123'
    });

    if (loginRes.status === 200 && loginRes.data.token) {
        authToken = loginRes.data.token;
        console.log(`✅ Đăng nhập OK — User: ${loginRes.data.user?.name || loginRes.data.username || 'admin'}`);
    } else {
        // Thử không cần auth nếu API không yêu cầu
        console.log('⚠️  Login thất bại hoặc không cần auth, tiếp tục không có token...');
        console.log('   Response:', JSON.stringify(loginRes.data).substring(0, 200));
    }

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 1: Kiểm tra lookup — BN chưa tồn tại (theo CCCD)
    // ────────────────────────────────────────────────────────────────
    const lookupRes = await request('GET', `/reception/lookup?cccd=${NEW_PATIENT_DATA.identityCard}`);
    const lookupOk = log('3', `LOOKUP CCCD: ${NEW_PATIENT_DATA.identityCard}`, lookupRes);

    if (lookupRes.data?.found) {
        console.log(`\n⚠️  BN đã tồn tại (mã BN: ${lookupRes.data.data?.patientNo})`);
        console.log('   → Chuyển sang test ADD_DOC (tạo lượt khám mới)');

        const patientNo = lookupRes.data.data?.patientNo;
        const addDocRes = await request('POST', `/reception/patients/${patientNo}/register`, {
            ...NEW_PATIENT_DATA,
            id: patientNo,
            patientId: patientNo
        });
        log('4b', `ADD_DOC — Tạo lượt khám mới cho BN ${patientNo}`, addDocRes);
        if (addDocRes.data?.data) {
            console.log('\n🎉 Kết quả ADD_DOC:');
            console.log(`   📋 Mã hồ sơ:  ${addDocRes.data.data.docNo}`);
            console.log(`   🎫 Số thứ tự: ${addDocRes.data.data.receptNo}`);
        }
        return;
    }

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 2: BN mới — POST /reception/patients (ADD_PATIENT)
    // ────────────────────────────────────────────────────────────────
    console.log('\n✅ BN chưa tồn tại → Tạo mới (ADD_PATIENT)');
    const createRes = await request('POST', '/reception/patients', NEW_PATIENT_DATA);
    const createOk = log('5', 'ADD_PATIENT — Tạo bệnh nhân + hồ sơ + phiếu khám', createRes);

    if (!createOk) {
        console.log('\n❌ Tạo thất bại. Kiểm tra lỗi ở trên.');
        process.exit(1);
    }

    const result = createRes.data?.data || {};
    console.log('\n🎉 ========== KẾT QUẢ ĐĂNG KÝ ==========');
    console.log(`   👤 Mã bệnh nhân: ${result.patientNo || '(chưa có)'}`);
    console.log(`   📋 Mã hồ sơ:    ${result.docNo || '(chưa có)'}`);
    console.log(`   🎫 Số thứ tự:   ${result.receptNo || '(chưa có)'}`);
    console.log('🎉 =========================================');

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 3: Verify — Tra cứu lại BN vừa tạo
    // ────────────────────────────────────────────────────────────────
    if (result.patientNo) {
        const verifyRes = await request('GET', `/reception/patients/${result.patientNo}`);
        log('✓ VERIFY', `Tra cứu lại BN ${result.patientNo}`, verifyRes);
        if (verifyRes.data) {
            console.log(`   Họ tên: ${verifyRes.data.name}`);
            console.log(`   Giới tính: ${verifyRes.data.gender}`);
            console.log(`   Ngày sinh: ${verifyRes.data.dob}`);
            console.log(`   Lịch sử khám: ${(verifyRes.data.history || []).length} lần`);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 4: Test tạo lượt khám 2 cho cùng BN (ADD_DOC)
    // ────────────────────────────────────────────────────────────────
    if (result.patientNo) {
        console.log(`\n⏩ Test ADD_DOC: Tạo lượt khám thứ 2 cho BN ${result.patientNo}...`);
        const addDocRes = await request('POST', `/reception/patients/${result.patientNo}/register`, {
            ...NEW_PATIENT_DATA,
            id: result.patientNo,
            patientId: result.patientNo,
            regReason: 'Tái khám - TEST ADD_DOC'
        });
        log('4b', `ADD_DOC — Lượt khám 2 cho BN ${result.patientNo}`, addDocRes);
        if (addDocRes.data?.data) {
            console.log(`   📋 Mã hồ sơ mới:  ${addDocRes.data.data.docNo}`);
            console.log(`   🎫 Số thứ tự mới: ${addDocRes.data.data.receptNo}`);
        }
    }

    console.log('\n✅ TEST HOÀN THÀNH!\n');
}

runTest().catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
});
