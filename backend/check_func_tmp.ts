import { query } from './src/config/database';
async function run() {
    try {
        const res = await query("SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_examed_inspatient'");
        console.log("FUNCTION EXISTS:", res.rows.length > 0);
        if (res.rows.length > 0) {
            const def = await query("SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'get_examed_inspatient'");
            console.log("DEFINITION:", def.rows[0].routine_definition);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
