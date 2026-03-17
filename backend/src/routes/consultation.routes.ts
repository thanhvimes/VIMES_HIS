// ==================== CONSULTATION ROUTES ====================
// File: backend/src/routes/consultation.routes.ts

import express from 'express';
import consultationController from '../controllers/consultation.controller';
import authMiddleware, { requirePermission } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/records/:patientId', authMiddleware, requirePermission('02.05'), consultationController.getClinicalHistory.bind(consultationController));
router.get('/patient-profile/:patientId', authMiddleware, consultationController.getPatientProfile.bind(consultationController));
router.get('/record/:id', authMiddleware, consultationController.getRecordDetail.bind(consultationController));
router.get('/check-insurance', authMiddleware, consultationController.checkInsuranceRules.bind(consultationController));
router.post('/call-patient', authMiddleware, consultationController.callPatient.bind(consultationController));
router.get('/print/:docNo', authMiddleware, consultationController.printExamination.bind(consultationController));
router.get('/prehistory/:patientId', authMiddleware, consultationController.getDiseaseHistory.bind(consultationController));
router.post('/prehistory/:patientId', authMiddleware, consultationController.saveDiseaseHistory.bind(consultationController));
router.post('/records', authMiddleware, requirePermission('02.01'), consultationController.saveClinicalRecord.bind(consultationController));
router.post('/prescriptions', authMiddleware, requirePermission('02.01'), consultationController.savePrescription.bind(consultationController));
router.get('/drugs/search', authMiddleware, consultationController.searchDrugs.bind(consultationController));
router.get('/prescriptions/history/:docNo', authMiddleware, consultationController.getPrescriptionHistory.bind(consultationController));

// CLS (Paraclinical Services)
router.get('/services/catalog', authMiddleware, consultationController.getServiceCatalog.bind(consultationController));
router.post('/services/order', authMiddleware, requirePermission('02.01'), consultationController.saveServiceOrder.bind(consultationController));
router.get('/services/history/:docNo', authMiddleware, consultationController.getServiceHistory.bind(consultationController));

// Operations (PT/TT)
router.get('/operations/catalog', authMiddleware, consultationController.getOperationCatalog.bind(consultationController));
router.get('/operations/history/:docNo', authMiddleware, consultationController.getOperations.bind(consultationController));
router.post('/operations', authMiddleware, requirePermission('02.01'), consultationController.saveOperation.bind(consultationController));
router.delete('/operations/:id', authMiddleware, requirePermission('02.01'), consultationController.deleteOperation.bind(consultationController));
router.get('/operations/print/:id', authMiddleware, consultationController.printOperation.bind(consultationController));

// Queue
router.get('/queue', authMiddleware, consultationController.getExamQueue.bind(consultationController));
router.get('/rooms', authMiddleware, consultationController.getRooms.bind(consultationController));

// Fees
router.get('/fees/history/:docNo', authMiddleware, consultationController.getFees.bind(consultationController));
router.get('/fees/print/:docNo', authMiddleware, consultationController.printFees.bind(consultationController));

export default router;
