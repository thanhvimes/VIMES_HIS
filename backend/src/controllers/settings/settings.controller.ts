// ==========================================
// SETTINGS CONTROLLER
// File: backend/src/controllers/settings.controller.ts
// ==========================================

import { Request, Response } from 'express';
import settingsService from '../../services/settings.service';
import { AuthRequest } from '../../middleware/authMiddleware';

class SettingsController {
    /**
     * GET /api/v1/settings
     */
    async getAllSettings(req: Request, res: Response) {
        try {
            const settings = await settingsService.getAllSettings();

            return res.json({
                success: true,
                data: settings,
                count: settings.length
            });
        } catch (error: any) {
            console.error('Error fetching all settings:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch settings',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/settings/category/:category
     */
    async getSettingsByCategory(req: Request, res: Response) {
        try {
            const { category } = (req as any).params;
            const settings = await settingsService.getSettingsByCategory(category as string);

            return res.json({
                success: true,
                data: settings,
                category,
                count: settings.length
            });
        } catch (error: any) {
            console.error(`Error fetching settings for category ${(req as any).params.category}:`, error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch settings',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/settings/:key
     */
    async getSetting(req: Request, res: Response) {
        try {
            const { key } = (req as any).params;
            const setting = await settingsService.getSetting(key as string);

            if (!setting) {
                return res.status(404).json({
                    success: false,
                    error: 'Setting not found',
                    key
                });
            }

            return res.json({
                success: true,
                data: setting
            });
        } catch (error: any) {
            console.error(`Error fetching setting ${(req as any).params.key}:`, error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch setting',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/settings/:key
     */
    async updateSetting(req: AuthRequest, res: Response) {
        try {
            const { key } = (req as any).params;
            const { value } = (req as any).body;
            const updatedBy = req.userId || 'system';

            if (value === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Value is required'
                });
            }

            const updated = await settingsService.updateSetting(key as string, value, String(updatedBy));

            return res.json({
                success: true,
                data: updated,
                message: 'Setting updated successfully'
            });
        } catch (error: any) {
            console.error(`Error updating setting ${(req as any).params.key}:`, error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update setting',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/settings/bulk
     */
    async updateMultipleSettings(req: AuthRequest, res: Response) {
        try {
            const { settings } = (req as any).body;
            const updatedBy = (req as any).user?.userId || req.userId || 'system';

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

            const result = await settingsService.updateMultipleSettings(settings as any[], String(updatedBy));

            return res.json({
                success: true,
                data: result,
                message: `${result.updated} settings updated successfully`
            });
        } catch (error: any) {
            console.error('Error updating multiple settings:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update settings',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/settings/reset
     */
    async resetToDefaults(req: Request, res: Response) {
        try {
            const { category } = (req as any).body;
            const result = await settingsService.resetToDefaults(category as string);

            return res.json({
                success: true,
                data: result,
                message: 'Settings reset to defaults'
            });
        } catch (error: any) {
            console.error('Error resetting settings:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to reset settings',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/settings/cache/clear
     */
    async clearCache(req: Request, res: Response) {
        try {
            settingsService.clearCache();
            return res.json({
                success: true,
                message: 'Cache cleared successfully'
            });
        } catch (error: any) {
            console.error('Error clearing cache:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to clear cache',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/settings/company-info
     * Returns hospital info directly from SYS_COMPANY table
     */
    async getCompanyInfo(req: Request, res: Response) {
        try {
            const company = await settingsService.getCompanyInfo();
            if (!company) {
                return res.status(404).json({
                    success: false,
                    error: 'No company information found in SYS_COMPANY'
                });
            }
            return res.json({
                success: true,
                data: {
                    id: company.sc_id,
                    hospitalName: company.sc_name || '',
                    parentOrg: company.sc_pname || '',
                    address: company.sc_address || '',
                    phone: company.sc_phone || '',
                    email: company.sc_email || '',
                    website: company.sc_website || '',
                    logoUrl: company.sc_logo || '',
                }
            });
        } catch (error: any) {
            console.error('Error fetching company info:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch company info',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/settings/company-info/logo
     * Updates hospital logo in SYS_COMPANY table
     */
    async updateCompanyLogo(req: Request, res: Response) {
        try {
            const { logoUrl } = req.body;
            if (logoUrl === undefined) {
                return res.status(400).json({ success: false, error: 'logoUrl is required' });
            }

            const success = await settingsService.updateCompanyLogo(logoUrl);
            if (!success) {
                return res.status(500).json({ success: false, error: 'Failed to update logo' });
            }

            return res.json({
                success: true,
                message: 'Company logo updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating company logo:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update company logo',
                message: error.message
            });
        }
    }
}

export default new SettingsController();
