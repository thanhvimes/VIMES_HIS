import { query } from './src/config/database';

async function getRecentDocuments() {
    try {
        const res = await query(`
            SELECT *
            FROM health_check_documents
            ORDER BY id DESC
            LIMIT 5
        `);
        console.log('📋 Top 5 Recent Documents:');
        for (const row of res.rows) {
            console.log({
                id: row.id,
                doc_no: row.doc_no,
                patient_name: row.patient_name,
                form_type: row.form_type,
                signature_status: row.signature_status,
                sync_status: row.sync_status,
                updated_at: row.updated_at,
                vneid_response: row.vneid_response
            });
        }
        process.exit(0);
    } catch (e: any) {
        console.error('Error fetching recent documents:', e.message);
        process.exit(1);
    }
}

getRecentDocuments();
