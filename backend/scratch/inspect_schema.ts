import { query } from './src/config/database';
async function run() {
    const r = await query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('hms_bed', 'hms_operation', 'hms_lis_sample', 'hms_pacs_sample') ORDER BY table_name, ordinal_position");
    console.log(JSON.stringify(r.rows, null, 2));
    process.exit(0);
}
run();
