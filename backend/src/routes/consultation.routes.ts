
import { Router } from 'express';
import { ConsultationController } from '../controllers/consultation.controller';

const router = Router();
const controller = new ConsultationController();

router.get('/records/:patientId', (req, res) => controller.getClinicalHistory(req, res));
router.get('/record/:id', (req, res) => controller.getRecordDetail(req, res));
router.post('/records', (req, res) => controller.saveClinicalRecord(req, res));
router.post('/prescriptions', (req, res) => controller.savePrescription(req, res));

export default router;
