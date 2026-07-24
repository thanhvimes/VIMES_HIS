import { query } from './src/config/database';

async function checkDbSettings() {
    const res = await query(`SELECT * FROM health_check_settings`);
    console.log('ALL DB SETTINGS ROWS:');
    console.log(res.rows);
    process.exit(0);
}

checkDbSettings();
