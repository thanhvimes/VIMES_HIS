// ==================== INSURANCE ROUTES ====================
// File: backend/src/routes/insurance.routes.ts

import express from 'express';
import insuranceController from '../controllers/insurance/insurance.controller';

const router = express.Router();

router.get('/documents', insuranceController.getDocuments.bind(insuranceController));
router.post('/documents/send', insuranceController.sendDocuments.bind(insuranceController));
router.post('/documents/sign', insuranceController.signDocuments.bind(insuranceController));

export default router;
