
import { query } from '../src/config/database';

async function debugPatient() {
    const docNo = '260038964';
    try {
        const exams = await query(`
            SELECT he_receptidx, he_roomid, he_deptid, he_receptno, he_status, 
                   (SELECT hrl_roomname FROM hms_roomlist r WHERE r.hrl_id = e.he_roomid AND r.hrl_deptid = e.he_deptid LIMIT 1) as room_name
            FROM hms_exam e
            WHERE he_docno = $1
            ORDER BY he_receptidx
        `, [docNo]);
        
        console.log('EXAMS:', JSON.stringify(exams.rows, null, 2));

        const roomIds = exams.rows.map(r => r.he_roomid);
        if (roomIds.length > 0) {
            const rooms = await query(`
                SELECT hrl_id, hrl_deptid, hrl_roomname 
                FROM hms_roomlist 
                WHERE hrl_id IN (${roomIds.join(',')})
            `);
            console.log('ROOMS:', JSON.stringify(rooms.rows, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
debugPatient();
