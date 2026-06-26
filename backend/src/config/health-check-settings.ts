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
            `SELECT id, vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval, barcode_label_size_xn, barcode_label_size_ksk, barcode_show_hospital, barcode_show_date, barcode_show_sample_type, allow_unsigned_sync FROM health_check_settings LIMIT 1`
        );

        if (result.rows.length > 0) {
            const row = result.rows[0];
            const rawPassword = row.vneid_password || '';
            const decryptedPassword = SecurityUtils.resolveSecret(rawPassword);

            globalHealthCheckSettings = {
                ...row,
                vneid_password: decryptedPassword
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
