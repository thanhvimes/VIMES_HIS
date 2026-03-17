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

    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastCacheUpdate = null;
    }

    /**
     * Get a single setting by key
     */
    async getSetting(key: string): Promise<Setting | null> {
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
        const sql = `
            SELECT setting_key, setting_value, setting_type, category, description, is_system
            FROM hms_booking_settings
            WHERE category = $1
            ORDER BY setting_key
        `;

        const result = await query(sql, [category]);
        return result.rows.map(row => this.parseSetting(row));
    }

    /**
     * Get all settings
     */
    async getAllSettings(): Promise<Setting[]> {
        const sql = `
            SELECT setting_key, setting_value, setting_type, category, description, is_system, updated_by, updated_at
            FROM hms_booking_settings
            ORDER BY category, setting_key
        `;

        const result = await query(sql);
        return result.rows.map(row => this.parseSetting(row));
    }

    /**
     * Update a single setting
     */
    async updateSetting(key: string, value: any, updatedBy: string): Promise<Setting> {
        const sql = `
            UPDATE hms_booking_settings
            SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = $3
            RETURNING *
        `;

        const stringValue = this.stringifyValue(value);
        const result = await query(sql, [stringValue, updatedBy, key]);

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
                const stringValue = this.stringifyValue(setting.value);
                await query(
                    `UPDATE hms_booking_settings 
                     SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
                     WHERE setting_key = $3`,
                    [stringValue, updatedBy, setting.key]
                );
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
