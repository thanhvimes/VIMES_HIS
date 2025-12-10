
import { Router } from 'express';
import { InsuranceController } from '../controllers/insurance.controller';

const router = Router();
const controller = new InsuranceController();

router.get('/documents', (req, res) => controller.getDocuments(req, res));
router.post('/documents/send', (req, res) => controller.sendDocuments(req, res));
router.post('/documents/sign', (req, res) => controller.signDocuments(req, res));

export default router;
