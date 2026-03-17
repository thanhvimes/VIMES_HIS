// ==================== BOOKING ROUTES ====================
// File: backend/src/routes/booking.routes.ts

import express from 'express';

// Sub-controllers
import catalog from '../controllers/booking/catalog.controller';
import management from '../controllers/booking/management.controller';

const router = express.Router();

// ── CATALOGS ─────────────────────────────────────
router.get('/locations/provinces', catalog.getProvinces.bind(catalog));
router.get('/locations/wards/:provinceId', catalog.getWards.bind(catalog));
router.get('/departments', catalog.getDepartments.bind(catalog));
router.get('/specialities', catalog.getSpecialities.bind(catalog));
router.get('/rooms/:specialityCode', catalog.getRoomsBySpeciality.bind(catalog));
router.get('/slots', catalog.getAvailableSlots.bind(catalog));

// ── BOOKING MANAGEMENT ──────────────────────────
router.post('/register', management.registerBooking.bind(management));
router.get('/list', management.getBookingList.bind(management));
router.post('/:id/approve', management.approveBooking.bind(management));
router.post('/:id/reject', management.rejectBooking.bind(management));
router.post('/:id/cancel', management.cancelBooking.bind(management));
// router.post('/:id/resend-sms', (management as any).resendSMS?.bind(management)); // Support optional re-send

// ── STATISTICS ───────────────────────────────────
router.get('/statistics', management.getStatistics.bind(management));

export default router;
