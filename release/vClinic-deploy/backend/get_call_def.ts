import { query } from './src/config/database';
async function run() {
    try {
        const res = await query("SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'hms_exam_pending_call'");
        if (res.rows.length > 0) {
            console.log("DEFINITION:", res.rows[0].routine_definition);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
