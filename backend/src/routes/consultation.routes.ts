
import { Router } from 'express';
import { ConsultationController } from '../controllers/consultation.controller';

const router = Router();
const controller = new ConsultationController();

// Hồ sơ bệnh án
router.get('/records/:patientId', controller.getClinicalHistory); // Lấy lịch sử khám
router.get('/record/:id', controller.getRecordDetail);            // Lấy chi tiết 1 phiếu khám
router.post('/records', controller.saveClinicalRecord);           // Lưu phiếu khám (Chẩn đoán)

// Kê đơn thuốc
router.post('/prescriptions', controller.savePrescription);       // Lưu đơn thuốc

export default router;
