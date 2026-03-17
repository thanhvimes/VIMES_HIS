// ==================== ROOM ROUTES ====================
// File: backend/src/routes/room.routes.ts

import express from 'express';
import roomController from '../controllers/room.controller';

const router = express.Router();

// ==================== CẤU HÌNH LỊCH KHÁM ====================
router.get('/room-schedules', roomController.getSchedules.bind(roomController));
router.get('/room-schedules/:deptId/:roomId', roomController.getScheduleByRoom.bind(roomController));
router.post('/room-schedules', roomController.upsertSchedule.bind(roomController));
router.delete('/room-schedules/:deptId/:roomId/:type', roomController.deleteSchedule.bind(roomController));

export default router;
