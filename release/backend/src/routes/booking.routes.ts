
import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router = Router();
const controller = new BookingController();

// ==================== DANH MỤC ĐỊA GIỚI ====================
router.get('/locations/provinces', (req, res) => controller.getProvinces(req, res));
router.get('/locations/wards/:provinceId', (req, res) => controller.getWards(req, res));

// ==================== CẤU HÌNH & SLOTS ====================
router.get('/specialities', (req, res) => controller.getSpecialities(req, res));
router.get('/slots', (req, res) => controller.getAvailableSlots(req, res));

// ==================== NGHIỆP VỤ BOOKING ====================
router.get('/list', (req, res) => controller.getBookingList(req, res));
router.post('/register', (req, res) => controller.registerBooking(req, res));

// ==================== DUYỆT & QUẢN LÝ ====================
router.post('/:id/approve', (req, res) => controller.approveBooking(req, res));
router.post('/:id/reject', (req, res) => controller.rejectBooking(req, res));
router.post('/:id/cancel', (req, res) => controller.cancelBooking(req, res));
router.put('/:id/reschedule', (req, res) => controller.rescheduleBooking(req, res));

// ==================== THỐNG KÊ & NOTIFICATION ====================
router.get('/statistics', (req, res) => controller.getBookingStatistics(req, res));
router.post('/:id/resend-sms', (req, res) => controller.resendSMS(req, res));

export default router;
