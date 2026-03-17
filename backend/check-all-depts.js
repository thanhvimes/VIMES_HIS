const { query } = require('./src/config/database');

async function run() {
    try {
        const setupDepts = await query('SELECT DISTINCT hses_deptid FROM hms_schedule_exam_setup');
        console.log('--- Depts in hms_schedule_exam_setup ---');
        console.log(JSON.stringify(setupDepts.rows, null, 2));

        const roomDepts = await query('SELECT DISTINCT hrk_deptid FROM hms_roomlist_kios');
        console.log('\n--- Depts in hms_roomlist_kios ---');
        console.log(JSON.stringify(roomDepts.rows, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit();
}

run();
