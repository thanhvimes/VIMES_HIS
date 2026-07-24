import { query } from './src/config/database';

async function checkSignedDocs() {
    const res = await query(`
        SELECT id, doc_no, patient_name, signature_status, send_status, error_message
        FROM health_check_masters
        ORDER BY id DESC
        LIMIT 10
    `);
    console.log('Signed/Recent Docs in DB:', res.rows);
    process.exit(0);
}

checkSignedDocs();
