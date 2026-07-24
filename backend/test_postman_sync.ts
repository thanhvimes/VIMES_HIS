import fs from 'fs';
import path from 'path';
import { query } from './src/config/database';
import { loadHealthCheckSettings } from './src/config/health-check-settings';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

/**
 * THỦ TỤC TEST ĐẨY DỮ LIỆU QUA CHÍNH HÀM SỰ VỤ CỦA PHẦN MỀM (sendDocumentsToVNeID)
 */
async function runPostmanSyncTest() {
    console.log('================================================================');
    console.log('🚀 THỰC THI THỦ TỤC TEST ĐẨY DỮ LIỆU QUA HÀM HỆ THỐNG sendDocumentsToVNeID');
    console.log('================================================================\n');

    try {
        await loadHealthCheckSettings();
        console.log('⚙️ [1] Đã nạp cấu hình đồng bộ từ CSDL.');

        const filePath = path.join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Extract Base64 XML data
        const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
        const rawBase64 = dataMatch![1];
        const rawXml = Buffer.from(rawBase64, 'base64').toString('utf8');

        const signatureVal = "cidHoD6pQjLqYDGEfxrHg8N5+16L3f+6N57+h2W4d3T/0k0+d9d8h/7j2ZtS7fN58x/n7zH7N9tB/5vH9sN44Q==";

        const docNo = 'POSTMAN_TEST_RECORD';
        const patientName = 'NGUYỄN THỊ LAN';

        // 2. Khởi tạo bản ghi thử nghiệm trong CSDL kèm chữ ký
        console.log(`📝 [2] Lưu bản ghi thử nghiệm (${docNo}) vào CSDL kèm signature...`);
        const insertRes = await query(`
            INSERT INTO health_check_masters (
                doc_no, patient_name, form_type, xml_data, signature, signature_status, send_status
            ) VALUES ($1, $2, '2', $3, $4, 'Signed', 'Unsent')
            ON CONFLICT (doc_no) DO UPDATE SET
                xml_data = EXCLUDED.xml_data,
                signature = EXCLUDED.signature,
                signature_status = 'Signed',
                send_status = 'Unsent',
                error_message = NULL,
                response_log = NULL
            RETURNING id
        `, [docNo, patientName, rawXml, signatureVal]);

        const testDocId = insertRes.rows[0].id.toString();
        console.log(`✅ [2] Bản ghi đã lưu với ID: ${testDocId}`);

        // 3. Thực thi hàm hệ thống sendDocumentsToVNeID
        console.log('\n📡 [3] Thực thi dịch vụ sendDocumentsToVNeID...');
        await sendDocumentsToVNeID([testDocId]);

        // 4. Kiểm tra kết quả phản hồi từ CSDL
        const dbCheck = await query(`
            SELECT send_status, transaction_id, error_message, response_log
            FROM health_check_masters
            WHERE id = $1
        `, [parseInt(testDocId, 10)]);

        const record = dbCheck.rows[0];
        console.log('\n================================================================');
        console.log('📥 KẾT QUẢ PHẢN HỒI NGUYÊN BẢN TỪ CỔNG (DB LOG):');
        console.log('================================================================');
        console.log(`- Trạng thái gửi (send_status) : ${record.send_status}`);
        console.log(`- Mã giao dịch (transaction_id): ${record.transaction_id || 'N/A'}`);
        console.log(`- Thông báo lỗi (error_message): ${record.error_message || 'Không có'}`);

        if (record.response_log) {
            try {
                const parsedLog = JSON.parse(record.response_log);
                console.log('\n📄 Chi tiết JSON Response từ Cổng:');
                console.log(JSON.stringify(parsedLog, null, 2));

                const resCode = parsedLog.header?.res_code;
                const resMsg = parsedLog.header?.res_msg;

                console.log('\n================================================================');
                if (resCode === 'PS_CCCD_DUPLICATE_IN_6_MONTHS') {
                    console.log('🎉 TEST KHỚP 100% POSTMAN SCREENSHOT: Cổng phản hồi mã [PS_CCCD_DUPLICATE_IN_6_MONTHS] - Bệnh nhân đã khám sức khỏe trong vòng 6 tháng!');
                } else if (resCode === 'CM_SUCCESS' || record.send_status === 'Success') {
                    console.log('🎉 CỔNG TIẾP NHẬN HỒ SƠ THÀNH CÔNG (CM_SUCCESS)!');
                } else {
                    console.log(`ℹ️ Cổng phản hồi mã: [${resCode}] - ${resMsg}`);
                }
                console.log('================================================================');
            } catch (e) {
                console.log(`Log thô: ${record.response_log}`);
            }
        }

    } catch (error: any) {
        console.error('❌ Lỗi khi chạy thủ tục test:', error.message || error);
    }

    process.exit(0);
}

runPostmanSyncTest();
