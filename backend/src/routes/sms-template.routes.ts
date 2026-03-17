// ==========================================
// SMS TEMPLATE ROUTES
// File: backend/src/routes/sms-template.routes.ts
// ==========================================

import express from 'express';
import smsTemplateController from '../controllers/sms-template.controller';

const router = express.Router();

// Get metadata
router.get('/meta/types', smsTemplateController.getTemplateTypes.bind(smsTemplateController));
router.get('/meta/patient-types', smsTemplateController.getPatientTypes.bind(smsTemplateController));

// CRUD operations
router.get('/', smsTemplateController.getAllTemplates.bind(smsTemplateController));
router.get('/:type/:deptCode/:patientType', smsTemplateController.getTemplate.bind(smsTemplateController));
router.post('/', smsTemplateController.createTemplate.bind(smsTemplateController));
router.put('/:id', smsTemplateController.updateTemplate.bind(smsTemplateController));
router.delete('/:id', smsTemplateController.deleteTemplate.bind(smsTemplateController));

export default router;
