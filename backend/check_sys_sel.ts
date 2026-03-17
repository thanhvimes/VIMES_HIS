
import { query } from './src/config/database';

async function check() {
    try {
        const res = await query(`SELECT ss_code, ss_desc FROM sys_sel WHERE ss_id = 'sys_ma_doituong_kcb'`);
        console.log("KCB objects:", res.rows);
        
        const res2 = await query(`SELECT ss_code, ss_desc FROM sys_sel WHERE ss_id = 'sys_object'`);
        console.log("sys_object:", res2.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
