import { query } from './src/config/database';
import SecurityUtils from './src/utils/security';
import { loadHealthCheckSettings } from './src/config/health-check-settings';

async function setSandboxUrl() {
    try {
        const encryptedPass = SecurityUtils.encrypt('Abc@1234');
        await query(`
            UPDATE health_check_settings
            SET vneid_url = 'https://api-sandbox.emrhub.vn/api',
                vneid_username = '8934285008135_api',
                vneid_password = $1,
                ma_cskcb = '8934285008135',
                ma_gtin_cskcb = '8934285008135'
        `, [encryptedPass]);

        await loadHealthCheckSettings();
        console.log('✅ Updated vneid_url to https://api-sandbox.emrhub.vn/api');
    } catch (e: any) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

setSandboxUrl();
