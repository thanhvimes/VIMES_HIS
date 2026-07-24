import { query } from './src/config/database';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function bisectXml() {
    try {
        // Fetch Postman XML (which works 100%)
        const postmanRes = await query(`SELECT xml_data FROM health_check_masters WHERE doc_no = 'POSTMAN_TEST_RECORD'`);
        let postmanXml = postmanRes.rows[0].xml_data;

        // Replace Name & CCCD with record 2252's (NGÔ THANH SƠN)
        postmanXml = postmanXml.replace(/<HO_TEN>.*?<\/HO_TEN>/, '<HO_TEN>NGÔ THANH SƠN</HO_TEN>');
        postmanXml = postmanXml.replace(/<SO_CCCD>.*?<\/SO_CCCD>/, '<SO_CCCD>509900089012</SO_CCCD>');
        postmanXml = postmanXml.replace(/<MA_LK>.*?<\/MA_LK>/, '<MA_LK>26292435</MA_LK>');

        // Insert as temporary test doc
        const testNo = 'BISECT_TEST_01';
        const ins = await query(`
            INSERT INTO health_check_masters (doc_no, patient_name, form_type, xml_data, signature_status, send_status)
            VALUES ($1, 'NGÔ THANH SƠN', '2', $2, 'Unsigned', 'Unsent')
            ON CONFLICT (doc_no) DO UPDATE SET xml_data = EXCLUDED.xml_data, send_status = 'Unsent', error_message = NULL
            RETURNING id
        `, [testNo, postmanXml]);

        const testId = ins.rows[0].id.toString();
        console.log(`🚀 Testing BISECT_TEST_01 (ID: ${testId})...`);

        await sendDocumentsToVNeID([testId]);

        const check = await query(`SELECT send_status, error_message, response_log FROM health_check_masters WHERE id = $1`, [parseInt(testId, 10)]);
        console.log('Result for BISECT_TEST_01:', check.rows[0]);

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

bisectXml();
