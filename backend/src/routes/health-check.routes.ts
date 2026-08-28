import express from 'express';
import { query } from '../config/database';
import healthCheckController from '../controllers/health-check/health-check.controller';
import { contractsController } from '../controllers/health-check/contracts.controller';
import { employeesController } from '../controllers/health-check/employees.controller';
import { servicesController } from '../controllers/health-check/services.controller';
import { receptionController } from '../controllers/health-check/reception.controller';
import { sampleTrackingController } from '../controllers/health-check/sample-tracking';
import { orderController } from '../controllers/health-check/order.controller';
import authMiddleware from '../middleware/authMiddleware';
import { signPdfViaVimesSigningServer } from '../services/vimes-signing.service';
import crypto from 'node:crypto';
import { healthCheckXmlDsigService } from '../services/health-check-xmldsig.service';

const router = express.Router();

// Apply authMiddleware globally to all health-check routes
router.use(authMiddleware);

// CRUD Endpoints (Health Check Documents)
router.get('/documents', healthCheckController.getDocuments.bind(healthCheckController));
router.get('/documents/:id', healthCheckController.getDocumentById.bind(healthCheckController));
router.post('/documents', healthCheckController.createDocument.bind(healthCheckController));
router.put('/documents/:id', healthCheckController.updateDocument.bind(healthCheckController));
router.delete('/documents/:id', healthCheckController.deleteDocument.bind(healthCheckController));

let fallbackPrivateKey: string | null = null;
function getAgentPrivateKey(): string {
  const privateKey = String(process.env.WORKSTATION_AGENT_BACKEND_PRIVATE_KEY_PEM || '').replace(/\\n/g, '\n').trim();
  if (privateKey) return privateKey;
  if (!fallbackPrivateKey) {
    const { privateKey: generatedPrivKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fallbackPrivateKey = generatedPrivKey;
    console.log('🔑 [Workstation Agent] Tự động khởi tạo RSA Private Key fallback trong bộ nhớ cho phiên Workstation Agent.');
  }
  return fallbackPrivateKey;
}

// Batch Operations
router.post('/documents/send', healthCheckController.sendDocuments.bind(healthCheckController));
router.post('/documents/sign', healthCheckController.signDocuments.bind(healthCheckController));
router.post('/agent/session/sign-challenge', (req: any, res, next) => {
  try {
    const payload = String(req.body?.signingPayload || '');
    if (!payload.startsWith('VIMES-AGENT-CHALLENGE\n') || payload.length > 2048) {
      throw Object.assign(new Error('Invalid Agent challenge payload'), { status: 422, code: 'INVALID_AGENT_CHALLENGE' });
    }
    const privateKey = getAgentPrivateKey();
    const signature = crypto.sign('RSA-SHA256', Buffer.from(payload, 'utf8'), privateKey).toString('base64');
    res.json({ success: true, data: { signatureBase64: signature } });
  } catch (error) { next(error); }
});
router.post('/documents/:id/xml-signature/prepare', async (req: any, res, next) => {
  try { res.json({ success: true, data: await healthCheckXmlDsigService.prepare(Number(req.params.id), String(req.userId), String(req.body?.certificateBase64 || ''), Array.isArray(req.body?.certificateChainBase64) ? req.body.certificateChainBase64 : []) }); } catch (error) { next(error); }
});
router.post('/documents/:id/xml-signature/complete', async (req: any, res, next) => {
  try { res.json({ success: true, data: await healthCheckXmlDsigService.complete(Number(req.params.id), String(req.userId), String(req.body?.transactionId || ''), String(req.body?.rawSignatureBase64 || '')) }); } catch (error) { next(error); }
});
// Test/integration endpoint for the new VIMES Signing Server (PDF/PAdES).
router.post('/documents/sign-pdf-vimes', async (req, res, next) => {
  try {
    const { pdfBase64, pageIndex, x1Pt, y1Pt, x2Pt, y2Pt, fieldName, reason, idempotencyKey } = req.body || {};
    const result = await signPdfViaVimesSigningServer(pdfBase64, {
      pageIndex: Number(pageIndex ?? 0), x1Pt: Number(x1Pt), y1Pt: Number(y1Pt),
      x2Pt: Number(x2Pt), y2Pt: Number(y2Pt), fieldName, reason,
      requestId: req.header('x-request-id') || undefined, idempotencyKey,
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});
router.post('/documents/:id/unlock', healthCheckController.unlockDocument.bind(healthCheckController));
router.post('/documents/seed-from-his', healthCheckController.seedFromHis.bind(healthCheckController));
router.post('/documents/mark-printed', healthCheckController.markBarcodePrinted.bind(healthCheckController));
router.get('/his-patient/:identifier', healthCheckController.getHisPatient.bind(healthCheckController));
router.post('/batch-sync-his', healthCheckController.batchSyncHis.bind(healthCheckController));
router.get('/signatures', healthCheckController.getDoctorSignatures.bind(healthCheckController));
router.post('/signatures', healthCheckController.getDoctorSignatures.bind(healthCheckController));
router.post('/signatures/save', healthCheckController.saveDoctorSignature.bind(healthCheckController));

// Contracts Endpoint
router.get('/contracts', contractsController.getContracts.bind(contractsController));
router.post('/contracts', contractsController.createContract.bind(contractsController));
router.put('/contracts/:id', contractsController.updateContract.bind(contractsController));
router.put('/contracts/:id/status', contractsController.updateContractStatus.bind(contractsController));
router.delete('/contracts/:id', contractsController.deleteContract.bind(contractsController));
router.post('/contracts/:id/cleanup-unreceived', contractsController.cleanupUnreceivedEmployees.bind(contractsController));
router.get('/contracts/:id/employees', employeesController.getContractEmployees.bind(employeesController));
router.post('/contracts/:id/employees/import', employeesController.importEmployees.bind(employeesController));
router.post('/contracts/:id/receive-all', receptionController.receiveAllContractEmployees.bind(receptionController));
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
router.get('/services/fee-subitems', servicesController.getFeeSubitems.bind(servicesController));

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

// HIS Paraclinical Order & Sync endpoints
router.post('/orders/create-his-order', orderController.createHisParaclinicOrder.bind(orderController));
router.post('/orders/cancel-his-order', orderController.cancelHisParaclinicItem.bind(orderController));

export default router;
