import { Router } from 'express';
import { QmsController } from '../controllers/qms/qms.controller';

const router = Router();

// Admin
router.post('/admin/verify-password', QmsController.verifyPassword);

// Areas & Counters (Zoning)
router.get('/zoning/areas', QmsController.getZoningAreas);
router.post('/zoning/areas', QmsController.createZoningArea);
router.put('/zoning/areas', QmsController.updateZoningArea);
router.delete('/zoning/areas/:id', QmsController.deleteZoningArea);

router.get('/zoning/counters', QmsController.getZoningCounters);
router.post('/zoning/counters', QmsController.createZoningCounter);
router.put('/zoning/counters', QmsController.updateZoningCounter);
router.delete('/zoning/counters/:id', QmsController.deleteZoningCounter);

router.get('/zoning/all-counters', QmsController.getAllCounters);
router.get('/zoning/assignments', QmsController.getKioskAssignments);
router.post('/zoning/assign-kiosk', QmsController.assignKiosk);
router.post('/zoning/assign-counter', QmsController.assignCounter);

router.get('/areas', QmsController.getAreas);
router.get('/public/areas', QmsController.getPublicAreas);
router.get('/public/areas/:areaCode/rooms', QmsController.getRoomsByArea);
router.get('/public/counters', QmsController.getPublicCounters);

// Departments & Specialties & Rooms
router.get('/departments', QmsController.getDepartments);
router.get('/departments/:deptId/rooms', QmsController.getRoomsByDept);
router.get('/rooms/:areaCode', QmsController.getRoomsByArea);
router.get('/rooms-by-dept/:deptId', QmsController.getRoomsByDept);
router.get('/specialties/:deptid', QmsController.getSpecialties);

// HIS Patient Lookup & Orders
router.get('/his/patient/:identity', QmsController.getPatientFromHIS);
router.get('/his/pending-orders/:searchId', QmsController.getPendingOrders);
router.get('/his/orders/:searchId', QmsController.getPendingOrders); // Fallback
router.get('/his/visits/:searchId', QmsController.getPatientVisits);
router.get('/patient/:searchId/visits', QmsController.getPatientVisits); // Fallback

// Medical Records
router.get('/records/:recordId', QmsController.getMedicalRecord);
router.get('/records/:recordId/vitals', QmsController.getRecordVitals);
router.get('/records/:recordId/lab-results', QmsController.getRecordLabResults);
router.get('/records/:recordId/imaging-results', QmsController.getRecordImagingResults);
router.get('/records/:recordId/prescription', QmsController.getRecordPrescription);
router.get('/records/:recordId/images', QmsController.getRecordImages);

router.get('/his/record/:recordId', QmsController.getMedicalRecord); // Fallback
router.get('/his/record/:recordId/vitals', QmsController.getRecordVitals); // Fallback
router.get('/his/record/:recordId/lab', QmsController.getRecordLabResults); // Fallback
router.get('/his/record/:recordId/imaging', QmsController.getRecordImagingResults); // Fallback
router.get('/his/record/:recordId/prescription', QmsController.getRecordPrescription); // Fallback
router.get('/his/record/:recordId/images', QmsController.getRecordImages); // Fallback

// Services & Catalog
router.get('/services', QmsController.getServices);

// Feedback
router.post('/feedback', QmsController.submitFeedback);

// Ticket Generation (Kiosk)
router.post('/queue', QmsController.createTicket);
router.post('/queue/create-ticket', QmsController.createTicket); // Fallback
router.post('/queue/quick-number', QmsController.quickNumber);

// Queue Management (Consoles)
router.post('/queue/call-next', QmsController.callNext);
router.post('/queue/complete', QmsController.complete);
router.post('/queue/call-again', QmsController.callAgain);
router.post('/queue/call-specific', QmsController.callSpecific);
router.post('/queue/skip', QmsController.skip);
router.post('/queue/transfer', QmsController.transfer);

router.get('/queue/waiting-list/:counterId', QmsController.getWaitingList);
router.get('/queue/waiting-list/area/:areaId', QmsController.getWaitingListByArea);
router.get('/queue/waiting/:counterId', QmsController.getWaitingList); // Fallback
router.get('/queue/waiting-by-area/:areaId', QmsController.getWaitingListByArea); // Fallback

router.get('/queue/stats/:counterId', QmsController.getStats);
router.get('/queue/history/:counterId', QmsController.getHistory);

// Surgery Monitor
router.get('/queue/surgery-waiting-list', QmsController.getSurgeryWaitingList);
router.post('/queue/surgery/status', QmsController.updateSurgeryStatus);
router.post('/queue/update-surgery-status', QmsController.updateSurgeryStatus); // Fallback
router.get('/queue/surgery-rooms', QmsController.getSurgeryRooms);
router.get('/queue/his-surgeries', QmsController.getHisSurgeries);
router.post('/queue/surgery/add-from-his', QmsController.addSurgeryFromHis);
router.post('/queue/add-surgery-from-his', QmsController.addSurgeryFromHis); // Fallback

// Displays
router.get('/display/:areaId', QmsController.getDisplay);
router.get('/central', QmsController.getCentral);
router.get('/counter/:id', QmsController.getCounterInfo);

// SSE Event Stream
router.get('/queue/events', QmsController.sseEvents);

// Payments & Receipts
router.get('/patient/:searchId/bills', QmsController.getPatientBills);
router.get('/payment/:billId/status', QmsController.getPaymentStatus);
router.post('/payment/generate-qr', QmsController.generatePaymentQR);
router.post('/payment/:transactionId/complete', QmsController.completePayment);
router.post('/print-receipt', QmsController.printReceipt);

// Text-to-speech
router.get('/tts', QmsController.tts);

// Admin dashboard detailed stats
router.get('/public/stats/detailed', QmsController.getDetailedStats);
router.get('/public/stats/hourly', QmsController.getHourlyStats);

export default router;
