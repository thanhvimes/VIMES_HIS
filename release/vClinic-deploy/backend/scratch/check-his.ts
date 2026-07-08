import { query } from '../src/config/database';

async function check() {
    try {
        console.log('--- PATIENTS IN HIS WITH FILTER / COMP ---');
        const resP = await query(`
            SELECT hp_patientno, hp_firstname, hp_surname, hp_workplaceid 
            FROM hms_patient 
            WHERE hp_firstname = 'FILTER' OR hp_workplaceid IN ('COMP_A', 'COMP_B', 'COMP_C')
        `);
        console.table(resP.rows);

        console.log('--- DOCS IN HIS ---');
        const resD = await query(`
            SELECT hd_patientno, hd_docno, hd_admitdate 
            FROM hms_doc 
            WHERE hd_patientno IN (
                SELECT hp_patientno FROM hms_patient 
                WHERE hp_firstname = 'FILTER' OR hp_workplaceid IN ('COMP_A', 'COMP_B', 'COMP_C')
            )
        `);
        console.table(resD.rows);

        console.log('--- EXAMS IN HIS ---');
        const resE = await query(`
            SELECT he_patientno, he_docno, he_receptidx, he_receptno 
            FROM hms_exam 
            WHERE he_docno IN (
                SELECT hd_docno FROM hms_doc 
                WHERE hd_patientno IN (
                    SELECT hp_patientno FROM hms_patient 
                    WHERE hp_firstname = 'FILTER' OR hp_workplaceid IN ('COMP_A', 'COMP_B', 'COMP_C')
                )
            )
        `);
        console.table(resE.rows);
    } catch (e: any) {
        console.error(e.message);
    } finally {
        process.exit(0);
    }
}

check();
