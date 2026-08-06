import { pool } from '../src/config/database';

async function inspectBoard() {
    try {
        console.log('🔍 Inspecting hms_operation_board & hms_operation records...');
        const res = await pool.query(`
            SELECT ob.hob_docno, ob.hob_date, ob.hob_status, 
                   o.ho_idx, o.ho_startdate, o.ho_performdate, o.ho_status,
                   p.hp_surname || ' ' || p.hp_firstname as name
            FROM hms_operation_board ob
            JOIN hms_operation o ON o.ho_docno = ob.hob_docno
            LEFT JOIN hms_patient p ON p.hp_patientno = COALESCE(o.ho_patientno, (SELECT hd_patientno FROM hms_doc WHERE hd_docno = o.ho_docno))
            ORDER BY o.ho_idx DESC
            LIMIT 10
        `);

        console.table(res.rows);
    } catch (e) {
        console.error('❌ Error inspecting:', e);
    } finally {
        await pool.end();
    }
}

inspectBoard();
