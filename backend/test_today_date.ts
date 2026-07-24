import fs from 'fs';
import path from 'path';
import { query } from './src/config/database';
import { sendDocumentsToVNeID } from './src/services/health-check-sync.service';

async function testTodayDate() {
    try {
        const filePath = path.join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
        const rawBase64 = dataMatch![1];
        let rawXml = Buffer.from(rawBase64, 'base64').toString('utf8');

        // Update NGAYLAP to today date 20260724
        rawXml = rawXml.replace(/<NGAYLAP>.*?<\/NGAYLAP>/g, '<NGAYLAP>20260724</NGAYLAP>');
        rawXml = rawXml.replace(/<NGAY_VAO>.*?<\/NGAY_VAO>/g, '<NGAY_VAO>202607240800</NGAY_VAO>');

        const signatureVal = "cidHoD6pQjLqYDGEfxrHg8N5+16L3f+6N57+h2W4d3T/0k0+d9d8h/7j2ZtS7fN58x/n7zH7N9tB/5vH9sN44Q==";

        const docNo = 'POSTMAN_TEST_RECORD';
        await query(`
            INSERT INTO health_check_masters (
                doc_no, patient_name, form_type, xml_data, signature, signature_status, send_status
            ) VALUES ($1, 'NGUYỄN THỊ LAN', '2', $2, $3, 'Signed', 'Unsent')
            ON CONFLICT (doc_no) DO UPDATE SET
                xml_data = EXCLUDED.xml_data,
                signature = EXCLUDED.signature,
                signature_status = 'Signed',
                send_status = 'Unsent',
                error_message = NULL,
                response_log = NULL
            RETURNING id
        `, [docNo, rawXml, signatureVal]);

        console.log('📡 Pushing POSTMAN_TEST_RECORD with today date (20260724)...');
        await sendDocumentsToVNeID(['2223']);

        const res = await query(`SELECT doc_no, patient_name, send_status, error_message, response_log FROM health_check_masters WHERE doc_no = $1`, [docNo]);
        console.log('\nResult for Postman XML with today date:', res.rows[0]);

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

testTodayDate();
