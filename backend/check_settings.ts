import { query } from './src/config/database';

async function checkSettings() {
    const res = await query(`SELECT vneid_receiver_id, vneid_url, vneid_username, ma_cskcb FROM health_check_settings LIMIT 1`);
    console.log('Settings in DB:', res.rows[0]);
    process.exit(0);
}

checkSettings();
