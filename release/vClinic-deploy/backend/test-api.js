const http = require('http');

// Test configuration
const BASE_URL = 'localhost';
const PORT = 3000;
const USERNAME = 'admin';
const PASSWORD = 'Dunghoi1';

let testToken = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test functions
async function testLogin() {
    console.log('\n🔐 TEST 1: Login');
    console.log('=====================================');

    try {
        const result = await makeRequest('POST', '/api/v1/auth/login', {
            userId: USERNAME,
            password: PASSWORD
        });

        console.log(`Status: ${result.status}`);

        if (result.status === 200 && result.data.token) {
            testToken = result.data.token;
            console.log('✅ Login SUCCESS');
            console.log(`Token: ${testToken.substring(0, 50)}...`);
            console.log(`User: ${result.data.user.name}`);
            console.log(`DeptId: ${result.data.user.deptId}`);
            return true;
        } else {
            console.log('❌ Login FAILED');
            console.log('Response:', result.data);
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

async function testScheduleInitWithToken() {
    console.log('\n📅 TEST 2: Schedule Init WITH Token');
    console.log('=====================================');

    if (!testToken) {
        console.log('❌ No token available! Run login test first.');
        return false;
    }

    try {
        console.log(`Using token: ${testToken.substring(0, 50)}...`);

        const result = await makeRequest('POST', '/api/v1/schedule/init',
            { days: 30 },
            testToken
        );

        console.log(`Status: ${result.status}`);

        if (result.status === 200) {
            console.log('✅ Schedule Init SUCCESS');
            console.log('Response:', result.data);
            return true;
        } else {
            console.log('❌ Schedule Init FAILED');
            console.log('Response:', result.data);
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

async function testScheduleInitWithoutToken() {
    console.log('\n🚫 TEST 3: Schedule Init WITHOUT Token');
    console.log('=====================================');

    try {
        const result = await makeRequest('POST', '/api/v1/schedule/init', { days: 30 });

        console.log(`Status: ${result.status}`);

        if (result.status === 401) {
            console.log('✅ Correctly rejected (401)');
            console.log('Response:', result.data);
            return true;
        } else {
            console.log('⚠️ UNEXPECTED: Should be 401!');
            console.log('Response:', result.data);
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n🧪 vClinic API Test Suite');
    console.log('=====================================');
    console.log(`Target: http://${BASE_URL}:${PORT}`);
    console.log(`User: ${USERNAME}`);
    console.log('=====================================');

    const results = {
        login: false,
        scheduleWithToken: false,
        scheduleWithoutToken: false
    };

    // Test 1: Login
    results.login = await testLogin();

    if (!results.login) {
        console.log('\n❌ Login failed! Cannot proceed with other tests.');
        console.log('\n💡 Check:');
        console.log('1. Backend is running on port 3000');
        console.log('2. Database connection is working');
        console.log('3. User credentials are correct');
        return;
    }

    // Test 2: Schedule Init with token
    results.scheduleWithToken = await testScheduleInitWithToken();

    // Test 3: Schedule Init without token
    results.scheduleWithoutToken = await testScheduleInitWithoutToken();

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=====================================');
    console.log(`Login:                    ${results.login ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Schedule Init (w/ token): ${results.scheduleWithToken ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Schedule Init (no token): ${results.scheduleWithoutToken ? '✅ PASS' : '❌ FAIL'}`);
    console.log('=====================================');

    if (results.login && results.scheduleWithToken && results.scheduleWithoutToken) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('\n✅ Backend API is working correctly!');
        console.log('✅ Authentication is working!');
        console.log('✅ Schedule initialization is working!');
        console.log('\n💡 If vClinic frontend still fails:');
        console.log('   → The problem is in the FRONTEND code');
        console.log('   → Frontend is not sending the token correctly');
        console.log('   → Check apiClient.ts implementation');
    } else {
        console.log('\n❌ SOME TESTS FAILED!');
        console.log('\n💡 Next steps:');
        console.log('1. Check backend logs for errors');
        console.log('2. Verify database connection');
        console.log('3. Check JWT_SECRET in .env');
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
