import fs from 'fs';
import path from 'path';
import axios from 'axios';

async function testProductionUrl() {
    console.log('================================================================');
    console.log('🚀 TEST PUSHING TO PRODUCTION ENDPOINT: https://api.emrhub.vn/api');
    console.log('================================================================\n');

    const filePath = path.join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Login to production API https://api.emrhub.vn/api/auth/login
    console.log('📡 [1] Logging in to Production API (https://api.emrhub.vn/api/auth/login)...');
    let token = '';
    try {
        const loginRes: any = await axios.post('https://api.emrhub.vn/api/auth/login', {
            username: '8934285008135_api',
            password: 'Abc@1234'
        });
        token = loginRes.data?.data?.token || loginRes.data?.token;
        console.log(`✅ Login to Production SUCCESS! Token length: ${token.length}`);
    } catch (err: any) {
        console.log('❌ Login to Production failed:', err.message);
        // Fallback to token in Postman_example.txt
        const tokenMatch = fileContent.match(/Authorization: Bearer ([^\s\\']+)/);
        token = tokenMatch![1];
        console.log('🔑 Fallback to token from Postman_example.txt');
    }

    const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
    const rawBase64 = dataMatch![1];

    const payload = {
        header: {
            version: "1.0.6",
            sender_id: "8934285008135",
            receiver_id: "TTYQG",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "xml/base64",
            send_datetime: 1781084650736,
            msg_id: "89342850081352607169e111d3536d54445a963ecdb68b7d435"
        },
        data: rawBase64
    };

    console.log('\n📡 [2] Pushing payload to PRODUCTION (https://api.emrhub.vn/api/platform/data-sync/push)...');
    try {
        const res: any = await axios.post('https://api.emrhub.vn/api/platform/data-sync/push', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'service-type': '100'
            },
            timeout: 30000
        });

        console.log('\n================================================================');
        console.log('🎉 RESPONSE FROM PRODUCTION GATEWAY:');
        console.log('================================================================');
        console.log(JSON.stringify(res.data, null, 2));

    } catch (err: any) {
        const resData = err.response?.data;
        console.log('\n================================================================');
        console.log('📥 RESPONSE FROM PRODUCTION GATEWAY:');
        console.log('================================================================');
        console.log(JSON.stringify(resData || { error: err.message }, null, 2));
    }
    process.exit(0);
}

testProductionUrl();
