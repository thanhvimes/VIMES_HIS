import { query } from '../src/config/database';

async function check() {
    try {
        console.log('--- CHECKING SYS_USER HSM CREDENTIALS ---');
        const userRes = await query(`
            SELECT su_userid, su_name, su_sign_userid, su_sign_partner, 
                   (su_sign_passwd IS NOT NULL AND su_sign_passwd != '') as has_passwd 
            FROM sys_user 
            WHERE su_isactive = 'Y' 
            ORDER BY su_userid
        `);
        console.table(userRes.rows);

        console.log('\n--- CHECKING HEALTH_CHECK_MASTERS SIGNATURE STATUS ---');
        const docRes = await query(`
            SELECT id, doc_no, patient_name, signature_status, signature_type, 
                   (signature IS NOT NULL AND signature != '') as has_signature,
                   updated_at
            FROM health_check_masters
            ORDER BY updated_at DESC
            LIMIT 5
        `);
        console.table(docRes.rows);

    } catch (err: any) {
        console.error('Error running check:', err.message);
    }
    process.exit(0);
}

check();
