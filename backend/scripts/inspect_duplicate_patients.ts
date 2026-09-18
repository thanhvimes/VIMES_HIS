import { query } from '../src/config/database';

async function main() {
    try {
        console.log('Searching for patients from screenshot...');
        
        // Find in hms_patient / hms_doc / hms_exam
        const names = [
            'Cao Thị Thúy Hồng',
            'BÙI THỊ HẢI',
            'TRẦN THANH THẢO',
            'ĐẶNG THỊ HỒNG HÀ',
            'Lê Thị Hà',
            'NGUYỄN THỊ NGUYỆT THẮNG'
        ];
        
        for (const name of names) {
            const r = await query(`
                SELECT 
                    p.hp_patientno,
                    CONCAT(p.hp_surname, ' ', p.hp_midname, ' ', p.hp_firstname) AS full_name,
                    d.hd_docno,
                    d.hd_admitdate,
                    e.he_receptidx,
                    e.he_deptid,
                    e.he_roomid,
                    e.he_receptno,
                    e.he_status,
                    e.he_examdate,
                    e.he_type
                FROM hms_patient p
                LEFT JOIN hms_doc d ON d.hd_patientno = p.hp_patientno
                LEFT JOIN hms_exam e ON e.he_docno = d.hd_docno
                WHERE UPPER(TRIM(CONCAT(p.hp_surname, ' ', p.hp_midname, ' ', p.hp_firstname))) = UPPER(TRIM($1))
                   OR UPPER(TRIM(p.hp_firstname)) = UPPER(TRIM(SPLIT_PART($1, ' ', array_length(string_to_array($1, ' '), 1))))
                ORDER BY e.he_examdate DESC NULLS LAST
                LIMIT 5
            `, [name]);
            console.log(`=== Result for "${name}":`);
            console.table(r.rows);
        }

        // Check recent hms_exam where there are duplicate he_receptno on the same room & day
        const dupRes = await query(`
            SELECT 
                DATE(he_examdate) as exam_date,
                he_deptid,
                he_roomid,
                he_receptno,
                COUNT(*) as count_receptno,
                STRING_AGG(he_docno::text, ', ') as docnos,
                STRING_AGG(he_status, ', ') as statuses
            FROM hms_exam
            WHERE he_examdate >= CURRENT_DATE - INTERVAL '14 days'
              AND he_receptno > 0
            GROUP BY DATE(he_examdate), he_deptid, he_roomid, he_receptno
            HAVING COUNT(*) > 1
            ORDER BY exam_date DESC, he_roomid, he_receptno
            LIMIT 20
        `);
        console.log('--- DUPLICATE HE_RECEPTNO IN LAST 14 DAYS ---');
        console.table(dupRes.rows);

    } catch (err: any) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

main();
