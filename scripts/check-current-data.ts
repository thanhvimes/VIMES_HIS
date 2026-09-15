
import { query } from '../src/config/database';

async function checkData() {
    try {
        const patients = await query('SELECT hp_patientno, hp_sin, hp_surname, hp_midname, hp_firstname FROM hms_patient ORDER BY hp_createddate DESC LIMIT 5');
        console.log('PATIENTS:', JSON.stringify(patients.rows, null, 2));

        const docs = await query('SELECT hd_docno, hd_patientno, hd_admitdate, hd_status FROM hms_doc WHERE DATE(hd_admitdate) = CURRENT_DATE ORDER BY hd_admitdate DESC LIMIT 5');
        console.log('DOCS TODAY:', JSON.stringify(docs.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
