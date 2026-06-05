
import { query } from '../src/config/database';

async function main() {
    try {
        const res = await query(`SELECT hrl_id, hrl_name, hrl_deptid FROM sys_room LIMIT 10`);
        console.log('--- Valid Rooms ---');
        res.rows.forEach(r => console.log(`${r.hrl_id}: ${r.hrl_name} (Dept: ${r.hrl_deptid})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
