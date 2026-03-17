const { query } = require('./src/config/database');

async function run() {
    try {
        console.log('--- DB DEBUG ---');
        const depts = await query('SELECT DISTINCT hses_deptid FROM hms_schedule_exam_setup');
        console.log('Depts in setup:', depts.rows.map(r => r.hses_deptid));

        const allRows = await query('SELECT * FROM hms_schedule_exam_setup');
        console.log('Total rows in setup:', allRows.rows.length);

        const ccRows = allRows.rows.filter(r => r.hses_deptid === 'CC');
        console.log('CC rows:', ccRows.length);
        if (ccRows.length > 0) {
            console.log('Sample CC data:', JSON.stringify(ccRows, null, 2));
        }

        const badTime = allRows.rows.filter(r => r.hses_starttime === '07:77' || r.hses_endtime === '07:77');
        console.log('Bad time rows:', badTime.length);
        if (badTime.length > 0) {
            console.log('BAD ROWS:', JSON.stringify(badTime, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

run().then(() => process.exit());
