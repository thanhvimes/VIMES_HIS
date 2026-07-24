import { query } from './src/config/database';

async function setSandboxUrl() {
    const res = await query(`UPDATE health_check_settings SET vneid_url = 'https://api-sandbox.emrhub.vn/api/v1', vneid_receiver_id = 'emrhub' RETURNING vneid_url, vneid_receiver_id`);
    console.log('✅ DB Updated:', res.rows[0]);
    process.exit(0);
}

setSandboxUrl();
