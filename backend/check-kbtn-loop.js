const { query } = require('./src/config/database');

async function run() {
    try {
        console.log('--- KBTN Schedule Data Check ---');
        const res = await query(`
            SELECT 
                MIN(hs_slot_duration) as min_dur, 
                MAX(hs_slot_duration) as max_dur, 
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE hs_slot_duration <= 0) as zero_dur_count
            FROM hms_schedule 
            WHERE hs_deptid = 'KBTN'
        `);
        console.log(JSON.stringify(res.rows, null, 2));

        if (res.rows[0].zero_dur_count > 0) {
            console.log('⚠️ ALERT: Found records with zero or negative duration. This causes an infinite loop in the SQL generator!');
            const samples = await query(`SELECT hs_deptid, hs_roomid, hs_date, hs_shift, hs_slot_duration FROM hms_schedule WHERE hs_deptid = 'KBTN' AND hs_slot_duration <= 0 LIMIT 5`);
            console.table(samples.rows);
        }
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit();
}

run();
