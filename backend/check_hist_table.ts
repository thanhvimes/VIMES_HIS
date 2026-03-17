import { query } from './src/config/database';
async function run() {
    try {
        const res = await query("SELECT table_name FROM information_schema.tables WHERE table_name = 'hms_disease_hist'");
        console.log("TABLE EXISTS:", res.rows.length > 0);
        if (res.rows.length > 0) {
            const cols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_disease_hist'");
            console.log("COLUMNS:", cols.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
