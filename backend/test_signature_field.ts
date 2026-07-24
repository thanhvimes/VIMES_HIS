import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

async function testWithSignatureField() {
    console.log('================================================================');
    console.log('🚀 TEST GỬI PAYLOAD CÓ TRƯỜNG "signature": "" HOẶC NULL');
    console.log('================================================================\n');

    const filePath = path.join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const loginRes: any = await axios.post('https://api-sandbox.emrhub.vn/api/auth/login', {
        username: '8934285008135_api',
        password: 'Abc@1234'
    });
    const token = loginRes.data?.data?.token || loginRes.data?.token;
    console.log('✅ Token JWT acquired.');

    const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
    const rawBase64 = dataMatch![1];

    const gln = '8934285008135';
    const uuidHex = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : crypto.randomBytes(16).toString('hex');
    const freshMsgId = `${gln}260716${uuidHex}`;

    // Test 1: With "signature": ""
    const payload1 = {
        header: {
            version: "1.0.6",
            sender_id: gln,
            receiver_id: "TTYQG",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "xml/base64",
            send_datetime: Date.now(),
            msg_id: freshMsgId
        },
        data: rawBase64,
        signature: ""
    };

    console.log('📡 [1] Pushing payload WITH "signature": ""...');
    try {
        const res: any = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload1, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'service-type': '100'
            },
            timeout: 30000
        });
        console.log('🎉 RESPONSE 1:', JSON.stringify(res.data, null, 2));
    } catch (err: any) {
        console.log('❌ ERROR 1:', err.response?.status, JSON.stringify(err.response?.data || err.message, null, 2));
    }

    // Test 2: With "signature": null
    const payload2 = {
        header: {
            version: "1.0.6",
            sender_id: gln,
            receiver_id: "TTYQG",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "xml/base64",
            send_datetime: Date.now(),
            msg_id: freshMsgId
        },
        data: rawBase64,
        signature: null
    };

    console.log('\n📡 [2] Pushing payload WITH "signature": null...');
    try {
        const res: any = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload2, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'service-type': '100'
            },
            timeout: 30000
        });
        console.log('🎉 RESPONSE 2:', JSON.stringify(res.data, null, 2));
    } catch (err: any) {
        console.log('❌ ERROR 2:', err.response?.status, JSON.stringify(err.response?.data || err.message, null, 2));
    }

    process.exit(0);
}

testWithSignatureField();
