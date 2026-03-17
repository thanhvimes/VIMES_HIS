// ==================== SCHEDULE ROUTES ====================
// File: backend/src/routes/schedule.routes.ts

import express from 'express';
import scheduleController from '../controllers/schedule.controller';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import scheduleService from '../services/schedule.service';

const router = express.Router();

// GET /api/v1/schedule/slots
router.get('/slots', scheduleController.getAvailableSlots.bind(scheduleController));

// POST /api/v1/schedule/init
router.post('/init', authMiddleware, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    try {
        const days = (req as any).body.days || 30;
        const deptId = req.deptId;

        if (!deptId) {
            return res.status(400).json({
                success: false,
                error: 'Không xác định được khoa của user'
            });
        }

        const result = await scheduleService.initializeSlots(days, deptId);
        return res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
