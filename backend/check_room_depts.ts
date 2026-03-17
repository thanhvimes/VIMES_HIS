
import { query } from './src/config/database';
async function run() {
    const res = await query("SELECT DISTINCT hrl_deptid FROM hms_roomlist");
    console.log(res.rows);
    process.exit(0);
}
run();
