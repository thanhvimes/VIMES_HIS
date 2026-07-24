import { query } from './src/config/database';

async function getRecentMasters() {
    try {
        const res = await query(`
            SELECT id, doc_no, patient_name, form_type, signature_status, send_status, updated_at
            FROM health_check_masters
            ORDER BY id DESC
            LIMIT 10
        `);
        console.log('📋 Top 10 Recent Documents in health_check_masters:');
        console.table(res.rows);
        process.exit(0);
    } catch (e: any) {
        console.error('Error fetching recent masters:', e.message);
        process.exit(1);
    }
}

getRecentMasters();
