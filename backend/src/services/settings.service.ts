// ==========================================
// SETTINGS SERVICE
// ==========================================
// Manages all configuration settings for the online booking system

import { query } from '../config/database';

export interface Setting {
    key: string;
    value: any;
    type: string;
    category: string;
    description: string;
    isSystem: boolean;
    updatedBy?: string;
    updatedAt?: Date;
}

class SettingsService {
    private cache: Map<string, Setting>;
    private cacheTimeout: number;
    private lastCacheUpdate: number | null;
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastCacheUpdate = null;
    }

    /**
     * Lazily ensure that branding settings exist in hms_booking_settings
     */
    private async ensureDefaultSettings(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                // Ensure general_system_name
                await query(`
                    INSERT INTO hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system)
                    VALUES ('general_system_name', 'HỆ THỐNG QUẢN LÝ TỔNG THỂ BỆNH VIỆN', 'string', 'general', 'System name displayed in header and logins', true)
                    ON CONFLICT (setting_key) DO NOTHING
                `);
                // Ensure general_logo_url
                await query(`
                    INSERT INTO hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system)
                    VALUES ('general_logo_url', '', 'string', 'general', 'Hospital branding logo image URL', true)
                    ON CONFLICT (setting_key) DO NOTHING
                `);
                // Ensure general_hospital_name
                await query(`
                    INSERT INTO hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system)
                    VALUES ('general_hospital_name', 'BỆNH VIỆN K', 'string', 'general', 'Hospital name for display', true)
                    ON CONFLICT (setting_key) DO NOTHING
                `);
                // Ensure general_parent_org
                await query(`
                    INSERT INTO hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system)
                    VALUES ('general_parent_org', 'SỞ Y TẾ THÀNH PHỐ HÀ NỘI', 'string', 'general', 'Parent organization name (e.g. Sở Y tế)', true)
                    ON CONFLICT (setting_key) DO NOTHING
                `);
            } catch (e) {
                console.error('Failed to ensure default settings:', e);
            }
        })();

        return this.initPromise;
    }

    /**
     * Get core hospital details from sys_company table
     */
    async getCompanyInfo(): Promise<any> {
        // 1. Try process.env facility ID
        try {
            const facilityId = process.env.FACILITY_ID || process.env.BRANCH_ID || process.env.COMPANY_ID;
            if (facilityId) {
                const res = await query(
                    'SELECT sc_id, sc_name, sc_phone, sc_email, sc_address, sc_website, sc_pname FROM sys_company WHERE sc_id = $1',
                    [facilityId]
                );
                if (res.rows.length > 0) return res.rows[0];
            }
        } catch (e) {
            console.warn('Failed to query sys_company by facilityId:', e);
        }

        // 2. Try matching reporthost from hms_config (if exists)
        try {
            const firstRowRes = await query('SELECT * FROM sys_company LIMIT 1');
            if (firstRowRes.rows.length > 0 && 'sc_reporthost' in firstRowRes.rows[0]) {
                const resMatch = await query(`
                    SELECT sc_id, sc_name, sc_phone, sc_email, sc_address, sc_website, sc_pname 
                    FROM sys_company 
                    WHERE sc_reporthost = (SELECT reporthost FROM hms_config LIMIT 1)
                `);
                if (resMatch.rows.length > 0) return resMatch.rows[0];
            }
        } catch (e) {
            // Ignore missing columns or missing tables on this fallback path
        }


        // 3. Final fallback: return first row of sys_company
        try {
            const resFallback = await query('SELECT sc_id, sc_name, sc_phone, sc_email, sc_address, sc_website, sc_pname FROM sys_company LIMIT 1');
            if (resFallback.rows.length > 0) return resFallback.rows[0];
        } catch (e) {
            console.error('Final fallback query sys_company failed:', e);
        }

        return null;
    }

    /**
     * Get a single setting by key
     */
    async getSetting(key: string): Promise<Setting | null> {
        await this.ensureDefaultSettings();

        // Handle sys_company keys dynamically
        const companyKeys = ['general_hospital_name', 'general_parent_org', 'general_hotline', 'general_email', 'general_address', 'general_website'];
        if (companyKeys.includes(key)) {
            const company = await this.getCompanyInfo();
            if (company) {
                let value = '';
                let desc = '';
                if (key === 'general_hospital_name') {
                    value = company.sc_name || '';
                    desc = 'Hospital name for display and SMS';
                } else if (key === 'general_parent_org') {
                    value = company.sc_pname || '';
                    desc = 'Parent organization name (e.g. Sở Y tế)';
                } else if (key === 'general_hotline') {
                    value = company.sc_phone || '';
                    desc = 'Hospital hotline number';
                } else if (key === 'general_email') {
                    value = company.sc_email || '';
                    desc = 'Hospital support email';
                } else if (key === 'general_address') {
                    value = company.sc_address || '';
                    desc = 'Hospital address';
                } else if (key === 'general_website') {
                    value = company.sc_website || '';
                    desc = 'Hospital website URL';
                }

                return {
                    key,
                    value,
                    type: 'string',
                    category: 'general',
                    description: desc,
                    isSystem: true
                };
            }
        }

        // Check cache first
        if (this.cache.has(key) && !this.isCacheExpired()) {
            return this.cache.get(key) || null;
        }

        const sql = `
            SELECT setting_key, setting_value, setting_type, category, description, is_system, updated_by, updated_at
            FROM hms_booking_settings
            WHERE setting_key = $1
        `;

        const result = await query(sql, [key]);

        if (result.rows.length === 0) {
            return null;
        }

        const setting = this.parseSetting(result.rows[0]);
        this.cache.set(key, setting);

        return setting;
    }

    /**
     * Get all settings by category
     */
    async getSettingsByCategory(category: string): Promise<Setting[]> {
        await this.ensureDefaultSettings();

        const sql = `
            SELECT setting_key, setting_value, setting_type, category, description, is_system
            FROM hms_booking_settings
            WHERE category = $1
            ORDER BY setting_key
        `;

        const result = await query(sql, [category]);
        let settings = result.rows.map(row => this.parseSetting(row));

        if (category === 'general') {
            const company = await this.getCompanyInfo();
            if (company) {
                settings = settings.map(setting => {
                    if (setting.key === 'general_hospital_name') setting.value = company.sc_name || '';
                    if (setting.key === 'general_parent_org') setting.value = company.sc_pname || '';
                    if (setting.key === 'general_hotline') setting.value = company.sc_phone || '';
                    if (setting.key === 'general_email') setting.value = company.sc_email || '';
                    if (setting.key === 'general_address') setting.value = company.sc_address || '';
                    if (setting.key === 'general_website') setting.value = company.sc_website || '';
                    return setting;
                });
            }
        }

        return settings;
    }

    /**
     * Get all settings
     */
    async getAllSettings(): Promise<Setting[]> {
        await this.ensureDefaultSettings();

        const sql = `
            SELECT setting_key, setting_value, setting_type, category, description, is_system, updated_by, updated_at
            FROM hms_booking_settings
            ORDER BY category, setting_key
        `;

        const result = await query(sql);
        let settings = result.rows.map(row => this.parseSetting(row));

        const company = await this.getCompanyInfo();
        if (company) {
            settings = settings.map(setting => {
                if (setting.key === 'general_hospital_name') setting.value = company.sc_name || '';
                if (setting.key === 'general_parent_org') setting.value = company.sc_pname || '';
                if (setting.key === 'general_hotline') setting.value = company.sc_phone || '';
                if (setting.key === 'general_email') setting.value = company.sc_email || '';
                if (setting.key === 'general_address') setting.value = company.sc_address || '';
                if (setting.key === 'general_website') setting.value = company.sc_website || '';
                return setting;
            });
        }

        return settings;
    }

    /**
     * Update a single setting
     */
    async updateSetting(key: string, value: any, updatedBy: string): Promise<Setting> {
        await this.ensureDefaultSettings();
        
        const safeUpdatedBy = String(updatedBy || 'system').substring(0, 100);

        const companyKeys = ['general_hospital_name', 'general_parent_org', 'general_hotline', 'general_email', 'general_address', 'general_website'];
        if (companyKeys.includes(key)) {
            const company = await this.getCompanyInfo();
            if (company) {
                let sql = '';
                let params: any[] = [];
                if (key === 'general_hospital_name') {
                    sql = 'UPDATE sys_company SET sc_name = UPPER($1::varchar) WHERE sc_id = $2';
                    params = [value, company.sc_id];
                } else if (key === 'general_parent_org') {
                    sql = 'UPDATE sys_company SET sc_pname = $1 WHERE sc_id = $2';
                    params = [value, company.sc_id];
                } else if (key === 'general_hotline') {
                    sql = 'UPDATE sys_company SET sc_phone = $1 WHERE sc_id = $2';
                    params = [value, company.sc_id];
                } else if (key === 'general_email') {
                    sql = 'UPDATE sys_company SET sc_email = $1 WHERE sc_id = $2';
                    params = [value, company.sc_id];
                } else if (key === 'general_address') {
                    sql = 'UPDATE sys_company SET sc_address = $1 WHERE sc_id = $2';
                    params = [value, company.sc_id];
                } else if (key === 'general_website') {
                    sql = 'UPDATE sys_company SET sc_website = $1 WHERE sc_id = $2';
                    params = [value, company.sc_id];
                }
                await query(sql, params);
            }
        }

        const sql = `
            UPDATE hms_booking_settings
            SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = $3
            RETURNING *
        `;

        const stringValue = this.stringifyValue(value);
        const result = await query(sql, [stringValue, safeUpdatedBy, key]);

        if (result.rows.length === 0) {
            throw new Error(`Setting not found: ${key}`);
        }

        this.clearCache();
        return this.parseSetting(result.rows[0]);
    }

    /**
     * Update multiple settings at once
     */
    async updateMultipleSettings(settings: { key: string; value: any }[], updatedBy: string) {
        try {
            for (const setting of settings) {
                await this.updateSetting(setting.key, setting.value, updatedBy);
            }

            this.clearCache();
            return { success: true, updated: settings.length };
        } catch (error) {
            console.error('Error updating multiple settings:', error);
            throw error;
        }
    }

    /**
     * Get setting value directly (convenience method)
     */
    async getValue<T = any>(key: string, defaultValue: T | null = null): Promise<T> {
        const setting = await this.getSetting(key);
        return (setting ? setting.value : defaultValue) as T;
    }

    /**
     * Parse setting from database row
     */
    private parseSetting(row: any): Setting {
        return {
            key: row.setting_key,
            value: this.parseValue(row.setting_value, row.setting_type),
            type: row.setting_type,
            category: row.category,
            description: row.description,
            isSystem: row.is_system,
            updatedBy: row.updated_by,
            updatedAt: row.updated_at
        };
    }

    /**
     * Parse value based on type
     */
    private parseValue(value: string, type: string): any {
        switch (type) {
            case 'number':
                return parseFloat(value);
            case 'boolean':
                return value === 'true' || value === '1' || value === 't';
            case 'json':
                try {
                    return JSON.parse(value);
                } catch (e) {
                    console.error('Failed to parse JSON setting:', value);
                    return null;
                }
            case 'string':
            default:
                return value;
        }
    }

    /**
     * Stringify value for storage
     */
    private stringifyValue(value: any): string {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return String(value);
    }

    /**
     * Check if cache is expired
     */
    private isCacheExpired(): boolean {
        if (!this.lastCacheUpdate) return true;
        return Date.now() - this.lastCacheUpdate > this.cacheTimeout;
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        this.cache.clear();
        this.lastCacheUpdate = null;
    }

    /**
     * Preload all settings into cache
     */
    async preloadCache(): Promise<void> {
        const settings = await this.getAllSettings();
        settings.forEach(setting => {
            this.cache.set(setting.key, setting);
        });
        this.lastCacheUpdate = Date.now();
    }

    /**
     * Reset settings to defaults (stub)
     */
    async resetToDefaults(category?: string) {
        // Logic to reset would go here
        this.clearCache();
        return { success: true, message: 'Settings reset' };
    }
}

export default new SettingsService();
