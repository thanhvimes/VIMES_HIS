import { query } from './src/config/database';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function testPostmanXmlPush() {
    try {
        const pRes = await query(`SELECT xml_data FROM health_check_masters WHERE doc_no = 'POSTMAN_TEST_RECORD'`);
        let pXml = pRes.rows[0].xml_data;

        // Set MA_LK to 26292435
        pXml = pXml.replace(/<MA_LK>.*?<\/MA_LK>/, '<MA_LK>26292435</MA_LK>');

        // Update 2252 (NGÔ THANH SƠN) with this exact working XML template
        await query(`UPDATE health_check_masters SET xml_data = $1, send_status = 'Unsent', error_message = NULL WHERE id = 2252`, [pXml]);

        console.log('📡 Pushing 2252 with Postman XML template...');
        await sendDocumentsToVNeID(['2252']);

        const res = await query(`SELECT id, doc_no, patient_name, send_status, error_message, response_log FROM health_check_masters WHERE id = 2252`);
        console.log('\n================================================================');
        console.log('RESULT FOR 2252 (NGÔ THANH SƠN):');
        console.log('================================================================');
        console.log(res.rows[0]);

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

testPostmanXmlPush();
