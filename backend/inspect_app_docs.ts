import { query } from './src/config/database';

async function inspectAppDocs() {
    const res = await query(`
        SELECT id, doc_no, patient_name, xml_data, send_status, error_message, response_log
        FROM health_check_masters
        WHERE doc_no IN ('26292428', '26292429')
    `);

    for (const row of res.rows) {
        console.log(`================================================================`);
        console.log(`📄 DOC NO: ${row.doc_no} | Patient: ${row.patient_name}`);
        console.log(`================================================================`);
        console.log(`XML DATA (Length ${row.xml_data?.length || 0}):`);
        console.log(row.xml_data);
        console.log(`\nERROR MESSAGE:`, row.error_message);
        console.log(`RESPONSE LOG:`, row.response_log);
    }
    process.exit(0);
}

inspectAppDocs();
