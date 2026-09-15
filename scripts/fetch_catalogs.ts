
import { query } from '../src/config/database';

async function fetchCatalogs() {
    try {
        const rooms = await query('SELECT hrl_id, hrl_roomname FROM hms_roomlist WHERE hrl_roomname IS NOT NULL LIMIT 10');
        console.log('ROOMS:', JSON.stringify(rooms.rows, null, 2));

        const depts = await query('SELECT sd_id, sd_name FROM sys_dept WHERE sd_isactive = \'Y\' LIMIT 10');
        console.log('DEPTS:', JSON.stringify(depts.rows, null, 2));

        const exams = await query('SELECT hfl_feeid, hfl_name FROM hms_feelist WHERE hfl_groupid = \'D0000\' AND hfl_active = \'Y\' LIMIT 10');
        console.log('EXAMS:', JSON.stringify(exams.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fetchCatalogs();
