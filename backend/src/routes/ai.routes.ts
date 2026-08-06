import { Router } from 'express';
import { explainMedicalRecord, generateFeedbackResponse, generateHospitalVideo, getClinicalSuggestions } from '../controllers/ai.controller';
import { requirePermission } from '../middleware/authMiddleware';

const router = Router();
router.post('/clinical-suggestions', requirePermission('02.05'), getClinicalSuggestions);
router.post('/explain-medical-record', explainMedicalRecord);
router.post('/feedback-response', generateFeedbackResponse);
router.post('/hospital-video', generateHospitalVideo);
export default router;
