
import { Router } from 'express';
import { CommandCenterController } from '../controllers/command_center.controller';

const router = Router();
const controller = new CommandCenterController();

// === PHÂN HỆ NGOẠI TRÚ (Outpatient) ===
router.get('/outpatient/kpi', (req, res) => controller.getOutpatientKPI(req, res));
router.get('/outpatient/flow', (req, res) => controller.getOutpatientFlow(req, res));
router.get('/outpatient/rooms', (req, res) => controller.getRoomStatus(req, res));
router.get('/outpatient/queues', (req, res) => controller.getQueueStatus(req, res));

export default router;
