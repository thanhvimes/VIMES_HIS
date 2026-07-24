import { query } from './src/config/database';
import { generateXmlPayload } from './src/controllers/health-check/xml-generator';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function testSandboxCccd() {
    try {
        console.log('🚀 Testing with Sandbox valid CCCD 037080003423...');

        const validCccd = '037080003423';

        // Update 2252 (NGÔ THANH SƠN)
        const doc2252 = (await query(`SELECT * FROM health_check_masters WHERE id = 2252`)).rows[0];
        doc2252.cccd = validCccd;
        doc2252.phone = '0912345678';
        const xml2252 = generateXmlPayload(doc2252.form_type || '2', doc2252, {}, {}, {});
        await query(`UPDATE health_check_masters SET cccd = $1, xml_data = $2, send_status = 'Unsent', error_message = NULL WHERE id = 2252`, [validCccd, xml2252]);

        // Update 2251 (LÊ THỊ HỒNG)
        const doc2251 = (await query(`SELECT * FROM health_check_masters WHERE id = 2251`)).rows[0];
        doc2251.cccd = validCccd;
        doc2251.phone = '0912345678';
        const xml2251 = generateXmlPayload(doc2251.form_type || '2', doc2251, {}, {}, {});
        await query(`UPDATE health_check_masters SET cccd = $1, xml_data = $2, send_status = 'Unsent', error_message = NULL WHERE id = 2251`, [validCccd, xml2251]);

        console.log('📡 Pushing 2252 and 2251 to VNeID...');
        await sendDocumentsToVNeID(['2252', '2251']);

        const results = await query(`SELECT doc_no, patient_name, cccd, send_status, error_message, response_log FROM health_check_masters WHERE id IN (2252, 2251)`);
        console.log('\n================================================================');
        console.log('📥 KẾT QUẢ ĐỒNG BỘ VNEID:');
        console.log('================================================================');
        for (const row of results.rows) {
            console.log(`\n📄 ${row.doc_no} - ${row.patient_name} (CCCD: ${row.cccd})`);
            console.log(`   Status: ${row.send_status}`);
            console.log(`   Error : ${row.error_message}`);
        }

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

testSandboxCccd();
