
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_doc' AND is_nullable = 'NO'");
    console.log("hms_doc NOT NULL:");
    res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    
    const res2 = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_exam' AND is_nullable = 'NO'");
    console.log("hms_exam NOT NULL:");
    res2.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    process.exit(0);
}
run();
