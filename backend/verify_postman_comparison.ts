import fs from 'fs';
import path from 'path';
import axios from 'axios';

async function verifyPostmanComparison() {
    console.log('================================================================');
    console.log('🔍 KIỂM TRỨNG GỬI NGUYÊN BẢN THEO DỮ LIỆU TRONG POSTMAN_EXAMPLE.TXT');
    console.log('================================================================\n');

    const filePath = path.join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
    console.log(`📂 [1] Đang đọc file mẫu từ: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Extract Bearer Token from Postman example Line 5
    const tokenMatch = fileContent.match(/Authorization: Bearer ([^\s\\']+)/);
    const token = tokenMatch![1];
    console.log(`🔑 Token từ Postman: ${token.slice(0, 30)}...`);

    // Extract Base64 XML Data from Request 1
    const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
    const rawBase64 = dataMatch![1];

    // Payload Request 1
    const payloadRequest1 = {
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

    console.log('\n📡 [2] Đang gửi Request 1 trực tiếp tới Sandbox Gateway (https://api-sandbox.emrhub.vn/api/platform/data-sync/push)...');

    try {
        const res: any = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payloadRequest1, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'service-type': '100'
            },
            timeout: 30000
        });

        console.log('\n================================================================');
        console.log('📥 KẾT QUẢ KẾT NỐI VÀ TRẢ VỀ TỪ CỔNG THỰC TẾ:');
        console.log('================================================================');
        console.log(JSON.stringify(res.data, null, 2));

    } catch (err: any) {
        const errData = err.response?.data;
        console.log('\n================================================================');
        console.log('📥 KẾT QUẢ PHẢN HỒI THỰC TẾ TỪ CỔNG (KHI CHẠY TRỰC TIẾP TỪ CODE):');
        console.log('================================================================');
        console.log(JSON.stringify(errData || { error: err.message }, null, 2));

        console.log('\n================================================================');
        console.log('📄 KẾT QUẢ MẪU TRONG FILE POSTMAN_EXAMPLE.TXT (LINE 23 - 40):');
        console.log('================================================================');
        console.log(`{
    "header": {
        "version": "1.0.6",
        "sender_id": "TTYQG",
        "receiver_id": "8934285008135",
        "txn_id": "DS-8934285008135-90f4bb555e4641889719d87b939d2871",
        "txn_type": "sync_checkup",
        "res_code": "PS_CCCD_DUPLICATE_IN_6_MONTHS",
        "res_msg": "The patient was examined less than 6 months ago and needs a follow-up examination.",
        "msg_id": "TTYQG202607205fb336625873f42b580c545e142314365",
        "msg_type": "102",
        "ref_msg_id": "89342850081352607169e111d3536d54445a963ecdb68b7d435",
        "send_datetime": 1781084650736,
        "res_datetime": 1784868558849
    },
    "data": null,
    "signature": "fB25e7YHAsSO1e+Qgea7HqaU8C0v01oazrtBHqGX..."
}`);
    }
    process.exit(0);
}

verifyPostmanComparison();
