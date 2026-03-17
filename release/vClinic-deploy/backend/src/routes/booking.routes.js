// ==================== BOOKING ROUTES ====================
// File: backend/src/routes/booking.routes.js

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

// Danh mục
router.get('/locations/provinces', bookingController.getProvinces);
router.get('/locations/wards/:provinceId', bookingController.getWards);
router.get('/departments', bookingController.getDepartments);
router.get('/specialities', bookingController.getSpecialities);
router.get('/rooms/:specialityCode', bookingController.getRoomsBySpeciality);
router.get('/slots', bookingController.getAvailableSlots);

// Booking management
router.post('/register', bookingController.registerBooking);
router.get('/list', bookingController.getBookingList);
router.post('/:id/approve', bookingController.approveBooking);
router.post('/:id/reject', bookingController.rejectBooking);
router.post('/:id/cancel', bookingController.cancelBooking);
router.post('/:id/resend-sms', bookingController.resendSMS);

// Statistics
router.get('/statistics', bookingController.getStatistics);

module.exports = router;
