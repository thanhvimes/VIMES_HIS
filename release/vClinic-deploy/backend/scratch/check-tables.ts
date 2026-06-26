import { query } from '../src/config/database';

async function check() {
    try {
        const resMasters = await query("SELECT count(*) FROM health_check_masters");
        console.log("health_check_masters rows count:", resMasters.rows[0].count);
    } catch (e: any) {
        console.error("health_check_masters check failed:", e.message);
    }
    try {
        const resDetails = await query("SELECT count(*) FROM health_check_details");
        console.log("health_check_details rows count:", resDetails.rows[0].count);
    } catch (e: any) {
        console.error("health_check_details check failed:", e.message);
    }
    process.exit(0);
}

check();
