import axios from 'axios';
import crypto from 'crypto';
import { loadHealthCheckSettings } from './src/config/health-check-settings';

async function testWithReceiverEmrhub() {
    try {
        await loadHealthCheckSettings();

        // 1. Authenticate to get token
        const loginRes: any = await axios.post('https://api-sandbox.emrhub.vn/api/auth/login', {
            username: '8934285008135_api',
            password: 'Abc@1234'
        });
        const token = loginRes.data?.data?.token || loginRes.data?.token;

        const gln = '8934285008135';
        const datePrefix = '260710';
        const uuidHex = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : crypto.randomBytes(16).toString('hex');
        const msgId = `${gln}${datePrefix}${uuidHex}`;

        const filePath = require('path').join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
        const fileContent = require('fs').readFileSync(filePath, 'utf8');
        const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
        const rawBase64 = dataMatch![1];

        const payload = {
            header: {
                version: "1.0.6",
                sender_id: gln,
                receiver_id: "emrhub",
                txn_type: "sync_checkup",
                msg_id: msgId,
                msg_type: "101",
                data_type: "xml/base64",
                send_datetime: Date.now()
            },
            data: rawBase64
        };

        console.log(`🚀 Testing with receiver_id 'emrhub'...`);

        const pushRes: any = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'service-type': '100'
            },
            timeout: 30000
        });

        console.log('\n🎉 GATEWAY RESPONSE FOR RECEIVER EMRHUB:');
        console.log(JSON.stringify(pushRes.data, null, 2));

    } catch (err: any) {
        console.error('❌ Request status:', err.response?.status);
        console.error('❌ Response data:', JSON.stringify(err.response?.data || err.message, null, 2));
    }
    process.exit(0);
}

testWithReceiverEmrhub();
