import { query } from './config/database';

async function test() {
    console.log("Starting DB query test...");
    try {
        const provRes = await query(`SELECT COUNT(*) as count FROM sys_prov`);
        console.log("sys_prov count:", provRes.rows[0].count);

        const quocTichRes = await query(`SELECT COUNT(*) as count FROM hms_quoctich`);
        console.log("hms_quoctich count:", quocTichRes.rows[0].count);

        const occupationRes = await query(`SELECT COUNT(*) as count FROM sys_sel WHERE trim(ss_id)='sys_occupation'`);
        console.log("sys_sel sys_occupation count:", occupationRes.rows[0].count);

        const ethnicRes = await query(`SELECT COUNT(*) as count FROM sys_sel WHERE trim(ss_id)='sys_ethnic'`);
        console.log("sys_sel sys_ethnic count:", ethnicRes.rows[0].count);

        const hospRes = await query(`SELECT COUNT(*) as count FROM hms_hospital`);
        console.log("hms_hospital count:", hospRes.rows[0].count);

        console.log("Fetching first province...");
        const firstProv = await query(`SELECT sp_id::text as id, sp_name as name FROM sys_prov LIMIT 1`);
        console.log("First province:", firstProv.rows);
    } catch (e: any) {
        console.error("DB Query error:", e);
    } finally {
        process.exit(0);
    }
}

test();
