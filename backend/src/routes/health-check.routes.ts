import express from 'express';
import { query } from '../config/database';
import healthCheckController from '../controllers/health-check/health-check.controller';
import { contractsController } from '../controllers/health-check/contracts.controller';
import { employeesController } from '../controllers/health-check/employees.controller';
import { servicesController } from '../controllers/health-check/services.controller';
import { receptionController } from '../controllers/health-check/reception.controller';
import { sampleTrackingController } from '../controllers/health-check/sample-tracking';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Apply authMiddleware globally to all health-check routes
router.use(authMiddleware);

// CRUD Endpoints (Health Check Documents)
router.get('/documents', healthCheckController.getDocuments.bind(healthCheckController));
router.get('/documents/:id', healthCheckController.getDocumentById.bind(healthCheckController));
router.post('/documents', healthCheckController.createDocument.bind(healthCheckController));
router.put('/documents/:id', healthCheckController.updateDocument.bind(healthCheckController));
router.delete('/documents/:id', healthCheckController.deleteDocument.bind(healthCheckController));

// Batch Operations
router.post('/documents/send', healthCheckController.sendDocuments.bind(healthCheckController));
router.post('/documents/sign', healthCheckController.signDocuments.bind(healthCheckController));
router.post('/documents/:id/unlock', healthCheckController.unlockDocument.bind(healthCheckController));
router.post('/documents/seed-from-his', healthCheckController.seedFromHis.bind(healthCheckController));
router.post('/documents/mark-printed', healthCheckController.markBarcodePrinted.bind(healthCheckController));
router.get('/his-patient/:identifier', healthCheckController.getHisPatient.bind(healthCheckController));
router.get('/signatures', healthCheckController.getDoctorSignatures.bind(healthCheckController));
router.post('/signatures', healthCheckController.getDoctorSignatures.bind(healthCheckController));

// Contracts Endpoint
router.get('/contracts', contractsController.getContracts.bind(contractsController));
router.post('/contracts', contractsController.createContract.bind(contractsController));
router.put('/contracts/:id', contractsController.updateContract.bind(contractsController));
router.put('/contracts/:id/status', contractsController.updateContractStatus.bind(contractsController));
router.delete('/contracts/:id', contractsController.deleteContract.bind(contractsController));
router.get('/contracts/:id/employees', employeesController.getContractEmployees.bind(employeesController));
router.post('/contracts/:id/employees/import', employeesController.importEmployees.bind(employeesController));
router.delete('/employees/:id', employeesController.deleteEmployee.bind(employeesController));
router.post('/employees', employeesController.createEmployee.bind(employeesController));

// Contract Services & Fee Catalog routes
router.get('/contracts/:id/services', contractsController.getContractServices.bind(contractsController));
router.post('/contracts/:id/services', contractsController.addContractServices.bind(contractsController));
router.put('/contracts/:id/services/:serviceId', contractsController.updateContractService.bind(contractsController));
router.delete('/contracts/:id/services/:serviceId', contractsController.deleteContractService.bind(contractsController));
router.get('/service-groups', servicesController.getServiceGroups.bind(servicesController));
router.get('/service-groups/:groupId/services', servicesController.getServicesByGroup.bind(servicesController));
router.get('/services/search', servicesController.searchAvailableServices.bind(servicesController));

// Settings Config Endpoints
router.get('/settings', contractsController.getSettings.bind(contractsController));
router.get('/settings/partners', contractsController.getSigningPartners.bind(contractsController));
router.put('/settings', contractsController.updateSettings.bind(contractsController));
router.post('/settings/test-connection', contractsController.testConnection.bind(contractsController));


// Reception & CCCD search endpoints
router.get('/reception/search', receptionController.searchEmployeeByCard.bind(receptionController));
router.post('/reception/receive', receptionController.receiveContractEmployee.bind(receptionController));
router.get('/reception/rooms', receptionController.getReceptionRooms.bind(receptionController));
router.get('/reception/exam-fees', receptionController.getExamFees.bind(receptionController));
router.put('/reception/employee/:id', receptionController.updateEmployee.bind(receptionController));

// Sample Tracking endpoints
router.get('/samples/slips', sampleTrackingController.getSampleSlips.bind(sampleTrackingController));
router.get('/samples/slips/:slipId/patients', sampleTrackingController.getSampleSlipPatients.bind(sampleTrackingController));
router.get('/samples/orders/:orderId/items', sampleTrackingController.getPatientTestDetails.bind(sampleTrackingController));
router.get('/samples/cancelled', sampleTrackingController.getCancelledSamples.bind(sampleTrackingController));
router.post('/samples/receive', sampleTrackingController.confirmSampleReceipt.bind(sampleTrackingController));
router.post('/samples/cancel', sampleTrackingController.cancelSampleReceipt.bind(sampleTrackingController));


export default router;
