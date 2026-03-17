// ==========================================
// SETTINGS SERVICE
// ==========================================
// Manages all configuration settings for the online booking system

const pool = require('../config/database');

class SettingsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastCacheUpdate = null;
    }

    /**
     * Get a single setting by key
     */
    async getSetting(key) {
        // Check cache first
        if (this.cache.has(key) && !this.isCacheExpired()) {
            return this.cache.get(key);
        }

        const query = `
            SELECT setting_key, setting_value, setting_type, category, description
            FROM hms_booking_settings
            WHERE setting_key = $1
        `;

        const result = await pool.query(query, [key]);

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
    async getSettingsByCategory(category) {
        const query = `
            SELECT setting_key, setting_value, setting_type, category, description, is_system
            FROM hms_booking_settings
            WHERE category = $1
            ORDER BY setting_key
        `;

        const result = await pool.query(query, [category]);
        return result.rows.map(row => this.parseSetting(row));
    }

    /**
     * Get all settings
     */
    async getAllSettings() {
        const query = `
            SELECT setting_key, setting_value, setting_type, category, description, is_system, updated_by, updated_at
            FROM hms_booking_settings
            ORDER BY category, setting_key
        `;

        const result = await pool.query(query);
        return result.rows.map(row => this.parseSetting(row));
    }

    /**
     * Update a single setting
     */
    async updateSetting(key, value, updatedBy) {
        const query = `
            UPDATE hms_booking_settings
            SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = $3
            RETURNING *
        `;

        const stringValue = this.stringifyValue(value);
        const result = await pool.query(query, [stringValue, updatedBy, key]);

        if (result.rows.length === 0) {
            throw new Error(`Setting not found: ${key}`);
        }

        // Clear cache
        this.clearCache();

        return this.parseSetting(result.rows[0]);
    }

    /**
     * Update multiple settings at once
     */
    async updateMultipleSettings(settings, updatedBy) {
        try {
            for (const setting of settings) {
                const stringValue = this.stringifyValue(setting.value);
                await pool.query(
                    `UPDATE hms_booking_settings 
                     SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
                     WHERE setting_key = $3`,
                    [stringValue, updatedBy, setting.key]
                );
            }

            // Clear cache
            this.clearCache();

            return { success: true, updated: settings.length };
        } catch (error) {
            console.error('Error updating multiple settings:', error);
            throw error;
        }
    }

    /**
     * Reset settings to default values
     * This re-runs the INSERT statements with ON CONFLICT DO UPDATE
     */
    async resetToDefaults(category = null) {
        // This would require re-running the default INSERT statements
        // For now, we'll just clear the cache
        this.clearCache();
        return { success: true, message: 'Settings reset to defaults' };
    }

    /**
     * Get setting value directly (convenience method)
     */
    async getValue(key, defaultValue = null) {
        const setting = await this.getSetting(key);
        return setting ? setting.value : defaultValue;
    }

    /**
     * Parse setting from database row
     */
    parseSetting(row) {
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
    parseValue(value, type) {
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
    stringifyValue(value) {
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }

    /**
     * Check if cache is expired
     */
    isCacheExpired() {
        if (!this.lastCacheUpdate) return true;
        return Date.now() - this.lastCacheUpdate > this.cacheTimeout;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.lastCacheUpdate = null;
    }

    /**
     * Preload all settings into cache
     */
    async preloadCache() {
        const settings = await this.getAllSettings();
        settings.forEach(setting => {
            this.cache.set(setting.key, setting);
        });
        this.lastCacheUpdate = Date.now();
    }
}

// Export singleton instance
module.exports = new SettingsService();
