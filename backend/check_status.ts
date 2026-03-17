
import { query } from './src/config/database';
async function check() {
    try {
        const res = await query("SELECT hd_status, COUNT(*) FROM hms_doc GROUP BY hd_status");
        console.log('hd_status values:', res.rows);
        
        const examCols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'hms_exam'");
        console.log('hms_exam cols:', examCols.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
