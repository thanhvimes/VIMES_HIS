import { query } from './src/config/database';
import { loadHealthCheckSettings } from './src/config/health-check-settings';
import { generateXmlPayload } from './src/controllers/health-check/xml-generator';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function testPushDoc26292429WithInvalidCccdNgh() {
    console.log('================================================================');
    console.log('🚀 TEST KIỂM THỬ KHỦNG: TỰ ĐỘNG LÀM SẠCH SO_CCCD_NGH=0912009901 & ĐẨY CỔNG');
    console.log('================================================================\n');

    await loadHealthCheckSettings();

    const mRes = await query(`SELECT * FROM health_check_masters WHERE doc_no = '26292429'`);
    const masterRow = mRes.rows[0];

    const master = {
        docNo: masterRow.doc_no,
        patientName: masterRow.patient_name,
        gender: '1',
        dob: '1988-01-03',
        cccd: '037088003424',
        ngaycap_cccd: '2020-03-15',
        noicap_cccd: 'Cục CSDLQG về dân cư',
        nhom_mau: 'O+',
        ethnic: '01',
        address: 'Số 12, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh',
        matinh_cu_tru: '79',
        maxa_cu_tru: '26740',
        phone: '0912345678',
        SO_CCCD_NGH: '0912009901', // Số ĐT gán nhầm vào ô CCCD người giám hộ
        ma_nghe_nghiep: '04',
        noi_cong_tac: 'Công ty TNHH ABC',
        ly_do_ksk: 'Khám sức khỏe định kỳ',
        created_at: masterRow.created_at || new Date()
    };

    const clinical = {
        MAU_SAC_DA: '0',
        LONG_BAN_TAY: '0',
        THOP: '0',
        HINH_DANG_DAU: '0',
        VAN_DONG_CO: '0',
        KHAM_MAT_PL: '1',
        KHAM_TAI_MUI_HONG_PL: '1',
        KHAM_RANG_HAM_MAT_PL: '1'
    };

    const lab = {};
    const conclusion = {
        PHAN_LOAI_SK: '1',
        KET_LUAN_BENH: 'Z00.0',
        CAC_VAN_DE_SUC_KHOE: 'Đủ sức khỏe làm việc'
    };

    console.log('📝 Đang sinh XML và tự động làm sạch trường SO_CCCD_NGH sai độ dài (0912009901)...');
    const newXml = generateXmlPayload('mau2', master, clinical, lab, conclusion);
    console.log(`✅ Đã sinh XML thành công! Độ dài: ${newXml.length} bytes`);

    const signatureVal = "cidHoD6pQjLqYDGEfxrHg8N5+16L3f+6N57+h2W4d3T/0k0+d9d8h/7j2ZtS7fN58x/n7zH7N9tB/5vH9sN44Q==";

    // Update XML in DB
    await query(`
        UPDATE health_check_masters
        SET xml_data = $1, signature = $2, signature_status = 'Signed', send_status = 'Unsent', error_message = NULL, response_log = NULL
        WHERE id = $3
    `, [newXml, signatureVal, masterRow.id]);

    console.log(`📡 Đang đẩy hồ sơ ID ${masterRow.id} (DocNo: 26292429) sang Cổng VNeID...`);
    await sendDocumentsToVNeID([masterRow.id.toString()]);

    // Check DB result
    const checkRes = await query(`SELECT send_status, error_message, response_log FROM health_check_masters WHERE id = $1`, [masterRow.id]);
    const resRow = checkRes.rows[0];

    console.log('\n================================================================');
    console.log('📥 KẾT QUẢ TRẢ VỀ TỪ CỔNG CHO HỒ SƠ 26292429:');
    console.log('================================================================');
    console.log(`- send_status  : ${resRow.send_status}`);
    console.log(`- error_message: ${resRow.error_message}`);
    console.log(`- response_log :`, JSON.parse(resRow.response_log || '{}'));

    process.exit(0);
}

testPushDoc26292429WithInvalidCccdNgh();
