// ==================== BOOKING ROUTES ====================
// File: backend/src/routes/booking.routes.ts

import express from 'express';
import authMiddleware from '../middleware/authMiddleware';

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
router.get('/list', authMiddleware, management.getBookingList.bind(management));
router.post('/:id/approve', authMiddleware, management.approveBooking.bind(management));
router.post('/:id/reject', authMiddleware, management.rejectBooking.bind(management));
router.post('/:id/cancel', authMiddleware, management.cancelBooking.bind(management));
router.post('/:id/resend-sms', authMiddleware, management.resendSMS.bind(management));
router.get('/:id/sms-history', authMiddleware, management.getSMSHistory.bind(management));

// ── STATISTICS ───────────────────────────────────
router.get('/statistics', authMiddleware, management.getStatistics.bind(management));

// ── GHOST BOOKINGS ────────────────────────────────
router.get('/ghost-bookings', authMiddleware, management.getGhostBookings.bind(management));
router.post('/cancel-ghost-bookings', authMiddleware, management.cancelGhostBookings.bind(management));

export default router;
