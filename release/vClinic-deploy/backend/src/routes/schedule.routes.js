// ==================== SCHEDULE ROUTES ====================
// File: backend/src/routes/schedule.routes.js

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const scheduleService = require('../services/schedule.service');

// GET /api/v1/schedule/slots?deptId=KB&roomId=65&date=2026-01-21
router.get('/slots', (req, res) => scheduleController.getAvailableSlots(req, res));

// POST /api/v1/schedule/init
// Body: { "days": 30 }
// Sử dụng deptId từ user đăng nhập
router.post('/init', authMiddleware, async (req, res, next) => {
    try {
        const days = req.body.days || 30;
        const deptId = req.deptId; // Lấy từ token của user đăng nhập

        if (!deptId) {
            return res.status(400).json({
                success: false,
                error: 'Không xác định được khoa của user'
            });
        }

        console.log(`[Schedule Init] User's deptId: ${deptId}, days: ${days}`);
        const result = await scheduleService.initializeSlots(days, deptId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
