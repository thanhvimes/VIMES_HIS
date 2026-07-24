const axios = require('axios');
const crypto = require('crypto');

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aGFvcG0zMDEyQGdtYWlsLmNvbSIsInN0YXR1c19hY2NvdW50IjoiMSIsIm1hX2Nza2IiOiI4OTM0Mjg1MDA4MTM1IiwiYWNjb3VudF9sZXZlbCI6IjEiLCJzZXNzaW9uX2lkIjoiMjY4YWRmYmYtNjdlYS00MjM3LTkyMDgtZDQwNDU4YTc1ZmJmIiwicGVybWlzc2lvbl9pZCI6ImViNTczOWQwLTAzNDUtNDNjNS04ODQyLTNhOTFiYzcxMmQ5NiIsInV1aWQiOiJlZTg1YTBhNy05YmRjLTQ4ZjktODU3NC0xNzQ2NzdiZTY0ZmUiLCJhdXRob3JpdGllcyI6WyJsb2dpbiIsImZhY2lsaXR5LWFwaSJdLCJwcm92aW5jZV9pZCI6MzcsIm1hX2dyX3N5dCI6IlNZVDM3IiwidXNlcm5hbWUiOiI4OTM0Mjg1MDA4MTM1X2FwaSIsInV0IjoiZmFjaWxpdHktYXBpIiwiaXNzIjoiaWRlbnRpdHkiLCJleHAiOjE3ODUwMDI2NzQsImlhdCI6MTc4NDY0MjY3NH0.I87fQUE9vZ4ltfCWvvvpxmoukXfAmJJuZbz1fujwNLI';

const base64Content = Buffer.from('<KHAMSUCKHOE><THONGTINDONVI><MACSKCB>8934285008135</MACSKCB></THONGTINDONVI></KHAMSUCKHOE>', 'utf8').toString('base64');
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

async function testVariant(name, payload) {
    const randomUuid = Math.random().toString(36).substring(2, 8) + Date.now();
    payload.header.msg_id = `8934285008135260721${randomUuid}`;

    console.log(`\n==============================================`);
    console.log(`Testing Variant: ${name}`);
    console.log(`Msg ID: ${payload.header.msg_id}`);
    try {
        const res = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload, {
            headers: {
                'service-type': '100',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`✅ SUCCESS (${res.status}):`, JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log(`❌ FAILED (${err.response?.status}):`, JSON.stringify(err.response?.data || err.message, null, 2));
    }
}

async function main() {
    // Variant 1: standard object data
    const p1 = {
        header: {
            version: "1.0.6",
            sender_id: "8934285008135",
            receiver_id: "emrhub",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "xml/base64",
            send_datetime: Date.now(),
            msg_id: ""
        },
        data: {
            file_content: base64Content
        },
        signature: "MOCK_SIGNATURE"
    };

    // Variant 2: string data
    const p2 = {
        header: {
            version: "1.0.6",
            sender_id: "8934285008135",
            receiver_id: "emrhub",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "xml/base64",
            send_datetime: Date.now(),
            msg_id: ""
        },
        data: base64Content,
        signature: "MOCK_SIGNATURE"
    };

    // Variant 3: receiver_id = TTYTQG
    const p3 = {
        header: {
            version: "1.0.6",
            sender_id: "8934285008135",
            receiver_id: "TTYTQG",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "xml/base64",
            send_datetime: Date.now(),
            msg_id: ""
        },
        data: {
            file_content: base64Content
        },
        signature: "MOCK_SIGNATURE"
    };

    // Variant 4: data_type = json/base64
    const p4 = {
        header: {
            version: "1.0.6",
            sender_id: "8934285008135",
            receiver_id: "emrhub",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "json/base64",
            send_datetime: Date.now(),
            msg_id: ""
        },
        data: base64Content,
        signature: "MOCK_SIGNATURE"
    };

    await testVariant("1. Standard Object data + xml/base64", p1);
    await testVariant("2. String data + xml/base64", p2);
    await testVariant("3. Standard Object data + TTYTQG", p3);
    await testVariant("4. String data + json/base64", p4);
}

main();
