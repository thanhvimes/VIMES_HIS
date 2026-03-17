// ==================== COMMAND CENTER ROUTES ====================
// File: backend/src/routes/command_center.routes.ts

import express from 'express';
import commandCenterController from '../controllers/command_center.controller';

const router = express.Router();

// === PHÂN HỆ NGOẠI TRÚ (Outpatient) ===
router.get('/outpatient/kpi', commandCenterController.getOutpatientKPI.bind(commandCenterController));
router.get('/outpatient/flow', commandCenterController.getOutpatientFlow.bind(commandCenterController));
router.get('/outpatient/rooms', commandCenterController.getRoomStatus.bind(commandCenterController));
router.get('/outpatient/queues', commandCenterController.getQueueStatus.bind(commandCenterController));

export default router;
