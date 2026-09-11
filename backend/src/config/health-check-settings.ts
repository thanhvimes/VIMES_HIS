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
    ma_cskcb_byt?: string;
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
    vneid_receiver_id?: string;
    signature_type?: 'USB' | 'HSM';
    hsm_url?: string;
    hsm_provider?: string;
    hsm_username?: string;
    hsm_password?: string;
    hsm_client_id?: string;
    hsm_client_secret?: string;
    sync_target_mode?: 'BYT_ONLY' | 'BOTH' | 'SYT_ONLY';
    syt_url?: string;
    syt_username?: string;
    syt_password?: string;
    syt_receiver_id?: string;
    syt_enabled?: boolean;
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
        const result = await query(
            `SELECT id, vneid_url, vneid_username, vneid_password, ma_cskcb, ma_cskcb_byt, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval, barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type, allow_unsigned_sync, barcode_zpl_template_xn, barcode_zpl_template_ksk, barcode_printer_name, use_qz_tray, vneid_private_key, vneid_public_key, vneid_receiver_id, signature_type, hsm_url, hsm_provider, hsm_username, hsm_password, hsm_client_id, hsm_client_secret, sync_target_mode, syt_url, syt_username, syt_password, syt_receiver_id, syt_enabled FROM health_check_settings ORDER BY id ASC LIMIT 1`
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
                    decryptedPassword = rawPassword;
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
                    decryptedPrivateKey = rawPrivateKey;
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

            const rawSytPassword = row.syt_password || '';
            let decryptedSytPassword = '';
            if (rawSytPassword) {
                try {
                    if (SecurityUtils.isEncrypted(rawSytPassword)) {
                        decryptedSytPassword = SecurityUtils.resolveSecret(rawSytPassword);
                    } else {
                        decryptedSytPassword = SecurityUtils.decrypt(rawSytPassword);
                    }
                } catch (e) {
                    decryptedSytPassword = rawSytPassword;
                }
            }

            globalHealthCheckSettings = {
                ...row,
                sync_target_mode: row.sync_target_mode || 'BYT_ONLY',
                syt_url: row.syt_url || 'https://api-hssk.hanoi.gov.vn',
                syt_receiver_id: row.syt_receiver_id || 'VTS',
                vneid_password: decryptedPassword,
                vneid_private_key: decryptedPrivateKey,
                hsm_password: decryptedHsmPassword,
                hsm_client_secret: decryptedHsmClientSecret,
                syt_password: decryptedSytPassword
            };
            console.log(`✅ Health Check Sync Settings loaded into memory (Facility: ${row.ma_cskcb}, Mode: ${row.sync_target_mode || 'BYT_ONLY'})`);
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
