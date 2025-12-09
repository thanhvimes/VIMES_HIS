
import { Router } from 'express';
import { InsuranceController } from '../controllers/insurance.controller';

const router = Router();
const controller = new InsuranceController();

// Lấy danh sách giấy tờ (Giấy chuyển viện, ra viện...)
router.get('/documents', controller.getDocuments);

// Giả lập gửi giấy tờ lên cổng
router.post('/documents/send', controller.sendDocuments);

// Giả lập ký số
router.post('/documents/sign', controller.signDocuments);

export default router;
