
import { query } from './src/config/database';
async function run() {
    let output = "";
    
    const res = await query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'hms_patient'");
    output += "hms_patient NOT NULL columns:\n";
    res.rows.filter(r => r.is_nullable === 'NO').forEach(r => output += `  ${r.column_name}: ${r.data_type}\n`);
    
    const res2 = await query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'hms_doc'");
    output += "hms_doc NOT NULL columns:\n";
    res2.rows.filter(r => r.is_nullable === 'NO').forEach(r => output += `  ${r.column_name}: ${r.data_type}\n`);

    const res3 = await query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'hms_exam'");
    output += "hms_exam NOT NULL columns:\n";
    res3.rows.filter(r => r.is_nullable === 'NO').forEach(r => output += `  ${r.column_name}: ${r.data_type}\n`);

    process.stdout.write(output);
    process.exit(0);
}
run();
