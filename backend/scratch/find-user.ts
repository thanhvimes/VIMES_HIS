import { query } from '../src/config/database';

async function check() {
    try {
        const res = await query("SELECT su_userid, su_name, su_password, su_isactive FROM sys_user WHERE su_userid ILIKE '%admin%' OR su_userid = 'kkb-ksk'");
        console.log("Users found:", res.rows);
    } catch (e: any) {
        console.error("Check failed:", e.message);
    }
    process.exit(0);
}

check();
