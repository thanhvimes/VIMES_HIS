// ==================== HEALTH CHECK ROUTES ====================
// File: backend/src/routes/health-check.routes.ts

import express from 'express';
import healthCheckController from '../controllers/health-check/health-check.controller';

const router = express.Router();

// CRUD Endpoints
router.get('/documents', healthCheckController.getDocuments.bind(healthCheckController));
router.get('/documents/:id', healthCheckController.getDocumentById.bind(healthCheckController));
router.post('/documents', healthCheckController.createDocument.bind(healthCheckController));
router.put('/documents/:id', healthCheckController.updateDocument.bind(healthCheckController));
router.delete('/documents/:id', healthCheckController.deleteDocument.bind(healthCheckController));

// Batch Operations
router.post('/documents/send', healthCheckController.sendDocuments.bind(healthCheckController));
router.post('/documents/sign', healthCheckController.signDocuments.bind(healthCheckController));
router.post('/documents/create-mock', healthCheckController.createMockDocuments.bind(healthCheckController));
router.get('/his-patient/:identifier', healthCheckController.getHisPatient.bind(healthCheckController));

export default router;
