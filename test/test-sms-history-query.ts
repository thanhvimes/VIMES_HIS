import { pool } from '../src/config/database';

async function testSMSHistoryQuery() {
    try {
        console.log('🔍 Testing getSMSHistory SQL query with exact qms_patient columns...');
        const bookingIdNum = 161516; // Test booking ID
        const bookingRes = await pool.query(`
            SELECT q.*, s.ss_desc as "specialtyName", COALESCE(rl.hrl_name, rl.hrl_roomname) as "roomName"
            FROM qms_patient q
            LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
            LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = COALESCE(k.hrk_code::varchar, q.qms_specialty_code::varchar))
            LEFT JOIN hms_roomlist rl ON (rl.hrl_id = q.qms_roomid AND rl.hrl_deptid = q.qms_deptid)
            WHERE q.qms_idx = $1 OR q.qms_docno = $1
            ORDER BY q.qms_idx DESC
            LIMIT 1
        `, [bookingIdNum]);

        console.log(`✅ Query Success! Rows found: ${bookingRes.rows.length}`);
        if (bookingRes.rows.length > 0) {
            const b = bookingRes.rows[0];
            console.log('📋 Patient Name:', b.qms_patientname);
            console.log('📋 Patient Phone:', b.qms_contact);
            console.log('📋 Dept ID:', b.qms_deptid);
            console.log('📋 Appointment Date:', b.qms_appointment_date);
            console.log('📋 Specialty:', b.specialtyName);
            console.log('📋 Room Name:', b.roomName);
        }
    } catch (e) {
        console.error('❌ SQL Error:', e);
    } finally {
        await pool.end();
    }
}

testSMSHistoryQuery();
