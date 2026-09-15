import { Router } from 'express';
import { QmsCatalogController } from '../controllers/qms/qms-catalog.controller';
import { QmsPatientController } from '../controllers/qms/qms-patient.controller';
import { QmsTicketController } from '../controllers/qms/qms-ticket.controller';
import { QmsQueueController } from '../controllers/qms/qms-queue.controller';
import { QmsSurgeryController } from '../controllers/qms/qms-surgery.controller';
import { QmsPaymentController } from '../controllers/qms/qms-payment.controller';
import { QmsUtilityController } from '../controllers/qms/qms-utility.controller';

const router = Router();

// Admin
router.post('/admin/verify-password', QmsUtilityController.verifyPassword);

// Areas & Counters (Zoning)
router.get('/zoning/areas', QmsCatalogController.getZoningAreas);
router.post('/zoning/areas', QmsCatalogController.createZoningArea);
router.put('/zoning/areas', QmsCatalogController.updateZoningArea);
router.delete('/zoning/areas/:id', QmsCatalogController.deleteZoningArea);

router.get('/zoning/counters', QmsCatalogController.getZoningCounters);
router.post('/zoning/counters', QmsCatalogController.createZoningCounter);
router.put('/zoning/counters', QmsCatalogController.updateZoningCounter);
router.delete('/zoning/counters/:id', QmsCatalogController.deleteZoningCounter);

router.get('/zoning/all-counters', QmsCatalogController.getAllCounters);
router.get('/zoning/assignments', QmsCatalogController.getKioskAssignments);
router.post('/zoning/assign-kiosk', QmsCatalogController.assignKiosk);
router.post('/zoning/assign-counter', QmsCatalogController.assignCounter);

router.get('/areas', QmsCatalogController.getAreas);
router.get('/public/areas', QmsCatalogController.getPublicAreas);
router.get('/public/areas/:areaCode/rooms', QmsCatalogController.getRoomsByArea);
router.get('/public/counters', QmsCatalogController.getPublicCounters);

// Departments & Specialties & Rooms
router.get('/departments', QmsCatalogController.getDepartments);
router.get('/departments/:deptId/rooms', QmsCatalogController.getRoomsByDept);
router.get('/rooms/:areaCode', QmsCatalogController.getRoomsByArea);
router.get('/rooms-by-dept/:deptId', QmsCatalogController.getRoomsByDept);
router.get('/specialties/:deptid', QmsCatalogController.getSpecialties);

// HIS Patient Lookup & Orders
router.get('/his/patient/:identity', QmsPatientController.getPatientFromHIS);
router.get('/his/pending-orders/:searchId', QmsPatientController.getPendingOrders);
router.get('/his/orders/:searchId', QmsPatientController.getPendingOrders); // Fallback
router.get('/his/visits/:searchId', QmsPatientController.getPatientVisits);
router.get('/patient/:searchId/visits', QmsPatientController.getPatientVisits); // Fallback

// Medical Records
router.get('/records/:recordId', QmsPatientController.getMedicalRecord);
router.get('/records/:recordId/vitals', QmsPatientController.getRecordVitals);
router.get('/records/:recordId/lab-results', QmsPatientController.getRecordLabResults);
router.get('/records/:recordId/prescription', QmsPatientController.getRecordPrescription);

router.get('/his/record/:recordId', QmsPatientController.getMedicalRecord); // Fallback
router.get('/his/record/:recordId/vitals', QmsPatientController.getRecordVitals); // Fallback
router.get('/his/record/:recordId/lab', QmsPatientController.getRecordLabResults); // Fallback
router.get('/his/record/:recordId/prescription', QmsPatientController.getRecordPrescription); // Fallback

// Services & Catalog
router.get('/services', QmsCatalogController.getServices);

// Feedback
router.post('/feedback', QmsTicketController.submitFeedback);

// Ticket Generation (Kiosk)
router.post('/queue', QmsTicketController.createTicket);
router.post('/queue/create-ticket', QmsTicketController.createTicket); // Fallback
router.post('/queue/quick-number', QmsTicketController.quickNumber);

// Queue Management (Consoles)
router.post('/queue/call-next', QmsQueueController.callNext);
router.post('/queue/complete', QmsQueueController.complete);
router.post('/queue/call-again', QmsQueueController.callAgain);
router.post('/queue/call-specific', QmsQueueController.callSpecific);
router.post('/queue/skip', QmsQueueController.skip);
router.post('/queue/transfer', QmsQueueController.transfer);

router.get('/queue/waiting-list/:counterId', QmsQueueController.getWaitingList);
router.get('/queue/waiting-list/area/:areaId', QmsQueueController.getWaitingListByArea);
router.get('/queue/waiting/:counterId', QmsQueueController.getWaitingList); // Fallback
router.get('/queue/waiting-by-area/:areaId', QmsQueueController.getWaitingListByArea); // Fallback
router.get('/queue/patients-by-status/:counterId', QmsQueueController.getPatientsByStatus);

router.get('/queue/stats/:counterId', QmsQueueController.getStats);
router.get('/queue/history/:counterId', QmsQueueController.getHistory);

// Surgery Monitor
router.get('/queue/surgery-waiting-list', QmsSurgeryController.getSurgeryWaitingList);
router.post('/queue/surgery/status', QmsSurgeryController.updateSurgeryStatus);
router.post('/queue/update-surgery-status', QmsSurgeryController.updateSurgeryStatus); // Fallback
router.get('/queue/surgery-rooms', QmsSurgeryController.getSurgeryRooms);
router.get('/queue/surgery-tables', QmsSurgeryController.getSurgeryTables);
router.get('/queue/his-surgeries', QmsSurgeryController.getHisSurgeries);
router.post('/queue/surgery/add-from-his', QmsSurgeryController.addSurgeryFromHis);
router.post('/queue/add-surgery-from-his', QmsSurgeryController.addSurgeryFromHis); // Fallback

// Displays
router.get('/queue/display/:areaId', QmsQueueController.getDisplay);
router.get('/display/:areaId', QmsQueueController.getDisplay); // Fallback

router.get('/queue/central', QmsQueueController.getCentral);
router.get('/central', QmsQueueController.getCentral); // Fallback

router.get('/queue/counter/:id', QmsQueueController.getCounterInfo);
router.get('/counter/:id', QmsQueueController.getCounterInfo); // Fallback

// SSE Event Stream
router.get('/queue/events', QmsQueueController.sseEvents);

// Payments & Receipts
router.get('/patient/:searchId/bills', QmsPaymentController.getPatientBills);
router.get('/payment/:billId/status', QmsPaymentController.getPaymentStatus);
router.post('/payment/generate-qr', QmsPaymentController.generatePaymentQR);
router.post('/payment/:transactionId/complete', QmsPaymentController.completePayment);
router.post('/print-receipt', QmsPaymentController.printReceipt);

// Text-to-speech
router.get('/tts', QmsUtilityController.tts);

// Admin dashboard detailed stats
router.get('/public/stats/detailed', QmsQueueController.getDetailedStats);
router.get('/public/stats/hourly', QmsQueueController.getHourlyStats);

export default router;
