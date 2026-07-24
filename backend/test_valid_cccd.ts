import { query } from './src/config/database';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function testValidCccd() {
    try {
        const postmanRes = await query(`SELECT xml_data FROM health_check_masters WHERE doc_no = 'POSTMAN_TEST_RECORD'`);
        let postmanXml = postmanRes.rows[0].xml_data;

        // Construct valid CCCD for male born in 2009 in Ninh Binh (037)
        // 037 (Ninh Binh) + 2 (Male 2000-2099) + 09 (born 2009) + 089012
        const validCccd = '037209089012';

        postmanXml = postmanXml.replace(/<HO_TEN>.*?<\/HO_TEN>/, '<HO_TEN>NGÔ THANH SƠN</HO_TEN>');
        postmanXml = postmanXml.replace(/<SO_CCCD>.*?<\/SO_CCCD>/, `<SO_CCCD>${validCccd}</SO_CCCD>`);
        postmanXml = postmanXml.replace(/<NGAY_SINH>.*?<\/NGAY_SINH>/, '<NGAY_SINH>20090213</NGAY_SINH>');
        postmanXml = postmanXml.replace(/<MA_LK>.*?<\/MA_LK>/, '<MA_LK>26292435</MA_LK>');

        const testNo = 'BISECT_VALID_CCCD';
        const ins = await query(`
            INSERT INTO health_check_masters (doc_no, patient_name, form_type, xml_data, signature_status, send_status)
            VALUES ($1, 'NGÔ THANH SƠN', '2', $2, 'Unsigned', 'Unsent')
            ON CONFLICT (doc_no) DO UPDATE SET xml_data = EXCLUDED.xml_data, send_status = 'Unsent', error_message = NULL
            RETURNING id
        `, [testNo, postmanXml]);

        const testId = ins.rows[0].id.toString();
        console.log(`🚀 Testing BISECT_VALID_CCCD with CCCD ${validCccd} (ID: ${testId})...`);

        await sendDocumentsToVNeID([testId]);

        const check = await query(`SELECT send_status, error_message, response_log FROM health_check_masters WHERE id = $1`, [parseInt(testId, 10)]);
        console.log('Result for BISECT_VALID_CCCD:', check.rows[0]);

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

testValidCccd();
