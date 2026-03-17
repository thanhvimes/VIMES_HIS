
import { query } from '../src/config/database';

async function main() {
    try {
        const res = await query(`SELECT he_roomid, he_deptid FROM hms_exam WHERE he_roomid IS NOT NULL LIMIT 1`);
        if (res.rows.length > 0) {
            console.log('Sample Data from hms_exam:');
            console.log(`RoomId: ${res.rows[0].he_roomid}`);
            console.log(`DeptId: ${res.rows[0].he_deptid}`);
        } else {
            console.log('No data in hms_exam, checking sys_dept/sys_room equivalent...');
            // Try to find any table with room in it again
            const rooms = await query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%room%'`);
            rooms.rows.forEach(r => console.log(`Potential room table: ${r.table_name}`));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
