
import { Router } from 'express';
import { ReceptionController } from '../controllers/reception.controller';

const router = Router();
const controller = new ReceptionController();

router.get('/patients', (req, res) => controller.getPatients(req, res));
router.get('/patients/:id', (req, res) => controller.getPatientById(req, res));
router.post('/patients', (req, res) => controller.createPatient(req, res));
router.put('/patients/:id', (req, res) => controller.updatePatient(req, res));
router.get('/queue', (req, res) => controller.getQueueStatus(req, res));
router.post('/queue/next', (req, res) => controller.callNextPatient(req, res));

export default router;
