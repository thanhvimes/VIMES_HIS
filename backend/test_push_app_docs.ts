import { query } from './src/config/database';
import { loadHealthCheckSettings } from './src/config/health-check-settings';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function testPushAppDocs() {
    console.log('================================================================');
    console.log('🚀 TEST ĐẨY HỒ SƠ 26292428 QUA HÀM sendDocumentsToVNeID MỚI NHẤT');
    console.log('================================================================\n');

    await loadHealthCheckSettings();

    // Reset status of 26292428 to Unsent
    const docRes = await query(`SELECT id FROM health_check_masters WHERE doc_no = '26292428'`);
    if (docRes.rows.length === 0) {
        console.error('❌ Không tìm thấy hồ sơ 26292428');
        process.exit(1);
    }
    const docId = docRes.rows[0].id.toString();

    console.log(`📡 Đang gọi sendDocumentsToVNeID([${docId}])...`);
    await sendDocumentsToVNeID([docId]);

    // Check DB Log
    const checkRes = await query(`SELECT send_status, error_message, response_log FROM health_check_masters WHERE id = $1`, [parseInt(docId, 10)]);
    const row = checkRes.rows[0];

    console.log('\n================================================================');
    console.log('📥 KẾT QUẢ CẬP NHẬT TRONG CSDL:');
    console.log('================================================================');
    console.log(`- send_status  : ${row.send_status}`);
    console.log(`- error_message: ${row.error_message}`);
    console.log(`- response_log :`, row.response_log);

    process.exit(0);
}

testPushAppDocs();
