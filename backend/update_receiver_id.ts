import { query } from './src/config/database';

async function updateReceiverId() {
    await query(`UPDATE health_check_settings SET vneid_receiver_id = 'emrhub'`);
    console.log('✅ Updated vneid_receiver_id to "emrhub" in health_check_settings.');
    process.exit(0);
}

updateReceiverId();
