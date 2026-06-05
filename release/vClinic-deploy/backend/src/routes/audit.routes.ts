
import { Router } from 'express';
import { AuditController } from '../controllers/audit/audit.controller';

const router = Router();

// GET /api/audit/logs?tableName=hms_patient&recordId=123
router.get('/logs', AuditController.getLogs);

// POST /api/v1/audit/common (Lấy log gộp từ nhiều bảng)
router.post('/common', AuditController.getCommonLogs);

export default router;
