
import { query } from '../src/config/database';

async function checkCatalogs() {
    try {
        const depts = await query('SELECT sd_id FROM sys_dept LIMIT 3');
        const rooms = await query('SELECT hrl_id, hrl_deptid FROM hms_roomlist LIMIT 3');
        console.log('VALID_DEPT:', depts.rows[0]?.sd_id);
        console.log('VALID_ROOM:', rooms.rows[0]?.hrl_id, 'IN DEPT:', rooms.rows[0]?.hrl_deptid);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkCatalogs();
