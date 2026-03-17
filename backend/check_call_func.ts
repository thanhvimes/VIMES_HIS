import { query } from './src/config/database';
async function run() {
    try {
        const res = await query("SELECT routine_name FROM information_schema.routines WHERE routine_name = 'hms_exam_pending_call'");
        console.log("FUNCTION EXISTS:", res.rows.length > 0);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
