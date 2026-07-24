import { query } from '../backend/src/config/database.ts';
import fs from 'fs';

async function main() {
    try {
        const res = await query('SELECT ma_cskcb, vneid_url, vneid_username, vneid_private_key FROM health_check_sync_settings LIMIT 1');
        console.log('SETTINGS RESULT:');
        if (res.rows.length > 0) {
            const row = res.rows[0];
            console.log('ma_cskcb:', row.ma_cskcb);
            console.log('vneid_url:', row.vneid_url);
            console.log('vneid_username:', row.vneid_username);
            console.log('has_private_key:', !!row.vneid_private_key);
            if (row.vneid_private_key) {
                fs.writeFileSync('./scratch/real_private_key.pem', row.vneid_private_key, 'utf8');
                console.log('Saved real private key to scratch/real_private_key.pem');
            }
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

main();
