import { query } from './src/config/database';

async function restoreSandboxUrl() {
    await query(`UPDATE health_check_settings SET vneid_url = 'https://api-sandbox.emrhub.vn/api/v1', vneid_receiver_id = 'emrhub'`);
    console.log('✅ Restored vneid_url to "https://api-sandbox.emrhub.vn/api/v1" in health_check_settings.');
    process.exit(0);
}

restoreSandboxUrl();
