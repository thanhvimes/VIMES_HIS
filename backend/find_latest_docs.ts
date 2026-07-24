import { query } from './src/config/database';

async function findLatestDocs() {
    try {
        const res = await query(`
            SELECT hd_docno, hd_patientno, hd_admitdate, hd_telephone, hd_cardno, hd_status
            FROM hms_doc
            ORDER BY hd_docno DESC
            LIMIT 10
        `);
        console.log('📋 Latest 10 hms_doc:');
        console.table(res.rows);

        const patientNos = res.rows.map(r => `'${r.hd_patientno}'`).join(',');
        const patientRes = await query(`
            SELECT hp_patientno, trim(hp_surname||' '||hp_midname||' '||hp_firstname) as fullname, hp_idcard, hp_dt_didong
            FROM hms_patient
            WHERE hp_patientno IN (${patientNos})
        `);
        console.log('📋 Corresponding Patients:');
        console.table(patientRes.rows);

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

findLatestDocs();
