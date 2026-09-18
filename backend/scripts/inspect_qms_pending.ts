import { query } from '../src/config/database';

async function main() {
    try {
        console.log('--- Inspecting hms_exam_pending ---');
        const rPending = await query(`
            SELECT 
                ep.hep_docno,
                ep.hep_receptno,
                ep.hep_deptid,
                ep.hep_roomid,
                ep.hep_pending,
                ep.hep_date,
                CONCAT(p.hp_surname, ' ', p.hp_midname, ' ', p.hp_firstname) as patient_name
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_date >= CURRENT_DATE - INTERVAL '14 days'
              AND ep.hep_receptno IN (1, 2, 3, 4, 5)
            ORDER BY ep.hep_date DESC, ep.hep_roomid, ep.hep_receptno
            LIMIT 40
        `);
        console.table(rPending.rows);

        console.log('--- Inspecting duplicates in hms_exam_pending ---');
        const rPendingDups = await query(`
            SELECT 
                ep.hep_date,
                ep.hep_deptid,
                ep.hep_roomid,
                ep.hep_receptno,
                COUNT(*) as cnt,
                STRING_AGG(CONCAT(p.hp_surname, ' ', p.hp_midname, ' ', p.hp_firstname), ' | ') as patients,
                STRING_AGG(ep.hep_docno::text, ', ') as docnos
            FROM hms_exam_pending ep
            LEFT JOIN hms_doc d ON d.hd_docno = ep.hep_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = d.hd_patientno
            WHERE ep.hep_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY ep.hep_date, ep.hep_deptid, ep.hep_roomid, ep.hep_receptno
            HAVING COUNT(*) > 1
            ORDER BY ep.hep_date DESC, cnt DESC
            LIMIT 20
        `);
        console.table(rPendingDups.rows);

        // Also check qms_patients or kiosk queue tables
        const checkQms = await query(`
            SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%qms%'
        `);
        console.log('--- QMS TABLES ---');
        console.table(checkQms.rows);

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

main();
