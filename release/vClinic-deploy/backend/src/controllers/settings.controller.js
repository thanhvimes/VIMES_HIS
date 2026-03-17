// ==========================================
// SETTINGS CONTROLLER
// ==========================================
// API endpoints for managing booking system settings

const settingsService = require('../services/settings.service');

class SettingsController {
    /**
     * GET /api/v1/settings
     * Get all settings
     */
    async getAllSettings(req, res) {
        try {
            const settings = await settingsService.getAllSettings();

            res.json({
                success: true,
                data: settings,
                count: settings.length
            });
        } catch (error) {
            console.error('Error fetching all settings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch settings',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/settings/category/:category
     * Get settings by category
     */
    async getSettingsByCategory(req, res) {
        try {
            const { category } = req.params;
            const settings = await settingsService.getSettingsByCategory(category);

            res.json({
                success: true,
                data: settings,
                category,
                count: settings.length
            });
        } catch (error) {
            console.error(`Error fetching settings for category ${req.params.category}:`, error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch settings',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/settings/:key
     * Get a single setting by key
     */
    async getSetting(req, res) {
        try {
            const { key } = req.params;
            const setting = await settingsService.getSetting(key);

            if (!setting) {
                return res.status(404).json({
                    success: false,
                    error: 'Setting not found',
                    key
                });
            }

            res.json({
                success: true,
                data: setting
            });
        } catch (error) {
            console.error(`Error fetching setting ${req.params.key}:`, error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch setting',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/settings/:key
     * Update a single setting
     */
    async updateSetting(req, res) {
        try {
            const { key } = req.params;
            const { value } = req.body;
            const updatedBy = req.user?.userId || 'system';

            if (value === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Value is required'
                });
            }

            const updated = await settingsService.updateSetting(key, value, updatedBy);

            res.json({
                success: true,
                data: updated,
                message: 'Setting updated successfully'
            });
        } catch (error) {
            console.error(`Error updating setting ${req.params.key}:`, error);
            res.status(500).json({
                success: false,
                error: 'Failed to update setting',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/settings/bulk
     * Update multiple settings at once
     */
    async updateMultipleSettings(req, res) {
        try {
            const { settings } = req.body;
            const updatedBy = req.user?.userId || 'system';

            if (!Array.isArray(settings) || settings.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Settings array is required'
                });
            }

            // Validate each setting has key and value
            for (const setting of settings) {
                if (!setting.key || setting.value === undefined) {
                    return res.status(400).json({
                        success: false,
                        error: 'Each setting must have key and value'
                    });
                }
            }

            const result = await settingsService.updateMultipleSettings(settings, updatedBy);

            res.json({
                success: true,
                data: result,
                message: `${result.updated} settings updated successfully`
            });
        } catch (error) {
            console.error('Error updating multiple settings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update settings',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/settings/reset
     * Reset settings to default values
     */
    async resetToDefaults(req, res) {
        try {
            const { category } = req.body;

            const result = await settingsService.resetToDefaults(category);

            res.json({
                success: true,
                data: result,
                message: 'Settings reset to defaults'
            });
        } catch (error) {
            console.error('Error resetting settings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reset settings',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/settings/cache/clear
     * Clear settings cache (admin only)
     */
    async clearCache(req, res) {
        try {
            settingsService.clearCache();

            res.json({
                success: true,
                message: 'Cache cleared successfully'
            });
        } catch (error) {
            console.error('Error clearing cache:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear cache',
                message: error.message
            });
        }
    }
}

module.exports = new SettingsController();
