import { query } from './src/config/database';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function testMsgIdLength() {
    try {
        const postmanRes = await query(`SELECT xml_data FROM health_check_masters WHERE doc_no = 'POSTMAN_TEST_RECORD'`);
        let postmanXml = postmanRes.rows[0].xml_data;
        postmanXml = postmanXml.replace(/<MA_LK>.*?<\/MA_LK>/, '<MA_LK>26292434</MA_LK>');

        await query(`UPDATE health_check_masters SET xml_data = $1, send_status = 'Unsent', error_message = NULL WHERE id = 2251`, [postmanXml]);

        console.log('📡 Testing sendDocumentsToVNeID with short msg_id...');
        await sendDocumentsToVNeID(['2251']);

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

testMsgIdLength();
