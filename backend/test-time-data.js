const { query } = require('./src/config/database');

async function check() {
    try {
        console.log('Querying hms_schedule_exam_setup for CC...');
        const res = await query("SELECT * FROM hms_schedule_exam_setup WHERE hses_deptid = 'CC'");
        console.log(`Found ${res.rows.length} rows.`);

        const invalid = res.rows.filter(r => r.hses_starttime.includes('77') || r.hses_endtime.includes('77'));
        if (invalid.length > 0) {
            console.log('❌ INVALID DATA FOUND:');
            console.log(JSON.stringify(invalid, null, 2));
        } else {
            console.log('✅ No obvious 77 error found in raw data.');
            console.log('Sample rows:');
            console.log(JSON.stringify(res.rows.slice(0, 10), null, 2));
        }
    } catch (e) {
        console.error('Error during query:', e);
    }
}

check().then(() => process.exit());
