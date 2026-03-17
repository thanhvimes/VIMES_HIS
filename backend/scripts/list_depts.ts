
import { query } from '../src/config/database';

async function main() {
    try {
        const res = await query(`SELECT sd_id, sd_name FROM sys_dept LIMIT 10`);
        console.log('--- Valid Departments ---');
        res.rows.forEach(r => console.log(`${r.sd_id}: ${r.sd_name}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
