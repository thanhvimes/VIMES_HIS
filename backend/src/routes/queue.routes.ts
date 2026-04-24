
import { Router } from 'express';
import { QueueController } from '../controllers/queue.controller';

const router = Router();

// /api/v1/queue/...
router.get('/departments', QueueController.getDepartments);
router.get('/rooms/:id', QueueController.getRoom);
router.patch('/rooms/:id', QueueController.patchRoom);
router.get('/rooms/:id/queue', QueueController.getRoomQueue);
router.post('/rooms/:id/call', QueueController.callPatient);
router.post('/kiosk/ticket', QueueController.createTicket);
router.patch('/patients/:id/status', QueueController.updatePatientStatus);

export default router;
