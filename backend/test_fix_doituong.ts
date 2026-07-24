import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

async function testFixDoiTuong() {
    try {
        const filePath = path.join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
        const rawBase64 = dataMatch![1];
        let xmlContent = Buffer.from(rawBase64, 'base64').toString('utf8');

        // Fix DOI_TUONG '1;2' -> '1'
        xmlContent = xmlContent.replace('<DOI_TUONG>1;2</DOI_TUONG>', '<DOI_TUONG>1</DOI_TUONG>');

        // Expand self closing tags
        xmlContent = xmlContent.replace(/<([A-Z0-9_]+)\s*\/>/gi, '<$1></$1>');

        const newBase64 = Buffer.from(xmlContent, 'utf8').toString('base64');

        // Login
        const loginRes: any = await axios.post('https://api-sandbox.emrhub.vn/api/auth/login', {
            username: '8934285008135_api',
            password: 'Abc@1234'
        });
        const token = loginRes.data?.data?.token;

        const gln = '8934285008135';
        const uuidStr = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : crypto.randomBytes(16).toString('hex');
        const freshMsgId = `${gln}260710${uuidStr}`;

        const payload = {
            header: {
                version: "1.0.6",
                sender_id: gln,
                receiver_id: "TTYQG",
                txn_type: "sync_checkup",
                msg_id: freshMsgId,
                msg_type: "101",
                data_type: "xml/base64",
                send_datetime: Date.now()
            },
            data: newBase64
        };

        console.log(`🚀 Testing with <DOI_TUONG>1</DOI_TUONG>...`);
        const pushRes: any = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'service-type': '100'
            }
        });

        console.log('🎉 GATEWAY RESPONSE WITH DOI_TUONG FIX:');
        console.log(JSON.stringify(pushRes.data, null, 2));

    } catch (err: any) {
        console.error('Response Status:', err.response?.status);
        console.error('Response Data:', JSON.stringify(err.response?.data, null, 2));
    }
    process.exit(0);
}

testFixDoiTuong();
