const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

// ==================== CẤU HÌNH LỊCH KHÁM ====================
router.get('/room-schedules', roomController.getSchedules);
router.get('/room-schedules/:deptId/:roomId', roomController.getScheduleByRoom);
router.post('/room-schedules', roomController.upsertSchedule);
router.delete('/room-schedules/:deptId/:roomId/:type', roomController.deleteSchedule);

module.exports = router;
