const { query } = require('../config/database');

async function debugSlots() {
    try {
        const date = '2026-02-02';
        const deptId = 'KB';
        const roomIds = [14, 15, 93];

        console.log(`Checking slots for Dept ${deptId} and Rooms ${roomIds} on ${date}:`);
        const result = await query(`
      SELECT 
        hse_roomid, 
        hse_time, 
        hse_status
      FROM hms_schedule_exam 
      WHERE hse_date = $1 
      AND hse_deptid = $2
      AND hse_roomid = ANY($3)
      ORDER BY hse_roomid, hse_time
      LIMIT 20
    `, [date, deptId, roomIds]);

        if (result.rows.length === 0) {
            console.log('❌ No slots found for these specific rooms!');

            console.log('\nLet check what rooms DO have slots for this date/dept:');
            const allRooms = await query(`
         SELECT DISTINCT hse_roomid FROM hms_schedule_exam WHERE hse_date = $1 AND hse_deptid = $2
      `, [date, deptId]);
            console.log('Rooms with slots:', allRooms.rows.map(r => r.hse_roomid));
        } else {
            console.log('Slots found:');
            console.table(result.rows);
        }

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        process.exit();
    }
}

debugSlots();
