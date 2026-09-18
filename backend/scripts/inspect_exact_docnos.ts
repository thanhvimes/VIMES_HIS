import { query } from '../src/config/database';

async function main() {
    try {
        const docnos = [
            260309144, // Cao Thị Thúy Hồng (receptno 2)
            260309235, // BÙI THỊ HẢI (receptno 2)
            260308086, // Lê Thị Nhàn (receptno 2)
            260309328, // TRẦN THANH THẢO (receptno 3)
            260309395, // ĐẶNG THỊ HỒNG HÀ (receptno 3)
            260308096, // NGUYỄN KIỀU OANH (receptno 3)
            260309370, // Lê Thị Hà (receptno 4)
            260309448, // NGUYỄN THỊ NGUYỆT THẮNG (receptno 4)
            260308550  // Lê Thị Thiện (receptno 4)
        ];

        console.log('=== HMS_DOC ===');
        const rDoc = await query(`
            SELECT 
                hd_docno,
                hd_patientno,
                hd_admitdate,
                hd_status,
                hd_object,
                hd_enddept
            FROM hms_doc
            WHERE hd_docno = ANY($1)
            ORDER BY hd_admitdate, hd_docno
        `, [docnos]);
        console.table(rDoc.rows);

        console.log('=== HMS_EXAM ===');
        const rExam = await query(`
            SELECT 
                he_docno,
                he_receptidx,
                he_deptid,
                he_roomid,
                he_receptno,
                he_examdate,
                he_status,
                he_createdby,
                he_createddate,
                he_type
            FROM hms_exam
            WHERE he_docno = ANY($1)
            ORDER BY he_examdate, he_roomid, he_receptno
        `, [docnos]);
        console.table(rExam.rows);

        console.log('=== HMS_EXAM_PENDING ===');
        const rPending = await query(`
            SELECT 
                hep_docno,
                hep_receptidx,
                hep_deptid,
                hep_roomid,
                hep_receptno,
                hep_pending,
                hep_date,
                hep_type
            FROM hms_exam_pending
            WHERE hep_docno = ANY($1)
            ORDER BY hep_date, hep_roomid, hep_receptno
        `, [docnos]);
        console.table(rPending.rows);

        console.log('=== QMS_PATIENT ===');
        const rQms = await query(`
            SELECT 
                qp_docno,
                qp_patientno,
                qp_roomid,
                qp_deptid,
                qp_receptno,
                qp_orderdate,
                qp_status
            FROM qms_patient
            WHERE qp_docno = ANY($1)
        `, [docnos]).catch(e => ({ rows: [{ error: e.message }] }));
        console.table(rQms.rows);

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

main();
