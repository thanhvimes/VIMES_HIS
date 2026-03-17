// ==========================================
// SETTINGS ROUTES
// ==========================================
// API routes for settings management

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

// Get all settings
router.get('/', (req, res) => settingsController.getAllSettings(req, res));

// Get settings by category
router.get('/category/:category', (req, res) => settingsController.getSettingsByCategory(req, res));

// Get single setting by key
router.get('/:key', (req, res) => settingsController.getSetting(req, res));

// Update single setting
router.put('/:key', (req, res) => settingsController.updateSetting(req, res));

// Update multiple settings
router.put('/bulk/update', (req, res) => settingsController.updateMultipleSettings(req, res));

// Reset to defaults
router.post('/reset', (req, res) => settingsController.resetToDefaults(req, res));

// Clear cache (admin only)
router.post('/cache/clear', (req, res) => settingsController.clearCache(req, res));

module.exports = router;
