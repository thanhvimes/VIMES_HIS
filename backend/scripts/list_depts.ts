
import { query } from '../src/config/database';

async function main() {
    try {
        const res = await query(`SELECT sd_type, count(*) as count FROM sys_dept GROUP BY sd_type`);
        console.log('--- Department Types ---');
        res.rows.forEach(r => console.log(`${r.sd_type}: ${r.count}`));
        
        const res2 = await query(`SELECT sd_id, sd_name, sd_type FROM sys_dept WHERE sd_type = 'D' LIMIT 5`);
        console.log('--- Departments with sd_type = D ---');
        res2.rows.forEach(r => console.log(`${r.sd_id}: ${r.sd_name} (${r.sd_type})`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
