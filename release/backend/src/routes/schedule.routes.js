// ==================== SCHEDULE ROUTES ====================
// File: backend/src/routes/schedule.routes.js

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

const scheduleService = require('../services/schedule.service');

// GET /api/v1/schedule/slots?deptId=KB&roomId=65&date=2026-01-21
router.get('/slots', (req, res) => scheduleController.getAvailableSlots(req, res));

// POST /api/v1/schedule/init
router.post('/init', async (req, res, next) => {
    try {
        const result = await scheduleService.initializeSlots(req.body.days || 30);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
