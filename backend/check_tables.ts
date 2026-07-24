import { query } from './src/config/database';

async function checkTables() {
    try {
        const countRes = await query('SELECT COUNT(*) FROM health_check_documents');
        console.log('Count health_check_documents:', countRes.rows[0].count);

        const hisDocs = await query(`
            SELECT hd_docno, hd_patientname, hd_cardid, hd_date 
            FROM hms_doc 
            ORDER BY hd_docno DESC 
            LIMIT 10
        `);
        console.log('Latest 10 hms_doc:');
        console.table(hisDocs.rows);

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

checkTables();
