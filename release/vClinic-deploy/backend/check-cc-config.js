const { query } = require('./src/config/database');

async function checkConfig() {
    console.log('--- Checking Configuration for Dept: CC ---');
    try {
        const res = await query("SELECT * FROM hms_schedule_exam_setup WHERE hses_deptid = 'CC'");
        console.log(`Found ${res.rows.length} rows for CC.`);
        if (res.rows.length > 0) {
            console.table(res.rows);
        } else {
            console.log('❌ NO CONFIGURATION FOUND for CC in hms_schedule_exam_setup');

            console.log('\n--- Existing Depts in Setup ---');
            const depts = await query("SELECT DISTINCT hses_deptid FROM hms_schedule_exam_setup");
            console.log('Available Dept IDs:', depts.rows.map(r => r.hses_deptid).join(', '));
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit();
}

checkConfig();
