// ==================== HEALTH CHECK SETTINGS LOADER ====================
// File: backend/src/config/health-check-settings.ts

import { query } from './database';
import SecurityUtils from '../utils/security';

export interface HealthCheckSettings {
    id: number;
    vneid_url: string;
    vneid_username: string;
    vneid_password?: string;
    ma_cskcb: string;
    ma_gtin_cskcb: string;
    auto_sync_enabled: boolean;
    auto_sync_interval: number;
    barcode_label_size_xn?: string;
    barcode_label_size_ksk?: string;
    barcode_show_hospital?: boolean;
    barcode_show_date?: boolean;
    barcode_show_sample_type?: boolean;
    allow_unsigned_sync?: boolean;
    barcode_zpl_template_xn?: string;
    barcode_zpl_template_ksk?: string;
    barcode_printer_name?: string;
    use_qz_tray?: boolean;
    vneid_private_key?: string;
    vneid_public_key?: string;
    signature_type?: 'USB' | 'HSM';
    hsm_url?: string;
    hsm_provider?: string;
    hsm_username?: string;
    hsm_password?: string;
    hsm_client_id?: string;
    hsm_client_secret?: string;
    created_at?: Date;
    updated_at?: Date;
}

// Global cached settings in memory
let globalHealthCheckSettings: HealthCheckSettings | null = null;

/**
 * Loads health check VNeID settings from the database into memory.
 * Decrypts the VNeID password using SecurityUtils.
 */
export async function loadHealthCheckSettings(): Promise<HealthCheckSettings | null> {
    try {
        // Ensure columns exist in DB dynamically
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS vneid_private_key text`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS vneid_public_key text`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS signature_type varchar(20) DEFAULT 'HSM'`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS hsm_url varchar(255) DEFAULT 'http://vimes.xyz:8091'`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS hsm_provider varchar(50) DEFAULT 'VNPT-CA'`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS hsm_username varchar(100)`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS hsm_password text`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS hsm_client_id varchar(100)`);
        await query(`ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS hsm_client_secret text`);

        const result = await query(
            `SELECT id, vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval, barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type, allow_unsigned_sync, barcode_zpl_template_xn, barcode_zpl_template_ksk, barcode_printer_name, use_qz_tray, vneid_private_key, vneid_public_key, signature_type, hsm_url, hsm_provider, hsm_username, hsm_password, hsm_client_id, hsm_client_secret FROM health_check_settings LIMIT 1`
        );

        if (result.rows.length > 0) {
            const row = result.rows[0];
            const rawPassword = row.vneid_password || '';
            let decryptedPassword = '';
            if (rawPassword) {
                try {
                    if (SecurityUtils.isEncrypted(rawPassword)) {
                        decryptedPassword = SecurityUtils.resolveSecret(rawPassword);
                    } else {
                        decryptedPassword = SecurityUtils.decrypt(rawPassword);
                    }
                } catch (e) {
                    console.warn('⚠️ Fallback decryption failed, using resolveSecret:', e);
                    decryptedPassword = SecurityUtils.resolveSecret(rawPassword);
                }
            }

            const rawPrivateKey = row.vneid_private_key || '';
            let decryptedPrivateKey = '';
            if (rawPrivateKey) {
                try {
                    if (SecurityUtils.isEncrypted(rawPrivateKey)) {
                        decryptedPrivateKey = SecurityUtils.resolveSecret(rawPrivateKey);
                    } else {
                        decryptedPrivateKey = SecurityUtils.decrypt(rawPrivateKey);
                    }
                } catch (e) {
                    console.warn('⚠️ Private key decryption failed:', e);
                    decryptedPrivateKey = SecurityUtils.resolveSecret(rawPrivateKey);
                }
            }

            const rawHsmPassword = row.hsm_password || '';
            let decryptedHsmPassword = '';
            if (rawHsmPassword) {
                try {
                    if (SecurityUtils.isEncrypted(rawHsmPassword)) {
                        decryptedHsmPassword = SecurityUtils.resolveSecret(rawHsmPassword);
                    } else {
                        decryptedHsmPassword = SecurityUtils.decrypt(rawHsmPassword);
                    }
                } catch (e) {
                    decryptedHsmPassword = rawHsmPassword;
                }
            }

            const rawHsmClientSecret = row.hsm_client_secret || '';
            let decryptedHsmClientSecret = '';
            if (rawHsmClientSecret) {
                try {
                    if (SecurityUtils.isEncrypted(rawHsmClientSecret)) {
                        decryptedHsmClientSecret = SecurityUtils.resolveSecret(rawHsmClientSecret);
                    } else {
                        decryptedHsmClientSecret = SecurityUtils.decrypt(rawHsmClientSecret);
                    }
                } catch (e) {
                    decryptedHsmClientSecret = rawHsmClientSecret;
                }
            }

            globalHealthCheckSettings = {
                ...row,
                vneid_password: decryptedPassword,
                vneid_private_key: decryptedPrivateKey,
                hsm_password: decryptedHsmPassword,
                hsm_client_secret: decryptedHsmClientSecret
            };
            console.log(`✅ Health Check Sync Settings loaded into memory (Facility: ${row.ma_cskcb})`);
            return globalHealthCheckSettings;
        }
        console.warn('⚠️ No Health Check settings found in database settings table.');
        return null;
    } catch (error) {
        console.error('❌ Failed to load Health Check settings:', error);
        return null;
    }
}

/**
 * Retrieves cached settings from memory without querying the database.
 */
export function getHealthCheckSettings(): HealthCheckSettings | null {
    return globalHealthCheckSettings;
}
