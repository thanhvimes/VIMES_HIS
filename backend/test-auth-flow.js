// ==================== TEST AUTHENTICATION & SCHEDULE INIT ====================
// File: backend/test-auth-flow.js
// Run: node backend/test-auth-flow.js

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000/api/v1';

// ===== CẤU HÌNH =====
// Thay đổi username/password của bạn ở đây
const TEST_USER = {
    userId: 'admin',      // Username
    password: 'Dunghoi1'  // Password
};

async function testAuthFlow() {
    console.log('🧪 TESTING AUTHENTICATION FLOW\n');
    console.log('='.repeat(60));

    try {
        // STEP 1: Login
        console.log('\n📝 STEP 1: Login');
        console.log(`   User: ${TEST_USER.userId}`);

        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            console.error('   ❌ Login failed:', loginData.message);
            console.error('\n💡 Hãy kiểm tra username/password trong file này (dòng 10-11)');
            process.exit(1);
        }

        console.log('   ✅ Login successful!');
        console.log(`   Token: ${loginData.token.substring(0, 30)}...`);
        console.log(`   User: ${loginData.user.name}`);
        console.log(`   DeptId: ${loginData.user.deptId}`);

        const token = loginData.token;

        // STEP 2: Test Schedule Init
        console.log('\n📝 STEP 2: Test Schedule Initialization');
        console.log('   Calling POST /api/v1/schedule/init');

        const initResponse = await fetch(`${BASE_URL}/schedule/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ days: 30 })
        });

        const initData = await initResponse.json();

        console.log(`   Status: ${initResponse.status}`);
        console.log(`   Response:`, JSON.stringify(initData, null, 2));

        if (!initResponse.ok) {
            console.error('\n   ❌ Schedule init failed!');
            console.error(`   Error: ${initData.message}`);

            if (initResponse.status === 401) {
                console.error('\n💡 LỖI 401: Token không được gửi hoặc không hợp lệ');
                console.error('   Kiểm tra:');
                console.error('   1. Authorization header có được gửi không?');
                console.error('   2. Token có hợp lệ không?');
                console.error('   3. authMiddleware có hoạt động không?');
            }

            process.exit(1);
        }

        console.log('\n   ✅ Schedule initialization successful!');
        console.log(`   Schedule count: ${initData.scheduleCount || 'N/A'}`);
        console.log(`   Exam slot count: ${initData.examSlotCount || 'N/A'}`);

        // STEP 3: Verify localStorage structure (for frontend)
        console.log('\n📝 STEP 3: Expected localStorage structure');
        console.log('   Frontend should save to localStorage like this:');
        console.log('');
        console.log('   localStorage.setItem("currentUser", JSON.stringify({');
        console.log(`       token: "${token.substring(0, 30)}...",`);
        console.log(`       userId: "${loginData.user.userId}",`);
        console.log(`       name: "${loginData.user.name}",`);
        console.log(`       deptId: "${loginData.user.deptId}",`);
        console.log('       ... (other user fields)');
        console.log('   }));');

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED!');
        console.log('='.repeat(60));
        console.log('\n💡 Nếu test này pass nhưng frontend vẫn lỗi:');
        console.log('   1. Xóa localStorage: localStorage.clear()');
        console.log('   2. Logout và login lại');
        console.log('   3. Kiểm tra Network tab xem Authorization header có được gửi không');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run test
testAuthFlow();
