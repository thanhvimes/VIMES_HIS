
import { Router } from 'express';
import { ReceptionController } from '../controllers/reception.controller';

const router = Router();
const controller = new ReceptionController();

// Quản lý bệnh nhân
router.get('/patients', controller.getPatients);       // Tìm kiếm & Lọc DS
router.get('/patients/:id', controller.getPatientById);
router.post('/patients', controller.createPatient);    // Đăng ký mới
router.put('/patients/:id', controller.updatePatient); 

// Quản lý hàng đợi (Queue)
router.get('/queue', controller.getQueueStatus);
router.post('/queue/next', controller.callNextPatient); // Gọi số tiếp theo

export default router;
