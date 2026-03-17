const { query } = require('./src/config/database');

async function run() {
    try {
        const res = await query('SELECT DISTINCT hses_deptid FROM hms_schedule_exam_setup');
        console.log('--- All Department IDs in setup table ---');
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('\n--- Sample Rows (first 5) ---');
        const rows = await query('SELECT hses_deptid, hses_roomid, hses_type, hses_starttime, hses_endtime FROM hms_schedule_exam_setup LIMIT 5');
        console.log(JSON.stringify(rows.rows, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit();
}

run();
