// ==========================================
// SETTINGS ROUTES
// File: backend/src/routes/settings.routes.ts
// ==========================================

import express from 'express';
import settingsController from '../controllers/settings/settings.controller';

const router = express.Router();

// Get all settings
router.get('/', settingsController.getAllSettings.bind(settingsController));

// Get settings by category
router.get('/category/:category', settingsController.getSettingsByCategory.bind(settingsController));

// Get company info directly from SYS_COMPANY table
router.get('/company-info', settingsController.getCompanyInfo.bind(settingsController));

// Update company logo in SYS_COMPANY table
router.put('/company-info/logo', settingsController.updateCompanyLogo.bind(settingsController));

// Get single setting by key
router.get('/:key', settingsController.getSetting.bind(settingsController));

// Update single setting
router.put('/:key', settingsController.updateSetting.bind(settingsController));

// Update multiple settings (fixed path for consistency)
router.put('/bulk/update', settingsController.updateMultipleSettings.bind(settingsController));

// Reset to defaults
router.post('/reset', settingsController.resetToDefaults.bind(settingsController));

// Clear cache (admin only)
router.post('/cache/clear', settingsController.clearCache.bind(settingsController));

export default router;
