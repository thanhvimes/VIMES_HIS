
import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router = Router();
const controller = new BookingController();

// Danh mục địa giới
router.get('/locations/provinces', (req, res) => controller.getProvinces(req, res));
router.get('/locations/districts/:provinceId', (req, res) => controller.getDistricts(req, res));
router.get('/locations/wards/:districtId', (req, res) => controller.getWards(req, res));

// Cấu hình & Slots
router.get('/specialities', (req, res) => controller.getSpecialities(req, res));
router.get('/slots', (req, res) => controller.getAvailableSlots(req, res));

// Nghiệp vụ
router.get('/list', (req, res) => controller.getBookingList(req, res));
router.post('/register', (req, res) => controller.registerBooking(req, res));
router.put('/:id/status', (req, res) => controller.updateStatus(req, res));

export default router;
