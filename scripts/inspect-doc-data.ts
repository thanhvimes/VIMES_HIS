
import { query } from '../src/config/database';

async function inspectData() {
    try {
        const docNo = '260038964';
        console.log(`--- INSPECTING DATA FOR DOC: ${docNo} ---`);

        // Check HMS_DOC
        const docRes = await query('SELECT * FROM hms_doc WHERE hd_docno = $1', [docNo]);
        console.log('HMS_DOC:', JSON.stringify(docRes.rows, null, 2));

        // Check HMS_EXAM for this doc
        const examRes = await query(`
            SELECT he_receptidx, he_docno, he_roomid, he_deptid, he_receptno, he_examdate, he_status 
            FROM hms_exam 
            WHERE he_docno = $1
        `, [docNo]);
        console.log('HMS_EXAM for this doc:', JSON.stringify(examRes.rows, null, 2));

        // Check Room 230 and 229
        const roomRes = await query(`
            SELECT hrl_id, hrl_roomname, hrl_deptid 
            FROM hms_roomlist 
            WHERE hrl_roomname LIKE '%229%' OR hrl_roomname LIKE '%230%'
        `);
        console.log('ROOMS:', JSON.stringify(roomRes.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspectData();
