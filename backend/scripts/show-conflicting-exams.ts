
import { query } from '../src/config/database';

async function showConflictingExams() {
    const docNo = '260038964';
    try {
        const res = await query(`
            SELECT 
                he_receptidx, he_roomid, he_deptid,
                (SELECT hrl_roomname FROM hms_roomlist r WHERE r.hrl_id = e.he_roomid AND r.hrl_deptid = e.he_deptid LIMIT 1) as room_name,
                he_status, to_char(he_examdate, 'HH24:MI') as time
            FROM hms_exam e
            WHERE he_docno = $1
            ORDER BY he_receptidx
        `, [docNo]);
        
        console.log(`Report for Doc ${docNo}:`);
        res.rows.forEach(r => {
            console.log(`Idx:${r.he_receptidx} | Room:${r.he_roomid} | Dept:${r.he_deptid} | Name:${r.room_name} | Status:${r.he_status} | Time:${r.time}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
showConflictingExams();
